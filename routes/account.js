function main(dbBooks) {
    const express = require('express');
    const router = express.Router();
    const tools = require('../tools');
    const books = require('google-books-search');

    router.get('/', ensureLogged, function (req, res, next) {
        const Books = dbBooks();
        Books.find({ user: new Books.ObjectID(req.user.value._id) })
        .toArray(function (err, results) {
            if (err) return next(err);
            res.render('account', tools.addUser({books: results}, req.user));
        });
    });

    router.post('/removebook', ensureLogged, function (req, res, next) {
        const Books = dbBooks();
        const query = {
            user: new Books.ObjectID(req.user.value._id),
            _id: new Books.ObjectID(req.body.bookId)
        };
        Books.deleteOne(query, function (err, result) {
            res.redirect('/account');
        })
    });

    router.post('/newbook', ensureLogged, function (req, res) {
        const title = req.body.title;
        if (!String.isNullOrWhitespace(title)) {
            const Books = dbBooks();
            books
                .search(title, function (error, results) {
                    if (!error) {
                        if (results.length > 0) {
                            const closestResult = results.find((book) => {
                                return book.thumbnail && book.description && book.title;
                            });
                            console.log(closestResult);
                            if (!closestResult) return res.redirect('/account');
                            const doc = {
                                description: closestResult.description,
                                thumbnail: closestResult.thumbnail,
                                title: closestResult.title,
                                user: new Books.ObjectID(req.user.value._id)
                            };
                            Books.insertOne(doc, function (err, result) {
                                res.redirect('/account');
                            });
                        }
                    } else {
                        console.log(error);
                    }
                });
        }
    });

    return router;
}
module.exports = main;

function ensureLogged (req, res, next) {
    if (!req.user) res.redirect('/');
    else next();
}