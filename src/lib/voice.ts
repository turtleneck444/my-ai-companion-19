let playbackQueue: Promise<void> = Promise.resolve();

export async function speakText(text: string, voiceId?: string): Promise<void> {
  const task = async () => {
    const res = await fetch('/api/elevenlabs-tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voiceId })
    });
    if (!res.ok) throw new Error(await res.text());

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    try {
      await playAudio(url);
    } finally {
      URL.revokeObjectURL(url);
    }
  };

  playbackQueue = playbackQueue.then(task).catch(() => task());
  return playbackQueue;
}

function playAudio(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const audio = new Audio(url);
    const onEnded = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      reject(new Error('Audio playback failed'));
    };
    const cleanup = () => {
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
    };
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);
    audio.play().catch(onError);
  });
} 