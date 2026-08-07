import { loadEnv } from '../config/env.js';
import { connectDB, disconnectDB } from '../config/db.js';
import { authService } from '../modules/auth/service/authService.js';
import { authRepository } from '../modules/auth/repository/authRepository.js';
import { logger } from '../config/logger.js';

async function seed() {
  loadEnv();
  await connectDB();

  logger.info('Seeding database...');

  const seedEmail = 'demo@glowtrack.app';
  const existingUser = await authRepository.findUserByEmail(seedEmail);

  if (existingUser) {
    logger.info({ email: seedEmail }, 'Seed user already exists, skipping creation');
  } else {
    const result = await authService.register({
      email: seedEmail,
      password: 'Password123!',
      name: 'GlowTrack Demo User',
    });
    logger.info({ userId: result.user._id }, 'Seed user created successfully');
  }

  await disconnectDB();
  logger.info('Database seed complete');
}

seed().catch((error) => {
  logger.error({ error }, 'Database seed failed');
  process.exit(1);
});
