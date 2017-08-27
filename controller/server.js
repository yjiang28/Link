var http = require("http"),
	fs = require('fs'),
	path = require('path'),
	settings = require("../settings"),
	socketio = require("socket.io"),
	mysql = require("mysql"),
	db = require("../model/db.js"),
	root = settings.root;

const server = http.createServer(handleRequest);
server.listen(settings.port, settings.host, function(){
	console.log("Server is listening to", settings.host, ":", settings.port);
});

const io = socketio(server);
io.on('connection', function(socket){
	console.log("A user connected");

	socket.on("msg", function(msg){
		console.log(msg);
	});

	socket.on('disconnection', function(){
		console.log("A user disconnected");
	});
});

const connnection = mysql.createConnection(function(err){
	if(err){
		console.log("Create connection for mysql db failed");
		return;
	}
	console.log("mysql is set up with id", connection.threadId);
});

function handleRequest(req, res){

	var replyPage = function(route, dataType, statusCode, callback){
		if(route==undefined || dataType==undefined) 
			throw new TypeError("Missing argument(s)");
		if(typeof dataType !== "string")
			throw new TypeError("String dataType expected");
		fs.readFile(route, function(e, data){
			if(e){
				console.log("Error reading file");
				return;
			}
			res.on("error", function(){
				console.log("Res error");
			});
			res.statusCode = statusCode ? statusCode: 200;
			res.setHeader("Content-Type", dataType);
			res.write(data);
			res.end(callback);
		});
	}

	var method = req.method,
		url = req.url;
	console.log(method, url);

	switch(method){
		case "GET":
			if(url=="/"){
				var route = path.join(root, '/public/index.html');
				replyPage(route, "text/html");
			}
			// reply html
            else if(url.indexOf('.html') != -1){
                var route = path.join(root, url);
                replyPage(route, 'text/html');
            }
            // reply stylesheet
            else if(url.indexOf('.css') != -1){
                var route = path.join(root, url);
                replyPage(route, 'text/css');
            }
            // reply js script
            else if(url.indexOf('.js') != -1){
                var route = path.join(root,  url);
                replyPage(route, 'application/javascript');
			}
			// reply image
            else if(url.indexOf('.svg') != -1){
                var route = path.join(root, url);
                replyPage(route, 'image/svg+xml');
			}
			break;
		default: 
			console.log("To be implemented");
			break;
	}
}