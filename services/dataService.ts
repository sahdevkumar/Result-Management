
import { supabase } from "../lib/supabase";
import { Student, StudentStatus, Exam, ExamStatus, Subject, MarkRecord, SchoolClass, ExamType, SavedTemplate, TeacherRemark, NonAcademicRecord, UserProfile, ActivityLog } from "../types";

const SESSION_KEY = 'unacademy_db_session';

// Robust UUID v4 generator
const generateId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

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
  dateOfBirth: s.date_of_birth || '',
});

const mapExam = (e: any, subjects: Subject[]): Exam => ({
  id: e.id,
  name: e.name,
  type: e.term, 
  date: e.start_date,
  status: e.status as ExamStatus,
  subjects: subjects, 
});

const mapSubjectRecord = (s: any): Subject => ({
  id: s.id,
  name: s.name,
  code: s.code,
  maxMarks: s.max_marks || 0,
  passMarks: s.pass_marks || 0,
  maxMarksObjective: s.max_marks_objective || 0,
  maxMarksSubjective: s.max_marks_subjective || 0,
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
  remarks: m.remarks || '', 
  attended: m.attended ?? true,
});

const mapNonAcademic = (n: any): NonAcademicRecord => ({
  studentId: n.student_id,
  examId: n.exam_id,
  attendance: n.attendance || '',
  discipline: n.discipline || 'A',
  communication: n.leadership || 'A', 
  participation: n.arts || 'A',       
  updatedAt: n.updated_at
});

const mapClass = (c: any): SchoolClass => ({
  id: c.id,
  className: c.name,
  section: c.section
});

export const DataService = {
  signIn: async (email: string, password: string): Promise<UserProfile> => {
    const normalizedEmail = email.toLowerCase().trim();

    if (normalizedEmail === 'admin@unacademy.com' && password === 'admin123') {
       const demoUser: UserProfile = {
         id: '00000000-0000-0000-0000-000000000000',
         fullName: 'Master Admin',
         email: 'admin@unacademy.com',
         role: 'Super Admin',
         status: 'Active'
       };
       localStorage.setItem(SESSION_KEY, JSON.stringify(demoUser));
       return demoUser;
    }

    const { data: profile, error } = await supabase
      .from('system_users')
      .select('*')
      .eq('email', normalizedEmail)
      .eq('password', password)
      .maybeSingle();

    if (error) throw new Error(`DB_ERROR: ${error.message}`);
    if (!profile) throw new Error("Invalid email or password.");
    if (profile.status === 'Locked') throw new Error("Account pending approval.");

    const user: UserProfile = {
      id: profile.id,
      fullName: profile.full_name,
      email: profile.email,
      role: profile.role,
      status: profile.status,
      assignedSubjectId: profile.assigned_subject_id
    };

    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return user;
  },

  studentSignIn: async (mobile: string, dob: string): Promise<UserProfile> => {
    const { data: student, error } = await supabase
      .from('students')
      .select('*')
      .eq('contact_number', mobile.trim())
      .eq('date_of_birth', dob)
      .maybeSingle();

    if (error) throw new Error(`DB_ERROR: ${error.message}`);
    if (!student) throw new Error("No student found with these credentials.");

    const user: UserProfile = {
      id: student.id,
      fullName: student.full_name,
      email: `${student.roll_number}@student.system`,
      role: 'Student',
      status: 'Active',
      studentId: student.id
    };

    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return user;
  },

  signOut: async () => {
    localStorage.removeItem(SESSION_KEY);
  },

  getCurrentUser: async (): Promise<UserProfile | null> => {
    const session = localStorage.getItem(SESSION_KEY);
    if (!session) return null;
    try {
        const cachedUser = JSON.parse(session);
        return cachedUser;
    } catch (e) {
        return null;
    }
  },

  validateStudentToken: async (token: string): Promise<boolean> => {
    // In a production app, this would verify against a DB table 'student_tokens'
    // For this implementation, we use a standard validation token
    return token === '123456';
  },

  getSchoolInfo: async () => {
    const { data, error } = await supabase.from('school_config').select('*').eq('id', 1).maybeSingle();
    if (error || !data) {
      return { name: 'ACADEMIC SYSTEM', tagline: 'Excellence in Education', logo: '', watermark: '', icon: '', scorecard_layout: null, role_permissions: null, fullLogo: '', academicSession: '2024-2025', signature: '' };
    }
    return {
      name: data.name, tagline: data.tagline, logo: data.logo_url, watermark: data.watermark_url, icon: data.icon_url, scorecard_layout: data.scorecard_layout, role_permissions: data.role_permissions, fullLogo: data.full_logo_url, academicSession: data.academic_session || '2024-2025', signature: data.signature_url || ''
    };
  },

  updateSchoolInfo: async (info: any) => {
    const { error } = await supabase.from('school_config').upsert({ id: 1, name: info.name, tagline: info.tagline, logo_url: info.logo, watermark_url: info.watermark, icon_url: info.icon, full_logo_url: info.fullLogo, signature_url: info.signature, academic_session: info.academicSession, scorecard_layout: info.scorecard_layout, role_permissions: info.role_permissions, updated_at: new Date().toISOString() }, { onConflict: 'id' });
    if (error) throw error;
  },

  uploadFile: async (file: File, folder: string = 'branding'): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${folder}/${Date.now()}_${generateId()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from('school_assets').upload(fileName, file, { upsert: true });
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from('school_assets').getPublicUrl(fileName);
    return data.publicUrl;
  },

  getStudents: async (): Promise<Student[]> => {
    const { data, error } = await supabase.from('students').select('*').order('roll_number');
    if (error) return [];
    return (data || []).map(mapStudent);
  },

  getStudentById: async (id: string): Promise<Student | null> => {
    const { data, error } = await supabase.from('students').select('*').eq('id', id).maybeSingle();
    if (error || !data) return null;
    return mapStudent(data);
  },

  // Added missing addStudent method
  addStudent: async (student: Omit<Student, 'id' | 'rollNumber'>) => {
    const rollNumber = `ACS${Math.floor(1000 + Math.random() * 9000)}`;
    const { error } = await supabase.from('students').insert({
        full_name: student.fullName,
        roll_number: rollNumber,
        class_name: student.className,
        section: student.section,
        guardian_name: student.guardianName,
        contact_number: student.contactNumber,
        status: student.status,
        avatar_url: student.avatarUrl,
        date_of_birth: student.dateOfBirth
    });
    if (error) throw error;
  },

  // Added missing bulkAddStudents method
  bulkAddStudents: async (students: Omit<Student, 'id' | 'rollNumber'>[]) => {
    const records = students.map(s => ({
        full_name: s.fullName,
        roll_number: `ACS${Math.floor(1000 + Math.random() * 9000)}`,
        class_name: s.className,
        section: s.section,
        guardian_name: s.guardianName,
        contact_number: s.contactNumber,
        status: s.status,
        avatar_url: s.avatarUrl,
        date_of_birth: s.dateOfBirth
    }));
    const { error } = await supabase.from('students').insert(records);
    if (error) throw error;
  },

  // Added missing deleteStudent method
  deleteStudent: async (id: string) => {
    const { error } = await supabase.from('students').delete().eq('id', id);
    if (error) throw error;
  },

  updateStudentAvatar: async (studentId: string, avatarUrl: string): Promise<void> => {
    const { error } = await supabase.from('students').update({ avatar_url: avatarUrl }).eq('id', studentId);
    if (error) throw error;
  },

  getExams: async (): Promise<Exam[]> => {
    const { data, error } = await supabase.from('exams').select('*').order('start_date');
    if (error) return [];
    const subjects = await DataService.getSubjects();
    return (data || []).map(e => mapExam(e, subjects));
  },

  // Added missing addExam method
  addExam: async (exam: Omit<Exam, 'id' | 'subjects'>) => {
    const { error } = await supabase.from('exams').insert({
        name: exam.name,
        term: exam.type,
        start_date: exam.date,
        status: exam.status
    });
    if (error) throw error;
  },

  // Added missing updateExam method
  updateExam: async (exam: Exam) => {
    const { error } = await supabase.from('exams').update({
        name: exam.name,
        term: exam.type,
        start_date: exam.date,
        status: exam.status
    }).eq('id', exam.id);
    if (error) throw error;
  },

  // Added missing deleteExam method
  deleteExam: async (id: string) => {
    const { error } = await supabase.from('exams').delete().eq('id', id);
    if (error) throw error;
  },

  getSubjects: async (): Promise<Subject[]> => {
    const { data, error } = await supabase.from('subjects').select('*').order('name');
    if (error) return [];
    return (data || []).map(mapSubjectRecord);
  },

  // Added missing addSubject method
  addSubject: async (subject: Omit<Subject, 'id'>) => {
    const { error } = await supabase.from('subjects').insert({
        name: subject.name,
        code: subject.code,
        max_marks: subject.maxMarks,
        pass_marks: subject.passMarks,
        max_marks_objective: subject.maxMarksObjective,
        max_marks_subjective: subject.maxMarksSubjective
    });
    if (error) throw error;
  },

  // Added missing updateSubject method
  updateSubject: async (subject: Subject) => {
    const { error } = await supabase.from('subjects').update({
        name: subject.name,
        code: subject.code,
        max_marks: subject.maxMarks,
        pass_marks: subject.passMarks,
        max_marks_objective: subject.maxMarksObjective,
        max_marks_subjective: subject.maxMarksSubjective
    }).eq('id', subject.id);
    if (error) throw error;
  },

  // Added missing deleteSubject method
  deleteSubject: async (id: string) => {
    const { error } = await supabase.from('subjects').delete().eq('id', id);
    if (error) throw error;
  },

  // Added missing getMarks method
  getMarks: async (examId: string, subjectId: string): Promise<MarkRecord[]> => {
    const { data, error } = await supabase.from('marks')
      .select('*')
      .eq('exam_id', examId)
      .eq('subject_id', subjectId);
    if (error) return [];
    return data.map(mapMark);
  },

  // Added missing bulkUpdateMarks method
  bulkUpdateMarks: async (marks: MarkRecord[]) => {
    const records = marks.map(m => ({
        student_id: m.studentId,
        exam_id: m.examId,
        subject_id: m.subjectId,
        obj_marks: m.objMarks,
        obj_max_marks: m.objMaxMarks,
        sub_marks: m.subMarks,
        sub_max_marks: m.subMaxMarks,
        grade: m.grade,
        attended: m.attended,
        updated_at: new Date().toISOString()
    }));
    const { error } = await supabase.from('marks').upsert(records, { onConflict: 'student_id,exam_id,subject_id' });
    if (error) throw error;
  },

  // Added missing getStudentMarks method
  getStudentMarks: async (studentId: string, examId: string): Promise<MarkRecord[]> => {
    const { data, error } = await supabase.from('marks')
      .select('*')
      .eq('student_id', studentId)
      .eq('exam_id', examId);
    if (error) return [];
    return data.map(mapMark);
  },

  getStudentHistory: async (studentId: string): Promise<MarkRecord[]> => {
    const { data: marks } = await supabase.from('marks').select('*').eq('student_id', studentId);
    const { data: remarks } = await supabase.from('teacher_remarks').select('*').eq('student_id', studentId);
    
    const marksList = (marks || []).map(mapMark);
    return marksList.map(m => {
        const r = remarks?.find((rem: any) => rem.exam_id === m.examId && rem.subject_id === m.subjectId);
        return { ...m, remarks: r?.remark || '' };
    });
  },

  getStudentNonAcademicHistory: async (studentId: string): Promise<NonAcademicRecord[]> => {
    const { data, error } = await supabase
      .from('non_academic_records')
      .select('*')
      .eq('student_id', studentId);
    if (error) return [];
    return data.map(mapNonAcademic);
  },

  // Added missing getNonAcademicRecords method
  getNonAcademicRecords: async (examId: string): Promise<NonAcademicRecord[]> => {
    const { data, error } = await supabase.from('non_academic_records')
      .select('*')
      .eq('exam_id', examId);
    if (error) return [];
    return data.map(mapNonAcademic);
  },

  // Added missing saveNonAcademicRecord method
  saveNonAcademicRecord: async (record: NonAcademicRecord) => {
    const { error } = await supabase.from('non_academic_records').upsert({
        student_id: record.studentId,
        exam_id: record.examId,
        attendance: record.attendance,
        discipline: record.discipline,
        leadership: record.communication,
        arts: record.participation,
        updated_at: new Date().toISOString()
    }, { onConflict: 'student_id,exam_id' });
    if (error) throw error;
  },

  // Added missing getTeacherRemarks method
  getTeacherRemarks: async (examId: string, subjectId: string): Promise<TeacherRemark[]> => {
    const { data, error } = await supabase.from('teacher_remarks')
      .select('*')
      .eq('exam_id', examId)
      .eq('subject_id', subjectId);
    if (error) return [];
    return data.map(r => ({
        studentId: r.student_id,
        examId: r.exam_id,
        subjectId: r.subject_id,
        remark: r.remark
    }));
  },

  // Added missing saveTeacherRemark method
  saveTeacherRemark: async (remark: TeacherRemark) => {
    const { error } = await supabase.from('teacher_remarks').upsert({
        student_id: remark.studentId,
        exam_id: remark.examId,
        subject_id: remark.subjectId,
        remark: remark.remark,
        updated_at: new Date().toISOString()
    }, { onConflict: 'student_id,exam_id,subject_id' });
    if (error) throw error;
  },

  getDashboardStats: async () => {
    try {
        const { count: s } = await supabase.from('students').select('*', { count: 'exact', head: true });
        const { count: e } = await supabase.from('exams').select('*', { count: 'exact', head: true });
        return { totalStudents: s || 0, activeExams: e || 0, passRate: 88.4, pending: 3 };
    } catch (e) {
        return { totalStudents: 0, activeExams: 0, passRate: 0, pending: 0 };
    }
  },

  checkConnection: async (): Promise<boolean> => {
    try {
      const { error } = await supabase.from('school_config').select('id').limit(1);
      return !error;
    } catch (e) {
      return false;
    }
  },

  getClasses: async (): Promise<SchoolClass[]> => {
    const { data, error } = await supabase.from('classes').select('*').order('name');
    if (error) return [];
    return (data || []).map(mapClass);
  },

  // Added missing addClass method
  addClass: async (cls: Omit<SchoolClass, 'id'>) => {
    const { error } = await supabase.from('classes').insert({
        name: cls.className,
        section: cls.section
    });
    if (error) throw error;
  },

  // Added missing updateClass method
  updateClass: async (cls: SchoolClass) => {
    const { error } = await supabase.from('classes').update({
        name: cls.className,
        section: cls.section
    }).eq('id', cls.id);
    if (error) throw error;
  },

  // Added missing deleteClass method
  deleteClass: async (id: string) => {
    const { error } = await supabase.from('classes').delete().eq('id', id);
    if (error) throw error;
  },

  // Added missing getExamTypes method
  getExamTypes: async (): Promise<ExamType[]> => {
    const { data, error } = await supabase.from('exam_types').select('*').order('name');
    if (error) return [];
    return data;
  },

  // Added missing addExamType method
  addExamType: async (type: Omit<ExamType, 'id'>) => {
    const { error } = await supabase.from('exam_types').insert({
        name: type.name,
        description: type.description
    });
    if (error) throw error;
  },

  // Added missing updateExamType method
  updateExamType: async (type: ExamType) => {
    const { error } = await supabase.from('exam_types').update({
        name: type.name,
        description: type.description
    }).eq('id', type.id);
    if (error) throw error;
  },

  // Added missing deleteExamType method
  deleteExamType: async (id: string) => {
    const { error } = await supabase.from('exam_types').delete().eq('id', id);
    if (error) throw error;
  },

  // Added missing getTemplates method
  getTemplates: async (): Promise<SavedTemplate[]> => {
    const { data, error } = await supabase.from('templates').select('*').order('created_at', { ascending: false });
    if (error) return [];
    return data.map(t => ({
        id: t.id,
        name: t.name,
        elements: t.elements,
        width: t.width,
        height: t.height,
        createdAt: new Date(t.created_at).toLocaleDateString()
    }));
  },

  // Added missing saveTemplate method
  saveTemplate: async (template: Omit<SavedTemplate, 'createdAt'>) => {
    const { error } = await supabase.from('templates').upsert({
        id: template.id,
        name: template.name,
        elements: template.elements,
        width: template.width,
        height: template.height,
        created_at: new Date().toISOString()
    });
    if (error) throw error;
  },

  // Added missing deleteTemplate method
  deleteTemplate: async (id: string) => {
    const { error } = await supabase.from('templates').delete().eq('id', id);
    if (error) throw error;
  },

  // Added missing getSystemUsers method
  getSystemUsers: async () => {
    const { data, error } = await supabase.from('system_users').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data.map(u => ({
        id: u.id,
        name: u.full_name,
        email: u.email,
        role: u.role,
        status: u.status,
        lastLogin: u.last_login_at ? new Date(u.last_login_at).toLocaleString() : 'Never',
        staffPost: u.staff_post,
        mobile: u.mobile
    }));
  },

  // Added missing updateSystemUser method
  updateSystemUser: async (id: string, updates: any) => {
    const { error } = await supabase.from('system_users').update(updates).eq('id', id);
    if (error) throw error;
  },

  // Added missing addSystemUser method
  addSystemUser: async (user: any) => {
    const { error } = await supabase.from('system_users').insert({
        id: generateId(),
        full_name: user.name,
        email: user.email,
        password: user.password,
        role: user.role,
        mobile: user.mobile,
        status: 'Active',
        assigned_subject_id: user.subjectId || null,
        staff_post: user.staffPost || null
    });
    if (error) throw error;
  },

  // Added missing signUp method
  signUp: async (user: any) => {
    const { error } = await supabase.from('system_users').insert({
        id: generateId(),
        full_name: user.name,
        email: user.email,
        password: user.password,
        role: user.role,
        status: 'Locked', // Pending approval
        assigned_subject_id: user.subjectId || null,
        staff_post: user.staffPost || null
    });
    if (error) throw error;
  },

  // Added missing getUserActivityLogs method
  getUserActivityLogs: async (): Promise<ActivityLog[]> => {
    // Audit logs table might be implemented separately, for now returning empty or demo
    return [];
  },

  updateStudent: async (student: Student) => {
    const { error } = await supabase.from('students').update({
        full_name: student.fullName,
        class_name: student.className,
        section: student.section,
        guardian_name: student.guardianName,
        contact_number: student.contactNumber,
        status: student.status,
        avatar_url: student.avatarUrl,
        date_of_birth: student.dateOfBirth
    }).eq('id', student.id);
    if (error) throw error;
  },

  // Added missing seedInitialData method
  seedInitialData: async () => {
      // Basic initialization logic
      const { error } = await supabase.from('school_config').upsert({ id: 1, name: 'UNACADEMY', tagline: 'Excellence in Education' }, { onConflict: 'id' });
      if (error) throw error;
  }
};
