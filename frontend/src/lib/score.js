export function scoreFreeform(transcript, duration = 0) {
  const words = transcript.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  if (wordCount === 0) {
    return { overall: 0, pronunciation: 0, correctness: 0, fluency: 0, transcript, feedback: [], alternative: '' };
  }

  const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / wordCount;
  const sentences = transcript.split('.').filter(s => s.trim());

  let correctness = Math.min(100, 60 + wordCount * 3 + Math.floor(avgWordLength * 3));

  let fluency = 60;
  if (duration > 0) {
    const wpm = (wordCount / Math.max(duration, 1)) * 60;
    fluency = Math.max(40, Math.min(100, 100 - Math.abs(wpm - 120) / 2));
  } else {
    fluency = Math.min(100, 60 + wordCount * 2);
  }

  const pronunciation = Math.min(100, 70 + Math.floor(avgWordLength * 2));
  const overall = Math.round(pronunciation * 0.35 + correctness * 0.35 + fluency * 0.3);

  const feedback = [
    { type: 'strength', label: 'Great speaking!', detail: `You used ${wordCount} words. Keep it up!` },
  ];

  if (sentences.length) {
    feedback.push({ type: 'tip', label: 'Sentences', detail: `You made ${sentences.length} sentence(s). Try to use full sentences to improve clarity.` });
  }

  if (duration > 0 && wordCount / Math.max(duration, 1) < 1) {
    feedback.push({ type: 'tip', label: 'Pace', detail: 'Try speaking a little more. Longer answers help practice fluency.' });
  }

  return {
    overall,
    pronunciation,
    correctness,
    fluency,
    transcript,
    feedback,
    alternative: '',
  };
}