// AI Image Generation Service
// Using multiple providers for robustness

interface ImageGenerationOptions {
  prompt: string;
  style?: 'realistic' | 'anime' | 'artistic' | 'portrait';
  quality?: 'standard' | 'hd';
  size?: '512x512' | '1024x1024';
}

interface GeneratedImage {
  url: string;
  prompt: string;
  provider: string;
}

// OpenAI DALL-E 3 Integration
export async function generateImageWithDALLE(options: ImageGenerationOptions): Promise<GeneratedImage | null> {
  try {
    console.log('🎨 Generating image with DALL-E...', options);
    
    // Enhanced prompt for better portrait generation
    const enhancedPrompt = enhancePromptForPortrait(options.prompt, options.style);
    
    const response = await fetch('/api/generate-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        provider: 'dalle',
        prompt: enhancedPrompt,
        quality: options.quality || 'standard',
        size: options.size || '1024x1024',
        style: options.style || 'realistic'
      }),
    });

    if (!response.ok) {
      throw new Error(`Image generation failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }

    return {
      url: data.url,
      prompt: enhancedPrompt,
      provider: 'DALL-E 3'
    };
  } catch (error) {
    console.error('❌ DALL-E generation failed:', error);
    return null;
  }
}

// Stable Diffusion Fallback
export async function generateImageWithStableDiffusion(options: ImageGenerationOptions): Promise<GeneratedImage | null> {
  try {
    console.log('🎨 Generating image with Stable Diffusion...', options);
    
    const enhancedPrompt = enhancePromptForPortrait(options.prompt, options.style);
    
    const response = await fetch('/api/generate-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        provider: 'stable-diffusion',
        prompt: enhancedPrompt,
        style: options.style || 'realistic',
        quality: options.quality || 'standard'
      }),
    });

    if (!response.ok) {
      throw new Error(`Image generation failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }

    return {
      url: data.url,
      prompt: enhancedPrompt,
      provider: 'Stable Diffusion'
    };
  } catch (error) {
    console.error('❌ Stable Diffusion generation failed:', error);
    return null;
  }
}

// Main generation function with fallbacks
export async function generateAvatarImage(options: ImageGenerationOptions): Promise<GeneratedImage | null> {
  console.log('🎨 Starting AI avatar generation...', options);
  
  // Try DALL-E first (highest quality)
  let result = await generateImageWithDALLE(options);
  
  // Fallback to Stable Diffusion if DALL-E fails
  if (!result) {
    console.log('🔄 Falling back to Stable Diffusion...');
    result = await generateImageWithStableDiffusion(options);
  }
  
  // Final fallback to local placeholder generation
  if (!result) {
    console.log('🔄 Using placeholder avatar...');
    result = await generatePlaceholderAvatar(options);
  }
  
  return result;
}

// Enhanced prompt engineering for better portraits
function enhancePromptForPortrait(userPrompt: string, style?: string): string {
  const basePrompts = {
    realistic: "Professional headshot portrait photograph, high quality, studio lighting, detailed facial features, sharp focus, 4K resolution",
    anime: "Anime style portrait, detailed character art, clean lines, vibrant colors, professional anime illustration",
    artistic: "Digital art portrait, artistic style, detailed painting, beautiful composition, professional artwork",
    portrait: "Portrait style, detailed facial features, professional quality, clean background"
  };
  
  const basePrompt = basePrompts[style as keyof typeof basePrompts] || basePrompts.realistic;
  
  // Add safety and quality modifiers
  const safetyModifiers = "SFW, appropriate, tasteful, respectful";
  const qualityModifiers = "high quality, detailed, professional, beautiful lighting";
  
  return `${basePrompt}, ${userPrompt}, ${safetyModifiers}, ${qualityModifiers}`;
}

// Placeholder avatar generation (local fallback)
async function generatePlaceholderAvatar(options: ImageGenerationOptions): Promise<GeneratedImage> {
  // Generate a placeholder avatar based on the prompt
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  
  // Create a gradient background
  const gradient = ctx.createLinearGradient(0, 0, 512, 512);
  gradient.addColorStop(0, '#667eea');
  gradient.addColorStop(1, '#764ba2');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 512, 512);
  
  // Add text overlay
  ctx.fillStyle = 'white';
  ctx.font = 'bold 48px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('AI Avatar', 256, 256);
  
  ctx.font = '24px Arial';
  ctx.fillText('Generated', 256, 300);
  
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        resolve({
          url,
          prompt: options.prompt,
          provider: 'Placeholder'
        });
      }
    });
  });
}

// Validation function
export function validateImagePrompt(prompt: string): { isValid: boolean; message?: string } {
  if (!prompt || prompt.trim().length < 3) {
    return { isValid: false, message: 'Please provide a description (at least 3 characters)' };
  }
  
  if (prompt.length > 500) {
    return { isValid: false, message: 'Description too long (max 500 characters)' };
  }
  
  // Basic content filtering
  const inappropriateWords = ['nude', 'naked', 'nsfw', 'explicit'];
  const hasInappropriate = inappropriateWords.some(word => 
    prompt.toLowerCase().includes(word)
  );
  
  if (hasInappropriate) {
    return { isValid: false, message: 'Please keep descriptions appropriate and family-friendly' };
  }
  
  return { isValid: true };
}

// Example prompts for inspiration
export const examplePrompts = [
  "A confident woman with long brown hair and warm brown eyes, wearing a casual sweater",
  "A friendly woman with short blonde hair and blue eyes, smiling gently",
  "An artistic woman with curly red hair and green eyes, wearing glasses",
  "A professional woman with black hair in a ponytail and kind eyes",
  "A creative woman with purple highlights in her hair and expressive eyes",
  "A gentle woman with wavy hair and a warm smile, wearing a cozy cardigan",
  "An adventurous woman with braided hair and bright, curious eyes",
  "A sophisticated woman with elegant features and intelligent eyes"
]; 