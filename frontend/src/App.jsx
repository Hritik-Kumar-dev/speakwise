import { useEffect, useRef, useState } from 'react';

const BUILTIN_SCENARIOS = [
  { id: 'stage', name: 'Stage', description: 'Give a speech on the big stage!', image: '/stage.png' },
  { id: 'concert', name: 'Concert', description: 'Sing or speak to a huge crowd.', image: '/concert.png' },
  { id: 'interview', name: 'Interview', description: 'Answer questions like a pro.', image: '/interview.png' },
  { id: 'classroom', name: 'Classroom', description: 'Share an idea in class.', image: '/classroom.png' },
];

function speak(text) {
  if ('speechSynthesis' in window) window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
}

function formatTime(seconds) {
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

function scoreLocal(text, duration) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  if (wordCount === 0) return { overall: 0, pronunciation: 0, correctness: 0, fluency: 0, feedback: [], alternative: '' };
  const avgLen = words.reduce((sum, word) => sum + word.length, 0) / wordCount;
  const sentences = text.split('.').filter((s) => s.trim()).length;
  const correctness = Math.min(100, 60 + wordCount * 3 + Math.floor(avgLen * 3));
  let fluency = 60;
  if (duration > 0) {
    const wpm = (wordCount / Math.max(duration, 1)) * 60;
    fluency = Math.max(40, Math.min(100, 100 - Math.abs(wpm - 120) / 2));
  } else {
    fluency = Math.min(100, 60 + wordCount * 2);
  }
  const pronunciation = Math.min(100, 70 + Math.floor(avgLen * 2));
  const overall = Math.round(pronunciation * 0.35 + correctness * 0.35 + fluency * 0.3);
  const feedback = [{ type: 'strength', label: 'Great speaking!', detail: `You used ${wordCount} words. Keep it up!` }];
  if (sentences) feedback.push({ type: 'tip', label: 'Sentences', detail: `You made ${sentences} sentence(s). Try to use full sentences to improve clarity.` });
  if (duration > 0 && wordCount / Math.max(duration, 1) < 1) feedback.push({ type: 'tip', label: 'Pace', detail: 'Try speaking a little more. Longer answers help practice fluency.' });
  return { overall, pronunciation, correctness, fluency, feedback, alternative: '' };
}

function StarRating({ score }) {
  const filled = Math.max(1, Math.min(5, Math.round(score / 20)));
  return <div className="kid-stars">{Array.from({ length: 5 }, (_, i) => <span key={i}>{i < filled ? '⭐' : '☆'}</span>)}</div>;
}

function App() {
  const [scenarios, setScenarios] = useState(BUILTIN_SCENARIOS);
  const [view, setView] = useState('home');
  const [activeScenario, setActiveScenario] = useState(null);
  const [transcript, setTranscript] = useState('');
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [status, setStatus] = useState('Pick a place to practice!');
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState('');
  const [customName, setCustomName] = useState('');
  const [customImage, setCustomImage] = useState(null);
  const startedAt = useRef(0);
  const listening = useRef(false);
  const finalTranscript = useRef('');
  const recognition = useRef(null);
  const mediaRecorder = useRef(null);
  const mediaStream = useRef(null);
  const audioChunks = useRef([]);
  const timer = useRef(null);

  useEffect(() => {
    fetch('/api/scenarios').then((res) => res.json()).then((data) => setScenarios([...BUILTIN_SCENARIOS, ...data.filter((item) => !BUILTIN_SCENARIOS.some((b) => b.id === item.id))])).catch(() => setScenarios(BUILTIN_SCENARIOS));
    const stored = localStorage.getItem('speakwell_custom_scenarios');
    if (stored) {
      try { setScenarios((prev) => [...prev, ...JSON.parse(stored)]); } catch (_) { /* ignore */ }
    }
  }, []);

  useEffect(() => () => {
    listening.current = false;
    clearInterval(timer.current);
    try { recognition.current?.stop(); } catch (_) { /* already stopped */ }
    mediaRecorder.current?.state === 'recording' && mediaRecorder.current.stop();
    mediaStream.current?.getTracks().forEach((track) => track.stop());
  }, []);

  useEffect(() => {
    const custom = scenarios.filter((s) => s.custom);
    localStorage.setItem('speakwell_custom_scenarios', JSON.stringify(custom));
  }, [scenarios]);

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

  function startScenario(scenario) {
    setActiveScenario(scenario);
    setTranscript('');
    setFeedback(null);
    setSeconds(0);
    setAudioUrl('');
    setStatus('Tap Speak and say your own words!');
    setView('practice');
  }

  function goHome() {
    stopEverything();
    setView('home');
    setActiveScenario(null);
    setStatus('Pick a place to practice!');
  }

  function toggleRecording() {
    if (recording) {
      stopEverything();
      setStatus('Great! Listen back or get your score.');
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
    setStatus(Recognition ? 'I am listening. Say anything!' : 'Recording your voice. Type your words below when done.');
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
      }).catch(() => { if (listening.current) setStatus('Microphone access blocked. Type your words below!'); });
    }

    if (!Recognition) return;
    const instance = new Recognition();
    instance.continuous = true;
    instance.interimResults = true;
    instance.lang = 'en-US';
    instance.onresult = (event) => {
      let interim = '';
      for (let i = 0; i < event.results.length; i += 1) {
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
    instance.onend = () => { if (listening.current) { try { instance.start(); } catch (_) { /* already started */ } } };
    recognition.current = instance;
    try { instance.start(); } catch (_) { /* already started */ }
  }

  async function score() {
    if (recording) stopEverything();
    if (!transcript.trim()) { setStatus('Speak or type something first!'); return; }
    setLoading(true);
    try {
      const response = await fetch('/api/score', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ transcript, duration: seconds }) });
      if (!response.ok) throw new Error('Scoring failed');
      setFeedback(await response.json());
    } catch (_) {
      setFeedback(scoreLocal(transcript, seconds));
    } finally {
      setLoading(false);
    }
  }

  function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setCustomImage(reader.result);
    };
    reader.readAsDataURL(file);
  }

  function addCustomScenario() {
    if (!customName.trim() || !customImage) { setStatus('Give your scene a name and pick a picture!'); return; }
    const newScenario = { id: `custom-${Date.now()}`, name: customName.trim(), description: 'Your custom scene', image: customImage, custom: true };
    setScenarios((prev) => [...prev, newScenario]);
    setCustomName('');
    setCustomImage(null);
    setStatus('Your new scene is ready!');
  }

  if (view === 'practice' && activeScenario) {
    return (
      <div className="practice-screen" style={{ backgroundImage: `url(${activeScenario.image})` }}>
        <button className="home-btn" onClick={goHome}>← Home</button>
        <div className="centered-speak">
          <button className={`speak-btn ${recording ? 'recording' : ''}`} onClick={toggleRecording}><span>{recording ? 'Stop' : 'Speak'}</span></button>
          <div className="timer">{formatTime(seconds)}</div>
        </div>
        <div className="bottom-panel">
          <p className="status-text">{status}</p>
          {audioUrl && !recording && <audio className="practice-audio" controls src={audioUrl} />}
          <textarea className="practice-transcript" value={transcript} onChange={(e) => setTranscript(e.target.value)} placeholder="Your words will appear here…" />
          <button className="score-btn" disabled={loading} onClick={score}>{loading ? 'Checking…' : 'Get my score ⭐'}</button>
        </div>
        {feedback && <div className="scoreboard-overlay">
          <button className="close-scoreboard" onClick={() => setFeedback(null)}>×</button>
          <StarRating score={feedback.overall} />
          <div className="score-pills">
            <div className="score-pill big"><strong>{feedback.overall}</strong><span>Total</span></div>
            <div className="score-pill"><strong>{feedback.pronunciation}</strong><span>Speaking</span></div>
            <div className="score-pill"><strong>{feedback.correctness}</strong><span>Words</span></div>
            <div className="score-pill"><strong>{feedback.fluency}</strong><span>Flow</span></div>
          </div>
          <div className="notes">
            {feedback.feedback.map((note, i) => <div className="note" key={i}><span>{note.type === 'strength' ? '⭐' : '💡'}</span><div><b>{note.label}</b><p>{note.detail}</p></div></div>)}
          </div>
        </div>}
      </div>
    );
  }

  return (
    <div className="home-screen">
      <header className="home-header"><span className="logo">🎙️ SpeakWell</span></header>
      <main className="home-main">
        <h1 className="home-title">Pick a place to practice! 🎤</h1>
        <p className="home-sub">Choose a scene, then speak your own words. We will listen and help you improve.</p>
        <div className="scenario-grid">
          {scenarios.map((scenario) => (
            <button key={scenario.id} className="scenario-card" onClick={() => startScenario(scenario)} style={{ backgroundImage: `url(${scenario.image})` }}>
              <span className="scenario-name">{scenario.name}</span>
              <span className="scenario-desc">{scenario.description}</span>
            </button>
          ))}
        </div>
        <section className="custom-section">
          <h2>Make your own scene ✨</h2>
          <input type="text" placeholder="Scene name, like My Room" value={customName} onChange={(e) => setCustomName(e.target.value)} />
          <label className="upload-btn">
            {customImage ? 'Photo added!' : 'Choose a background photo'}
            <input type="file" accept="image/*" onChange={handleImageUpload} />
          </label>
          {customImage && <img className="preview" src={customImage} alt="Preview" />}
          <button className="add-btn" onClick={addCustomScenario}>Add my scene</button>
        </section>
      </main>
      <footer className="home-footer">© 2024 SpeakWell · Speak, practice, improve!</footer>
    </div>
  );
}

export default App;
