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
