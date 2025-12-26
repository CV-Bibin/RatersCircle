export const LEVELS = [
  { name: "New Comer", min: 0, color: "#9ca3af" },     // Gray (0-99)
  { name: "Beginner", min: 100, color: "#3b82f6" },    // Blue (100-499)
  { name: "Intermediate", min: 500, color: "#22c55e" },// Green (500-999)
  { name: "Pro", min: 1000, color: "#a855f7" },       // Purple (1000-2499)
  { name: "Legendary", min: 2500, color: "#eab308" }   // Gold (2500+)
];

export function getUserLevel(xp = 0) {
  // 1. Find current level index
  let levelIndex = LEVELS.findIndex((lvl, i) => {
    const nextLvl = LEVELS[i + 1];
    return xp >= lvl.min && (!nextLvl || xp < nextLvl.min);
  });

  if (levelIndex === -1) levelIndex = 0; // Fallback

  const currentLevel = LEVELS[levelIndex];
  const nextLevel = LEVELS[levelIndex + 1];

  // 2. Calculate Percentage (0 to 100)
  let percentage = 100; // Default max for Legendary
  if (nextLevel) {
    const range = nextLevel.min - currentLevel.min;
    const progress = xp - currentLevel.min;
    percentage = (progress / range) * 100;
  }

  return {
    ...currentLevel,
    nextLevelXP: nextLevel ? nextLevel.min : null,
    percentage: Math.min(100, Math.max(0, percentage)), // Clamp between 0-100
    isLegendary: !nextLevel
  };
}