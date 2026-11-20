export const EASY_WORDS: string[] = [
  'cat', 'dog', 'run', 'sun', 'hat', 'cup', 'red', 'blue', 'sky', 'tree',
  'fast', 'slow', 'jump', 'play', 'game', 'ball', 'book', 'lamp', 'fish', 'bird',
  'star', 'moon', 'milk', 'cake', 'park', 'shoe', 'door', 'home', 'boat', 'rain',
  'snow', 'fire', 'wind', 'gold', 'bear', 'duck', 'frog', 'lion', 'sand', 'rock',
  'bell', 'ring', 'king', 'song', 'road', 'hill', 'city', 'ship', 'wave', 'leaf'
];

export const MEDIUM_WORDS: string[] = [
  'planet', 'silver', 'castle', 'dragon', 'rocket', 'puzzle', 'wizard', 'bridge',
  'forest', 'monkey', 'guitar', 'island', 'jungle', 'knight', 'orange', 'pirate',
  'quartz', 'shadow', 'turtle', 'violet', 'winter', 'yellow', 'beacon', 'breeze',
  'camera', 'dancer', 'engine', 'falcon', 'galaxy', 'harbor', 'impact', 'meteor',
  'nature', 'palace', 'rabbit', 'safari', 'tunnel', 'unique', 'valley', 'wonder'
];

export const HARD_WORDS: string[] = [
  'adventure', 'beautiful', 'constellation', 'discovery', 'earthquake', 'fantastic',
  'generation', 'helicopter', 'illuminated', 'kaleidoscope', 'laboratory', 'magnificent',
  'navigation', 'observatory', 'phenomenon', 'quadrilateral', 'resilience', 'strawberry',
  'thunderstorm', 'unbelievable', 'vulnerability', 'waterfall', 'xylophone', 'championship',
  'extraordinary', 'masterpiece', 'celebration', 'synchronize', 'achievement', 'breakthrough'
];

export const GAMING_WORDS: string[] = [
  'gameplay', 'respawn', 'hitbox', 'speedrun', 'checkpoint', 'inventory',
  'bossfight', 'stealth', 'parry', 'headshot', 'clutch', 'powerup', 'portal',
  'crafting', 'parkour', 'cooldown', 'stamina', 'scoreboard', 'victory', 'arcade',
  'joystick', 'combo', 'level', 'mana', 'dungeon', 'quest', 'loot', 'avatar'
];

export const CODE_WORDS: string[] = [
  'function', 'variable', 'console', 'promise', 'component', 'constant', 'interface',
  'boolean', 'callback', 'iteration', 'terminal', 'compiler', 'database', 'endpoint',
  'asynchronous', 'algorithm', 'prototype', 'recursion', 'middleware', 'typescript'
];

export const FAMOUS_QUOTES = [
  {
    author: "Alan Turing",
    quote: "Sometimes it is the people no one imagines anything of who do the things that no one can imagine."
  },
  {
    author: "Grace Hopper",
    quote: "The most dangerous phrase in the language is: We have always done it this way."
  },
  {
    author: "Steve Jobs",
    quote: "The only way to do great work is to love what you do. Stay hungry, stay foolish."
  },
  {
    author: "Linus Torvalds",
    quote: "Talk is cheap. Show me the code. Most good programmers do programming because it is fun."
  },
  {
    author: "Ada Lovelace",
    quote: "The Analytical Engine weaves algebraic patterns just as the Jacquard loom weaves flowers and leaves."
  },
  {
    author: "Carl Sagan",
    quote: "Somewhere, something incredible is waiting to be known. We are a way for the cosmos to know itself."
  },
  {
    author: "Arthur C. Clarke",
    quote: "Any sufficiently advanced technology is indistinguishable from magic."
  }
];

export const CODE_SNIPPETS = {
  javascript: [
    "const fibonacci = (n) => n <= 1 ? n : fibonacci(n - 1) + fibonacci(n - 2);",
    "const filtered = items.filter(item => item.active).map(item => item.value);",
    "async function fetchData(url) { const res = await fetch(url); return await res.json(); }",
    "export default function Counter() { const [count, setCount] = useState(0); return <button onClick={() => setCount(c => c + 1)}>{count}</button>; }"
  ],
  python: [
    "def binary_search(arr, target): left, right = 0, len(arr) - 1",
    "primes = [x for x in range(2, 50) if all(x % y != 0 for y in range(2, x))]",
    "with open('dataset.csv', 'r') as file: lines = [line.strip().split(',') for line in file]",
    "class Player: def __init__(self, name, score=0): self.name = name; self.score = score"
  ],
  html_css: [
    "<div class=\"flex items-center justify-between p-4 bg-slate-900 border-2 rounded-xl\">",
    "@keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }",
    "<button type=\"submit\" aria-label=\"Submit Score\" class=\"btn btn-primary shadow-retro\">Start</button>"
  ],
  sql: [
    "SELECT users.id, users.username, COUNT(matches.id) AS total_wins FROM users JOIN matches ON users.id = matches.winner_id GROUP BY users.id ORDER BY total_wins DESC LIMIT 10;",
    "CREATE TABLE leaderboards (id SERIAL PRIMARY KEY, user_id INT NOT NULL, wpm INT CHECK (wpm >= 0), accuracy DECIMAL(5,2));"
  ]
};

export const NUMBER_SYMBOL_DRILLS = [
  "102 405 892 1984 2026 365 720 1080 4096 999 505 1234 5678 9012 31415 2718",
  "name.length > 0 && score <= 100 ? [items[0], items[1]] : { error: true, code: 404 };",
  "key: 'wpm'; value: 120.5; regex: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}$/i;",
  "[(12 + 8) * 4] / 2 == 40 && (x != null || y == undefined) && !isFlagged;"
];

export const PRACTICE_PARAGRAPHS = {
  easy: [
    "The quick brown fox jumps over the lazy dog. Birds sing in the high green tree while the bright sun shines down on the quiet meadow.",
    "A gentle breeze blows across the blue water. Small fish swim near the sandy shore, and children build tall sand castles all afternoon.",
    "Every morning starts with a fresh cup of tea and a clean desk. Typing every single day makes your fingers faster and your mind sharper."
  ],
  medium: [
    "Learning to touch type is like playing a musical instrument. At first, you have to think about every finger movement, but practice turns hesitation into pure muscle memory.",
    "The best video games balance intense challenge with rewarding gameplay. When players work together in multiplayer rooms, every millisecond counts toward a glorious victory.",
    "Modern web browsers execute complex JavaScript and render fluid animations at sixty frames per second, transforming simple web pages into interactive virtual worlds."
  ],
  hard: [
    "Sophisticated distributed architectures rely on server-authoritative state synchronization to prevent latency desynchronization and client-side manipulation across real-time multiplayer networks.",
    "Algorithmic optimization frequently requires evaluating computational time complexity alongside memory footprints, balancing elegant abstractions against raw hardware throughput.",
    "Quantum cryptography leverages the fundamental Heisenberg uncertainty principle to establish mathematically unbreakable key distributions over photonic fiber-optic channels."
  ]
};
