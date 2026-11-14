const {spawnSync}=require('node:child_process');
const fs=require('node:fs');
fs.mkdirSync('evidencias/pruebas-unitarias',{recursive:true});
const args=['--experimental-test-coverage','--test','--test-concurrency=1',
 '--test-coverage-include=backend/**/*.js','--test-coverage-include=frontend/js/simulacro-core.js',
 '--test-coverage-exclude=**/node_modules/**',
 '--test-reporter=spec','--test-reporter-destination=evidencias/pruebas-unitarias/ejecucion.txt',
 '--test-reporter=./scripts/qa/reporter.cjs','--test-reporter-destination=stdout',
 'tests/unit/*.test.cjs','tests/integration/*.test.cjs'];
const result=spawnSync(process.execPath,args,{stdio:'inherit'});process.exitCode=result.status??1;
