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
        document.cookie = parts[0]+"=; "; 
    }
    document.cookie += "expires=Thu, 01 Jan 1970 00:00:00 GMT";
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
        wrong_pin = "wrong pin",
        root = "http://localhost:3000/",
        socket;

    var url = String(window.location);
    var arr = url.split('@'),
        content = arr[1].split("/"),
        account = content[0],
        target  = content.length>1 ? content[1]: null,
        newProfile = {};

    var user = {
        account: getCookie("account"),
        pin: getCookie("pin")
    };

    if(account == user.account){
        $.post('/login.db',
            {
                data: JSON.stringify(user),
                dataType: "application/json",
                contentType: "text"
            },
            function (response) {
                if (response == success){
                    insertInfo();
                    initLayout();
                    initAnimation();
                    initAction();
                }
                else{
                    window.location = root;
                    removeCookies();
                }
            }
        );
    }
    else{
        window.location = root;
    }

    function displayModal(modal, mode){
        var modals = ["newProfile-modal", "newContact-modal", "chat-modal"];
        if(typeof modal != "string" || typeof mode != "string") 
            throw new TypeError("displayModal method accepts only string inputs");
        modals.map(function(elem){
            if(elem == modal)
                $("."+elem).css("display", mode);
            else{
                $("."+elem).css("display", "none");
            }
        });
    }

    function clickContact(e){
        e.preventDefault();
        var targetUser = $(e.target).text();
        window.location = root+"@"+user.account+"/chat="+targetUser;
        
        displayModal("chat-modal", "flex");
        $(".chat-modal .modal-header div").text(targetUser);
    }

    // insert user info by requesting data from db
    function insertInfo(){
        $.get('/user.db', {account: account}, function(user){
            $(".user span").text(user.first_name+" "+user.last_name);
            $(".msg span:last-child").text(user.unread_msg);

            user.profiles.map(function(elem){
                // elem = JSON.parse(elem);
                var url = "/@"+account+"/profile="+elem;
                $(".profile-tg").append('<div class="tg-btn"><a href=' + url + '>' + elem + '</a></div>');
                $(".profile-tg .tg-btn:last-child").css({
                    "background-color": "#FF94B3",
                    "height": "30px",
                    "padding-left": "55px"
                });
                $(".profile-tg .tg-btn:last-child a").css({
                    "line-height": "30px",
                    "color": "#7D16F2",
                    "text-decoration": "none"
                });
            });
            user.contacts.map(function(elem){
                // elem = JSON.parse(elem);
                var url = "/@"+account+"/contact="+elem;
                $(".contact-tg").append('<div class="tg-btn"><span>'+ elem + '</span></div>');
                $(".contact-tg .tg-btn:last-child").css({
                    "background-color": "#FF94B3",
                    "height": "30px",
                    "padding-left": "55px"
                });
                $(".contact-tg .tg-btn:last-child span").css({
                    "line-height": "30px",
                    "color": "#7D16F2"
                });
                $(".contact-tg .tg-btn:last-child").on("click", clickContact);
            });

        }).fail(function(){
            $('body').load('/public/error.html');
        });
    }

    function initLayout(){
        $(".newProfile-modal").css("display", "none");
        $(".newContact-modal").css("display", "none");
        $(".chat-modal").css("display", "none");
        $('*[class$="tg"]').css("display", "none");

        if(target == "buildProfile"){
            $(".newContact-modal").css("display", "none");
            $(".chat-modal").css("display", "none");
            $(".newProfile-modal").css("display", "flex");
        }

        if(target == "addContact"){
            $(".newProfile-modal").css("display", "none");
            $(".chat-modal").css("display", "none");
            $(".newContact-modal").css("display", "flex");
            $(".newContact-modal .error-msg").css("display", "none");
        }

        if(target!=null && target.indexOf("chat=") != -1){
            var targetUser = target.split("=")[1];

            $(".newProfile-modal").css("display", "none");
            $(".chat-modal").css("display", "flex");
            $(".newContact-modal").css("display", "none");
            $(".chat-modal .modal-header div").text(targetUser);
        }
    }

    function initAnimation(){
        $(".newProfile-btn").on("click", function(){
            window.location = root+"@"+getCookie("account")+"/buildProfile";
        });

        $(".newContact-btn").on("click", function(){
            window.location = root+"@"+getCookie("account")+"/addContact";
        });

        $(".profiles").on("click", function(){
            $(".profile-tg").toggle();
        });

        $(".contacts").on("click", function(){
            $(".contact-tg").toggle();
        });
    }

    function initAction(){

        socket = io('/'+account, {transports: ['websocket'], upgrade: false});
        socket.on("new profile", function(data){
            var url = "/@"+account+"/profile="+data;
            $(".profile-tg").append('<div><a href=' + url + '>' + data + '</a></div>https://www.w3schools.com/js/js_cookies.asp');
        });
        socket.on("new contact", function(data){
            // var url = "/@"+account+"/contact="+data;
            $(".contact-tg").append('<div class="btn">' + data + '</div>');
            $(".contact-tg div").on("click", function(e){
                alert($(this).text());
            });
        });
        socket.on("new msg", function(data){

        });

        $('.main-modal').on('click', ".logout", function(e){
            e.preventDefault();
            $.post("/logout.db",
                {
                    data: getCookie("account"),
                    ContentType: "text/plain",
                    dataType: "text"
                }, 
                function(response){
                    //TODO: handle response and setCookie logout attribute
                    if(response == success){
                        window.location = root;
                    }
                }
            );
        });

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
                        var url = "/@"+getCookie("account")+"?profile="+newProfile.name;
                        // $(".profiles").append('<div class="btn"><a href=' + url + '>' + newProfile.name + '</a></div>');
                    }
                });
        });

        $(".newContact-modal form").submit(function(e){
            e.preventDefault();
            var newContact = $(this).serializeArray()[0].value;

            $.post("/contact.db", 
                {
                    data: JSON.stringify({
                        srcUser: getCookie("account"),
                        destUser: newContact
                    }),
                    dataType: "text/plain"
                }, 
                function(response){
                    if(response.status == nonexists){
                        $(".newContact-modal .error-msg").display("initial");
                        return;
                    }

                    var newContact = response.content,
                        url = "/@"+newContact.account,
                        row = '<div class="result"><img src=' + newContact.profile_pic + '>' + '<span>' + newContact.account + '</span>' + '</div>';
                        rowStyle = {
                            "width": "80%",
                            "height": ""
                        }
                    $(".newContact-modal").append(row);
                    // $(".newContact-modal .result").on("click", clickContact(e));
                });
        })

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

        $(".chat-modal").on("submit", function(e){
            e.preventDefault();
            var msg = $('.chat-modal textarea').val();
            var targetUser = $(".chat-modal .modal-header div").text();
            // socket.emit("send msg", {srcUser: user.account, destUser: targetUser, msg: msg});
            $.post("/msg.db", 
                {
                    data: JSON.stringify(
                            {
                                srcUser: user.account, 
                                destUser: targetUser, 
                                msg: msg
                            }),
                    dataType: "text/plain"
                },
                function(response){
                    $('.chat-modal input[type="text"]').val("");
                    var row = '<div><img src=' + getCookie("profile_pic") + '><span>' + msg + '</spanp></div>';

                    $('.chat-modal .receive').append(row);
                    $('.chat-modal .receive div:last-child').css({
                        "display": "flex",
                        "flex-direction": "row",
                        "justify-content": "flex-start",
                        "align-items": "flex-start",
                        "margin": "5px"
                    });
                    $('.chat-modal .receive div:last-child > img').css({
                        "width": "30px",
                        "margin-right": "10px"
                    });
                    $('.chat-modal .receive div:last-child > span').css({
                        "max-width": "60%",
                        "min-height": "30px",
                        "background-color": "rgba(0, 0, 0, 0.05)",
                        "border-radius": "5px",                   
                        "padding": "10px",
                        "font-size": "12px",
                        "font-family": "'Raleway', sans-serif",
                        "word-break": "break-all"
                    });
                });
        });
    }
});