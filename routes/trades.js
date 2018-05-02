module.exports = function (dbTrade, dbBooks) {
    const express = require('express');
    const router = express.Router();
    const {addUser, ensureLogged} = require('../tools');

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
            Books.findOne({
                _id: bookId
            }, function (err, result) {
                if (err) 
                    return next(err);
                if (result) 
                    dbTrade().insertOne({
                        bookId,
                        user: new Books.ObjectID(req.user.value._id)
                    });
                res.redirect('/books/all');
            });
        }
    });

    router.get('/', ensureLogged, function (req, res, next) {
        const Trade = dbTrade();
        const userID = new Trade.ObjectID(req.user.value._id);
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