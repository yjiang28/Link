var getCookie(attr){
	if(document.cookie){
		var arr = document.cookie.split("; "), tmp, i;
		for(i=0;i<arr.length;i++){
			tmp = arr[i].split("="); 
			if(tmp[0] == attr) return tmp[1]; 
		}
	}
	return undefined;
}

$(document).ready(function(){
	$(".out > form").submit(function(e){
		e.preventDefault();
		var input = $('.out > form > input[type="text"]').val();

		$(".in").append('<div><img src="/public/img/user.svg"><div></div></div>');

		$(".in > div").css({
			"position": "relative",
			"left": "0",
			"max-width": "75%",
			"display": "flex",
			"flex-direction": "row",
			"justify-content": "flex-start",
			"align-items": "flex-start"
		});

		$(".in > div > img").css({
			"width": "15%",
			"margin-right": "5px"
		});		

		$(".in > div > div").css({
			"max-width": "75%",
			"padding": "2.5px 10px",
			"background-color": "white",
			"border-radius": "3px"
		});

		$(".in > div > div").text(input);

		var socket = io();
		socket.emit("msg", {
			text: input,
			sender: getCookie("account"),
			receiver: getCookie("receiver")
		});
		$('.out > form > input[type="text"]').val('');

		// return false is a way to tell the event to not actually fire
		return false;
	});
});