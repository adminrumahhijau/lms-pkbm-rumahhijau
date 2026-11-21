import type { LucideIcon } from 'lucide-react'

export interface Subject {
  id: string
  name: string
  subtitle?: string
  icon: LucideIcon
  role?: 'student' | 'teacher'
}

export interface Module {
  id: string
  title: string
  description: string
  type: 'PDF' | 'Video' | 'Tautan' | 'Slide' | 'File'
  date: string
  url: string
}

export interface Task {
  id: string
  title: string
  description: string
  dueDate: string | null
  points: number
  submissionState: 'NEW' | 'CREATED' | 'TURNED_IN' | 'RETURNED' | 'RECLAIMED_BY_STUDENT'
  submitted: number
  total: number
  url: string
  canSubmit: boolean // hanya tugas bertipe ASSIGNMENT yang bisa menerima lampiran dari API
  grade: number | null
  feedback: string | null
}

export interface Participant {
  id: string
  name: string
  role: 'tutor' | 'siswa'
}
