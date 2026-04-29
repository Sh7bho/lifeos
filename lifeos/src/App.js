import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import HabitLog from './components/HabitLog';
import Stats from './components/Stats';
import AICoach from './components/AICoach';
import Setup from './components/Setup';
import NavBar from './components/NavBar';
import './App.css';

function App() {
  const [view, setView] = useState('dashboard');
  const [isSetup, setIsSetup] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
    const groqKey = process.env.REACT_APP_GROQ_API_KEY;
    if (!supabaseUrl || !groqKey || supabaseUrl === 'YOUR_SUPABASE_URL') {
      setIsSetup(true);
    }
  }, []);

  const refresh = () => setRefreshKey(k => k + 1);

  if (isSetup) return <Setup />;

  return (
    <div className="app">
      <div className="noise-overlay" />
      <div className="app-content">
        {view === 'dashboard' && <Dashboard key={refreshKey} onNavigate={setView} />}
        {view === 'log' && <HabitLog onDone={() => { refresh(); setView('dashboard'); }} />}
        {view === 'stats' && <Stats />}
        {view === 'coach' && <AICoach />}
      </div>
      <NavBar active={view} onNavigate={setView} />
    </div>
  );
}

export default App;
