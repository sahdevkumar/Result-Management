import { GoogleGenAI } from "@google/genai";
import { Student, MarkRecord, Subject } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateStudentReportRemark = async (
  student: Student,
  examName: string,
  marks: MarkRecord[],
  subjects: Subject[]
): Promise<string> => {
  try {
    const marksSummary = marks.map(m => {
      const subject = subjects.find(s => s.id === m.subjectId);
      return `${subject?.name}: ${m.total}/${subject?.maxMarks} (Grade: ${m.grade})`;
    }).join(", ");

    const prompt = `
      Act as a supportive and analytical senior teacher. 
      Generate a concise, constructive, and personalized remark (max 50 words) for a report card.
      
      Student: ${student.fullName}
      Exam: ${examName}
      Performance: ${marksSummary}
      
      Highlight strengths and gently suggest areas for improvement if necessary. Direct address to the parent/guardian.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Could not generate remark.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Remark generation unavailable currently.";
  }
};

export const analyzeClassPerformance = async (
  examName: string,
  averageScore: number,
  passPercentage: number,
  topSubject: string,
  weakSubject: string
): Promise<string> => {
    try {
        const prompt = `
          Provide a brief strategic analysis (3 bullet points) for the school principal regarding the recent ${examName}.
          Data:
          - Average Score: ${averageScore}%
          - Pass Rate: ${passPercentage}%
          - Strongest Subject: ${topSubject}
          - Weakest Subject: ${weakSubject}
          
          Focus on actionable advice for curriculum adjustment.
        `;
    
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });
    
        return response.text || "Analysis unavailable.";
      } catch (error) {
        console.error("Gemini Analysis Error:", error);
        return "Analysis unavailable due to network error.";
      }
};
