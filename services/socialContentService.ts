import { postJson } from './apiClient';

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

/** Superuser-only; text and image are generated server-side by /api/social. */
export const generateSocialPost = async (trope: string): Promise<SocialPost> => {
  console.log(`📱 Generating social post for: ${trope}`);
  const post = await postJson<SocialPost>('/api/social', { trope });
  console.log(`✅ Post generated! Total: $${post.totalCost}`);
  return post;
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