var path = require('path'),
	redis = require('redis'),
	sub = redis.createClient(),
	pub = redis.createClient();
var root = __dirname;

module.exports = {
	// server info
    port:     3000,
    hostname: '127.0.0.1',
    // routing
    root:     root,
    server:   path.join(root, '/controller/server.js'),
    db:       path.join(root, '/model/db.js'), 
    // login & signup status
    exists:   "exists",
    nonexists:"nonexists",
    success:  "success",
    wrong_pin:"wrong pin",
    // redis clients
    sub: sub,
    pub: pub,
    // redis keyevents
    channel: "user_controller",

    user: {
        role:        '',
        status:      '',
        account:     '',
        pin:         '',

        first_name:  '',
        last_name:   '',
        
        followers:   0,
        following:  0,
        bio:         '',
        profile_pic: '',

        orders:      '',
        balance:     0 ,
        contributions: '',
        stars:       ''
    }


};