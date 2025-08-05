// AI Service for handling screenshot analysis and user queries
// This will integrate with Ollama running Gemma 3n locally

// DOM-based screenshot capture functionality using html2canvas
import html2canvas from 'html2canvas';

export interface AnalysisRequest {
  image?: string; // Base64 encoded image
  query: string;
  context?: string; // Current app context
  screenshotMetadata?: {
    appName: string;
    timestamp: Date;
    resolution: {
      width: number;
      height: number;
    };
  };
}

export interface AnalysisResponse {
  guidance: string;
  steps?: string[];
  confidence: number;
}

export const capturePhoneScreenshot = async (
  phoneScreenElement: HTMLElement,
  appContext?: string
): Promise<{
  image: string;
  metadata: {
    appName: string;
    timestamp: Date;
    resolution: { width: number; height: number };
  };
} | null> => {
  try {
    // Capture the phone screen element using html2canvas
    const canvas = await html2canvas(phoneScreenElement, {
      scale: 1, // Use 1x scale for better performance on phone-sized content
      useCORS: true, // Handle cross-origin images
      allowTaint: false, // Prevent canvas tainting
      backgroundColor: '#ffffff', // Ensure white background
      width: phoneScreenElement.offsetWidth,
      height: phoneScreenElement.offsetHeight,
      scrollX: 0,
      scrollY: 0,
      // Optimize for phone content
      ignoreElements: (element) => {
        // Skip the floating assistant button and modal overlay in screenshots
        return element.classList?.contains('floating-assistant') || 
               element.classList?.contains('assistant-overlay');
      }
    });

    // Convert to base64 (use JPEG for better compression)
    const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
    
    return {
      image: base64,
      metadata: {
        appName: appContext || 'phone-screen',
        timestamp: new Date(),
        resolution: {
          width: canvas.width,
          height: canvas.height
        }
      }
    };
  } catch (error) {
    console.error('DOM screenshot capture failed:', error);
    return null;
  }
};

// Legacy screen sharing capture (fallback - but we'll remove this)
export const captureScreenshotLegacy = async (appContext?: string): Promise<{
  image: string;
  metadata: {
    appName: string;
    timestamp: Date;
    resolution: { width: number; height: number };
  };
} | null> => {
  try {
    // Try to use Screen Capture API as fallback
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        width: 1920,
        height: 1080
      }
    });

    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      video.srcObject = stream;
      video.play();

      video.onloadedmetadata = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Draw the video frame to canvas
        ctx?.drawImage(video, 0, 0);
        
        // Create a smaller version for overlay display (optimize for performance)
        const overlayCanvas = document.createElement('canvas');
        const overlayCtx = overlayCanvas.getContext('2d');
        
        // Scale down to max 800px width while maintaining aspect ratio
        const maxWidth = 800;
        const aspectRatio = canvas.height / canvas.width;
        const overlayWidth = Math.min(canvas.width, maxWidth);
        const overlayHeight = overlayWidth * aspectRatio;
        
        overlayCanvas.width = overlayWidth;
        overlayCanvas.height = overlayHeight;
        
        overlayCtx?.drawImage(canvas, 0, 0, overlayWidth, overlayHeight);
        
        // Convert to base64 (use JPEG for better compression on screenshots)
        const base64 = overlayCanvas.toDataURL('image/jpeg', 0.8).split(',')[1];
        
        // Stop the stream
        stream.getTracks().forEach(track => track.stop());
        
        resolve({
          image: base64,
          metadata: {
            appName: appContext || 'unknown',
            timestamp: new Date(),
            resolution: {
              width: overlayWidth,
              height: overlayHeight
            }
          }
        });
      };

      video.onerror = () => {
        stream.getTracks().forEach(track => track.stop());
        reject(new Error('Failed to capture screenshot'));
      };
    });
  } catch (error) {
    console.warn('Screen capture not available:', error);
    return null;
  }
};

// Main screenshot function - now uses DOM capture by default
export const captureScreenshot = async (appContext?: string): Promise<{
  image: string;
  metadata: {
    appName: string;
    timestamp: Date;
    resolution: { width: number; height: number };
  };
} | null> => {
  // Try to find the phone screen element in the DOM
  const phoneScreenElement = document.querySelector('[data-phone-screen]') as HTMLElement;
  
  if (phoneScreenElement) {
    // Use DOM-based capture (no screen sharing prompt)
    return await capturePhoneScreenshot(phoneScreenElement, appContext);
  } else {
    console.warn('Phone screen element not found, cannot capture screenshot');
    return null;
  }
};

// Legacy function for backward compatibility (simple string return)
export const captureScreenshotSimple = async (): Promise<string | null> => {
  const result = await captureScreenshot();
  return result ? result.image : null;
};

// Mock AI analysis for demo purposes
const mockAnalyzeWithGemma = async (request: AnalysisRequest): Promise<AnalysisResponse> => {
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  const query = request.query.toLowerCase();
  
  // Context-aware responses based on current app
  if (request.context === 'whatsapp') {
    if (query.includes('profile') || query.includes('picture') || query.includes('dp')) {
      return {
        guidance: "To change your WhatsApp profile picture: 1) Go to WhatsApp Settings by tapping the three dots menu, 2) Tap on your profile name at the top, 3) Tap on your current profile picture, 4) Choose 'Camera' to take a new photo or 'Gallery' to select an existing one, 5) Adjust the crop if needed, 6) Tap 'Done' to save your new profile picture.",
        steps: [
          "Open WhatsApp Settings (three dots menu)",
          "Tap your profile name",
          "Tap your profile picture",
          "Choose Camera or Gallery",
          "Select or take your photo",
          "Adjust crop and tap Done"
        ],
        confidence: 0.95
      };
    } else if (query.includes('message') || query.includes('send')) {
      return {
        guidance: "To send a message on WhatsApp: 1) Find the contact you want to message from your chat list, 2) Tap on their name to open the conversation, 3) Type your message in the text box at the bottom, 4) Tap the green send button (arrow icon) to send your message.",
        steps: [
          "Find the contact in your chat list",
          "Tap their name to open conversation",
          "Type your message",
          "Tap the green send button"
        ],
        confidence: 0.9
      };
    }
  } else if (request.context === 'phone') {
    if (query.includes('call') || query.includes('dial')) {
      return {
        guidance: "To make a phone call: 1) Open the Phone app, 2) You can either tap 'Contacts' to call someone from your contact list, or tap 'Dial' to enter a number manually, 3) Find the person you want to call and tap the green call button, or enter the number and tap the call button.",
        steps: [
          "Open the Phone app",
          "Choose Contacts or Dial tab",
          "Select contact or enter number",
          "Tap the green call button"
        ],
        confidence: 0.92
      };
    } else if (query.includes('emergency')) {
      return {
        guidance: "For emergency calls: 1) Open the Phone app, 2) Go to the Contacts tab, 3) You'll see emergency contacts at the top with red heart icons, 4) Tap the red call button next to 'Emergency Services' for 911, or tap any other emergency contact like your doctor.",
        steps: [
          "Open Phone app",
          "Go to Contacts tab",
          "Find Emergency Contacts section",
          "Tap red call button for emergency"
        ],
        confidence: 0.98
      };
    }
  } else if (request.context === 'settings') {
    if (query.includes('bright') || query.includes('screen')) {
      return {
        guidance: "To adjust screen brightness: 1) In Settings, look for 'Display' option, 2) Tap on Display, 3) You'll see a brightness slider, 4) Move the slider right to make the screen brighter, or left to make it dimmer, 5) The change will apply immediately.",
        steps: [
          "Find Display in Settings",
          "Tap Display option",
          "Use brightness slider",
          "Move right for brighter",
          "Changes apply immediately"
        ],
        confidence: 0.88
      };
    } else if (query.includes('font') || query.includes('text') || query.includes('size')) {
      return {
        guidance: "To make text larger: 1) In Settings, find 'Accessibility', 2) Tap on Accessibility, 3) Look for 'Font Size', 4) Use the slider to make text larger - you'll see a preview below, 5) The larger text will apply to most apps.",
        steps: [
          "Go to Accessibility in Settings",
          "Find Font Size option",
          "Use slider to increase size",
          "Preview shows the change",
          "Text applies to most apps"
        ],
        confidence: 0.91
      };
    }
  }

  // General responses for common queries
  if (query.includes('help') || query.includes('how')) {
    return {
      guidance: "I can help you with many phone tasks! Try asking me specific questions like 'How do I make a call?', 'Help me send a message', or 'How do I change my profile picture?'. I can also analyze screenshots of your phone if you show me what you're looking at.",
      confidence: 0.7
    };
  } else if (query.includes('home') || query.includes('back')) {
    return {
      guidance: "To go back to the home screen, look for the home button at the bottom of your screen - it usually looks like a house icon. You can tap it at any time to return to your main screen with all your apps.",
      confidence: 0.85
    };
  }

  // Default response
  return {
    guidance: `I understand you said: "${request.query}". Could you be more specific about what you need help with? For example, you could ask about making calls, sending messages, changing settings, or show me a photo of your screen for more specific help.`,
    confidence: 0.6
  };
};

// Ollama configuration
const OLLAMA_BASE_URL = 'http://localhost:11434';
const GEMMA_MODEL = 'gemma3:4b-instruct-q4_0'; // Q4 quantized 4B model
// const GEMMA_BACKUP_MODEL = 'gemma3:27b-instruct-q4_0'; // Backup 27B model (future use)

// Check if Ollama is running and model is available
export const checkOllamaStatus = async (): Promise<{available: boolean, models: string[]}> => {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.ok) {
      const data = await response.json();
      const modelNames = data.models?.map((m: any) => m.name) || [];
      return {
        available: true,
        models: modelNames
      };
    }
    return { available: false, models: [] };
  } catch (error) {
    console.warn('Ollama not available:', error);
    return { available: false, models: [] };
  }
};

// Enhanced Ollama integration with multimodal support
export const analyzeWithOllama = async (request: AnalysisRequest): Promise<AnalysisResponse> => {
  try {
    // Check if Ollama is available
    const ollamaStatus = await checkOllamaStatus();
    
    if (!ollamaStatus.available) {
      console.log('Ollama not available, using mock responses');
      return await mockAnalyzeWithGemma(request);
    }

    // Determine which model to use
    const availableModel = ollamaStatus.models.find(m => 
      m.includes('gemma3') && (m.includes('4b') || m.includes('27b'))
    ) || GEMMA_MODEL;

    // Build context-aware prompt for elderly users
    const systemPrompt = `You are a patient, helpful AI assistant specifically designed to help elderly users learn smartphone technology. 

    Your characteristics:
    - Speak in simple, clear language
    - Break down tasks into small, manageable steps
    - Be encouraging and patient
    - Avoid technical jargon
    - Repeat important information
    - Assume the user may need extra reassurance

    Current app context: ${request.context || 'general smartphone usage'}
    ${request.image ? 'The user has provided a screenshot of their phone screen for you to analyze.' : ''}
    
    User's question: "${request.query}"
    
    Please provide step-by-step guidance that is easy to follow. If analyzing a screenshot, describe what you see and provide specific guidance based on the current screen.`;

    // Prepare the request body for Ollama
    const requestBody: any = {
      model: availableModel,
      prompt: systemPrompt,
      stream: false,
      options: {
        temperature: 0.3, // Lower temperature for more consistent responses
        top_p: 0.9,
        repeat_penalty: 1.1
      }
    };

    // Add image if provided (multimodal support)
    if (request.image) {
      requestBody.images = [request.image];
    }

    console.log(`Making request to Ollama with model: ${availableModel}`);
    
    const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Parse the response and extract steps if present
    const guidance = data.response || 'I apologize, but I couldn\'t process your request right now.';
    
    // Try to extract numbered steps from the response
    const stepMatches = guidance.match(/\d+[\)\.]\s*([^\n]+)/g);
    const steps = stepMatches ? stepMatches.map((step: string) => 
      step.replace(/^\d+[\)\.]\s*/, '').trim()
    ) : undefined;

    return {
      guidance: guidance.trim(),
      steps,
      confidence: 0.9
    };

  } catch (error) {
    console.error('Ollama API error:', error);
    console.log('Falling back to mock responses');
    // Fallback to mock responses if Ollama fails
    return await mockAnalyzeWithGemma(request);
  }
};

// Main analysis function that tries real screenshot first, then falls back to mock
export const analyzeScreenshotAndQuery = async (
  query: string, 
  context?: string,
  useRealScreenshot: boolean = true
): Promise<AnalysisResponse> => {
  let screenshotData: {
    image: string;
    metadata: {
      appName: string;
      timestamp: Date;
      resolution: { width: number; height: number };
    };
  } | null = null;
  
  if (useRealScreenshot) {
    screenshotData = await captureScreenshot(context);
  }
  
  const request: AnalysisRequest = {
    query,
    context,
    image: screenshotData?.image || undefined,
    screenshotMetadata: screenshotData?.metadata
  };
  
  return await analyzeWithOllama(request);
};

// Enhanced analysis function with custom screenshot data (for overlay use)
export const analyzeWithScreenshotData = async (
  query: string,
  context?: string,
  screenshotData?: {
    image: string;
    metadata: {
      appName: string;
      timestamp: Date;
      resolution: { width: number; height: number };
    };
  }
): Promise<AnalysisResponse> => {
  const request: AnalysisRequest = {
    query,
    context,
    image: screenshotData?.image || undefined,
    screenshotMetadata: screenshotData?.metadata
  };
  
  return await analyzeWithOllama(request);
};