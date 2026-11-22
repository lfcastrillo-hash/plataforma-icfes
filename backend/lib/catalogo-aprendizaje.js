const fs=require('node:fs');
const path=require('node:path');
const {AREAS}=require('./validation');
// Leer el contenido existente, sin duplicar ni modificar preguntas o respuestas.
const catalog=Object.fromEntries(AREAS.map(area=>{
 const html=fs.readFileSync(path.join(__dirname,'../../frontend/modulo-'+area+'.html'),'utf8');
 const cards=[...html.matchAll(/id="ej-(\d+)-(\d+)"/g)].map(m=>m[1]+'-'+m[2]);
 const answers={};
 for(const m of html.matchAll(/onclick="responder\(\s*this,\s*(\d+),\s*(\d+),\s*(true|false)\s*\)"/g)){
  const key=m[1]+'-'+m[2];answers[key] ||= [];answers[key].push(m[3]==='true');
 }
 if(new Set(cards).size!==cards.length || Object.keys(answers).length!==cards.length)throw new Error('Catálogo inconsistente: '+area);
 const questions=Object.fromEntries(cards.map(key=>{
  const options=answers[key];if(options?.length!==4 || options.filter(Boolean).length!==1)throw new Error('Opciones inconsistentes: '+area+'/'+key);
  return [key,Object.freeze({options:options.length,correct:options.indexOf(true)})];
 }));
 return [area,Object.freeze(questions)];
}));
function evaluateAnswer(area,answer){
 if(!answer || typeof answer!=='object' || Array.isArray(answer) || Object.keys(answer).length!==3
   || !['tema','ejercicio','opcion'].every(k=>Object.hasOwn(answer,k))
   || ![answer.tema,answer.ejercicio,answer.opcion].every(Number.isInteger))return null;
 const key=answer.tema+'-'+answer.ejercicio,question=catalog[area]?.[key];
 if(!question || answer.opcion<0 || answer.opcion>=question.options)return null;
 return {key,correcta:answer.opcion===question.correct};
}
function topicKeys(area,topic){
 if(!Number.isInteger(topic)||topic<0||topic>4)return [];
 return Object.keys(catalog[area]||{}).filter(k=>k.startsWith(topic+'-'));
}
module.exports={catalog,evaluateAnswer,topicKeys};
