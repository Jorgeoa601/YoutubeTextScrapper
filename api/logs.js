const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: "Method Not Allowed." });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
        const { data: logs, error } = await supabase
            .from('scraper_logs')
            .select(`
                id, run_datetime, status, videos_found, videos_new, videos_updated, trigger_type,
                channels(youtube_handle)
            `)
            .order('run_datetime', { ascending: false })
            .limit(50);

        if (error) throw error;
        
        const formattedData = logs.map(log => ({
            ...log,
            handle: log.channels ? log.channels.youtube_handle : 'Desconocido'
        }));
        
        return res.status(200).json({ status: "success", data: formattedData });
    } catch (error) {
        return res.status(500).json({ status: "error", error: error.message });
    }
}
