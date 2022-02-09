const axios = require("axios");
const express = require('express');
const app = express()
const {getResult_id} = require('./modules/results');

var port =  3000;

global.results = {};  // global variable for all results
global.cache = {};    // global cache variable   

app.get("/",async (req, res) => {
    console.log(req.query.roll);
    let roll = req.query.roll;
    
        if(cache[roll] == 1){
          console.log("From cache");
            // console.log(results);
            return res.send(results);
        } 
        cache[roll] = 1;
        getResult_id(roll, res);

});
app.get("/print", async(req,res)=>{
    
});
  app.listen(port, () => {
    console.log(`Server Started at http://localhost:${port}`);
  });