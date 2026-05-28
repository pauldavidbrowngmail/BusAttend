import { GoogleGenAI, Type } from "@google/genai";
import { Student, AttendanceRecord, AIInsight } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeAttendanceData = async (
  students: Student[],
  records: AttendanceRecord[]
): Promise<AIInsight[]> => {
  if (!students || students.length === 0) {
    return [{
      title: "Insufficient Data",
      description: "No student records have been scanned yet to generate engagement patterns.",
      recommendation: "Start scanning student QR codes to see AI-driven insights.",
      riskLevel: "low"
    }];
  }

  const prompt = `
    Analyze the following attendance data for a Business School course.
    Students: ${JSON.stringify(students.map(s => ({ id: s.id, name: s.name, rate: s.attendanceRate })))}
    Recent Records: ${JSON.stringify(records.slice(0, 50))}

    Provide 3 key insights about student engagement and attendance patterns.
    Identify students at risk (e.g., low attendance rate) and suggest professional interventions.
    Focus on trends, punctuality, and retention.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              recommendation: { type: Type.STRING },
              riskLevel: {
                type: Type.STRING,
                description: "low, medium, or high"
              },
            },
            required: ["title", "description", "recommendation", "riskLevel"],
          },
        },
      },
    });

    const text = response.text;
    if (!text) return [];

    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return [{
      title: "Analysis Connection Issue",
      description: "The AI analysis engine encountered a problem processing the current trends.",
      recommendation: "Check your internet connection and verify the API configuration.",
      riskLevel: "low"
    }];
  }
};
