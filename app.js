const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const mongo = require('mongodb');
const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/evBytes');
mongoose.connection.on('connected', function(){
    console.log('Connected to mongoose database');
});

var home = require('./routes/home');
var newsfeed = require('./routes/newsfeed');

//init app
var app = express();

// BodyParser Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
//app.use(cookieParser());

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);

// Set Static Folder
app.use(express.static(path.join(__dirname, 'public')));

/*app.get('/',function(req, res){
    res.send('Hello World...');
});*/

app.use('/', home);
app.use('/newsfeed', newsfeed);

// Set Port
app.set('port', (process.env.PORT || 7000));

app.listen(app.get('port'), function(){
	console.log('Server started on port '+app.get('port'));
});