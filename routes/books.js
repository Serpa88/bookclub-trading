module.exports = function (dbBooks, dbTrade) {
    const express = require('express');
    const router = express.Router();
    const tools = require('../tools');

    router.get('/all', function (req, res, next) {
        const Books = dbBooks();
        if (req.user) {
            const userId = new Books.ObjectID(req.user.value._id);
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
                                    user: userId,
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
                            $ne: userId
                        }
                    })
                    .toArray(function (err, result) {
                        if (err) 
                            return next(err);
                        Books
                            .find({user: userId})
                            .toArray(function (err, myBooks) {
                                if (err) 
                                    return next(err);
                                res.render('books', tools.addUser({
                                    books: result,
                                    myBooks
                                }, req.user));
                            });
                    });
            } else {
                Books
                    .find({})
                    .toArray(function (err, results) {
                        if (err) 
                            return next(err);
                        else 
                            res.render('books', {books: results});
                        }
                    );
            }
        });

        return router;
    }