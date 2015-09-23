var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var path = require('path');
var fs = require('fs');
var exec = require('child_process').exec;
var util = require('util');

app.use(express.static(path.join(__dirname, 'public')));

server.listen(3001, function() {
	var host = server.address().address;
	var port = server.address().port;

	console.log('Listening at http://%s:%s', host, port);
});

app.get('/', function (req, res) {
	res.sendFile(path.join(__dirname, 'public/index.html'));
});

var files = {};

io.on('connection', function (socket) {
	console.log("socket.io: established connection with " + socket.request.connection.remoteAddress);

	socket.on('disconnect', function (socket) {
		console.log("socket.io: closed connection");
	});

	var chunkSize = 524288; // 0.5 MB


	var BUFF_SIZE = 10485760; // 10 MB buffer size, TODO: increase

	socket.on("start", function(data) {
		console.log(data["name"]);
		var name = data["name"];
		files[name] = {
			fileSize  : data['size'],
			data	  : "",
			dowloaded : 0
		}
		var cursor = 0;
		try {
			var stat = fs.statSync("temp/" + name);
			if (stat.isFile()) {
				files[name]["dowloaded"] = stat.size;
				cursor = stat.size/chunkSize; // half-megabyte
			};
		} catch(err) {}
		fs.open("temp/" + name, "a", 0755, function(err, fd) {
			if (err) {
				console.log(err);
			} else {
				files[name]["handler"] = fd;
				io.emit("moreData", {"cursor": cursor, "percent": 0});
			}
		});
	});
	socket.on("upload", function(data) {
		var name = data["name"];
		files[name]["dowloaded"] = data.length;
		files[name]["data"] += data["data"];
		if (files[name]["data"] == files[name]["fileSize"]) {
			fs.write(files[name]["handler"], files[name]["data"],
					 null, 'Binary', function(err, written) {
					 	//end of writing
					 });
		} else if (files[name]["data"] > BUFF_SIZE) {
			fs.write(files[name]["handler"], files[name]["data"],
					 null, 'Binary', function(err, written) {
					 	files[name]["data"] = "";
					 	var cursor  =  files[name]["downloaded"] / chunkSize;
					 	var percent = (files[name]["downloaded"] / files[name]["fileSize"]) * 100;
						io.emit('moreData', {"cursor": cursor, "percent": 0});
					 })
		} else {
		 	var cursor  =  files[name]["downloaded"] / chunkSize;
		 	var percent = (files[name]["downloaded"] / files[name]["fileSize"]) * 100;
			io.emit('moreData', {"cursor": cursor, "percent": 0});
		}
	});
});

process.on('SIGINT', function() {
    console.log('SIGINT');
    process.exit();
});

console.log('PID: ', process.pid);



