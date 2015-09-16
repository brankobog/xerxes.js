var express = require('express');
var app = express();

app.get('/', function (req, res) {
	res.send('TEST TEST TEST');
});

var server = app.listen(3001, function() {
	var host = server.address().addres;
	var port = server.address().port;

	console.log('Listening at http://%s:%s', host, port);
});
