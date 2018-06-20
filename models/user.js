const mongoose = require('mongoose');
const Schema = mongoose.Schema;
var bcrypt = require('bcryptjs');
var randomstring = require('randomstring');
//var mailer = require('../config/mailer');
const sgMail = require('@sendgrid/mail');
const keys = require('../config/keys');

const SENDGRID_API_KEY = keys.sendgrid.key;


const UserSchema = new Schema({
    username: String,
    userId: String,
    provider: String,
    email: String,
    password: String,
    thumbnail: String,
    secretToken: String,
    active: Boolean
});

const User = mongoose.model('User', UserSchema);

module.exports = User;

module.exports.createUser = function(newUser, callback){
	bcrypt.genSalt(10, function(err, salt) {
	    bcrypt.hash(newUser.password, salt, function(err, hash) {
	        newUser.password = hash;
	        var secretToken = randomstring.generate();
	        newUser.secretToken = secretToken;
	        newUser.active = false;
			console.log('secretToken generated: ',secretToken);
			newUser.save(callback);
	        // Compose email
	        const html = `Hi there,
	        <br/>
	        Thank you for registering!
	        <br/><br/>
	        Please verify your email by typing the following token:
	        <br/>
	        Token: <b>${secretToken}</b>
	        <br/>
	        On the following page:
	        <a href="http://localhost:7000/auth/verify">http://localhost:7000/auth/verify</a>
	        <br/><br/>
	        Have a pleasant day.`
            // Send email
            sgMail.setApiKey(process.env.SENDGRID_API_KEY);
            const msg = {
                to: newUser.email,
                from: 'admin@avbytes.com',
                subject: 'Verify your account.',
                text: 'This is where fun begins Sendgrid!!!',
                html: html,
              };
              sgMail.send(msg);
	    });
	});
}

module.exports.getUserByEmail = function(email, callback){
	var query = {email: email};
	User.findOne(query, callback);
}

module.exports.getUserById = function(id, callback){
	User.findById(id, callback);
}

module.exports.comparePassword = function(candidatePassword, hash, callback){
	bcrypt.compare(candidatePassword, hash, function(err, isMatch) {
    	if(err) {
            console.log('Passwords not match');
            throw err;
        }
    	callback(null, isMatch);
	});
}