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
  icon: LucideIcon;
  lessons: Lesson[];
}

export interface ClassData {
  id: string;
  name: string;
  subjects: Subject[];
}

export interface Resource {
  id: string;
  type: 'lesson-plan-pdf' | 'lesson-plan-word' | 'video' | 'infographic' | 'mind-map' | 'pdf-note';
  title: string;
  url: string;
  class: string;
  subject: string;
  chapter: string;
  authorId: string;
}
