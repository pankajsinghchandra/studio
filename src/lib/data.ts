import type { ClassData } from './types';
import { Book, FlaskConical, Calculator, Languages, History, Globe, Music } from 'lucide-react';

export const data: ClassData[] = [
  {
    id: 'class-6',
    name: 'Class 6',
    subjects: [
      {
        id: 'math',
        name: 'Mathematics',
        icon: Calculator,
        lessons: [
          {
            id: 'algebra-intro',
            name: 'Introduction to Algebra',
            content: {
              id: 'alg-intro-pdf',
              name: 'Algebra Basics PDF',
              type: 'pdf',
              source: 'https://drive.google.com/file/d/1B2L282GZgEa-M0g0b5pW-X-1J-o8vYj_/preview',
              description: 'A comprehensive guide to the basics of algebra.'
            },
          },
          {
            id: 'geometry-basics',
            name: 'Geometry Basics',
            content: {
              id: 'geo-basics-video',
              name: 'Understanding Shapes Video',
              type: 'video',
              source: 'https://drive.google.com/file/d/1D2V82jNSSoJ5yo_nE_2j9A_mB4t-V5mP/preview',
              description: 'A video explaining basic geometric shapes and their properties.'
            },
          },
        ],
      },
      {
        id: 'science',
        name: 'Science',
        icon: FlaskConical,
        lessons: [
          {
            id: 'living-organisms',
            name: 'Living Organisms',
            content: {
              id: 'living-org-text',
              name: 'Characteristics of Living Organisms',
              type: 'text',
              source: `
# Characteristics of Living Organisms

All living organisms share several key characteristics:

1.  **Nutrition:** They take in materials from their surroundings for growth and energy.
2.  **Respiration:** They release energy from their food.
3.  **Movement:** All living things move in some way.
4.  **Excretion:** They get rid of waste products.
5.  **Growth:** They get bigger and more complex.
6.  **Reproduction:** They produce offspring.
7.  **Sensitivity:** They react to changes in their environment.
              `,
              description: 'A text document outlining the key characteristics of all living things.'
            },
          },
        ],
      },
      {
        id: 'english',
        name: 'English',
        icon: Languages,
        lessons: [
          {
            id: 'grammar-nouns',
            name: 'Grammar: Nouns',
            content: {
                id: 'nouns-doc',
                name: 'Nouns and Their Types',
                type: 'doc',
                source: 'https://docs.google.com/document/d/e/2PACX-1vRde6k3VBw1L4P9jNAw_B5gYvsh502xEDrGf1qn25qOA0D3yA4-s5l_1g_5b_5eF_fO5b_y_e_f-3/pub?embedded=true',
                description: 'A document explaining what nouns are and their different types.'
            }
          }
        ]
      },
      {
        id: 'music',
        name: 'Music',
        icon: Music,
        lessons: [
          {
            id: 'classical-intro',
            name: 'Introduction to Classical Music',
            content: {
                id: 'classical-audio',
                name: 'Mozart Sample',
                type: 'audio',
                source: 'https://drive.google.com/file/d/1bJGUMu53dqT33u1bW89S5Jd3Q_7nO4f_/preview',
                description: 'An audio sample of classical music by Mozart.'
            }
          }
        ]
      }
    ],
  },
  // Add more classes if needed for demonstration
];
