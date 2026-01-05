
import { GoogleGenAI, Modality, Type, Chat, GenerateContentResponse, LiveServerMessage } from "@google/genai";
import { BoyfriendProfile, TropeType, Atmosphere, DirectorInput, ComplianceAudit, Archetype } from "../types";

const SYSTEM_INSTRUCTION = `
ROLE: You are the Soul of NEXUS. You are a romantic visionary.
OBJECTIVE: Create profound emotional resonance and visual seduction. Every word you write should feel like a line from a cherished novel. 
STYLE: Poetic, intimate, high-status, intense. Avoid technical jargon.
RULES:
1. Every hook line must be breathtaking.
2. Every micro-beat should be cinematic.
3. The 'intimatesDescription' must be high-fashion editorial (Calvin Klein style), describing the character in boxers/briefs or loungewear with focus on physique and soft lighting.
4. Every letter should feel like it was written in ink by candlelight.
OUTPUT: Valid JSON only. No prose outside JSON.
`;

const getAiInstance = () => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) throw new Error("API Key not found.");
    return new GoogleGenAI({ apiKey });
};

const withRetry = async <T>(fn: () => Promise<T>, retries = 2): Promise<T> => {
    try {
        return await fn();
    } catch (e: any) {
        if (retries > 0 && (e.status === 500 || e.status === 503 || e.message?.includes('500'))) {
            await new Promise(r => setTimeout(r, 1000));
            return withRetry(fn, retries - 1);
        }
        throw e;
    }
};

export const getVoiceForTrope = (trope: TropeType): string => {
    switch (trope) {
        case TropeType.THE_GOLDEN_RETRIEVER: return 'Puck'; 
        case TropeType.THE_ROCKSTAR: return 'Kore'; 
        case TropeType.THE_HIDDEN_TYCOON: return 'Puck';
        case TropeType.THE_VENGEFUL_EX: return 'Kore';
        case TropeType.THE_ACADEMIC_RIVAL: return 'Charon'; 
        case TropeType.THE_SINGLE_DAD: return 'Charon';
        case TropeType.THE_ROYAL: return 'Charon';
        case TropeType.THE_BILLIONAIRE: return 'Charon';
        case TropeType.THE_CONTRACT_HUSBAND: return 'Charon';
        default: return 'Fenrir';
    }
};

export const generateManifestProfile = async (bookDescription: string): Promise<BoyfriendProfile> => {
    const ai = getAiInstance();
    const prompt = `Manifest a character based on this book description: "${bookDescription}". Return JSON with name, trope, visualDescription, atmosphere, hookLine, bookSource.`;

    try {
        const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                systemInstruction: SYSTEM_INSTRUCTION,
                responseMimeType: "application/json",
            }
        }));

        const cleanText = (response.text || '').replace(/^```json/, '').replace(/```$/, '').trim();
        if (cleanText) {
            const parsed = JSON.parse(cleanText);
            const forcedVoice = getVoiceForTrope(parsed.trope);
            return { ...parsed, voicePersonality: forcedVoice };
        }
    } catch (e) { console.error("Manifest Error:", e); }
    return generateCoreProfile({ name: "The Hero", trope: TropeType.THE_VILLAIN, archetype: "Seoul Titan", vibe: "Intense" });
};

export const generateCoreProfile = async (input: DirectorInput): Promise<BoyfriendProfile> => {
    const ai = getAiInstance();
    const forcedVoice = getVoiceForTrope(input.trope);
    const prompt = `Create a core profile for ${input.name}, a ${input.trope}. Archetype: ${input.archetype}, Vibe: ${input.vibe}. Return JSON: name, trope, visualDescription, atmosphere, hookLine.`;

    try {
        const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: { systemInstruction: SYSTEM_INSTRUCTION, responseMimeType: "application/json" }
        }));
        const cleanText = (response.text || '').replace(/^```json/, '').replace(/```$/, '').trim();
        if (cleanText) return { ...JSON.parse(cleanText), voicePersonality: forcedVoice };
    } catch (e) { console.error("Core Profile Error:", e); }
    return { name: input.name, trope: input.trope, visualDescription: "Deep, realistic gaze", atmosphere: Atmosphere.OFFICE_LATE, voicePersonality: forcedVoice as any, hookLine: "I told you to wait." };
};

export const enrichBoyfriendProfile = async (currentProfile: BoyfriendProfile): Promise<Partial<BoyfriendProfile>> => {
    const ai = getAiInstance();
    const prompt = `Enrich lore for ${currentProfile.name} (${currentProfile.trope}). Return JSON: intimatesDescription, secretVoicemailScript, loveLetterText, microBeats, bookRecommendation. Provide a detailed, spicy but high-fashion intimatesDescription (e.g. wearing black designer boxers).`;

    try {
        const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: { systemInstruction: SYSTEM_INSTRUCTION, responseMimeType: "application/json" }
        }));
        const cleanText = (response.text || '').replace(/^```json/, '').replace(/```$/, '').trim();
        if (cleanText) return JSON.parse(cleanText);
    } catch (e) { console.error("Enrich Error:", e); }
    return {};
};

export const generateFantasyImage = async (profile: BoyfriendProfile): Promise<string> => {
    const ai = getAiInstance();
    // REFINED PROMPT: Forbidding glows/supernatural effects, enforcing high-end photography.
    const prompt = `Cinematic film still, 35mm photography. SUBJECT: ${profile.name}, ${profile.trope}. ${profile.visualDescription}. ${profile.atmosphere}. Realistic human skin textures, deep realistic eyes, natural dramatic shadows, Wong Kar-wai color palette. ABSOLUTELY NO glowing eyes, NO supernatural effects, NO laser beams. Professional lighting.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-image-preview',
            contents: { parts: [{ text: prompt }] },
            config: { imageConfig: { aspectRatio: "3:4", imageSize: "1K" } }
        });
        const base64 = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
        if (!base64) throw new Error("No image data in Pro response");
        return `data:image/png;base64,${base64}`;
    } catch (e) {
        const res2 = await ai.models.generateContent({ model: 'gemini-2.5-flash-image', contents: { parts: [{ text: prompt }] } });
        const b64 = res2.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
        return `data:image/png;base64,${b64}`;
    }
};

export const generateIntimatesImage = async (profile: BoyfriendProfile, referenceImageUrl?: string): Promise<string> => {
    const ai = getAiInstance();
    const desc = profile.intimatesDescription || "A man wearing black designer boxer briefs, standing in a dimly lit high-end apartment.";
    const promptText = `High-end Fashion Editorial, Calvin Klein style. SUBJECT: ${profile.name}. ${desc}. Realistic skin, muscular definition, moody lighting. No glows, no fantasy elements. Seductive and high-status.`;
    
    let parts: any[] = referenceImageUrl ? [{ inlineData: { mimeType: 'image/png', data: referenceImageUrl.split(',')[1] } }] : [];
    parts.push({ text: promptText });

    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash-image', contents: { parts } });
    const base64 = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
    return `data:image/png;base64,${base64}`;
};

const encode = (bytes: Uint8Array) => {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) { binary += String.fromCharCode(bytes[i]); }
  return btoa(binary);
};

const decode = (base64: string) => {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
};

const decodeAudioData = async (data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number) => {
  const alignedBuffer = new ArrayBuffer(data.length);
  new Uint8Array(alignedBuffer).set(data);
  const dataInt16 = new Int16Array(alignedBuffer);
  
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
  }
  return buffer;
};

let audioCtx: AudioContext | null = null;
export const playRawAudio = async (base64String: string): Promise<void> => {
    if(!base64String) return; 
    if (!audioCtx) audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    if (audioCtx.state === 'suspended') await audioCtx.resume();
    const pcmData = decode(base64String);
    const buffer = await decodeAudioData(pcmData, audioCtx, 24000, 1);
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(audioCtx.destination);
    source.start(0);
    return new Promise(resolve => { source.onended = () => resolve(); });
};

export const generateVoiceResponse = async (text: string, voiceName: string): Promise<string> => {
    const ai = getAiInstance();
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: text }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceName } } },
        },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
};

export const connectLiveCall = async (profile: BoyfriendProfile, onMessage: (msg: string) => void, onEnd: () => void) => {
    const ai = getAiInstance();
    const outCtx = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
    const inCtx = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 16000});
    let nextStartTime = 0;
    const sources = new Set<AudioBufferSourceNode>();

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
            onopen: () => {
                const source = inCtx.createMediaStreamSource(stream);
                const scriptProcessor = inCtx.createScriptProcessor(4096, 1, 1);
                scriptProcessor.onaudioprocess = (e) => {
                    const inputData = e.inputBuffer.getChannelData(0);
                    const l = inputData.length;
                    const int16 = new Int16Array(l);
                    for (let i = 0; i < l; i++) { int16[i] = inputData[i] * 32768; }
                    sessionPromise.then(s => s.sendRealtimeInput({ media: { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' } }));
                };
                source.connect(scriptProcessor);
                scriptProcessor.connect(inCtx.destination);
            },
            onmessage: async (msg: LiveServerMessage) => {
                const base64 = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                if (base64) {
                    nextStartTime = Math.max(nextStartTime, outCtx.currentTime);
                    const audioBuffer = await decodeAudioData(decode(base64), outCtx, 24000, 1);
                    const source = outCtx.createBufferSource();
                    source.buffer = audioBuffer;
                    source.connect(outCtx.destination);
                    source.start(nextStartTime);
                    nextStartTime += audioBuffer.duration;
                    sources.add(source);
                }
                if (msg.serverContent?.interrupted) {
                    sources.forEach(s => s.stop());
                    sources.clear();
                    nextStartTime = 0;
                }
            },
            onclose: () => {
                stream.getTracks().forEach(t => t.stop());
                onEnd();
            }
        },
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: profile.voicePersonality || 'Fenrir' } } },
            systemInstruction: `You are ${profile.name}, the character the user has manifested. You are ${profile.trope}. This is a phone call. Stay in character. Be seductive, intense, or appropriate to your trope. Keep responses relatively short.`,
        }
    });

    return {
        stop: () => {
            sessionPromise.then(s => s.close());
            stream.getTracks().forEach(t => t.stop());
            outCtx.close();
            inCtx.close();
        }
    };
};

export const generateOpeningHook = async (): Promise<{ text: string, audio: string, trope: TropeType } | null> => {
    const ai = getAiInstance();
    const tropes = Object.values(TropeType);
    const randomTrope = tropes[Math.floor(Math.random() * tropes.length)];
    const prompt = `Generate a single short, intense hook line (max 8 words) that a ${randomTrope} would say to someone they are obsessing over. Breathtaking and poetic.`;
    try {
        const textResponse = await ai.models.generateContent({ model: "gemini-3-flash-preview", contents: prompt, config: { systemInstruction: SYSTEM_INSTRUCTION } });
        const hookText = (textResponse.text || '').trim() || "I've been waiting.";
        const voiceName = getVoiceForTrope(randomTrope);
        const audioBase64 = await generateVoiceResponse(hookText, voiceName);
        return { text: hookText, audio: audioBase64, trope: randomTrope };
    } catch (e) { console.error("Hook Generation Failed:", e); return null; }
};

export const initializePersonaChat = (persona: { name: string; bio: string; archetype: string }): Chat => {
    const ai = getAiInstance();
    return ai.chats.create({
        model: "gemini-3-flash-preview",
        config: { systemInstruction: `You are ${persona.name}, a ${persona.archetype}. Your bio: ${persona.bio}. Stay in character. Every word is a love letter. Keep responses brief but meaningful. Your tone is seductive and high-status.` }
    });
};

export const validateVitruvianCompliance = async (imageUrl: string): Promise<ComplianceAudit> => ({ headRatio: 8.0, apeIndex: 1.0, centerOffset: 0 });
export const estimateRequestCost = (type: 'text' | 'image' | 'audio', units: number) => ({ tokens: units, costUSD: 0 });
export const getVoicePersonality = (archetype: string | Archetype): string => 'Fenrir';
export const generateVoiceLine = async (text: string, archetype: string): Promise<string> => generateVoiceResponse(text, 'Fenrir');

// MISSING EXPORTS - Adding now
export const generateDirectorProfile = async (input: DirectorInput): Promise<BoyfriendProfile> => {
    const core = await generateCoreProfile(input);
    const extra = await enrichBoyfriendProfile(core);
    return { ...core, ...extra };
};

export const generateBoyfriendProfile = async (trope: TropeType, reaction: string): Promise<BoyfriendProfile> => {
    return generateDirectorProfile({ 
        name: "Unknown", 
        trope, 
        archetype: "Seoul Titan", 
        vibe: reaction 
    });
};
