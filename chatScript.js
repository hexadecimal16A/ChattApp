var audioR = $("#receiveSound")[0];
var audioS = $("#serverSound")[0];
var _name='';
var socket=io.connect();
var id=0;
var socketStore;

//----------------------------function declaration here--------------//

function registerClient(){
	_name=$('#from').html();
	console.log(_name);
	socket.emit('register',{
		name:$('#from').html()
	});
	$("#send").css("display","block");
	$('#from').attr('contenteditable','false');
};

function reConnect(){
	console.log(socketStore);
	socket.io.opts.query = {
		socketId:socketStore,
	  	name: _name
	}
};

function sendMessage(e){
	e.preventDefault();
	id+=1;
	createDiv({message:$('#message').val(),to:$('#to').html()},"sendMessageStyle",$("#from").html()+"_"+id,'s');
	socket.emit('send',{
		to:$("#to").html(),
		from:$("#from").html(),
		message:$('#message').val(),
		id:$("#from").html()+"_"+id
	},function(error,message){
		console.log("error is :"+error);
		console.log("message is: "+message);
	});
	$('#message').val("");
	executeQuery();
};

function receiveMessage(data){
	for(i in data){
		//console.log(data[i]);
		createDiv(data[i],"receiveMessageStyle",data[i].id,'r');
		socket.emit('ack',{
			to:data[i].from,
			from:data[i].to,
			id:data[i].id
		});
	}
		audioR.play();
};

function postTypingStatus(){
	socket.emit('postStatus',{
		to:$("#to").html(),
		from:$("#from").html(),
		typing:true
	});
};

function executeQuery() {
	socket.emit('postTypingStatus',{
		to:$("#to").html(),
		from:$("#from").html(),
		typing:false
	});
	setTimeout(executeQuery, 5000); // you could choose not to continue on failure...
}

function getTypingStatus(data){
	if(data.typing==true)
		$("#typing").html(data.from+" is typing");
	else{
		$("#typing").html("");
	}
}

function getOnlineUsers(data){
	$("#onlineUsers").html("");
	for(i in data){
		var h5 = document.createElement('h5');
		h5.className="onlineUsers";
		var node = document.createTextNode(data[i]);
		h5.appendChild(node);
		h5.style.cursor='pointer';
		h5.id="user_"+data[i];
		$(h5).click(function(){
			$("#to").html($(this).html());
			$(".onlineUsers").css("color","white");
			$(this).css("color","#99cc33");
		})
		document.getElementById("onlineUsers").appendChild(h5);
	}
	$("#user_"+$('#to').html()).css("color","#99cc33");
};

function messageFromServer(data){
	if(data.includes("Name")){
		$('#from').attr('contenteditable','true');
		$("#send").css("display","hidden");
	}
	$("#messageFromServerHeading").html(data);
	$("#messageFromServer").css("display","none");
	//$( "#messageFromServer" ).removeClass("slide");
	$( "#messageFromServer" ).toggle("slide", { direction: "down" },1000);
	audioS.play();
	setTimeout(function(){ $("#messageFromServer" ).toggle("slide", { direction: "down" },100); }, 2000);
}

function createDiv(data,cl,id,flag){
	var Div_1 = document.createElement('div');
	Div_1.className = cl;
	Div_1.id=id;
	var para=document.createElement('h5');
	if(flag=='r')
		para.innerHTML="<span style='color:#6497b1;'></b>"+data.from+": </b></span>"+data.message;
	else if(flag=='s')
		para.innerHTML=data.message+"<span style='color:#6497b1;'></b> :"+data.to+"</b></span>";
	else
		para.innerHTML=data;
	para.style.padding="0";
	para.style.margin="0.5em";
	Div_1.appendChild(para);
	var element = document.getElementById("chatArea");
	element.appendChild(Div_1);
	element.scrollTop = element.scrollHeight;
}

$(".subHeadings").click(function(){
	$(".subHeadings").removeClass("active");
	$(this).addClass("active");
	$("[name='displayArea']").css("display","none");
	$("#"+$(this).html()).css("display","block");
	$("#changeName").html($(this).html().toUpperCase());
});

//-----------------------events here---------------------------//

executeQuery();

$('#changeName').click(function(){
	registerClient();
});

$('#send').click(function(e){
	sendMessage(e);
});

$("#message").on('change textInput input keystrokes',function(){
	postTypingStatus();
});

$("#reset").click(function(){
	socket.disconnect();
	window.location.href="/index.html";
});

//--------------------socket commands here-------------------//

socket.on('reconnect_attempt', function(){
	reConnect();
});

socket.on('connect',function(){
	socketStore=socket.id;
	console.log(socketStore);
	$('#from').css("color","white");
});

socket.on('receive',function(data){
	receiveMessage(data);
});

socket.on('signal',function(data){
	$("#"+data.id).css("border-color","transparent #5cb85c transparent transparent");
});

socket.on('getTypingStatus',function(data){
	getTypingStatus(data);
});

socket.on('getOnlineUsers',function(data){
	getOnlineUsers(data);
});

socket.on('messageFromServer',function(data){
	messageFromServer(data);
});

socket.on('disconnect', () => {
  $('#from').css("color","grey");
  messageFromServer("Disconnected");
});
