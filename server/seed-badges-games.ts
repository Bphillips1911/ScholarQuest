import { db } from "./db";
import * as schema from "@shared/schema";

// Badge definitions for each house
const badgeDefinitions = [
  // Franklin House Badges (Inventors of Tomorrow) - Brown theme
  {
    name: "Franklin Bronze Explorer",
    description: "First steps in academic excellence",
    houseId: "franklin",
    category: "academic",
    pointsRequired: 10,
    level: 1,
    iconPath: "/badges/franklin-bronze-academic.svg",
    animationType: "pulse"
  },
  {
    name: "Franklin Silver Innovator", 
    description: "Growing academic achievement",
    houseId: "franklin",
    category: "academic",
    pointsRequired: 25,
    level: 2,
    iconPath: "/badges/franklin-silver-academic.svg",
    animationType: "glow"
  },
  {
    name: "Franklin Gold Inventor",
    description: "Outstanding academic performance",
    houseId: "franklin",
    category: "academic", 
    pointsRequired: 50,
    level: 3,
    iconPath: "/badges/franklin-gold-academic.svg",
    animationType: "rotate"
  },
  
  // Courie House Badges (Seekers of Knowledge) - Teal theme
  {
    name: "Courie Bronze Seeker",
    description: "Beginning the quest for knowledge",
    houseId: "courie",
    category: "academic",
    pointsRequired: 10,
    level: 1,
    iconPath: "/badges/courie-bronze-academic.svg",
    animationType: "pulse"
  },
  {
    name: "Courie Silver Scholar",
    description: "Advanced knowledge pursuits",
    houseId: "courie", 
    category: "academic",
    pointsRequired: 25,
    level: 2,
    iconPath: "/badges/courie-silver-academic.svg",
    animationType: "glow"
  },
  {
    name: "Courie Gold Scientist",
    description: "Master of scientific excellence",
    houseId: "courie",
    category: "academic",
    pointsRequired: 50,
    level: 3,
    iconPath: "/badges/courie-gold-academic.svg",
    animationType: "bounce"
  },

  // West House Badges (Leaders of Change) - Orange theme
  {
    name: "West Bronze Leader",
    description: "Showing leadership potential",
    houseId: "west",
    category: "behavior",
    pointsRequired: 10,
    level: 1,
    iconPath: "/badges/west-bronze-behavior.svg",
    animationType: "pulse"
  },
  {
    name: "West Silver Commander", 
    description: "Demonstrating strong leadership",
    houseId: "west",
    category: "behavior",
    pointsRequired: 25,
    level: 2,
    iconPath: "/badges/west-silver-behavior.svg",
    animationType: "glow"
  },
  {
    name: "West Gold Champion",
    description: "Exceptional leadership and character",
    houseId: "west",
    category: "behavior",
    pointsRequired: 50,
    level: 3,
    iconPath: "/badges/west-gold-behavior.svg",
    animationType: "rotate"
  },

  // Blackwell House Badges (Guardians of Excellence) - Black theme
  {
    name: "Blackwell Bronze Guardian",
    description: "Protecting excellence in attendance",
    houseId: "blackwell",
    category: "attendance",
    pointsRequired: 10,
    level: 1,
    iconPath: "/badges/blackwell-bronze-attendance.svg",
    animationType: "pulse"
  },
  {
    name: "Blackwell Silver Protector",
    description: "Consistent attendance excellence",
    houseId: "blackwell",
    category: "attendance", 
    pointsRequired: 25,
    level: 2,
    iconPath: "/badges/blackwell-silver-attendance.svg",
    animationType: "glow"
  },
  {
    name: "Blackwell Gold Sentinel",
    description: "Perfect attendance mastery",
    houseId: "blackwell",
    category: "attendance",
    pointsRequired: 50,
    level: 3,
    iconPath: "/badges/blackwell-gold-attendance.svg",
    animationType: "bounce"
  },

  // Berruguete House Badges (Artists of Tomorrow) - Purple theme  
  {
    name: "Berruguete Bronze Artist",
    description: "Creative spirit emerging",
    houseId: "berruguete",
    category: "overall",
    pointsRequired: 30,
    level: 1,
    iconPath: "/badges/berruguete-bronze-overall.svg",
    animationType: "pulse"
  },
  {
    name: "Berruguete Silver Creator",
    description: "Well-rounded excellence",
    houseId: "berruguete",
    category: "overall",
    pointsRequired: 75,
    level: 2,
    iconPath: "/badges/berruguete-silver-overall.svg",
    animationType: "glow"
  },
  {
    name: "Berruguete Gold Master",
    description: "Complete artistic excellence",
    houseId: "berruguete",
    category: "overall",
    pointsRequired: 150,
    level: 3,
    iconPath: "/badges/berruguete-gold-overall.svg",
    animationType: "rotate"
  },

  // Universal High Achievement Badges
  {
    name: "MUSTANG Platinum Champion",
    description: "Exceptional all-around MUSTANG traits",
    houseId: null,
    category: "overall",
    pointsRequired: 200,
    level: 4,
    iconPath: "/badges/mustang-platinum-champion.svg",
    animationType: "glow"
  },
  {
    name: "MUSTANG Diamond Legend",
    description: "Legendary MUSTANG excellence",
    houseId: null,
    category: "overall",
    pointsRequired: 500,
    level: 5,
    iconPath: "/badges/mustang-diamond-legend.svg",
    animationType: "bounce"
  }
];

// Game definitions
const gameDefinitions = [
  // Sports Games
  {
    name: "Basketball Shootout",
    description: "Test your shooting skills in this fast-paced basketball game",
    category: "sports",
    difficulty: "easy",
    pointsRequired: 0,
    iconPath: "/games/basketball.svg",
    gamePath: "Basketball"
  },
  {
    name: "Soccer Penalty Kicks", 
    description: "Score goals against the goalkeeper",
    category: "sports",
    difficulty: "medium",
    pointsRequired: 15,
    iconPath: "/games/soccer.svg", 
    gamePath: "Soccer"
  },
  {
    name: "Racing Championship",
    description: "High-speed racing with power-ups",
    category: "racing",
    difficulty: "hard",
    pointsRequired: 30,
    iconPath: "/games/racing.svg",
    gamePath: "Racing"
  },

  // Puzzle Games
  {
    name: "15-Puzzle Slider",
    description: "Classic sliding number puzzle with MUSTANG themes",
    category: "puzzle",
    difficulty: "easy",
    pointsRequired: 5,
    iconPath: "/games/puzzle-slider.svg",
    gamePath: "PuzzleSlider"
  },
  {
    name: "Tic Tac Toe",
    description: "Strategic thinking against smart AI",
    category: "strategy",
    difficulty: "easy",
    pointsRequired: 0,
    iconPath: "/games/tic-tac-toe.svg",
    gamePath: "TicTacToe"
  },
  {
    name: "Connect Four",
    description: "Drop checkers and connect four in a row",
    category: "strategy",
    difficulty: "medium",
    pointsRequired: 10,
    iconPath: "/games/connect-four.svg",
    gamePath: "ConnectFour"
  },
  {
    name: "Word Search",
    description: "Find MUSTANG trait words in the grid",
    category: "puzzle",
    difficulty: "easy",
    pointsRequired: 5,
    iconPath: "/games/word-search.svg",
    gamePath: "WordSearch"
  },
  {
    name: "Memory Match",
    description: "Match BHSA themed cards",
    category: "puzzle",
    difficulty: "medium",
    pointsRequired: 15,
    iconPath: "/games/memory-match.svg",
    gamePath: "MemoryMatch"
  },
  {
    name: "Math Challenge",
    description: "Quick math problems with time pressure",
    category: "puzzle",
    difficulty: "medium",
    pointsRequired: 20,
    iconPath: "/games/math-challenge.svg",
    gamePath: "MathChallenge"
  },

  // Arcade Games  
  {
    name: "Whack-A-Mole",
    description: "Fast reflexes needed to whack moles",
    category: "arcade",
    difficulty: "easy",
    pointsRequired: 0,
    iconPath: "/games/whack-a-mole.svg",
    gamePath: "WhackAMole"
  },
  {
    name: "Space Invaders",
    description: "Defend Earth from alien invasion",
    category: "arcade",
    difficulty: "medium",
    pointsRequired: 25,
    iconPath: "/games/space-invaders.svg",
    gamePath: "SpaceInvaders"
  },
  {
    name: "Pac-Man MUSTANG",
    description: "Collect MUSTANG traits while avoiding obstacles",
    category: "arcade",
    difficulty: "hard",
    pointsRequired: 40,
    iconPath: "/games/pac-man.svg",
    gamePath: "PacMan"
  },
  {
    name: "Brick Breaker",
    description: "Break all the bricks with precise ball control",
    category: "arcade",
    difficulty: "medium",
    pointsRequired: 20,
    iconPath: "/games/brick-breaker.svg",
    gamePath: "BrickBreaker"
  },
  {
    name: "Snake Adventure",
    description: "Guide the snake to collect MUSTANG points",
    category: "arcade",
    difficulty: "easy",
    pointsRequired: 10,
    iconPath: "/games/snake.svg",
    gamePath: "Snake"
  },

  // Strategy Games
  {
    name: "Chess Master",
    description: "Classic chess with hint system",
    category: "strategy",
    difficulty: "hard",
    pointsRequired: 50,
    iconPath: "/games/chess.svg",
    gamePath: "Chess"
  },
  {
    name: "Checkers Champion",
    description: "Strategic checkers gameplay",
    category: "strategy",
    difficulty: "medium",
    pointsRequired: 25,
    iconPath: "/games/checkers.svg",
    gamePath: "Checkers"
  },
  {
    name: "Tower Defense",
    description: "Defend your base with strategic tower placement",
    category: "strategy",
    difficulty: "hard",
    pointsRequired: 60,
    iconPath: "/games/tower-defense.svg",
    gamePath: "TowerDefense"
  },

  // Adventure Games
  {
    name: "MUSTANG Quest",
    description: "Adventure through BHSA collecting MUSTANG traits",
    category: "adventure",
    difficulty: "medium",
    pointsRequired: 35,
    iconPath: "/games/mustang-quest.svg",
    gamePath: "MustangQuest"
  },
  {
    name: "House Explorer",
    description: "Explore your house's virtual world",
    category: "adventure",
    difficulty: "easy",
    pointsRequired: 15,
    iconPath: "/games/house-explorer.svg",
    gamePath: "HouseExplorer"
  },
  {
    name: "BHSA Time Machine",
    description: "Travel through BHSA history and learn",
    category: "adventure",
    difficulty: "medium",
    pointsRequired: 30,
    iconPath: "/games/time-machine.svg",
    gamePath: "TimeMachine"
  }
];

export async function seedBadgesAndGames() {
  console.log("🏆 SEEDING: Starting badges and games seeding...");

  try {
    // Check if badges already exist
    const existingBadges = await db.select().from(schema.badges).limit(1);
    if (existingBadges.length === 0) {
      console.log("🏆 SEEDING: Inserting badges...");
      await db.insert(schema.badges).values(badgeDefinitions);
      console.log(`🏆 SEEDING: Inserted ${badgeDefinitions.length} badges`);
    } else {
      console.log("🏆 SEEDING: Badges already exist, skipping...");
    }

    // Check if games already exist  
    const existingGames = await db.select().from(schema.games).limit(1);
    if (existingGames.length === 0) {
      console.log("🎮 SEEDING: Inserting games...");
      await db.insert(schema.games).values(gameDefinitions);
      console.log(`🎮 SEEDING: Inserted ${gameDefinitions.length} games`);
    } else {
      console.log("🎮 SEEDING: Games already exist, skipping...");
    }

    console.log("✅ SEEDING: Badges and games seeding completed successfully");
  } catch (error) {
    console.error("❌ SEEDING: Error seeding badges and games:", error);
    throw error;
  }
}