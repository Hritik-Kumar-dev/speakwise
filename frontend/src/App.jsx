import { useEffect, useRef, useState } from 'react';

const FALLBACK_PROMPTS = [{ id: 'daily-routine', title: 'Talk about your day', level: 'A2 · Everyday English', text: 'I usually start my day with a cup of coffee and a short walk.', tip: 'Connect usually start and your day smoothly.' }];

function speak(text) {
  if ('speechSynthesis' in window) window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
}

function formatTime(seconds) {
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

function localScore(text) {
  const count = text.split(/\s+/).length;
  const value = Math.min(97, 55 + count * 3);
  return { overall: value, pronunciation: Math.max(50, value - 3), correctness: value, fluency: Math.max(50, value - 6), feedback: [{ label: 'Keep practicing', detail: 'Your response has been received. Keep connecting words smoothly.', type: 'tip' }], alternative: 'I think practicing a little every day makes learning a language much easier.' };
}

function ScoreCard({ label, value, description, primary = false }) {
  return <div className={`score-card ${primary ? 'primary' : ''}`}><span>{label}</span><strong>{value ?? '—'}</strong>{!primary && <div className="score-line"><i style={{ width: `${value ?? 0}%` }} /></div>}<small>{primary ? 'out of 100' : description}</small></div>;
}

function App() {
  const [prompts, setPrompts] = useState([]);
  const [index, setIndex] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [status, setStatus] = useState('Your microphone is ready when you are.');
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const startedAt = useRef(0);
  const recognition = useRef(null);
  const mediaRecorder = useRef(null);
  const mediaStream = useRef(null);
  const audioChunks = useRef([]);
  const [audioUrl, setAudioUrl] = useState('');
  const timer = useRef(null);
  const prompt = prompts[index];

  useEffect(() => {
    fetch('/api/prompts').then((response) => response.json()).then(setPrompts).catch(() => setPrompts(FALLBACK_PROMPTS));
  }, []);

  useEffect(() => () => { clearInterval(timer.current); recognition.current?.stop(); }, []);

  function selectPrompt(nextIndex) {
    setIndex(nextIndex);
    setTranscript('');
    setFeedback(null);
    setSeconds(0);
    setStatus('Your microphone is ready when you are.');
  }

  function toggleRecording() {
    if (recording) {
      clearInterval(timer.current);
      recognition.current?.stop();
      setRecording(false);
      setStatus('Recording saved. Review your words, then get your score.');
      return;
    }
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    startedAt.current = Date.now();
    setSeconds(0);
    setRecording(true);
    setStatus(Recognition ? 'Listening… speak naturally' : 'Speech recognition is unavailable. Type your words below instead.');
    timer.current = setInterval(() => setSeconds(Math.floor((Date.now() - startedAt.current) / 1000)), 1000);
    if (!Recognition) return;
    const instance = new Recognition();
    instance.continuous = true;
    instance.interimResults = true;
    instance.lang = 'en-US';
    instance.onresult = (event) => {
      let words = '';
      for (let i = 0; i < event.results.length; i += 1) words += event.results[i][0].transcript;
      setTranscript(words);
    };
    instance.onerror = () => setStatus('We could not hear that clearly. Try again or edit the transcript.');
    instance.onend = () => { if (recording) instance.start(); };
    recognition.current = instance;
    instance.start();
  }

  async function score() {
    if (!transcript.trim()) { setStatus('Add or record a response before scoring it.'); return; }
    setLoading(true);
    try {
      const response = await fetch('/api/score', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ promptId: prompt.id, transcript, duration: seconds }) });
      if (!response.ok) throw new Error('Scoring failed');
      setFeedback(await response.json());
    } catch (_) {
      setFeedback(localScore(transcript));
    } finally {
      setLoading(false);
    }
  }

  if (!prompt) return <div className="loading-page">Loading your practice prompts…</div>;

  return <>
    <header className="topbar"><a className="brand" href="/"><span className="brand-mark">S</span><span>Speak<span className="brand-accent">Well</span></span></a><nav><a className="active" href="#practice">Practice</a><a href="#progress">Progress</a><a href="#tips">Tips</a></nav><button className="profile" aria-label="Open profile">JD</button></header>
    <main id="practice" className="shell">
      <section className="intro"><div><p className="eyebrow">DAILY SPEAKING PRACTICE</p><h1>Find your voice.<br /><em>Speak with confidence.</em></h1><p className="subhead">A few minutes every day can make a real difference. Practice naturally, get thoughtful feedback, and watch yourself improve.</p></div><div className="streak"><span className="flame">✦</span><div><strong>7 day streak</strong><small>Keep it going!</small></div></div></section>
      <section className="layout"><div className="practice-card"><div className="card-head"><div><span className="pill">{prompt.level}</span><h2>{prompt.title}</h2></div><button className="icon-button" onClick={() => selectPrompt((index + 1) % prompts.length)} title="Next prompt">↻</button></div><div className="prompt-box"><span className="quote">“</span><p>{prompt.text}</p><button className="sound" onClick={() => speak(prompt.text)} aria-label="Listen to phrase">◖</button></div><p className="instruction"><span>◎</span> Take a breath, then say the phrase naturally.</p><div className="recorder"><div className={`wave ${recording ? 'active' : ''}`}>{Array.from({ length: 29 }, (_, item) => <i key={item} />)}</div><div className="recorder-controls"><button className={`record ${recording ? 'recording' : ''}`} onClick={toggleRecording}><span className="record-dot" /><span>{recording ? 'Stop recording' : 'Start recording'}</span></button><span className="timer">{formatTime(seconds)}</span></div>{audioUrl && !recording && <audio className="playback" controls src={audioUrl} />}<p className="mic-status">{status}</p></div><div className="transcript"><div className="section-label"><span>Your words</span><small>EDIT IF NEEDED</small></div><textarea value={transcript} onChange={(event) => setTranscript(event.target.value)} placeholder="Your spoken words will appear here…" /><button className="score-button" disabled={loading} onClick={score}>{loading ? 'Analyzing your speaking…' : <>Score my speaking <span>→</span></>}</button></div></div>
        <aside className="side-column"><div className="mini-card"><div className="section-label"><span>Today’s progress</span><small>SESSION 01</small></div><div className="progress-row"><div className="ring"><strong>{feedback?.overall ?? '—'}</strong><small>AVG SCORE</small></div><div className="stats"><div><strong>{feedback ? Math.max(1, Math.ceil(seconds / 60)) : 0}</strong><span>minutes practiced</span></div><div><strong>{feedback ? 1 : 0}</strong><span>phrases completed</span></div></div></div><div className="bar"><span style={{ width: `${feedback?.overall ?? 0}%` }} /></div></div><div className="mini-card tip-card" id="tips"><span className="tip-icon">✦</span><div><strong>Speak, don’t perfect.</strong><p>Fluency grows when you keep going—even when a sentence isn’t perfect.</p></div></div><div className="mini-card"><div className="section-label"><span>Choose a prompt</span><small>{prompts.length} AVAILABLE</small></div><div className="prompt-list">{prompts.map((item, itemIndex) => <button key={item.id} className={`prompt-choice ${itemIndex === index ? 'active' : ''}`} onClick={() => selectPrompt(itemIndex)}>{item.title}<small>{item.level}</small></button>)}</div></div></aside>
      </section>
      <section className="feedback-section"><div className="feedback-heading"><div><p className="eyebrow">YOUR FEEDBACK</p><h2>Here’s how you did</h2></div><span className="confidence">Keep building · You’re on your way</span></div><div className="scores"><ScoreCard label="OVERALL SCORE" value={feedback?.overall} primary /><ScoreCard label="PRONUNCIATION" value={feedback?.pronunciation} description="Clear and understandable" /><ScoreCard label="CORRECTNESS" value={feedback?.correctness} description="Words and grammar" /><ScoreCard label="FLUENCY" value={feedback?.fluency} description="Natural rhythm and pace" /></div><div className="feedback-grid"><div className="feedback-card"><div className="section-label"><span>Helpful notes</span></div>{feedback ? feedback.feedback.map((note, noteIndex) => <div className="note" key={`${note.label}-${noteIndex}`}><span className={`note-dot ${note.type === 'strength' ? 'green' : ''}`} /><div><b>{note.label}</b><p>{note.detail}</p></div></div>) : <p className="empty">Complete a practice round to see personalized feedback.</p>}</div><div className="feedback-card alternative"><div className="section-label"><span>A more natural way to say it</span></div><p>{feedback?.alternative ?? 'Your improved version will appear after you practice.'}</p><button onClick={() => speak(feedback?.alternative ?? '')}>◖ Listen to example</button></div></div></section>
    </main><footer><span>© 2024 SpeakWell</span><span>Practice with patience · Grow with every word</span></footer>
  </>;
}

export default App;
