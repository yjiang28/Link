// prevent from loading the script multiple times
var glob = {};

// returns true if the bindings have already been loaded
// if not then sets the binding
var isLoaded = function(){
    var result = true;
    // the script has not been loaded yet
    if(!glob.isLoaded) result = false;
    // now that the script is going to be loaded
    glob.isLoaded = true;
    return result;
};

var getCookie = function(attr){
    if(!document.cookie) return undefined;
    var arr = document.cookie.split('; '), i;
    for(i=0;arr[i]!=undefined;i++){
        if(arr[i].indexOf(attr+'=') != -1){
            arr = arr[i].split('=');
            return arr[1];
        }
    }
    return undefined;
};

var setCookie = function(key, value){
    var c = document.cookie;
    var index = c.indexOf(key+'=');
    if(index != -1){
        var sub1 = c.substring(0, index);
        var sub2 = c.substring(index);
        var index2 = sub2.indexOf('; ')+2;
        document.cookie = sub1+sub2.substring(index2)+key+"="+value;
    }
    else document.cookie = c+key+"="+value;
}

var removeCookies = function(){
    var arr = document.cookie.split("; "), i;
    for(i=0;arr[i]!=undefined;i++){
        var parts = arr[i].split("=");
        document.cookie = parts[0]+"=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
}

$(document).ready(function() {
    if(isLoaded()) return;
    // alert(document.cookie);

    var exists = "exists",
        nonexists = "nonexists",
        success = "success",
        wrong_pin = "wrong pin";

    var history = window.history;
    var stateObj = {
        title: 'home',
        src: '/'
    }   
    history.pushState(stateObj, 'home', '/');

    window.onpopstate = function(event){
        alert("from home page");
        alert("location: " + document.location + ", state: " + JSON.stringify(event.state));
        var src = event.state.src;
        if(src.indexOf('@') != -1)
            $('.profile-btn').click();
        else if(src == '/')
            $('body').load('/');
    }

    /* ONCLICK ACTIONS WITH NO COMMUNICATION WITH DATABASE */

    /* MODAL */
    $('.logo-btn').on('click', function(){
        $(".login-modal").css("visibility", "hidden");
        $(".register-modal").css("visibility", "hidden");
        $(".intro").css("visibility", "visible");
    });

    var checked = "login";
    $(".register-modal").css("display", "none");

    $('.login-btn').on('click', function(){
        if(checked != "login"){
        	$('.login-modal').toggle("slow", "swing");
        	$('.register-modal').toggle("slow", "swing");
        	checked = "login";
        }
    });

    $('.register-btn').on('click', function(){
        if(checked != "register"){
        	$('.register-modal').toggle("slow", "swing");
        	$('.login-modal').toggle("slow", "swing");
        	checked = "register";
        }
    });


    /* ONCLICK ACTIONS WITH COMMUNICATION WITH DATABASE */

    $('.login-modal > form').submit(function(event){
        event.preventDefault();
        var user = {};
        $(this).serializeArray().map(function(elem){
            user[elem.name] = elem.value;
        });
        
        $.post('/login.db',
            {
                data: JSON.stringify(user),
                contentType: "application/json",
                dataType: "text"
            },
            function (response) {
                if (response == success){
                    window.location = "http://localhost:3000/@"+user.account;
                }
                else {
                    $(".login-modal>.error-msg").text("* This account doesn't exist or the password is wrong");
                }
            });
    });

    $('.register-modal > form').submit(function(event){
        event.preventDefault(); // prevent from submitting the form normally, i.e. without AJAX.
        var user = {};
        $(this).serializeArray().map(function(elem) {
            user[elem.name] = elem.value;
        });
        $.post('/register.db',
            {
                data: JSON.stringify(user),
                contentType: "application/json",
                dataType: "text"
            },
            function (response) {
                // alert(response);
                if (response == exists) {
                    // select email input
                    $('.register-modal .error-msg').css("display", "initial");
                }
                else if (response == success) {
                    $('login-btn').click();
                    $(".login-btn").text("Proceed to login");   // modify the login button text
                }
            });
    });
});