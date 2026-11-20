import {
  WordDifficulty,
  EASY_WORDS,
  MEDIUM_WORDS,
  HARD_WORDS,
  GAMING_WORDS,
  CODE_WORDS
} from '@typefest/shared';

export class WordSelector {
  public static getRandomWord(difficulty: WordDifficulty, usedWords: Set<string>): string {
    let pool: string[] = [];

    switch (difficulty) {
      case 'easy':
        pool = EASY_WORDS;
        break;
      case 'medium':
        pool = MEDIUM_WORDS;
        break;
      case 'hard':
        pool = HARD_WORDS;
        break;
      case 'gaming':
        pool = GAMING_WORDS;
        break;
      case 'code':
        pool = CODE_WORDS;
        break;
      case 'mixed':
      default:
        pool = [...EASY_WORDS, ...MEDIUM_WORDS, ...HARD_WORDS];
        break;
    }

    // Filter out recently used words if possible
    const available = pool.filter((w) => !usedWords.has(w));
    const targetPool = available.length > 0 ? available : pool;

    const randomIndex = Math.floor(Math.random() * targetPool.length);
    const chosen = targetPool[randomIndex];
    usedWords.add(chosen);
    return chosen;
  }
}
