var express = require("express");
var app = express();
var server = require("http").Server(app);
var io = require("socket.io")(server);
var path = require("path");
var fs = require("fs");
var exec = require("child_process").exec;
var util = require("util");

app.use(express.static(path.join(__dirname, "public")));

server.listen(3001, function() {
	var host = server.address().address;
	var port = server.address().port;

	console.log("Listening at http://%s:%s", host, port);
});

app.get("/", function (req, res) {
	res.sendFile(path.join(__dirname, "public/index.html"));
});

var files = {};

//var chunkSize = 524288; // 0.5 MB
var chunkSize = 4096; // 4 KB
//var chunkSize = 10; // 10 B

io.on("connection", function (socket) {
	console.log("socket.io: established connection with " + socket.request.connection.remoteAddress);

	socket.on("disconnect", function (socket) {
		console.log("socket.io: closed connection");
	});

	var BUFF_SIZE = 10485760; // 10 MB buffer size, TODO: increase

	socket.on("start", function(received) {
		var name = received.name;
		files[name] = {
			fileSize   : received["size"],
			data	   : "",
			handler	   : null
		}
		fs.open("temp/" + name, "a", 0755, function(err, fd) {
			if (err) {
				console.log(err);
			} else {
				fs.truncate("temp/" + name, 0, function() {
					console.log("created file " + name);
					files[name].handler = fd;
					io.emit("moreData", {cursor: 0, percent: 0});
				});
			}
		});
	});
	socket.on("upload", function(received) {
		var name = received.name;
		files[name].data += received.data;
		if (files[name].data.length == files[name].fileSize) {
			fs.write(files[name].handler, files[name].data,
					 null, "Binary", function(err, written) {
					 	console.log("writing " + name);
					 });
			fs.close(files[name].handler, function(err, written) {
					 	console.log("closed " + name);
					 });
		} else if (files[name].data.length > BUFF_SIZE) {
			fs.write(files[name].handler, files[name].data,
					 null, "Binary", function(err, written) {
					 	files[name].data = "";
					 })
		}
	 	var cursor  =  files[name].data.length;
	 	var percent = (files[name].data.length / files[name].fileSize) * 100;
		io.emit("moreData", {cursor: cursor, percent: percent}); 
	});
});

process.on("SIGINT", function() {
    console.log("SIGINT");
    process.exit();
});

console.log("PID: ", process.pid);
 
