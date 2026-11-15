const path = require('node:path');
const { randomBytes } = require('node:crypto');
require('dotenv').config({ path: path.join(__dirname, '.env'), quiet: true });
const production = process.env.NODE_ENV === 'production';
if (production && (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)) throw new Error('Configure JWT_SECRET con al menos 32 caracteres.');
module.exports = {
  production, jwtSecret: process.env.JWT_SECRET || randomBytes(48).toString('hex'),
  origins: (process.env.CORS_ORIGINS || '').split(',').filter(Boolean),
  legacyPasswords: process.env.ALLOW_LEGACY_PASSWORDS === 'true',
  cookie: { httpOnly: true, secure: production, sameSite: 'lax', path: '/' },
};
