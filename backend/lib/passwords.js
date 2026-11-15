const { scrypt: callback, randomBytes, timingSafeEqual } = require('node:crypto');
const { promisify } = require('node:util');
const scrypt = promisify(callback);
// Perfil scrypt recomendado por OWASP; limitar maxmem explícitamente en Node.
const options = { N: 131072, r: 8, p: 1, maxmem: 256 * 1024 * 1024 };
async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = await scrypt(password, salt, 64, options);
  return ['scrypt', '131072', '8', '1', salt, hash.toString('hex')].join('$');
}
async function verifyPassword(password, stored, allowLegacy = false) {
  if (typeof password !== 'string' || typeof stored !== 'string') return false;
  if (!stored.startsWith('scrypt$')) {
    if (!allowLegacy) return false;
    const a = Buffer.from(password), b = Buffer.from(stored);
    return a.length === b.length && timingSafeEqual(a, b);
  }
  const [algorithm, n, r, p, salt, digest, extra] = stored.split('$');
  if (algorithm !== 'scrypt' || n !== '131072' || r !== '8' || p !== '1' || extra !== undefined) return false;
  if (!/^[a-f0-9]{32}$/.test(salt || '') || !/^[a-f0-9]{128}$/.test(digest || '')) return false;
  const actual = await scrypt(password, salt, 64, options);
  return timingSafeEqual(actual, Buffer.from(digest, 'hex'));
}
module.exports = { hashPassword, verifyPassword };
