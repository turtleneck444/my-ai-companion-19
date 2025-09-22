export async function speakText(text: string, voiceId?: string): Promise<void> {
  const res = await fetch('/api/elevenlabs-tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voiceId })
  });
  if (!res.ok) {
    throw new Error(await res.text());
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  await audio.play();
} 