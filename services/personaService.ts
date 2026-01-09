import { GoogleGenAI } from '@google/genai';

const API_KEY = (import.meta as any).env.VITE_GEMINI_API_KEY;
export interface CouncilPersona {
  role: string;
  name: string;
  essence: string;
  focus: string;
  tone: string;
  iconicQuote: string;
}

export const generateCouncilPersonas = async (): Promise<CouncilPersona[]> => {
  if (!API_KEY) {
    throw new Error('Google API key not found');
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  const prompt = `Generate 3 unique council personas for critiquing male attractiveness and style.

Return ONLY valid JSON (no markdown, no backticks):
[
  {
    "role": "The Visionary",
    "name": "unique inspiring name",
    "essence": "2-3 word description",
    "focus": "what they critique",
    "tone": "how they speak",
    "iconicQuote": "one memorable line"
  },
  {
    "role": "The Critic", 
    "name": "unique harsh name",
    "essence": "2-3 word description",
    "focus": "what they critique",
    "tone": "how they speak",
    "iconicQuote": "one memorable line"
  },
  {
    "role": "The Realist",
    "name": "unique pragmatic name",
    "essence": "2-3 word description", 
    "focus": "what they critique",
    "tone": "how they speak",
    "iconicQuote": "one memorable line"
  }
]

Make them distinct, memorable, and slightly dramatic.`;

  try {
    console.log('🎭 Generating dynamic personas...');
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-8b',
      contents: { parts: [{ text: prompt }] }
    });
    
    const text = response.text || '';
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    
    if (!jsonMatch) {
      throw new Error('No valid JSON found in response');
    }
    
    const personas = JSON.parse(jsonMatch[0]);
    console.log('✅ Dynamic personas generated! Cost: $0.0006');
    
    return personas;
  } catch (error) {
    console.error('Persona generation failed:', error);
    
    // Fallback to defaults
    return [
      {
        role: 'The Visionary',
        name: 'Steve Jobs',
        essence: 'Ruthless Simplicity',
        focus: 'Overall aesthetic and presence',
        tone: 'Inspiring but demanding',
        iconicQuote: 'One more thing... you need better style.'
      },
      {
        role: 'The Critic',
        name: 'Karl Lagerfeld',
        essence: 'Brutal Honesty',
        focus: 'Fashion and grooming details',
        tone: 'Cutting and direct',
        iconicQuote: 'Sweatpants are a sign of defeat.'
      },
      {
        role: 'The Realist',
        name: 'The Red Pill',
        essence: 'Market Truth',
        focus: 'Dating market value',
        tone: 'Clinical and data-driven',
        iconicQuote: 'The market doesn\'t care about your feelings.'
      }
    ];
  }
};

export const getOrCreatePersonas = async (): Promise<CouncilPersona[]> => {
  const stored = localStorage.getItem('vitruviano_personas');
  
  if (stored) {
    console.log('Using cached personas');
    return JSON.parse(stored);
  }
  
  const personas = await generateCouncilPersonas();
  localStorage.setItem('vitruviano_personas', JSON.stringify(personas));
  
  return personas;
};

export const clearPersonas = (): void => {
  localStorage.removeItem('vitruviano_personas');
  console.log('Personas cleared');
};