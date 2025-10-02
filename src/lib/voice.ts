// Voice utilities for ElevenLabs TTS integration - FEMALE VOICES ONLY
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

// FEMALE VOICE PRESETS ONLY - All confirmed female voices
const VOICE_PRESETS: Record<string, ElevenLabsSettings> = {
  'EXAVITQu4vr4xnSDxMaL': { stability: 0.75, similarity_boost: 0.75, style: 0.0, use_speaker_boost: true }, // Luna (Sarah) - professional female
  '21m00Tcm4TlvDq8ikWAM': { stability: 0.50, similarity_boost: 0.75, style: 0.0, use_speaker_boost: true }, // Bonquisha (Rachel) - bold female
  'AZnzlk1XvdvUeBnXmlld': { stability: 0.60, similarity_boost: 0.80, style: 0.20, use_speaker_boost: true }, // Bella - seductive female
  'ErXwobaYiN019PkySvjV': { stability: 0.80, similarity_boost: 0.85, style: 0.10, use_speaker_boost: true }, // Elli - soft female
  'pNInz6obpgDQGcFmaJgB': { stability: 0.70, similarity_boost: 0.75, style: 0.15, use_speaker_boost: true }, // Olivia - cheerful female
  'onwK4e9ZLuTAKqWW03F9': { stability: 0.55, similarity_boost: 0.80, style: 0.25, use_speaker_boost: true }, // Domi - bold female
  'kdmDKE6EkgrWrrykO9Qt': { stability: 0.70, similarity_boost: 0.85, style: 0.20, use_speaker_boost: true }, // Emily - sophisticated female
  'XrExE9yKIg1WjnnlVkGX': { stability: 0.75, similarity_boost: 0.90, style: 0.15, use_speaker_boost: true }, // Matilda - sweet female
  'CYw3kZ02Hs0563khs1Fj': { stability: 0.65, similarity_boost: 0.80, style: 0.20, use_speaker_boost: true }, // Nova - modern female
  'XB0fDUnXU5powFXDhCwa': { stability: 0.80, similarity_boost: 0.85, style: 0.10, use_speaker_boost: true }, // Charlotte - calm female
  'VR6AewLTigWG4xSOukaG': { stability: 0.75, similarity_boost: 0.85, style: 0.15, use_speaker_boost: true }, // Lily - sweet female
  'pqHfZKP75CvOlQylNhV4': { stability: 0.70, similarity_boost: 0.80, style: 0.25, use_speaker_boost: true }, // Bella - seductive female
  'g6xIsTj2HwM6VR4iXFCw': { stability: 0.65, similarity_boost: 0.85, style: 0.25, use_speaker_boost: true }, // Jessica Anne Bogart - empathetic
  'OYTbf65OHHFELVut7v2H': { stability: 0.70, similarity_boost: 0.80, style: 0.20, use_speaker_boost: true }, // Hope - bright and uplifting
  'dj3G1R1ilKoFKhBnWOzG': { stability: 0.60, similarity_boost: 0.85, style: 0.25, use_speaker_boost: true }, // Eryn - friendly and relatable
  'PT4nqlKZfc06VW1BuClj': { stability: 0.55, similarity_boost: 0.80, style: 0.30, use_speaker_boost: true }, // Angela - raw and relatable
  '56AoDkrOh6qfVPDXZ7Pt': { stability: 0.65, similarity_boost: 0.85, style: 0.35, use_speaker_boost: true } // Cassidy - engaging and energetic
};

// Default voice settings
const DEFAULT_VOICE_SETTINGS: ElevenLabsSettings = {
  stability: 0.75,
  similarity_boost: 0.75,
  style: 0.0,
  use_speaker_boost: true
};

// Global speech control
let isSpeaking = false;
let currentSpeechPromise: Promise<void> | null = null;
let currentAudio: HTMLAudioElement | null = null;

// Get voice settings for a specific voice ID
export function getVoiceSettings(voiceId: string): ElevenLabsSettings {
  return VOICE_PRESETS[voiceId] || DEFAULT_VOICE_SETTINGS;
}

// Process text for better speech synthesis
export function processTextForSpeech(text: string): string {
  if (!text || typeof text !== 'string') {
    return 'Hello! I am your AI companion.';
  }
  
  if (text.length < 50) {
    return text;
  }
  
  let processed = text
    .replace(/[.]{2,}/g, '.')
    .replace(/[!]{2,}/g, '!')
    .replace(/[?]{2,}/g, '?')
    .replace(/\s+/g, ' ')
    .trim();

  processed = processed
    .replace(/\.\s+/g, '. ')
    .replace(/,\s+/g, ', ')
    .replace(/!\s+/g, '! ')
    .replace(/\?\s+/g, '? ');

  return processed;
}

// Stop all current speech
export function stopAllSpeech(): void {
  console.log('🛑 Stopping all TTS');
  
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
  
  if ('speechSynthesis' in window) {
    speechSynthesis.cancel();
  }
  
  isSpeaking = false;
  currentSpeechPromise = null;
  
  if (typeof window !== "undefined") {
    (window as any).isSpeaking = false;
    (window as any).currentSpeechPromise = null;
  }
  
  console.log('🔓 SPEECH LOCK RELEASED');
}

// Main function to speak text using ElevenLabs - FEMALE VOICES ONLY
export async function speakText(
  text: string, 
  voiceId: string = 'EXAVITQu4vr4xnSDxMaL', // Default to Luna (female)
  settings?: ElevenLabsSettings
): Promise<void> {
  if (!text || typeof text !== 'string') {
    text = 'Hello! I am your AI companion.';
  }
  
  console.log('🎤 Speaking text:', text.substring(0, Math.min(50, text.length)) + '...', 'Voice ID:', voiceId);
  
  // FEMALE VOICE VALIDATION
  const FEMALE_VOICES = [
    'EXAVITQu4vr4xnSDxMaL', '21m00Tcm4TlvDq8ikWAM', 'AZnzlk1XvdvUeBnXmlld',
    'ErXwobaYiN019PkySvjV', 'pNInz6obpgDQGcFmaJgB', 'onwK4e9ZLuTAKqWW03F9',
    'kdmDKE6EkgrWrrykO9Qt', 'XrExE9yKIg1WjnnlVkGX', 'CYw3kZ02Hs0563khs1Fj',
    'XB0fDUnXU5powFXDhCwa', 'VR6AewLTigWG4xSOukaG', 'pqHfZKP75CvOlQylNhV4',
    'g6xIsTj2HwM6VR4iXFCw', 'OYTbf65OHHFELVut7v2H', 'dj3G1R1ilKoFKhBnWOzG',
    'PT4nqlKZfc06VW1BuClj', '56AoDkrOh6qfVPDXZ7Pt'
  ];

  // Ensure only female voices are used
  const validatedVoiceId = FEMALE_VOICES.includes(voiceId) ? voiceId : 'EXAVITQu4vr4xnSDxMaL';
  
  if (voiceId !== validatedVoiceId) {
    console.log('⚠️ Invalid voice ID, using female fallback:', validatedVoiceId);
  }
  
  stopAllSpeech();
  
  isSpeaking = true;
  if (typeof window !== "undefined") {
    (window as any).isSpeaking = true;
  }
  
  const processedText = processTextForSpeech(text);
  const voiceSettings = settings || getVoiceSettings(validatedVoiceId);
  
  console.log(' Voice settings:', voiceSettings);

  try {
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
            voiceId: validatedVoiceId,
            voice_id: validatedVoiceId,
            voice_settings: voiceSettings,
            model_id: 'eleven_multilingual_v2'
          })
        });

        if (response.ok) {
          console.log(`✅ Success with endpoint: ${endpoint}`);
          const audioBlob = await response.blob();
          console.log('📦 Received audio blob:', audioBlob.size, 'bytes');
          
          const audioUrl = URL.createObjectURL(audioBlob);
          const audio = new Audio(audioUrl);
          currentAudio = audio;
          
          audio.onended = () => {
            URL.revokeObjectURL(audioUrl);
            currentAudio = null;
            isSpeaking = false;
            if (typeof window !== "undefined") {
              (window as any).isSpeaking = false;
            }
            console.log('🔊 Audio playback completed');
            console.log('🔓 SPEECH LOCK RELEASED');
          };
          
          audio.onerror = (error) => {
            console.error('❌ Audio playback error:', error);
            URL.revokeObjectURL(audioUrl);
            currentAudio = null;
            isSpeaking = false;
            if (typeof window !== "undefined") {
              (window as any).isSpeaking = false;
            }
          };
          
          try {
            console.log('🎵 Attempting to play audio...');
            await audio.play();
            console.log('🎵 Audio playback started successfully');
          } catch (playError) {
            console.warn('⚠️ Autoplay blocked, trying to enable audio:', playError);
            audio.volume = 0.1;
            try {
              await audio.play();
              console.log('🎵 Audio playback started after volume adjustment');
            } catch (secondError) {
              console.error('❌ Audio playback failed completely:', secondError);
              console.log('🔄 Falling back to browser TTS due to audio playback failure');
              await fallbackTTS(processedText, validatedVoiceId);
            }
          }
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

    console.log('🔄 Falling back to browser TTS');
    await fallbackTTS(processedText, validatedVoiceId);
    
  } catch (error) {
    console.error('❌ TTS Error:', error);
    console.log('🔄 Falling back to browser TTS');
    await fallbackTTS(processedText, validatedVoiceId);
  } finally {
    isSpeaking = false;
    if (typeof window !== "undefined") {
      (window as any).isSpeaking = false;
    }
    console.log('🔓 SPEECH LOCK RELEASED');
  }
}

// Fallback to browser TTS - FEMALE VOICES ONLY
async function fallbackTTS(text: string, voiceId: string): Promise<void> {
  if (!('speechSynthesis' in window)) {
    console.error('❌ Speech synthesis not supported');
    return;
  }

  console.log('🔄 Falling back to browser TTS');
  
  return new Promise((resolve) => {
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Get available voices and find female voices
    const voices = speechSynthesis.getVoices();
    const femaleVoices = voices.filter(voice => 
      voice.name.toLowerCase().includes('female') ||
      voice.name.toLowerCase().includes('woman') ||
      voice.name.toLowerCase().includes('samantha') ||
      voice.name.toLowerCase().includes('karen') ||
      voice.name.toLowerCase().includes('susan') ||
      voice.name.toLowerCase().includes('zira') ||
      voice.name.toLowerCase().includes('hazel') ||
      voice.name.toLowerCase().includes('susan') ||
      voice.name.toLowerCase().includes('victoria') ||
      voice.name.toLowerCase().includes('samantha')
    );
    
    // Use first available female voice, or default to Samantha
    const selectedVoice = femaleVoices.length > 0 ? femaleVoices[0] : 
      voices.find(voice => voice.name.includes('Samantha')) || voices[0];
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
      console.log('🎤 Using FEMALE voice:', selectedVoice.name);
    } else {
      console.log('🎤 Using default voice (should be female)');
    }
    
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 0.8;
    
    utterance.onend = () => {
      console.log('🔊 Fallback TTS completed');
      isSpeaking = false;
      if (typeof window !== "undefined") {
        (window as any).isSpeaking = false;
      }
      console.log('🔓 SPEECH LOCK RELEASED (fallback)');
      resolve();
    };
    
    utterance.onerror = (event) => {
      console.error('❌ Fallback TTS error:', event);
      isSpeaking = false;
      if (typeof window !== "undefined") {
        (window as any).isSpeaking = false;
      }
      console.log('🔓 SPEECH LOCK RELEASED (fallback)');
      resolve();
    };
    
    speechSynthesis.speak(utterance);
  });
}

// Test voice function
export async function testVoice(voiceId: string, text: string = "Hello! I'm your AI companion."): Promise<void> {
  console.log('🧪 Testing voice:', voiceId, 'with text:', text);
  await speakText(text, voiceId);
}
