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
}

export interface SchoolClass {
  id: string;
  className: string;
  section: string;
}

export interface Exam {
  id: string;
  name: string;
  academicYear: string;
  term: string;
  startDate: string;
  endDate: string;
  status: ExamStatus;
  subjects: Subject[];
}

export interface MarkRecord {
  studentId: string;
  examId: string;
  subjectId: string;
  theory: number;
  practical: number;
  assignment: number;
  total: number;
  grade: string;
  remarks?: string;
  attended: boolean;
}

export interface ClassStats {
  totalStudents: number;
  passPercentage: number;
  averageGrade: string;
}