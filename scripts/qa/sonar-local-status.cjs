const fs=require('node:fs');
const dir='docs/sonar-evidencias';
const all=JSON.parse(fs.readFileSync(dir+'/issues.json')).issues;
const fresh=new Set(JSON.parse(fs.readFileSync(dir+'/issues-new-period.json')).issues.map(i=>i.key));
const fixes=new Set(['javascript:S2681','javascript:S1121','javascript:S3358','javascript:S2699','javascript:S930','javascript:S8786','javascript:S6594','javascript:S1481','javascript:S1854','javascript:S9383','javascript:S6551']);
const rows=all.map(i=>{
 const file=i.component.split(':').slice(1).join(':');let status='pendiente',reason=i.message;
 if(fixes.has(i.rule)){status='correccion_local_por_confirmar';reason='Transformación implementada; cierre y ubicación requieren nuevo scanner.';}
 if(i.rule==='javascript:S3776'&&file==='backend/lib/database-config.js'){status='refactor_local_por_confirmar';reason='Separadas URL, modo, TLS y parámetros; Sonar debe recalcular complejidad cognitiva.';}
 if(i.rule==='javascript:S6582'&&['backend/lib/catalogo-aprendizaje.js','frontend/js/simulacro-core.js'].includes(file)){status='correccion_local_por_confirmar';}
 if(i.rule==='javascript:S7747'){status='revision_justificada';reason='Se itera una copia de pending porque sendPending puede retirar elementos; usar el iterable mutable puede saltar acciones. No se cambia el estado en Sonar.';}
 if(i.rule==='javascript:S7721'){status='revision_arquitectonica';reason='Factoría UMD conserva el ámbito privado y exportación CommonJS/navegador; mover a global solo para la regla introduce contaminación. Sin supresión.';}
 if(i.rule==='plsql:DeleteOrUpdateWithoutWhereCheck'){
  status='revision_SQL';reason=file.includes('003_')?'La ubicación corresponde a FOREIGN KEY ... ON DELETE NO ACTION; no ejecuta DELETE. Revisión humana con el analizador de dialecto PostgreSQL.':'UPDATE usuarios normaliza todas las cuentas deliberadamente en una migración histórica; requiere revisar precondiciones y alcance, no añadir WHERE ficticio.';
 }
 if(i.rule.startsWith('Web:')&&['Web:InputWithoutLabelCheck','Web:S6853','Web:MouseEventWithoutKeyboardEquivalentCheck','Web:S6848'].includes(i.rule)){
  status='mejora_semantica_parcial';reason='Añadidos nombres, asociaciones y teclado donde no hay controles hijos; confirmar ubicación por ubicación con scanner y auditoría manual.';
 }
 if(i.rule==='css:S4666'&&file==='frontend/css/global.css'){status='reduccion_parcial';reason='Retirada una primera regla .progreso-celda idéntica y anulada por la última; las otras reglas conservan la cascada.';}
 return {key:i.key,newCode:fresh.has(i.key),rule:i.rule,severity:i.severity,type:i.type,file,line:i.line,status,reason};
});
fs.writeFileSync(dir+'/estado-local-por-incidencia.json',JSON.stringify(rows,null,2));
const groups=new Map();for(const r of rows){const key=r.rule+'|'+r.severity;const g=groups.get(key)||{rule:r.rule,severity:r.severity,general:0,newCode:0,candidates:0};g.general++;g.newCode+=Number(r.newCode);g.candidates+=Number(r.status.includes('por_confirmar'));groups.set(key,g);}
let report='# Diagnóstico por regla y severidad\n\nFuente remota: cbf45e8. El filtro sinceLeakPeriod=true devuelve 33 nuevas entre 371 abiertas. No se suman ambos grupos. Las correcciones locales son candidatas para revisión, no cierres oficiales.\n\n| Regla | Severidad | Generales | Nuevas | Candidatas corregidas localmente |\n|---|---|---:|---:|---:|\n';
for(const g of groups.values())report+=`| ${g.rule} | ${g.severity} | ${g.general} | ${g.newCode} | ${g.candidates} |\n`;
report+='\nLos detalles por archivo, línea, identificador, causa y tratamiento están en estado-local-por-incidencia.json. Accesibilidad y CSS se informan como intervención parcial, sin convertir atributos añadidos en incidencias cerradas. No hay un número oficial nuevo de fiabilidad o duplicación.\n';
fs.writeFileSync('docs/diagnostico-reglas-sonar.md',report);
console.log({general:rows.length,newCode:rows.filter(r=>r.newCode).length,candidates:rows.filter(r=>r.status.includes('por_confirmar')).length,newCandidates:rows.filter(r=>r.newCode&&r.status.includes('por_confirmar')).length});
