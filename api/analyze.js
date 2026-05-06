const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: "Method Not Allowed." });

    const { video_id } = req.body;
    if (!video_id) return res.status(400).json({ error: "video_id required." });

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const openrouterKey = process.env.OPENROUTER_API_KEY;

    try {
        const { data: video, error: dbErr } = await supabase
            .from('videos')
            .select('transcript_text')
            .eq('id', video_id)
            .single();

        if (dbErr || !video || !video.transcript_text) {
            throw new Error("Transcript not found for this video.");
        }

        const prompt = [
            {
                role: "system",
                content: "Eres un analista experto en negocios y mercado latinoamericano. Tu objetivo es leer la transcripción de una entrevista en inglés de un emprendedor exitoso, identificar los problemas principales ('Pain Points') que motivaron la creación de su negocio, y adaptarlos al contexto de América Latina. Debes responder ESTRICTAMENTE con un JSON usando esta estructura:\n{\n  \"pain_point_category\": \"Categoría general (ej. B2B, Ecommerce, Software)\",\n  \"core_problem\": \"El problema central identificado\",\n  \"latam_context\": \"Cómo este problema se manifiesta específicamente en el mercado latinoamericano\",\n  \"target_audience\": \"A quién le afecta este problema\"\n}"
            },
            {
                role: "user",
                content: `Aquí está la transcripción del video:\n\n${video.transcript_text}`
            }
        ];

        const aiRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${openrouterKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "google/gemini-2.5-flash",
                response_format: { type: "json_object" },
                max_tokens: 1500,
                messages: prompt
            })
        });

        if (!aiRes.ok) {
            const errBody = await aiRes.text();
            throw new Error(`OpenRouter API Error: ${errBody}`);
        }

        const aiData = await aiRes.json();
        const responseText = aiData.choices[0].message.content;
        
        const cleanedText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const resultJson = JSON.parse(cleanedText);

        const { data: existing } = await supabase
            .from('ai_video_analysis')
            .select('id')
            .eq('video_id', video_id)
            .single();

        let dbOperation;
        if (existing) {
            dbOperation = supabase
                .from('ai_video_analysis')
                .update({
                    pain_point_category: resultJson.pain_point_category,
                    analysis_json: resultJson
                })
                .eq('id', existing.id);
        } else {
            dbOperation = supabase
                .from('ai_video_analysis')
                .insert([{
                    video_id: video_id,
                    pain_point_category: resultJson.pain_point_category,
                    analysis_json: resultJson
                }]);
        }

        const { data: inserted, error: insertErr } = await dbOperation.select().single();

        if (insertErr) throw insertErr;

        return res.status(200).json({ status: "success", data: inserted });
    } catch (error) {
        console.error("Analysis Error:", error);
        return res.status(500).json({ status: "error", error: error.message });
    }
}
