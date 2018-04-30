var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
const passport = require('passport');
const githubStrategy = require('passport-github').Strategy;

passport.use(new githubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: "https://bookclub-trading.herokuapp.com/auth/github/callback"
}, function (accessToken, refreshToken, profile, cb) {
  dbUser
    .findOneAndUpdate({
      githubId: profile.id
    }, {
      $setOnInsert: {
        avatar_url: profile.photos[0].value,
        githubName: profile.username
      }
    }, {
      upsert: true
    }, function (err, user) {
      return cb(err, user);
    });
}));

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (user, done) {
  done(null, user);
});

// Database Name Turned into collection object(s) once connected
let dbUser = 'Users';
let dbBooks = 'Books';
let dbTrade = 'Trades';

// Use connect method to connect to the server
MongoClient.connect(process.env.MONGODB_URI, function (err, client) {
  assert.equal(null, err);
  console.log("Connected successfully to server");
  const db = client.db('heroku_16dcptlw');
  dbUser = db.collection(dbUser);
  dbBooks = db.collection(dbBooks);
  dbTrade = db.collection(dbTrade);
});

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(require('body-parser').urlencoded({extended: true}));
app.use(require('express-session')({secret: process.env.COOKIE_SECRET, resave: true, saveUninitialized: true}));
app.use(passport.initialize());
app.use(passport.session());

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/auth/github', require('./routes/auth'));
app.use('/books', require('./routes/books')(() => dbBooks, dbTrade));
app.use('/account', require('./routes/account')(() => dbBooks));

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req
    .app
    .get('env') === 'development'
    ? err
    : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
