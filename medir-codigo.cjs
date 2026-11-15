// El original se conserva intacto en scripts/metrics/historico/.
const {measure,exportReport}=require('./scripts/metrics/measure.cjs');
exportReport(measure({commit:'c071262'}),'base-criterio-nuevo');
exportReport(measure(),'actual');
