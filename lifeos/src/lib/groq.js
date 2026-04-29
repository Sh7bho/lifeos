const GROQ_API_KEY = process.env.REACT_APP_GROQ_API_KEY;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

export async function callGroq(messages, systemPrompt) {
  const response = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      max_tokens: 1024,
      temperature: 0.85,
    }),
  });
  if (!response.ok) throw new Error(`Groq error: ${response.statusText}`);
  const data = await response.json();
  return data.choices[0].message.content;
}

export function buildSystemPrompt(streaks, todayLogs, recentLogs, habits) {
  const streakText = habits.map(h => `${h.label}: ${streaks[h.id] || 0} day streak`).join(', ');
  const todayText = todayLogs.length
    ? todayLogs.map(l => `${l.habit_id}${l.duration_min ? ` (${l.duration_min}min)` : ''}${l.note ? `: ${l.note}` : ''}`).join(', ')
    : 'nothing logged yet today';
  const weekLogs = recentLogs.slice(0, 35);
  const consistency = habits.map(h => {
    const count = weekLogs.filter(l => l.habit_id === h.id).length;
    return `${h.label}: ${count}/7 days this week`;
  }).join(', ');

  return `You are ARIA — an elite AI life coach and personal strategist for a 1st year BCA student hustling hard. You're direct, sharp, real — not corporate, not soft.

USER STATS RIGHT NOW:
- Streaks: ${streakText}
- Today logged: ${todayText}
- This week: ${consistency}

YOUR PERSONALITY:
- Talk like a smart friend who pushes you hard
- Call out inconsistency directly but constructively
- Celebrate wins briefly, never over-hype
- Give specific, actionable advice — never vague
- Short sentences. High energy. Zero fluff.
- You know this person: BCA student, gym, business thinking, coding, self-improvement grind

Keep responses under 200 words unless asked for something longer. Be the coach they need, not the one that coddles them.`;
}

export async function generateDailyBriefing(streaks, todayLogs, recentLogs, habits) {
  const systemPrompt = buildSystemPrompt(streaks, todayLogs, recentLogs, habits);
  const hour = new Date().getHours();
  const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';

  const msg = `Generate my ${timeOfDay} briefing. Give me:
1. A quick read on my current momentum (1-2 lines, honest)
2. Top 3 priorities for today based on my stats
3. One sharp insight or challenge for me

Format it clean. No bullet points, use → for priorities. Make it feel like a war room briefing, not a diary entry.`;

  return callGroq([{ role: 'user', content: msg }], systemPrompt);
}
