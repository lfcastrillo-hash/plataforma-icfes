const fs=require('node:fs'),crypto=require('node:crypto'),{spawnSync}=require('node:child_process');
// Ejecutar una sola vez; ningún secreto sale por stdout y ningún archivo se sobrescribe.
if(fs.existsSync('.qa-native/config.json')||fs.existsSync('.qa-native/postgres.env'))throw Error('Configuración privada existente: conservarla, no regenerar credenciales.');
const context=spawnSync('docker',['context','show'],{encoding:'utf8'});
if(context.status!==0||context.stdout.trim()!=='desktop-linux'||spawnSync('docker',['info'],{stdio:'pipe'}).status!==0)throw Error('Docker Desktop local no está disponible. No se modificarán servicios ni instalarán herramientas.');
for(const [kind,name] of [['container','prepicfes-native-20261115'],['volume','prepicfes-native-20261115-data']]){
 const r=spawnSync('docker',[kind,'inspect',name],{stdio:'pipe'});if(r.status===0)throw Error('Ya existe '+kind+' dedicado sin configuración privada: revisar antes de continuar.');
}
const c={host:'127.0.0.1',port:55439,database:'prepicfes_native_test',user:'prepicfes_migrator',password:crypto.randomBytes(24).toString('hex'),appUser:'prepicfes_app',appPassword:crypto.randomBytes(24).toString('hex'),jwt:crypto.randomBytes(48).toString('hex')};
fs.mkdirSync('.qa-native',{recursive:true});
fs.writeFileSync('.qa-native/postgres.env','POSTGRES_USER='+c.user+'\nPOSTGRES_DB='+c.database+'\nPOSTGRES_PASSWORD='+c.password+'\n',{flag:'wx'});
fs.writeFileSync('.qa-native/config.json',JSON.stringify(c,null,2),{flag:'wx'});
console.log('Configuración local privada creada; no se imprime ninguna credencial.');
