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

    var exists = "exists",
        nonexists = "nonexists",
        success = "success",
        wrong_pin = "wrong pin";

    // alert(document.cookie);
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
                }else{
                    removeCookies();
                }
            }
        );
    }

    else{
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
        var checked = "intro";
        $(".login-modal").css("display", "none");
        $(".register-modal").css("display", "none");

        $('.login-btn').on('click', function(){
            if(checked == "register"){
            	$('.login-modal').css("display", "flex");
            	$('.register-modal').css("display", "none");
            	checked = "login";
            }
            else if(checked == "intro"){
                $('.login-modal').css("display", "flex");
                $('.intro-modal').css("display", "none");
                checked = "login";
            }
        });

        $('.register-btn').on('click', function(){
            if(checked == "login"){
            	$('.register-modal').css("display", "flex");
            	$('.login-modal').css("display", "none");
            	checked = "register";
            }
            else if(checked == "intro"){
                $('.register-modal').css("display", "flex");
                $('.intro-modal').css("display", "none");
                checked = "register";
            }
        });

        $('.logo-btn').on('click', function(){
            if(checked == "login"){
                $('.intro-modal').css("display", "flex");
                $('.login-modal').css("display", "none");
                checked = "intro";
            }
            else if(checked == "register"){
                $('.intro-modal').css("display", "flex");
                $('.register-modal').css("display", "none");
                checked = "intro";
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
                    alert(response);
                    if (response == success){
                        window.location = "http://localhost:3000/@"+user.account;
                    }
                    else {
                        $(".login-modal .error-msg").css("display", "initial");
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
                    if (response == exists) {
                        // select email input
                        $('.register-modal .error-msg').css("display", "initial");
                    }
                    else if (response == success) {
                        $('.login-btn').click();
                        $('.register-modal input:not(input[type="submit"])').val("");
                        $('.login-modal input:not(input[type="submit"])').val("");

                    }
                }
            );
        });
    }

});