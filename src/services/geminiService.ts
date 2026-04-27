import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_INSTRUCTION = `You are an expert Admissions Counselor AI for Indian Medical and Engineering colleges. 
Your goal is to help students understand the counseling process (like JoSAA, MCC, State Counseling, etc.).

Provide clear, accurate, and concise answers about:
1. Document verification process.
2. Choice filling strategies.
3. Seat allotment rounds (Round 1, 2, Mop-up/Spot rounds).
4. Category-based reservations and cutoffs.
5. Refund policies and reporting requirements.

Always be supportive and encouraging to students. If you're unsure about specific current-year dates (as they change), advise the student to check the official MCC or JoSAA website.`;

export async function askGemini(prompt: string, history: { role: 'user' | 'model', parts: { text: string }[] }[] = []) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        ...history.map(h => ({ role: h.role === 'user' ? 'user' : 'model', parts: [{ text: h.parts[0].text }] })),
        { role: 'user', parts: [{ text: prompt }] }
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
    });

    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I'm sorry, I'm having trouble connecting to my brain right now. Please try again in a moment.";
  }
}
