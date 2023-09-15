const axios = require("axios");
const { JSDOM } = require('jsdom');
const async = require("async");
const redis = require('redis');
// Create Redis Client
const client = redis.createClient({
  host: process.env.REDIS_HOSTNAME,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD
});

client.on('connect', function(){
  console.log('Connected to Redis...');
});

// client.flushdb( function (err, succeeded) {
//   console.log(succeeded); // will be true if successfull
// });
exports.client = client;
exports.getResult_id = (roll, res, clb) => {
    var body = "__VIEWSTATE=%2FwEPDwUILTg0MjU4NzJkZL8EOn15thYAm%2BBkeKl3nNMIva19zdwLaoiAXL3GaCA%2B&__VIEWSTATEGENERATOR=DB318265&__EVENTVALIDATION=%2FwEdAAg8dzOkRxl7U%2BzAyTtYbyRXPau1mCuCtJHSVk85VtMAdDXliG498sM6kPyFRnmInPliZaJV0KqU6oRXH5%2B1i68lRXVjSn29OtWDx6WHflOXDNPJtD4x1ZskjCWlMi4OhV%2BO1N1XNFmfsMXJasjxX85jT%2BYbEjjdrfBAXWiiaimP6KoX4dTHIg%2F27cvTD9cwrWdGSZXf0JHrSNBinmgDJo3p&hdnCourse=&hdnsem=&hdnsyl=&hdnstts=&txtrollno=18624&btnSearch=Search";
        const options = {
          headers: {
            "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
            "accept-language": "en-US,en;q=0.9,hi-IN;q=0.8,hi;q=0.7",
            "cache-control": "max-age=0",
            "content-type": "application/x-www-form-urlencoded",
            "upgrade-insecure-requests": "1",
            "Referer": "https://govexams.com/knit/searchresult.aspx",
            "Referrer-Policy": "strict-origin-when-cross-origin"
          }
        };
        
    axios.post('https://govexams.com/knit/searchresult.aspx', body, options).then(result => {
        var htmlString = result.data;
        const jsdom = new JSDOM(htmlString);
         
        var element = jsdom.window.document.getElementById("ddlResult");
    
      async.map(element.childNodes,(ele, cb)=>{
           var result_id = ele.value;
           var result_name = ele.textContent;
           
           if(result_id != 0 && result_id !== undefined) {
              console.log(`HGET :-  ${roll} - ${result_id}` + client.hget(roll, result_id));
              if(!!client.hget(roll, result_id)){
                console.log(`Fetching ${roll} - ${result_id} - ${result_name}`)
               client.hmset(roll, result_id, result_name,(err)=>{if(err)console.log(err);});
               getResult_data(result_id,result_name);
               cb(null,result_id);
             }   
          }
      },(_err,_res)=>{
        if(_err){
          throw _err;
        }
        if(res)
          return res.status(200).json({message:"OK"});
        if(clb){
         clb();
         } 
       }
    )
   }).catch(function(error){
      console.log("Error = " + JSON.stringify(error));
   }); 
};

getResult_data = (rid, name)=>{
  
const options = {  
  headers: {
    "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    "accept-language": "en-US,en;q=0.9,hi-IN;q=0.8,hi;q=0.7",
    "content-type": "application/x-www-form-urlencoded",
    "Referer": "https://govexams.com/knit/searchresult.aspx",
    "Referrer-Policy": "strict-origin-when-cross-origin"
    }
};
      // console.log(i);
    axios.post(`https://govexams.com/knit/displayResultsEvenN.aspx?key=${rid}`,{}, options).then(data => {
            const htmlString = data.data;
            const jsdom = new JSDOM(htmlString);
            // let cgpa = jsdom.window.document.getElementById("lbltotlmarksDisp").textContent;
            // let status = jsdom.window.document.getElementById("lblresults").textContent;
            let table = jsdom.window.document.getElementsByTagName('table')[4];
            let tr_list = table.getElementsByTagName("tr");
            for(let tr of tr_list){
               let td_list = tr.getElementsByTagName('td');
               let dat = []
               for(let td of td_list){
                 let str = td.textContent;
                 console.log("hello", str); 
                 str = str.replace(/\s+/g,' ').trim();
                 console.log("hi",str);
                //  str = str.replace(/[ ]{0,}/,' ');
                 dat.push(str);
               }
               client.hmset(rid, dat[0], dat[1],"name", name,err => {if(err)console.log(err)});
            }
            
            
            let table1 = jsdom.window.document.getElementsByTagName('table')[2];
            tr_list1 = table1.getElementsByTagName("tr");
          
            for(let tr of tr_list1){
               let td_list = tr.getElementsByTagName('td');
               let dat1 = []
               for(let td of td_list){
                 let str = td.textContent;
                 console.log("hello", str); 
                 str = str.replace(/\s+|\:/g,' ').trim();
                 console.log("hi",str);
                 dat1.push(str);
               }
              if(dat1.length == 2){
                client.hmset(rid, dat1[0], dat1[1],(err)=>{if(err)console.log(err);});
                console.log(dat1[0], dat1[1]);
              }   
             
            }
    });
};
