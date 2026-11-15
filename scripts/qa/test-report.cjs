const {spawnSync}=require('node:child_process');
const fs=require('node:fs');
const path=require('node:path');
const outputDir=path.join(process.env.QA_EVIDENCE_ROOT||'evidencias','pruebas-unitarias');
fs.mkdirSync(outputDir,{recursive:true});
const args=['--experimental-test-coverage','--test','--test-concurrency=1',
 '--test-coverage-include=backend/**/*.js','--test-coverage-include=frontend/js/simulacro-core.js',
 '--test-coverage-exclude=**/node_modules/**',
 '--test-reporter=spec','--test-reporter-destination='+path.join(outputDir,'ejecucion.txt'),
 '--test-reporter=./scripts/qa/reporter.cjs','--test-reporter-destination=stdout',
 'tests/unit/*.test.cjs','tests/integration/*.test.cjs'];
const result=spawnSync(process.execPath,args,{stdio:'inherit'});
// Quitar únicamente relleno al final de línea de las tablas del reporter nativo.
const output=path.join(outputDir,'ejecucion.txt');
if(fs.existsSync(output))fs.writeFileSync(output,fs.readFileSync(output,'utf8').replace(/[ \t]+(?=\r?$)/gm,''));
process.exitCode=result.status??1;
