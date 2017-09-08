/* standard modules */
var http = require('http'),
    fs   = require('fs'),
    qs   = require('querystring'),
    path = require('path');

/* customized modules */
var settings = require('../settings.js'),
    root     = settings.root,
    sub      = settings.sub,
    channel  = settings.channel;

var debug = false;

// create a server
const server = http.createServer(handleRequests);
server.listen(settings.port, settings.hostname, function(){
    console.log("Server is listening on port "+settings.port);
});

// mount socket.io on server 
var io = require('socket.io')(server);
io.on('connection', function(socket){
    // console.log('A user connected');
    // console.log(socket.rooms);
    socket.on('disconnect', function(){
        console.log('A user disconnected');
    });
    socket.on('msg', function(msg){
        console.log(msg);
    });
});

module.exports = {
    handleError: handleError,
    io: io
};

var db = require(settings.db);

function handleError(res){
    var route = path.join(root, "public/error.html");
    replyPage(res, route, "text/html", 404, function(){console.log("replied")});
}

// write the file with address specified by route to res
// dataType specifies the content written
function replyPage(res, route, dataType, statusCode, callback){
    if(route==undefined || dataType==undefined)
        throw new TypeError("Missing argument(s)");
    if(typeof dataType != 'string') throw new TypeError("dataType: string expected");
            // console.log("reading file", String(route));
    fs.readFile(route, function(err, data){

        if(err){
            console.log("read file error");
            var route = path.join(root, '/public/error.html');
            replyPage(res, route, "text/html", 404);
        }
        res.on('error', function(err){
            console.log('res error');
        });
        // statusCode is 200 by default
        res.statusCode = statusCode ? statusCode : 200;
        res.setHeader('content-type', dataType);
        res.write(data);
        res.end(callback);
    });
}

// handle client requests
function handleRequests(req, res){    
    
    var method = req.method,
        url    = req.url;
    
    if(debug)
        console.log("method: "+method+"\nurl: "+url);

    switch (method){
        case 'GET':
            // reply homepage
            if(url == '/' || url == 'home'){
                var route = path.join(root, 'public/index.html');
                replyPage(res, route, 'text/html');
            }
            // else if(url == '/favicon.ico'){
            //     var route = path.join(root, 'public/img/logo.svg');
            //     replyPage(route, 'image/svg+xml');
            // }
            // reply html
            else if(url.indexOf('.html') != -1){
                var route = path.join(root, url);
                replyPage(res, route, 'text/html');
            }
            // reply stylesheet
            else if(url.indexOf('.css') != -1){
                var route = path.join(root, url);
                replyPage(res, route, 'text/css');
            }
            // reply js script
            else if(url.indexOf('.js') != -1){
                var route = path.join(root,  url);
                replyPage(res, route, 'application/javascript');
            }
            // reply image
            else if(url.indexOf('.svg') != -1){
                var route = path.join(root, url);
                replyPage(res, route, 'image/svg+xml');
            }
            else if(url.indexOf('.png') != -1){
                var route = path.join(root, url);
                replyPage(res, route, 'image/png');
            }
            else if(url.indexOf('.jpg') != -1){
                var route = path.join(root, url);
                replyPage(res, route, 'image/jpeg');
            }
            // interact with db
            else if(url.indexOf('@') != -1){
                // console.log("here");
                var route = path.join(root, "/public/main.html");
                // console.log("route="+route);
                replyPage(res, route, 'text/html');
            }
            // get user info from db
            else if(url.indexOf("user.db") != -1){
                url = String(decodeURIComponent(url));
                // console.log("Decoded url:", url);
                var arr = url.split('?'),
                    account = arr[1].split('=')[1];
                // console.log(account);
                db.user(res, account);
            }
            else{ 
                console.log('To be implemented......');
            }
            break;

        case 'POST':
            // post data to db
            if(url.indexOf('.db') != -1){
                switch(url){
                    case "/register.db":
                        var body = "";
                        req.on("error", function(e){
                            handleError(res);
                        }).on("data", function(chunk){
                            body += chunk;
                        }).on("end", function(){
                            var user = JSON.parse(qs.parse(body).data);
                            console.log("user ",user);
                            res.on('error', function(err){handleError(res);});
                            db.register(res, user);
                        });
                        break;
                    case '/login.db':
                        var body = "";
                        req.on("error", function(e){
                            handleError(res);
                        }).on("data", function(chunk){
                            body += chunk;
                        }).on("end", function(){
                            var user = JSON.parse(qs.parse(body).data);
                            res.on('error', function(err){handleError(res);});
                            db.login(res, user);
                        });
                        break;
                    case '/logout.db':
                        var account = "";
                        req.on("error", function(e){
                            handleError(res);
                        }).on("data", function(chunk){
                            account += chunk;
                        }).on("end", function(){
                           res.on("error", function(e){handleError(res);});
                           db.logout(res, account);
                        });
                        break;
                    case '/contact.db':
                        var body = "";
                        req.on("error", function(e){
                            handleError(res);
                        }).on("data", function(chunk){
                            body += chunk;
                        }).on("end", function(){
                            res.on("error", function(e){handleError(res);});
                            body = JSON.parse(qs.parse(body).data);
                            console.log(body);
                            db.addContact(res, body);
                        });
                        break;
                    case '/profile.db':
                        var body = "";
                        req.on("error", function(e){
                            handleError(res);
                        }).on("data", function(chunk){
                            body += chunk;
                        }).on("end", function(){
                            res.on("error", function(e){handleError(res);});
                            body = JSON.parse(qs.parse(body).data);
                            console.log(body);
                            db.addProfile(res, body);
                        });
                        break;
                    default:
                        console.log("TBD");
                }
            }
            
            break;

        case 'PUT':
            break;
        case 'DELETE':
            break;
        default:
            break;
    }
}

// display error page

