import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

// ── Habits ──────────────────────────────────────────────
export const HABITS = [
  { id: 'gym', label: 'Gym', icon: '💪', color: '#FF6B35' },
  { id: 'coding', label: 'Coding', icon: '💻', color: '#00D9FF' },
  { id: 'business', label: 'Business', icon: '📈', color: '#FFD700' },
  { id: 'learning', label: 'Learning', icon: '📚', color: '#A8FF78' },
  { id: 'bca', label: 'BCA', icon: '🎓', color: '#FF78C4' },
];

export async function logHabit({ habit_id, duration_min = null, note = '' }) {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('habit_logs')
    .upsert({ habit_id, date: today, duration_min, note, logged_at: new Date().toISOString() }, { onConflict: 'habit_id,date' })
    .select();
  if (error) throw error;
  return data;
}

export async function getTodayLogs() {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('habit_logs')
    .select('*')
    .eq('date', today);
  if (error) throw error;
  return data || [];
}

export async function getRecentLogs(days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const { data, error } = await supabase
    .from('habit_logs')
    .select('*')
    .gte('date', since.toISOString().split('T')[0])
    .order('date', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getStreaks() {
  const logs = await getRecentLogs(90);
  const streaks = {};
  HABITS.forEach(h => {
    const dates = [...new Set(logs.filter(l => l.habit_id === h.id).map(l => l.date))].sort().reverse();
    let streak = 0;
    let cursor = new Date();
    cursor.setHours(0, 0, 0, 0);
    for (const d of dates) {
      const logDate = new Date(d + 'T00:00:00');
      const diff = Math.round((cursor - logDate) / 86400000);
      if (diff <= 1) { streak++; cursor = logDate; }
      else break;
    }
    streaks[h.id] = streak;
  });
  return streaks;
}

export async function saveAIBriefing(content) {
  const today = new Date().toISOString().split('T')[0];
  const { error } = await supabase
    .from('ai_briefings')
    .upsert({ date: today, content, created_at: new Date().toISOString() }, { onConflict: 'date' });
  if (error) throw error;
}

export async function getTodayBriefing() {
  const today = new Date().toISOString().split('T')[0];
  const { data } = await supabase
    .from('ai_briefings')
    .select('*')
    .eq('date', today)
    .single();
  return data;
}

export async function getChatHistory(limit = 20) {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []).reverse();
}

export async function saveMessage(role, content) {
  const { error } = await supabase
    .from('chat_messages')
    .insert({ role, content, created_at: new Date().toISOString() });
  if (error) throw error;
}
