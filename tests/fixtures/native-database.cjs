const fs=require('node:fs'),path=require('node:path'),{randomUUID}=require('node:crypto');
const {poolFor,migrate,grant}=require('../../scripts/db/native-context.cjs');
const schemas=new Map();
async function database({directory,empty=false}={}){
 let schema=directory?schemas.get(path.resolve(directory)):null;
 const create=!schema;if(!schema)schema='qa_'+randomUUID().replace(/-/g,'');
 if(directory)schemas.set(path.resolve(directory),schema);
 const admin=poolFor('migrator',schema);
 try{if(create){await admin.query('CREATE SCHEMA '+schema+' AUTHORIZATION prepicfes_schema');if(!empty)await migrate(admin,['001_esquema.sql','003_contrato_final.sql']);await grant(admin,schema);}}
 catch(e){await admin.end();throw e;}
 if(empty){const client=await admin.connect();return {query:(...a)=>client.query(...a),exec:sql=>client.query(sql),close:async()=>{client.release();await admin.end();},schema,engine:'PostgreSQL nativo/pg (sin PGlite)'};}
 await admin.end();const pool=poolFor('app',schema);pool.schema=schema;pool.engine='PostgreSQL nativo/pg (sin mutex, conexiones reales)';return pool;
}
module.exports={database};
