const axios = require("axios");
const express = require('express');
const app = express()
const {client, getResult_id} = require('./modules/results');
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
  let key = req.query.key;
  data = {};
  if(key !== undefined){
    await client.hgetall(key, function (error, value) {
      console.log(value);
      if(!value){
        return res.status(400).send({message:"No Data Found"});
      }
      data['message'] = "OK";       
      data[key] = value;
      return res.status(200).json(data);
    });
} 
  else if(roll !== undefined){
    await client.smembers(roll, function (error, value) {
     if(!value){
      return res.status(400).send({message:"No Data Found"}); 
     }
      data['message'] = "OK";
     data[roll] = value;
     console.log(value);
     return res.status(200).json(data);
  });  
}  else {
      res.status(400).send({message:"Wrong Parameters"});
    }   
});

  app.listen(port, () => {
    console.log(`Server Started at http://localhost:${port}`);
  });