var settings = require('../settings.js'),
    server   = require(settings.server),
    io       = server.io,
    redis    = require('redis'),
    client   = redis.createClient(),
    sub      = settings.sub;
    path     = require('path');

var debug = true;

var channels = {}; 
// enable keyspace event notification
client.config("SET","notify-keyspace-events", "EA");
sub.psubscribe("__key*__:*");

(function startListen(account){
    // sub.removeListener("pmessage");
    sub.on("pmessage", function(pattern, event, key){
        // console.log("pattern",pattern);
        console.log(event);
        var cmd = event.split(":")[1];
        
        if(debug){
            console.log("Event:", event);
            console.log("Key:", key);        
            console.log("Command", cmd);
        }

        if(key.indexOf("contacts@") != -1){
            var account = key.split("@")[1];
            io.of("/"+account).emit("new contact", account);
        }

        else if(key.indexOf("profiles@") != -1){
            var account = key.split("@")[1];

            // if this account is already registered in channels
            if(channels[account]){
                // add a new profile
                if(cmd == "zadd"){
                    client.zcard(key, function(err, num){
                        if(err) server.handleError();
                        console.log(num,"profiles");

                        client.zrange("profiles@"+account, num-1, num-1, function(err, newProfile){
                            console.log(newProfile);
                            if(err) server.handleError();
                            newProfile = JSON.parse(newProfile);
                            console.log("emitting msg to "+account);
                            io.of("/"+account).emit("new profile", newProfile.name);    
                        });    
                    });
                }
            }
        }
    });
})();

module.exports = {
    login:
        function (res, user) {
            if(debug) console.log("login");
            var account = user.account,
                pin = user.pin;
            client.sismember('users', account, function(err, response){
                if(err) server.handleError(res);
                else{
                    res.statusCode = 200;
                    res.setHeader('Content-type', 'text/plain');
                    // if the account doesn't exist
                    if(response == 0){
                        res.write(settings.nonexists);
                        res.end();
                        return;
                    }
                    // compare password
                    client.hmget(account, "pin", function(err, pinValue){
                        if(err) server.handleError(res);
                        else{
                            if(pin.toString() === pinValue[0]){
                                client.hmset(account, "status", "login", function(err){
                                    if(err) server.handleError(res);
                                    else{
                                        // upon receiving the response, document.cookie is set to this cookie
                                        client.hmget(account, "first_name", "last_name", "pin", "bio", /*"following", "followers",*/ "profile_pic", function(err, response){
                                            if(err) server.handleError(res);
                                            else{
                                                client.scard("following@"+account, function(following){
                                                    client.scard("followers@"+account, function(followers){
                                                        // console.log(name);
                                                        res.setHeader('Set-Cookie', [
                                                            'account='+account, 
                                                            'first_name='+response[0],
                                                            'last_name='+response[1],
                                                            'pin='+response[2],
                                                            'bio='+response[3],                                                     
                                                            'following='+following,
                                                            'followers='+followers,
                                                            'profile_pic='+response[4],
                                                            'timestamp='+new Date().getTime()/1000  // the seconds since midnight Jan 1st 1970
                                                        ]);
                                                        res.write(settings.success);
                                                        res.end();                                                        
                                                        
                                                        io.of('/'+account).on('connection', function(socket){
                                                            if(debug) console.log(channels[account]);
                                                            channels[account] = true;
                                                            socket.on("disconnection", function(){
                                                                console.log("A socket at /", account, "disconnected");
                                                            });
                                                        });
                                                    });
                                                });
                                                
                                            }
                                        });                                
                                    }
                                });
                                
                            }else{
                                res.write(settings.wrong_pin);
                                res.end();
                                return;
                            }
                        }
                    });
                }
            });
        },

    register:
        function(res, user){
            var account = user['username'],
                email = user['email'].toLowerCase(),
                first_name = user['first_name'][0].toUpperCase() + user['first_name'].slice(1),
                last_name = user['last_name'][0].toUpperCase() + user['last_name'].slice(1),
                pin = user['pin'];

            console.log(account);
            console.log(user.pin);
            client.sismember('users', account, function(err, response){
                res.statusCode = 200;
                res.setHeader('Content-type', 'text/plain');
                // account already exists
                if(response != 0){
                    res.write(settings.exists);
                    res.end();
                    return;
                }
                client.sadd("users", account);
                client.hmset(
                    account, 

                    "email",         email,
                    "role",          'user',
                    "status",        'logout',
                    "pin",           pin,

                    "first_name",    first_name,
                    "last_name",     last_name,
                    
                    "bio",           '',
                    "profile_pic",   '/public/img/user.svg',

                    "orders",        '',
                    "balance",       0 ,
                    "contributions", '',
                    "stars",         ''
                );
        
                res.write(settings.success);
                res.end();
                return;
            });
        },

    logout: 
        function(res, account){
            client.hmset(account, "status", "logout", function(err, response){
                if(err) server.handleError();
                else{
                    channels[account] = false;
                    res.setHeader("Content-type", "text/plain");
                    res.write(settings.success);
                    res.end();
                    return;
                }
            });
        },

    user:
        function(res, account){
            if(debug) console.log("get user info");
            client.sismember('users', account, function(err, response){
                // if account doesn't exist
                if(response == 0){
                    console.log("User doesn't exist");
                    // server.handleError(res);
                    res.statusCode = 404;
                    res.setHeader("content-type", "text/plain");
                    res.write(settings.nonexists);
                    res.end();
                    return;
                }
        
                else{
                    client.hmget(account, "first_name", "last_name", "profile_pic", function(err, response){
                        client.smembers(String("profileNames@"+account), function(err, profiles){
                            client.smembers(String("contactNames@"+account), function(err, contacts){
                                // console.log("profiles: "+profiles+"\ncontacts: "+contacts);
                                var result = {
                                    account: account,
                                    first_name: response[0],
                                    last_name: response[1],
                                    profile_pic: response[2],
                                    profiles: profiles,
                                    contacts: contacts
                                };
                                if(debug) console.log(result);
                                res.setHeader("content-type", "application/json");
                                res.write(JSON.stringify(result));
                                res.end();
                            });
                        });
                    });
                }
            });
        },

    addContact:
        function(res, data){

            var srcUser = data.srcUser,
                destUser = data.destUser;
            
            client.sadd("contactNames@"+srcUser, destUser, function(err, response){
                if(err) server.handleError();
                if(response == 0){
                    res.write(settings.exist);
                    res.end();
                }else{
                    client.sadd("contactNames@"+destUser, srcUser, function(err, response){
                        if(err) server.handleError();
                        if(response == 0){
                            res.write(settings.exist);
                            res.end();
                        }else{
                            res.write(settings.success);
                            res.end();
                        }
                    });
                }
            });
        },

    addProfile:
        function(res, data){
            if(debug) console.log("addProfile");
            var account = data.account,
                profile = data.profile;  
            
            // specified members that are already a member of the set are ignored. 
            client.sadd("profileNames@"+account, profile.name, function(err, response){
                if(err){
                    console.log("error");
                    server.handleError();
                }
                else if(response == 0){
                    res.write(settings.exist);
                    res.end();
                    console.log("profile exists");
                }else{
                    client.zcard("profiles@"+account, function(err, index){
                        console.log("index", Number(index));
                        client.zadd("profiles@"+account, index, JSON.stringify(profile), function(err, response){
                            if(err) server.handleError(res);
                            res.write(settings.success);
                            res.end();
                        });  
                    });
                }
            });
        }
}
