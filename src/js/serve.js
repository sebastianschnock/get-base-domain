var express = require('express');
var app = express();

app.use(express.static(__dirname + '/../../dist'));

console.log('Up and running under 127.0.0.1:3000');
app.listen(3000);