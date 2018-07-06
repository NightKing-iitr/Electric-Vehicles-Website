const router = require('express').Router();
const passport = require('passport');
var randomstring = require('randomstring');
var bcrypt = require('bcryptjs');
const sgMail = require('@sendgrid/mail');
const keys = require('../config/keys');
const mongoose = require('mongoose');

const SENDGRID_API_KEY = keys.sendgrid.key;
const User = require('../models/user');

var db = mongoose.connection;

/*function ensureAuthenticated(req, res, next){
	if(req.isAuthenticated()){
		return next();
	} else {
		res.redirect('/auth/login');
	}
}*/

//auth login
router.get('/login', function(req,res){
    res.render('pages/login');
});

//register contributor 
router.get('/contributor', function(req,res){
	var user = req.user;
    if(user.usertype == 'contributor'){
        res.render('pages/success',{msg: 'Hey, you are already a contributor.....'});
    }
    else{
        res.render('pages/registerContributor');
    }
    
});

//signIn through website
router.post('/login', passport.authenticate('local', { successRedirect: '/',
                                                    failureRedirect: '/auth/login',
                                                    failureFlash: true })
);

//get viewers registration page
router.get('/register', function (req, res) {
    res.render('pages/register');  
});

//submit viewers registration page  
router.post('/register', function (req, res) {
	var name = req.body.name;
	var email = req.body.email;
	var password = req.body.password;
    var password2 = req.body.password2;
    console.log(req.body);

	// Validation
	req.checkBody('name', 'Name is required').notEmpty();
	req.checkBody('email', 'Email is required').notEmpty();
	req.checkBody('email', 'Email is not valid').isEmail();
	req.checkBody('password', 'Password is required').notEmpty();
	req.checkBody('password2', 'Passwords do not match').equals(req.body.password);

    //res.send('Working on user registration!');

	var errors = req.validationErrors();

	if (errors) {
		res.render('pages/register', {
			errors: errors
		});
	}
	else {
		//checking for email is already taken
		User.findOne({ email: { 
				"$regex": "^" + email + "\\b", "$options": "i"
			}},
			function (err, mail) {
				if (mail ) {
					res.render('pages/register', {
						mail: mail
					});
				}
				else {
					var newUser = new User({
						username: name,
						email: email,
						password: password,
						usertype: 'viewers',
						secretToken: '',
						active: ''
					});
					
					User.createUser(newUser, function (err, user) {
                        
                        if (err) throw err;
						console.log(user.id);
						
					});
					req.flash('success_msg', 'You are registered but validate your Email to login');
					res.redirect('/auth/login');
				}
		});
	}
});

router.post('/contributor', function(req,res){
	//console.log(req.body);
	var name = req.body.name;
	var email = req.body.email;
	var password = req.body.password;
	var birthdate = req.body.dob;
	var phone = req.body.mobile;
	var organisation = req.body.organisation;
	var position = req.body.position;
	var details = req.body.information; 

	console.log(req.body);

	// Validation
	req.checkBody('name', 'Name is required').notEmpty();
	req.checkBody('email', 'Email is required').notEmpty();
	req.checkBody('email', 'Email is not valid').isEmail();
	req.checkBody('password', 'Password is required').notEmpty();
	//req.checkBody('phone', 'Phone no. is required.').notEmpty();
	//req.checkBody('birthdate', 'Please provide DOB.').notEmpty();
	//req.checkBody('birthdate', 'Not a valid DOB.').isDate();
	req.checkBody('organisation', 'Provide your organisation name.').notEmpty();
	req.checkBody('position', 'Provide your position for the working organisation.').notEmpty();
	//req.checkBody('details', 'Please tell us why you want to join as a contributor??').notEmpty();	

	//res.send('Site under maintainance...');

	var errors = req.validationErrors();
	if (errors) {
		console.log(errors);
		res.render('pages/register', {
			errors: errors
		});
	}
	else {
		//checking for email is already taken
		User.findOne({ email: { 
				"$regex": "^" + email + "\\b", "$options": "i"
			}},
			function (err, mail) {
				if (mail ) {
					//verify the user with a custom email
					res.render('pages/register', {
						mail: mail
					});
				}
				else {
					var newUser = new User({
						username: name,
						email: email,
						phone: phone,
						password: password,
						birthdate: birthdate,
						organisation: organisation,
						position: position,
						details: details,
						usertype: 'contributor',
						secretToken: '',
						active: ''
					});
					
					User.createUser(newUser, function (err, user) {
                        
                        if (err) throw err;
						console.log(user.id);
						
					});
					req.flash('success_msg', 'You are registered but validate your Email to login');
					res.redirect('/auth/login');
				}
		});
	}
});

//verify email first
router.route('/verify')
  .get((req, res) => {
    res.render('pages/verify');
  })
  .post(async (req, res, next) => {
    try {
      const { secretToken } = req.body;

      // Find account with matching secret token
      const user = await User.findOne({ 'secretToken': secretToken });
      if (!user) {
        req.flash('error', 'No user found.');
        res.redirect('/auth/verify');
        return;
      }

      user.active = true;
      user.secretToken = '';
      await user.save();

      req.flash('success', 'Thank you! Now you may login.');
      res.redirect('/auth/login');
    } catch(error) {
      next(error);
    }
  })

//logout
router.get('/logout', function(req,res){
    //handle with passport
    req.logout();//logout the user
    res.redirect('/');
});

router.get('/forgotpass',function(req,res){
	res.render('pages/forgotPass.ejs');
});

router.post('/forgotpass',function(req,res){
	var email = req.body.email;
	console.log(email);

	//verify email
	req.checkBody('email', 'Email is required').notEmpty();
	req.checkBody('email', 'Email is not valid').isEmail();

	var errors = req.validationErrors();

	if (errors) {
		res.render('pages/register', {
			errors: errors
		})
	}
	else{
		User.findOne({email:email}, 
			function(err, user){
			if(err){
				throw err;
			}
			else{
				if(!user){
					res.render('pages/success', {msg: 'Email not found and sign in with it...'});
				}
				else{
					res.render('pages/success', {msg: 'Reset your password with the link sent to your mail...'});
					//newUser.secretToken = secretToken;
					var resetToken = randomstring.generate();
					console.log('resetToken generated: ', resetToken);
					console.log(user.email);
					//save the token into user schema
					db.collection('users').updateOne({email: user.email},
					{$set: {resetToken: resetToken}, function(err,doc){
						if(err) {
							console.log('Something went wrong!');
						}else {
							console.log(doc);
						}
					}});
					const html = `Hi there,
	        		<br/><br/>
	        		Please click on the following link to reset your password:
					<br/>
	        			Token: <b>${resetToken}</b>
	        		<br/>
	        		On the following page:
					<a href="http://localhost:7000/auth/changepass">
						http://localhost:7000/auth/changepass
					</a>
	        		<br/><br/>
	        		Have a pleasant day.`
            		// Send email
            		sgMail.setApiKey(SENDGRID_API_KEY);
            		const msg = {
                	to: user.email,
                	from: 'admin@evbytes.com',
                	subject: 'Reset your account password.',
                	text: 'This is where the fun begins...',
               		 html: html,
              		};
              		sgMail.send(msg);
				}
			}
		});
	}

});

router.get('/changepass', function(req, res){
	//console.log(req.params.token);
	res.render('pages/changepass');
});

router.post('/changepass', function(req, res){
	console.log(req.body);
	var resetToken = req.body.resetToken;
	var password = req.body.password;
	var password2 = req.body.password2;

	req.checkBody('resetToken', 'Please enter the exact token send to your mail.').notEmpty();
	req.checkBody('password', 'Password is required').notEmpty();
	req.checkBody('password2', 'Passwords do not match').equals(req.body.password);

	var errors = req.validationErrors();
	if (errors) {
		console.log(errors);
		res.render('pages/register', {
			errors: errors
		});
	}
	else{
		bcrypt.genSalt(10, function(err, salt) {
			bcrypt.hash(password, salt, function(err, hash) {
				password = hash;
				console.log(password);
				db.collection('users').updateOne({resetToken: resetToken},
					{$set: {password: password, resetToken: ''}}, function(err,doc){
						if(err){
							res.render('pages/success',{msg: 'Please enter a valid token.'});
						}
						else{
							//password changed
							res.render('pages/login');
						}
				});
			});
		});
	}
});

//auth with google
router.get('/google', passport.authenticate('google',{
    scope:['profile']
}));

//auth with facebook
router.get('/facebook', passport.authenticate('facebook'));

//auth with twitter
router.get('/twitter', passport.authenticate('twitter', {
    scope:['profile']
}));

//callback route for google to redirect
router.get('/google/redirect', passport.authenticate('google') ,function(req,res){
    //res.send('req.user');
    //access the logged in user data
    //finally authenticated with google
    res.redirect('/');
});

//callback route for facebook to redirect
router.get('/facebook/callback',
  passport.authenticate('facebook', { successRedirect: '/',
                                      failureRedirect: '/auth/login' }
));

//callback route for google to redirect
router.get('/twitter/callback',
  passport.authenticate('twitter', { successRedirect: '/',
                                     failureRedirect: '/auth/login' }));

module.exports = router;