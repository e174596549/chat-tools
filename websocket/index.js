const tc = require('../lib/text-censor');
const redis = require('redis');
const redisclient = redis.createClient();
const {sever} = require('../app');

var sub = function(c) {
    var c = c || 'chatchannel';
    redisclient.subscribe(c, function(e) {
        console.log('subscribe channel : ' + c);
    });
}
sub();
// 引入 socket.io 模块并绑定到服务器
const io = require('socket.io').listen(sever)
// 服务器当前在线用户列表
var nameList = []
// socket 部分
io.on('connection', function(socket) {
    console.log('a user connected');
    socket.emit('whoYouAre');
    // socket 断开时发送下线消息
    socket.on('disconnect', function() {
        console.log('user disconnected');
        if (socket.name) {
            nameList.splice(nameList.indexOf(socket.name), 1);
            socket.broadcast.emit('system', socket.name, nameList, 'logout');
            socket.disconnect()
        }
    });
    // 新用户登录时 记录名字并广播给其他用户
    socket.on('name', function(data) {
        var userName = data || '匿名'
        console.log(data);
        nameList.push(userName)
        socket.name = userName
        console.log('socket.name:', userName);
        socket.emit('loginSuccess', nameList);
        io.sockets.emit('system', userName, nameList, 'login');
    });
    socket.on('logOut', function(data) {
        // var userName = data || '匿名'
        // console.log(data);
        // nameList.push(userName)
        // socket.name = userName
        // console.log('socket.name:', userName);
        // socket.emit('loginSuccess', nameList);
        // io.sockets.emit('system', userName, nameList, 'login');
        socket.disconnect()
    });
    // 聊天消息
    socket.on('message', function(data) {
        if (data !== '') {
            console.log('message data:', data);
            var time = new Date().toLocaleString()
            // socket.emit('message', new Date(), socket.name, data
            tc.filter(data, (err, filtered) => {
                io.sockets.emit('message', time, socket.name, filtered)
            })
        }
    });
    // redis 订阅 系统广播
    redisclient.on('message', function(error, msg) {
        console.log('connection');
        console.log(msg);
        var time = new Date().toLocaleString()
        socket.emit('systemBroadcast', msg);
    });
});
