// Voice utility for better text-to-speech with female voice preference
// Provides consistent, elderly-friendly voice settings across the app

export interface VoiceSettings {
  rate: number;
  pitch: number;
  volume: number;
  voice: SpeechSynthesisVoice | null;
}

let availableVoices: SpeechSynthesisVoice[] = [];
let voicesLoaded = false;

// Load available voices (async operation in some browsers)
const loadVoices = (): Promise<SpeechSynthesisVoice[]> => {
  return new Promise((resolve) => {
    if (voicesLoaded && availableVoices.length > 0) {
      resolve(availableVoices);
      return;
    }

    const getVoices = () => {
      availableVoices = speechSynthesis.getVoices();
      if (availableVoices.length > 0) {
        voicesLoaded = true;
        resolve(availableVoices);
      }
    };

    getVoices();

    // Some browsers load voices asynchronously
    if (availableVoices.length === 0) {
      speechSynthesis.addEventListener('voiceschanged', getVoices, { once: true });
    }
  });
};

// Find the best female voice available
const findFemaleVoice = (voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null => {
  // Priority order for female voices (Indian voices first, then others)
  const femaleVoicePreferences = [
    // Indian English voices (prioritized for cultural relevance)
    'Google Hindi Female',
    'Google English (India) Female',
    'Google Indian English Female',
    'Microsoft Heera Desktop',
    'Microsoft Heera',
    'Microsoft Ravi Desktop',
    'Microsoft Ravi',
    'Indian English Female',
    'Hindi Female',
    
    // Google voices (usually highest quality)
    'Google UK English Female',
    'Google US English Female', 
    'Google English Female',
    
    // Microsoft voices (Windows)
    'Microsoft Zira Desktop',
    'Microsoft Zira',
    'Microsoft Hazel Desktop',
    'Microsoft Hazel',
    
    // macOS voices
    'Samantha',
    'Victoria',
    'Allison',
    'Ava',
    'Susan',
    'Vicki',
    
    // General pattern matching for female voices
    'Female',
    'Woman',
  ];

  // Try exact matches first
  for (const preference of femaleVoicePreferences) {
    const voice = voices.find(v => v.name === preference);
    if (voice) {
      console.log('Selected exact match female voice:', voice.name);
      return voice;
    }
  }

  // Try partial matches (case-insensitive)
  for (const preference of femaleVoicePreferences) {
    const voice = voices.find(v => 
      v.name.toLowerCase().includes(preference.toLowerCase())
    );
    if (voice) {
      console.log('Selected partial match female voice:', voice.name);
      return voice;
    }
  }

  // Fallback: look for Indian or female voices by pattern matching
  const indianVoice = voices.find(v => 
    v.name.toLowerCase().includes('indian') ||
    v.name.toLowerCase().includes('hindi') ||
    v.name.toLowerCase().includes('heera') ||
    v.name.toLowerCase().includes('ravi') ||
    v.lang.toLowerCase().includes('hi') || // Hindi language code
    v.lang.toLowerCase().includes('in') // India region code
  );
  
  if (indianVoice) {
    console.log('Selected Indian voice:', indianVoice.name);
    return indianVoice;
  }
  
  // Final fallback: look for any voice with "female" in the name
  const femaleVoice = voices.find(v => 
    v.name.toLowerCase().includes('female') ||
    v.name.toLowerCase().includes('woman') ||
    v.name.toLowerCase().includes('she')
  );
  
  if (femaleVoice) {
    console.log('Selected fallback female voice:', femaleVoice.name);
    return femaleVoice;
  }

  // Last resort: use default voice
  console.log('No female voice found, using default voice');
  return voices[0] || null;
};

// Get optimal voice settings for elderly users
export const getVoiceSettings = async (elderlyMode: boolean = false): Promise<VoiceSettings> => {
  const voices = await loadVoices();
  const femaleVoice = findFemaleVoice(voices);

  return {
    rate: elderlyMode ? 0.65 : 0.75, // Slower for elderly, still natural
    pitch: 1.2, // Slightly higher pitch for female voice
    volume: 1.0, // Full volume for clarity
    voice: femaleVoice
  };
};

// Enhanced speak function with female voice
export const speakText = async (text: string, elderlyMode: boolean = false): Promise<void> => {
  if (!('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported');
    return;
  }

  // Cancel any ongoing speech
  speechSynthesis.cancel();

  try {
    const settings = await getVoiceSettings(elderlyMode);
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Apply voice settings
    utterance.rate = settings.rate;
    utterance.pitch = settings.pitch;
    utterance.volume = settings.volume;
    
    if (settings.voice) {
      utterance.voice = settings.voice;
    }

    // Add error handling
    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event.error);
    };

    utterance.onstart = () => {
      console.log('Speaking with voice:', settings.voice?.name || 'default');
    };

    speechSynthesis.speak(utterance);
  } catch (error) {
    console.error('Error in speech synthesis:', error);
  }
};

// Stop any ongoing speech
export const stopSpeaking = (): void => {
  if ('speechSynthesis' in window) {
    speechSynthesis.cancel();
  }
};

// Get available voice information for debugging
export const getVoiceInfo = async (): Promise<{
  totalVoices: number;
  selectedVoice: string;
  allVoices: string[];
}> => {
  const voices = await loadVoices();
  const settings = await getVoiceSettings();
  
  return {
    totalVoices: voices.length,
    selectedVoice: settings.voice?.name || 'default',
    allVoices: voices.map(v => `${v.name} (${v.lang})`)
  };
};