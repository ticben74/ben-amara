
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { trackPerformance, logError } from "./monitoringService";
import { StopInteraction } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const getCache = (key: string) => {
  const cached = localStorage.getItem(`gemini_cache_${key}`);
  if (cached) return JSON.parse(cached);
  return null;
};

const setCache = (key: string, value: any) => {
  localStorage.setItem(`gemini_cache_${key}`, JSON.stringify(value));
};

/**
 * وظيفة جديدة: صقل ملاحظات الفنان البشري وتحويلها لسرد احترافي
 */
export const refineArtistNarrative = async (notes: string, location: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `أنت مساعد "منسق ثقافي". أمامك ملاحظات فنية خام من فنان بشري عن موقع "${location}". 
      قم بإعادة صياغة هذه الملاحظات: "${notes}" إلى نص سردي شاعري، دافئ، ومركز (حوالي 50 كلمة) يصلح ليكون حكاية صوتية أو نصاً تعريفياً بجانب العمل الفني. 
      حافظ على روح الفنان الأصلية ولكن امنحها صقلاً أدبياً.`,
    });
    return response.text || notes;
  } catch (error) {
    logError(error as Error, { context: 'refineArtistNarrative' });
    return notes;
  }
};

export const generateStopInteraction = async (location: string, type: string): Promise<StopInteraction> => {
  const cacheKey = `interaction_${location}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `أنت مرشد سياحي ذكي. قم بإنشاء سؤال تحدي (Quizz) واحد عن محطة "${location}" وهي عبارة عن "${type}". 
      السؤال يجب أن يكون مشوقاً ويحث الزائر على تأمل المكان.
      أريد الإجابة بصيغة JSON حصراً تتضمن:
      - question: نص السؤال
      - options: مصفوفة من 3 خيارات
      - correctAnswer: الخيار الصحيح
      - fact: حقيقة تاريخية أو فنية قصيرة مرتبطة بالإجابة.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            correctAnswer: { type: Type.STRING },
            fact: { type: Type.STRING }
          },
          required: ["question", "options", "correctAnswer", "fact"]
        }
      }
    });

    const result = JSON.parse(response.text);
    setCache(cacheKey, result);
    return result;
  } catch (error) {
    logError(error as Error, { location });
    return {
      question: "ما هو شعورك وأنت تتأمل هذا المعلم التاريخي الآن؟",
      options: ["انبهار بالتاريخ", "هدوء نفسي", "ارتباط بالمكان"],
      correctAnswer: "ارتباط بالمكان",
      fact: "هذا المكان شهد آلاف القصص عبر العصور."
    };
  }
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
        // تم إزالة thinkingBudget: 0 لأن موديل Pro يتطلب ميزانية تفكير ولا يدعم الصفر
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
