// Layer 3: Vercel Serverless Function - Dashboard Stats

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
        const { count: totalVideos, error: countError } = await supabase
            .from('videos')
            .select('*', { count: 'exact', head: true });

        if (countError) throw countError;

        const { data: lastLogArray, error: logError } = await supabase
            .from('scraper_logs')
            .select('run_datetime, status')
            .order('run_datetime', { ascending: false })
            .limit(1);

        if (logError) throw logError;

        const lastLog = lastLogArray && lastLogArray.length > 0 ? lastLogArray[0] : null;

        return res.status(200).json({
            status: "success",
            data: {
                total_videos: totalVideos || 0,
                last_scrape: lastLog ? lastLog.run_datetime : null,
                last_status: lastLog ? lastLog.status : null
            }
        });
    } catch (error) {
        console.error("Stats Fetch Error:", error);
        return res.status(500).json({ status: "error", error: error.message });
    }
}
