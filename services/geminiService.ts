import { Student, MarkRecord, Subject } from "../types";

export const generateStudentReportRemark = async (
  student: Student,
  examName: string,
  marks: MarkRecord[],
  subjects: Subject[]
): Promise<string> => {
  // Service disabled
  return "";
};

export const analyzeClassPerformance = async (
  examName: string,
  averageScore: number,
  passPercentage: number,
  topSubject: string,
  weakSubject: string
): Promise<string> => {
    // Service disabled
    return "";
};