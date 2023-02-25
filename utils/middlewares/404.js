/*const express = require('express');
const router = express.Router();
router.get('*',(request,response)=>{
    response.send('oops u typed something wrong in URL');
});
module.exports = router;*/
//this is better approch because if we didn't any match for that route then this will be called
module.exports = function(request,response){
    response.send('oops u typed something wrong in URL');
}