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
  
  // Tesla House Badges (Electrifying Excellence) - Purple theme
  {
    name: "Tesla Bronze Pioneer",
    description: "Beginning the quest for excellence",
    houseId: "tesla",
    category: "academic",
    pointsRequired: 10,
    level: 1,
    iconPath: "/badges/tesla-bronze-academic.svg",
    animationType: "pulse"
  },
  {
    name: "Tesla Silver Inventor",
    description: "Advanced innovation pursuits",
    houseId: "tesla", 
    category: "academic",
    pointsRequired: 25,
    level: 2,
    iconPath: "/badges/tesla-silver-academic.svg",
    animationType: "glow"
  },
  {
    name: "Tesla Gold Electrifier",
    description: "Master of electrifying excellence",
    houseId: "tesla",
    category: "academic",
    pointsRequired: 50,
    level: 3,
    iconPath: "/badges/tesla-gold-academic.svg",
    animationType: "bounce"
  },

  // Curie House Badges (Pioneering Progress) - Red theme
  {
    name: "Curie Bronze Explorer",
    description: "Showing research potential",
    houseId: "curie",
    category: "behavior",
    pointsRequired: 10,
    level: 1,
    iconPath: "/badges/curie-bronze-behavior.svg",
    animationType: "pulse"
  },
  {
    name: "Curie Silver Researcher", 
    description: "Demonstrating strong scientific methods",
    houseId: "curie",
    category: "behavior",
    pointsRequired: 25,
    level: 2,
    iconPath: "/badges/curie-silver-behavior.svg",
    animationType: "glow"
  },
  {
    name: "Curie Gold Scientist",
    description: "Exceptional scientific achievement",
    houseId: "curie",
    category: "behavior",
    pointsRequired: 50,
    level: 3,
    iconPath: "/badges/curie-gold-behavior.svg",
    animationType: "rotate"
  },

  // Nobel House Badges (Excellence in Achievement) - Green theme
  {
    name: "Nobel Bronze Achiever",
    description: "Excellent attendance foundation",
    houseId: "nobel",
    category: "attendance",
    pointsRequired: 10,
    level: 1,
    iconPath: "/badges/nobel-bronze-attendance.svg",
    animationType: "pulse"
  },
  {
    name: "Nobel Silver Champion",
    description: "Consistent excellence in attendance",
    houseId: "nobel",
    category: "attendance", 
    pointsRequired: 25,
    level: 2,
    iconPath: "/badges/nobel-silver-attendance.svg",
    animationType: "glow"
  },
  {
    name: "Nobel Gold Master",
    description: "Perfect attendance achievement",
    houseId: "nobel",
    category: "attendance",
    pointsRequired: 50,
    level: 3,
    iconPath: "/badges/nobel-gold-attendance.svg",
    animationType: "bounce"
  },

  // Lovelace House Badges (Coding the Future) - Orange theme  
  {
    name: "Lovelace Bronze Coder",
    description: "Programming foundation emerging",
    houseId: "lovelace",
    category: "overall",
    pointsRequired: 30,
    level: 1,
    iconPath: "/badges/lovelace-bronze-overall.svg",
    animationType: "pulse"
  },
  {
    name: "Lovelace Silver Developer",
    description: "Well-rounded technical excellence",
    houseId: "lovelace",
    category: "overall",
    pointsRequired: 75,
    level: 2,
    iconPath: "/badges/lovelace-silver-overall.svg",
    animationType: "glow"
  },
  {
    name: "Lovelace Gold Architect",
    description: "Complete programming excellence",
    houseId: "lovelace",
    category: "overall",
    pointsRequired: 150,
    level: 3,
    iconPath: "/badges/lovelace-gold-overall.svg",
    animationType: "rotate"
  },

  // Universal PBIS Milestone Badges - Key Progress Markers
  {
    name: "PBIS Bronze Scholar",
    description: "First milestone: 50 total points achieved",
    houseId: null,
    category: "overall",
    pointsRequired: 50,
    level: 1,
    iconPath: "/badges/pbis-bronze-scholar.svg",
    animationType: "pulse"
  },
  {
    name: "PBIS Silver Achiever",
    description: "Strong progress: 150 total points achieved", 
    houseId: null,
    category: "overall",
    pointsRequired: 150,
    level: 2,
    iconPath: "/badges/pbis-silver-achiever.svg",
    animationType: "glow"
  },
  {
    name: "PBIS Gold Champion",
    description: "Excellent standing: 250 total points achieved",
    houseId: null,
    category: "overall",
    pointsRequired: 250,
    level: 3,
    iconPath: "/badges/pbis-gold-champion.svg",
    animationType: "rotate"
  },
  {
    name: "MUSTANG Platinum Champion",
    description: "Outstanding achievement: 500 total points",
    houseId: null,
    category: "overall",
    pointsRequired: 500,
    level: 4,
    iconPath: "/badges/mustang-platinum-champion.svg",
    animationType: "glow"
  },
  {
    name: "MUSTANG Diamond Legend",
    description: "Legendary status: 1000 total points - Ultimate achievement!",
    houseId: null,
    category: "overall",
    pointsRequired: 1000,
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