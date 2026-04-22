// Layer 3: Vercel Serverless Function - Native REST Apify Integration

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: "Method Not Allowed. Use POST." });
    }

    const apifyToken = process.env.APIFY_TOKEN;
    if (!apifyToken || apifyToken === 'put_your_token_here') {
        return res.status(500).json({ error: "APIFY_TOKEN missing or invalid in environment." });
    }

    const { videoUrl } = req.body;
    if (!videoUrl) {
        return res.status(400).json({ error: "videoUrl is strictly required." });
    }

    try {
        // Native Fetch bypasses Vercel NCC bundling bugs entirely
        const response = await fetch(`https://api.apify.com/v2/acts/pintostudio~youtube-transcript-scraper/run-sync-get-dataset-items?token=${apifyToken}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ videoUrl: videoUrl, language: "en" })
        });

        // Handle Apify level errors explicitly
        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Apify REST response error: ${response.status} - ${errText}`);
        }

        const items = await response.json();

        // Defensive Apify Schema validation
        if (!items || items.length === 0 || !items[0].data || items[0].data.length === 0) {
            return res.status(404).json({ status: "error", error: "No transcript found. The video may not have closed captions enabled." });
        }

        // Formatting explicitly to [{start}] {text} joined by \n
        const formattedTranscript = items[0].data.map(entry => {
            const cleanText = entry.text.replace(/\r?\n|\r/g, ' ');
            return `[${entry.start}] ${cleanText}`;
        }).join('\n');
        
        // Successful Delivery payload
        return res.status(200).json({
            status: "success",
            data: {
                video_url: videoUrl,
                transcript: formattedTranscript 
            }
        });
    } catch (error) {
        // Self-Healing execution
        return res.status(500).json({ status: "error", error: "Apify Execution failure: " + error.message });
    }
}
