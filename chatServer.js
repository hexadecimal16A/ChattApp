var express=require('express');
var app=express();
var socket=require('socket.io');
var server=app.listen(8000,function(){
	console.log('listening');
})
var io=socket(server);
app.use(express.static(__dirname + ''));
var users={};
var socketObj={};
var messageQueue={};

io.on('connection',function(socket){
	//console.log(socket.id);
	io.sockets.emit('getOnlineUsers',Object.keys(users));
	socket.on('register',function(data){
		if(socketObj[socket.id])
			delete users[socketObj[socket.id]];
		users[data.name]=socket;
		socketObj[socket.id]=data.name;
		io.sockets.emit('getOnlineUsers',Object.keys(users));
		//console.log(messageQueue);
		if(messageQueue[data.name]){
			users[data.name].emit('receive',messageQueue[data.name]);
			delete messageQueue[data.name];
		}
	});
	
	socket.on('send',function(data){
		//console.log(Object.keys(users));
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
	});

	socket.on('ack',function(data){
		//console.log(data);
		if(users[data.to])
			users[data.to].emit('signal',data);
		else{
			data.message="User does Not exist select from "+Object.keys(users);
			if(users[data.from])
				users[data.from].emit('receive',data);
		}
	});

	socket.on('postStatus',function(data){
		//console.log(data);
		if(users[data.to]){
			users[data.to].emit('getStatus',data);
		}
	});

	socket.on('disconnect',function(data){
		if(socketObj[socket.id])
			io.sockets.emit('messageFromServer',"User '"+socketObj[socket.id]+"' has left");
		delete users[socketObj[socket.id]];
		delete socketObj[socket.id];
		socket.broadcast.emit('getOnlineUsers',Object.keys(users));
	});
});


