// Layer 3: Vercel Serverless Function - Fetch Videos List

const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: "Method Not Allowed. Use GET." });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        return res.status(500).json({ error: "Supabase credentials required." });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
        // Fetch videos ordered by latest created
        const { data: videos, error } = await supabase
            .from('videos')
            .select('title, url, published_at, created_at')
            .order('created_at', { ascending: false })
            .limit(50); // Limit for performance in UI skeleton

        if (error) throw error;

        return res.status(200).json({
            status: "success",
            data: videos
        });
    } catch (error) {
        console.error("Videos Fetch Error:", error);
        return res.status(500).json({ status: "error", error: error.message });
    }
}
