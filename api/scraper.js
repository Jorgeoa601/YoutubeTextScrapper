// Layer 3: Vercel Serverless Function - Two-Step Incremental Scraper

const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: "Method Not Allowed. Use POST." });
    }

    const apifyToken = process.env.APIFY_TOKEN;
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!apifyToken || !supabaseUrl || !supabaseKey) {
        return res.status(500).json({ error: "APIFY_TOKEN, SUPABASE_URL, and SUPABASE_SERVICE_ROLE_KEY required." });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
        // Step 1: Channel Discovery (Zero-Cost HTML Regex approach)
        // Fetching the public videos page of Starter Story
        const ytRes = await fetch("https://www.youtube.com/@starterstory/videos");
        const ytHtml = await ytRes.text();
        
        // Extract unique video IDs from the YouTube JS blob
        const videoIds = [...new Set([...ytHtml.matchAll(/"videoId":"([^"]+)"/g)].map(m => m[1]))];
        const discoveredUrls = videoIds.map(id => `https://www.youtube.com/watch?v=${id}`);

        if (discoveredUrls.length === 0) {
            throw new Error("Could not discover videos. YouTube DOM might have changed.");
        }

        // Step 2: Cross-Reference & Delta Calculation
        // Compare with existing Supabase `videos` table
        const { data: existingVideos, error: dbError } = await supabase.from('videos').select('url');
        if (dbError) throw dbError;
        
        const existingUrlSet = new Set(existingVideos.map(v => v.url));
        const newUrlsToScrape = discoveredUrls.filter(url => !existingUrlSet.has(url));

        // Step 3: Quota Enforcement (Max 30)
        const batchToProcess = newUrlsToScrape.slice(0, 30);

        if (batchToProcess.length === 0) {
             await supabase.from('scraper_logs').insert([{ status: 'Success', videos_found: discoveredUrls.length, videos_new: 0 }]);
             return res.status(200).json({ status: "success", message: "No new videos to scrape." });
        }

        // Step 4: Transcript Extraction via Apify REST (Using `batchToProcess`)
        // Execute concurrently to fit inside Vercel's timeout and maximize throughput
        const extractionPromises = batchToProcess.map(async (videoUrl) => {
            try {
                const apiRes = await fetch(`https://api.apify.com/v2/acts/pintostudio~youtube-transcript-scraper/run-sync-get-dataset-items?token=${apifyToken}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ videoUrl: videoUrl, language: "en" })
                });
                
                if (!apiRes.ok) return null;
                const items = await apiRes.json();
                if (!items || items.length === 0 || !items[0].data || items[0].data.length === 0) return null;
                
                // Format transcript array into single text block
                const formattedTranscript = items[0].data.map(entry => `[${entry.start}] ${entry.text.replace(/\r?\n|\r/g, ' ')}`).join('\n');
                
                return {
                    youtube_id: videoUrl.split('v=')[1],
                    title: `Starter Story Video (${videoUrl.split('v=')[1]})`, // Raw placeholder title
                    url: videoUrl,
                    transcript_text: formattedTranscript
                };
            } catch (e) {
                return null; // Soft fail individual video
            }
        });

        const extractedData = (await Promise.all(extractionPromises)).filter(Boolean);

        // Step 5: Batch Database Insertion (Soft Fail protected)
        let insertedCount = 0;
        if (extractedData.length > 0) {
            // Ensure the channel exists in Supabase so we can satisfy the Foreign Key constraint
            const { data: channelData } = await supabase
                .from('channels')
                .upsert({ youtube_handle: '@starterstory', name: 'Starter Story' }, { onConflict: 'youtube_handle' })
                .select('id')
                .single();

            if (channelData) {
                extractedData.forEach(d => d.channel_id = channelData.id);
            }

            const { error: insertError } = await supabase.from('videos').insert(extractedData);
            if (insertError) {
                console.error("Supabase Insertion Error:", insertError.message);
            } else {
                insertedCount = extractedData.length;
            }
        }

        // Logging
        await supabase.from('scraper_logs').insert([{ 
            status: 'Success', 
            videos_found: discoveredUrls.length, 
            videos_new: insertedCount 
        }]);
        
        return res.status(200).json({
            status: "success",
            data: {
                processed_count: insertedCount,
                urls: extractedData.map(d => d.url)
            }
        });
    } catch (error) {
        console.error("Scraper Architecture Exception:", error);
        
        // DB Soft Fail log
        try {
             await supabase.from('scraper_logs').insert([{ status: 'Error', errors: error.message }]);
        } catch (e) {}

        return res.status(500).json({ status: "error", error: error.message });
    }
}
