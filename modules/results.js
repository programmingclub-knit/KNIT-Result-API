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
         
        var element = jsdom.window.document.getElementById("ddlResult");
    
      async.map(element.childNodes,(ele, cb)=>{
           var result_id = ele.value;
           var result_name = ele.textContent;
           if(result_id != 0 && result_id !== undefined)  {
              client.hmset(roll, result_id, result_name,(err)=>{if(err)console.log(err);});
              getResult_data(result_id,result_name);
              cb(null,result_id);
          }
      },(err,res)=>{
        
      }
    )
     if(res)
      return res.status(200).json({message:"OK"});
      if(clb){
        setTimeout(clb,1000);
      } 
   }); 
};

getResult_data = (rid, name)=>{
    const options = {
        headers: {
          "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
          "accept-language": "en-US,en;q=0.9",
          "content-type": "application/x-www-form-urlencoded",
          "Referer": "https://govexams.com/knit/searchresult.aspx",
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