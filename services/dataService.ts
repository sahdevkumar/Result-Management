import { supabase } from "../lib/supabase";
import { Student, StudentStatus, Exam, ExamStatus, Subject, MarkRecord, SchoolClass } from "../types";

// --- Helpers for Data Mapping ---

const mapStudent = (s: any): Student => ({
  id: s.id,
  fullName: s.full_name,
  rollNumber: s.roll_number,
  className: s.class_name,
  section: s.section,
  contactEmail: s.contact_email,
  guardianName: s.guardian_name,
  status: s.status as StudentStatus,
  avatarUrl: s.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.full_name)}&background=random`,
});

const mapExam = (e: any, subjects: Subject[]): Exam => ({
  id: e.id,
  name: e.name,
  academicYear: e.academic_year,
  term: e.term,
  startDate: e.start_date,
  endDate: e.end_date,
  status: e.status as ExamStatus,
  subjects: subjects, // Attaching global subjects for now
});

const mapSubject = (s: any): Subject => ({
  id: s.id,
  name: s.name,
  code: s.code,
  maxMarks: s.max_marks,
  passMarks: s.pass_marks,
});

const mapClass = (c: any): SchoolClass => ({
  id: c.id,
  className: c.name,
  section: c.section,
});

const mapMark = (m: any): MarkRecord => ({
  studentId: m.student_id,
  examId: m.exam_id,
  subjectId: m.subject_id,
  theory: m.theory || 0,
  practical: m.practical || 0,
  assignment: m.assignment || 0,
  total: m.total || 0,
  grade: m.grade || 'F',
  remarks: m.remarks || '',
  attended: m.attended ?? true,
});

// --- Service Methods ---

export const DataService = {
  getStudents: async (): Promise<Student[]> => {
    const { data, error } = await supabase.from('students').select('*').order('roll_number');
    if (error) {
      console.error('Error fetching students:', JSON.stringify(error, null, 2));
      return [];
    }
    return (data || []).map(mapStudent);
  },

  getExams: async (): Promise<Exam[]> => {
    // 1. Fetch exams
    const { data: examsData, error: examsError } = await supabase.from('exams').select('*').order('start_date', { ascending: false });
    if (examsError) {
      console.error('Error fetching exams:', JSON.stringify(examsError, null, 2));
      return [];
    }

    // 2. Fetch subjects to attach
    const subjects = await DataService.getSubjects();

    return (examsData || []).map(e => mapExam(e, subjects));
  },

  getSubjects: async (): Promise<Subject[]> => {
    const { data, error } = await supabase.from('subjects').select('*').order('name');
    if (error) {
      console.error('Error fetching subjects:', JSON.stringify(error, null, 2));
      return [];
    }
    return (data || []).map(mapSubject);
  },

  addSubject: async (subject: Partial<Subject>): Promise<void> => {
    const dbRecord = {
      name: subject.name,
      code: subject.code,
      max_marks: subject.maxMarks,
      pass_marks: subject.passMarks
    };

    const { error } = await supabase.from('subjects').insert(dbRecord);
    if (error) {
      console.error('Error adding subject:', JSON.stringify(error, null, 2));
      throw error;
    }
  },

  deleteSubject: async (id: string): Promise<void> => {
    const { error } = await supabase.from('subjects').delete().eq('id', id);
    if (error) {
       console.error('Error deleting subject:', JSON.stringify(error, null, 2));
       throw error;
    }
  },

  getClasses: async (): Promise<SchoolClass[]> => {
    const { data, error } = await supabase.from('classes').select('*').order('name');
    if (error) {
       // Check if error is 'relation does not exist' (table missing)
       if (error.code === 'PGRST205') {
           console.warn('Classes table not found in Supabase. Please run schema.sql.');
           return [];
       }
       console.error('Error fetching classes:', JSON.stringify(error, null, 2));
       return [];
    }
    return (data || []).map(mapClass);
  },

  addClass: async (cls: Partial<SchoolClass>): Promise<void> => {
    const dbRecord = {
      name: cls.className,
      section: cls.section
    };
    const { error } = await supabase.from('classes').insert(dbRecord);
    if (error) {
      console.error('Error adding class:', JSON.stringify(error, null, 2));
      throw error;
    }
  },

  deleteClass: async (id: string): Promise<void> => {
    const { error } = await supabase.from('classes').delete().eq('id', id);
    if (error) {
       console.error('Error deleting class:', JSON.stringify(error, null, 2));
       throw error;
    }
  },

  getMarks: async (examId: string, subjectId: string): Promise<MarkRecord[]> => {
    const { data, error } = await supabase
      .from('marks')
      .select('*')
      .eq('exam_id', examId)
      .eq('subject_id', subjectId);
      
    if (error) {
      console.error('Error fetching marks:', JSON.stringify(error, null, 2));
      return [];
    }
    return (data || []).map(mapMark);
  },

  getStudentMarks: async (studentId: string, examId: string): Promise<MarkRecord[]> => {
    const { data, error } = await supabase
      .from('marks')
      .select('*')
      .eq('student_id', studentId)
      .eq('exam_id', examId);
      
    if (error) {
      console.error('Error fetching student marks:', JSON.stringify(error, null, 2));
      return [];
    }
    return (data || []).map(mapMark);
  },

  updateMark: async (record: MarkRecord): Promise<void> => {
    const dbRecord = {
      student_id: record.studentId,
      exam_id: record.examId,
      subject_id: record.subjectId,
      theory: record.theory,
      practical: record.practical,
      assignment: record.assignment,
      total: record.total,
      grade: record.grade,
      remarks: record.remarks,
      attended: record.attended,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('marks')
      .upsert(dbRecord, { onConflict: 'student_id, exam_id, subject_id' });

    if (error) {
      console.error('Error updating mark:', JSON.stringify(error, null, 2));
      throw error;
    }
  },

  addStudent: async (student: Student): Promise<void> => {
    const dbRecord = {
      full_name: student.fullName,
      roll_number: student.rollNumber,
      class_name: student.className,
      section: student.section,
      contact_email: student.contactEmail,
      guardian_name: student.guardianName,
      status: student.status,
      avatar_url: student.avatarUrl
    };

    const { error } = await supabase.from('students').insert(dbRecord);
    
    if (error) {
      console.error('Error adding student:', JSON.stringify(error, null, 2));
      throw error;
    }
  },

  addExam: async (exam: Partial<Exam>): Promise<void> => {
    const dbRecord = {
      name: exam.name,
      academic_year: exam.academicYear,
      term: exam.term,
      start_date: exam.startDate,
      end_date: exam.endDate,
      status: exam.status
    };

    const { error } = await supabase.from('exams').insert(dbRecord);

    if (error) {
      console.error('Error adding exam:', JSON.stringify(error, null, 2));
      throw error;
    }
  }
};