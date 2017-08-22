$(document).ready(function(){
	$(".out > form").submit(function(e){
		e.preventDefault();
		var input = $('.out > form > input[type="text"]').val();
		//alert(input);
		$(".in").append('<div><img src="/public/img/user.svg"><div></div></div>');

		$(".in > div").css({
			// border: 1px solid black;
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
		socket.emit("msg", input);
		$('.out > form > input[type="text"]').val('');

		// return false is a way to tell the event to not actually fire
		return false;
	});
});