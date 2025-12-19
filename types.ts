
export enum StudentStatus {
  Active = 'Active',
  Inactive = 'Inactive',
  Suspended = 'Suspended'
}

export enum ExamStatus {
  Upcoming = 'Upcoming',
  Ongoing = 'Ongoing',
  Completed = 'Completed',
  Published = 'Published'
}

export interface Student {
  id: string;
  fullName: string;
  rollNumber: string;
  className: string;
  section: string;
  contactNumber: string;
  guardianName: string;
  status: StudentStatus;
  avatarUrl: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  maxMarks: number;
  passMarks: number;
  maxMarksObjective?: number;
  maxMarksSubjective?: number;
}

export interface SchoolClass {
  id: string;
  className: string;
  section: string;
}

export interface ExamType {
  id: string;
  name: string;
  description: string;
}

export interface Exam {
  id: string;
  name: string;
  type: string;
  date: string;
  status: ExamStatus;
  subjects: Subject[];
}

export type AssessmentType = 'Objective' | 'Subjective';

export interface MarkRecord {
  studentId: string;
  examId: string;
  subjectId: string;
  objMarks: number;
  objMaxMarks: number;
  subMarks: number;
  subMaxMarks: number;
  examDate: string;
  grade: string;
  remarks?: string;
  attended: boolean;
}

export interface NonAcademicRecord {
  studentId: string;
  examId: string;
  attendance: string; // e.g. "45/50"
  discipline: string; // Grade A-E
  communication: string; // formerly leadership
  participation: string; // formerly arts/culture
  updatedAt?: string;
}

export interface TeacherRemark {
  studentId: string;
  examId: string;
  subjectId: string;
  remark: string;
}

export interface ClassStats {
  totalStudents: number;
  passPercentage: number;
  averageGrade: string;
}

// --- Template Design Types ---

export interface DesignElement {
  id: string;
  type: 'text' | 'image' | 'watermark';
  x: number;
  y: number;
  width?: number;
  height?: number;
  content: string; // Text content or Image Data URL
  style: {
    fontSize?: number;
    fontFamily?: string;
    color?: string;
    fontWeight?: string;       // 'normal' | 'bold'
    fontStyle?: string;        // 'normal' | 'italic'
    textDecoration?: string;   // 'none' | 'underline'
    opacity?: number;
    textAlign?: 'left' | 'center' | 'right' | 'justify';
    lineHeight?: number;
    letterSpacing?: number;
  };
}

export interface SavedTemplate {
  id: string;
  name: string;
  elements: DesignElement[];
  width: number;
  height: number;
  createdAt: string;
}
