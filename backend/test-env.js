require('./config');
for(const name of ['DATABASE_URL','JWT_SECRET'])console.log(name+': '+(process.env[name]?'configurada':'pendiente'));
