import { GoogleGenAI } from '@google/genai';
import { generateCheapImage } from './falImageService';

const API_KEY = (import.meta as any).env.VITE_GEMINI_API_KEY;

export interface SocialPost {
  trope: string;
  image: {
    url: string;
    cost: number;
    model: string;
  };
  caption: string;
  hashtags: string;
  hookLine: string;
  povScript: string;
  totalCost: number;
}

const TROPE_PROMPTS: Record<string, string> = {
  'The Billionaire': 'Luxury penthouse, city skyline, sharp suit, commanding presence, executive power',
  'The Rockstar': 'Stage lights, leather jacket, tattoos, intense gaze, rebellious energy',
  'The Golden Retriever': 'Warm smile, casual style, friendly demeanor, approachable charm',
  'Grumpy x Sunshine': 'Brooding intensity, dark aesthetic, mysterious aura, hidden softness',
  'Academic Rival': 'Library setting, intelligent eyes, competitive edge, scholarly sophistication',
  'The Bodyguard': 'Protective stance, muscular build, tactical clothing, vigilant presence',
  'The Forbidden Love': 'Dangerous attraction, conflicted expression, forbidden intensity',
  'The Single Dad': 'Gentle strength, caring eyes, casual dad style, paternal warmth',
  'The Royal': 'Regal bearing, formal attire, crown or royal setting, aristocratic elegance',
  'Flash Marriage CEO': 'Power suit, wedding ring visible, boardroom confidence, unexpected romance',
  'The Vengeful Ex': 'Dark intensity, calculated gaze, expensive revenge aesthetic',
  'Contract Husband': 'Business formal, wedding band, professional distance hiding attraction',
  'The Alpha Commander': 'Military bearing, tactical gear, authoritative presence, leadership energy'
};

export const generateSocialPost = async (trope: string): Promise<SocialPost> => {
  if (!API_KEY) {
    throw new Error('Gemini API key not found');
  }

  console.log(`📱 Generating social post for: ${trope}`);

  // Generate text content first (cheap!)
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  const textPrompt = `Create viral BookTok content for this romance archetype: ${trope}

Return ONLY valid JSON (no markdown):
{
  "caption": "2-3 sentence caption that makes readers NEED this character",
  "hashtags": "10-15 trending hashtags for BookTok romance",
  "hookLine": "One sentence that stops scrolling",
  "povScript": "POV script for video (40-60 words, first person, dramatic)"
}

Make it spicy, dramatic, and BookTok-optimized.`;

  const textResponse = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image', // Using the stable model
    contents: { parts: [{ text: textPrompt }] }
  });

  const textContent = textResponse.text || '';
  const jsonMatch = textContent.match(/\{[\s\S]*\}/);
  
  if (!jsonMatch) {
    throw new Error('Failed to generate text content');
  }
  
  const content = JSON.parse(jsonMatch[0]);
  const textCost = 0.0006;

  // Generate image (smart fallback)
  const imagePrompt = TROPE_PROMPTS[trope] || trope;
  
  // UPDATED: Explicitly requesting 9:16 Vertical
  const visualPrompt = `Cinematic 9:16 vertical portrait. ${imagePrompt}. Romance novel cover style. Professional editorial lighting. Handsome male model. Intense romantic gaze. High fashion photography. Fit entire subject in vertical frame.`;
  
  const imageResult = await generateCheapImage(visualPrompt);

  console.log(`✅ Post generated! Text: $${textCost}, Image: $${imageResult.cost}, Total: $${textCost + imageResult.cost}`);

  return {
    trope,
    image: {
      url: imageResult.url,
      cost: imageResult.cost,
      model: imageResult.model
    },
    caption: content.caption,
    hashtags: content.hashtags,
    hookLine: content.hookLine,
    povScript: content.povScript,
    totalCost: textCost + imageResult.cost
  };
};

export const generateContentBatch = async (
  tropes: string[],
  count: number = 10
): Promise<SocialPost[]> => {
  console.log(`🎬 Generating ${count} social posts...`);
  
  const posts: SocialPost[] = [];
  const tropeList = tropes.length > 0 ? tropes : Object.keys(TROPE_PROMPTS);
  
  for (let i = 0; i < count; i++) {
    const randomTrope = tropeList[Math.floor(Math.random() * tropeList.length)];
    
    try {
      const post = await generateSocialPost(randomTrope);
      posts.push(post);
      console.log(`✅ Post ${i + 1}/${count} complete`);
    } catch (error) {
      console.error(`❌ Post ${i + 1} failed:`, error);
    }
    
    // Small delay to avoid rate limits
    if (i < count - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return posts;
};

export const calculateBatchCost = (count: number, useCheapImages: boolean = true): { total: number; perPost: number; breakdown: string } => {
  const textCost = 0.0006;
  const imageCost = useCheapImages ? 0.008 : 0.039;
  const perPost = textCost + imageCost;
  const total = perPost * count;
  
  return {
    total,
    perPost,
    breakdown: `${count} posts × ($${textCost} text + $${imageCost} image) = $${total.toFixed(2)}`
  };
};

export const getAvailableTropes = (): string[] => {
  return Object.keys(TROPE_PROMPTS);
};