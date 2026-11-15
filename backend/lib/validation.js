const AREAS = ['matematicas', 'lectura', 'ciencias', 'sociales', 'ingles'];
function text(value, min, max) { return typeof value === 'string' && value.trim().length >= min && value.trim().length <= max; }
function email(value) { return typeof value === 'string' && value.length <= 254 && /^[^\s@<>"'`]+@[^\s@<>"'`]+\.[^\s@<>"'`]+$/.test(value.trim()); }
function normalizeEmail(value) { return value.trim().toLowerCase(); }
function password(value) { return typeof value === 'string' && value.length >= 8 && value.length <= 128; }
function percentage(value) { return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100; }
function id(value) { return /^[1-9]\d*$/.test(String(value)) && Number.isSafeInteger(Number(value)); }
function fail(res, status, mensaje) { return res.status(status).json({ success: false, mensaje }); }
module.exports = { AREAS, text, email, normalizeEmail, password, percentage, id, fail };
