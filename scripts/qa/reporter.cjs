const fs=require('node:fs');
module.exports=async function* reporter(source){
 const cases=[];let coverage,summary;
 for await(const event of source){
  const d=event.data;
  if(event.type==='test:pass'||event.type==='test:fail')cases.push({name:d.name,file:d.file?.replace(process.cwd(),'').replace(/\\/g,'/'),line:d.line,durationMs:d.details?.duration_ms,status:event.type==='test:pass'?'PASS':'FAIL',...(d.details?.error?{error:d.details.error.message}:{})});
  if(event.type==='test:coverage')coverage=d.summary;
  if(event.type==='test:summary')summary=d;
 }
 if(coverage){coverage.workingDirectory='.';for(const f of coverage.files)f.path=f.path.replace(process.cwd(),'').replace(/\\/g,'/').replace(/^\//,'');}
 const report={date:new Date().toISOString(),node:process.version,environment:'Windows; HTTP local + PostgreSQL WASM aislado; datos ficticios',cases,summary,coverage};
 fs.mkdirSync('evidencias/pruebas-unitarias',{recursive:true});
 fs.writeFileSync('evidencias/pruebas-unitarias/resultados.json',JSON.stringify(report,null,2));
 const xml=s=>String(s??'').replace(/[<>&"']/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'})[c]);
 fs.writeFileSync('evidencias/pruebas-unitarias/junit.xml','<?xml version="1.0" encoding="UTF-8"?>\n<testsuites><testsuite name="PrepICFES" tests="'+cases.length+'" failures="'+cases.filter(c=>c.status==='FAIL').length+'">'+cases.map(c=>'<testcase name="'+xml(c.name)+'" classname="'+xml(c.file)+'" time="'+(c.durationMs||0)/1000+'">'+(c.status==='FAIL'?'<failure message="'+xml(c.error)+'"/>':'')+'</testcase>').join('')+'</testsuite></testsuites>');
 if(coverage)fs.writeFileSync('evidencias/pruebas-unitarias/lcov.info',coverage.files.map(f=>'TN:\nSF:'+f.path+'\n'+f.lines.map(l=>'DA:'+l.line+','+l.count).join('\n')+'\nLF:'+f.totalLineCount+'\nLH:'+f.coveredLineCount+'\nend_of_record\n').join(''));
 yield 'Reporte JSON guardado: '+cases.length+' pruebas, '+cases.filter(c=>c.status==='FAIL').length+' fallidas.\n';
};
