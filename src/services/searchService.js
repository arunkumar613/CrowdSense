// src/services/searchService.js

// Levenshtein distance between two strings
export function getLevenshteinDistance(a, b) {
  const al = a.length;
  const bl = b.length;
  if (al === 0) return bl;
  if (bl === 0) return al;

  const matrix = [];

  for (let i = 0; i <= al; i++) {
    matrix[i] = [i];
  }

  for (let j = 1; j <= bl; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= al; i++) {
    for (let j = 1; j <= bl; j++) {
      const cost = a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[al][bl];
}

// Category aliases for spellcheck correction
const CATEGORY_MAP = {
  'Hospital': ['hospital', 'hospitals', 'clinic', 'medical', 'doctors', 'hospitl', 'hopsital', 'medkit', 'healthcare'],
  'Mall': ['mall', 'malls', 'shopping', 'plaza', 'galleria', 'malll', 'shoping'],
  'Grocery': ['grocery', 'supermarket', 'mart', 'groceries', 'shop', 'market', 'fresh'],
  'Gov': ['government', 'gov', 'office', 'post office', 'police', 'rto', 'zonal', 'municipal', 'dmv'],
  'Park': ['park', 'parks', 'garden', 'gardens', 'playground', 'leisure'],
  'Temple': ['temple', 'temples', 'worship', 'church', 'mosque', 'shrine', 'cathedral', 'sanctuary'],
  'Library': ['library', 'libraries', 'books', 'reading', 'book'],
  'Bank': ['bank', 'banks', 'atm', 'sbi', 'hdfc', 'finance', 'savings', 'cooperative'],
  'Restaurant': ['restaurant', 'restaurants', 'food', 'dine', 'bistro', 'cafe', 'canteen', 'restarant', 'eats', 'bakery'],
  'Transport': ['transport', 'transit', 'bus', 'metro', 'train', 'station', 'stop', 'railway', 'junction', 'terminal']
};

const COMMON_SPELL_CORRECTIONS = {
  'hospitl': 'Hospital',
  'hopsital': 'Hospital',
  'malll': 'Mall',
  'restarant': 'Restaurant',
  'school': 'School',
  'londn': 'London',
  'banglore': 'Bangalore',
  'pondichery': 'Pondicherry',
  'choolaimed': 'Choolaimedu',
  'velacheryy': 'Velachery'
};

// Check if query matches any category alias
function getCategoryMatch(queryWord) {
  const word = queryWord.toLowerCase().trim();
  for (const [category, aliases] of Object.entries(CATEGORY_MAP)) {
    if (aliases.includes(word)) return category;
    // Check fuzzy match on category name
    const dist = getLevenshteinDistance(word, category.toLowerCase());
    if (dist <= 1) return category;
  }
  return null;
}

export function performSmartSearch(locations, query) {
  const cleanQuery = (query || '').trim().toLowerCase();
  
  if (!cleanQuery) {
    return {
      results: locations,
      exactMatchesCount: locations.length,
      didYouMean: null,
      isFallback: false,
      infoMessage: null
    };
  }

  // 1. Detect Spelling Corrections / Did You Mean
  const queryWords = cleanQuery.split(/\s+/);
  let didYouMean = null;
  const correctedWords = queryWords.map(word => {
    // Check direct dictionary corrections
    if (COMMON_SPELL_CORRECTIONS[word]) {
      didYouMean = COMMON_SPELL_CORRECTIONS[word];
      return COMMON_SPELL_CORRECTIONS[word].toLowerCase();
    }
    // Check categories Levenshtein distance
    for (const [category, aliases] of Object.entries(CATEGORY_MAP)) {
      for (const alias of aliases) {
        if (word !== alias && getLevenshteinDistance(word, alias) === 1 && word.length >= 4) {
          didYouMean = category;
          return alias;
        }
      }
    }
    return word;
  });

  const processedQuery = correctedWords.join(' ');

  // 2. Score locations based on query
  const scoredLocations = locations.map(loc => {
    let score = 0;
    const nameLower = loc.name.toLowerCase();
    const typeLower = loc.type.toLowerCase();
    const distanceVal = loc.distanceValue || 0;
    const crowdPercent = Math.min(100, Math.round((loc.currentUsers / loc.maxCapacity) * 100));
    const waitTime = loc.waitTime || 0;

    // Exact matches
    if (nameLower === cleanQuery || nameLower === processedQuery) {
      score += 2000;
    }
    if (typeLower === cleanQuery || typeLower === processedQuery) {
      score += 1500;
    }

    // Substring match on Name
    if (nameLower.includes(cleanQuery) || nameLower.includes(processedQuery)) {
      score += 1000;
    }

    // Substring match on Category
    if (typeLower.includes(cleanQuery) || typeLower.includes(processedQuery)) {
      score += 800;
    }

    // Check individual query word matching
    queryWords.forEach(qWord => {
      if (qWord.length < 2) return;

      // Match on name words
      if (nameLower.includes(qWord)) {
        score += 300;
      }
      
      // Match on Category aliases
      const matchedCat = getCategoryMatch(qWord);
      if (matchedCat && loc.type === matchedCat) {
        score += 500;
      }

      // Check Levenshtein similarity on place name words
      const nameWords = nameLower.split(/\s+/);
      nameWords.forEach(nWord => {
        if (nWord.length >= 3 && qWord.length >= 3) {
          const dist = getLevenshteinDistance(qWord, nWord);
          if (dist === 1) score += 250; // Close spelling match
          if (dist === 2 && nWord.length >= 6) score += 100;
        }
      });
    });

    // Special category keywords detection (Metro/Bus -> Transport, etc.)
    if (score > 0) {
      // Sort priority parameters (Distance, Crowd Level, Wait Time)
      // Closeness priority: deduct score for distance (closer is better)
      score -= distanceVal * 15;
      
      // Crowd level priority: deduct score for higher crowd (lower crowd is better)
      score -= (crowdPercent / 100) * 50;

      // Wait time priority: deduct score for wait time (shorter wait is better)
      score -= waitTime * 0.5;
    }

    return { loc, score };
  });

  // Filter out non-matching results (score must be > 0)
  let matchingResults = scoredLocations
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(item => item.loc);

  // 3. Fallback Suggestions if zero results found
  if (matchingResults.length === 0) {
    // Determine category search intent from the query
    let targetCategory = null;
    for (const qWord of queryWords) {
      targetCategory = getCategoryMatch(qWord);
      if (targetCategory) break;
    }

    let fallbackPlaces = [];
    let infoMessage = null;

    if (targetCategory) {
      // User searched for a category (or misspelled category). Show places of that category.
      fallbackPlaces = locations.filter(loc => loc.type === targetCategory);
      infoMessage = `No exact match found for "${query}". Here are nearby ${targetCategory.toLowerCase()}s.`;
    } else {
      // User searched for a specific place name that doesn't exist.
      // Recommend top 5 least crowded, closest places overall
      fallbackPlaces = [...locations]
        .sort((a, b) => {
          const pctA = a.currentUsers / a.maxCapacity;
          const pctB = b.currentUsers / b.maxCapacity;
          // Sort by lowest crowd and closest distance
          return (pctA + (a.distanceValue * 0.1)) - (pctB + (b.distanceValue * 0.1));
        })
        .slice(0, 6);
      
      infoMessage = `No exact match found. Here are similar nearby places you may be looking for.`;
    }

    return {
      results: fallbackPlaces,
      exactMatchesCount: 0,
      didYouMean,
      isFallback: true,
      infoMessage
    };
  }

  return {
    results: matchingResults,
    exactMatchesCount: matchingResults.length,
    didYouMean,
    isFallback: false,
    infoMessage: null
  };
}
