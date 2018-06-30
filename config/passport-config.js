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
                    provider: 'google',
                    usertype: 'viewers',
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
                    usertype: 'viewers'
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
                    thumbnail: profile.photos[0].value,
                    usertype: 'viewers'
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

