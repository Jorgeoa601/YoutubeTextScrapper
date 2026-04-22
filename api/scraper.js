// Layer 3: Vercel Serverless Function - Apify Main Logic
const { ApifyClient } = require('apify-client');

module.exports = async function handler(req, res) {
    // FORCE Vercel to bundle the ESM proxy-agent dependency via dynamic import
    await import('proxy-agent');

    // 1. Method Validation
    if (req.method !== 'POST') {
        return res.status(405).json({ error: "Method Not Allowed. Use POST." });
    }

    // 2. Token Security Check
    const apifyToken = process.env.APIFY_TOKEN;
    if (!apifyToken || apifyToken === 'put_your_token_here') {
        return res.status(500).json({ error: "APIFY_TOKEN missing or invalid in environment." });
    }

    // 3. Payload Parsing (Vercel parses req.body automatically if content-type is json)
    const { videoUrl } = req.body;
    if (!videoUrl) {
        return res.status(400).json({ error: "videoUrl is strictly required." });
    }

    try {
        const client = new ApifyClient({ token: apifyToken });
        const runInput = {
            videoUrl: videoUrl,
            language: "en"
        };
        
        // 4. Execute Apify Synchronously
        const run = await client.actor("pintostudio/youtube-transcript-scraper").call(runInput);
        const { items } = await client.dataset(run.defaultDatasetId).listItems();
        
        // 5. Defensive Apify Schema validation
        if (!items || items.length === 0 || !items[0].data || items[0].data.length === 0) {
            return res.status(404).json({ status: "error", error: "No transcript found. The video may not have closed captions enabled." });
        }

        // 6. Formatting explicitly to [{start}] {text} joined by \n
        const formattedTranscript = items[0].data.map(entry => {
            const cleanText = entry.text.replace(/\r?\n|\r/g, ' ');
            return `[${entry.start}] ${cleanText}`;
        }).join('\n');
        
        // 7. Successful Delivery payload
        return res.status(200).json({
            status: "success",
            data: {
                video_url: videoUrl,
                transcript: formattedTranscript 
            }
        });
    } catch (error) {
        // Self-Healing
        return res.status(500).json({ status: "error", error: "Apify API failure: " + error.message });
    }
}
