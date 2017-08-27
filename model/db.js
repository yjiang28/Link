const mysql = require("mysql");

var con = mysql.createConnection({
	host: "localhost",
	user: "root",
	password: ""
});

con.connect(function(err){
	if(err) throw err;
	console.log("Connected to database");
	con.query("CREATE DATABASE IF NOT EXISTS users", function(err, result){
		if(err) throw err;
		console.log("Created users database");
	});
});