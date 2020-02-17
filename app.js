//Libraries
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var logger = require('morgan');
var session = require("express-session");
var okta = require("@okta/okta-sdk-nodejs");
var ExpressOIDC = require("@okta/oidc-middleware").ExpressOIDC;
//const MongoClient = require('mongodb').MongoClient;
//var monk = require('monk');
//var db = monk('localhost:27017/mydb');

var MongoClient = require('mongodb').MongoClient
var url = 'mongodb://localhost/mydb';

MongoClient.connect(url, function(err, client) {
  //Querying for data in mongodb db .
  var db = client.db('mydb');
  var cursor = db.collection('locations').find();

  cursor.each(function (err, doc) {
 //console.log(doc)
  });

  console.log("connected");
  client.close();
});

//Routes
const dashboardRouter = require("./routes/dashboard");     
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var createsiteRouter = require('./routes/createsite');
var feedRouter = require('./routes/feed');
var addlocationRouter = require('./routes/addlocation');

var app = express();

//Auth
var oktaClient = new okta.Client({
  orgUrl: 'https://dev-487223.okta.com',
  token: '00V4ARQmSygCFW_cL5PF8Hh1QkfHL0euHsYHEv-dta'
});
const oidc = new ExpressOIDC({
  issuer: "https://dev-487223.okta.com/oauth2/default",
  client_id: "0oa1cpsm5180lsbG7357",
  client_secret: "InhSzjeNB_52d9WQd7BcTXaxlA1XmHRuMxa5zdxd",
  redirect_uri: 'http://198.199.82.106:80/users/callback',
  scope: "openid profile",
  routes: {
    login: {
      path: "/users/login"
    },
    callback: {
      path: "/users/callback",
      defaultRedirect: "/dashboard"
    }
  }
});

app.use(session({
  secret: 'asdf;lkjh3lkjh235l23h5l235kjh',
  resave: true,
  saveUninitialized: false
}));
app.use(oidc.router);

app.use((req, res, next) => {
  if (!req.userinfo) {
    return next();
  }

  oktaClient.getUser(req.userinfo.sub)
    .then(user => {
      req.user = user;
      res.locals.user = user;
      next();
    }).catch(err => {
      next(err);
    });
});

function loginRequired(req, res, next) {
  if (!req.user) {
    return res.status(401).render("unauthenticated");
  }

  next();
}

// port
var port = 80;

var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// serve files from the public directory
app.use(express.static('public'));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'Vcjanvnsbyohejganbfgtohtosofoeepqpbgnwoe',
  resave: true,
  saveUninitialized: false
}));

//Enable Routes
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/dashboard', loginRequired, dashboardRouter);
app.use('/createsite', loginRequired, createsiteRouter);
app.use('/feed', loginRequired, feedRouter);
app.use('/addlocation', addlocationRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;

// MONGODB BABY
var mongoose = require("mongoose");
mongoose.Promise = global.Promise;mongoose.connect("mongodb://localhost:27017/mydb");


// schemas
var userSchema = new mongoose.Schema({
  name: String,
  points: Number,
  awards: Boolean,
  bio: String
});

var LocationSchema = new mongoose.Schema({
  id: String,
  user: String,
  location: String,
  title: String,
  picture: String,
  description: String
});

var User = mongoose.model("User", userSchema);
//var Location = mongoose.model("Location", locationSchema);

// POST 
app.post("/addlocation", (req, res) => {
  var myData = new Location(req.body);
  myData.save()
  .then(item => {
  res.send("item saved to database");
  })
  .catch(err => {
  res.status(400).send("unable to save to database");
  });
 });

// listen
app.listen(port, () => console.log(`Listening on port ${port}...`))

