import { BudgetCategory, StudentProfile } from './supabase';

export const DEFAULT_BUDGET_CATEGORIES: Omit<BudgetCategory, 'amount'>[] = [
  { id: 'food', name: 'Food & Meals' },
  { id: 'transport', name: 'Transport' },
  { id: 'entertainment', name: 'Entertainment' },
  { id: 'education', name: 'Education / Books' },
];

export function getBudgetCategories(profile: StudentProfile): BudgetCategory[] {
  if (Array.isArray(profile.budget_categories)) {
    return profile.budget_categories.map(item => ({
      id: String(item.id),
      name: String(item.name || item.id),
      amount: Number(item.amount) || 0,
    }));
  }

  return DEFAULT_BUDGET_CATEGORIES.map(item => ({
    ...item,
    amount: Number(profile[`monthly_budget_${item.id}` as keyof StudentProfile]) || 0,
  }));
}

export function legacyBudgetFields(categories: BudgetCategory[]) {
  const byId = Object.fromEntries(categories.map(c => [c.id, c.amount]));
  return {
    monthly_budget_food: byId.food || 0,
    monthly_budget_transport: byId.transport || 0,
    monthly_budget_entertainment: byId.entertainment || 0,
    monthly_budget_education: byId.education || 0,
    monthly_budget_other: byId.other || 0,
  };
}

export function slugifyCategory(name: string, existingIds: string[]): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '') || 'custom';
  if (!existingIds.includes(base)) return base;
  let i = 2;
  while (existingIds.includes(`${base}_${i}`)) i += 1;
  return `${base}_${i}`;
}

const CATEGORY_COLOR = 'bg-glow text-snow border-steel';

export const SPENDING_CATEGORY_STYLES: { id: string; label: string; emoji: string; color: string }[] = [
  { id: 'food',          label: 'Food',          emoji: '🍕', color: CATEGORY_COLOR },
  { id: 'transport',     label: 'Transport',     emoji: '🚌', color: CATEGORY_COLOR },
  { id: 'entertainment', label: 'Entertainment', emoji: '🎮', color: CATEGORY_COLOR },
  { id: 'education',     label: 'Education',     emoji: '📚', color: CATEGORY_COLOR },
  { id: 'shopping',      label: 'Shopping',      emoji: '🛍️', color: CATEGORY_COLOR },
  { id: 'health',        label: 'Health',        emoji: '💊', color: CATEGORY_COLOR },
  { id: 'snacks',        label: 'Snacks',        emoji: '🧋', color: CATEGORY_COLOR },
  { id: 'other',         label: 'Other',         emoji: '📦', color: CATEGORY_COLOR },
];

// Keyword → emoji map. Checked against category id + name (lowercase).
const EMOJI_KEYWORDS: [string[], string][] = [

  // 🍔 FOOD & MEALS
  [[
    'food', 'meal', 'lunch', 'dinner', 'breakfast', 'supper',
    'eat', 'eating', 'restaurant', 'groceri', 'grocery', 'market',
    'supermarket', 'foodstuff', 'snack', 'pizza', 'burger',
    'chicken', 'meat', 'beef', 'pork', 'fish', 'rice', 'bread',
    'fruit', 'vegetable', 'cooking', 'cook', 'kitchen', 'meal prep'
  ], '🍔'],

  // ☕ DRINKS
  [[
    'snack', 'bubble', 'tea', 'coffee', 'drink', 'juice', 'boba',
    'soda', 'water', 'milk', 'smoothie', 'cafe', 'café',
    'energy drink', 'beer', 'wine'
  ], '☕'],

  // 🚌 TRANSPORT
  [[
    'transport', 'bus', 'taxi', 'uber', 'bolt', 'boda', 'boda boda',
    'matatu', 'fuel', 'petrol', 'diesel', 'fare', 'commut',
    'commute', 'ride', 'travel', 'transportation', 'car',
    'vehicle', 'motorcycle', 'bike', 'bicycle', 'parking',
    'parking fee', 'car wash', 'maintenance', 'repair',
    'mechanic', 'driving', 'driving school'
  ], '🚌'],

  // 🎮 ENTERTAINMENT
  [[
    'entertain', 'movie', 'cinema', 'film', 'game', 'gaming',
    'fun', 'party', 'club', 'concert', 'sport', 'netflix',
    'stream', 'streaming', 'youtube', 'tiktok', 'event',
    'festival', 'hangout', 'outing', 'leisure', 'playstation',
    'xbox', 'football match', 'bowling', 'karaoke'
  ], '🎮'],

  // 📚 EDUCATION
  [[
    'educat', 'school', 'book', 'tuition', 'course', 'class',
    'learn', 'studi', 'study', 'exam', 'uni', 'university',
    'college', 'lecture', 'semester', 'school fees', 'fees',
    'student', 'assignment', 'research', 'library', 'textbook',
    'stationery', 'training', 'workshop', 'certification',
    'online course', 'udemy', 'coursera'
  ], '📚'],

  // 🛍️ SHOPPING & CLOTHING
  [[
    'shop', 'shopping', 'cloth', 'clothing', 'fashion', 'outfit',
    'wear', 'shoe', 'shoes', 'sneaker', 'sneakers', 'bag',
    'handbag', 'backpack', 'mall', 'dress', 'shirt', 'trouser',
    'jeans', 'jacket', 'hoodie', 'jewelry', 'accessor',
    'accessories', 'watch', 'ring', 'necklace', 'purchase',
    'buy', 'shopping mall'
  ], '🛍️'],

  // 💊 HEALTH
  [[
    'health', 'medic', 'medicine', 'hospital', 'pharmacy', 'drug',
    'doctor', 'clinic', 'dentist', 'dental', 'treatment',
    'sick', 'illness', 'checkup', 'medical', 'healthcare',
     'wellness', 'therapy',
    'vitamin', 'supplement', 'insurance'
  ], '💊'],

  // 🏠 RENT & HOUSING
  [[
    'rent', 'house', 'home', 'accommodat', 'hostel', 'flat',
    'apartment', 'lodge', 'housing', 'room', 'landlord',
    'bedroom', 'deposit', 'house rent', 'room rent',
    'moving', 'furniture', 'sofa', 'bed', 'mattress'
  ], '🏠'],

  // 💡 UTILITIES & BILLS
  [[
    'electric', 'electricity', 'water', 'utility', 'utilities',
    'bill', 'bills', 'power', 'gas', 'internet', 'wifi',
    'data', 'airtime', 'airtel', 'mtn', 'safaricom',
    'telecom', 'phone bill', 'water bill', 'electricity bill',
    'yaka', 'umeme', 'internet bill', 'subscription'
  ], '💡'],

  // 📱 TECHNOLOGY
  [[
    'phone', 'mobile', 'smartphone', 'device', 'laptop',
    'computer', 'tech', 'technology', 'gadget', 'tablet',
    'ipad', 'iphone', 'android', 'charger', 'headphone',
    'earphone', 'keyboard', 'mouse', 'monitor', 'software',
    'app', 'subscription', 'icloud', 'google', 'storage'
  ], '📱'],

  // 🎁 GIFTS & DONATIONS
  [[
    'gift', 'present', 'donat', 'donation', 'charity', 'tithe',
    'church', 'mosque', 'offering', 'giving', 'contribution',
    'fundraiser', 'fundraising', 'birthday gift', 'wedding gift',
    'support', 'help someone'
  ], '🎁'],

  // ✈️ TRAVEL
  [[
    'travel', 'trip', 'vacation', 'holiday', 'flight', 'airport',
    'hotel', 'tour', 'tourism', 'booking', 'airbnb', 'visa',
    'passport', 'adventure', 'journey', 'bus ticket',
    'flight ticket', 'accommodation'
  ], '✈️'],

  // 💰 SAVINGS & MONEY
  [[
    'saving', 'savings', 'save', 'invest', 'investment', 'goal',
    'piggy', 'wallet', 'budget', 'money', 'cash', 'wealth',
    'emergency fund', 'emergency', 'financial', 'finance',
    'profit', 'income', 'allowance', 'salary', 'wage',
    'paycheck', 'earnings', 'side income', 'side hustle',
    'business', 'capital'
  ], '💰'],

  // 💄 PERSONAL CARE & BEAUTY
  [[
    'personal', 'care', 'beauty', 'hair', 'salon', 'barber',
    'barbershop', 'barber shop', 'cosmetic', 'cosmetics',
    'makeup', 'hygiene', 'skincare', 'skin care', 'perfume',
    'fragrance', 'shampoo', 'soap', 'toothpaste', 'toothbrush',
    'lotion', 'cream', 'nails', 'manicure', 'pedicure',
    'braids', 'haircut', 'dreadlocks'
  ], '💄'],

  // 👨‍👩‍👧 FAMILY
  [[
    'family', 'parent', 'parents', 'mother', 'mom', 'mum',
    'father', 'dad', 'sibling', 'brother', 'sister', 'kid',
    'kids', 'child', 'children', 'baby', 'relative', 'uncle',
    'aunt', 'cousin', 'grandma', 'grandmother', 'grandpa',
    'grandfather', 'family support', 'home support'
  ], '👨‍👩‍👧'],

  // 🐾 PETS & ANIMALS
  [[
    'pet', 'dog', 'cat', 'animal', 'vet', 'veterinary',
    'puppy', 'kitten', 'pet food', 'pet care', 'bird',
    'fish tank', 'animal care'
  ], '🐾'],

  // 🏋️ SPORTS & FITNESS
  [[
    'sport', 'sports', 'football', 'soccer', 'basketball',
    'volleyball', 'tennis', 'workout', 'exercise', 'gym',
    'fitness', 'swim', 'swimming', 'run', 'running', 'yoga',
    'training', 'athletics', 'cycling', 'boxing', 'match',
    'tournament'
  ], '🏋️'],

  // 🎵 MUSIC
  [[
    'music', 'spotify', 'concert', 'instrument', 'audio',
    'song', 'sing', 'singer', 'band', 'artist', 'album',
    'music subscription', 'apple music', 'soundcloud',
    'dj', 'guitar', 'piano', 'drums'
  ], '🎵'],

  // ✏️ STATIONERY & OFFICE
  [[
    'stationary', 'stationery', 'pen', 'pencil', 'paper',
    'notebook', 'print', 'printing', 'photocopy', 'printer',
    'ink', 'office', 'office supplies', 'file', 'folder',
    'calculator', 'school supplies'
  ], '✏️'],

  // 💼 WORK & BUSINESS
  [[
    'work', 'job', 'business', 'office', 'salary', 'wage',
    'employment', 'freelance', 'freelancing', 'client',
    'project', 'meeting', 'work equipment', 'business expense',
    'startup', 'company', 'worker', 'professional'
  ], '💼'],

  // 💳 BANKING & PAYMENTS
  [[
    'bank', 'banking', 'account', 'deposit', 'withdraw',
    'withdrawal', 'transfer', 'payment', 'pay', 'paid',
    'mpesa', 'mobile money', 'momo', 'mobilemoney',
    'cashout', 'cash out', 'transaction', 'atm', 'card',
    'debit card', 'credit card', 'loan', 'debt', 'borrow',
    'repay', 'repayment'
  ], '💳'],

  // 🏦 LOANS & DEBT
  [[
    'loan', 'loans', 'debt', 'borrow', 'borrowed', 'lender',
    'lending', 'repay', 'repayment', 'installment', 'interest',
    'credit', 'owe', 'owed', 'microloan', 'school loan'
  ], '🏦'],

  // 🛒 HOUSEHOLD
  [[
    'household', 'home supplies', 'cleaning', 'detergent',
    'washing', 'laundry', 'bucket', 'broom', 'tissue',
    'toilet paper', 'kitchen supplies', 'utensils', 'plate',
    'cup', 'spoon', 'furniture', 'decoration', 'decor'
  ], '🛒'],

  // 💇 HAIR & GROOMING
  [[
    'grooming', 'haircut', 'barber', 'barbershop', 'hair',
    'braid', 'braids', 'dread', 'dreadlocks', 'fade',
    'shave', 'beard', 'beard trim', 'shaving', 'barbering'
  ], '💇'],

  // 👶 CHILDREN
  [[
    'baby', 'babies', 'child', 'children', 'kid', 'kids',
    'diaper', 'nappies', 'baby food', 'formula', 'toys',
    'school child', 'daycare', 'nursery'
  ], '👶'],

  // 💍 WEDDING & EVENTS
  [[
    'wedding', 'marriage', 'engagement', 'bride', 'groom',
    'ceremony', 'event', 'birthday', 'anniversary',
    'celebration', 'party', 'decoration', 'venue', 'catering'
  ], '💍'],

  // 🛠️ REPAIRS & MAINTENANCE
  [[
    'repair', 'repairs', 'fix', 'maintenance', 'mechanic',
    'plumber', 'plumbing', 'electrician', 'technician',
    'phone repair', 'laptop repair', 'car repair',
    'bike repair', 'appliance', 'replacement', 'spare part'
  ], '🛠️'],

  // 📦 DELIVERY & SHIPPING
  [[
    'delivery', 'deliver', 'shipping', 'package', 'parcel',
    'courier', 'send', 'sending', 'pickup', 'dispatch',
    'postage', 'shipping fee'
  ], '📦'],

  // 🧾 TAXES & GOVERNMENT
  [[
    'tax', 'taxes', 'ura', 'government', 'license', 'licence',
    'permit', 'registration', 'passport', 'visa', 'fine',
    'fee', 'official fee'
  ], '🧾'],

  // 🔐 SECURITY
  [[
    'security', 'guard', 'security guard', 'alarm', 'lock',
    'padlock', 'cctv', 'protection', 'safety'
  ], '🔐'],

  // ❤️ RELATIONSHIPS
  [[
    'date', 'dating', 'girlfriend', 'boyfriend', 'partner',
    'relationship', 'romantic', 'valentine', 'love',
    'anniversary', 'couple'
  ], '❤️'],

  // 🌱 FARMING & AGRICULTURE
  [[
    'farm', 'farming', 'agriculture', 'agricultural', 'garden',
    'gardening', 'seed', 'seeds', 'fertilizer', 'fertiliser',
    'livestock', 'chicken', 'goat', 'cow', 'pig', 'crop',
    'harvest', 'farmer'
  ], '🌱'],

  // 📖 RELIGION & SPIRITUALITY
  [[
    'church', 'mosque', 'religion', 'prayer', 'pray',
    'tithe', 'offering', 'donation', 'bible', 'quran',
    'worship', 'spiritual', 'christian', 'muslim'
  ], '🙏'],

  // 🎓 CAREER & DEVELOPMENT
  [[
    'career', 'internship', 'intern', 'cv', 'resume',
    'interview', 'job application', 'certificate',
    'certification', 'professional development', 'conference',
    'networking', 'mentorship', 'mentor'
  ], '🎓'],

  // 🧳 MOVING / RELOCATION
  [[
    'moving', 'relocation', 'relocate', 'new house',
    'new home', 'moving house', 'moving costs', 'mover',
    'moving truck'
  ], '🧳'],

  // 🌐 ONLINE SERVICES
  [[
    'online', 'website', 'domain', 'hosting', 'cloud',
    'subscription', 'software subscription', 'saas',
    'digital', 'internet service', 'membership'
  ], '🌐'],

  // 🎮 GAMING
  [[
    'game', 'gaming', 'playstation', 'xbox', 'steam',
    'nintendo', 'fortnite', 'pubg', 'free fire', 'cod',
    'call of duty', 'fifa', 'ea fc', 'roblox', 'minecraft',
    'game pass', 'gaming pc'
  ], '🎮'],

  // 📸 CONTENT & CREATOR
  [[
    'camera', 'photography', 'photo', 'video', 'filming',
    'content', 'creator', 'youtube', 'tiktok', 'instagram',
    'editing', 'video editing', 'photoshoot', 'studio',
    'microphone', 'lighting'
  ], '📸'],

  // 💸 GENERAL EXPENSE
  [[
    'expense', 'expenses', 'spending', 'spent', 'cost',
    'purchase', 'payment', 'misc', 'miscellaneous', 'other'
  ], '💸'],

  // 🎯 GOALS
  [[
    'goal', 'target', 'milestone', 'dream', 'plan',
    'saving goal', 'financial goal', 'target amount'
  ], '🎯'],

  // 🚨 EMERGENCY
  [[
    'emergency', 'urgent', 'accident', 'unexpected',
    'emergency expense', 'emergency fund', 'crisis'
  ], '🚨'],

  // 💰 INCOME
  [[
    'income', 'salary', 'allowance', 'wage', 'earnings',
    'pay', 'paycheck', 'bonus', 'commission', 'profit',
    'side hustle', 'freelance income', 'business income',
    'pocket money', 'stipend', 'scholarship'
  ], '💵'],

  // 🏆 ACHIEVEMENT
  [[
    'achievement', 'reward', 'bonus', 'success', 'win',
    'prize', 'award', 'milestone', 'accomplishment'
  ], '🏆'],

];
export function emojiForCategory(id: string, name: string): string {
  const haystack = `${id} ${name}`.toLowerCase();
  for (const [keywords, emoji] of EMOJI_KEYWORDS) {
    if (keywords.some(k => haystack.includes(k))) return emoji;
  }
  return '📦'; // fallback
}

export function getSpendingCategories(profile: StudentProfile) {
  const known = new Set(SPENDING_CATEGORY_STYLES.map(c => c.id));
  const extras = getBudgetCategories(profile)
    .filter(b => !known.has(b.id))
    .map(b => ({
      id: b.id,
      label: b.name,
      emoji: emojiForCategory(b.id, b.name),
      color: CATEGORY_COLOR,
    }));
  return [...SPENDING_CATEGORY_STYLES, ...extras];
}
