module.exports = function (dbTrade) {
    const express = require('express');
    const router = express.Router();
    const { addUser, ensureLogged } = require('../tools');

    router.get('/', ensureLogged, function (req, res, next) {
        const Trade = dbTrade();
        const userID = new Trade.ObjectID(req.user.value._id);
        Trade.aggregate().lookup({
            from: 'Books',
            let: { book_id: '$bookId' },
            pipeline: [
                {
                    $match: {
                        user: userID,
                        $expr: { $eq: ["$_id", "$$book_id"] }
                    }
                }
        
            ],
            as: 'Books'
        })
        .lookup({
            from: 'Users',
            localField: 'user',
            foreignField: '_id',
            as: 'User'
        })
        .match({ user: { $ne: userID } })
        .toArray(function (err, results) {
            if (err) return next(err);
            res.render('trades', addUser({ trades: results }, req.user));
        });
    });

    return router;
}