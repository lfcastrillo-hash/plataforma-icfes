const {catalog}=require('../../backend/lib/catalogo-aprendizaje');
function answer(area,tema=0,ejercicio=0,correct=true){
 const question=catalog[area][tema+'-'+ejercicio];
 return {area,respuesta:{tema,ejercicio,opcion:correct?question.correct:(question.correct+1)%question.options}};
}
module.exports={answer};
