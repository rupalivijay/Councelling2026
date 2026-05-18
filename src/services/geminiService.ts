import { GoogleGenAI } from "@google/genai";
import { College, Category, ExamType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function getAIInsights(
  rank: number,
  category: Category,
  examType: ExamType,
  results: College[]
): Promise<string> {
  const topColleges = results.slice(0, 8).map(c => ({
    name: c.name,
    city: c.city,
    cutoff: c.cutoffRank[category],
    chance: c.predictionChance,
    target: c.cutoffUsed,
    type: c.type,
    branch: c.branch
  }));

  const prompt = `
    You are an expert education counselor at Laxmi Education. 
    The student has a rank/percentile of ${rank} in the ${examType} exam under the ${category} category.
    
    Here are the predicted college results with calculated safety levels:
    ${JSON.stringify(topColleges, null, 2)}
    
    Provide a professional and detailed analysis:
    1. Summary of Chances: Group results by "Excellent", "Safe", "Moderate", and "Risky".
    2. Strategic Choice Filling Advice: 
       - Which colleges are "Sure Shots" (Safe/Excellent)? 
       - Which ones are "Aspirational" (Risky/Moderate)?
       - Advice on the order of filling choices to maximize chance of top-tier admission.
    3. State-level Insights: Consider the competitiveness of ${examType} in the current year.
    4. Regional Recommendation: If many results are in Maharashtra, highlight the benefits.
    
    Formatting:
    - Use H3 headers for sections.
    - Use bold text for college names.
    - Use a table if it helps summarize the Tiers.
    - Mention Laxmi Education at the end for personalized 1-on-1 counseling.
    
    Max 400 words. Be precise and realistic.
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
    ownership: c.ownership,
    cutoff: c.cutoffRank[category]
  }));

  const prompt = `
    Based on the following preferences:
    - State: ${preferences.state || 'Any'}
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
