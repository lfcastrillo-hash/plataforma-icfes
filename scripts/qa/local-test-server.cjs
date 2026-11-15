const {fixture}=require('../../tests/fixtures/app.cjs');
(async()=>{
 const f=await fixture({port:Number(process.env.QA_PORT)||3001});
 await f.register('estudiante@example.test');await f.register('profesor@example.test','profesor');
 console.log('Base ficticia y temporal. URL: '+f.base+'; usuarios estudiante@example.test y profesor@example.test; contraseña de fixture: Prueba123!');
 console.log('No conecta a producción. Ctrl+C termina el proceso y descarta sus datos.');
 for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>f.close().then(()=>process.exit(0)));
})();
