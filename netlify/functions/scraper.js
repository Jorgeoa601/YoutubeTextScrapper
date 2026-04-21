// Layer 3: Serverless Function - Apify Main Logic
const { ApifyClient } = require('apify-client');

// Netlify Function Handler Signature
exports.handler = async function(event, context) {
    // Only allow POST
    if (event.httpMethod !== 'POST') {
        return { 
            statusCode: 405, 
            body: JSON.stringify({ error: "Method Not Allowed. Use POST." }) 
        };
    }

    const apifyToken = process.env.APIFY_TOKEN;
    if (!apifyToken || apifyToken === 'put_your_token_here') {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "APIFY_TOKEN missing or invalid in environment/system." })
        };
    }

    let payload;
    try {
        payload = JSON.parse(event.body);
    } catch (e) {
        return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON body provided." }) };
    }

    const { videoUrl } = payload;
    if (!videoUrl) {
        return { statusCode: 400, body: JSON.stringify({ error: "videoUrl is strictly required." }) };
    }

    try {
        const client = new ApifyClient({ token: apifyToken });
        const runInput = {
            videoUrl: videoUrl,
            language: "en"
        };
        
        // Execute Apify Synchronously
        const run = await client.actor("pintostudio/youtube-transcript-scraper").call(runInput);
        const { items } = await client.dataset(run.defaultDatasetId).listItems();
        
        // Defensive mapping - Apify schema validation
        if (!items || items.length === 0 || !items[0].data || items[0].data.length === 0) {
            return {
                statusCode: 404,
                body: JSON.stringify({ status: "error", error: "No transcript found. The video may not have closed captions enabled." })
            };
        }

        // Parse response[0].data and format strictly as [{start}] {text} connected by \n
        const formattedTranscript = items[0].data.map(entry => {
            // Trim newlines from text just in case apify provided messy spaces
            const cleanText = entry.text.replace(/\r?\n|\r/g, ' ');
            return `[${entry.start}] ${cleanText}`;
        }).join('\n');
        
        return {
            statusCode: 200,
            body: JSON.stringify({
                status: "success",
                data: {
                    video_url: videoUrl,
                    transcript: formattedTranscript 
                }
            })
        };
    } catch (error) {
        // Self-Healing: Bubble up deterministic error states to the UI
        return {
            statusCode: 500,
            body: JSON.stringify({ status: "error", error: "Apify API failure: " + error.message })
        };
    }
}
