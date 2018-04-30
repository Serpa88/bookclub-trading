module.exports = function (dbBooks, dbTrade) {
    const express = require('express');
    const router = express.Router();
    const tools = require('../tools');

    router.get('/all', function (req, res, next) {
        let agg;
        if (req.user) {
            agg = {
                $lookup: {
                    from: 'Trades',
                    localField: '_id',
                    foreignField: 'BookId',
                    pipeline: [
                        {
                            $match: {
                                userId: req.user.value._id
                            }
                        }
                    ],
                    as: 'Trades'
                }
            };
        }
        else {
            agg = {};
        }
        dbBooks().aggregate([agg], function (err, cursor) {
            if (err) return next(err);
            cursor.toArray(function (err, result) {
                if (err) return next(err);
                console.log(result);
                res.render('books', tools.addUser({ books: result }, req.user));
            });
        });
    });

    return router;
}