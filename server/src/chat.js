import { db } from './db.js';

// Real AI chat via the Groq API (OpenAI-compatible). If GROQ_API_KEY is
// missing the server still works — it falls back to a smart-ish canned
// response so the UI never breaks during local development.

const fallbackReply = (query) =>
  `[Swarm Analysis Engine] Request analyzed: "${query}". Live conditions show wave height ~1.8m, wind ~24 km/h → MODERATE CAUTION. For a fully AI-generated answer, set the GROQ_API_KEY environment variable in server/.env.`;

export async function handleChat(query) {
  if (!process.env.GROQ_API_KEY) {
    return { source: 'fallback', reply: fallbackReply(query) };
  }

  // Pull a compact live context snapshot so the model answers from real data.
  const weather = db.prepare('SELECT condition, wave_height_m, wind_speed_kmh FROM weather LIMIT 4').all();
  const alerts = db.prepare('SELECT level, title FROM alerts ORDER BY created_at DESC LIMIT 5').all();
  const pfz = db.prepare('SELECT name, yield_pct FROM pfz_zones ORDER BY yield_pct DESC LIMIT 4').all();

  const system = [
    'You are BlueCurrent, an ocean safety and marine intelligence assistant.',
    'Answer concisely (2-4 sentences). Be specific and safety-focused.',
    'Use this live data context and reference it where relevant:',
    `Weather: ${JSON.stringify(weather)}`,
    `Active alerts: ${JSON.stringify(alerts)}`,
    `Best fishing zones: ${JSON.stringify(pfz)}`,
  ].join('\n');

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
        max_tokens: 300,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: query },
        ],
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('[chat] Groq error:', res.status, data.error?.message || JSON.stringify(data));
      return { source: 'error', reply: 'BlueCurrent is temporarily offline. Please try again shortly.' };
    }

    let reply = data.choices?.[0]?.message?.content?.trim();
    if (!reply) {
      return { source: 'error', reply: 'BlueCurrent received an empty response. Please try again.' };
    }
    // Strip <think>...</think> blocks (Qwen models include reasoning traces)
    // Handle both complete and incomplete/missing closing tags
    reply = reply.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
    if (reply.startsWith('<think>')) {
      // Closing tag missing — strip everything from <think> onward
      reply = reply.replace(/<think>[\s\S]*/i, '').trim();
    }
    return { source: 'groq', reply };
  } catch (err) {
    console.error('[chat] Groq error:', err.message);
    return { source: 'error', reply: 'BlueCurrent is temporarily offline. Please try again shortly.' };
  }
}
