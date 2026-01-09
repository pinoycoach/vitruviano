const FAL_KEY = (import.meta as any).env.VITE_FAL_KEY;

export interface FalImageResult {
  url: string;
  seed: number;
  cost: number;
  model: string;
  usedFallback?: boolean;
}

export const generateCheapImage = async (prompt: string): Promise<FalImageResult> => {
  // 1. Try fal.ai first (Cheapest & Best for 9:16)
  if (FAL_KEY) {
    try {
      console.log('🎨 Trying fal.ai (Vertical 9:16)...');
      
      const response = await fetch('https://fal.run/fal-ai/flux-pro/v1.1-ultra', {
        method: 'POST',
        headers: {
          'Authorization': `Key ${FAL_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          // FORCE 9:16 ASPECT RATIO
          image_size: { width: 720, height: 1280 },
          num_inference_steps: 4,
          guidance_scale: 3.5,
          num_images: 1,
          enable_safety_checker: true,
          output_format: 'jpeg',
          sync_mode: true
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ fal.ai success! Cost: $0.008');
        
        return {
          url: data.images[0].url,
          seed: data.seed || 0,
          cost: 0.008,
          model: 'flux-pro-1.1-ultra',
          usedFallback: false
        };
      } else {
        console.warn('⚠️ fal.ai failed (check credits?), falling back to Gemini...');
      }
    } catch (error) {
      console.warn('⚠️ fal.ai error, falling back to Gemini...', error);
    }
  }

  // 2. Fallback to Gemini Image
  console.log('🔄 Using Gemini Image fallback...');
  return await generateWithGeminiFallback(prompt);
};

const generateWithGeminiFallback = async (prompt: string): Promise<FalImageResult> => {
  const { generateFantasyImage } = await import('./geminiService');
  
  try {
    // Aggressive prompting for vertical cropping in fallback
    const verticalPrompt = `${prompt} --aspect 9:16 --ar 9:16. Vertical portrait composition. Full body or 3/4 shot fitting entirely in frame.`;

    const geminiUrl = await generateFantasyImage({
      name: 'Test',
      trope: 'The Billionaire' as any,
      visualDescription: verticalPrompt,
      voicePersonality: 'Fenrir',
      atmosphere: 'Executive Office, Midnight, City Lights' as any,
      hookLine: 'Test'
    });
    
    console.log('✅ Gemini Image fallback success! Cost: $0.039');
    
    return {
      url: geminiUrl,
      seed: 0,
      cost: 0.039,
      model: 'gemini-2.5-flash-image',
      usedFallback: true
    };
  } catch (error) {
    console.error('❌ Both fal.ai and Gemini failed!', error);
    throw new Error('Image generation failed on both services');
  }
};

export const generateBoyfriendImageCheap = async (
  trope: string,
  archetype: string,
  atmosphere: string
): Promise<FalImageResult> => {
  // Optimized prompt for Vertical Mobile Screens
  const prompt = `
    Cinematic portrait, 9:16 vertical aspect ratio.
    Full body or 3/4 shot of a handsome man.
    Romance novel cover style: ${trope} archetype.
    Visual aesthetic: ${archetype}.
    Setting: ${atmosphere}.
    Professional lighting, editorial quality, sharp focus.
    High fashion photography, vertical framing.
  `.trim();

  return await generateCheapImage(prompt);
};

export const getCostComparison = () => {
  return {
    geminiImage: 0.039,
    falTurbo: 0.008,
    savings: 0.031,
    savingsPercent: 79.5,
    speedup: '6.6s vs 8-10s'
  };
};