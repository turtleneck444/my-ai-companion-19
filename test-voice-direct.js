// Test voice functionality directly
import { speakText } from './src/lib/voice.js';

async function testVoice() {
  console.log('🎤 Testing voice functionality...');
  
  try {
    await speakText('Hello! This is a test of the voice call functionality. Can you hear me clearly?', 'kdmDKE6EkgrWrrykO9Qt');
    console.log('✅ Voice test completed successfully!');
  } catch (error) {
    console.error('❌ Voice test failed:', error);
  }
}

testVoice();
