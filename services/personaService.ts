import { postJson } from './apiClient';

export interface CouncilPersona {
  role: string;
  name: string;
  essence: string;
  focus: string;
  tone: string;
  iconicQuote: string;
}

export const generateCouncilPersonas = async (): Promise<CouncilPersona[]> => {
  try {
    const { personas } = await postJson<{ personas: CouncilPersona[] }>('/api/personas');
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