let playbackQueue: Promise<void> = Promise.resolve();
let currentAudio: HTMLAudioElement | null = null;

export interface ElevenLabsSettings {
  stability?: number;
  similarity_boost?: number;
  style?: number;
  use_speaker_boost?: boolean;
}

// Per-voice presets tuned for more natural feminine voices
const VOICE_PRESETS: Record<string, ElevenLabsSettings> = {
  // ElevenLabs stock IDs → tuning presets
  '21m00Tcm4TlvDq8ikWAM': { stability: 0.28, similarity_boost: 0.96, style: 0.55, use_speaker_boost: true }, // Rachel
  'AZnzlk1XvdvUeBnXmlld': { stability: 0.30, similarity_boost: 0.97, style: 0.60, use_speaker_boost: true }, // Bella
  'EXAVITQu4vr4xnSDxMaL': { stability: 0.32, similarity_boost: 0.95, style: 0.52, use_speaker_boost: true }, // Sarah
  'TxGEqnHWrfWFTfGW9XjX': { stability: 0.27, similarity_boost: 0.95, style: 0.58, use_speaker_boost: true }, // Emily (en-GB)
  'ErXwobaYiN019PkySvjV': { stability: 0.30, similarity_boost: 0.95, style: 0.50, use_speaker_boost: true }, // Elli
  'pNInz6obpgDQGcFmaJgB': { stability: 0.25, similarity_boost: 0.96, style: 0.62, use_speaker_boost: true }, // Olivia
  'MF3mGyEYCl7XYWbV9V6O': { stability: 0.30, similarity_boost: 0.96, style: 0.57, use_speaker_boost: true }, // Cora
  'onwK4e9ZLuTAKqWW03F9': { stability: 0.26, similarity_boost: 0.95, style: 0.60, use_speaker_boost: true }, // Domi
};

function getPersistedTuning(voiceId?: string): ElevenLabsSettings | undefined {
  try {
    const raw = localStorage.getItem('loveai-voice-tuning');
    if (!raw) return undefined;
    const all = JSON.parse(raw) as Record<string, ElevenLabsSettings>;
    return voiceId && all[voiceId] ? all[voiceId] : all['__default'];
  } catch {
    return undefined;
  }
}

function mergeSettings(voiceId?: string, override?: ElevenLabsSettings): ElevenLabsSettings {
  const preset = (voiceId && VOICE_PRESETS[voiceId]) ? VOICE_PRESETS[voiceId] : undefined;
  const persisted = getPersistedTuning(voiceId);
  return {
    stability: override?.stability ?? persisted?.stability ?? preset?.stability ?? 0.30,
    similarity_boost: override?.similarity_boost ?? persisted?.similarity_boost ?? preset?.similarity_boost ?? 0.95,
    style: override?.style ?? persisted?.style ?? preset?.style ?? 0.55,
    use_speaker_boost: override?.use_speaker_boost ?? persisted?.use_speaker_boost ?? preset?.use_speaker_boost ?? true,
  };
}

export async function speakText(
  text: string,
  voiceId?: string,
  options?: { modelId?: string; voiceSettings?: ElevenLabsSettings }
): Promise<void> {
  const task = async () => {
    try {
      // Resolve best-available settings
      const settings = mergeSettings(voiceId, options?.voiceSettings);
      // Prefer ElevenLabs TTS
      const res = await fetch('/api/elevenlabs-tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text, 
          voice_id: voiceId || (import.meta.env.VITE_ELEVENLABS_VOICE_ID as string) || '21m00Tcm4TlvDq8ikWAM',
          model_id: options?.modelId || 'eleven_multilingual_v2',
          voice_settings: settings
        }),
        signal: AbortSignal.timeout(15000)
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

export function stopAllTTS(): void {
  try { speechSynthesis.cancel(); } catch {}
  try {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      currentAudio = null;
    }
  } catch {}
}

async function fallbackTextToSpeech(text: string, voiceId?: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!('speechSynthesis' in window)) {
      reject(new Error('Speech synthesis not supported'));
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1.15;
    utterance.volume = 0.85;

    // Map voice IDs to preferred voice characteristics
    const voicePreferences: Record<string, string[]> = {
      // ElevenLabs IDs we use → browser TTS preferences (case-insensitive contains)
      '21m00Tcm4TlvDq8ikWAM': ['samantha', 'female', 'karen'], // Rachel
      'AZnzlk1XvdvUeBnXmlld': ['allison', 'female', 'samantha'], // Bella
      'EXAVITQu4vr4xnSDxMaL': ['karen', 'female', 'samantha'], // Sarah
      'TxGEqnHWrfWFTfGW9XjX': ['kate', 'emily', 'female'], // Emily (en-GB)
      'ErXwobaYiN019PkySvjV': ['zoe', 'samantha', 'female'], // Elli
      'pNInz6obpgDQGcFmaJgB': ['victoria', 'kate', 'female'], // Olivia (elegant)
      'MF3mGyEYCl7XYWbV9V6O': ['allison', 'samantha', 'female'], // Cora (bright)
      'onwK4e9ZLuTAKqWW03F9': ['samantha', 'allison', 'female'], // Domi (sultry)
      'ZQe5CZNOzWyzPSCn5a3a': ['monica', 'isabella', 'es'], // Ana (Spanish)
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
    // Stop any previous audio
    try {
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }
    } catch {}
    const audio = new Audio(url);
    currentAudio = audio;
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
      if (currentAudio === audio) currentAudio = null;
    };
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);
    audio.play().catch(onError);
  });
} 