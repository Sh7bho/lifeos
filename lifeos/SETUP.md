# LIFE OS — SETUP GUIDE
## From zero to homescreen in ~15 minutes

---

## STEP 1 — Get your FREE Groq API Key (2 min)

1. Go to https://console.groq.com
2. Sign up (no credit card needed)
3. Click "API Keys" → "Create API Key"
4. Copy the key → save it somewhere safe

---

## STEP 2 — Create your Supabase database (5 min)

1. Go to https://supabase.com → sign up free
2. Click "New Project" → give it a name → set a password → create
3. Wait ~1 min for it to load
4. Go to **Settings → API**
   - Copy your **Project URL** (looks like https://xxxx.supabase.co)
   - Copy your **anon/public key**

5. Go to **SQL Editor** → click "New Query" → paste this SQL and run it:

```sql
-- Habit logs table
CREATE TABLE habit_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  habit_id text NOT NULL,
  date date NOT NULL,
  duration_min integer,
  note text DEFAULT '',
  logged_at timestamptz DEFAULT now(),
  UNIQUE(habit_id, date)
);

-- AI daily briefings
CREATE TABLE ai_briefings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  date date NOT NULL UNIQUE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Chat messages with ARIA
CREATE TABLE chat_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable public access (for your personal use only app)
ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_briefings ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all" ON habit_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON ai_briefings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON chat_messages FOR ALL USING (true) WITH CHECK (true);
```

---

## STEP 3 — Deploy to Vercel (5 min)

### Option A: GitHub (recommended)

1. Create a GitHub account if you don't have one
2. Go to https://github.com/new → create a new repo called "lifeos"
3. Upload all these files to the repo
4. Go to https://vercel.com → sign in with GitHub
5. Click "Add New Project" → import your lifeos repo
6. Before deploying, click **"Environment Variables"** and add:
   - `REACT_APP_GROQ_API_KEY` = your Groq key
   - `REACT_APP_SUPABASE_URL` = your Supabase URL
   - `REACT_APP_SUPABASE_ANON_KEY` = your Supabase anon key
7. Click **Deploy** → wait ~2 min
8. You'll get a URL like https://lifeos-xyz.vercel.app

### Option B: Vercel CLI (faster if you have Node.js)

```bash
npm install -g vercel
cd lifeos
npm install
vercel
# follow the prompts
# add env vars when asked
```

---

## STEP 4 — Add to your homescreen

### Android (Chrome):
1. Open your Vercel URL in Chrome
2. Tap the 3-dot menu → "Add to Home screen"
3. Tap "Add" → done ✓

### iPhone (Safari):
1. Open your Vercel URL in **Safari** (must be Safari)
2. Tap the Share button (box with arrow)
3. Scroll down → "Add to Home Screen"
4. Tap "Add" → done ✓

---

## WHAT YOU GET

- **HQ** — Daily dashboard with AI briefing generated every morning
- **LOG** — One-tap habit logging with duration + notes
- **STATS** — 30-day heatmap, streaks, consistency breakdown
- **ARIA** — AI coach that knows your actual data

## HABITS TRACKED BY DEFAULT

- 💪 Gym
- 💻 Coding  
- 📈 Business
- 📚 Learning
- 🎓 BCA

To customize habits, edit `src/lib/supabase.js` → the `HABITS` array at the top.

---

## TROUBLESHOOTING

**App shows setup screen:** Your env vars aren't set. Double-check in Vercel → Settings → Environment Variables → redeploy.

**ARIA says it's offline:** Your Groq API key is wrong or expired. Get a new one from console.groq.com.

**Data not saving:** Run the SQL from Step 2 again. Check Supabase → Table Editor to confirm tables exist.

**PWA not installing on iPhone:** Must use Safari, not Chrome, on iOS.

---

Built with React + Groq (Llama 3.3 70B) + Supabase + Vercel. All free tier.
