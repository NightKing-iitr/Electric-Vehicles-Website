const passport = require('passport');
const googleStrategy = require('passport-google-oauth20');
const facebookStrategy = require('passport-facebook').Strategy;
const twitterStrategy = require('passport-twitter').Strategy;
const LocalStrategy = require('passport-local').Strategy;
const keys = require('./keys');

const User = require('../models/user');

passport.serializeUser(function(user,done){
    //takes user id from the callback function 
    //and passes it to browser
    done(null, user.id);
});

passport.deserializeUser(function(id,done){
    User.findById(id).then(function(user){
        done(null, user);
    });
});

passport.use(
    new googleStrategy({
        //options for the google strategy
        callbackURL: '/auth/google/redirect',
        clientID: keys.google.clientID,
        clientSecret: keys.google.clientSecret
    }, function(accessToken, refreshToken, profile, done){
        //passport callback function
        console.log(profile);
        //check user already exists in DB
        User.findOne({googleId: profile.id}).then(function(currentUser){
            if(currentUser){
                //already have this user
                console.log('user : ', currentUser);
                done(null, currentUser);
            } else {
                //save user into DB
                new User({
                    username: profile.displayName,
                    userId: profile.id,
                    provider: 'google',
                    email: '',
                    thumbnail: profile._json.image.url
                    }).save().then(function(newUser){
                    console.log('new user created: '+ newUser);
                    done(null, newUser);
                });
            }
        });
        
    })
);

passport.use(
    new facebookStrategy({
        //options for the google strategy
        callbackURL: '/auth/facebook/callback',
        clientID: keys.facebook.appID,
        clientSecret: keys.facebook.appSecret
    }, function(accessToken, refreshToken, profile, done){
        //passport callback function
        console.log(profile);
        //check user already exists in DB
        User.findOne({userId: profile.id}).then(function(currentUser){
            if(currentUser){
                //already have this user
                console.log('user : ', currentUser);
                done(null, currentUser);
            } else {
                //save user into DB
                new User({
                    username: profile.displayName,
                    userId: profile.id,
                    provider: 'facebook',
                    thumbnail: 'data:image/png;base64,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'
                    }).save().then(function(newUser){
                    console.log('new user created: '+ newUser);
                    done(null, newUser);
                });
            }
        });
        
    })
);

passport.use(
    new twitterStrategy({
        //options for the google strategy
        callbackURL: '/auth/twitter/callback',
        consumerKey: keys.twitter.appKey,
        consumerSecret: keys.twitter.appSecret
    }, function(accessToken, refreshToken, profile, done){
        //passport callback function

        //check user already exists in DB
        User.findOne({userId: profile.id}).then(function(currentUser){
            if(currentUser){
                //already have this user
                console.log('user : ', currentUser);
                done(null, currentUser);
            } else {
                //save user into DB
                console.log(profile.photos[0].value);
                new User({
                    username: profile.displayName,
                    userId: profile.id,
                    provider: 'twitter',
                    thumbnail: profile.photos[0].value
                    }).save().then(function(newUser){
                    console.log('new user created: '+ newUser);
                    done(null, newUser);
                });
            }
        });
        
    })
);

passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
  },
    function(username, password, done) {
      User.findOne({ email: username }, function(err, user) {
        if (err) { return done(err); }
        if (!user) {
          return done(null, false, { message: 'Unknown email.' });
        }
        User.comparePassword(password, user.password, function (err, isMatch) {
            if (err) throw err;
            if (isMatch) {
                if(!user.active){
                    return done(null, false, {message: 'Validate your Email first!'});
                }
                else
                    return done(null, user);
            }
            else {
                return done(null, false, { message: 'Invalid password' });
            }
        });
      });
    }
));

