const Module=require('node:module');
const original=Module._load;
Module._load=function(request,...args){if(/pglite/i.test(request))throw Error('PGlite está prohibido en esta ejecución PostgreSQL nativa.');return original.call(this,request,...args);};
process.env.QA_DATABASE_ENGINE='postgres';
process.env.JWT_SECRET=require('../db/native-context.cjs').settings().jwt;
