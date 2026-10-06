import { isSuperuser } from './superuser';

export interface FeatureConfig {
  enabled: boolean;
  superuserOnly: boolean;
  description: string;
}

export const FEATURES: Record<string, FeatureConfig> = {
  CASTING_DIRECTOR: {
    enabled: true,
    superuserOnly: false,
    description: 'Romance trope selection',
  },
  
  FANTASY_DASHBOARD: {
    enabled: true,
    superuserOnly: false,
    description: 'Boyfriend profile display',
  },
  
  ADVANCED_PANEL: {
    enabled: true,
    superuserOnly: true,
    description: 'Testing control panel',
  },
  
  CHEAP_IMAGES: {
    enabled: true,
    superuserOnly: true,
    description: 'Cheap image generation',
  },
  
  SOCIAL_CONTENT: {
    enabled: true,
    superuserOnly: true,
    description: 'Mass content generation',
  },
};

export const isFeatureEnabled = (featureName: keyof typeof FEATURES): boolean => {
  const feature = FEATURES[featureName];
  
  if (!feature || !feature.enabled) {
    return false;
  }
  
  if (feature.superuserOnly) {
    return isSuperuser();
  }
  
  return true;
};

export const getEnabledFeatures = (): string[] => {
  return Object.keys(FEATURES).filter(key => 
    isFeatureEnabled(key as keyof typeof FEATURES)
  );
};
