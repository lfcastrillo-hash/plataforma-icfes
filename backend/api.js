// Adaptador serverless; no ejecuta migraciones ni abre un puerto al importarse.
module.exports = require('./server').createApp();
