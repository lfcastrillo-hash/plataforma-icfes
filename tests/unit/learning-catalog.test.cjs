const {test}=require('node:test');const assert=require('node:assert/strict');
const {catalog,evaluateAnswer,topicKeys}=require('../../backend/lib/catalogo-aprendizaje');
test('Catálogo del servidor: 176 ejercicios existentes, cuatro opciones y evaluación de selección',()=>{
 assert.equal(Object.values(catalog).reduce((n,c)=>n+Object.keys(c).length,0),176);
 for(const [area,questions]of Object.entries(catalog))for(const [key,q]of Object.entries(questions)){
  const [tema,ejercicio]=key.split('-').map(Number);assert.equal(q.options,4);
  for(let opcion=0;opcion<4;opcion++)assert.equal(evaluateAnswer(area,{tema,ejercicio,opcion}).correcta,opcion===q.correct);
 }
 assert.equal(evaluateAnswer('ciencias',{tema:2,ejercicio:0,opcion:0}),null);
 assert.equal(evaluateAnswer('matematicas',null),null);
 assert.equal(topicKeys('matematicas',0).length,8);assert.equal(topicKeys('ciencias',2).length,0);
});
