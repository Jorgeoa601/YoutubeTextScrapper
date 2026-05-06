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
        const { count: totalVideos } = await supabase.from('videos').select('*', { count: 'exact', head: true });
        
        const { count: totalAnalyzed } = await supabase.from('ai_video_analysis').select('*', { count: 'exact', head: true });

        const { count: totalSolutions } = await supabase.from('solutions').select('*', { count: 'exact', head: true });

        const { count: totalMvt } = await supabase.from('mvt_conversations').select('*', { count: 'exact', head: true });

        const { data: chosenSolution } = await supabase.from('solutions').select('title, fit_score').eq('is_chosen_for_mvt', true).single();

        const { data: lastLogArray } = await supabase.from('scraper_logs').select('run_datetime, status').order('run_datetime', { ascending: false }).limit(1);

        const lastLog = lastLogArray && lastLogArray.length > 0 ? lastLogArray[0] : null;

        return res.status(200).json({
            status: "success",
            data: {
                total_videos: totalVideos || 0,
                total_analyzed: totalAnalyzed || 0,
                total_solutions: totalSolutions || 0,
                total_mvt: totalMvt || 0,
                active_solution: chosenSolution || null,
                last_scrape: lastLog ? lastLog.run_datetime : null,
                last_status: lastLog ? lastLog.status : null
            }
        });
    } catch (error) {
        console.error("Stats Fetch Error:", error);
        return res.status(500).json({ status: "error", error: error.message });
    }
}
