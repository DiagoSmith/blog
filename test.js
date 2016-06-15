var https = require("https");
var ssl = require('ssl-root-cas');
var http = require('http');

//ssl.inject();

/*https.get('https://api01.highside.net/start/SJkKzuTE?user=DiagoSmith', (res) => {
  console.log('statusCode: ', res.statusCode);
  console.log('headers: ', res.headers);

  res.on('data', (d) => {
    process.stdout.write(d);
  });

}).on('error', (e) => {
  console.error(e);
});
*/
var mynum = "+31636318089"
http.get('http://api01.highside.net/start/SJkKzuTE?number='+ mynum, (res) => {
  console.log('statusCode: ', res.statusCode);
  console.log('headers: ', res.headers);
  console.log(res.body); 

  res.on('data', (d) => {
    process.stdout.write(d);
  });

}).on('error', (e) => {
  console.error(e);
});