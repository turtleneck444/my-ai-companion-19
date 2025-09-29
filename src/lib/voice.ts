// Voice utilities for ElevenLabs TTS integration
import { supabase } from '@/integrations/supabase/client';

export interface ElevenLabsSettings {
  stability: number;
  similarity_boost: number;
  style?: number;
  use_speaker_boost?: boolean;
}

export interface VoiceCallSettings {
  voiceId: string;
  settings: ElevenLabsSettings;
  modelId?: string;
}

// Voice presets for different personalities - ALL SEDUCTIVE FEMALE VOICES
const VOICE_PRESETS: Record<string, ElevenLabsSettings> = {
  'EXAVITQu4vr4xnSDxMaL': { stability: 0.75, similarity_boost: 0.75, style: 0.0, use_speaker_boost: true }, // Luna (Sarah) - professional
  '21m00Tcm4TlvDq8ikWAM': { stability: 0.50, similarity_boost: 0.75, style: 0.0, use_speaker_boost: true }, // Bonquisha (Rachel) - bold
  'AZnzlk1XvdvUeBnXmlld': { stability: 0.60, similarity_boost: 0.80, style: 0.20, use_speaker_boost: true }, // Bella - seductive and playful
  'ErXwobaYiN019PkySvjV': { stability: 0.80, similarity_boost: 0.85, style: 0.10, use_speaker_boost: true }, // Elli - soft and seductive
  'pNInz6obpgDQGcFmaJgB': { stability: 0.70, similarity_boost: 0.75, style: 0.15, use_speaker_boost: true }, // Olivia - cheerful and seductive
  'onwK4e9ZLuTAKqWW03F9': { stability: 0.55, similarity_boost: 0.80, style: 0.25, use_speaker_boost: true }, // Domi - bold and seductive
  'kdmDKE6EkgrWrrykO9Qt': { stability: 0.70, similarity_boost: 0.85, style: 0.20, use_speaker_boost: true }, // Emily - sophisticated and seductive
  'XrExE9yKIg1WjnnlVkGX': { stability: 0.75, similarity_boost: 0.90, style: 0.15, use_speaker_boost: true }, // Matilda - sweet and seductive
  'CYw3kZ02Hs0563khs1Fj': { stability: 0.65, similarity_boost: 0.80, style: 0.20, use_speaker_boost: true }, // Nova - modern and seductive
  'XB0fDUnXU5powFXDhCwa': { stability: 0.80, similarity_boost: 0.85, style: 0.10, use_speaker_boost: true }, // Charlotte - calm and seductive
  'VR6AewLTigWG4xSOukaG': { stability: 0.75, similarity_boost: 0.85, style: 0.15, use_speaker_boost: true }, // Lily - sweet and seductive
  'pqHfZKP75CvOlQylNhV4': { stability: 0.70, similarity_boost: 0.80, style: 0.25, use_speaker_boost: true }, // Bella - seductive and mysterious
};

// Default voice settings
const DEFAULT_VOICE_SETTINGS: ElevenLabsSettings = {
  stability: 0.75,
  similarity_boost: 0.75,
  style: 0.0,
  use_speaker_boost: true
};

// Get voice settings for a specific voice ID
export function getVoiceSettings(voiceId: string): ElevenLabsSettings {
  return VOICE_PRESETS[voiceId] || DEFAULT_VOICE_SETTINGS;
}

// Process text for better speech synthesis
export function processTextForSpeech(text: string): string {
  // Skip complex processing for short texts to save credits
  if (text.length < 50) {
    return text;
  }
  
  // Remove excessive punctuation and normalize spacing
  let processed = text
    .replace(/[.]{2,}/g, '.') // Replace multiple periods with single
    .replace(/[!]{2,}/g, '!') // Replace multiple exclamations with single
    .replace(/[?]{2,}/g, '?') // Replace multiple questions with single
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();

  // Add natural pauses for better speech flow
  processed = processed
    .replace(/\.\s+/g, '. ') // Ensure space after periods
    .replace(/,\s+/g, ', ') // Ensure space after commas
    .replace(/!\s+/g, '! ') // Ensure space after exclamations
    .replace(/\?\s+/g, '? '); // Ensure space after questions

  return processed;
}

// Main function to speak text using ElevenLabs
export async function speakText(
  text: string, 
  voiceId: string = 'EXAVITQu4vr4xnSDxMaL', // Default to Luna
  settings?: ElevenLabsSettings
): Promise<void> {
  console.log('🎤 Speaking text:', text.substring(0, 50) + '...', 'Voice ID:', voiceId);
  
  // Stop any current speech
  stopAllSpeech();
  
  const processedText = processTextForSpeech(text);
  const voiceSettings = settings || getVoiceSettings(voiceId);
  
  console.log(' Voice settings:', voiceSettings);

  try {
    // Try local API first, then Netlify function
    const endpoints = [
      '/api/elevenlabs-tts',
      '/.netlify/functions/elevenlabs-tts'
    ];

    for (const endpoint of endpoints) {
      try {
        console.log(`🌐 Trying endpoint: ${endpoint}`);
        
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: processedText,
            voice_id: voiceId,
            voice_settings: voiceSettings,
            model_id: 'eleven_multilingual_v2'
          })
        });

        if (response.ok) {
          console.log(`✅ Success with endpoint: ${endpoint}`);
          const audioBlob = await response.blob();
          console.log('📦 Received audio blob:', audioBlob.size, 'bytes');
          
          // Create audio element and play
          const audioUrl = URL.createObjectURL(audioBlob);
          const audio = new Audio(audioUrl);
          
          // Set up audio event handlers
          audio.onended = () => {
            URL.revokeObjectURL(audioUrl);
            console.log('🔊 Audio playback completed');
          };
          
          audio.onerror = (error) => {
            console.error('❌ Audio playback error:', error);
            URL.revokeObjectURL(audioUrl);
          };
          
          // Play the audio
          await audio.play();
          console.log('🎵 Audio playback started');
          return;
        } else {
          console.warn(`⚠️ Endpoint failed: ${endpoint} ${response.status}`);
          const errorText = await response.text();
          console.warn('Error details:', errorText);
        }
      } catch (error) {
        console.warn(`⚠️ Endpoint failed: ${endpoint}`, error);
      }
    }

    // If all endpoints fail, fall back to browser TTS
    console.log('🔄 Falling back to browser TTS');
    await fallbackTTS(processedText, voiceId);
    
  } catch (error) {
    console.error('❌ TTS Error:', error);
    console.log('🔄 Falling back to browser TTS');
    await fallbackTTS(processedText, voiceId);
  }
}

// Fallback to browser TTS
async function fallbackTTS(text: string, voiceId: string): Promise<void> {
  if (!('speechSynthesis' in window)) {
    console.error('❌ Speech synthesis not supported');
    return;
  }

  // Map voice IDs to browser voices
  const voiceMap: Record<string, string> = {
    'EXAVITQu4vr4xnSDxMaL': 'Samantha',
    '21m00Tcm4TlvDq8ikWAM': 'Samantha',
    'AZnzlk1XvdvUeBnXmlld': 'Samantha',
    'ErXwobaYiN019PkySvjV': 'Samantha',
    'pNInz6obpgDQGcFmaJgB': 'Samantha',
    'onwK4e9ZLuTAKqWW03F9': 'Samantha',
    'kdmDKE6EkgrWrrykO9Qt': 'Samantha',
    'XrExE9yKIg1WjnnlVkGX': 'Samantha',
    'CYw3kZ02Hs0563khs1Fj': 'Samantha',
    'XB0fDUnXU5powFXDhCwa': 'Samantha',
    'VR6AewLTigWG4xSOukaG': 'Samantha',
    'pqHfZKP75CvOlQylNhV4': 'Samantha'
  };

  const browserVoice = voiceMap[voiceId] || 'Samantha';
  console.log('🎤 Using voice:', browserVoice);

  return new Promise((resolve) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = speechSynthesis.getVoices().find(voice => voice.name === browserVoice) || null;
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 0.8;

    utterance.onend = () => {
      console.log('🔊 Fallback TTS completed');
      resolve();
    };

    utterance.onerror = (error) => {
      console.error('❌ Fallback TTS error:', error);
      resolve();
    };

    speechSynthesis.speak(utterance);
  });
}

// Stop all current speech
export function stopAllSpeech(): void {
  console.log('🛑 Stopping all TTS');
  
  // Stop browser TTS
  if ('speechSynthesis' in window) {
    speechSynthesis.cancel();
  }
  
  // Stop any playing audio elements
  const audioElements = document.querySelectorAll('audio');
  audioElements.forEach(audio => {
    if (!audio.paused) {
      audio.pause();
      audio.currentTime = 0;
    }
  });
}

// Test voice function for previews
export async function testVoice(voiceId: string, text: string): Promise<void> {
  console.log('🧪 Testing voice:', voiceId, 'with text:', text);
  await speakText(text, voiceId);
}

// Voice call utilities
export async function startVoiceCall(characterId: string, voiceSettings: VoiceCallSettings): Promise<void> {
  try {
    // Track voice call usage
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('usage_tracking').upsert({
        user_id: user.id,
        date: new Date().toISOString().split('T')[0],
        voice_calls_made: 1
      }, {
        onConflict: 'user_id,date'
      });
    }
  } catch (error) {
    console.error('Error tracking voice call usage:', error);
  }
}

export async function endVoiceCall(): Promise<void> {
  stopAllSpeech();
}
