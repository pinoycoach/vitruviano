
export enum TropeType {
  THE_VILLAIN = "The Villain",
  THE_BILLIONAIRE = "The Billionaire",
  THE_GOLDEN_RETRIEVER = "The Golden Retriever",
  THE_GRUMPY_SUNSHINE = "Grumpy x Sunshine",
  THE_ACADEMIC_RIVAL = "Academic Rival",
  THE_PROTECTOR = "The Bodyguard",
  THE_ROCKSTAR = "The Rockstar",
  THE_FORBIDDEN_LOVE = "The Forbidden Love",
  THE_BILLIONAIRES_SECRET = "The Billionaire's Secret",
  SMALL_TOWN_PROTECTOR = "Small Town Protector",
  THE_SINGLE_DAD = "The Single Dad",
  THE_ROYAL = "The Royal Dilemma",
  THE_FLASH_MARRIAGE_CEO = "Flash Marriage CEO",
  THE_VENGEFUL_EX = "The Vengeful Ex",
  THE_HIDDEN_TYCOON = "The Hidden Tycoon",
  THE_CONTRACT_HUSBAND = "Contract Husband",
  THE_ALPHA_COMMANDER = "The Alpha Commander"
}

export enum Atmosphere {
  OFFICE_LATE = "Executive Office, Midnight, City Lights",
  RAINY_ALLEY = "Dark Alley, Heavy Rain, Neon Reflections",
  LUXURY_CAR = "Back of Phantom, Leather Seats, Tinted Windows",
  LOCKER_ROOM = "Steam Room, Towel, Post-Game",
  LIBRARY = "Old Library, Dust Motes, Shafts of Light",
  BEDROOM_MORNING = "Rumpled Sheets, Morning Sun, Coffee",
  CABIN_STORM = "Isolated Cabin, Blizzards, Roaring Fire",
  ROYAL_BALCONY = "Palace Balcony, Moonlight, Distant Waltz",
  SMALL_TOWN_PORCH = "Wooden Porch, Sunset, Crickets",
  SECRET_GARDEN = "Walled Garden, Blooming Jasmine, Twilight",
  PENTHOUSE_POOL = "Infinity Pool, City Skyline, Night",
  PRIVATE_JET = "Private Jet, Champagne, 30,000ft",
  GALA_ENTRANCE = "Red Carpet, Flashing Cameras, Black Tie",
  HOSPITAL_VIP = "VIP Ward, Sterility, Hidden Emotion"
}

export interface MicroBeat {
  timestamp: number;
  text: string;
  type: 'thought' | 'action' | 'text_message';
}

export interface BoyfriendProfile {
  name: string;
  trope: TropeType;
  visualDescription: string;
  voicePersonality: 'Fenrir' | 'Puck' | 'Kore' | 'Charon';
  atmosphere: Atmosphere;
  hookLine: string;
  bookSource?: string; // e.g. "A Court of Mist and Fury"
  
  intimatesDescription?: string;
  secretVoicemailScript?: string; 
  loveLetterText?: string; 
  microBeats?: MicroBeat[]; 
  bookRecommendation?: {
    title: string;
    author: string;
    amazonQuery: string;
    blurb: string;
    excerpt: string;
  };
}

export interface DirectorInput {
  name: string;
  trope: TropeType;
  archetype: string; 
  vibe: string; 
}

export const VISUAL_ARCHETYPES = [
  { id: "SEOUL_TITAN", label: "Seoul Titan", desc: "K-Drama CEO aesthetics. Sharp suits, glass skin." },
  { id: "ROME_NOMAD", label: "Rome Nomad", desc: "Mediterranean warmth. Linen shirts, sun-kissed." },
  { id: "EBONY_HERO", label: "Ebony Hero", desc: "Powerful, protective, statuesque definition." },
  { id: "NORDIC_NOIR", label: "Nordic Noir", desc: "Cold, calculating, minimalist luxury." },
  { id: "URBAN_WARRIOR", label: "Urban Warrior", desc: "Streetwear, tattoos, intense gaze." },
  { id: "HERITAGE_ICON", label: "Heritage Icon", desc: "Rugged, bearded, flannel and woodsmoke." },
];

export interface UserWallet {
  coins: number;
  streakDays: number;
  lastLoginDate: string;
}

export const ECONOMY_COSTS = {
  UNLOCK_VAULT: 50,
  PLAY_AUDIO: 20,
  READ_EXCERPT: 15,
  CHAT_MESSAGE: 5
};

export const ECONOMY_REWARDS = {
  DAILY_LOGIN: 30,
  WATCH_AD: 15,
  SHARE_PROFILE: 25
};

// Legacy Vitruvian Types kept for compatibility
export interface BodyMeasurements {
  name: string;
  height: number;
  wingspan: number;
  headLength: number;
  handLength?: number;
  footLength?: number;
}

export enum Archetype {
  UNDEFINED = "Undefined",
  VITRUVIAN_IDEAL = "Vitruvian Ideal",
  MODERN_HEROIC = "Modern Heroic",
  RENAISSANCE_REALISM = "Renaissance Realism",
  NEOCLASSICAL_POWER = "Neoclassical Power"
}

export interface RatioAnalysis {
  apeIndex: number;
  headRatio: number;
  handRatio: number | null;
  footRatio: number | null;
  vitruvianScore: number;
  archetype: Archetype;
}

export interface AiInsight {
  title: string;
  marketValue: string;
  datingBio: string;
  romanceHook?: string;
  shoppingList?: { brand: string; item: string; price: string }[];
  bookRecommendation?: {
    title: string;
    author: string;
    amazonQuery: string;
    whyItFits: string;
    excerpt?: string;
  };
  critique: string;
  advice: string;
}

export interface GeneratedImage {
  url: string;
}

export interface ComplianceAudit {
  headRatio: number;
  apeIndex: number;
  centerOffset: number;
}
