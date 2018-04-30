module.exports = function (dbBooks, dbTrade) {
    const express = require('express');
    const router = express.Router();
    const tools = require('../tools');

    router.get('/all', function (req, res, next) {
        const Books = dbBooks();
        if (req.user) {
            const userId = req.user.value._id;
            Books
                .aggregate()
                .lookup({
                        from: 'Trades',
                        let: {
                            book_id: '$_id'
                        },
                        pipeline: [
                            {
                                $match: {
                                    userId: new Books.ObjectID(userId),
                                    $expr: {
                                        $eq: ["$bookId", '$$book_id']
                                    }
                                }
                            }
                        ],
                        as: 'Trades'
                    })
                    .match({
                        user: {
                            $ne: ObjectId(userId)
                        }
                    })
                    .toArray(function (err, result) {
                        if (err) 
                            return next(err);
                        console.log(result);
                        res.render('books', tools.addUser({
                            books: result
                        }, req.user));
                    });
            } else {
                Books.find({});
            }
        });

    return router;
}