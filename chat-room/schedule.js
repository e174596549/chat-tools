const mongoose = require('mongoose');
const async = require('async');
const {redisClient, REDIS_KEY_CHAT_LIST} = require('./app.js');
// 官方文档 http://mongoosejs.com/docs/api.htm
// 推荐教程 https://segmentfault.com/a/1190000008245062
// URL以mongodb:// + [用户名:密码@] +数据库地址[:端口] + 数据库名。（默认端口27017）
mongoose.connect('mongodb://localhost/mongodb');
const msgSchema = new mongoose.Schema({
    user: {
        type: String
    },
    message: {
        type: String
    },
    time: {
        type: Date
    },
    msg_id: {
        type: Number
    },
    msg_type: {
        type: Number
    }
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'update_at'
    }
})
// 将名为blogSchema的Schema与Blog名字绑定，即是存入数据库的名字，但存入数据库中的名字是Blogs，
// 会自动添加一个s。这里将Model命名为blogModel，需要对Blog表操作的话，都需要使用变量名blogModel。
const msgModel = mongoose.model('msg', msgSchema);

const data = [{
    user: 'gua',
    message: 'test chat lala',
    time: new Date().getTime(),
    msg_id: 101,
    msg_type: 1
}, {
    user: 'gua',
    message: 'test chat lala2222',
    time: new Date().getTime(),
    msg_id: 11,
    msg_type: 1
}]
// 批量插入
// msgModel.insertMany(data, function(err, item) {
//     console.log(item);
// })
// 单独插入
// new msgModel(data).save(function(err, item) {
//     console.log(item);
//  });
// 全部查找
// msgModel.find({user: 'gua'}, function(err, item) {
//     console.log(item);
// })
// 查找第一个
// msgModel.findOne({user: 'gua'}, function(err, item) {
//     console.log(item);
// })
// 通过 _id 查找
// msgModel.findById('5960ca3ffbcd8c45e4a89897', function(err, item) {
//     console.log(item);
// })
// 修改
// msgModel.update({user: 'gua'}, {msg_type: 2}, {multi:true},function(err, item) {
//     console.log(item);
// })
// 删除
// msgModel.remove({user: 'gua'},function(err, item) {
//     console.log(item);
// })
// 设置过期时间
const expire = new Date().getTime() + 8 * 3600
// 定时处理聊天消息
const timer = setInterval(function scheduleList() {
    const dataArr = [];
    async.waterfall([
        function doTask(next) {
            async.each(new Array(10), function(item, callback) {
                redisClient.lpop(REDIS_KEY_CHAT_LIST, function(err, result) {
                    if (err) {
                        slogger.error('读取缓存聊天消息失败', err);
                        return
                    }
                    if (result) {
                        try {
                            const data = JSON.parse(result);
                            console.log(data);
                            dataArr.push(data);
                        } catch (e) {
                            slogger.error('解析聊天消息失败', e, result);
                        }
                    }
                    callback(false);
                });
            }, next);
        },
        function insertDb(next) {
            msgModel.insertMany(dataArr, function(err) {
                if (err) {
                    slogger.error('保存缓存聊天消息失败', err);
                }
                next(false);
            });
        },
        function checkExpire(next) {
            redisClient.llen(REDIS_KEY_CHAT_LIST, function(err, reply) {
                if (err) {
                    slogger.error('检查列表长度失败', key, err);
                    return next(false);
                }
                console.log(REDIS_KEY_CHAT_LIST, reply);
                if (!reply) { //没有数据了
                    if (new Date().getTime() > expire) { //到期了
                        console.log('kill timer');
                        clearInterval(timer);
                    }
                }
                next(false);
            });
        }
    ]);

}, 500);
