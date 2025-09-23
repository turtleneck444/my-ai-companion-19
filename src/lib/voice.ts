let playbackQueue: Promise<void> = Promise.resolve();

export interface ElevenLabsSettings {
  stability?: number;
  similarity_boost?: number;
  style?: number;
  use_speaker_boost?: boolean;
}

export async function speakText(
  text: string,
  voiceId?: string,
  options?: { modelId?: string; voiceSettings?: ElevenLabsSettings }
): Promise<void> {
  const task = async () => {
    try {
      // Prefer ElevenLabs TTS
      const res = await fetch('/api/elevenlabs-tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text, 
          voice_id: voiceId || 'default',
          model_id: options?.modelId || 'eleven_multilingual_v2',
          voice_settings: {
            stability: options?.voiceSettings?.stability ?? 0.35,
            similarity_boost: options?.voiceSettings?.similarity_boost ?? 0.9,
            style: options?.voiceSettings?.style ?? 0.45,
            use_speaker_boost: options?.voiceSettings?.use_speaker_boost ?? true
          }
        }),
        signal: AbortSignal.timeout(12000)
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        try {
          await playAudio(url);
        } finally {
          URL.revokeObjectURL(url);
        }
        return; // Success
      }
    } catch (error) {
      console.warn('ElevenLabs TTS unavailable, using browser fallback:', error);
    }

    // Fallback to browser speech synthesis
    await fallbackTextToSpeech(text, voiceId);
  };

  playbackQueue = playbackQueue.then(task).catch(() => task());
  return playbackQueue;
}

async function fallbackTextToSpeech(text: string, voiceId?: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!('speechSynthesis' in window)) {
      reject(new Error('Speech synthesis not supported'));
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.92;
    utterance.pitch = 1.05;
    utterance.volume = 0.85;

    // Map voice IDs to preferred voice characteristics
    const voicePreferences: Record<string, string[]> = {
      'sarah': ['samantha', 'karen', 'female'],
      'emma': ['emily', 'kate', 'british'],
      'lily': ['samantha', 'allison', 'young'],
      'sophia': ['alex', 'victoria', 'elegant'],
      'aria': ['samantha', 'zoe', 'sultry'],
      'maya': ['alex', 'samantha', 'confident']
    };

    // Wait for voices to load
    const setVoiceAndSpeak = () => {
      const voices = speechSynthesis.getVoices();
      const preferences = voicePreferences[voiceId || ''] || ['female', 'woman', 'samantha'];
      
      // Try to find a voice that matches preferences
      let selectedVoice = null as SpeechSynthesisVoice | null;
      for (const preference of preferences) {
        selectedVoice = voices.find(voice => 
          voice.name.toLowerCase().includes(preference)
        ) || null;
        if (selectedVoice) break;
      }

      // Fallback to any female voice
      if (!selectedVoice) {
        selectedVoice = voices.find(voice => 
          voice.name.toLowerCase().includes('female') || 
          voice.name.toLowerCase().includes('woman') ||
          voice.name.toLowerCase().includes('samantha') ||
          voice.name.toLowerCase().includes('karen')
        ) || null;
      }

      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      utterance.onend = () => resolve();
      utterance.onerror = () => reject(new Error('Speech synthesis failed'));
      
      speechSynthesis.speak(utterance);
    };

    // Ensure voices are loaded
    if (speechSynthesis.getVoices().length > 0) {
      setVoiceAndSpeak();
    } else {
      speechSynthesis.addEventListener('voiceschanged', setVoiceAndSpeak, { once: true });
    }
  });
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