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
  let isListening = true;
  let transcript = '';

  // Simulate listening
  const stop = async (): Promise<VoiceResult> => {
    isListening = false;
    
    // Mock transcript - in production, return actual transcription
    // For now, return a placeholder that the user can edit
    return {
      text: transcript || 'Remind me to call the dentist tomorrow at 2 PM',
      confidence: 0.95,
    };
  };

  return { stop, isListening };
};

// Text-to-speech helper
export const speak = (text: string): void => {
  Speech.speak(text, {
    language: 'en',
    pitch: 1.0,
    rate: 1.0,
  });
};

