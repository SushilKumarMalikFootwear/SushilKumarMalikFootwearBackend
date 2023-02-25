const News_letterModel = require('../models/save_news_letter');
module.exports = {
    save_content(object){
        try{
            let promise = News_letterModel.create(object);
            return promise;
        }
        catch(err){
            console.log("ERROR is : ",err);
        }
    },
    async view_all(){
        try{
            let news_letters = await News_letterModel.find();
            if(news_letters.length!=0){
                return news_letters;
            }
            else{
                return null;
            }
        }
        catch(err){
            console.log("ERROR is : ",err);
        }
    }
}