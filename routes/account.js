function main(dbBooks, dbTrade, dbUser) {
    const express = require('express');
    const router = express.Router();
    const {addUser, ensureLogged} = require('../tools');
    const books = require('google-books-search');

    router.get('/', ensureLogged, function (req, res, next) {
        const Books = dbBooks();
        console.log(req.user);
        let user;
        if (req.user.value) {
            user = req.user.value;
        } else {
            user = req.user;
        }
        Books
            .find({
                user: new Books.ObjectID(user._id)
            })
            .toArray(function (err, results) {
                if (err) 
                    return next(err);
                res.render('account', addUser({
                    books: results
                }, req.user));
            });
    });

    router.post('/info', ensureLogged, function (req, res, next) {
        const fullName = req.body.fullName;
        const city = req.body.city;
        const state = req.body.state;
        if (fullName && city && state) {
            const Users = dbUser();
            Users.updateOne({
                _id: new Users.ObjectID(req.user.value._id)
            }, {
                $set: {
                    fullName,
                    city,
                    state
                }
            }, function (err, result) {
                if (err) 
                    return next(err);
                req
                    .login({
                        ...req.user.value,
                        fullName,
                        city,
                        state
                    }, function (err) {
                        if (err) 
                            return next(err);
                        res.redirect('/account');
                    });
            });
        }
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
            books.search(title, function (error, results) {
                if (!error) {
                    if (results.length > 0) {
                        const closestResult = results.find((book) => {
                            return book.thumbnail && book.description && book.title;
                        });
                        console.log(closestResult);
                        if (!closestResult) 
                            return res.redirect('/account');
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
        } else {
            res.redirect('/account');
        }
    });

    return router;
}
module.exports = main;