const axios = require("axios");
const express = require('express');
const app = express()
const {client, getResult_id, getResult_data} = require('./modules/results');
const async = require("async");
var port =  3000;
global.results = {};  // global variable for all results

app.get("/",async (req, res) => {
    console.log(req.query.roll);
    let roll = req.query.roll;
    if(!roll){
      return res.status(400).send({message:"Wrong Parameters"});
    }   
    getResult_id(roll, res);

});
app.get("/cache",async (req, res) => {
  console.log(req.query.roll);
  let roll = req.query.roll;
    if(roll == undefined){
       return res.status(400).json({message:"Invalid Input"});
    }
    else{

      client.hgetall(roll,(err,reply)=>{
        if(reply == null || reply == undefined){
          return res.status(200).json({message:"Not available"});
        }
        async.map(Object.keys(reply),function(key, cb){
            getResult_data(key,reply[key]);
            client.hgetall(key,(err,rep)=>{
                if(err) console.log(err); 
                cb(null, rep);                
            })
        },(err, resp)=>{
            res.json(resp);
        })
          
    });
    }      
});

  app.listen(port, () => {
    console.log(`Server Started at http://localhost:${port}`);
  });