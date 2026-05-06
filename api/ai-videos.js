const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).json({ error: "Method Not Allowed." });

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    try {
        const { data, error } = await supabase
            .from('videos')
            .select(`
                id, title, url, created_at,
                ai_video_analysis ( id, pain_point_category, analysis_json )
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return res.status(200).json({ status: "success", data });
    } catch (error) {
        return res.status(500).json({ status: "error", error: error.message });
    }
}
