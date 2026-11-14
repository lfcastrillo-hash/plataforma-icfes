require('./config');
for(const name of ['DATABASE_URL','JWT_SECRET','OPENROUTER_API_KEY','OPENROUTER_MODEL'])console.log(name+': '+(process.env[name]?'configurada':'pendiente'));
