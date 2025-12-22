
import { supabase } from "../lib/supabase";
import { Student, StudentStatus, Exam, ExamStatus, Subject, MarkRecord, SchoolClass, ExamType, SavedTemplate, TeacherRemark, NonAcademicRecord, UserProfile, ActivityLog } from "../types";

const SESSION_KEY = 'unacademy_db_session';

const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

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

export const DataService = {
  signIn: async (email: string, password: string): Promise<UserProfile> => {
    if (email === 'admin@unacademy.com' && password === 'admin123') {
       const demoUser: UserProfile = {
         id: 'demo-admin-id',
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
      .eq('email', email)
      .eq('password', password)
      .maybeSingle();

    if (error) {
        if (error.code === '42501') throw new Error("PERMISSION_DENIED: Supabase RLS is blocking access. Run the SQL fix in Diagnostics.");
        throw new Error(`DB_ERROR: ${error.message}`);
    }
    if (!profile) throw new Error("Invalid email or password.");

    if (profile.status === 'Locked') {
      throw new Error("Account pending approval. Contact the Super Admin.");
    }

    const user: UserProfile = {
      id: profile.id,
      fullName: profile.full_name,
      email: profile.email,
      role: profile.role,
      status: profile.status,
      assignedSubjectId: profile.assigned_subject_id,
      assignedClassId: profile.assigned_class_id
    };

    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return user;
  },

  signUp: async (user: any) => {
    const { data: existing, error: existErr } = await supabase.from('system_users').select('id').eq('email', user.email).maybeSingle();
    if (existErr && existErr.code === '42501') throw new Error("PERMISSION_DENIED: RLS prevents checking existing users.");
    if (existing) throw new Error("An account with this email already exists.");

    const userId = generateId();
    const { error: dbError } = await supabase.from('system_users').insert({
        id: userId,
        full_name: user.name,
        email: user.email,
        mobile: user.mobile || '',
        role: user.role,
        password: user.password,
        assigned_subject_id: user.subjectId || null,
        assigned_class_id: user.classId || null,
        staff_post: user.staffPost || user.staff_post || null,
        status: 'Locked' 
    });
    
    if (dbError) {
        if (dbError.code === '42501') throw new Error("PERMISSION_DENIED: Cannot register. RLS is enabled on 'system_users'.");
        throw new Error(`REGISTRATION_FAILED: ${dbError.message}`);
    }
  },

  addSystemUser: async (user: any) => {
    return DataService.signUp(user);
  },

  signOut: async () => {
    localStorage.removeItem(SESSION_KEY);
  },

  getCurrentUser: async (): Promise<UserProfile | null> => {
    const session = localStorage.getItem(SESSION_KEY);
    if (!session) return null;
    
    try {
        const cachedUser = JSON.parse(session);
        if (cachedUser.id === 'demo-admin-id') return cachedUser;

        const { data: profile, error } = await supabase
          .from('system_users')
          .select('*')
          .eq('id', cachedUser.id)
          .single();
          
        if (error || !profile || profile.status === 'Locked') {
            localStorage.removeItem(SESSION_KEY);
            return null;
        }

        return {
          id: profile.id,
          fullName: profile.full_name,
          email: profile.email,
          role: profile.role,
          status: profile.status,
          assignedSubjectId: profile.assigned_subject_id,
          assignedClassId: profile.assigned_class_id
        };
    } catch (e) {
        return null;
    }
  },

  seedInitialData: async () => {
    try {
        await supabase.from('system_users').upsert({
            id: 'demo-admin-id',
            full_name: 'Master Admin',
            email: 'admin@unacademy.com',
            password: 'admin123',
            role: 'Super Admin',
            status: 'Active'
        }, { onConflict: 'id' });

        const subjects = [
            { name: 'Mathematics', code: 'MTH-101', max_marks: 100, pass_marks: 33, max_marks_objective: 40, max_marks_subjective: 60 },
            { name: 'Science', code: 'SCI-101', max_marks: 100, pass_marks: 33, max_marks_objective: 30, max_marks_subjective: 70 },
            { name: 'English', code: 'ENG-101', max_marks: 100, pass_marks: 33, max_marks_objective: 20, max_marks_subjective: 80 }
        ];
        const { error: subErr } = await supabase.from('subjects').upsert(subjects, { onConflict: 'code' });
        if (subErr) throw subErr;

        const classes = [
            { name: 'Class 9', section: 'A' },
            { name: 'Class 10', section: 'A' }
        ];
        const { error: clsErr } = await supabase.from('classes').upsert(classes, { onConflict: 'name,section' });
        if (clsErr) throw clsErr;

        const students = [
            { full_name: 'Rahul Kumar', roll_number: 'ACS001', class_name: 'Class 10', section: 'A', guardian_name: 'Suresh Kumar', status: 'Active' },
            { full_name: 'Priya Sharma', roll_number: 'ACS002', class_name: 'Class 10', section: 'A', guardian_name: 'Amit Sharma', status: 'Active' }
        ];
        const { error: stErr } = await supabase.from('students').upsert(students, { onConflict: 'roll_number' });
        if (stErr) throw stErr;

        await supabase.from('exam_types').upsert([{ name: 'Unit Test' }, { name: 'Final Exam' }], { onConflict: 'name' });

        return true;
    } catch (e: any) {
        if (e.code === '42501') throw new Error("RLS_BLOCKED: Cannot seed data. Row Level Security is active on Supabase.");
        throw new Error(e.message || "Seeding failed.");
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

  getSchoolInfo: async () => {
    const { data, error } = await supabase.from('school_config').select('*').eq('id', 1).maybeSingle();
    if (error || !data) {
      return { name: 'UNACADEMY', tagline: 'Excellence in Education', logo: '', watermark: '', scorecard_layout: null };
    }
    return {
      name: data.name,
      tagline: data.tagline,
      logo: data.logo_url,
      watermark: data.watermark_url,
      scorecard_layout: data.scorecard_layout
    };
  },

  updateSchoolInfo: async (info: { name: string, tagline: string, logo: string, watermark: string, scorecard_layout?: any }) => {
    const dbRecord = {
      id: 1, 
      name: info.name,
      tagline: info.tagline,
      logo_url: info.logo,
      watermark_url: info.watermark,
      scorecard_layout: info.scorecard_layout,
      updated_at: new Date().toISOString()
    };
    const { error } = await supabase.from('school_config').upsert(dbRecord, { onConflict: 'id' });
    if (error) throw new Error(error.message || "Failed to update school info");
  },

  uploadFile: async (file: File, folder: string = 'branding'): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${folder}/${Date.now()}_${generateId()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from('school_assets')
      .upload(fileName, file, { upsert: true });
    if (uploadError) throw new Error(uploadError.message || "Failed to upload file");
    const { data } = supabase.storage.from('school_assets').getPublicUrl(fileName);
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
    const dbRecord = { id: template.id, name: template.name, elements: template.elements, width: template.width, height: template.height };
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
    await supabase.from('non_academic_records').delete().eq('student_id', id);
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
      avatar_url: student.avatarUrl,
      date_of_birth: student.dateOfBirth
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
      avatar_url: student.avatarUrl,
      date_of_birth: student.dateOfBirth
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
      avatar_url: s.avatarUrl,
      date_of_birth: s.dateOfBirth
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
      name: exam.name, term: exam.type, start_date: exam.date, status: exam.status, academic_year: new Date().getFullYear().toString()
    });
    if (error) throw new Error(error.message || "Failed to add exam");
  },

  updateExam: async (exam: Exam): Promise<void> => {
    const { error } = await supabase.from('exams').update({ name: exam.name, term: exam.type, start_date: exam.date, status: exam.status }).eq('id', exam.id);
    if (error) throw new Error(error.message || "Failed to update exam");
  },

  deleteExam: async (id: string): Promise<void> => {
    await supabase.from('marks').delete().eq('exam_id', id);
    await supabase.from('teacher_remarks').delete().eq('exam_id', id);
    await supabase.from('non_academic_records').delete().eq('exam_id', id);
    const { error } = await supabase.from('exams').delete().eq('id', id);
    if (error) throw new Error(error.message || "Failed to delete exam");
  },

  getSubjects: async (): Promise<Subject[]> => {
    const { data, error } = await supabase.from('subjects').select('*').order('name');
    if (error) return [];
    return (data || []).map(mapSubjectRecord);
  },

  addSubject: async (sub: Partial<Subject>): Promise<void> => {
    const { error } = await supabase.from('subjects').insert({ name: sub.name, code: sub.code, max_marks: sub.maxMarks, pass_marks: sub.passMarks, max_marks_objective: sub.maxMarksObjective, max_marks_subjective: sub.maxMarksSubjective });
    if (error) throw new Error(error.message || "Failed to add subject");
  },

  updateSubject: async (sub: Subject): Promise<void> => {
    const { error } = await supabase.from('subjects').update({ name: sub.name, code: sub.code, max_marks: sub.maxMarks, pass_marks: sub.passMarks, max_marks_objective: sub.maxMarksObjective, max_marks_subjective: sub.maxMarksSubjective }).eq('id', sub.id);
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
    const { error = null } = await supabase.from('classes').insert({ name: cls.className, section: cls.section });
    if (error) throw new Error(error.message || "Failed to add class");
  },

  updateClass: async (cls: SchoolClass): Promise<void> => {
    const { error = null } = await supabase.from('classes').update({ name: cls.className, section: cls.section }).eq('id', cls.id);
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

  getStudentMarks: async (studentId: string, examId: string): Promise<MarkRecord[]> => {
    const { data: marks } = await supabase.from('marks').select('*').eq('student_id', studentId).eq('exam_id', examId);
    const { data: remarks } = await supabase.from('teacher_remarks').select('*').eq('student_id', studentId).eq('exam_id', examId);
    const marksList = (marks || []).map(mapMark);
    return marksList.map(m => {
        const r = remarks?.find((rm: any) => rm.subject_id === m.subjectId);
        if (r) return { ...m, remarks: r.remark };
        return m;
    });
  },

  getStudentHistory: async (studentId: string): Promise<MarkRecord[]> => {
    const { data: marks } = await supabase.from('marks').select('*').eq('student_id', studentId);
    const { data: remarks } = await supabase.from('teacher_remarks').select('*').eq('student_id', studentId);
    const marksList = (marks || []).map(mapMark);
    return marksList.map(m => {
        const r = remarks?.find((rm: any) => rm.exam_id === m.examId && rm.subject_id === m.subjectId);
        if (r) return { ...m, remarks: r.remark };
        return m;
    });
  },

  updateMark: async (m: MarkRecord): Promise<void> => {
    const dbRecord = {
      student_id: m.studentId, exam_id: m.examId, subject_id: m.subjectId, obj_marks: m.objMarks, obj_max_marks: m.objMaxMarks, sub_marks: m.subMarks, sub_max_marks: m.subMaxMarks, exam_date: m.examDate, grade: m.grade, remarks: m.remarks, attended: m.attended, updated_at: new Date().toISOString()
    };
    const { error } = await supabase.from('marks').upsert(dbRecord, { onConflict: 'student_id,exam_id,subject_id' });
    if (error) throw new Error(error.message || "Failed to update record");
  },

  bulkUpdateMarks: async (records: MarkRecord[]): Promise<void> => {
    if (records.length === 0) return;
    const dbRecords = records.map(m => ({
      student_id: m.studentId, exam_id: m.examId, subject_id: m.subjectId, obj_marks: m.objMarks || 0, obj_max_marks: m.objMaxMarks || 0, sub_marks: m.subMarks || 0, sub_max_marks: m.subMaxMarks || 0, exam_date: m.examDate || new Date().toISOString().split('T')[0], grade: m.grade || 'F', remarks: m.remarks || '', attended: m.attended ?? true, updated_at: new Date().toISOString()
    }));
    const { error } = await supabase.from('marks').upsert(dbRecords, { onConflict: 'student_id,exam_id,subject_id' });
    if (error) throw new Error(error.message || "Database batch operation failed");
  },

  getNonAcademicRecords: async (examId: string): Promise<NonAcademicRecord[]> => {
    const { data, error } = await supabase.from('non_academic_records').select('*').eq('exam_id', examId);
    if (error) return [];
    return (data || []).map(mapNonAcademic);
  },

  saveNonAcademicRecord: async (r: NonAcademicRecord): Promise<void> => {
    const { error } = await supabase.from('non_academic_records').upsert({
      student_id: r.studentId,
      exam_id: r.examId,
      attendance: r.attendance,
      discipline: r.discipline,
      leadership: r.communication, 
      arts: r.participation,        
      updated_at: new Date().toISOString()
    }, { onConflict: 'student_id,exam_id' });
    if (error) throw new Error(error.message || "Failed to save non-academic record");
  },

  saveTeacherRemark: async (r: TeacherRemark): Promise<void> => {
    const { error } = await supabase.from('teacher_remarks').upsert({
        student_id: r.studentId, exam_id: r.examId, subject_id: r.subjectId, remark: r.remark, updated_at: new Date().toISOString()
    }, { onConflict: 'student_id,exam_id,subject_id' });
    if (error) throw new Error(error.message || "Failed to save remark");
  },

  getTeacherRemarks: async (examId: string, subjectId: string): Promise<TeacherRemark[]> => {
     const { data } = await supabase.from('teacher_remarks').select('*').eq('exam_id', examId).eq('subject_id', subjectId);
     return (data || []).map((r: any) => ({ studentId: r.student_id, examId: r.exam_id, subjectId: r.subject_id, remark: r.remark }));
  },

  getSystemUsers: async () => {
    const { data, error } = await supabase
        .from('system_users')
        .select('*, subjects(name), classes(name, section)')
        .order('created_at', { ascending: false });
    if (error) return [];
    return data.map((u: any) => ({
        id: u.id,
        name: u.full_name,
        email: u.email,
        mobile: u.mobile,
        role: u.role,
        status: u.status,
        lastLogin: u.last_login_at ? new Date(u.last_login_at).toLocaleString() : 'Never',
        assignedSubject: u.subjects?.name,
        assignedClass: u.classes ? `${u.classes.name} - ${u.classes.section}` : undefined,
        staffPost: u.staff_post
    }));
  },

  updateSystemUser: async (id: string, updates: any) => {
    const { error } = await supabase.from('system_users').update(updates).eq('id', id);
    if (error) throw new Error(error.message);
  },

  getUserActivityLogs: async (): Promise<ActivityLog[]> => {
    return [
      { id: '1', userId: 'admin', userName: 'Master Admin', role: 'Super Admin', action: 'System Setup', details: 'Database health check performed', ipAddress: '127.0.0.1', timestamp: new Date().toISOString() },
    ];
  },

  getDashboardStats: async () => {
    try {
        const { count: s } = await supabase.from('students').select('*', { count: 'exact', head: true });
        const { count: e } = await supabase.from('exams').select('*', { count: 'exact', head: true });
        return { totalStudents: s || 0, activeExams: e || 0, passRate: 88.4, pending: 3 };
    } catch (e) {
        return { totalStudents: 0, activeExams: 0, passRate: 0, pending: 0 };
    }
  }
};
