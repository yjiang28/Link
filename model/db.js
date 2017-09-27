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
client.config("SET","notify-keyspace-events", "KEA");
sub.psubscribe("__key*__:*");

(function startListen(account){
    // sub.removeListener("pmessage");
    sub.on("pmessage", function(pattern, event, key){
        // console.log("pattern",pattern);
        console.log("Event:", event);
        var cmd = event.split(":")[1];
        
        if(debug){
            console.log("Event:", event);
            console.log("Key:", key);        
            console.log("Command", cmd);
        }

        if(key.indexOf("contacts@") != -1){
            var account = key.split("@")[1];

            if(channels[account]){
                // add a new contact
                if(cmd == "zadd"){
                    client.zcard(key, function(err, num){
                        if(err) server.handleError();
                        console.log(num,"contacts");

                        client.zrange("contacts@"+account, num-1, num-1, function(err, newContact){
                            console.log("newContact:", newContact);
                            if(err) server.handleError();
                            newContact = JSON.parse(newContact);
                            console.log("emitting msg to "+account);
                            io.of("/"+account).emit("new contact", newContact.name);    
                        });    
                    });
                }
            }
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
                            console.log("newProfile:", newProfile);
                            if(err) server.handleError();
                            newProfile = JSON.parse(newProfile);
                            console.log("emitting msg to "+account);
                            io.of("/"+account).emit("new profile", newProfile.name);    
                        });    
                    });
                }
            }
        }

        // else if(key.indexOf(""))
    });
})();

module.exports = {
    login:
        function (res, user) {
            
            var account = user.account,
                pin = user.pin;
            if(debug) console.log(account, "login with pin", pin);  
            client.sismember('users', account, function(err, response){
                if(err) server.handleError(res);
                else{
                    console.log("login response", response);
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
                                                        console.log("login", settings.success);
                                                        res.write(settings.success);
                                                        res.end();                                                        
                                                        
                                                        if(!channels[account]){
                                                            io.of('/'+account).on('connection', function(socket){
                                                                if(debug) console.log(account, "established channel");
                                                                channels[account] = true;
                                                                socket.on("disconnection", function(){
                                                                    console.log("A socket at /", account, "disconnected");
                                                                });
                                                                // socket.on("send msg", function(data){
                                                                //     console.log("send msg",data);
                                                                // });
                                                            });
                                                        }
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
                    "unread_msg",           0
                );
        
                res.write(settings.success);
                res.end();
                return;
            });
        },

    logout: 
        function(res, account){
            if(debug) console.log("logout");
            client.hmset(account, "status", "logout", function(err, response){
                if(err) server.handleError();
                else{
                    channels[account] = false;
                    res.setHeader("Content-type", "text/plain");
                    res.setHeader('Set-Cookie', [
                        'account=', 
                        'first_name=',
                        'last_name=',
                        'pin=',
                        'bio=',                                                     
                        'following=',
                        'followers=',
                        'profile_pic=',
                        'timestamp=',
                        'path=/',
                        'expires=Thu, 01 Jan 1970 00:00:00 GMT'
                    ]);
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
                    client.hmget(account, "first_name", "last_name", "profile_pic", "unread_msg", function(err, response){
                        client.smembers(String("profileNames@"+account), function(err, profiles){
                            client.smembers(String("contactNames@"+account), function(err, contacts){
                                // console.log("profiles: "+profiles+"\ncontacts: "+contacts);
                                var result = {
                                    account: account,
                                    first_name: response[0],
                                    last_name: response[1],
                                    profile_pic: response[2],
                                    unread_msg: response[3],
                                    profiles: profiles,
                                    contacts: contacts
                                };
                                if(debug) console.log("result:", result);
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
            
            client.sismember("users", destUser, function(err, response){
                var obj = {};
                // destUser exists in users db
                if(response == 1){
                    if(debug) console.log("destUser exists in users db");
                    client.sadd("contactNames@"+srcUser, destUser, function(err, response){
                        if(err) server.handleError();
                        // destUser is already in srcUser's contact list 
                        if(response == 0){
                            if(debug) console.log("duplicate contact");
                            obj.status = settings.exists;
                        }else{
                            if(debug) console.log("new contact");
                            obj.status = settings.success;
                            client.sadd("contactNames@"+destUser, srcUser); 
                            client.zcard("contacts@"+srcUser, function(err, index){
                                console.log("Index", index);
                                client.zadd("contacts@"+srcUser, index, JSON.stringify({name:destUser,profile:"public"}));
                            });
                            client.zcard("contacts@"+destUser, function(err, index){
                                console.log("Index", index);
                                client.zadd("contacts@"+destUser, index, JSON.stringify({name:srcUser,profile:"public"}));
                            });                            
                        }

                        client.hmget(destUser, "first_name", "last_name", "profile_pic", "bio", function(err, response){
                            if(err) handleError();
                            obj.content = {
                                account: destUser,
                                first_name: response[0],
                                last_name: response[1],
                                profile_pic: response[2],
                                bio: response[3]
                            };
                            console.log("Targeted contact info:", obj);
                            res.setHeader("content-type", "application/json");
                            res.write(JSON.stringify(obj));
                            res.end();
                        });                   
                    });
                }

                // if user doesn't exist in users db
                else{
                    obj.status = settings.nonexists;
                    res.setHeader("content-type", "application/json");
                    res.write(JSON.stringify(obj));
                    res.end();
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
        },

    addMsg:
        function(res, data){
            var srcUser = data.srcUser,
                destUser = data.destUser,
                msg = data.msg;

            client.sadd("msgNames@"+srcUser, destUser, function(err, response){
                
            });
            client.zcard("msg@"+srcUser, function(err, index){
                client.zadd("msg@"+srcUser, index, destUser)    
            })
            
            res.write(settings.success);
            res.end();

        }
}
