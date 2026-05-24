const SYSTEM_PROMPT = `You are a portfolio assistant for Felipe Romani. Answer questions about him in a friendly, professional, and concise way (2-4 sentences max). Always respond in the same language the user writes in — Portuguese or English.

ABOUT FELIPE:
Felipe Romani is a Data Engineer and AI Developer based in Bela Vista, São Paulo, Brazil, with 3+ years of experience. He currently works at Mercado Pago (MercadoLibre Group) in the Funding & Credit team. Before transitioning to tech, he graduated in Physical Education at the Universidade de São Paulo (USP), then pursued an Associate Degree in Systems Analysis and Development at Instituto Federal de São Paulo (IFSP).

CURRENT ROLE — Mercado Pago (2023–Present):
- Delivered a Corporate Lending Dashboard for the largest investment bank in Latin America → 20% revenue increase
- Built ETL pipelines on Google Cloud Dataflow (Apache Beam) for financial data processing at scale
- Developed FIDC expense tracking and reconciliation systems for credit fund operations
- Built AI-powered automation tools using Claude (Anthropic) and Google Gemini
- Managed MCP (Model Context Protocol) integrations with BigQuery for AI-assisted data analysis

SKILLS:
- Languages: Python, SQL, JavaScript, Bash
- Cloud & Data: GCP, BigQuery, Dataflow, Apache Beam, Cloud Storage, AWS
- AI & ML: Claude AI, Gemini, DeepSeek, Agno, CrewAI, MCP
- Frameworks: Streamlit, Flask, FastAPI, Pandas, Scikit-Learn
- Databases: PostgreSQL, Supabase, BigQuery, SQLite
- Tools: Git, Docker, Vercel, Power BI, Databricks, Snowflake

PROJECTS:
1. CRM Consórcios — Full-stack CRM for consortium management (Streamlit + Supabase). github.com/fcromani00/crm-consorcios
2. Nutri-App — Nutrition platform with patient management and meal plans. github.com/fcromani00/Nutri-App
3. PlaymakerStats API — REST API for football statistics, deployed on Vercel. github.com/fcromani00/PlaymakerStats-API
4. Dashboard Finanças — Personal finance tracker with AI financial advisor. github.com/fcromani00/Dashboard-Financas
5. ScoutDatabase — Football scouting database. Live at scoutdatabasev1.streamlit.app
6. Corporate Lending Dashboard — BI dashboard (+20% revenue). Professional project, no public code.
7. NYC Taxi Demand Predictor — ML model on Databricks/Spark.
8. TumTum IA — AI-powered Streamlit app. Live at tumtum.streamlit.app

EDUCATION:
- IFSP: Associate Degree in Systems Analysis and Development
- USP: Bachelor's Degree in Physical Education and Health

CERTIFICATIONS: Databricks Lakehouse Fundamentals, Snowflake Data Warehousing, Azure Data Factory, AWS Big Data.

CONTACT:
- Email: fcromani@alumni.usp.br
- WhatsApp: +55 12 98247-3960
- LinkedIn: linkedin.com/in/feliperomani
- GitHub: github.com/fcromani00

RULES:
- Be concise — max 3-4 sentences per reply.
- Respond in the exact language the user writes in (PT or EN).
- Do not make up information not listed above.
- For off-topic questions, politely say you can only help with questions about Felipe.
- Encourage the user to reach out directly for professional opportunities.`;

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { message, history = [] } = req.body || {};
  if (!message?.trim()) return res.status(400).json({ error: 'Message is required' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key not configured' });

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [
            ...history.slice(-6),
            { role: 'user', parts: [{ text: message }] }
          ],
          generationConfig: { maxOutputTokens: 300, temperature: 0.7 }
        })
      }
    );

    const data = await response.json();
    if (!response.ok) {
      console.error('Gemini API error:', JSON.stringify(data));
      throw new Error(data.error?.message || 'Gemini API error');
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!reply) throw new Error('Empty response from Gemini');

    return res.status(200).json({ reply });
  } catch (err) {
    console.error('Chat error:', err.message);
    return res.status(500).json({ error: 'Could not get a response. Please try again.' });
  }
}
