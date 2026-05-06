// Layer 3: Vercel Serverless Function - Dynamic Scraper Orchestrator

const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: "Method Not Allowed. Use POST." });
    }

    const { channel_id, trigger_type = 'manual' } = req.body;
    if (!channel_id) {
        return res.status(400).json({ error: "channel_id required in request body." });
    }

    const apifyToken = process.env.APIFY_TOKEN;
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let currentChannelId = channel_id;

    try {
        // Fetch Channel Config
        const { data: channel, error: chError } = await supabase
            .from('channels')
            .select('*')
            .eq('id', channel_id)
            .single();
            
        if (chError || !channel) throw new Error("Channel not found in database.");

        const maxVideos = channel.max_videos_per_run || 30;
        const channelUrl = channel.url || `https://www.youtube.com/${channel.youtube_handle}`;

        // Step 1: Channel Discovery (Zero-Cost HTML Parsing)
        const ytRes = await fetch(`${channelUrl}/videos`);
        const ytHtml = await ytRes.text();
        const videoIds = [...new Set([...ytHtml.matchAll(/"videoId":"([^"]+)"/g)].map(m => m[1]))];
        const discoveredUrls = videoIds.map(id => `https://www.youtube.com/watch?v=${id}`);

        if (discoveredUrls.length === 0) {
            throw new Error("Zero videos found HTML parsing error. YouTube DOM might have changed.");
        }

        // Step 2: Cross-Reference
        const { data: existingVideos, error: dbError } = await supabase
            .from('videos')
            .select('url')
            .eq('channel_id', channel.id);
            
        if (dbError) throw dbError;
        
        const existingUrlSet = new Set(existingVideos.map(v => v.url));
        const newUrlsToScrape = discoveredUrls.filter(url => !existingUrlSet.has(url));
        const updatedCount = discoveredUrls.length - newUrlsToScrape.length; // Simply a stat placeholder
        
        // Step 3: Hard Cap for Vercel/Apify Limits
        // Vercel Hobby max execution is 60s. Apify free tier rejects concurrent requests.
        // We must process sequentially and cap at 10 to avoid 504 Timeouts.
        const SAFE_CAP = Math.min(maxVideos, 10);
        const batchToProcess = newUrlsToScrape.slice(0, SAFE_CAP);

        if (batchToProcess.length === 0) {
             await supabase.from('scraper_logs').insert([{ 
                 channel_id: channel.id, trigger_type, status: 'success', 
                 videos_found: discoveredUrls.length, videos_new: 0, videos_updated: updatedCount
             }]);
             return res.status(200).json({ status: "success", message: "No new videos to scrape." });
        }

        // Step 4: Sequential Transcript Extraction via Apify REST (Avoids Concurrency Rejection)
        const extractedData = [];
        for (const videoUrl of batchToProcess) {
            try {
                // Fetch Transcript
                const apiRes = await fetch(`https://api.apify.com/v2/acts/pintostudio~youtube-transcript-scraper/run-sync-get-dataset-items?token=${apifyToken}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ videoUrl: videoUrl, language: "en" })
                });
                
                if (!apiRes.ok) {
                    console.log(`Apify skipped ${videoUrl} (Rate Limit or Error)`);
                    continue;
                }
                
                const items = await apiRes.json();
                if (!items || items.length === 0 || !items[0].data || items[0].data.length === 0) continue;
                
                const formattedTranscript = items[0].data.map(entry => `[${entry.start}] ${entry.text.replace(/\r?\n|\r/g, ' ')}`).join('\n');
                
                // Fetch Real Title via YouTube oEmbed API
                let realTitle = `${channel.name} Video (${videoUrl.split('v=')[1]})`;
                try {
                    const oembedRes = await fetch(`https://www.youtube.com/oembed?url=${videoUrl}&format=json`);
                    if (oembedRes.ok) {
                        const oembedData = await oembedRes.json();
                        if (oembedData.title) realTitle = oembedData.title;
                    }
                } catch (oe) {}

                extractedData.push({
                    channel_id: channel.id,
                    youtube_id: videoUrl.split('v=')[1],
                    title: realTitle,
                    url: videoUrl,
                    transcript_text: formattedTranscript
                });
            } catch (e) { 
                console.error(`Error processing ${videoUrl}:`, e);
            }
        }

        // Step 5: Database Insertion
        let insertedCount = 0;
        if (extractedData.length > 0) {
            const { error: insertError } = await supabase.from('videos').insert(extractedData);
            if (insertError) console.error("Supabase Insertion Error:", insertError.message);
            else insertedCount = extractedData.length;
        }

        // Logging
        await supabase.from('scraper_logs').insert([{ 
            channel_id: channel.id, trigger_type, status: 'success', 
            videos_found: discoveredUrls.length, videos_new: insertedCount, videos_updated: updatedCount 
        }]);
        
        return res.status(200).json({ status: "success", data: { processed_count: insertedCount, urls: extractedData.map(d => d.url) } });
    } catch (error) {
        console.error("Scraper Exception:", error);
        try {
            await supabase.from('scraper_logs').insert([{ 
                channel_id: currentChannelId, trigger_type, status: 'error', errors: error.message 
            }]);
        } catch(e) {}
        
        return res.status(500).json({ status: "error", error: error.message });
    }
}
