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
  'kdmDKE6EkgrWrrykO9Qt': { stability: 0.60, similarity_boost: 0.90, style: 0.30, use_speaker_boost: true }, // Alexandra - super realistic, young female
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

// Process text for better speech synthesis - FIXED VERSION
export function processTextForSpeech(text: string): string {
  // Handle undefined or null text
  if (!text || typeof text !== 'string') {
    return 'Hello! I am your AI companion.';
  }
  
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

// Stop all current speech
export function stopAllSpeech(): void {
  console.log('🛑 Stopping all TTS');
  
  // Stop current audio
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
  
  // Stop browser TTS
  if ('speechSynthesis' in window) {
    speechSynthesis.cancel();
  }
  
  // Reset flags
  isSpeaking = false;
  currentSpeechPromise = null;
  
  // Set global flags
  if (typeof window !== "undefined") {
    (window as any).isSpeaking = false;
    (window as any).currentSpeechPromise = null;
  }
  
  console.log('🔓 SPEECH LOCK RELEASED');
}

// Main function to speak text using ElevenLabs - ENHANCED VERSION
export async function speakText(
  text: string, 
  voiceId: string = 'EXAVITQu4vr4xnSDxMaL', // Default to Luna (female)
  settings?: ElevenLabsSettings
): Promise<void> {
  // Handle undefined text
  if (!text || typeof text !== 'string') {
    text = 'Hello! I am your AI companion.';
  }
  
  console.log('🎤 Speaking text:', text.substring(0, Math.min(50, text.length)) + '...', 'Voice ID:', voiceId);
  
  // Stop any current speech to prevent overlapping
  stopAllSpeech();
  
  // Set speaking flag
  isSpeaking = true;
  if (typeof window !== "undefined") {
    (window as any).isSpeaking = true;
  }
  
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
            voiceId: voiceId,
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
          currentAudio = audio;
          
          // Set up audio event handlers
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
          
          // Handle autoplay policy issues
          try {
            console.log('🎵 Attempting to play audio...');
            await audio.play();
            console.log('🎵 Audio playback started successfully');
          } catch (playError) {
            console.warn('⚠️ Autoplay blocked, trying to enable audio:', playError);
            // Try to enable audio by setting volume and trying again
            audio.volume = 0.1;
            try {
              await audio.play();
              console.log('🎵 Audio playback started after volume adjustment');
            } catch (secondError) {
              console.error('❌ Audio playback failed completely:', secondError);
              // Fall back to browser TTS
              console.log('🔄 Falling back to browser TTS due to audio playback failure');
              await fallbackTTS(processedText, voiceId);
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

    // If all endpoints fail, fall back to browser TTS
    console.log('🔄 Falling back to browser TTS');
    await fallbackTTS(processedText, voiceId);
    
  } catch (error) {
    console.error('❌ TTS Error:', error);
    console.log('🔄 Falling back to browser TTS');
    await fallbackTTS(processedText, voiceId);
  } finally {
    // Release speech lock
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

  // Map voice IDs to browser voices - FEMALE ONLY
  const voiceMap: Record<string, string> = {
    'EXAVITQu4vr4xnSDxMaL': 'Samantha', // Luna (Sarah)
    '21m00Tcm4TlvDq8ikWAM': 'Samantha', // Bonquisha (Rachel)
    'AZnzlk1XvdvUeBnXmlld': 'Samantha', // Bella
    'ErXwobaYiN019PkySvjV': 'Samantha', // Elli
    'pNInz6obpgDQGcFmaJgB': 'Samantha', // Olivia
    'onwK4e9ZLuTAKqWW03F9': 'Samantha', // Domi
    'kdmDKE6EkgrWrrykO9Qt': 'Samantha', // Emily
    'XrExE9yKIg1WjnnlVkGX': 'Samantha', // Matilda
    'CYw3kZ02Hs0563khs1Fj': 'Samantha', // Nova
    'XB0fDUnXU5powFXDhCwa': 'Samantha', // Charlotte
    'VR6AewLTigWG4xSOukaG': 'Samantha', // Lily
    'pqHfZKP75CvOlQylNhV4': 'Samantha', // Bella
    'g6xIsTj2HwM6VR4iXFCw': 'Samantha', // Jessica Anne Bogart
    'OYTbf65OHHFELVut7v2H': 'Samantha', // Hope
    'dj3G1R1ilKoFKhBnWOzG': 'Samantha', // Eryn
    'PT4nqlKZfc06VW1BuClj': 'Samantha', // Angela
    '56AoDkrOh6qfVPDXZ7Pt': 'Samantha'  // Cassidy
  };

  const browserVoice = voiceMap[voiceId] || 'Samantha';
  
  console.log('🔄 Falling back to browser TTS');
  
  return new Promise((resolve) => {
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set voice
    const voices = speechSynthesis.getVoices();
    const selectedVoice = voices.find(voice => 
      voice.name.includes(browserVoice) || 
      voice.name.includes('Samantha') ||
      voice.name.includes('Female')
    );
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
      console.log('🎤 Using voice:', selectedVoice.name);
    } else {
      console.log('🎤 Using voice: Samantha');
    }
    
    // Set speech parameters
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
