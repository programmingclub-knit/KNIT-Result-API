const axios = require("axios");
const e = require("express");
const { JSDOM } = require('jsdom');

const redis = require('redis');

// Create Redis Client
let client = redis.createClient();
client.on('connect', function(){
  console.log('Connected to Redis...');
});

exports.client = client;
exports.getResult_id = (roll, res) => {
    var body = `__VIEWSTATE=%2FwEPDwUILTg0MjU4NzIPZBYCAgMPZBYCAg0PEGQQFQQMLS0tU0VMRUNULS0tHlJFR1VMQVIgKDIwMjAtMjEpIFNlbWVzdGVyIDUtNh5SRUdVTEFSICgyMDE5LTIwKSBTZW1lc3RlciAzLTQeUkVHVUxBUiAoMjAxOC0xOSkgU2VtZXN0ZXIgMS0yFQQBMAUyNjQ2NAUyMjU4NwUxMzg2MhQrAwRnZ2dnZGRkT0Fi%2FBERAbi1uwskxzG%2BlLAJtOtXGEHHfX6ZE3nmBZk%3D&__VIEWSTATEGENERATOR=DB318265&__EVENTVALIDATION=%2FwEdAAxFDxZsB7U7Mr0OMg2h7n7UPau1mCuCtJHSVk85VtMAdDXliG498sM6kPyFRnmInPliZaJV0KqU6oRXH5%2B1i68lRXVjSn29OtWDx6WHflOXDNPJtD4x1ZskjCWlMi4OhV%2BO1N1XNFmfsMXJasjxX85jwWQRnAmXw%2F6HLW40JR6%2F6m7T4XcIIkhMxHxZFaWqrZ7vUYtVl4HZU8C7SmoRKtLik2NTAc7tYwQ6Dz2X5p%2BJt0%2FmGxI43a3wQF1oomopj%2BhwFUnRqpCBQzeo3%2B%2B1zmpQf3%2B17nV%2FdYRVF%2FCz9tfZDw%3D%3D&hdnCourse=04&hdnsem=1&hdnsyl=G&hdnstts=PASS&txtrollno=${roll}&btnSearch=Search&ddlResult=0`;
        const options = {
          headers: {
            "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
            "accept-language": "en-US,en;q=0.9",
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
        var result = []; // One time all sessions result 
        for(var i = 1; ; i++){  // this loop fetch session wise results
         var element = jsdom.window.document.getElementById("ddlResult");
         
         if(element[i] === undefined) break;
         client.sadd([roll, element[i].value],(err,reply)=>{
             console.log(reply);
         });
         var result_id = element[i].value;
         var result_name = element[i].textContent;
         var sess = {};
         sess = {result_id: result_id, result_name: result_name};
         result.push(sess);      
         client.sadd([roll, result_id],(err,reply)=>{
              console.log(reply);
         });
      }   
        results[roll] = result;
        // console.log(results);
        // console.log("ID and Name stored");
    }).then(()=>{
             
            results[roll].forEach((element,i) => {
                getResult_data(roll,i);
            });
            // console.log("display");
            // setTimeout(()=>{
            //   res.send(results);
            // }, 2000);
            res.send(results);
        });
};
getResult_data = (roll,i)=>{
    const options = {
        headers: {
          "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
          "accept-language": "en-US,en;q=0.9",
          "content-type": "application/x-www-form-urlencoded",
          "Referer": "https://govexams.com/knit/searchresult.aspx",
        }
      };  
      // console.log(i);
    axios.post(`https://govexams.com/knit/displayResultsEvenN.aspx?key=${results[roll][i]["result_id"]}`,{}, options).then(data => {
            const htmlString = data.data;
            const jsdom = new JSDOM(htmlString);
            // let cgpa = jsdom.window.document.getElementById("lbltotlmarksDisp").textContent;
            // let status = jsdom.window.document.getElementById("lblresults").textContent;
            let table = jsdom.window.document.getElementsByTagName('table')[4];
            let tr_list = table.getElementsByTagName("tr");
            let arr = []
            for(let tr of tr_list){
               let td_list = tr.getElementsByTagName('td');
               let dat = []
               for(let td of td_list){
                 let str = td.textContent;
                 console.log("hello", str); 
                 str = str.replace(/\s+/g,' ');
                 console.log("hi",str);
                //  str = str.replace(/[ ]{0,}/,' ');
                 dat.push(str);
               }
               client.hmset(results[roll][i]["result_id"], dat[0], dat[1],"name", results[roll][i]["result_name"] );
               arr.push(dat);
            }
            results[roll][i]['result'] = {
               data : arr
            };
            
            let table1 = jsdom.window.document.getElementsByTagName('table')[2];
            tr_list1 = table1.getElementsByTagName("tr");
            arr1 = []
            for(let tr of tr_list1){
               let td_list = tr.getElementsByTagName('td');
               let dat1 = []
               for(let td of td_list){
                 let str = td.textContent;
                 console.log("hello", str); 
                 str = str.replace(/\s+|\:/g,' ').trim();
                 console.log("hi",str);
                //  str = str.replace(/[ ]{0,}/,' ');
                 dat1.push(str);
               }
              if(dat1.length == 2){
                client.hmset(results[roll][i]["result_id"], dat1[0], dat1[1]);
                console.log(dat1[0], dat1[1]);
              }   
              arr1.push(dat1);
            }
            console.log("Data stored");
    });
};