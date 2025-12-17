import { supabase } from "../lib/supabase";
import { Student, StudentStatus, Exam, ExamStatus, Subject, MarkRecord, SchoolClass, ExamType, AssessmentType } from "../types";

// --- Helpers for Data Mapping ---

const mapStudent = (s: any): Student => ({
  id: s.id,
  fullName: s.full_name,
  rollNumber: s.roll_number,
  className: s.class_name,
  section: s.section,
  contactNumber: s.contact_number || '', 
  guardianName: s.guardian_name,
  status: s.status as StudentStatus,
  avatarUrl: s.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.full_name)}&background=random`,
});

const mapExam = (e: any, subjects: Subject[]): Exam => ({
  id: e.id,
  name: e.name,
  type: e.term, 
  date: e.start_date,
  status: e.status as ExamStatus,
  subjects: subjects, 
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

const mapExamType = (t: any): ExamType => ({
  id: t.id,
  name: t.name,
  description: t.description || '',
});

const mapMark = (m: any): MarkRecord => ({
  studentId: m.student_id,
  examId: m.exam_id,
  subjectId: m.subject_id,
  assessmentType: (m.assessment_type as AssessmentType) || 'Subjective',
  obtainedMarks: m.obtained_marks || 0,
  grade: m.grade || 'F',
  remarks: m.remarks || '',
  attended: m.attended ?? true,
});

// --- Service Methods ---

export const DataService = {
  checkConnection: async (): Promise<boolean> => {
    try {
      const { status } = await supabase.from('students').select('id', { count: 'exact', head: true });
      return status !== 0 && status !== 503;
    } catch (e) {
      return false;
    }
  },

  getStudents: async (): Promise<Student[]> => {
    const { data, error } = await supabase.from('students').select('*').order('roll_number');
    if (error) {
      console.error('Error fetching students:', JSON.stringify(error, null, 2));
      return [];
    }
    return (data || []).map(mapStudent);
  },

  deleteStudent: async (id: string): Promise<void> => {
    const { error: marksError } = await supabase.from('marks').delete().eq('student_id', id);
    if (marksError) throw new Error(`Failed to delete student marks: ${marksError.message}`);

    const { error } = await supabase.from('students').delete().eq('id', id);
    if (error) throw new Error(`Failed to delete student: ${error.message}`);
  },

  updateStudent: async (student: Student): Promise<void> => {
    const dbRecord = {
      full_name: student.fullName,
      class_name: student.className,
      section: student.section,
      contact_number: student.contactNumber,
      guardian_name: student.guardianName,
      status: student.status,
      avatar_url: student.avatarUrl
    };

    const { error } = await supabase.from('students').update(dbRecord).eq('id', student.id);
    if (error) throw error;
  },

  getExams: async (): Promise<Exam[]> => {
    const { data: examsData, error: examsError } = await supabase.from('exams').select('*').order('start_date', { ascending: true }); // Ascending for Score Card order
    if (examsError) return [];
    const subjects = await DataService.getSubjects();
    return (examsData || []).map(e => mapExam(e, subjects));
  },

  addExam: async (exam: Partial<Exam>): Promise<void> => {
    const currentYear = new Date().getFullYear().toString();
    const dbRecord = {
      name: exam.name,
      academic_year: currentYear,
      term: exam.type,
      start_date: exam.date,
      status: exam.status
    };
    const { error } = await supabase.from('exams').insert(dbRecord);
    if (error) throw error;
  },

  updateExam: async (exam: Exam): Promise<void> => {
    const dbRecord = {
      name: exam.name,
      term: exam.type,
      start_date: exam.date,
      status: exam.status
    };
    const { error } = await supabase.from('exams').update(dbRecord).eq('id', exam.id);
    if (error) throw error;
  },

  deleteExam: async (id: string): Promise<void> => {
    const { error: marksError } = await supabase.from('marks').delete().eq('exam_id', id);
    if (marksError) throw new Error(`Failed to delete exam marks: ${marksError.message}`);
    const { error } = await supabase.from('exams').delete().eq('id', id);
    if (error) throw error;
  },

  getSubjects: async (): Promise<Subject[]> => {
    const { data, error } = await supabase.from('subjects').select('*').order('name');
    if (error) return [];
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
    if (error) throw error;
  },

  updateSubject: async (subject: Subject): Promise<void> => {
    const dbRecord = {
      name: subject.name,
      code: subject.code,
      max_marks: subject.maxMarks,
      pass_marks: subject.passMarks
    };
    const { error } = await supabase.from('subjects').update(dbRecord).eq('id', subject.id);
    if (error) throw error;
  },

  deleteSubject: async (id: string): Promise<void> => {
    const { error: marksError } = await supabase.from('marks').delete().eq('subject_id', id);
    if (marksError) throw new Error(`Failed to delete subject marks: ${marksError.message}`);
    const { error } = await supabase.from('subjects').delete().eq('id', id);
    if (error) throw error;
  },

  getClasses: async (): Promise<SchoolClass[]> => {
    const { data, error } = await supabase.from('classes').select('*').order('name');
    if (error) return [];
    return (data || []).map(mapClass);
  },

  addClass: async (cls: Partial<SchoolClass>): Promise<void> => {
    const dbRecord = { name: cls.className, section: cls.section };
    const { error } = await supabase.from('classes').insert(dbRecord);
    if (error) throw error;
  },

  updateClass: async (cls: SchoolClass): Promise<void> => {
    const dbRecord = { name: cls.className, section: cls.section };
    const { error } = await supabase.from('classes').update(dbRecord).eq('id', cls.id);
    if (error) throw error;
  },

  deleteClass: async (id: string): Promise<void> => {
    const { error } = await supabase.from('classes').delete().eq('id', id);
    if (error) throw error;
  },

  getExamTypes: async (): Promise<ExamType[]> => {
    const { data, error } = await supabase.from('exam_types').select('*').order('name');
    if (error) return [];
    return (data || []).map(mapExamType);
  },

  addExamType: async (type: Partial<ExamType>): Promise<void> => {
    const { error } = await supabase.from('exam_types').insert({ name: type.name, description: type.description });
    if (error) throw error;
  },

  updateExamType: async (type: ExamType): Promise<void> => {
    const { error } = await supabase.from('exam_types').update({ name: type.name, description: type.description }).eq('id', type.id);
    if (error) throw error;
  },

  deleteExamType: async (id: string): Promise<void> => {
    const { error } = await supabase.from('exam_types').delete().eq('id', id);
    if (error) throw error;
  },

  getMarks: async (examId: string, subjectId: string, assessmentType?: AssessmentType): Promise<MarkRecord[]> => {
    let query = supabase.from('marks').select('*').eq('exam_id', examId).eq('subject_id', subjectId);
    if (assessmentType) query = query.eq('assessment_type', assessmentType);
    const { data, error } = await query;
    if (error) return [];
    return (data || []).map(mapMark);
  },

  getStudentMarks: async (studentId: string, examId: string): Promise<MarkRecord[]> => {
    const { data, error } = await supabase.from('marks').select('*').eq('student_id', studentId).eq('exam_id', examId);
    if (error) return [];
    return (data || []).map(mapMark);
  },

  // New method to fetch ALL marks for a student across all exams
  getStudentHistory: async (studentId: string): Promise<MarkRecord[]> => {
    const { data, error } = await supabase
      .from('marks')
      .select('*')
      .eq('student_id', studentId);
      
    if (error) {
      console.error('Error fetching student history:', JSON.stringify(error, null, 2));
      return [];
    }
    return (data || []).map(mapMark);
  },

  updateMark: async (record: MarkRecord): Promise<void> => {
    const dbRecord = {
      student_id: record.studentId,
      exam_id: record.examId,
      subject_id: record.subjectId,
      assessment_type: record.assessmentType,
      obtained_marks: record.obtainedMarks,
      grade: record.grade,
      remarks: record.remarks,
      attended: record.attended,
      updated_at: new Date().toISOString()
    };
    const { error } = await supabase.from('marks').upsert(dbRecord, { onConflict: 'student_id, exam_id, subject_id, assessment_type' });
    if (error) throw error;
  },

  addStudent: async (student: Omit<Student, 'id' | 'rollNumber'>): Promise<void> => {
    const { data: lastStudent } = await supabase.from('students').select('roll_number').order('roll_number', { ascending: false }).limit(1).single();
    let nextRoll = 'ACS001';
    if (lastStudent && lastStudent.roll_number) {
        const numberPart = parseInt(lastStudent.roll_number.replace(/\D/g, ''), 10);
        if (!isNaN(numberPart)) nextRoll = `ACS${String(numberPart + 1).padStart(3, '0')}`;
    }
    const dbRecord = {
      full_name: student.fullName,
      roll_number: nextRoll,
      class_name: student.className,
      section: student.section,
      contact_number: student.contactNumber,
      guardian_name: student.guardianName,
      status: student.status,
      avatar_url: student.avatarUrl
    };
    const { error } = await supabase.from('students').insert(dbRecord);
    if (error) throw error;
  },

  getDashboardStats: async () => {
      try {
        const { count: studentCount } = await supabase.from('students').select('*', { count: 'exact', head: true });
        const { count: examCount } = await supabase.from('exams').select('*', { count: 'exact', head: true });
        return { totalStudents: studentCount || 0, activeExams: examCount || 0, passRate: 88.4, pending: 3 };
      } catch (e) {
          return { totalStudents: 0, activeExams: 0, passRate: 0, pending: 0 };
      }
  }
};