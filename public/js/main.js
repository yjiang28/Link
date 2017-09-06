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


// There are two ways to access a user profile from a client.
// 1. Access by clicking "profile" button.
//    This allows a user to see s/he own profile.
//    Pushstate should be done when clicking on the button.
// 2. Access by inputting the url to the address bar.
//    In this case, a user can see any existing users' profiles.
//    Pushstate is not needed as the state is inserting into history automatically.
// In both cases, the server first returns the html page, which also loads the script file.
// On loading, the script file will request user info from the database and injecting corresponding data into proper places.

$(document).ready(function() {
    if(isLoaded()) return;

    var exists = "exists",
        nonexists = "nonexists",
        success = "success",
        wrong_pin = "wrong pin";

    var url = String(window.location);
    var arr = url.split('@'),
        content = arr[1].split("/"),
        account = content[0],
        target  = content.length>1 ? content[1]: null,
        user = {},  // user is the owner of this profile, s/he may or may not logged in on the current browser.
        newProfile = {};

    // insert user info by requesting data from db
    $.get('/user.db', {account: account}, function(user){

        $(".header").text(user.first_name+" "+user.last_name);
        
        user.profiles.map(function(elem){
            elem = JSON.parse(elem);
            var url = "/@"+account+"?profile="+elem.name;
            $(".profiles").append('<div class="btn"><a href=' + url + '>' + elem.name + '</a></div>');
        });
        user.contacts.map(function(elem){
            elem = JSON.parse(elem);
            var url = "/@"+account+"?contact="+elem.name;
            $(".contacts").append('<div class="btn"><a href=' + url + '>' + elem.name + '</a></div>');
        });

        var socket = io('/'+user.account);
        socket.on("new profile", function(data){
            var url = "/@"+account+"?contact="+data;
            $(".profiles").append('<div class="btn"><a href=' + url + '>' + data + '</a></div>');
        });

    }).fail(function(){
        $('body').load('/public/error.html');
    });


    window.onpopstate = function(event){
        // alert("from profile page");
        // alert("location: " + document.location + ", state: " + event.state.src);
        var src = event.state.src;
        $('body').load(src);
    }

    $(".modal").css("display", "none");

    $(".newProfile-btn").on("click", function(){
        window.location = "http://localhost:3000/@"+getCookie("account")+"/buildProfile";
    });

    if(target == "buildProfile"){
        $(".modal").css("display", "flex");
        $(".dd").css("display", "none");
    }

    $('.newProfile-modal form').submit(function(e){
        e.preventDefault();
        newProfile = {};
        $(this).serializeArray().map(function(elem){
            newProfile[elem.name] = elem.value;
        });

        $.post("/profile.db", 
            {
                data: JSON.stringify({
                    account: getCookie("account"),
                    profile: newProfile
                }),
                dataType: "application/json"
            },
            function(response){
                if(response == success){
                    $(".profiles").append('<div class="btn">'+newProfile.name+'</div>');
                }
            });
    });

    $('.navbar-v').on('click', ".logout-btn", function(e){
        e.preventDefault();
        $.post("/logout.db",
            {
                data: getCookie("account"),
                ContentType: "text/plain",
                dataType: "text"
            }, 
            function(response){
                //TODO: handle response and setCookie logout attribute
                if(response == success) removeCookies();
                $('html').html('');
                $('body').load('/');
            }
        );
    });

    /* when the selected file is changed, that is, when a file is submitted */
    $('.profile-pic input').on('change', function(e){
        var file = $('.profile-pic input')[0].files[0];
        var readerPreview = new FileReader(),
            readerDb = new FileReader();

        readerPreview.onloadend = function(event){           
            var url = readerPreview.result;
            $('.profile-pic img')[0].src = url;
        };

        readerPreview.onerror = function(event) {
            console.error("File could not be read! Code " + event.target.error.code);
        };

        readerDb.onloadend = function(event){
            var ab = readerDb.result;
            var s = String.fromCharCode.apply(null, new Uint16Array(ab));
            newProfile["profile-pic"] = s;
        }

        readerDb.onerror = function(event) {
            console.error("File could not be read! Code " + event.target.error.code);
        };

        readerPreview.readAsDataURL(file);
        readerDb.readAsArrayBuffer(file);
    });
});