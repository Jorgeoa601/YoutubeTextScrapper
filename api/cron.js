const { createClient } = require('@supabase/supabase-js');
const parser = require('cron-parser');

module.exports = async function handler(req, res) {
    if (req.method !== 'GET' && req.method !== 'POST') {
        return res.status(405).json({ error: "Method Not Allowed." });
    }

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    try {
        const { data: channels, error } = await supabase
            .from('channels')
            .select('id, cron_expression')
            .eq('is_enabled', true);

        if (error) throw error;

        const now = new Date();
        const dueChannels = [];

        for (const channel of channels) {
            if (!channel.cron_expression) continue;
            try {
                const interval = parser.parseExpression(channel.cron_expression);
                // Get the previous date it should have run
                const prev = interval.prev();
                // If it was due within the last hour, run it (Vercel cron runs hourly)
                if (now.getTime() - prev.getTime() <= 60 * 60 * 1000) {
                    dueChannels.push(channel.id);
                }
            } catch (err) {
                console.error(`Invalid cron expression for channel ${channel.id}:`, err);
            }
        }
        
        const host = req.headers.host;
        const protocol = host.includes('localhost') ? 'http' : 'https';
        
        for (const channelId of dueChannels) {
            fetch(`${protocol}://${host}/api/scraper`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ channel_id: channelId, trigger_type: 'scheduled' })
            }).catch(console.error);
        }

        return res.status(200).json({ 
            status: "success", 
            message: `Cron triggered for ${dueChannels.length} channels.`, 
            due_channels: dueChannels 
        });
    } catch (error) {
        return res.status(500).json({ status: "error", error: error.message });
    }
}
