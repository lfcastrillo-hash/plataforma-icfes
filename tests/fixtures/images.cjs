const sharp=require('../../backend/node_modules/sharp');
const png=()=>sharp({create:{width:8,height:6,channels:3,background:'#267fab'}}).png().toBuffer();
module.exports={png,sharp};
