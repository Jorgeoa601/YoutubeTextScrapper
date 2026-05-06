const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    if (req.method === 'GET') {
        try {
            const { data: rpmProfile, error: rpmErr } = await supabase.from('rpm_profiles').select('id').order('last_updated', { ascending: false }).limit(1).single();
            if (rpmErr || !rpmProfile) return res.status(200).json({ status: "success", data: [] });

            const { data: solutions, error } = await supabase.from('solutions')
                .select('*')
                .eq('rpm_profile_id', rpmProfile.id)
                .order('fit_score', { ascending: false });
            
            if (error) throw error;
            return res.status(200).json({ status: "success", data: solutions });
        } catch (error) {
            return res.status(500).json({ status: "error", error: error.message });
        }
    }

    if (req.method === 'POST') {
        const { aiModel, aiTemp } = req.body || {};
        try {
            const { data: rpmProfile, error: rpmErr } = await supabase.from('rpm_profiles').select('*').order('last_updated', { ascending: false }).limit(1).single();
            if (rpmErr || !rpmProfile) return res.status(400).json({ error: "No active RPM profile found. Create one first." });

            // Delete old solutions for this profile to replace them
            await supabase.from('solutions').delete().eq('rpm_profile_id', rpmProfile.id);

            // Fetch video analyses (Limit to 15 to avoid massive context length)
            const { data: videos, error: vidErr } = await supabase.from('ai_video_analysis').select('video_id, pain_point_category, analysis_json').limit(15);
            if (vidErr) throw vidErr;

            const openrouterKey = process.env.OPENROUTER_API_KEY;

            const prompt = [
                {
                    role: "system",
                    content: "Eres un arquitecto de negocios experto en adaptar casos de éxito globales (Starter Story) al mercado LATAM, alineándolos algorítmicamente con el Perfil Estratégico (RPM) del usuario.\n\nRecibirás como contexto:\n1. El Perfil RPM del usuario (Resultado deseado, Propósito, Categorías de interés, Restricciones).\n2. Un catálogo de Pain Points extraídos de videos analizados de emprendedores.\n\nTu misión es cruzar estos datos y generar ESTRICTAMENTE un mínimo de 4 soluciones de negocio altamente viables.\n\nREGLAS DE GENERACIÓN:\n- Cada solución debe derivar de un 'Pain Point' real de los videos proporcionados.\n- Debe estar tropicalizada para funcionar en Latinoamérica (costos, logística, cultura).\n- El Fit Score (0-100) evalúa qué tanto respeta las restricciones de tiempo/dinero del RPM del usuario.\n\nFORMATO DE RESPUESTA OBLIGATORIO (JSON ESTRICTO):\n{\n  \"solutions\": [\n    {\n      \"title\": \"Nombre comercial del modelo propuesto\",\n      \"description\": \"Explicación táctica de cómo opera el negocio\",\n      \"target_pain_point\": \"El problema exacto que se resuelve\",\n      \"latam_adaptation\": \"Cómo superar las barreras del mercado latino\",\n      \"rpm_alignment\": \"Por qué esta idea encaja con el Propósito del usuario\",\n      \"difficulty_level\": \"Baja/Media/Alta\",\n      \"fit_score\": 95,\n      \"referenced_video_ids\": [\"id_de_supabase_del_video\"]\n    }\n  ]\n}"
                },
                {
                    role: "user",
                    content: `PERFIL RPM DEL USUARIO:\n${JSON.stringify(rpmProfile.map_json)}\n\nPAIN POINTS ANALIZADOS (Videos):\n${JSON.stringify(videos)}\n\nGenera las soluciones en JSON.`
                }
            ];

            const modelToUse = aiModel || "google/gemini-2.5-flash";
            const tempToUse = aiTemp !== undefined ? parseFloat(aiTemp) : 0.7;

            const aiRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${openrouterKey}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: modelToUse,
                    temperature: tempToUse,
                    response_format: { type: "json_object" },
                    max_tokens: 3000,
                    messages: prompt
                })
            });

            if (!aiRes.ok) throw new Error(`OpenRouter API Error: ${await aiRes.text()}`);

            const aiData = await aiRes.json();
            const cleanedText = aiData.choices[0].message.content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            const generatedJson = JSON.parse(cleanedText);

            if (!generatedJson.solutions || generatedJson.solutions.length === 0) {
                throw new Error("No se generaron soluciones válidas.");
            }

            const inserts = generatedJson.solutions.map(sol => ({
                rpm_profile_id: rpmProfile.id,
                title: sol.title,
                description: sol.description,
                target_pain_point: sol.target_pain_point,
                latam_adaptation: sol.latam_adaptation,
                rpm_alignment: sol.rpm_alignment,
                difficulty_level: sol.difficulty_level,
                fit_score: sol.fit_score
            }));

            const { data: insertedSolutions, error: insertErr } = await supabase.from('solutions').insert(inserts).select();
            if (insertErr) throw insertErr;

            // Attempt to link videos pivot safely
            for (let i = 0; i < insertedSolutions.length; i++) {
                let sol = generatedJson.solutions[i];
                if (sol.referenced_video_ids && Array.isArray(sol.referenced_video_ids)) {
                    for(let vid of sol.referenced_video_ids) {
                        try {
                           await supabase.from('solution_videos').insert({ solution_id: insertedSolutions[i].id, video_id: vid });
                        } catch(e) { } // Ignore if UUID is invalid
                    }
                }
            }

            return res.status(200).json({ status: "success", data: insertedSolutions });

        } catch (error) {
            return res.status(500).json({ status: "error", error: error.message });
        }
    }

    if (req.method === 'PUT') {
        const { solution_id, justification } = req.body;
        if (!solution_id || !justification) return res.status(400).json({ error: "Missing parameters" });

        try {
            const { data: solution } = await supabase.from('solutions').select('rpm_profile_id').eq('id', solution_id).single();
            if (solution) {
                await supabase.from('solutions').update({ is_chosen_for_mvt: false }).eq('rpm_profile_id', solution.rpm_profile_id);
            }

            const { error } = await supabase.from('solutions').update({ is_chosen_for_mvt: true, justification }).eq('id', solution_id);
            if (error) throw error;
            
            return res.status(200).json({ status: "success" });
        } catch (error) {
            return res.status(500).json({ status: "error", error: error.message });
        }
    }

    return res.status(405).json({ error: "Method Not Allowed." });
}
