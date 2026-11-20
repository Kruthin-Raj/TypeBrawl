import { PracticeLesson } from './types.js';

export const PRACTICE_LESSONS: PracticeLesson[] = [
  {
    id: 'lesson-home-1',
    title: '1. Home Row: Fundamentals',
    category: 'home-row',
    difficulty: 'easy',
    description: 'Master the anchor keys: A S D F and J K L ; using index, middle, ring, and pinky fingers.',
    focusKeys: ['a', 's', 'd', 'f', 'j', 'k', 'l', ';', ' '],
    content: 'asdf jkl; asdf jkl; fads glad flask fall salad flash salsa ask dad fall add alas glass'
  },
  {
    id: 'lesson-home-2',
    title: '2. Home Row: Expanding with G and H',
    category: 'home-row',
    difficulty: 'easy',
    description: 'Reach your index fingers to G and H while keeping other fingers rested on home row.',
    focusKeys: ['g', 'h', 'f', 'j'],
    content: 'fgjh gfjh flag half flash dash glad gas hall shad slash slag hash dash gala gash flag'
  },
  {
    id: 'lesson-top-1',
    title: '3. Top Row: E and I (Index/Middle)',
    category: 'top-row',
    difficulty: 'easy',
    description: 'Extend middle fingers upward to press E and I without lifting your wrists.',
    focusKeys: ['e', 'i', 'd', 'k'],
    content: 'ded kik die feed slide lake like fish file fake side seek life lake desk lead silk field'
  },
  {
    id: 'lesson-top-2',
    title: '4. Top Row: R, U, T, Y (Index Reach)',
    category: 'top-row',
    difficulty: 'medium',
    description: 'Practice upper reaches with your left and right index fingers.',
    focusKeys: ['r', 'u', 't', 'y', 'f', 'j'],
    content: 'frju ftjy true rust yard turn fury duty fruit try year turf jury rust treat tyre trail'
  },
  {
    id: 'lesson-top-3',
    title: '5. Top Row: Q, W, O, P (Ring & Pinky)',
    category: 'top-row',
    difficulty: 'medium',
    description: 'Complete the top row with ring and pinky fingers.',
    focusKeys: ['q', 'w', 'o', 'p'],
    content: 'paw power flow plot slow drop wrap loop peep quit word poke pool prep wolf quota'
  },
  {
    id: 'lesson-bottom-1',
    title: '6. Bottom Row: C, V, M, N (Index & Middle)',
    category: 'bottom-row',
    difficulty: 'medium',
    description: 'Move downward from home row with precision.',
    focusKeys: ['c', 'v', 'm', 'n'],
    content: 'dcvf jnmk van man calm move nave cave camp coin main view name voice memo clan vine'
  },
  {
    id: 'lesson-bottom-2',
    title: '7. Bottom Row: Z, X, B, Commas & Dots',
    category: 'bottom-row',
    difficulty: 'medium',
    description: 'Pinky drops for Z, ring for X, and punctuation keys.',
    focusKeys: ['z', 'x', 'b', ',', '.'],
    content: 'zap box blaze mix next zeal taxi buzz, extra fix. back crab box, zinc maze next.'
  },
  {
    id: 'lesson-shift-1',
    title: '8. Capitalization & Shift Mastery',
    category: 'shifts',
    difficulty: 'medium',
    description: 'Use the opposite Shift key when capitalizing letters.',
    focusKeys: ['Shift', 'A-Z'],
    content: 'Paris London Tokyo Berlin New York Rome Madrid Sydney Toronto Cairo Chicago Seoul'
  },
  {
    id: 'lesson-numbers-1',
    title: '9. Number Row & Common Digits',
    category: 'numbers',
    difficulty: 'hard',
    description: 'Learn reach angles for numbers 1 2 3 4 5 6 7 8 9 0 without looking.',
    focusKeys: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    content: '102 405 892 1984 2026 365 720 1080 4096 999 505 1234 5678 9012 31415 2718'
  },
  {
    id: 'lesson-code-1',
    title: '10. Coding Syntax & Brackets',
    category: 'code',
    difficulty: 'hard',
    description: 'Essential syntax for developers: parentheses, curly braces, colons, arrows, and operators.',
    focusKeys: ['{', '}', '[', ']', '(', ')', ';', ':', '=', '>', '<', '"'],
    content: 'const add = (a: number, b: number): number => { return a + b; }; if (x <= 10) [items.map(i => i * 2)];'
  }
];
