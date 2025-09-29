import type { ClassData } from './types';
import { Book, FlaskConical, Calculator, Languages, History, Globe, Music, Leaf, PenSquare, BookCopy } from 'lucide-react';

export const data: ClassData[] = [
  {
    id: 'class-4',
    name: 'Class 4',
    subjects: [
      {
        id: 'evs',
        name: 'EVS',
        icon: Leaf,
        lessons: [
          { id: 'evs-1', name: 'रंग-बिरंगे खिलते फूल', content: { id: 'c4-evs-1', name: 'रंग-बिरंगे खिलते फूल', type: 'text', source: 'Content not available yet.', description: 'Content for this lesson will be added soon.' } },
          { id: 'evs-2', name: 'कोई देता अंडे, कोई देता बच्चे', content: { id: 'c4-evs-2', name: 'कोई देता अंडे, कोई देता बच्चे', type: 'text', source: 'Content not available yet.', description: 'Content for this lesson will be added soon.' } },
          { id: 'evs-3', name: 'हड़बड़ में गड़बड़', content: { id: 'c4-evs-3', name: 'हड़बड़ में गड़बड़', type: 'text', source: 'Content not available yet.', description: 'Content for this lesson will be added soon.' } },
          { id: 'evs-4', name: 'त्योहार और भोजन', content: { id: 'c4-evs-4', name: 'त्योहार और भोजन', type: 'text', source: 'Content not available yet.', description: 'Content for this lesson will be added soon.' } },
          { id: 'evs-5', name: 'स्वाद अलग-अलग', content: { id: 'c4-evs-5', name: 'स्वाद अलग-अलग', type: 'text', source: 'Content not available yet.', description: 'Content for this lesson will be added soon.' } },
          { id: 'evs-6', name: 'हरियाली और हम', content: { id: 'c4-evs-6', name: 'हरियाली और हम', type: 'text', source: 'Content not available yet.', description: 'Content for this lesson will be added soon.' } },
          { id: 'evs-7', name: 'जड़ों की पकड़', content: { id: 'c4-evs-7', name: 'जड़ों की पकड़', type: 'text', source: 'Content not available yet.', description: 'Content for this lesson will be added soon.' } },
          { id: 'evs-8', name: 'देख तमाशा', content: { id: 'c4-evs-8', name: 'देख तमाशा', type: 'text', source: 'Content not available yet.', description: 'Content for this lesson will be added soon.' } },
          { id: 'evs-9', name: 'जब जागाजी पर आए', content: { id: 'c4-evs-9', name: 'जब जागाजी पर आए', type: 'text', source: 'Content not available yet.', description: 'Content for this lesson will be added soon.' } },
          { id: 'evs-10', name: 'एक पत्ते और बच्चे', content: { id: 'c4-evs-10', name: 'एक पत्ते और बच्चे', type: 'text', source: 'Content not available yet.', description: 'Content for this lesson will be added soon.' } },
        ]
      },
      {
        id: 'evs-workbook',
        name: 'EVS Workbook',
        icon: PenSquare,
        lessons: [ { id: 'workbook-placeholder', name: 'Workbook exercises', content: { id: 'c4-evs-wb', name: 'Workbook exercises', type: 'text', source: 'Workbook content will be added here.', description: 'Practice exercises for EVS.' } }]
      },
      {
        id: 'math',
        name: 'Mathematics',
        icon: Calculator,
        lessons: [
          { id: 'math-1', name: 'संख्याओं का मेला', content: { id: 'c4-math-1', name: 'संख्याओं का मेला', type: 'text', source: 'Content not available yet.', description: 'Exploring the world of numbers.' } },
          { id: 'math-2', name: 'जोड़', content: { id: 'c4-math-2', name: 'जोड़', type: 'text', source: 'Content not available yet.', description: 'Learning addition.' } },
          { id: 'math-3', name: 'घटाव', content: { id: 'c4-math-3', name: 'घटाव', type: 'text', source: 'Content not available yet.', description: 'Learning subtraction.' } },
          { id: 'math-4', name: 'गुणा', content: { id: 'c4-math-4', name: 'गुणा', type: 'text', source: 'Content not available yet.', description: 'Learning multiplication.' } },
          { id: 'math-5', name: 'भाग', content: { id: 'c4-math-5', name: 'भाग', type: 'text', source: 'Content not available yet.', description: 'Learning division.' } },
          { id: 'math-6', name: 'मुद्रा', content: { id: 'c4-math-6', name: 'मुद्रा', type: 'text', source: 'Content not available yet.', description: 'Understanding currency and money.' } },
          { id: 'math-7', name: 'भिन्नात्मक संख्याएँ', content: { id: 'c4-math-7', name: 'भिन्नात्मक संख्याएँ', type: 'text', source: 'Content not available yet.', description: 'Introduction to fractions.' } },
          { id: 'math-8', name: 'पुनरावृत्ति एवं अर्धवार्षिक', content: { id: 'c4-math-8', name: 'पुनरावृत्ति एवं अर्धवार्षिक', type: 'text', source: 'Content not available yet.', description: 'Revision and half-yearly assessment.' } },
          { id: 'math-9', name: 'सममिति', content: { id: 'c4-math-9', name: 'सममिति', type: 'text', source: 'Content not available yet.', description: 'Understanding symmetry.' } },
          { id: 'math-10', name: 'लम्बाई की माप', content: { id: 'c4-math-10', name: 'लम्बाई की माप', type: 'text', source: 'Content not available yet.', description: 'Measuring length.' } },
          { id: 'math-11', name: 'भार', content: { id: 'c4-math-11', name: 'भार', type: 'text', source: 'Content not available yet.', description: 'Measuring weight.' } },
          { id: 'math-12', name: 'धारिता', content: { id: 'c4-math-12', name: 'धारिता', type: 'text', source: 'Content not available yet.', description: 'Measuring capacity/volume.' } },
          { id: 'math-13', name: 'समय', content: { id: 'c4-math-13', name: 'समय', type: 'text', source: 'Content not available yet.', description: 'Telling and measuring time.' } },
          { id: 'math-14', name: 'टाइलीकरण', content: { id: 'c4-math-14', name: 'टाइलीकरण', type: 'text', source: 'Content not available yet.', description: 'Understanding tiling patterns.' } },
          { id: 'math-15', name: 'परिमाप एवं क्षेत्रफल', content: { id: 'c4-math-15', name: 'परिमाप एवं क्षेत्रफल', type: 'text', source: 'Content not available yet.', description: 'Calculating perimeter and area.' } },
          { id: 'math-16', name: 'आँकड़ों का खेल', content: { id: 'c4-math-16', name: 'आँकड़ों का खेल', type: 'text', source: 'Content not available yet.', description: 'Introduction to data handling.' } },
          { id: 'math-17', name: 'आकृतियों का खेल', content: { id: 'c4-math-17', name: 'आकृतियों का खेल', type: 'text', source: 'Content not available yet.', description: 'Playing with shapes.' } },
          { id: 'math-18', name: 'पैटर्न', content: { id: 'c4-math-18', name: 'पैटर्न', type: 'text', source: 'Content not available yet.', description: 'Recognizing patterns.' } },
        ]
      },
       {
        id: 'math-workbook',
        name: 'Math Workbook',
        icon: PenSquare,
        lessons: [ { id: 'workbook-placeholder', name: 'Workbook exercises', content: { id: 'c4-math-wb', name: 'Workbook exercises', type: 'text', source: 'Workbook content will be added here.', description: 'Practice exercises for Math.' } }]
      },
      {
        id: 'hindi',
        name: 'Hindi',
        icon: Book,
        lessons: [
          { id: 'hindi-1', name: 'याद तुम्हारी आती है', content: { id: 'c4-hindi-1', name: 'याद तुम्हारी आती है', type: 'text', source: 'Content not available yet.', description: 'Content for this lesson will be added soon.' } },
          { id: 'hindi-2', name: 'चार मित्र', content: { id: 'c4-hindi-2', name: 'चार मित्र', type: 'text', source: 'Content not available yet.', description: 'Content for this lesson will be added soon.' } },
          { id: 'hindi-3', name: 'घर प्यारा', content: { id: 'c4-hindi-3', name: 'घर प्यारा', type: 'text', source: 'Content not available yet.', description: 'Content for this lesson will be added soon.' } },
          { id: 'hindi-4', name: 'बिल्ली का पंजा', content: { id: 'c4-hindi-4', name: 'बिल्ली का पंजा', type: 'text', source: 'Content not available yet.', description: 'Content for this lesson will be added soon.' } },
          { id: 'hindi-5', name: 'पाप अनुहरी', content: { id: 'c4-hindi-5', name: 'पाप अनुहरी', type: 'text', source: 'Content not available yet.', description: 'Content for this lesson will be added soon.' } },
        ]
      },
       {
        id: 'hindi-workbook',
        name: 'Hindi Workbook',
        icon: PenSquare,
        lessons: [ { id: 'workbook-placeholder', name: 'Workbook exercises', content: { id: 'c4-hindi-wb', name: 'Workbook exercises', type: 'text', source: 'Workbook content will be added here.', description: 'Practice exercises for Hindi.' } }]
      },
      {
        id: 'english',
        name: 'English',
        icon: Languages,
        lessons: [
          { id: 'eng-1', name: 'I LOVE GRANDMA', content: { id: 'c4-eng-1', name: 'I LOVE GRANDMA', type: 'text', source: 'Content not available yet.', description: 'Content for this lesson will be added soon.' } },
          { id: 'eng-2', name: 'OUR HOME', content: { id: 'c4-eng-2', name: 'OUR HOME', type: 'text', source: 'Content not available yet.', description: 'Content for this lesson will be added soon.' } },
          { id: 'eng-3', name: 'VIKRAM, THE WISE KING', content: { id: 'c4-eng-3', name: 'VIKRAM, THE WISE KING', type: 'text', source: 'Content not available yet.', description: 'Content for this lesson will be added soon.' } },
          { id: 'eng-4', name: 'LET ME DIAL', content: { id: 'c4-eng-4', name: 'LET ME DIAL', type: 'text', source: 'Content not available yet.', description: 'Content for this lesson will be added soon.' } },
          { id: 'eng-5', name: 'HEERA AND MOTI', content: { id: 'c4-eng-5', name: 'HEERA AND MOTI', type: 'text', source: 'Content not available yet.', description: 'Content for this lesson will be added soon.' } },
        ]
      },
       {
        id: 'english-workbook',
        name: 'English Workbook',
        icon: PenSquare,
        lessons: [ { id: 'workbook-placeholder', name: 'Workbook exercises', content: { id: 'c4-eng-wb', name: 'Workbook exercises', type: 'text', source: 'Workbook content will be added here.', description: 'Practice exercises for English.' } }]
      },
    ]
  },
  {
    id: 'class-5',
    name: 'Class 5',
    subjects: [
      {
        id: 'evs',
        name: 'EVS',
        icon: Globe,
        lessons: [
          { id: 'evs-1', name: 'पटवा से नाथुला की यात्रा', content: { id: 'c5-evs-1', name: 'पटवा से नाथुला की यात्रा', type: 'text', source: 'Content not available yet.', description: 'Content for this lesson will be added soon.' } },
          { id: 'evs-2', name: 'खेल', content: { id: 'c5-evs-2', name: 'खेल', type: 'text', source: 'Content not available yet.', description: 'Content for this lesson will be added soon.' } },
          { id: 'evs-3', name: 'बीजों का विखरना', content: { id: 'c5-evs-3', name: 'बीजों का विखरना', type: 'text', source: 'Content not available yet.', description: 'Content for this lesson will be added soon.' } },
          { id: 'evs-4', name: 'मेरा बगीचा', content: { id: 'c5-evs-4', name: 'मेरा बगीचा', type: 'text', source: 'Content not available yet.', description: 'Content for this lesson will be added soon.' } },
          { id: 'evs-5', name: 'ऐतिहासिक स्मारक', content: { id: 'c5-evs-5', name: 'ऐतिहासिक स्मारक', type: 'text', source: 'Content not available yet.', description: 'Content for this lesson will be added soon.' } },
        ]
      },
      {
        id: 'evs-workbook',
        name: 'EVS Workbook',
        icon: PenSquare,
        lessons: [ { id: 'workbook-placeholder', name: 'Workbook exercises', content: { id: 'c5-evs-wb', name: 'Workbook exercises', type: 'text', source: 'Workbook content will be added here.', description: 'Practice exercises for EVS.' } }]
      },
      {
        id: 'math',
        name: 'Mathematics',
        icon: Calculator,
        lessons: [
          { id: 'math-1', name: 'संख्याओं का मेला', content: { id: 'c5-math-1', name: 'संख्याओं का मेला', type: 'text', source: 'Content not available yet.', description: 'Content for this lesson will be added soon.' } },
          { id: 'math-2', name: 'जोड़-घटाव', content: { id: 'c5-math-2', name: 'जोड़-घटाव', type: 'text', source: 'Content not available yet.', description: 'Content for this lesson will be added soon.' } },
          { id: 'math-3', name: 'गुणा-भाग', content: { id: 'c5-math-3', name: 'गुणा-भाग', type: 'text', source: 'Content not available yet.', description: 'Content for this lesson will be added soon.' } },
          { id: 'math-4', name: 'गुणज तथा गुणनखण्ड', content: { id: 'c5-math-4', name: 'गुणज तथा गुणनखण्ड', type: 'text', source: 'Content not available yet.', description: 'Content for this lesson will be added soon.' } },
          { id: 'math-5', name: 'भिन्न एवं दशमलव भिन्न', content: { id: 'c5-math-5', name: 'भिन्न एवं दशमलव भिन्न', type: 'text', source: 'Content not available yet.', description: 'Content for this lesson will be added soon.' } },
        ]
      },
      {
        id: 'math-workbook',
        name: 'Math Workbook',
        icon: PenSquare,
        lessons: [ { id: 'workbook-placeholder', name: 'Workbook exercises', content: { id: 'c5-math-wb', name: 'Workbook exercises', type: 'text', source: 'Workbook content will be added here.', description: 'Practice exercises for Math.' } }]
      },
      {
        id: 'hindi',
        name: 'Hindi',
        icon: BookCopy,
        lessons: [
          { id: 'hindi-1', name: 'हिंद देश के विवासी', content: { id: 'c5-hindi-1', name: 'हिंद देश के विवासी', type: 'text', source: 'Content not available yet.', description: 'Content for this lesson will be added soon.' } },
          { id: 'hindi-2', name: 'टिपटिपवा', content: { id: 'c5-hindi-2', name: 'टिपटिपवा', type: 'text', source: 'Content not available yet.', description: 'Content for this lesson will be added soon.' } },
          { id: 'hindi-3', name: 'हुआ यूँ कि...', content: { id: 'c5-hindi-3', name: 'हुआ यूँ कि...', type: 'text', source: 'Content not available yet.', description: 'Content for this lesson will be added soon.' } },
          { id: 'hindi-4', name: 'चाँद का कुर्ता', content: { id: 'c5-hindi-4', name: 'चाँद का कुर्ता', type: 'text', source: 'Content not available yet.', description: 'Content for this lesson will be added soon.' } },
          { id: 'hindi-5', name: 'म्यांव का रंग', content: { id: 'c5-hindi-5', name: 'म्यांव का रंग', type: 'text', source: 'Content not available yet.', description: 'Content for this lesson will be added soon.' } },
        ]
      },
       {
        id: 'hindi-workbook',
        name: 'Hindi Workbook',
        icon: PenSquare,
        lessons: [ { id: 'workbook-placeholder', name: 'Workbook exercises', content: { id: 'c5-hindi-wb', name: 'Workbook exercises', type: 'text', source: 'Workbook content will be added here.', description: 'Practice exercises for Hindi.' } }]
      },
      {
        id: 'english',
        name: 'English',
        icon: Languages,
        lessons: [
          { id: 'eng-1', name: 'Nobody\'s Friend', content: { id: 'c5-eng-1', name: 'Nobody\'s Friend', type: 'text', source: 'Content not available yet.', description: 'Content for this lesson will be added soon.' } },
          { id: 'eng-2', name: 'The Smell of Bread and the Sound of Money', content: { id: 'c5-eng-2', name: 'The Smell of Bread and the Sound of Money', type: 'text', source: 'Content not available yet.', description: 'Content for this lesson will be added soon.' } },
          { id: 'eng-3', name: 'The House Sparrow', content: { id: 'c5-eng-3', name: 'The House Sparrow', type: 'text', source: 'Content not available yet.', description: 'Content for this lesson will be added soon.' } },
          { id: 'eng-4', name: 'Day by Day I Float My Paper Boats', content: { id: 'c5-eng-4', name: 'Day by Day I Float My Paper Boats', type: 'text', source: 'Content not available yet.', description: 'Content for this lesson will be added soon.' } },
          { id: 'eng-5', name: 'An Act of Bravery', content: { id: 'c5-eng-5', name: 'An Act of Bravery', type: 'text', source: 'Content not available yet.', description: 'Content for this lesson will be added soon.' } },
        ]
      },
      {
        id: 'english-workbook',
        name: 'English Workbook',
        icon: PenSquare,
        lessons: [ { id: 'workbook-placeholder', name: 'Workbook exercises', content: { id: 'c5-eng-wb', name: 'Workbook exercises', type: 'text', source: 'Workbook content will be added here.', description: 'Practice exercises for English.' } }]
      },
    ]
  },
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
