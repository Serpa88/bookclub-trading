module.exports = function (dbTrade, dbBooks) {
    const express = require('express');
    const router = express.Router();
    const {addUser, ensureLogged} = require('../tools');
    const async = require('async');

    router.post('/tradebook', ensureLogged, function (req, res, next) {
        const Books = dbBooks();
        if (req.body.cancel === 'true') {
            dbTrade()
                .deleteOne({
                    bookId: new Books.ObjectID(req.body.bookId)
                }, function (err, result) {
                    if (err) 
                        return next(err);
                    res.redirect('/books/all');
                });
        } else {
            const bookId = new Books.ObjectID(req.body.bookId);
            const myBookId = new Books.ObjectID(req.body.myBook);
            const userId = new Books.ObjectID(req.user._id);
            Books.findOne({
                _id: bookId
            }, function (err, result) {
                if (err) 
                    return next(err);
                if (result) {
                    Books
                        .findOne({
                            user: userId,
                            _id: myBookId
                        }, function (err, myBook) {
                            if (err) 
                                return next(err);
                            if (myBook) 
                                dbTrade().insertOne({
                                    bookId,
                                    offeredBook: myBookId,
                                    user: new Books.ObjectID(req.user._id)
                                });
                            }
                        );
                }
                res.redirect('/books/all');
            });
        }
    });

    router.post('/accept', ensureLogged, function (req, res, next) {
        const Books = dbBooks();
        const Trades = dbTrade();
        const tradeId = new Books.ObjectID(req.body.tradeId);
        const userId = new Books.ObjectID(req.user._id);
        Trades
            .aggregate()
            .lookup({
                    from: "Books",
                    let: {
                        mybook: "$bookId"
                    },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: ["$_id", "$$mybook"]
                                }
                            }
                        }, {
                            $lookup: {
                                from: "Users",
                                localField: "user",
                                foreignField: "_id",
                                as: "Users"
                            }
                        }
                    ],
                    as: "MyBook"
                })
                .match({_id: tradeId})
                .toArray(function (err, results) {
                    if (err) 
                        return next(err);
                    if (results) {
                        const trade = results[0];
                        const myBook = trade.MyBook[0];
                        const myBookUser = myBook.Users[0];
                        if (myBookUser._id.equals(userId)) {
                            async
                                .parallel([
                                    parallelFunction(Books, myBook._id, trade.user),
                                    parallelFunction(Books, trade.offeredBook, myBookUser._id)
                                ], function (err, results) {
                                    Trades.deleteMany({
                                        $or: [
                                            {
                                                bookId: myBook._id
                                            }, {
                                                offeredBook: trade.offeredBook
                                            }
                                        ]
                                    }, function (err, result) {
                                        if (err) return next(err);
                                        res.redirect('/trades');
                                    });
                                });
                        }
                    } else 
                        res.redirect('/trades');
                    }
                );
        });

        router.post('/decline', ensureLogged, function (req, res, next) {
            const Trades = dbTrade();
            const tradeId = new Trades.ObjectID(req.body.tradeId);
            Trades.deleteOne({
                _id: tradeId
            }, function (err, result) {
                if (err) 
                    return next(err);
                res.redirect('/trades');
            });
        });

        router.get('/', ensureLogged, function (req, res, next) {
            const Trade = dbTrade();
            const userID = new Trade.ObjectID(req.user._id);
            Trade
                .aggregate()
                .lookup({
                        from: 'Books',
                        let: {
                            book_id: '$bookId'
                        },
                        pipeline: [
                            {
                                $match: {
                                    user: userID,
                                    $expr: {
                                        $eq: ["$_id", "$$book_id"]
                                    }
                                }
                            }

                        ],
                        as: 'Books'
                    })
                    .lookup({from: 'Books', localField: 'offeredBook', foreignField: '_id', as: 'offered_book'})
                    .lookup({from: 'Users', localField: 'user', foreignField: '_id', as: 'User'})
                    .match({
                        user: {
                            $ne: userID
                        }
                    })
                    .toArray(function (err, results) {
                        if (err) 
                            return next(err);
                        res.render('trades', addUser({
                            trades: results
                        }, req.user));
                    });
            });

            return router;
        }

        function parallelFunction(Books, bookId, newUser) {
            return function (cb) {
                Books
                    .updateOne({
                        _id: bookId
                    }, {
                        $set: {
                            user: newUser
                        }
                    }, function (err, update) {
                        cb();
                    });
            };
        }
