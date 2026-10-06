import type { LiveServerMessage } from "@google/genai";
import { BoyfriendProfile, TropeType, Atmosphere, DirectorInput, ComplianceAudit, Archetype } from "../types";
import { postJson } from "./apiClient";

// All model calls run in the /api serverless functions; no API key exists in the browser.

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
    try {
        const { data } = await postJson<{ data: any }>('/api/profile', { kind: 'manifest', bookDescription });
        return { ...data, voicePersonality: getVoiceForTrope(data.trope) };
    } catch (e) { console.error("Manifest Error:", e); }
    return generateCoreProfile({ name: "The Hero", trope: TropeType.THE_VILLAIN, archetype: "Seoul Titan", vibe: "Intense" });
};

export const generateCoreProfile = async (input: DirectorInput): Promise<BoyfriendProfile> => {
    const forcedVoice = getVoiceForTrope(input.trope);
    try {
        const { data } = await postJson<{ data: any }>('/api/profile', { kind: 'core', input });
        return { ...data, voicePersonality: forcedVoice };
    } catch (e) { console.error("Core Profile Error:", e); }
    return { name: input.name, trope: input.trope, visualDescription: "Deep, realistic gaze", atmosphere: Atmosphere.OFFICE_LATE, voicePersonality: forcedVoice as any, hookLine: "I told you to wait." };
};

export const enrichBoyfriendProfile = async (currentProfile: BoyfriendProfile): Promise<Partial<BoyfriendProfile>> => {
    try {
        const { data } = await postJson<{ data: Partial<BoyfriendProfile> }>('/api/profile', {
            kind: 'enrich',
            profile: { name: currentProfile.name, trope: currentProfile.trope },
        });
        return data;
    } catch (e) { console.error("Enrich Error:", e); }
    return {};
};

export const generateFantasyImage = async (profile: BoyfriendProfile): Promise<string> => {
    const { image } = await postJson<{ image: string }>('/api/image', {
        kind: 'fantasy',
        profile: {
            name: profile.name,
            trope: profile.trope,
            visualDescription: profile.visualDescription,
            atmosphere: profile.atmosphere,
        },
    });
    return image;
};

export const generateIntimatesImage = async (profile: BoyfriendProfile, referenceImageUrl?: string): Promise<string> => {
    const { image } = await postJson<{ image: string }>('/api/image', {
        kind: 'intimates',
        profile: { name: profile.name, intimatesDescription: profile.intimatesDescription },
        referenceImage: referenceImageUrl,
    });
    return image;
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
    const { audio } = await postJson<{ audio: string }>('/api/tts', { text, voiceName });
    return audio || "";
};

export const connectLiveCall = async (profile: BoyfriendProfile, onMessage: (msg: string) => void, onEnd: () => void) => {
    // The server mints a short-lived, single-use token with the model, voice and persona locked in.
    const { token, model } = await postJson<{ token: string; model: string }>('/api/live-token', {
        name: profile.name,
        trope: profile.trope,
        voiceName: profile.voicePersonality || 'Fenrir',
    });
    const { GoogleGenAI, Modality } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey: token, httpOptions: { apiVersion: 'v1alpha' } });
    const outCtx = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
    const inCtx = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 16000});
    let nextStartTime = 0;
    const sources = new Set<AudioBufferSourceNode>();

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    const sessionPromise = ai.live.connect({
        model,
        callbacks: {
            onopen: () => {
                const source = inCtx.createMediaStreamSource(stream);
                const scriptProcessor = inCtx.createScriptProcessor(4096, 1, 1);
                scriptProcessor.onaudioprocess = (e) => {
                    const inputData = e.inputBuffer.getChannelData(0);
                    const l = inputData.length;
                    const int16 = new Int16Array(l);
                    for (let i = 0; i < l; i++) { int16[i] = inputData[i] * 32768; }
                    sessionPromise.then(s => s.sendRealtimeInput({ audio: { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' } }));
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
        // Voice and system prompt are locked into the token server-side.
        config: { responseModalities: [Modality.AUDIO] }
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
    const tropes = Object.values(TropeType);
    const randomTrope = tropes[Math.floor(Math.random() * tropes.length)];
    try {
        const { text, audio } = await postJson<{ text: string; audio: string }>('/api/hook', {
            trope: randomTrope,
            voiceName: getVoiceForTrope(randomTrope),
        });
        return { text, audio, trope: randomTrope };
    } catch (e) { console.error("Hook Generation Failed:", e); return null; }
};

export interface PersonaChat {
    sendMessage: (message: string) => Promise<string>;
}

/** Chat history lives in the browser; each turn is a stateless call to /api/chat. */
export const initializePersonaChat = (persona: { name: string; bio: string; archetype: string }): PersonaChat => {
    const history: { role: 'user' | 'model'; text: string }[] = [];
    return {
        sendMessage: async (message: string) => {
            const { text } = await postJson<{ text: string }>('/api/chat', { persona, history, message });
            history.push({ role: 'user', text: message }, { role: 'model', text });
            return text;
        },
    };
};

export const validateVitruvianCompliance = async (imageUrl: string): Promise<ComplianceAudit> => ({ headRatio: 8.0, apeIndex: 1.0, centerOffset: 0 });
export const estimateRequestCost = (type: 'text' | 'image' | 'audio', units: number) => ({ tokens: units, costUSD: 0 });
export const getVoicePersonality = (archetype: string | Archetype): string => 'Fenrir';
export const generateVoiceLine = async (text: string, archetype: string): Promise<string> => generateVoiceResponse(text, 'Fenrir');

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
