import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';

export interface VoiceResult {
  text: string;
  confidence: number;
}

// MVP: Use device speech recognition
// Note: Expo Speech is for TTS, not STT. For MVP, we'll use a placeholder.
// In production, integrate with a speech-to-text service (Google Speech-to-Text, etc.)
export const startVoiceRecognition = async (): Promise<{
  stop: () => Promise<VoiceResult>;
  isListening: boolean;
}> => {
  // Request microphone permission
  const { status } = await Audio.requestPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Microphone permission not granted');
  }

  // MVP: Return mock implementation
  // In production, use a real speech-to-text service
  // For web: Use Web Speech API if available
  // For mobile: Integrate with native speech recognition (expo-speech-recognition or similar)
  let isListening = true;
  let transcript = '';

  // Try to use Web Speech API if available (for web platform)
  if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    return new Promise((resolve, reject) => {
      recognition.onstart = () => {
        isListening = true;
      };

      recognition.onresult = (event: any) => {
        transcript = event.results[0][0].transcript;
      };

      recognition.onerror = (event: any) => {
        isListening = false;
        reject(new Error(`Speech recognition error: ${event.error}`));
      };

      recognition.onend = () => {
        isListening = false;
      };

      const stop = async (): Promise<VoiceResult> => {
        recognition.stop();
        isListening = false;
        
        return {
          text: transcript || 'Remind me to call the dentist tomorrow at 2 PM',
          confidence: transcript ? 0.9 : 0.5,
        };
      };

      try {
        recognition.start();
        resolve({ stop, isListening: true });
      } catch (error) {
        reject(error);
      }
    });
  }

  // Fallback: Mock implementation for mobile or when Web Speech API is not available
  // Simulate listening with a delay to make it feel more real
  const stop = async (): Promise<VoiceResult> => {
    isListening = false;
    
    // Mock transcript - in production, return actual transcription
    // For now, return a placeholder that the user can edit
    return {
      text: transcript || 'Remind me to call the dentist tomorrow at 2 PM',
      confidence: transcript ? 0.95 : 0.5,
    };
  };

  return { stop, isListening: true };
};

// Text-to-speech helper
export const speak = (text: string): void => {
  Speech.speak(text, {
    language: 'en',
    pitch: 1.0,
    rate: 1.0,
  });
};

