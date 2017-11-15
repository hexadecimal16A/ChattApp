var express=require('express');
var app=express();
app.set('port', (process.env.PORT || 8000));
var socket=require('socket.io');
var server=app.listen(app.get('port'),function(){
	console.log('listening');
});
var io=socket(server);
app.use(express.static(__dirname + ''));
var users={};
var socketObj={};
var messageQueue={};

io.set('heartbeat timeout', 5000); 
io.set('heartbeat interval', 5000);
//-------------------------------FUNCTIONS----------------------------//
function validateData(data){
	if(data.to && data.from)
		return true;
	return false;
}

function onRegister(data,socket)
{
	if(!data.name||data.name==""||data.name==null)
	{
		socket.emit('messageFromServer',"Name Invalid");
		return;
	}
	if(users[data.name] && users[data.name].id!=data.socketId){
		socket.emit('messageFromServer',"Name Already Taken");
		return;
	}

	if(socketObj[data.socketId]){
		delete users[socketObj[data.socketId]];
		delete socketObj[data.socketId];
	}
	users[data.name]=socket;
	socketObj[socket.id]=data.name;
	io.sockets.emit('getOnlineUsers',Object.keys(users));
	//console.log(messageQueue);
	if(messageQueue[data.name]){
		users[data.name].emit('receive',messageQueue[data.name]);
		delete messageQueue[data.name];
	}
	socket.emit('messageFromServer',"Connected");
};

function onSend(data){
	if(!messageQueue[data.to])
		messageQueue[data.to]=[]
	messageQueue[data.to].push(data);
	//console.log(messageQueue);
	if(users[data.to]){
		users[data.to].emit('receive',messageQueue[data.to]);
		delete messageQueue[data.to];
	}
	else{
		if(users[data.from])
			users[data.from].emit('messageFromServer',"Select an Online User");
	}
};

function getAck(data){
	if(users[data.to])
		users[data.to].emit('signal',data);
	else{
		data.message="User does Not exist select from "+Object.keys(users);
		if(users[data.from])
			users[data.from].emit('receive',data);
	}
};

function postTypingStatus(data){
	if(users[data.to]){
		users[data.to].emit('getTypingStatus',data);
	}
}

function disconnect(data,socket){
	if(socketObj[socket.id])
		io.sockets.emit('messageFromServer',"User '"+socketObj[socket.id]+"' has left");
	delete users[socketObj[socket.id]];
	delete socketObj[socket.id];
	socket.broadcast.emit('getOnlineUsers',Object.keys(users));
}

//----------------------------CONNECTIONS-------------------------------------//

io.on('connection',function(socket){
	console.log(socket.request._query.name);
	if(socket.request._query.name&&socket.request._query.name!=""){
		onRegister(socket.request._query,socket);
	}

	socket.on('register',function(data){
		onRegister(data,socket);
	});
	
	socket.on('send',function(data){
		if(!validateData(data)){
			socket.emit('messageFromServer',"Select a User");
			return;
		}
		onSend(data);
	});

	socket.on('ack',function(data){
		if(!validateData(data)){
			socket.emit('messageFromServer',"ACK Data Invalid");
			return;
		}
		getAck(data);
	});

	socket.on('postTypingStatus',function(data){
		postTypingStatus(data);
	});

	socket.on('disconnect',function(data){
		disconnect(data,socket);
	});
});


