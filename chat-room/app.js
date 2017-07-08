// 项目地址 https://github.com/e174596549/chat-tools

const express = require('express')
const app = express()
const Redis = require('ioredis')
const userList = [] // 用户列表
const REDIS_KEY_ONLINE_LIST = 'chat_room:online_list:' // 用户列表存储 redisKey
const REDIS_KEY_CHAT_LIST = exports.REDIS_KEY_CHAT_LIST = 'chat_room:chat_list:'
const MSG_TYPE = {
    CHAT : 1,
    BROADCAST : 2,
    NOTICE : 3
}
// 订阅客户端
const redis = new Redis({
    port: 6379, // Redis port
    host: '127.0.0.1', // Redis host
    // family: 4,           // 4 (IPv4) or 6 (IPv6)
    // password: 'auth',
})
// 普通客户端
const redisClient = exports.redisClient = new Redis({
    port: 6379, // Redis port
    host: '127.0.0.1', // Redis host
    // family: 4,           // 4 (IPv4) or 6 (IPv6)
    // password: 'auth',
})

const server = app.listen(9000, function() {
    const host = server.address().address
    const port = server.address().port
    console.log("应用实例，访问地址为 http://%s:%s", host, port)
})

const sendHtml = function(path, response) {
    const fs = require('fs')
    const options = {
        encoding: 'utf-8'
    }
    fs.readFile(path, options, function(err, data) {
        response.send(data)
    })
}

app.get('/', function(req, res) {
    const path = 'index.html'
    sendHtml(path, res)
})
// 发送获取用户在线列表请求
app.get('/api/chat/online-users', function(req, res) {
    // res.send(userList)
    redisClient.smembers(REDIS_KEY_ONLINE_LIST, function(err, userList) {
        if (err) {
            console.log('查询在线列表出错', err)
            return res.send([])
        }
        res.send(userList)
    })
})
// 显示内存中的在线用户列表
const showOnlineUsers = function() {
    console.log('当前在线：', userList)
}
// 添加用户至在线用户列表缓存
const add2OnlineList = function(user) {
    redisClient.sadd(REDIS_KEY_ONLINE_LIST, user, function(err) {
        if (err) {
            console.log('加入在线列表失败', err)
        }
    })
}
// 将用户至从线用户列表缓存中移除
const removeFromOnlineList = function(user) {
    redisClient.srem(REDIS_KEY_ONLINE_LIST, user, function(err) {
        if (err) {
            console.log('从在线列表中移除失败', err)
        }
    })
}
// 缓存消息
const saveMsg2Redis = function(user, message, msg_id, msg_type) {
    const data = {
        user,
        message,
        msg_id,
        msg_type,
        time : new Date().getTime()
    }
    redisClient.rpush(REDIS_KEY_CHAT_LIST, JSON.stringify(data), function(err) {
        if (err) {
            console.log('缓存聊天消息失败', err)
        }
    })
}
// 引入 socket.io 模块 建立服务器
const io = require('socket.io').listen(server)
// 监听用户连接
let msg_id = 1
io.on('connection', function(socket) {
    //console.log(io.sockets)
    console.log('新用户连接成功')
    // 用户登录 向客户端发送登录验证信息
    socket.emit('whoAreYou')
    saveMsg2Redis('', 'whoAreYou', msg_id++, MSG_TYPE.NOTICE)
    // 接收客户端登录信息
    socket.on('name', function(name) {
        console.log(name)
        // 保存客户端信息
        userList.push(name)
        socket.name = name
        showOnlineUsers()
        add2OnlineList(name)
    })
    // 发送消息
    socket.emit('message', '你登录了')
    saveMsg2Redis(socket.name, '你登录了', msg_id++, MSG_TYPE.NOTICE)
    // 接收消息
    socket.on('message', function(msg) {
        console.log(`收到了：${msg}`)
        // io.sockets.emit('message', msg)
        const user = socket.name
        // 广播聊天消息
        socket.broadcast.emit('message', `${user}: ${msg}`)
        saveMsg2Redis(user, msg, msg_id++, MSG_TYPE.CHAT)
    })
    // 监听用户断开连接
    socket.on('disconnect', () => {
        console.log('有人离开了')
        // 更新在线用户列表
        userList.splice(userList.indexOf(socket.name), 1)
        // 广播客户端下线消息
        socket.broadcast.emit('message', `${socket.name} 已经离开`)
        saveMsg2Redis(socket.name, '已经离开', msg_id++, MSG_TYPE.NOTICE)
        showOnlineUsers()
        removeFromOnlineList(socket.name)
    })
    // 订阅系统广播
    redis.subscribe('broadcast', function(err, count) {
        if (err) {
            console.log('注册广播出错:', err)
            return
        }
        console.log('当前已注册：', count)
    })
    // 收到系统广播消息后发送给所有用户
    redis.on('message', function(channel, message) {
        console.log(`Receive message ${message} from channel ${channel}`)
        socket.emit('message', `收到来自${channel}的广播: ${message}`)
        saveMsg2Redis(channel, message, msg_id++, MSG_TYPE.BROADCAST)
    })
})

require('./schedule.js')
