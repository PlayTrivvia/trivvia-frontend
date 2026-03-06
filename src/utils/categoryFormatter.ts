export function formatCategory(category: string): string {
  if (!category) return '';

  // Already formatted as "Category > Subcategory" from our DB — return as-is
  if (category.includes(' > ')) return category;

  // Common category mappings for better readability
  const categoryMap: Record<string, string> = {
    'arts_and_literature': 'Arts & Literature',
    'entertainment': 'Entertainment',
    'geography': 'Geography',
    'history': 'History',
    'science': 'Science & Nature',
    'science & nature': 'Science & Nature',
    'mathematics': 'Mathematics',
    'pop culture': 'Pop Culture',
    'literature': 'Literature',
    'sports': 'Sports',
    'sport_and_leisure': 'Sport & Leisure',
    'television': 'Television',
    'video_games': 'Video Games',
    'mythology': 'Mythology',
    'politics': 'Politics',
    'animals': 'Animals',
    'vehicles': 'Vehicles',
    'celebrities': 'Celebrities',
    'general_knowledge': 'General Knowledge',
    'computers': 'Computers',
    'gadgets': 'Gadgets',
    'anime_and_manga': 'Anime & Manga',
    'cartoons_and_animations': 'Cartoons & Animations',
    'comics': 'Comics',
    'books': 'Books',
    'film': 'Film',
    'film_and_tv': 'Film & TV',
    'food_and_drink': 'Food & Drink',
    'music': 'Music',
    'musicals_and_theatres': 'Musicals & Theatres',
    'board_games': 'Board Games',
    'nature': 'Nature',
    'toys': 'Toys',
    'society_and_culture': 'Society & Culture',
    'japanese_anime_and_manga': 'Japanese Anime & Manga',
    'cartoon_and_animations': 'Cartoon & Animations'
  };
  
  // Check if we have a specific mapping
  if (categoryMap[category.toLowerCase()]) {
    return categoryMap[category.toLowerCase()];
  }
  
  // Fallback: Convert from snake_case to Title Case with proper formatting
  return category
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
    .replace(/\bAnd\b/g, '&')
    .replace(/\bOr\b/g, 'or')
    .replace(/\bOf\b/g, 'of')
    .replace(/\bThe\b/g, 'the')
    .replace(/\bA\b/g, 'a')
    .replace(/\bAn\b/g, 'an')
    .replace(/\bIn\b/g, 'in')
    .replace(/\bOn\b/g, 'on')
}

export function formatDifficulty(difficulty: string): string {
  if (!difficulty) return '';
  
  // Convert first letter to uppercase and rest to lowercase
  return difficulty.charAt(0).toUpperCase() + difficulty.slice(1).toLowerCase();
}
