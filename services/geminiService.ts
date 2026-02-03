
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { trackPerformance, logError } from "./monitoringService";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const getCache = (key: string) => {
  const cached = localStorage.getItem(`gemini_cache_${key}`);
  if (cached) return JSON.parse(cached);
  return null;
};

const setCache = (key: string, value: any) => {
  localStorage.setItem(`gemini_cache_${key}`, JSON.stringify(value));
};

export const generateStory = async (intervention: string, neighborhood?: string, base64Image?: string) => {
  const startTime = performance.now();
  const cacheKey = `story_${intervention}_${neighborhood || 'any'}_${base64Image ? 'with_img' : 'no_img'}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  try {
    const modelName = 'gemini-3-pro-preview'; 
    let prompt = `أنت "روح المكان"، حكواتي يسكن جدران المدينة ويعرف خفايا أزقتها. 
قم بتأليف حكاية قصيرة جداً (حوالي ٤٠-٦٠ كلمة) بلهجة مصرية عامية دافئة جداً، شاعرية، ومليئة بالحنّية.`;
    
    if (neighborhood) {
      prompt += ` الحكاية تدور في حي "${neighborhood}" العريق. استلهم من رائحة بخوره، صوت أجراسه، تفاصيل مشربياته، أو دفء سلام المارين فيه.`;
    }

    if (intervention === "مقعد الحكايا الصوتية") {
      prompt += ` تخيل أنك المقعد الخشبي القديم الذي شهد آلاف اللقاءات. احكِ موقفاً إنسانياً قصيراً جداً (مثل لقاء صديقين قدامى، أو جلسة تأمل لعجوز، أو همسة حب عابرة) حدث فوقك.`;
    }

    const parts: any[] = [{ text: prompt }];
    if (base64Image) {
      parts.push({
        inlineData: { mimeType: "image/jpeg", data: base64Image }
      });
    }

    const response = await ai.models.generateContent({
      model: modelName,
      contents: { parts },
      config: { 
        temperature: 0.9, 
        topP: 0.95,
        thinkingConfig: { thinkingBudget: 0 } 
      }
    });

    const result = response.text || "";
    setCache(cacheKey, result);
    trackPerformance('generateStory', performance.now() - startTime);
    return result;
  } catch (error) {
    logError(error as Error, { intervention, neighborhood });
    throw error;
  }
};

export const generateSpeech = async (text: string): Promise<Uint8Array | null> => {
  const startTime = performance.now();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `بصوت حكواتي مسن، حكيم، ودافئ، يحكي القصة بتأنٍ وهدوء: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) return null;

    trackPerformance('generateSpeech', performance.now() - startTime);
    return decodeBase64(base64Audio);
  } catch (error) {
    logError(error as Error, { textSnippet: text.slice(0, 20) });
    return null;
  }
};

export const generateArt = async (prompt: string): Promise<string | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: `A high-quality artistic painting capturing the soul of: ${prompt}. Style: Contemporary Middle Eastern art, oil on canvas, rich textures, moody lighting.` }],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      }
    });

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    return null;
  } catch (error) {
    logError(error as Error, { prompt });
    throw error;
  }
};

export const getPlaceInfo = async (locationName: string) => {
  const cached = getCache(`place_${locationName}`);
  if (cached) return cached;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `أعطني معلومات ثقافية وتاريخية غنية عن حي "${locationName}" بأسلوب حكواتي مشوق.`,
      config: {
        tools: [{ googleMaps: {} }],
      },
    });

    const text = response.text || "تعذر جلب المعلومات حالياً.";
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const links = groundingChunks
      .filter((chunk: any) => chunk.maps?.uri)
      .map((chunk: any) => ({ title: chunk.maps.title || "استكشف على الخريطة", uri: chunk.maps.uri }));

    const result = { text, links };
    setCache(`place_${locationName}`, result);
    return result;
  } catch (error) {
    logError(error as Error, { locationName });
    return { text: "تعذر جلب المعلومات المكانية.", links: [] };
  }
};

function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioBuffer(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}
