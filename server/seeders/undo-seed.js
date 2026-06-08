import dotenv from 'dotenv';
dotenv.config();

import sequelize from '../config/db.js';
import '../models/index.js';
import { down } from './seed.js';

const run = async () => {
  try {
    await sequelize.authenticate();
    await down();
    console.log('Seed undone.');
    process.exit(0);
  } catch (err) {
    console.error('Undo failed:', err.message);
    process.exit(1);
  }
};

run();
