export interface AvatarConfig {
  color: string; // hex code or color key
  eyes: number; // 0 to 5 (different eye styles)
  mouth: number; // 0 to 4 (different mouth styles)
  accessory: number; // 0 to 4 (none, crown, party hat, gamer headset, headband)
}

export type PlayerStatus = 'idle' | 'typing' | 'submitted' | 'eliminated';

export interface Player {
  id: string;
  socketId: string;
  nickname: string;
  avatar: AvatarConfig;
  score: number;
  streak: number;
  lives: number;
  status: PlayerStatus;
  lastSubmitTimeMs?: number;
  isHost: boolean;
  isReady: boolean;
  isBot?: boolean;
  progressPercent?: number;
  wpm?: number;
  accuracy?: number;
  finishRank?: number;
}

export type GameMode = 'keydash-race' | 'bomb-pass' | 'word-blitz' | 'type-or-die';
export type WordDifficulty = 'easy' | 'medium' | 'hard' | 'mixed' | 'gaming' | 'code';

export interface RoomSettings {
  roomCode: string;
  password?: string;
  mode: GameMode;
  difficulty: WordDifficulty;
  timerSec: number; // 3, 5, 8, 10, 15
  rounds: number; // e.g. 10, 15, 20
  maxPlayers: number; // 2 to 12
  isPublic: boolean;
  withBots?: boolean;
}

export type RoomStatus = 'lobby' | 'countdown' | 'in-game' | 'round-end' | 'game-over';

export interface RoundResult {
  round: number;
  word: string;
  submissions: {
    playerId: string;
    nickname: string;
    timeSec: number;
    pointsEarned: number;
    isCorrect: boolean;
  }[];
  eliminatedPlayerIds: string[];
  explodedPlayerId?: string;
  explodedPlayerName?: string;
}

export interface RoomState {
  code: string;
  settings: RoomSettings;
  hostId: string;
  players: Record<string, Player>;
  status: RoomStatus;
  currentRound: number;
  currentWord: string;
  roundStartTime: number;
  roundEndTime: number;
  currentTurnPlayerId?: string; // For turn-based Bomb Pass
  lastRoundResult?: RoundResult;
  history: RoundResult[];
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: AvatarConfig;
  text: string;
  timestamp: number;
  isSystem?: boolean;
  isCorrectNotification?: boolean;
}

export interface PublicRoomSummary {
  code: string;
  hostName: string;
  playerCount: number;
  maxPlayers: number;
  mode: GameMode;
  difficulty: WordDifficulty;
  timerSec: number;
  hasPassword: boolean;
}

export interface PracticeLesson {
  id: string;
  title: string;
  category: 'home-row' | 'top-row' | 'bottom-row' | 'shifts' | 'numbers' | 'symbols' | 'code' | 'paragraphs';
  difficulty: 'easy' | 'medium' | 'hard';
  description: string;
  focusKeys: string[];
  content: string;
}

// Client-to-Server Socket Events
export interface ClientToServerEvents {
  'room:create': (payload: { settings: Omit<RoomSettings, 'roomCode'> & { withBots?: boolean }; player: { nickname: string; avatar: AvatarConfig } }, callback: (res: { success: boolean; roomCode?: string; error?: string }) => void) => void;
  'room:join': (payload: { roomCode: string; password?: string; player: { nickname: string; avatar: AvatarConfig } }, callback: (res: { success: boolean; error?: string }) => void) => void;
  'room:leave': () => void;
  'room:add_bot': () => void;
  'room:remove_bot': () => void;
  'room:toggle_bots': () => void;
  'room:list': (callback: (rooms: PublicRoomSummary[]) => void) => void;
  'room:ready': () => void;
  'room:start': () => void;
  'room:return_to_lobby': () => void;
  'game:typing_status': (isTyping: boolean) => void;
  'game:race_progress': (data: { progressPercent: number; wpm: number; accuracy: number }) => void;
  'game:submit_word': (submission: string, callback: (res: { correct: boolean; scoreDelta: number; message?: string }) => void) => void;
  'chat:send': (text: string) => void;
}

// Server-to-Client Socket Events
export interface ServerToClientEvents {
  'room:state': (state: RoomState) => void;
  'room:player_joined': (player: Player) => void;
  'room:player_left': (playerId: string) => void;
  'game:countdown': (count: number) => void;
  'game:round_start': (data: { round: number; word: string; timerSec: number; currentTurnPlayerId?: string }) => void;
  'game:round_end': (result: RoundResult) => void;
  'game:game_over': (finalStandings: Player[]) => void;
  'game:word_solved': (data: { playerId: string; nickname: string; points: number; timeSec: number }) => void;
  'chat:message': (message: ChatMessage) => void;
  'error': (message: string) => void;
}
