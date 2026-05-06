const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    if (req.method === 'GET') {
        try {
            // Get active RPM
            const { data: rpmProfile } = await supabase.from('rpm_profiles').select('id').order('last_updated', { ascending: false }).limit(1).single();
            if (!rpmProfile) return res.status(200).json({ status: "success", solution: null, conversations: [] });

            // Get chosen solution
            const { data: solution, error: solErr } = await supabase.from('solutions').select('*').eq('rpm_profile_id', rpmProfile.id).eq('is_chosen_for_mvt', true).single();
            if (solErr || !solution) return res.status(200).json({ status: "success", solution: null, conversations: [] });

            // Get conversations
            const { data: conversations, error: convErr } = await supabase.from('mvt_conversations').select('*').eq('solution_id', solution.id).order('created_at', { ascending: false });

            return res.status(200).json({ status: "success", solution, conversations: conversations || [] });
        } catch (error) {
            return res.status(500).json({ status: "error", error: error.message });
        }
    }

    if (req.method === 'POST') {
        const { solution_id, interviewee_name, interview_date, insights } = req.body;
        if (!solution_id || !interviewee_name || !interview_date || !insights) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        try {
            const { data, error } = await supabase.from('mvt_conversations').insert([{
                solution_id, interviewee_name, interview_date, insights
            }]).select();

            if (error) throw error;
            return res.status(200).json({ status: "success", data });
        } catch (error) {
            return res.status(500).json({ status: "error", error: error.message });
        }
    }

    return res.status(405).json({ error: "Method Not Allowed." });
}
