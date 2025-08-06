// AI Service for handling screenshot analysis and user queries
// This will integrate with Ollama running Gemma 3n locally

// DOM-based screenshot capture functionality using html2canvas
import html2canvas from 'html2canvas';

export interface AnalysisRequest {
  image?: string; // Base64 encoded image
  query: string;
  context?: string; // Current app context
  conversationHistory?: any[]; // Previous messages for context
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

// Function to resize a base64 image for optimal AI processing (context-aware sizing)
const resizeBase64Image = (base64Str: string, maxWidth = 800, maxHeight = 450): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;

      // Calculate new dimensions maintaining aspect ratio
      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      
      // Use moderate JPEG compression to balance quality and size
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.src = base64Str;
  });
};

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
    // Scroll element to top to ensure full content visibility
    phoneScreenElement.scrollTop = 0;
    
    // Capture the phone screen element using html2canvas with enhanced settings
    const canvas = await html2canvas(phoneScreenElement, {
      scale: 2, // Increased scale for better detail capture
      useCORS: true, // Handle cross-origin images
      allowTaint: false, // Prevent canvas tainting
      backgroundColor: '#ffffff', // Ensure white background
      width: phoneScreenElement.offsetWidth,
      height: phoneScreenElement.offsetHeight,
      scrollX: 0,
      scrollY: 0,
      logging: false, // Disable html2canvas logging for cleaner console
      // Optimize for phone content
      ignoreElements: (element) => {
        // Skip the floating assistant button and modal overlay in screenshots
        return element.classList?.contains('floating-assistant') || 
               element.classList?.contains('assistant-overlay');
      }
    });

    // Convert to high-quality PNG first for lossless capture
    const originalBase64 = canvas.toDataURL('image/png');
    
    // Resize the image for optimal AI processing (smaller size to avoid context limits)
    const resizedBase64 = await resizeBase64Image(originalBase64, 800, 450);
    
    // Extract base64 data without data URI prefix
    const base64 = resizedBase64.split(',')[1];
    
    // Log image details for debugging
    const imageSizeBytes = Math.round((base64.length * 3) / 4);
    const estimatedTokens = Math.round((800 * 450) / (14 * 14)); // Rough estimate for vision tokens
    console.log(`📸 Image captured: ${Math.round(imageSizeBytes / 1024)}KB, Original: ${canvas.width}x${canvas.height}, Final: 800x450`);
    console.log(`🧮 Estimated image tokens: ~${estimatedTokens} (leaves room for text within 8192 context limit)`);
    
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
  
  // Context-aware responses based on current app - Progressive single-step guidance with caring tone
  if (request.context === 'whatsapp') {
    if (query.includes('profile') || query.includes('picture') || query.includes('dp')) {
      return {
        guidance: "I can help you change your WhatsApp profile picture. Let's start by tapping the three dots in the top right corner.",
        confidence: 0.95
      };
    } else if (query.includes('message') || query.includes('send')) {
      return {
        guidance: "Let me help you send a message. First, find the person you want to message in your chat list and gently tap on their name.",
        confidence: 0.9
      };
    }
  } else if (request.context === 'phone') {
    if (query.includes('call') || query.includes('dial')) {
      return {
        guidance: "I'll help you make a phone call. Let's look at the bottom of your screen and tap on the Contacts tab.",
        confidence: 0.92
      };
    } else if (query.includes('emergency')) {
      return {
        guidance: "For emergency calls, let's tap on the Contacts tab at the bottom. You'll see the red emergency contacts at the top.",
        confidence: 0.98
      };
    }
  } else if (request.context === 'settings') {
    if (query.includes('bright') || query.includes('screen')) {
      return {
        guidance: "I can help you adjust the screen brightness. Let's look for the Display option in your Settings and tap on it.",
        confidence: 0.88
      };
    } else if (query.includes('font') || query.includes('text') || query.includes('size')) {
      return {
        guidance: "Let me help you make the text larger. First, let's find Accessibility in your Settings menu and tap on it.",
        confidence: 0.91
      };
    }
  }

  // General responses for common queries with caring tone
  if (query.includes('help') || query.includes('how')) {
    return {
      guidance: "I'm here to help you with your phone! Please ask me specific questions like 'How do I make a call?' and I'll guide you step by step with care.",
      confidence: 0.7
    };
  } else if (query.includes('home') || query.includes('back')) {
    return {
      guidance: "Let me help you get back to the home screen. Look for the home button at the bottom of your screen and gently tap it.",
      confidence: 0.85
    };
  }

  // Default response with warmth
  return {
    guidance: `I'm happy to help you with that! Could you tell me more about what you'd like to do? For example, you can ask 'How do I make a call?' and I'll guide you through it.`,
    confidence: 0.6
  };
};

// Ollama configuration
const OLLAMA_BASE_URL = 'http://localhost:11434';
const GEMMA_MODEL = 'gemma3n:e2b'; // Gemma 3n model from Ollama
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
      m.includes('gemma3n')
    ) || GEMMA_MODEL;

    // Build context-aware prompt for elderly users with progressive guidance
    const conversationContext = request.conversationHistory && request.conversationHistory.length > 0
      ? `\n\nPrevious conversation:\n${request.conversationHistory.map((msg: any) => 
          `${msg.isUser ? 'User' : 'Assistant'}: ${msg.text}`
        ).join('\n')}\n`
      : '';

    const systemPrompt = `You are a patient, helpful AI assistant for elderly smartphone users. You MUST follow these rules EXACTLY:

    CRITICAL RULES (NEVER BREAK THESE):
    1. NEVER use asterisks (*) - they break text-to-speech
    2. Give EXACTLY ONE instruction per response - NEVER give multiple steps
    3. Keep responses to 1-2 sentences maximum
    4. Use simple words only
    5. Be very specific about what to tap

    ENHANCED IMAGE ANALYSIS RULES (ABSOLUTELY CRITICAL):
    6. You are provided with a high-quality screenshot optimized for AI vision
    7. FIRST examine the screenshot carefully to identify ALL visible UI elements, buttons, text, and interactive components
    8. ONLY give instructions for elements you can ACTUALLY SEE in the current screenshot
    9. If you cannot see the image clearly, respond: "I cannot see your screen clearly. Please try asking again."
    10. If you can see the screen but cannot find what the user is asking about, respond: "I can see your screen but cannot find that option. Can you describe what you see?"
    11. If an element is NOT clearly visible in the image, explicitly state: "I cannot verify the presence of [element] in this screenshot."
    12. Focus on large, clear buttons, text fields, and main content areas that are prominently visible
    13. Describe the most prominent UI elements if asked "What do you see?"
    14. Base your response STRICTLY on the visual information in the screenshot, not on general app knowledge

    TONE AND LANGUAGE RULES:
    15. Be warm, caring, and conversational - like a helpful family member
    16. NEVER use robotic phrases like "Good!", "Great!", "Excellent!"
    17. Use natural transitions like "Perfect!", "Wonderful!", "That's it!", "Yes!"
    18. Start instructions with caring phrases like "Let me help", "I can see", "Now let's"
    19. Show empathy and patience in your responses

    RESPONSE EXAMPLES:
    - Vision-Based Good: "I can see the Settings screen on your phone. Let's tap on Display."
    - Vision-Based Bad: "Go to Settings and tap Display" (when you can't see Settings is open)
    - Visibility Check: "I can see your screen but cannot find the back button. Can you describe what you see?"
    - Clear Instruction: "I can see the three dots in the top right corner. Let's tap on those."
    - Honest Response: "I cannot verify the presence of a Send button in this screenshot. What do you see on your screen?"

    Current app context: ${request.context || 'phone'}
    ${request.image ? 'IMPORTANT: A high-quality screenshot has been provided. Examine it carefully and base your response ONLY on what is visible in the image.' : 'No screenshot available - work with context only.'}
    ${conversationContext}
    
    User says: "${request.query}"
    
    Reply with EXACTLY ONE simple, caring instruction based STRICTLY on what you can see in the screenshot. If you cannot see the requested element, be honest about it.`;

    // Strip data URI prefix from image if present (required for Ollama multimodal)
    let cleanImage = request.image;
    if (cleanImage && cleanImage.startsWith('data:image/')) {
      const base64Index = cleanImage.indexOf('base64,') + 7;
      cleanImage = cleanImage.substring(base64Index);
      console.log(`🔧 FIXED: Stripped data URI prefix from image`);
    }

    // Prepare the request body for Ollama Chat API (required for multimodal)
    const requestBody: any = {
      model: availableModel,
      messages: [{
        role: 'user',
        content: systemPrompt,
        ...(cleanImage && { images: [cleanImage] }) // Add images only if present
      }],
      stream: false,
      options: {
        temperature: 0.3, // Lower temperature for more consistent responses
        top_p: 0.9,
        repeat_penalty: 1.1
      }
    };

    // Enhanced debug logging with image validation
    if (cleanImage) {
      const imageSizeBytes = Math.round((cleanImage.length * 3) / 4);
      const imageSizeKB = Math.round(imageSizeBytes / 1024);
      console.log(`🖼️ IMAGE DEBUG: High-quality image prepared for Ollama Chat API`);
      console.log(`📊 Image size: ${imageSizeKB} KB (${imageSizeBytes} bytes)`);
      console.log(`🔍 Image preview: ${cleanImage.substring(0, 50)}...`);
      
      // Optional: Create debug image element to visually verify what's being sent
      if (import.meta.env.DEV) {
        const debugImg = document.createElement('img');
        debugImg.src = `data:image/jpeg;base64,${cleanImage}`;
        debugImg.style.maxWidth = '200px';
        debugImg.style.border = '2px solid #4CAF50';
        debugImg.title = 'Image sent to AI model';
        // Uncomment next line to actually show debug image
        // document.body.appendChild(debugImg);
        console.log(`🖼️ Debug image element created (uncomment to display)`);
      }
    } else {
      console.log(`❌ IMAGE DEBUG: No image provided to Ollama - will use context-only mode`);
    }

    console.log(`🤖 Making request to Ollama Chat API with model: ${availableModel}`);
    console.log(`📝 Request includes image: ${!!cleanImage}`);
    
    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
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
    
    // Enhanced debug logging with vision analysis
    console.log(`🔄 OLLAMA CHAT API RESPONSE DEBUG:`);
    console.log(`✅ Response received with image processing: ${!!cleanImage}`);
    console.log(`📤 Full response:`, JSON.stringify(data, null, 2));
    
    // Parse the Chat API response format (different from generate API)
    let guidance = data.message?.content || data.response || 'I apologize, but I couldn\'t process your request right now.';
    console.log(`🎯 Extracted guidance: "${guidance}"`);
    
    // Remove asterisks and other formatting that interferes with TTS
    guidance = guidance
      .replace(/\*/g, '') // Remove all asterisks
      .replace(/#{1,6}\s*/g, '') // Remove markdown headers
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Convert markdown links to just text
      .trim();
    
    // Debug log the processed response
    console.log(`🎯 PROCESSED GUIDANCE: "${guidance}"`);
    
    // Enhanced vision issue detection with context limit awareness
    const visionIssueKeywords = [
      'cannot see', 'cannot find', 'screen clearly', 'not visible', 
      'cannot verify', 'cannot identify', 'not clearly visible',
      'unable to see', 'cannot locate', 'not present in'
    ];
    
    const genericResponseKeywords = [
      'tap the button', 'click the button', 'scroll down', 'go to settings',
      'look for', 'find the option', 'check the menu', 'try tapping'
    ];
    
    const hasVisionIssue = visionIssueKeywords.some(keyword => 
      guidance.toLowerCase().includes(keyword)
    );
    
    const hasGenericResponse = genericResponseKeywords.some(keyword => 
      guidance.toLowerCase().includes(keyword)
    );
    
    if (hasVisionIssue) {
      console.log(`⚠️ VISION ISSUE DETECTED: AI reported vision problems - may need smaller image or different model`);
    } else if (hasGenericResponse && cleanImage) {
      console.log(`⚠️ POSSIBLE CONTEXT LIMIT ISSUE: AI giving generic responses despite image - may need smaller image`);
    } else if (cleanImage) {
      console.log(`✅ VISION SUCCESS: AI processed image successfully and provided specific guidance`);
    }
    
    // For progressive guidance, we don't extract numbered steps since we give one step at a time
    // The steps array will be undefined to indicate single-step guidance
    const steps = undefined;

    return {
      guidance: guidance.trim(),
      steps,
      confidence: hasVisionIssue ? 0.3 : (cleanImage ? 0.95 : 0.7) // Higher confidence for successful image processing
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

// Enhanced analysis function with custom screenshot data and conversation history (for overlay use)
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
  },
  conversationHistory?: any[]
): Promise<AnalysisResponse> => {
  const request: AnalysisRequest = {
    query,
    context,
    image: screenshotData?.image || undefined,
    screenshotMetadata: screenshotData?.metadata,
    conversationHistory
  };
  
  return await analyzeWithOllama(request);
};