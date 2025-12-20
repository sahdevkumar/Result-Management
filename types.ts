
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

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  role: 'Super Admin' | 'Principal' | 'Admin' | 'Teacher' | 'Office Staff';
  status: 'Active' | 'Locked';
  assignedSubjectId?: string;
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
  dateOfBirth?: string;
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

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  ipAddress: string;
  timestamp: string;
  role: string;
}

// --- Theme Types ---

export interface ThemeColors {
  primary: string;       // Main brand color (accents, links)
  secondary: string;     // Secondary accents
  background: string;    // Main body background
  surface: string;       // Card/Panel background
  surfaceOpacity?: number; // Opacity of the surface (0-1)
  textMain: string;      // Primary text color
  textSecondary: string; // Subtitles/secondary text
  border: string;        // Border colors
  buttonBackground: string; // Primary button background
  buttonText: string;    // Button text color
  success: string;
  danger: string;
}

export interface CustomTheme {
  id: string;
  name: string;
  // Supports separate configurations for light and dark modes
  colors: {
    light: ThemeColors;
    dark: ThemeColors;
  };
  isPreset?: boolean; // True if it's a built-in system theme
}
