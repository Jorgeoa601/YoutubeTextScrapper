const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    if (req.method === 'GET') {
        try {
            const { data, error } = await supabase.from('rpm_profiles').select('*').order('last_updated', { ascending: false }).limit(1).single();
            if (error && error.code !== 'PGRST116') throw error;
            return res.status(200).json({ status: "success", data: data || null });
        } catch (error) {
            return res.status(500).json({ status: "error", error: error.message });
        }
    }

    if (req.method === 'POST') {
        const { result, purpose, aiModel, aiTemp } = req.body;
        if (!result || !purpose) return res.status(400).json({ error: "Result and Purpose required." });

        const openrouterKey = process.env.OPENROUTER_API_KEY;

        try {
            const prompt = [
                {
                    role: "system",
                    content: "Eres un estratega de negocios y experto en el método RPM (Result, Purpose, Massive Action Plan) de Tony Robbins. Tu tarea es evaluar el Resultado deseado (R) y el Propósito que lo impulsa (P).\n\nREGLA ESTRICTA: Si el Resultado es vago (ej. 'ganar dinero', 'ser exitoso') o el Propósito es débil, DEBES rechazarlo estableciendo 'is_valid': false y proporcionar 'validation_feedback' empujando al usuario a ser más específico (ej. 'Tu resultado es muy vago. ¿Cuánto dinero exacto? ¿En cuánto tiempo?').\n\nSi es válido, genera el Massive Action Plan (MAP) accionable y un resumen profundo.\n\nFormato JSON ESTRICTO:\n{\n  \"is_valid\": true,\n  \"validation_feedback\": \"\",\n  \"map_title\": \"Título inspirador del plan\",\n  \"massive_actions\": [\"Acción masiva 1\", \"Acción masiva 2\", \"Acción masiva 3\", \"Acción masiva 4\"],\n  \"interpretation\": {\n    \"categories_of_interest\": [\"Categoría 1\", \"Categoría 2\"],\n    \"constraints\": [\"Limitación 1\", \"Limitación 2\"],\n    \"ambition_level\": \"Alto/Medio/Realista\",\n    \"preferred_business_type\": \"Tipo de negocio preferido\"\n  }\n}"
                },
                {
                    role: "user",
                    content: `Resultado Deseado (R): ${result}\nPropósito (P): ${purpose}\nGenera el MAP.`
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
            const responseText = aiData.choices[0].message.content;
            
            const cleanedText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            let mapJson;
            try {
                mapJson = JSON.parse(cleanedText);
            } catch (parseErr) {
                console.error("RAW AI OUTPUT RPM:", cleanedText);
                throw new Error("El modelo generó un plan RPM incompleto. A veces ocurre con mucha creatividad. Ve a Ajustes, baja la temperatura a 0.2 e intenta de nuevo.");
            }

            if (mapJson.is_valid === false) {
                return res.status(400).json({ status: "validation_error", error: mapJson.validation_feedback });
            }

            const { data: inserted, error: insertErr } = await supabase
                .from('rpm_profiles')
                .insert([{
                    results_json: { target: result },
                    purpose_json: { logic: purpose },
                    map_json: mapJson
                }])
                .select()
                .single();

            if (insertErr) throw insertErr;

            return res.status(200).json({ status: "success", data: inserted });
        } catch (error) {
            return res.status(500).json({ status: "error", error: error.message });
        }
    }

    if (req.method === 'DELETE') {
        try {
            const { error } = await supabase.from('rpm_profiles').delete().not('id', 'is', null);
            if (error) throw error;
            return res.status(200).json({ status: "success", message: "Profile deleted." });
        } catch (error) {
            return res.status(500).json({ status: "error", error: error.message });
        }
    }

    return res.status(405).json({ error: "Method Not Allowed." });
}
