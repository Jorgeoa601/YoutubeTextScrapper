const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
    if (req.method !== 'DELETE') return res.status(405).json({ error: "Method Not Allowed." });

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const { action } = req.body;

    try {
        if (action === 'reset_rpm') {
            const { error } = await supabase.from('rpm_profiles').delete().not('id', 'is', null);
            if (error) throw error;
            return res.status(200).json({ status: "success" });
        }
        if (action === 'clear_ai') {
            const { error } = await supabase.from('ai_video_analysis').delete().not('id', 'is', null);
            if (error) throw error;
            return res.status(200).json({ status: "success" });
        }
        if (action === 'factory_reset') {
            await supabase.from('mvt_conversations').delete().not('id', 'is', null);
            await supabase.from('solution_videos').delete().not('id', 'is', null);
            await supabase.from('solutions').delete().not('id', 'is', null);
            await supabase.from('rpm_profiles').delete().not('id', 'is', null);
            await supabase.from('ai_video_analysis').delete().not('id', 'is', null);
            await supabase.from('scraper_logs').delete().not('id', 'is', null);
            await supabase.from('videos').delete().not('id', 'is', null);
            return res.status(200).json({ status: "success" });
        }
        return res.status(400).json({ error: "Invalid action" });
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
}
