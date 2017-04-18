const express = require('express');
const router = express.Router();
//const server = require('../controllers/server_controller');
// const game = require('../controllers/game_controller');
// const rank = require('../controllers/rank_controller');
// const point = require('../controllers/point_controller');

var sendHtml = function(path, response) {
    var fs = require('fs')
    var options = {
        encoding: 'utf-8'
    }
    path = 'views/' + path
    fs.readFile(path, options, function(err, data) {
        //console.log(`读取的html文件 ${path} 内容是`, data)
        response.send(data)
    })
}

/* 显示登陆. */
router.get('/', function(req, res, next) {
    //res.render('index');
    // res.writeHead(200, {
    //        'Content-Type': 'text/plain'
    //    });
    //    res.write('hello world!');
    //    res.end();
    var path = 'index.html'
    sendHtml(path, res)
});
router.post('/img', function(req, res) {
    console.log('/img:', req);
    res.send('收到img请求')
});
// router.get('/login', user.showLogin);
// router.post('/login', user.login);
//
// router.get('/game/list', game.list);
//
// router.get('/user/self',user.self);
// router.get('/user/list',user.list);
//
// router.get('/rank/list',rank.list);
//
// router.get('/point/list',point.list);

module.exports = router;
