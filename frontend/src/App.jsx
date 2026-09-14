import { useEffect, useRef, useState } from 'react';

const FALLBACK_PROMPTS = [
  { id: 'daily-routine', title: 'My Day', level: 'Easy', text: 'I usually start my day with a cup of coffee and a short walk.', tip: 'Say the words slowly and clearly.' },
];

function speak(text) {
  if ('speechSynthesis' in window) window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
}

function formatTime(seconds) {
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

function localScore(text) {
  const count = text.split(/\s+/).length;
  const value = Math.min(95, 60 + count * 3);
  return {
    overall: value,
    pronunciation: Math.max(55, value - 3),
    correctness: value,
    fluency: Math.max(55, value - 5),
    feedback: [{ label: 'Great try!', detail: 'Keep speaking. You will get better every time.', type: 'strength' }],
    alternative: 'I think practicing a little every day makes learning easier.',
  };
}

function StarRating({ score }) {
  const filled = Math.max(1, Math.min(5, Math.round(score / 20)));
  return <div className="kid-stars">{Array.from({ length: 5 }, (_, i) => <span key={i}>{i < filled ? '⭐' : '☆'}</span>)}</div>;
}

function App() {
  const [prompts, setPrompts] = useState([]);
  const [index, setIndex] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [status, setStatus] = useState('Tap the big button to start!');
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState('');
  const startedAt = useRef(0);
  const listening = useRef(false);
  const finalTranscript = useRef('');
  const recognition = useRef(null);
  const mediaRecorder = useRef(null);
  const mediaStream = useRef(null);
  const audioChunks = useRef([]);
  const timer = useRef(null);
  const prompt = prompts[index];

  useEffect(() => {
    fetch('/api/prompts').then((response) => response.json()).then(setPrompts).catch(() => setPrompts(FALLBACK_PROMPTS));
  }, []);

  useEffect(() => () => {
    listening.current = false;
    clearInterval(timer.current);
    try { recognition.current?.stop(); } catch (_) { /* already stopped */ }
    mediaRecorder.current?.state === 'recording' && mediaRecorder.current.stop();
    mediaStream.current?.getTracks().forEach((track) => track.stop());
  }, []);

  function stopEverything() {
    listening.current = false;
    clearInterval(timer.current);
    try { recognition.current?.stop(); } catch (_) { /* already stopped */ }
    recognition.current = null;
    mediaRecorder.current?.state === 'recording' && mediaRecorder.current.stop();
    mediaStream.current?.getTracks().forEach((track) => track.stop());
    mediaStream.current = null;
    setRecording(false);
  }

  function selectPrompt(nextIndex) {
    if (recording) stopEverything();
    setIndex(nextIndex);
    setTranscript('');
    setFeedback(null);
    setSeconds(0);
    setAudioUrl('');
    setStatus('Tap the big button to start!');
  }

  function toggleRecording() {
    if (recording) {
      stopEverything();
      setStatus('Good job! Listen to your voice, then get your score.');
      return;
    }
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    listening.current = true;
    startedAt.current = Date.now();
    finalTranscript.current = '';
    audioChunks.current = [];
    setSeconds(0);
    setTranscript('');
    setAudioUrl('');
    setFeedback(null);
    setRecording(true);
    setStatus(Recognition ? 'I am listening. Say the sentence!' : 'Recording your voice. Type your words below when done.');
    timer.current = setInterval(() => setSeconds(Math.floor((Date.now() - startedAt.current) / 1000)), 1000);

    if (navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
        if (!listening.current) { stream.getTracks().forEach((track) => track.stop()); return; }
        mediaStream.current = stream;
        const recorder = new MediaRecorder(stream);
        recorder.ondataavailable = (event) => event.data.size > 0 && audioChunks.current.push(event.data);
        recorder.onstop = () => {
          setAudioUrl(URL.createObjectURL(new Blob(audioChunks.current, { type: recorder.mimeType || 'audio/webm' })));
          stream.getTracks().forEach((track) => track.stop());
        };
        mediaRecorder.current = recorder;
        recorder.start();
      }).catch(() => {
        if (listening.current) setStatus('Microphone access blocked. You can type your words below!');
      });
    }

    if (!Recognition) return;
    const instance = new Recognition();
    instance.continuous = true;
    instance.interimResults = true;
    instance.lang = 'en-US';
    instance.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalTranscript.current += `${text} `;
        else interim += text;
      }
      setTranscript(`${finalTranscript.current}${interim}`.trim());
    };
    instance.onerror = (event) => {
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        listening.current = false;
        setStatus('Microphone permission is blocked. Ask a grown-up, or type your words below.');
      } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
        setStatus('I did not catch that. Try speaking a little louder!');
      }
    };
    instance.onend = () => {
      if (!listening.current) return;
      try { instance.start(); } catch (_) { /* already started */ }
    };
    recognition.current = instance;
    try { instance.start(); } catch (_) { /* already started */ }
  }

  async function score() {
    if (recording) stopEverything();
    if (!transcript.trim()) { setStatus('Type or speak your sentence first, then tap Score!'); return; }
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

  if (!prompt) return <div className="loading-page">Loading…</div>;

  return (
    <div className="app-shell">
      <header className="kid-header">
        <a className="kid-brand" href="/"><span className="emoji">🎙️</span><span>SpeakWell</span></a>
        <nav className="kid-nav"><a className="active" href="#practice">Practice</a><a href="#progress">Progress</a></nav>
        <button className="kid-avatar" aria-label="Profile">👦</button>
      </header>
      <main id="practice" className="kid-main">
        <section className="kid-card">
          <span className="kid-level">{prompt.level}</span>
          <h1 className="kid-title">{prompt.title}</h1>
          <div className="kid-phrase-box"><span>“{prompt.text}”</span><button onClick={() => speak(prompt.text)} aria-label="Listen">🔊</button></div>
          <p className="kid-instruction">Tap the red button and say the sentence out loud.</p>
          <button className={`kid-big-button ${recording ? 'recording' : ''}`} onClick={toggleRecording}><span className="mic-emoji">🎤</span><span>{recording ? 'Stop' : 'Talk'}</span></button>
          <div className="kid-timer">{formatTime(seconds)}</div>
          <p className="kid-status">{status}</p>
          {audioUrl && !recording && <audio className="kid-audio" controls src={audioUrl} />}
        </section>
        <section className="kid-card">
          <label className="kid-label">Your words</label>
          <textarea className="kid-transcript" value={transcript} onChange={(event) => setTranscript(event.target.value)} placeholder="Your words will appear here…" />
          <button className="kid-score-btn" disabled={loading} onClick={score}>{loading ? 'Checking…' : 'Score my speaking ⭐'}</button>
        </section>
        <section className="kid-card" style={{ textAlign: 'left' }}>
          <h2 style={{ marginTop: 0, color: 'var(--purple-dark)' }}>Pick another</h2>
          <div className="kid-prompts">{prompts.map((item, itemIndex) => <button key={item.id} className={itemIndex === index ? 'active' : ''} onClick={() => selectPrompt(itemIndex)}>{item.title}<span className="level">{item.level}</span></button>)}</div>
        </section>
        {feedback && <section className="kid-feedback-card">
          <h3>How you did</h3>
          <StarRating score={feedback.overall} />
          <div className="kid-scoreboard">
            <div className="kid-score-pill big"><span className="num">{feedback.overall}</span><span className="label">Total</span></div>
            <div className="kid-score-pill"><span className="num">{feedback.pronunciation}</span><span className="label">Speaking</span></div>
            <div className="kid-score-pill"><span className="num">{feedback.correctness}</span><span className="label">Words</span></div>
            <div className="kid-score-pill"><span className="num">{feedback.fluency}</span><span className="label">Flow</span></div>
          </div>
          <h3 style={{ marginTop: 24 }}>Helpful notes</h3>
          {feedback.feedback.map((note, noteIndex) => <div className="kid-note" key={`${note.label}-${noteIndex}`}><span className="dot">{note.type === 'strength' ? '⭐' : '💡'}</span><div><b>{note.label}</b>{note.detail}</div></div>)}
          <h3 style={{ marginTop: 24 }}>Better way to say it</h3>
          <div className="kid-alternative">{feedback.alternative}</div>
          <button className="kid-score-btn" onClick={() => speak(feedback.alternative)}>🔊 Listen</button>
        </section>}
      </main>
      <footer className="kid-footer">© 2024 SpeakWell · Keep speaking, keep smiling!</footer>
    </div>
  );
}

export default App;
