import type { LucideIcon } from 'lucide-react';

export interface Content {
  id: string;
  name: string;
  type: 'pdf' | 'video' | 'audio' | 'text' | 'doc';
  source: string; // Google Drive embed URL or markdown text
  description: string;
}

export interface Lesson {
  id: string;
  name:string;
  content: Content[];
}

export interface Subject {
  id: string;
  name: string;
  lessons: Lesson[];
}

export interface ClassData {
  id: string;
  name: string;
  subjects: Subject[];
}

export interface Resource {
  id: string;
  type: 'lesson-plan-pdf' | 'lesson-plan-image' | 'video' | 'infographic' | 'mind-map' | 'pdf-note' | 'lesson-plan-text' | 'mind-map-json' | 'translated-chapter' | 'song';
  title: string;
  url: string;
  class: string;
  subject: string;
  chapter: string;
  authorId: string;
}

export interface UserActivity {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  resourceId: string;
  resourceTitle: string;
  resourceClass: string;
  resourceSubject: string;
  resourceChapter: string;
  timestamp: any; // Firestore timestamp object
}
