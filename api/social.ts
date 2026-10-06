import { generateFalImage } from './_lib/fal.js';
import { extractJson, generateImage, generateText } from './_lib/gemini.js';
import { MODELS } from '../config/models.js';
import { errorResponse, json, methodNotAllowed, readJson, safely, str, toNodeHandler } from './_lib/http.js';
import { socialPrompt } from './_lib/prompts.js';
import { isSuperuserRequest } from './_lib/superuser.js';

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
  'The Alpha Commander': 'Military bearing, tactical gear, authoritative presence, leadership energy',
};

const TEXT_COST = 0.0006;

/** Superuser only. POST { trope } -> SocialPost */
export const handle = safely(async (request) => {
  if (request.method !== 'POST') return methodNotAllowed(['POST']);
  if (!isSuperuserRequest(request)) return errorResponse(403, 'Forbidden');

  const body = await readJson(request, 2 * 1024);
  const trope = str(body.trope, 'trope', 100);

  const content = extractJson(await generateText(socialPrompt(trope)), 'object') as Record<string, string>;

  const imagePrompt = TROPE_PROMPTS[trope] || trope;
  const visualPrompt = `Cinematic 9:16 vertical portrait. ${imagePrompt}. Romance novel cover style. Professional editorial lighting. Handsome male model. Intense romantic gaze. High fashion photography. Fit entire subject in vertical frame.`;

  let image = await generateFalImage(visualPrompt);
  if (!image) {
    const url = await generateImage(
      `${visualPrompt} --aspect 9:16 --ar 9:16. Vertical portrait composition.`,
      [MODELS.imagePrimary, MODELS.imageFallback],
    );
    image = { url, seed: 0, cost: 0.039, model: MODELS.imageFallback, usedFallback: true };
  }

  return json({
    trope,
    image: { url: image.url, cost: image.cost, model: image.model },
    caption: content.caption,
    hashtags: content.hashtags,
    hookLine: content.hookLine,
    povScript: content.povScript,
    totalCost: TEXT_COST + image.cost,
  });
});

export default toNodeHandler(handle);
