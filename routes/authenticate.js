const router = require('express').Router();
const passport = require('passport');
const User = require('../models/user');
//const passportConfig = require('../config/passport-config');

function ensureAuthenticated(req, res, next){
	if(req.isAuthenticated()){
		return next();
	} else {
		res.redirect('/auth/login');
	}
}

//auth login
router.get('/login', function(req,res){
    res.render('pages/login');
});

//signIn through website
router.post('/login', passport.authenticate('local', { successRedirect: '/',
                                                    failureRedirect: '/auth/login',
                                                    failureFlash: true })
);

//get registration page
router.get('/register', function (req, res) {
    res.render('pages/register');  
});

//submit registration page  
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