const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const routes = require('./routes/index');

const app = express();
app.use(express.static(path.join(__dirname, 'static')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use('/', routes);

var server = app.listen(9000, function() {
    var host = server.address().address
    var port = server.address().port

    console.log("应用实例，访问地址为 http://%s:%s", host, port)
})

io = require('socket.io').listen(server); //引入socket.io模块并绑定到服务器
//socket部分
var nameList = []
io.on('connection', function(socket) {
    console.log('a user connected');
    socket.on('disconnect', function(){
        console.log('user disconnected');
        nameList.splice(nameList.indexOf(socket.name), 1);
        socket.broadcast.emit('system', socket.name, nameList, 'logout');
    });
    socket.on('name', function(data){
        console.log(data);
        nameList.push(data)
        socket.name = data
        console.log('socket.name:', data);
        socket.emit('loginSuccess', nameList);
        io.sockets.emit('system', data, nameList, 'login');
    });
    socket.on('message', function(data) {
        console.log(data);
        socket.broadcast.emit('message', `${socket.name}: ${data}`)
    });

});
