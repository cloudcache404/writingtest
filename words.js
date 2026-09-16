/**
 * TypePulse Word & Text Data Engine
 * Contains curated word lists, famous quotes, code snippets, and text generation logic.
 */

const WORDS_COMMON = [
  "the", "be", "of", "and", "a", "to", "in", "he", "have", "it", "that", "for", "they", "with",
  "as", "not", "on", "she", "at", "by", "this", "we", "you", "do", "but", "his", "from", "they",
  "say", "her", "she", "or", "an", "will", "my", "one", "all", "would", "there", "their", "what",
  "so", "up", "out", "if", "about", "who", "get", "which", "go", "me", "when", "make", "can",
  "like", "time", "no", "just", "him", "know", "take", "people", "into", "year", "your", "good",
  "some", "could", "them", "see", "other", "than", "then", "now", "look", "only", "come", "its",
  "over", "think", "also", "back", "after", "use", "two", "how", "our", "work", "first", "well",
  "way", "even", "new", "want", "because", "any", "these", "give", "day", "most", "us", "great",
  "between", "need", "large", "under", "might", "never", "place", "world", "house", "light",
  "night", "point", "sound", "water", "water", "call", "first", "right", "study", "still", "learn",
  "world", "high", "every", "near", "add", "food", "between", "own", "below", "country", "plant",
  "last", "school", "father", "keep", "tree", "never", "start", "city", "earth", "eyes", "light",
  "thought", "head", "under", "story", "saw", "left", "don't", "few", "while", "along", "might",
  "close", "something", "seem", "next", "hard", "open", "example", "begin", "life", "always",
  "those", "both", "paper", "together", "got", "group", "often", "run", "important", "until",
  "children", "side", "feet", "car", "mile", "night", "walk", "white", "sea", "began", "grow",
  "took", "river", "four", "carry", "state", "once", "book", "hear", "stop", "without", "second",
  "late", "miss", "idea", "enough", "eat", "face", "watch", "far", "real", "almost", "let", "above",
  "girl", "sometimes", "mountain", "cut", "young", "talk", "soon", "list", "song", "being", "leave",
  "family", "body", "music", "color", "stand", "sun", "questions", "fish", "area", "mark", "dog",
  "horse", "birds", "problem", "complete", "room", "knew", "since", "ever", "piece", "told", "usually",
  "didn't", "friends", "easy", "heard", "order", "red", "door", "sure", "become", "top", "ship",
  "across", "today", "during", "short", "better", "best", "however", "low", "hours", "black", "products",
  "happened", "whole", "measure", "remember", "early", "waves", "listen", "wind", "rock", "space",
  "covered", "fast", "several", "hold", "himself", "toward", "five", "step", "morning", "passed",
  "vowel", "true", "hundred", "against", "pattern", "numeral", "table", "north", "slowly", "money",
  "map", "busy", "pulled", "draw", "voice", "seen", "cold", "cried", "plan", "notice", "south",
  "sing", "war", "ground", "fall", "king", "town", "unit", "figure", "certain", "field", "travel",
  "wood", "fire", "upon", "english", "done", "road", "halt", "ten", "fly", "gave", "box", "finally",
  "wait", "correct", "oh", "quickly", "person", "became", "shown", "minutes", "strong", "verb", "stars",
  "front", "feel", "fact", "inches", "street", "decided", "contain", "course", "surface", "produce",
  "building", "ocean", "class", "note", "nothing", "rest", "carefully", "scientists", "inside", "wheels",
  "stay", "green", "known", "island", "week", "less", "machine", "base", "ago", "stood", "plane", "system",
  "behind", "ran", "round", "boat", "game", "force", "brought", "understand", "warm", "common", "bring",
  "explain", "dry", "though", "language", "shape", "deep", "thousands", "yes", "clear", "equation", "yet",
  "government", "filled", "heat", "full", "hot", "check", "object", "am", "rule", "among", "noun", "power",
  "cannot", "able", "six", "size", "dark", "ball", "material", "special", "heavy", "fine", "pair", "circle",
  "include", "built", "modern", "design", "future", "digital", "quantum", "velocity", "stream", "neon"
];

const WORDS_ADVANCED = [
  "phenomenon", "juxtaposition", "ephemeral", "serendipity", "ubiquitous", "idiosyncratic",
  "quintessential", "paradigm", "clandestine", "magnanimous", "fastidious", "eloquent",
  "perseverance", "anachronistic", "conundrum", "dichotomy", "effervescent", "garrulous",
  "ineffable", "mellifluous", "nebulous", "obfuscate", "panacea", "repertoire", "surreptitious",
  "vicarious", "zephyr", "aesthetic", "labyrinth", "metamorphosis", "soliloquy", "luminescence",
  "incandescent", "perspicacity", "resplendent", "taciturn", "verisimilitude", "vituperative",
  "cacophony", "quintessence", "synchronicity", "algorithm", "cryptographic", "asynchronous",
  "polymorphism", "microservices", "concurrency", "distributed", "deterministic", "optimization"
];

const QUOTES_DATABASE = [
  {
    text: "Simplicity is prerequisite for reliability. Any code you don't write has no bugs.",
    author: "Edsger W. Dijkstra",
    category: "Software"
  },
  {
    text: "The only way to do great work is to love what you do. If you haven't found it yet, keep looking.",
    author: "Steve Jobs",
    category: "Inspiration"
  },
  {
    text: "First, solve the problem. Then, write the code. Premature optimization is the root of all evil.",
    author: "Donald Knuth",
    category: "Software"
  },
  {
    text: "It is not that I'm so smart, but I stay with the questions much longer.",
    author: "Albert Einstein",
    category: "Science"
  },
  {
    text: "In the middle of difficulty lies opportunity. Keep pushing beyond perceived limitations.",
    author: "Albert Einstein",
    category: "Inspiration"
  },
  {
    text: "Talk is cheap. Show me the code. Clean architecture speaks louder than endless meetings.",
    author: "Linus Torvalds",
    category: "Software"
  },
  {
    text: "Do what you can, with what you have, where you are. Precision and flow create excellence.",
    author: "Theodore Roosevelt",
    category: "Wisdom"
  },
  {
    text: "The future belongs to those who believe in the beauty of their dreams and act upon them.",
    author: "Eleanor Roosevelt",
    category: "Inspiration"
  },
  {
    text: "Programs must be written for people to read, and only incidentally for machines to execute.",
    author: "Harold Abelson",
    category: "Software"
  },
  {
    text: "Stay hungry, stay foolish. Never stop learning, never stop experimenting, never stop typing.",
    author: "Whole Earth Catalog",
    category: "Philosophy"
  }
];

const CODE_SNIPPETS = [
  {
    language: "JavaScript",
    text: "const calculateWPM = (chars, timeSec) => Math.round((chars / 5) / (timeSec / 60));"
  },
  {
    language: "JavaScript",
    text: "const debounce = (fn, ms) => { let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); }; };"
  },
  {
    language: "JavaScript",
    text: "const uniqueList = Array.from(new Set(items.filter(x => x.isActive).map(x => x.id)));"
  },
  {
    language: "Python",
    text: "def quicksort(arr): return arr if len(arr) <= 1 else quicksort([x for x in arr[1:] if x < arr[0]]) + [arr[0]] + quicksort([x for x in arr[1:] if x >= arr[0]])"
  },
  {
    language: "Python",
    text: "async def fetch_user_data(session, user_id): async with session.get(f'/api/users/{user_id}') as response: return await response.json()"
  },
  {
    language: "HTML & CSS",
    text: "<div class='glass-panel backdrop-blur flex items-center justify-between p-6 rounded-2xl'></div>"
  },
  {
    language: "TypeScript",
    text: "interface TypingMetrics { wpm: number; rawWpm: number; accuracy: number; consistency: number; errors: number; }"
  },
  {
    language: "SQL",
    text: "SELECT user_id, AVG(wpm) AS average_speed, MAX(wpm) AS top_score FROM typing_sessions GROUP BY user_id ORDER BY top_score DESC;"
  }
];

class TextGenerator {
  static getWords(count = 30, options = { difficulty: 'normal', punctuation: false, numbers: false }) {
    const pool = options.difficulty === 'hard' ? WORDS_ADVANCED : WORDS_COMMON;
    const words = [];
    const punctuationMarks = [".", ",", "!", "?", ";", ":", "-", "--", "\"", "'"];

    for (let i = 0; i < count; i++) {
      let word = pool[Math.floor(Math.random() * pool.length)];

      if (options.numbers && Math.random() < 0.15) {
        word = String(Math.floor(Math.random() * 9000) + 100);
      } else {
        if (options.punctuation) {
          // Capitalize first letter sometimes
          if (i === 0 || Math.random() < 0.2) {
            word = word.charAt(0).toUpperCase() + word.slice(1);
          }
          // Add trailing punctuation sometimes
          if (Math.random() < 0.25) {
            const p = punctuationMarks[Math.floor(Math.random() * 4)]; // standard . , ! ?
            word += p;
          }
          // Quotes or parentheses
          if (Math.random() < 0.06) {
            word = `"${word}"`;
          }
        }
      }

      words.push(word);
    }
    return words;
  }

  static getRandomQuote() {
    return QUOTES_DATABASE[Math.floor(Math.random() * QUOTES_DATABASE.length)];
  }

  static getRandomCodeSnippet() {
    return CODE_SNIPPETS[Math.floor(Math.random() * CODE_SNIPPETS.length)];
  }
}

if (typeof module !== "undefined") {
  module.exports = { WORDS_COMMON, WORDS_ADVANCED, QUOTES_DATABASE, CODE_SNIPPETS, TextGenerator };
}
