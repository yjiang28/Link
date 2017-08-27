$(document).ready(function(){
	$(".login > form").submit(function(e){
		e.preventDefault();
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
			function(response){

			}
		);
	});
});