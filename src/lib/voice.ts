let playbackQueue: Promise<void> = Promise.resolve();

export async function speakText(text: string, voiceId?: string): Promise<void> {
  const task = async () => {
    try {
      // Try ElevenLabs TTS first
      const res = await fetch('/api/elevenlabs-tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text, 
          voice_id: voiceId || 'default',
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.8,
            style: 0.2,
            use_speaker_boost: true
          }
        }),
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        try {
          await playAudio(url);
        } finally {
          URL.revokeObjectURL(url);
        }
        return; // Success, exit early
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
    utterance.rate = 0.9;
    utterance.pitch = 1.1;
    utterance.volume = 0.8;

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
      let selectedVoice = null;
      for (const preference of preferences) {
        selectedVoice = voices.find(voice => 
          voice.name.toLowerCase().includes(preference)
        );
        if (selectedVoice) break;
      }

      // Fallback to any female voice
      if (!selectedVoice) {
        selectedVoice = voices.find(voice => 
          voice.name.toLowerCase().includes('female') || 
          voice.name.toLowerCase().includes('woman') ||
          voice.name.toLowerCase().includes('samantha') ||
          voice.name.toLowerCase().includes('karen')
        );
      }

      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      utterance.onend = () => resolve();
      utterance.onerror = (error) => reject(new Error('Speech synthesis failed'));
      
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