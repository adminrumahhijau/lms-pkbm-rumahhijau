export const BASE_SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/classroom.courses.readonly',
  'https://www.googleapis.com/auth/classroom.coursework.me',
  'https://www.googleapis.com/auth/classroom.coursework.me.readonly',
  'https://www.googleapis.com/auth/classroom.student-submissions.me.readonly',
  'https://www.googleapis.com/auth/classroom.courseworkmaterials.readonly',
  'https://www.googleapis.com/auth/classroom.rosters.readonly',
  'https://www.googleapis.com/auth/classroom.coursework.students.readonly',
  'https://www.googleapis.com/auth/classroom.profile.emails', // baca email guru
  'https://www.googleapis.com/auth/drive.file', // unggah file hasil pekerjaan
]

export const STAFF_SCOPES = [
  'https://www.googleapis.com/auth/classroom.coursework.students', // buat/ubah/hapus tugas
  'https://www.googleapis.com/auth/classroom.courseworkmaterials', // buat/ubah/hapus materi
]
