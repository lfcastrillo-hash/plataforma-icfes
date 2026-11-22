const AREAS = ['matematicas', 'lectura', 'ciencias', 'sociales', 'ingles'];
function text(value, min, max) { return typeof value === 'string' && value.trim().length >= min && value.trim().length <= max; }
function email(value) {
 if (typeof value !== 'string' || value.length > 254) return false;
 const parts = value.trim().split('@');
 if (parts.length !== 2 || parts.some(part => !part || /[\s<>"'`]/.test(part))) return false;
 const dot = parts[1].lastIndexOf('.');
 return dot > 0 && dot < parts[1].length - 1;
}
function normalizeEmail(value) { return value.trim().toLowerCase(); }
function password(value) { return typeof value === 'string' && value.length >= 8 && value.length <= 128; }
function percentage(value) { return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100; }
function id(value) { return /^[1-9]\d*$/.test(String(value)) && Number.isSafeInteger(Number(value)); }
function fail(res, status, mensaje) { return res.status(status).json({ success: false, mensaje }); }
module.exports = { AREAS, text, email, normalizeEmail, password, percentage, id, fail };
