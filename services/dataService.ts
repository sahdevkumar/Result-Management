
import { supabase } from "../lib/supabase";
import { Student, StudentStatus, Exam, ExamStatus, Subject, MarkRecord, SchoolClass, ExamType, AssessmentType, SavedTemplate, TeacherRemark } from "../types";

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
  max_marks: s.max_marks,
  pass_marks: s.pass_marks,
  maxMarksObjective: s.max_marks_objective,
  maxMarksSubjective: s.max_marks_subjective,
} as any);

const mapSubjectRecord = (s: any): Subject => ({
  id: s.id,
  name: s.name,
  code: s.code,
  maxMarks: s.max_marks,
  passMarks: s.pass_marks,
  maxMarksObjective: s.max_marks_objective,
  maxMarksSubjective: s.max_marks_subjective,
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
  objMarks: Number(m.obj_marks) || 0,
  objMaxMarks: Number(m.obj_max_marks) || 0,
  subMarks: Number(m.sub_marks) || 0,
  subMaxMarks: Number(m.sub_max_marks) || 0,
  examDate: m.exam_date || new Date().toISOString().split('T')[0],
  grade: m.grade || 'F',
  remarks: m.remarks || '', // Fallback to marks table remarks if any
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

  getSchoolInfo: async () => {
    const { data, error } = await supabase.from('school_config').select('*').eq('id', 1).single();
    if (error || !data) {
      return { name: 'UNACADEMY', tagline: 'Excellence in Education', logo: '', watermark: '' };
    }
    return {
      name: data.name,
      tagline: data.tagline,
      logo: data.logo_url,
      watermark: data.watermark_url
    };
  },

  updateSchoolInfo: async (info: { name: string, tagline: string, logo: string, watermark: string }) => {
    const dbRecord = {
      id: 1, 
      name: info.name,
      tagline: info.tagline,
      logo_url: info.logo,
      watermark_url: info.watermark,
      updated_at: new Date().toISOString()
    };
    const { error } = await supabase.from('school_config').upsert(dbRecord, { onConflict: 'id' });
    if (error) throw new Error(error.message || "Failed to update school info");
  },

  // Upload file to Supabase Storage
  uploadFile: async (file: File, folder: string = 'branding'): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    // Create a unique file name
    const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('school_assets')
      .upload(fileName, file, {
        upsert: true
      });

    if (uploadError) {
      // Handle the case where the bucket might not exist yet gracefully-ish or just throw
      console.error("Upload error:", uploadError);
      throw new Error(uploadError.message || "Failed to upload file");
    }

    // Get public URL
    const { data } = supabase.storage
      .from('school_assets')
      .getPublicUrl(fileName);

    return data.publicUrl;
  },

  getTemplates: async (): Promise<SavedTemplate[]> => {
    const { data, error } = await supabase.from('templates').select('*').order('created_at', { ascending: false });
    if (error) return [];
    return (data || []).map(t => ({
      id: t.id,
      name: t.name,
      elements: t.elements,
      width: t.width,
      height: t.height,
      createdAt: new Date(t.created_at).toLocaleDateString()
    }));
  },

  saveTemplate: async (template: Omit<SavedTemplate, 'createdAt'>) => {
    const dbRecord = {
      id: template.id,
      name: template.name,
      elements: template.elements,
      width: template.width,
      height: template.height
    };
    const { error } = await supabase.from('templates').upsert(dbRecord, { onConflict: 'id' });
    if (error) throw new Error(error.message || "Failed to save template");
  },

  deleteTemplate: async (id: string) => {
    const { error } = await supabase.from('templates').delete().eq('id', id);
    if (error) throw new Error(error.message || "Failed to delete template");
  },

  getStudents: async (): Promise<Student[]> => {
    const { data, error } = await supabase.from('students').select('*').order('roll_number');
    if (error) return [];
    return (data || []).map(mapStudent);
  },

  deleteStudent: async (id: string): Promise<void> => {
    await supabase.from('marks').delete().eq('student_id', id);
    await supabase.from('teacher_remarks').delete().eq('student_id', id);
    const { error } = await supabase.from('students').delete().eq('id', id);
    if (error) throw new Error(error.message || "Failed to delete student");
  },

  updateStudent: async (student: Student): Promise<void> => {
    const { error } = await supabase.from('students').update({
      full_name: student.fullName,
      class_name: student.className,
      section: student.section,
      contact_number: student.contactNumber,
      guardian_name: student.guardianName,
      status: student.status,
      avatar_url: student.avatarUrl
    }).eq('id', student.id);
    if (error) throw new Error(error.message || "Failed to update student");
  },

  addStudent: async (student: Omit<Student, 'id' | 'rollNumber'>): Promise<void> => {
    const { data: lastStudent } = await supabase.from('students').select('roll_number').order('roll_number', { ascending: false }).limit(1).maybeSingle();
    let nextRoll = 'ACS001';
    if (lastStudent) {
        const num = parseInt(lastStudent.roll_number.replace(/\D/g, '')) || 0;
        nextRoll = `ACS${String(num + 1).padStart(3, '0')}`;
    }
    const { error } = await supabase.from('students').insert({
      full_name: student.fullName,
      roll_number: nextRoll,
      class_name: student.className,
      section: student.section,
      contact_number: student.contactNumber,
      guardian_name: student.guardianName,
      status: student.status,
      avatar_url: student.avatarUrl
    });
    if (error) throw new Error(error.message || "Failed to add student");
  },

  bulkAddStudents: async (students: Omit<Student, 'id' | 'rollNumber'>[]): Promise<void> => {
    const { data: lastStudent } = await supabase.from('students').select('roll_number').order('roll_number', { ascending: false }).limit(1).maybeSingle();
    let startNum = 0;
    if (lastStudent) startNum = parseInt(lastStudent.roll_number.replace(/\D/g, '')) || 0;

    const records = students.map((s, idx) => ({
      full_name: s.fullName,
      roll_number: `ACS${String(startNum + idx + 1).padStart(3, '0')}`,
      class_name: s.className,
      section: s.section,
      contact_number: s.contactNumber,
      guardian_name: s.guardianName,
      status: s.status,
      avatar_url: s.avatarUrl
    }));
    const { error } = await supabase.from('students').insert(records);
    if (error) throw new Error(error.message || "Failed to bulk add students");
  },

  getExams: async (): Promise<Exam[]> => {
    const { data, error } = await supabase.from('exams').select('*').order('start_date');
    if (error) return [];
    const subjects = await DataService.getSubjects();
    return (data || []).map(e => mapExam(e, subjects));
  },

  addExam: async (exam: Partial<Exam>): Promise<void> => {
    const { error } = await supabase.from('exams').insert({
      name: exam.name,
      term: exam.type,
      start_date: exam.date,
      status: exam.status,
      academic_year: new Date().getFullYear().toString()
    });
    if (error) throw new Error(error.message || "Failed to add exam");
  },

  updateExam: async (exam: Exam): Promise<void> => {
    const { error } = await supabase.from('exams').update({
      name: exam.name,
      term: exam.type,
      start_date: exam.date,
      status: exam.status
    }).eq('id', exam.id);
    if (error) throw new Error(error.message || "Failed to update exam");
  },

  deleteExam: async (id: string): Promise<void> => {
    await supabase.from('marks').delete().eq('exam_id', id);
    await supabase.from('teacher_remarks').delete().eq('exam_id', id);
    const { error } = await supabase.from('exams').delete().eq('id', id);
    if (error) throw new Error(error.message || "Failed to delete exam");
  },

  getSubjects: async (): Promise<Subject[]> => {
    const { data, error } = await supabase.from('subjects').select('*').order('name');
    if (error) return [];
    return (data || []).map(mapSubjectRecord);
  },

  addSubject: async (sub: Partial<Subject>): Promise<void> => {
    const { error } = await supabase.from('subjects').insert({
      name: sub.name,
      code: sub.code,
      max_marks: sub.maxMarks,
      pass_marks: sub.passMarks,
      max_marks_objective: sub.maxMarksObjective,
      max_marks_subjective: sub.maxMarksSubjective
    });
    if (error) throw new Error(error.message || "Failed to add subject");
  },

  updateSubject: async (sub: Subject): Promise<void> => {
    const { error } = await supabase.from('subjects').update({
      name: sub.name,
      code: sub.code,
      max_marks: sub.maxMarks,
      pass_marks: sub.passMarks,
      max_marks_objective: sub.maxMarksObjective,
      max_marks_subjective: sub.maxMarksSubjective
    }).eq('id', sub.id);
    if (error) throw new Error(error.message || "Failed to update subject");
  },

  deleteSubject: async (id: string): Promise<void> => {
    await supabase.from('marks').delete().eq('subject_id', id);
    await supabase.from('teacher_remarks').delete().eq('subject_id', id);
    const { error } = await supabase.from('subjects').delete().eq('id', id);
    if (error) throw new Error(error.message || "Failed to delete subject");
  },

  getClasses: async (): Promise<SchoolClass[]> => {
    const { data, error } = await supabase.from('classes').select('*').order('name');
    if (error) return [];
    return (data || []).map(mapClass);
  },

  addClass: async (cls: Partial<SchoolClass>): Promise<void> => {
    const { error } = await supabase.from('classes').insert({ name: cls.className, section: cls.section });
    if (error) throw new Error(error.message || "Failed to add class");
  },

  updateClass: async (cls: SchoolClass): Promise<void> => {
    const { error } = await supabase.from('classes').update({ name: cls.className, section: cls.section }).eq('id', cls.id);
    if (error) throw new Error(error.message || "Failed to update class");
  },

  deleteClass: async (id: string): Promise<void> => {
    const { error } = await supabase.from('classes').delete().eq('id', id);
    if (error) throw new Error(error.message || "Failed to delete class");
  },

  getExamTypes: async (): Promise<ExamType[]> => {
    const { data, error } = await supabase.from('exam_types').select('*').order('name');
    if (error) return [];
    return (data || []).map(mapExamType);
  },

  addExamType: async (t: Partial<ExamType>): Promise<void> => {
    const { error } = await supabase.from('exam_types').insert({ name: t.name, description: t.description });
    if (error) throw new Error(error.message || "Failed to add exam type");
  },

  updateExamType: async (t: ExamType): Promise<void> => {
    const { error } = await supabase.from('exam_types').update({ name: t.name, description: t.description }).eq('id', t.id);
    if (error) throw new Error(error.message || "Failed to update exam type");
  },

  deleteExamType: async (id: string): Promise<void> => {
    const { error } = await supabase.from('exam_types').delete().eq('id', id);
    if (error) throw new Error(error.message || "Failed to delete exam type");
  },

  getMarks: async (examId: string, subjectId: string): Promise<MarkRecord[]> => {
    const { data, error } = await supabase.from('marks').select('*').eq('exam_id', examId).eq('subject_id', subjectId);
    if (error) return [];
    return (data || []).map(mapMark);
  },

  // Helper to merge remarks from the separate table
  getStudentMarksWithRemarks: async (studentId: string, examId: string): Promise<MarkRecord[]> => {
    const { data: marks } = await supabase.from('marks').select('*').eq('student_id', studentId).eq('exam_id', examId);
    const { data: remarks } = await supabase.from('teacher_remarks').select('*').eq('student_id', studentId).eq('exam_id', examId);
    
    const marksList = (marks || []).map(mapMark);
    const remarksList = (remarks || []);
    
    return marksList.map(m => {
        const r = remarksList.find((rm: any) => rm.subject_id === m.subjectId);
        if (r) return { ...m, remarks: r.remark };
        return m;
    });
  },

  getStudentMarks: async (studentId: string, examId: string): Promise<MarkRecord[]> => {
    return DataService.getStudentMarksWithRemarks(studentId, examId);
  },

  getStudentHistory: async (studentId: string): Promise<MarkRecord[]> => {
    const { data: marks } = await supabase.from('marks').select('*').eq('student_id', studentId);
    const { data: remarks } = await supabase.from('teacher_remarks').select('*').eq('student_id', studentId);
    
    const marksList = (marks || []).map(mapMark);
    const remarksList = (remarks || []);
    
    return marksList.map(m => {
        const r = remarksList.find((rm: any) => rm.exam_id === m.examId && rm.subject_id === m.subjectId);
        if (r) return { ...m, remarks: r.remark };
        return m;
    });
  },

  updateMark: async (m: MarkRecord): Promise<void> => {
    const dbRecord = {
      student_id: m.studentId,
      exam_id: m.examId,
      subject_id: m.subjectId,
      obj_marks: m.objMarks,
      obj_max_marks: m.objMaxMarks,
      sub_marks: m.subMarks,
      sub_max_marks: m.subMaxMarks,
      exam_date: m.examDate,
      grade: m.grade,
      remarks: m.remarks, // Legacy support
      attended: m.attended,
      updated_at: new Date().toISOString()
    };
    const { error } = await supabase.from('marks').upsert(dbRecord, { onConflict: 'student_id,exam_id,subject_id' });
    if (error) throw new Error(error.message || "Failed to upsert marks record");
  },

  bulkUpdateMarks: async (records: MarkRecord[]): Promise<void> => {
    if (records.length === 0) return;
    const validRecords = records.filter(m => m.studentId && m.examId && m.subjectId);
    if (validRecords.length === 0) return;

    const dbRecords = validRecords.map(m => ({
      student_id: m.studentId,
      exam_id: m.examId,
      subject_id: m.subjectId,
      obj_marks: m.objMarks || 0,
      obj_max_marks: m.objMaxMarks || 0,
      sub_marks: m.subMarks || 0,
      sub_max_marks: m.subMaxMarks || 0,
      exam_date: m.examDate || new Date().toISOString().split('T')[0],
      grade: m.grade || 'F',
      remarks: m.remarks || '',
      attended: m.attended ?? true,
      updated_at: new Date().toISOString()
    }));
    
    const { error } = await supabase.from('marks').upsert(dbRecords, { onConflict: 'student_id,exam_id,subject_id' });
    if (error) throw new Error(error.message || "Database batch operation failed");
  },

  // --- Teacher Remarks ---
  saveTeacherRemark: async (r: TeacherRemark): Promise<void> => {
    const { error } = await supabase.from('teacher_remarks').upsert({
        student_id: r.studentId,
        exam_id: r.examId,
        subject_id: r.subjectId,
        remark: r.remark,
        updated_at: new Date().toISOString()
    }, { onConflict: 'student_id,exam_id,subject_id' });
    if (error) throw new Error(error.message || "Failed to save remark");
  },

  getTeacherRemarks: async (examId: string, subjectId: string): Promise<TeacherRemark[]> => {
     const { data } = await supabase.from('teacher_remarks').select('*').eq('exam_id', examId).eq('subject_id', subjectId);
     return (data || []).map((r: any) => ({
         studentId: r.student_id,
         examId: r.exam_id,
         subjectId: r.subject_id,
         remark: r.remark
     }));
  },

  getDashboardStats: async () => {
    const { count: s } = await supabase.from('students').select('*', { count: 'exact', head: true });
    const { count: e } = await supabase.from('exams').select('*', { count: 'exact', head: true });
    return { totalStudents: s || 0, activeExams: e || 0, passRate: 88.4, pending: 3 };
  }
};
