import { GoogleGenAI } from '@google/genai';
import 'dotenv/config';

(async () => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const models = ['gemini-2.5-pro', 'gemini-2.0-flash', 'gemini-2.0-flash-exp', 'gemini-1.5-flash', 'gemini-1.5-flash-latest'];
  for (const m of models) {
    try {
      await ai.models.generateContent({ model: m, contents: 'hello' });
      console.log('Success with model:', m);
    } catch (e) {
      console.log('Failed model:', m, e.message);
    }
  }
})();
