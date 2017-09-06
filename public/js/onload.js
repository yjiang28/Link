var getCookie = function(attr){
    var arr = document.cookie.split('; '), i;
    for(i=0;arr[i]!=undefined;i++){
        if(arr[i].indexOf(attr+'=') != -1){
            arr = arr[i].split('=');
            return arr[1];
        }
    }
    return undefined;
};

var removeCookies = function(){
    var arr = document.cookie.split("; "), i;
    for(i=0;arr[i]!=undefined;i++){
        var parts = arr[i].split("=");
        document.cookie = parts[0]+"=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
}

$('document').ready(function(){

    var exists = "exists",
        nonexists = "nonexists",
        success = "success",
        wrong_pin = "wrong pin",
        baseURL = 'http://localhost:3000/';
    
    var socket;

	// check if document cookie is set
	if(document.cookie.indexOf("account") !=-1){
		var user = {
			account: getCookie("account"),
			pin: getCookie("pin")
		};
		$.post('/login.db',
            {
                data: JSON.stringify(user),
                contentType: "application/json",
                dataType: "text"
            },
            function (response) {
                if (response == success){
                    window.location = "http://localhost:3000/@"+user.account;
                    // socket = io('/'+user.account);
                }
                else{
                    removeCookies();
                    socket = io();
                }
            });
	}
    else{
        socket = io();
    }
})