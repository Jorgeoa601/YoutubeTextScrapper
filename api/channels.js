const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (req.method === 'GET') {
        try {
            // Fetch channels with video count
            const { data: channels, error } = await supabase
                .from('channels')
                .select(`
                    id, youtube_handle, name, url, is_enabled, cron_expression, max_videos_per_run,
                    videos(count)
                `)
                .order('youtube_handle');
                
            if (error) throw error;
            
            // Format count
            const formattedData = channels.map(c => ({
                ...c,
                videos_count: c.videos[0]?.count || 0
            }));
            
            return res.status(200).json({ status: "success", data: formattedData });
        } catch (error) {
            return res.status(500).json({ status: "error", error: error.message });
        }
    } 
    
    if (req.method === 'POST') {
        try {
            const { youtube_handle, name, url } = req.body;
            const { data, error } = await supabase
                .from('channels')
                .insert([{ youtube_handle, name, url, is_enabled: true, cron_expression: '0 * * * *', max_videos_per_run: 30 }])
                .select()
                .single();
            if (error) throw error;
            return res.status(200).json({ status: "success", data });
        } catch (error) {
            return res.status(500).json({ status: "error", error: error.message });
        }
    }

    if (req.method === 'PUT') {
        try {
            const { id, is_enabled, cron_expression, max_videos_per_run } = req.body;
            const { data, error } = await supabase
                .from('channels')
                .update({ is_enabled, cron_expression, max_videos_per_run })
                .eq('id', id)
                .select()
                .single();
            if (error) throw error;
            return res.status(200).json({ status: "success", data });
        } catch (error) {
            return res.status(500).json({ status: "error", error: error.message });
        }
    }

    return res.status(405).json({ error: "Method Not Allowed." });
}
