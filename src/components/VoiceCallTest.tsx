import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Mic, MicOff, Volume2, VolumeX, Play, Pause, Settings, CheckCircle, XCircle } from 'lucide-react';
import { speakText, stopAllTTS, testVoice, isTTSPlaying, getAvailableVoices } from '@/lib/voice';
import { useToast } from '@/hooks/use-toast';

export const VoiceCallTest = () => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [transcript, setTranscript] = useState('');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('21m00Tcm4TlvDq8ikWAM');
  const [testText, setTestText] = useState('Hello! This is a test of the voice call system. How does this sound?');
  
  const { toast } = useToast();

  useEffect(() => {
    // Load available voices
    const loadVoices = () => {
      const availableVoices = getAvailableVoices();
      setVoices(availableVoices);
      console.log('Available voices:', availableVoices);
    };

    loadVoices();
    
    // Load voices when they become available
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = loadVoices;
    }

    // Initialize speech recognition
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        console.log('Speech recognition started');
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        setTranscript(interimTranscript || finalTranscript);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        console.log('Speech recognition ended');
        setIsListening(false);
      };

      setRecognition(recognition);
    }
  }, []);

  const runAllTests = async () => {
    setIsRunningTests(true);
    setTestResults({});

    const tests = [
      { name: 'Browser TTS', test: () => testBrowserTTS() },
      { name: 'ElevenLabs TTS', test: () => testElevenLabsTTS() },
      { name: 'Speech Recognition', test: () => testSpeechRecognition() },
      { name: 'Audio Context', test: () => testAudioContext() },
      { name: 'Microphone Access', test: () => testMicrophoneAccess() }
    ];

    for (const { name, test } of tests) {
      try {
        console.log(`Running test: ${name}`);
        const result = await test();
        setTestResults(prev => ({ ...prev, [name]: result }));
        
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Test ${name} failed:`, error);
        setTestResults(prev => ({ ...prev, [name]: false }));
      }
    }

    setIsRunningTests(false);
  };

  const testBrowserTTS = async (): Promise<boolean> => {
    try {
      const utterance = new SpeechSynthesisUtterance('Browser TTS test');
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 0.5;
      
      return new Promise((resolve) => {
        utterance.onend = () => resolve(true);
        utterance.onerror = () => resolve(false);
        speechSynthesis.speak(utterance);
      });
    } catch (error) {
      console.error('Browser TTS test failed:', error);
      return false;
    }
  };

  const testElevenLabsTTS = async (): Promise<boolean> => {
    try {
      await testVoice(selectedVoice);
      return true;
    } catch (error) {
      console.error('ElevenLabs TTS test failed:', error);
      return false;
    }
  };

  const testSpeechRecognition = async (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!recognition) {
        resolve(false);
        return;
      }

      const timeout = setTimeout(() => {
        recognition.stop();
        resolve(false);
      }, 5000);

      recognition.onresult = () => {
        clearTimeout(timeout);
        recognition.stop();
        resolve(true);
      };

      recognition.onerror = () => {
        clearTimeout(timeout);
        resolve(false);
      };

      try {
        recognition.start();
      } catch (error) {
        clearTimeout(timeout);
        resolve(false);
      }
    });
  };

  const testAudioContext = async (): Promise<boolean> => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      return audioContext.state === 'running' || audioContext.state === 'suspended';
    } catch (error) {
      console.error('Audio context test failed:', error);
      return false;
    }
  };

  const testMicrophoneAccess = async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error('Microphone access test failed:', error);
      return false;
    }
  };

  const startListening = () => {
    if (recognition) {
      try {
        recognition.start();
        toast({ title: 'Listening...', description: 'Speak now!' });
      } catch (error) {
        toast({ title: 'Error', description: 'Failed to start listening', variant: 'destructive' });
      }
    }
  };

  const stopListening = () => {
    if (recognition) {
      recognition.stop();
    }
  };

  const speakTestText = async () => {
    try {
      setIsSpeaking(true);
      await speakText(testText, selectedVoice);
      toast({ title: 'Speaking...', description: 'Playing test audio' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to speak text', variant: 'destructive' });
    } finally {
      setIsSpeaking(false);
    }
  };

  const stopSpeaking = () => {
    stopAllTTS();
    setIsSpeaking(false);
  };

  const passedTests = Object.values(testResults).filter(Boolean).length;
  const totalTests = Object.keys(testResults).length;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Voice Call System Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Test Controls */}
          <div className="flex items-center gap-4">
            <Button
              onClick={runAllTests}
              disabled={isRunningTests}
              className="flex items-center gap-2"
            >
              {isRunningTests ? 'Running Tests...' : 'Run All Tests'}
            </Button>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Results:</span>
              <Badge variant={passedTests === totalTests && totalTests > 0 ? 'default' : 'secondary'}>
                {passedTests}/{totalTests} passed
              </Badge>
            </div>
          </div>

          {/* Test Results */}
          {Object.keys(testResults).length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(testResults).map(([testName, passed]) => (
                <div key={testName} className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="font-medium">{testName}</span>
                  <div className="flex items-center gap-2">
                    {passed ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                    <Badge variant={passed ? 'default' : 'destructive'}>
                      {passed ? 'Passed' : 'Failed'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Voice Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Voice Settings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Test Text</label>
                <textarea
                  value={testText}
                  onChange={(e) => setTestText(e.target.value)}
                  className="w-full p-2 border rounded-md"
                  rows={3}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Voice ID</label>
                <input
                  type="text"
                  value={selectedVoice}
                  onChange={(e) => setSelectedVoice(e.target.value)}
                  className="w-full p-2 border rounded-md"
                  placeholder="21m00Tcm4TlvDq8ikWAM"
                />
              </div>
            </div>

            {/* Voice Controls */}
            <div className="flex items-center gap-4">
              <Button
                onClick={speakTestText}
                disabled={isSpeaking}
                className="flex items-center gap-2"
              >
                {isSpeaking ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {isSpeaking ? 'Speaking...' : 'Speak Text'}
              </Button>
              
              <Button
                onClick={stopSpeaking}
                disabled={!isSpeaking}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Pause className="w-4 h-4" />
                Stop
              </Button>
            </div>
          </div>

          {/* Speech Recognition Test */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Speech Recognition Test</h3>
            
            <div className="flex items-center gap-4">
              <Button
                onClick={isListening ? stopListening : startListening}
                variant={isListening ? 'destructive' : 'default'}
                className="flex items-center gap-2"
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                {isListening ? 'Stop Listening' : 'Start Listening'}
              </Button>
              
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${isListening ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                <span className="text-sm text-muted-foreground">
                  {isListening ? 'Listening...' : 'Not listening'}
                </span>
              </div>
            </div>

            {transcript && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm">
                  <strong>Transcript:</strong> {transcript}
                </p>
              </div>
            )}
          </div>

          {/* Browser Voices */}
          {voices.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Available Browser Voices</h3>
              <div className="max-h-40 overflow-y-auto space-y-2">
                {voices.map((voice, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <span className="font-medium">{voice.name}</span>
                      <span className="text-sm text-muted-foreground ml-2">
                        ({voice.lang})
                      </span>
                    </div>
                    <Badge variant="outline">
                      {voice.default ? 'Default' : 'Available'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status Indicators */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 border rounded-lg">
              <div className={`w-4 h-4 rounded-full mx-auto mb-2 ${isSpeaking ? 'bg-green-500' : 'bg-gray-300'}`} />
              <p className="text-sm font-medium">TTS Playing</p>
            </div>
            
            <div className="text-center p-3 border rounded-lg">
              <div className={`w-4 h-4 rounded-full mx-auto mb-2 ${isListening ? 'bg-blue-500' : 'bg-gray-300'}`} />
              <p className="text-sm font-medium">Listening</p>
            </div>
            
            <div className="text-center p-3 border rounded-lg">
              <div className={`w-4 h-4 rounded-full mx-auto mb-2 ${recognition ? 'bg-green-500' : 'bg-red-500'}`} />
              <p className="text-sm font-medium">Recognition</p>
            </div>
            
            <div className="text-center p-3 border rounded-lg">
              <div className={`w-4 h-4 rounded-full mx-auto mb-2 ${voices.length > 0 ? 'bg-green-500' : 'bg-red-500'}`} />
              <p className="text-sm font-medium">Voices</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
