
var https = require("https");


//Docs for further study can be found here: https://nodejs.org/api/https.html#https_https_get_options_callback

var mynum = "+316" //replace with your own number here 


//Using http.GET (quick and dirty get)
/*https.get('https://api01.highside.net/start/SJkKzuTE?number='+mynum , function (res) {
  console.log('statusCode: ', res.statusCode);
  console.log('headers: ', res.headers);
  res.setEncoding('utf8');

  res.on('data', function (d) {
    console.log(d);
  });

}).on('error', function (e) {
  console.error(e);
});


*/




//Using https.request 
var options = {
  hostname: 'api02.highside.net',
  port: 443, //standard port for secure web browser communication
  path: '/start/SJkKzuTE?number='+mynum, //swap this for your own URL path
  method: 'GET',
  auth: 'user:password' //BASIC Authentication for (even more) security. 
};

var request = https.request(options, function (response) {
  console.log('statusCode: ', response.statusCode);
  console.log('headers: ', response.headers);
  response.setEncoding('utf8');

  response.on('data', function (d) {
    console.log(d);
  });
});
  request.end();

request.on('error', function (e) {
  console.error(e);
});




