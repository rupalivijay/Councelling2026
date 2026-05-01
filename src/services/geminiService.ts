import { GoogleGenAI } from "@google/genai";
import { College, Category, ExamType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function getAIInsights(
  rank: number,
  category: Category,
  examType: ExamType,
  results: College[]
): Promise<string> {
  const topColleges = results.slice(0, 5).map(c => ({
    name: c.name,
    city: c.city,
    cutoff: c.cutoffRank[category],
    ownership: c.ownership,
    type: c.type
  }));

  const prompt = `
    You are an expert education counselor at Laxmi Education. 
    The student has a rank/percentile of ${rank} in the ${examType} exam under the ${category} category.
    
    Here are the predicted college results based on historical data:
    ${JSON.stringify(topColleges, null, 2)}
    
    Provide a personalized analysis of these results. 
    1. Evaluate the student's chances for top-tier vs. mid-tier institutions.
    2. Offer strategic advice (e.g., choice filling, looking at specific regions like Maharashtra, or considering different branches).
    3. Be encouraging but realistic.
    4. Format the response in clear, professional markdown with bullet points where appropriate.
    5. Mention that Laxmi Education can help with detailed offline guidance.
    
    Keep the tone professional, insightful, and supportive. Max 300 words.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    return response.text || "Unable to generate insights at the moment.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Our AI counselor is currently busy. Please try again in a few moments for personalized insights.";
  }
}

export async function getPersonalizedSuggestions(
  preferences: {
    state?: string;
    budget?: number;
    ownership?: string;
  },
  examType: ExamType,
  category: Category,
  allColleges: College[]
): Promise<string> {
  // Select a subset of colleges to keep the prompt small
  const contextColleges = allColleges.slice(0, 20).map(c => ({
    name: c.name,
    state: c.state,
    fees: c.fees?.tuition,
    ownership: c.ownership,
    cutoff: c.cutoffRank[category]
  }));

  const prompt = `
    Based on the following preferences:
    - State: ${preferences.state || 'Any'}
    - Budget (Tuition): ${preferences.budget ? `Up to ₹${preferences.budget}` : 'Any'}
    - Ownership: ${preferences.ownership || 'Any'}
    - Exam: ${examType}
    
    Analyze these potential colleges:
    ${JSON.stringify(contextColleges, null, 2)}
    
    Suggest 3 specific colleges from this list (or general types of colleges if list is small) that best match these preferences. 
    Explain WHY they are good fits. 
    Format in markdown.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    return response.text || "Check out our recommended institutions below for more options.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Our AI is analyzing your preferences. Meanwhile, please explore the results below.";
  }
}

export async function askGemini(message: string, history: any[] = []): Promise<string> {
  try {
    const chat = ai.chats.create({
      model: "gemini-3-flash-preview",
      history: history.map(h => ({
        role: h.role === 'model' ? 'model' : 'user',
        parts: h.parts
      }))
    });

    const response = await chat.sendMessage({ message });
    return response.text || "I'm sorry, I couldn't generate a response.";
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return "The AI assistant is currently offline. Please try again later.";
  }
}
