const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const flash = require('connect-flash');
const expressValidator = require('express-validator');
const mongo = require('mongodb');
const mongoose = require('mongoose');
const passportSetup = require('./config/passport-config');
const keys = require('./config/keys');
const cookieSession = require('cookie-session');
const passport = require('passport');

mongoose.connect(keys.mongodb.dbURI,function(){
    console.log('Connected to mongoose database');
});

const authRoutes = require('./routes/authenticate');
const home = require('./routes/home');
const newsfeed = require('./routes/newsfeed');

//init app
var app = express();

// BodyParser Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);

// Set Static Folder
app.use(express.static(path.join(__dirname + '../public')));


app.use(cookieSession({
    maxAge: 24 * 60 * 60 * 1000,//24 hours
    keys: [keys.session.cookieKey]
}));

//initialize passport
app.use(passport.initialize());
app.use(passport.session());

app.use(expressValidator({
    errorFormatter: function(param, msg, value) {
        var namespace = param.split('.')
        , root    = namespace.shift()
        , formParam = root;
  
      while(namespace.length) {
        formParam += '[' + namespace.shift() + ']';
      }
      return {
        param : formParam,
        msg   : msg,
        value : value
      };
    }
  }));

app.use(flash());

// Global Vars
app.use(function (req, res, next) {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  res.locals.user = req.user || null;
  next();
});

app.use('/', home);
app.use('/newsfeed', newsfeed);
app.use('/auth', authRoutes);

// Set Port
app.set('port', (process.env.PORT || 7000));

app.listen(app.get('port'), function(){
	console.log('Server started on port '+app.get('port'));
});