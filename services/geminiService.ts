import { GoogleGenAI } from "@google/genai";
import { Language } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const translateText = async (
  text: string,
  targetLang: Language
): Promise<string> => {
  if (!text.trim()) return "";

  const prompt = targetLang === Language.PERSIAN
    ? `Translate the following text to Persian (Farsi). Provide a natural, fluent translation suitable for a general audience. Do not add any explanations or notes, just the translation. Text: "${text}"`
    : `Translate the following Persian (Farsi) text to English. Provide a natural, fluent translation. Do not add any explanations or notes, just the translation. Text: "${text}"`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        // Lower temperature for more deterministic/accurate translations
        temperature: 0.3, 
      }
    });

    const result = response.text;
    return result || "";
  } catch (error) {
    console.error("Translation error:", error);
    throw new Error("Translation failed. Please try again.");
  }
};