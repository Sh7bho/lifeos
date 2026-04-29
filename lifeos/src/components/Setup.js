import React from 'react';
import './Setup.css';

export default function Setup() {
  return (
    <div className="setup-page">
      <div className="setup-glow" />
      <div className="setup-content">
        <div className="setup-logo">◆</div>
        <h1 className="setup-title">LIFE OS</h1>
        <p className="setup-sub">Setup required</p>

        <div className="setup-card">
          <div className="setup-step">
            <span className="step-num">01</span>
            <div className="step-body">
              <div className="step-title">Get your free Groq API key</div>
              <div className="step-desc">Go to <strong>console.groq.com</strong> → sign up free → create API key</div>
            </div>
          </div>
          <div className="setup-step">
            <span className="step-num">02</span>
            <div className="step-body">
              <div className="step-title">Create Supabase project</div>
              <div className="step-desc">Go to <strong>supabase.com</strong> → new project → copy URL + anon key</div>
            </div>
          </div>
          <div className="setup-step">
            <span className="step-num">03</span>
            <div className="step-body">
              <div className="step-title">Create database tables</div>
              <div className="step-desc">Run the SQL from <strong>SETUP.md</strong> in your Supabase SQL editor</div>
            </div>
          </div>
          <div className="setup-step">
            <span className="step-num">04</span>
            <div className="step-body">
              <div className="step-title">Add to Vercel environment</div>
              <div className="step-desc">Set <code>REACT_APP_GROQ_API_KEY</code>, <code>REACT_APP_SUPABASE_URL</code>, <code>REACT_APP_SUPABASE_ANON_KEY</code> in Vercel → redeploy</div>
            </div>
          </div>
        </div>

        <p className="setup-footer">Full guide in SETUP.md included with the code</p>
      </div>
    </div>
  );
}
