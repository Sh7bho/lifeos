import React, { useState } from 'react';
import './LearnOS.css';

// ── Roadmap Data ────────────────────────────────────────────────────────────

const PHASES = [
  {
    id: 1,
    title: "Foundation — weeks 1-2",
    desc: "Understand automation logic before touching tools",
    type: "auto",
    tasks: [
      { id:"p1t1", title:"Make.com free account setup", desc:"Sign up, explore the interface. No tutorials — just click around for 30 minutes.", tags:["auto","tool"] },
      { id:"p1t2", title:"Build: form → Google Sheets → email", desc:"Typeform or Google Form submission triggers a row + sends confirmation email. Your first real workflow.", tags:["auto"] },
      { id:"p1t3", title:"Build: email attachment → Google Drive → Telegram notify", desc:"When you receive an email with attachment, save it and ping yourself on Telegram.", tags:["auto"] },
      { id:"p1t4", title:"Understand JSON — read don't memorize", desc:"What it is, how to extract values from it. Every automation tool speaks JSON. 2 hours max.", tags:["auto","both"] },
      { id:"p1t5", title:"Understand webhooks", desc:"What they are, how to receive data from external services. Build one that receives a POST request.", tags:["auto","both"] },
      { id:"p1t6", title:"Understand API calls + authentication", desc:"API keys, OAuth, Bearer tokens. Hit one free API (OpenWeatherMap) and display the result.", tags:["auto","both"] },
      { id:"p1t7", title:"TryHackMe — create account, start Pre-Security path", desc:"45 mins tonight. Just start. No pressure on speed.", tags:["cyber"] },
      { id:"p1t8", title:"TryHackMe — complete Networking Fundamentals", desc:"How the internet actually works. Critical for both automation debugging and cybersec.", tags:["cyber"] },
      { id:"p1t9", title:"Python — start 30 min/day habit now", desc:"You're already learning — keep the streak alive daily. Build through real use cases, not just courses.", tags:["auto","both"] },
    ]
  },
  {
    id: 2,
    title: "n8n mastery — weeks 3-4",
    desc: "Move to self-hosted n8n, rebuild everything, add code",
    type: "auto",
    tasks: [
      { id:"p2t1", title:"Rebuild all Make.com workflows in n8n", desc:"Same 3 workflows. You'll finish in a day. The point is feeling the difference.", tags:["auto"] },
      { id:"p2t2", title:"Master the JavaScript code node", desc:"Write custom JS inside a workflow. Filter data, transform strings, calculate values. This is your superpower vs no-coders.", tags:["auto","tool"] },
      { id:"p2t3", title:"Connect Ollama to n8n", desc:"Your local LLM talking to your automation tool. Message in → AI processes → action taken.", tags:["auto","tool"] },
      { id:"p2t4", title:"Build: Telegram bot with memory", desc:"Extend your existing bot so it remembers conversation context across messages. Use a simple array stored in n8n.", tags:["auto"] },
      { id:"p2t5", title:"Build: document summarizer", desc:"Drop a PDF or text file, AI summarizes it, sends summary via email. Real business use case.", tags:["auto"] },
      { id:"p2t6", title:"Learn error handling in n8n", desc:"What happens when a workflow breaks silently? Set up error branches and Telegram alerts when something fails.", tags:["auto"] },
      { id:"p2t7", title:"TryHackMe — Linux Fundamentals (all 3 parts)", desc:"Command line is everything in cybersec. Non-negotiable foundation.", tags:["cyber"] },
      { id:"p2t8", title:"TryHackMe — How The Web Works", desc:"HTTP, DNS, requests, responses. Understand this and you understand 70% of web vulnerabilities.", tags:["cyber"] },
      { id:"p2t9", title:"Python — write scripts that automate your own tasks", desc:"Use what you're learning. Script something you do manually. Real use cases beat fake exercises.", tags:["auto","both"] },
    ]
  },
  {
    id: 3,
    title: "First client — month 2",
    desc: "Stop building demos. Make real money.",
    type: "auto",
    tasks: [
      { id:"p3t1", title:"Build one complete business system as portfolio piece", desc:"Pick a coaching institute. Build: inquiry → AI qualifies → books call → reminder → follow up. Document every node. Record a 60 second demo. This must be DONE before you start outreach.", tags:["auto","money"] },
      { id:"p3t2", title:"Post first LinkedIn proof of work", desc:"Screenshot of your workflow + 3 lines about what it does and what problem it solves. No performance, just real work.", tags:["auto","money"] },
      { id:"p3t3", title:"Write your one-line pitch", desc:"'I save small businesses 10 hours/week by automating their follow-ups and data entry. 15 minute demo?' That's it.", tags:["auto","money"] },
      { id:"p3t4", title:"Send 20 cold outreach messages", desc:"Only after your portfolio piece is fully built and demo is recorded. Direct DMs to clinics, CA firms, coaching institutes, real estate agents on LinkedIn or Instagram.", tags:["auto","money"] },
      { id:"p3t5", title:"Close first client — target ₹8,000-15,000", desc:"One project. Build it. Deliver it. Get paid. Everything changes after this.", tags:["auto","money"] },
      { id:"p3t6", title:"TryHackMe — complete Intro to Cybersecurity path", desc:"Gets you across the surface of offensive and defensive security. Foundation for everything next.", tags:["cyber"] },
      { id:"p3t7", title:"Set up a home lab", desc:"Kali Linux in VirtualBox or on your machine. Your practice environment for the next 2 years.", tags:["cyber","tool"] },
    ]
  },
  {
    id: 4,
    title: "Add AI layer — month 3",
    desc: "Automation + local AI = your actual differentiator",
    type: "auto",
    tasks: [
      { id:"p4t1", title:"Build: AI that summarizes customer feedback", desc:"Feed it a Google Sheet of responses, it outputs patterns and sentiment. Real business value.", tags:["auto"] },
      { id:"p4t2", title:"Build: lead qualifier bot", desc:"Someone messages → bot asks 3 questions → scores the lead → notifies owner with summary. WhatsApp or Telegram.", tags:["auto","money"] },
      { id:"p4t3", title:"Build: AI draft + human approve workflow", desc:"Customer email comes in → AI drafts reply → sends to owner for approval → owner clicks approve → sends. One click follow-up.", tags:["auto"] },
      { id:"p4t4", title:"Upgrade pitch: privacy angle", desc:"'Your data never leaves your server. I run everything locally.' For clinics, lawyers, CA firms — this is worth paying more for.", tags:["auto","money"] },
      { id:"p4t5", title:"Raise rates to ₹20,000-35,000 per project", desc:"You now offer AI + automation + private infrastructure. That's not the same service as week 1.", tags:["auto","money"] },
      { id:"p4t6", title:"TryHackMe — Jr Penetration Tester path (start)", desc:"This is where it gets real. Actual hacking techniques. Recon, scanning, exploitation basics.", tags:["cyber"] },
      { id:"p4t7", title:"Learn Nmap, Burp Suite basics", desc:"The two tools every pentester uses daily. Understand what they show you.", tags:["cyber","tool"] },
      { id:"p4t8", title:"Python — build something that helps your automation clients", desc:"A simple script, a data cleaner, a report generator. Python + automation is a powerful combo.", tags:["auto","both"] },
    ]
  },
  {
    id: 5,
    title: "Productize — month 4",
    desc: "Stop custom building. Sell the same solution repeatedly.",
    type: "auto",
    tasks: [
      { id:"p5t1", title:"Collect structured feedback from every client so far", desc:"What did they love? What did they ask for that you didn't build? What problem do they still have? This is your product research.", tags:["auto","money"] },
      { id:"p5t2", title:"Pick one industry from your clients so far", desc:"Whichever clicked most naturally based on feedback. Clinics, coaching, real estate, CA firms. One only.", tags:["auto","money"] },
      { id:"p5t3", title:"Build a packaged solution for that industry", desc:"Same automation stack, same price, same delivery timeline. You're not freelancing anymore. You're selling a product.", tags:["auto","money"] },
      { id:"p5t4", title:"Get 5 clients in this one niche", desc:"₹25,000 each. That's ₹1.25 lakh in one month from one repeatable offer.", tags:["auto","money"] },
      { id:"p5t5", title:"Post weekly on LinkedIn — document the niche", desc:"'Here's what I automated for a Kolkata clinic this week.' Becomes inbound eventually.", tags:["auto","money"] },
      { id:"p5t6", title:"TryHackMe — complete Jr Pentester path", desc:"Finish it. This puts you ahead of 80% of people calling themselves cybersec enthusiasts.", tags:["cyber"] },
      { id:"p5t7", title:"Start OWASP Top 10 — understand web vulnerabilities", desc:"The 10 most common ways web apps get hacked. Directly relevant to your automation work too.", tags:["cyber"] },
    ]
  },
  {
    id: 6,
    title: "First SaaS product — month 5",
    desc: "Recurring revenue that works while you sleep",
    type: "both",
    tasks: [
      { id:"p6t1", title:"Identify the one thing your niche clients always need", desc:"What do you rebuild every time? What do they ask for repeatedly? Use the client feedback you've been collecting. That's your product.", tags:["auto","money"] },
      { id:"p6t2", title:"Build v1 — ugly, simple, working", desc:"Not TradeIQ scale. A simple tool. ₹999-₹2,999/month. Your existing clients are your first users.", tags:["auto","money"] },
      { id:"p6t3", title:"Get 10 paying subscribers", desc:"₹1,500 average × 10 = ₹15,000/month recurring. That's the psychological unlock.", tags:["auto","money"] },
      { id:"p6t4", title:"Study for CompTIA Security+ (start)", desc:"₹25,000 exam. Your automation income pays for it. Globally recognized. Opens international doors.", tags:["cyber"] },
      { id:"p6t5", title:"Build a vulnerable machine lab (DVWA, HackTheBox)", desc:"Practice attacking intentionally broken systems. Safe, legal, essential.", tags:["cyber","tool"] },
    ]
  },
  {
    id: 7,
    title: "Scale and certify — month 6",
    desc: "Real business + real backup. Both running.",
    type: "both",
    tasks: [
      { id:"p7t1", title:"Document every process you've built", desc:"How you find clients, onboard, deliver, maintain. You're building something that doesn't need you to manually do everything.", tags:["auto","money"] },
      { id:"p7t2", title:"Target international clients", desc:"US, UK, Australia. Same skills, dollar pricing, rupee expenses. Your server in Kolkata is your cost advantage.", tags:["auto","money"] },
      { id:"p7t3", title:"SaaS product at 20+ subscribers", desc:"₹30,000+/month recurring. This is your foundation to build anything from.", tags:["auto","money"] },
      { id:"p7t4", title:"Pass CompTIA Security+", desc:"You're 19 with a running business and a global security certification. That combination doesn't exist often.", tags:["cyber"] },
      { id:"p7t5", title:"Start OSCP prep (TryHackMe OSCP path)", desc:"The certification that makes companies nervous in a good way. 12-18 months out but start the prep now.", tags:["cyber"] },
      { id:"p7t6", title:"Write about your cybersec learning publicly", desc:"Blog posts, LinkedIn, Twitter. 6 months of documented learning is a portfolio. Opportunities find you.", tags:["cyber","money"] },
      { id:"p7t7", title:"Evaluate: business or job? You choose.", desc:"By now you have client income, a product, a certification, and real skills. The decision is yours. Not forced.", tags:["both","money"] },
    ]
  }
];

// ── Placeholder sections for future expansion ──────────────────────────────

const SECTIONS = [
  { id: 'roadmap', label: 'ROADMAP', icon: '◈', desc: 'Automation + Cybersec' },
  { id: 'papers', label: 'RESEARCH', icon: '⬡', desc: 'Papers & deep dives' },
  { id: 'languages', label: 'LANGUAGES', icon: '◎', desc: 'Coming soon' },
  { id: 'courses', label: 'COURSES', icon: '◆', desc: 'Coming soon' },
];

// ── Roadmap Component ──────────────────────────────────────────────────────

function Roadmap() {
  const storageKey = 'lifeos_roadmap_done';
  const [done, setDone] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem(storageKey) || '[]')); }
    catch { return new Set(); }
  });
  const [filter, setFilter] = useState('all');
  const [openPhases, setOpenPhases] = useState(new Set([1]));

  function toggleTask(id) {
    setDone(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      localStorage.setItem(storageKey, JSON.stringify([...next]));
      return next;
    });
  }

  function togglePhase(id) {
    setOpenPhases(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const allTasks = PHASES.flatMap(p => p.tasks);
  const totalCount = allTasks.length;
  const doneCount = allTasks.filter(t => done.has(t.id)).length;
  const pct = totalCount ? Math.round((doneCount / totalCount) * 100) : 0;

  const typeColor = { auto: '#1D9E75', cyber: '#534AB7', both: '#BA7517' };
  const typeLabel = { auto: 'automation', cyber: 'cybersec', both: 'both' };
  const tagClass = { auto: 'lrn-tag--auto', cyber: 'lrn-tag--cyber', both: 'lrn-tag--both', money: 'lrn-tag--money', tool: 'lrn-tag--tool' };
  const tagLabel = { auto: 'automation', cyber: 'cybersec', both: 'both', money: 'income', tool: 'tool' };

  return (
    <div className="lrn-roadmap">
      {/* Stats row */}
      <div className="lrn-stats">
        {[
          { label: 'COMPLETED', val: doneCount },
          { label: 'TOTAL', val: totalCount },
          { label: 'PROGRESS', val: pct + '%' },
          { label: 'PHASES', val: PHASES.length },
        ].map(s => (
          <div key={s.label} className="lrn-stat">
            <div className="lrn-stat-label">{s.label}</div>
            <div className="lrn-stat-val">{s.val}</div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="lrn-progress-wrap">
        <div className="lrn-progress-track">
          <div className="lrn-progress-fill" style={{ width: pct + '%' }} />
        </div>
        <span className="lrn-progress-label">{doneCount} / {totalCount}</span>
      </div>

      {/* Filter tabs */}
      <div className="lrn-filters">
        {['all', 'auto', 'cyber'].map(f => (
          <button
            key={f}
            className={`lrn-filter ${filter === f ? 'lrn-filter--active lrn-filter--' + f : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'All' : f === 'auto' ? 'Automation' : 'Cybersec'}
          </button>
        ))}
        <button className="lrn-reset" onClick={() => { if(window.confirm('Reset progress?')) { setDone(new Set()); localStorage.removeItem(storageKey); } }}>
          reset
        </button>
      </div>

      {/* Phases */}
      {PHASES.map(phase => {
        const filtered = phase.tasks.filter(t =>
          filter === 'all' ? true : t.tags.includes(filter)
        );
        if (!filtered.length) return null;
        const phaseDone = filtered.filter(t => done.has(t.id)).length;
        const isOpen = openPhases.has(phase.id);

        return (
          <div key={phase.id} className="lrn-phase">
            <div className="lrn-phase-header" onClick={() => togglePhase(phase.id)}>
              <div className="lrn-phase-num" style={{ background: typeColor[phase.type] + '22', color: typeColor[phase.type] }}>
                {phase.id}
              </div>
              <div className="lrn-phase-info">
                <div className="lrn-phase-title">{phase.title}</div>
                <div className="lrn-phase-desc">{phase.desc}</div>
              </div>
              <div className="lrn-phase-meta">
                <span className="lrn-phase-badge" style={{ background: typeColor[phase.type] + '22', color: typeColor[phase.type] }}>
                  {typeLabel[phase.type]}
                </span>
                <span className="lrn-phase-count">{phaseDone}/{filtered.length}</span>
                <span className={`lrn-chevron ${isOpen ? 'lrn-chevron--open' : ''}`}>▼</span>
              </div>
            </div>

            {isOpen && (
              <div className="lrn-tasks">
                {filtered.map(t => (
                  <div key={t.id} className={`lrn-task ${done.has(t.id) ? 'lrn-task--done' : ''}`} onClick={() => toggleTask(t.id)}>
                    <div className={`lrn-check ${done.has(t.id) ? 'lrn-check--done' : ''}`} />
                    <div className="lrn-task-body">
                      <div className={`lrn-task-title ${done.has(t.id) ? 'lrn-task-title--done' : ''}`}>{t.title}</div>
                      <div className="lrn-task-desc">{t.desc}</div>
                      <div className="lrn-tags">
                        {t.tags.map(tag => (
                          <span key={tag} className={`lrn-tag ${tagClass[tag] || ''}`}>{tagLabel[tag] || tag}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Coming Soon placeholder ────────────────────────────────────────────────

function ComingSoon({ label }) {
  return (
    <div className="lrn-coming-soon">
      <div className="lrn-cs-icon">◈</div>
      <div className="lrn-cs-title">{label}</div>
      <div className="lrn-cs-sub">Coming soon. You're building this OS.</div>
    </div>
  );
}

// ── Main LearnOS Component ─────────────────────────────────────────────────

export default function LearnOS({ onClose }) {
  const [activeSection, setActiveSection] = useState('roadmap');

  return (
    <div className="lrn-overlay">
      <div className="lrn-container">

        {/* Header */}
        <div className="lrn-header">
          <div className="lrn-header-left">
            <div className="lrn-mode-badge">LEARN MODE</div>
            <div className="lrn-header-title">Knowledge OS</div>
          </div>
          <button className="lrn-close" onClick={onClose}>✕</button>
        </div>

        {/* Section nav */}
        <div className="lrn-section-nav">
          {SECTIONS.map(s => (
            <button
              key={s.id}
              className={`lrn-section-btn ${activeSection === s.id ? 'lrn-section-btn--active' : ''}`}
              onClick={() => setActiveSection(s.id)}
            >
              <span className="lrn-section-icon">{s.icon}</span>
              <span className="lrn-section-label">{s.label}</span>
              <span className="lrn-section-desc">{s.desc}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="lrn-content">
          {activeSection === 'roadmap' && <Roadmap />}
          {activeSection === 'papers' && <ComingSoon label="Research Papers" />}
          {activeSection === 'languages' && <ComingSoon label="Language Learning" />}
          {activeSection === 'courses' && <ComingSoon label="Courses & Certs" />}
        </div>
      </div>
    </div>
  );
}
