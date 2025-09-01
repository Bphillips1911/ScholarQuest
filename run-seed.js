import { seedBadgesAndGames } from './server/seed-badges-games.js';

async function runSeed() {
  try {
    await seedBadgesAndGames();
    console.log('✅ Badge and game seeding completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

runSeed();