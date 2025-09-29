let playbackQueue: Promise<void> = Promise.resolve();
let currentAudio: HTMLAudioElement | null = null;
let isPlaying = false;

export interface ElevenLabsSettings {
  stability?: number;
  similarity_boost?: number;
  style?: number;
  use_speaker_boost?: boolean;
}

// Enhanced voice presets for much more natural, human-like speech
const VOICE_PRESETS: Record<string, ElevenLabsSettings> = {
  // Custom voices with optimal settings for natural conversation
  'NAW2WDhAioeiIYFXitBQ': { stability: 0.1, similarity_boost: 0.95, style: 0.8, use_speaker_boost: true }, // Your custom Luna voice - ultra natural
  'Qz1ptFvQEBIyY87QB6oV': { stability: 0.12, similarity_boost: 0.93, style: 0.85, use_speaker_boost: true }, // Bonquisha - bold & vibrant
  // Premium ElevenLabs Public Library Voices → ultra-realistic settings
  '21m00Tcm4TlvDq8ikWAM': { stability: 0.12, similarity_boost: 0.98, style: 0.88, use_speaker_boost: true }, // Rachel - warm & intimate
  'AZnzlk1XvdvUeBnXmlld': { stability: 0.15, similarity_boost: 0.97, style: 0.92, use_speaker_boost: true }, // Bella - energetic & playful
  'EXAVITQu4vr4xnSDxMaL': { stability: 0.18, similarity_boost: 0.96, style: 0.78, use_speaker_boost: true }, // Sarah - professional yet warm
  'ErXwobaYiN019PkySvjV': { stability: 0.08, similarity_boost: 0.99, style: 0.95, use_speaker_boost: true }, // Elli - ultra gentle & caring
  'pNInz6obpgDQGcFmaJgB': { stability: 0.13, similarity_boost: 0.98, style: 0.90, use_speaker_boost: true }, // Olivia - cheerful & uplifting
  'MF3mGyEYCl7XYWbV9V6O': { stability: 0.20, similarity_boost: 0.95, style: 0.82, use_speaker_boost: true }, // Cora - mature & wise
  'onwK4e9ZLuTAKqWW03F9': { stability: 0.16, similarity_boost: 0.97, style: 0.91, use_speaker_boost: true }, // Domi - confident & bold
  'kdmDKE6EkgrWrrykO9Qt': { stability: 0.14, similarity_boost: 0.98, style: 0.89, use_speaker_boost: true }, // Emily - sophisticated British
  'XrExE9yKIg1WjnnlVkGX': { stability: 0.11, similarity_boost: 0.99, style: 0.93, use_speaker_boost: true }, // Matilda - sweet & romantic
  'CYw3kZ02Hs0563khs1Fj': { stability: 0.17, similarity_boost: 0.96, style: 0.85, use_speaker_boost: true }, // Nova - modern & dynamic
  'XB0fDUnXU5powFXDhCwa': { stability: 0.19, similarity_boost: 0.97, style: 0.80, use_speaker_boost: true }, // Charlotte - calm & professional
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
    stability: override?.stability ?? persisted?.stability ?? preset?.stability ?? 0.15, // Much lower for natural variation
    similarity_boost: override?.similarity_boost ?? persisted?.similarity_boost ?? preset?.similarity_boost ?? 0.98, // Higher for consistency
    style: override?.style ?? persisted?.style ?? preset?.style ?? 0.85, // Much higher for expressiveness
    use_speaker_boost: override?.use_speaker_boost ?? persisted?.use_speaker_boost ?? preset?.use_speaker_boost ?? true,
  };
}

// Enhanced text processing for more natural speech
function processTextForSpeech(text: string): string {
  // For voice previews, use minimal processing to save credits
  if (text.length < 100) {
    return text; // Skip processing for short previews
  }
  
  // Add natural pauses and emphasis
  let processed = text
    // Add pauses after sentences
    .replace(/([.!?])\s+/g, '$1... ')
    // Add emphasis to important words
    .replace(/\b(amazing|incredible|wonderful|beautiful|love|adore|excited|happy|thrilled)\b/gi, '*$1*')
    // Add natural hesitations
    .replace(/\b(well|um|hmm|oh|wow|oh my)\b/gi, '$1...')
    // Add emotional expressions
    .replace(/\b(that's|that is)\b/gi, "that's")
    .replace(/\b(I'm|I am)\b/gi, "I'm")
    .replace(/\b(you're|you are)\b/gi, "you're")
    .replace(/\b(we're|we are)\b/gi, "we're")
    .replace(/\b(they're|they are)\b/gi, "they're");
  
  return processed;
}

export async function speakText(
  text: string,
  voiceId?: string,
  options?: { modelId?: string; voiceSettings?: ElevenLabsSettings }
): Promise<void> {
  console.log('🎤 Speaking text:', text.slice(0, 50) + '...', 'Voice ID:', voiceId);
  
  const task = async () => {
    try {
      // Stop any current audio
      stopAllTTS();
      
      // Process text for more natural speech
      const processedText = processTextForSpeech(text);
      
      // Resolve best-available settings for natural speech
      const settings = mergeSettings(voiceId, options?.voiceSettings);
      console.log('�� Voice settings:', settings);

      // Try multiple API endpoints for reliability
      const endpoints = [
        '/api/elevenlabs-tts',
        '/.netlify/functions/elevenlabs-tts'
      ];

      let response: Response | null = null;
      let lastError: Error | null = null;

      for (const endpoint of endpoints) {
        try {
          console.log('🌐 Trying endpoint:', endpoint);
          
          response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              text: processedText, // Use processed text
              voice_id: voiceId || '21m00Tcm4TlvDq8ikWAM',
              model_id: options?.modelId || 'eleven_multilingual_v2',
              voice_settings: settings
            }),
            signal: AbortSignal.timeout(25000) // Increased timeout for better quality
          });

          if (response.ok) {
            console.log('✅ Success with endpoint:', endpoint);
            break;
          } else {
            const errorText = await response.text();
            console.warn('⚠️ Endpoint failed:', endpoint, response.status, errorText);
            lastError = new Error(`Endpoint ${endpoint} failed: ${response.status} - ${errorText}`);
          }
        } catch (error) {
          console.warn('⚠️ Endpoint error:', endpoint, error);
          lastError = error as Error;
        }
      }

      if (!response || !response.ok) {
        throw lastError || new Error('All TTS endpoints failed');
      }

      const blob = await response.blob();
      console.log('📦 Received audio blob:', blob.size, 'bytes');
      
      if (blob.size === 0) {
        throw new Error('Empty audio response');
      }

      const url = URL.createObjectURL(blob);
      try {
        await playAudio(url);
        console.log('🔊 Audio playback completed');
      } finally {
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('❌ TTS Error:', error);
      
      // Enhanced fallback to browser TTS with better settings
      console.log('🔄 Falling back to browser TTS');
      await fallbackTTS(text);
    }
  };

  playbackQueue = playbackQueue.then(task).catch(async (e) => { 
    console.error('❌ Playback queue error:', e);
    throw e; 
  });
  return playbackQueue;
}

// Enhanced fallback to browser TTS with much better settings
async function fallbackTTS(text: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Much more natural settings
      utterance.rate = 0.85; // Slightly slower for natural speech
      utterance.pitch = 1.1; // Slightly higher pitch for female voices
      utterance.volume = 1.0;
      
      // Try to find the best female voice
      const voices = speechSynthesis.getVoices();
      const femaleVoices = voices.filter(voice => 
        voice.name.toLowerCase().includes('female') || 
        voice.name.toLowerCase().includes('woman') ||
        voice.name.toLowerCase().includes('zira') ||
        voice.name.toLowerCase().includes('susan') ||
        voice.name.toLowerCase().includes('hazel') ||
        voice.name.toLowerCase().includes('samantha') ||
        voice.name.toLowerCase().includes('karen') ||
        voice.name.toLowerCase().includes('victoria')
      );
      
      if (femaleVoices.length > 0) {
        // Choose the best female voice
        const bestVoice = femaleVoices.find(v => v.name.toLowerCase().includes('samantha')) ||
                         femaleVoices.find(v => v.name.toLowerCase().includes('zira')) ||
                         femaleVoices[0];
        utterance.voice = bestVoice;
        console.log('🎤 Using voice:', bestVoice?.name);
      }
      
      utterance.onend = () => {
        console.log('🔊 Fallback TTS completed');
        resolve();
      };
      
      utterance.onerror = (event) => {
        console.error('❌ Fallback TTS error:', event.error);
        reject(new Error(`Fallback TTS failed: ${event.error}`));
      };
      
      speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('❌ Fallback TTS setup error:', error);
      reject(error);
    }
  });
}

export function stopAllTTS(): void {
  console.log('🛑 Stopping all TTS');
  isPlaying = false;
  
  try { 
    speechSynthesis.cancel(); 
  } catch (error) {
    console.warn('⚠️ Error canceling speech synthesis:', error);
  }
  
  try {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      currentAudio = null;
    }
  } catch (error) {
    console.warn('⚠️ Error stopping audio:', error);
  }
}

function playAudio(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      // Stop any previous audio
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }
      
      const audio = new Audio(url);
      currentAudio = audio;
      isPlaying = true;
      
      const onEnded = () => {
        console.log('🔊 Audio playback ended');
        cleanup();
        isPlaying = false;
        resolve();
      };
      
      const onError = (event: any) => {
        console.error('❌ Audio playback error:', event);
        cleanup();
        isPlaying = false;
        reject(new Error('Audio playback failed'));
      };
      
      const onLoadStart = () => {
        console.log('🔄 Audio loading started');
      };
      
      const onCanPlay = () => {
        console.log('✅ Audio ready to play');
      };
      
      const cleanup = () => {
        audio.removeEventListener('ended', onEnded);
        audio.removeEventListener('error', onError);
        audio.removeEventListener('loadstart', onLoadStart);
        audio.removeEventListener('canplay', onCanPlay);
        if (currentAudio === audio) {
          currentAudio = null;
          isPlaying = false;
        }
      };
      
      audio.addEventListener('ended', onEnded);
      audio.addEventListener('error', onError);
      audio.addEventListener('loadstart', onLoadStart);
      audio.addEventListener('canplay', onCanPlay);
      
      // Enhanced audio properties for better quality
      audio.volume = 1.0;
      audio.preload = 'auto';
      
      console.log('🎵 Starting audio playback');
      audio.play().catch((error) => {
        console.error('❌ Audio play failed:', error);
        cleanup();
        isPlaying = false;
        reject(error);
      });
    } catch (error) {
      console.error('❌ Audio setup error:', error);
      isPlaying = false;
      reject(error);
    }
  });
}

// Check if TTS is currently playing
export function isTTSPlaying(): boolean {
  return isPlaying;
}

// Get available voices
export function getAvailableVoices(): SpeechSynthesisVoice[] {
  return speechSynthesis.getVoices();
}

// Test voice functionality with natural settings
export async function testVoice(voiceId?: string): Promise<boolean> {
  try {
    const testText = "Hello! I'm so excited to meet you! How are you doing today?";
    await speakText(testText, voiceId, {
      modelId: 'eleven_multilingual_v2',
      voiceSettings: {
        stability: 0.15,
        similarity_boost: 0.98,
        style: 0.85,
        use_speaker_boost: true
      }
    });
    return true;
  } catch (error) {
    console.error('Voice test failed:', error);
    return false;
  }
}

// Get natural voice settings based on conversation context
export function getNaturalVoiceSettings(context: 'excited' | 'calm' | 'intimate' | 'playful' | 'professional'): ElevenLabsSettings {
  const baseSettings = {
    stability: 0.15,
    similarity_boost: 0.98,
    style: 0.85,
    use_speaker_boost: true
  };

  switch (context) {
    case 'excited':
      return { ...baseSettings, stability: 0.12, style: 0.92 };
    case 'calm':
      return { ...baseSettings, stability: 0.18, style: 0.75 };
    case 'intimate':
      return { ...baseSettings, stability: 0.10, style: 0.95 };
    case 'playful':
      return { ...baseSettings, stability: 0.13, style: 0.90 };
    case 'professional':
      return { ...baseSettings, stability: 0.20, style: 0.70 };
    default:
      return baseSettings;
  }
}
