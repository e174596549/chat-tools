var mongo = require("mongodb");
var host = "localhost";
var port = 27017

// var a = exports.insertDb = function(option) {
var db = new mongo.Db('chat-records', new mongo.Server(host, port, {
    auto_reconnect: true
}), {
    safe: true
});

db.open(function(err, db) {
    if (err) {
        console.log('MongoDB connection error:', err);
    } else {
        console.log("OPEN MONGO CONNECTION");
        db.collection('message', function(err, collection) {
                // collection.insert({
                //     username: 'leo',
                //     message:['111111111111111111111111111','222222222222222']
                // }, function(err, docs) {
                //     //console.log(docs);
                //     //db.close()
                // })

                // collection.find({}).toArray(function(err, docs) {
                //     if (err) {
                //         console.log(err);
                //     } else {
                //         console.log(docs);
                //         db.close()
                //     }
                // })

                // collection.findOne({}, function(err, docs) {
                //     if (err) {
                //         console.log(err);
                //     } else {
                //         console.log(docs);
                //         db.close()
                //     }
                // })

                // var newMessage = ' 123456'
                // var messageList = []
                collection.find({
                     _id : mongo.ObjectId("58f070cb8b7a45d9709c11d3")
                }).toArray(function(err, docs) {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log(docs);
                        //messageList.push(docs[0].message)
                        //db.close()
                    }
                })
                // messageList.push(newMessage)

                // collection.update(username: 'Emma'
                //     }, {
                //         username: 'Emma',
                //         message: ['66666']
                //     },
                //     function(err, result) {
                //         if (err) {
                //             console.log(err);
                //         } else {
                //             console.log(`成功更显数据：${result}`);
                //             collection.find({}).toArray(function(err, docs) {
                //                 if (err) {
                //                     console.log(err);å
                //                 } else {
                //                     console.log(docs);
                //                     db.close()
                //                 }
                //             })
                //         }
                //     })
        })
}
});
// }
