const express = require('express');
const router = express.Router();
var objectId = require('mongodb').ObjectID;
var mongoose = require('mongoose');
const sgMail = require('@sendgrid/mail');
const keys = require('../config/keys');
var randomstring = require('randomstring');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
var readingTime = require('reading-time');

var Blog = require('../models/blog');
const SENDGRID_API_KEY = keys.sendgrid.key;

var db = mongoose.connection;

//middleware for auth check
const authCheck = (req, res, next) => {
    if(!req.user){
        res.redirect('/auth/login');
    } else {
        next();
    }
};

const verifyObjectId = (req, res, next) => {
    var id = req.params.id;
    if(objectId.isValid(id)){
        next();
    }else{
        res.render('pages/success', {msg: 'Parameter passed is not valid...'});
    }
};

function isNormalInteger(str) {
    var n = Math.floor(Number(str));
    return String(n) === str && n >= 0;
}

//sends random quotes on get requests
router.get('/quotes', function(req, res){
    var quotes = [];
    var cursor = db.collection('quotes').find();
    cursor.forEach(function(doc, err){
		if(err) throw err;
		else {
            quotes = doc.quotes;
            let total = Math.floor(Math.random() * quotes.length);
            res.send(quotes[total]);
        }
    });
});

router.get('/user', authCheck, function(req, res){
    var user = req.user;
    var userId = user.id;
    var username = user.username;
    var usertype = user.usertype;
    console.log(userId+' '+username);
    var Blogs = user.savedBlogs;
    //console.log(Blogs.length);
    var saved_blogs = Blogs;
    var written_blogs = [];
    //res.send('Not Working');
    var cursor = db.collection('blogs').find({"author.Id" : userId});
    cursor.forEach(function(doc, err){
        if(err) {
            console.log('Error found!!');
            //throw err;
        }
        else{
            //console.log(doc.heading);
            var bloghead = {
                id: doc._id,
                heading: doc.heading,
                imageurl: doc.imageurl,
                description: doc.description,
                author: {Id: doc.author.Id, name: doc.author.name},
                createdAt: doc.dateCreated,
                minuteread: doc.minuteread
            };
            //console.log(bloghead);
            written_blogs.push(bloghead);
        }
    },function(){
        var profile ={
            username: username,
            usertype: usertype,
            savedBlogs: saved_blogs,
            writtenBlogs: written_blogs
        };
        res.send(profile);
    });
});

//sends 5 blogs serially and time wise sorted
router.get('/blogs', function(req,res){
    var blogs = [];
    var page = req.query.pagenum;
    //console.log(page);
    if(!page){
        //console.log('Not working');
        res.send(blogs);
    }
    else{
        if(!isNormalInteger(page)){
            //console.log('Not working');
            res.send(blogs);
        }
        else{
            var total = page * 5;
            total -= 5;
            var cursor = db.collection('blogs').find().sort({dateCreated: -1}).limit(5).skip(total);
            cursor.forEach(function(doc, err){
                if(err) throw err;
                else{
                    if(doc.verify.status){
                        //verification status is true
                        var bloghead = {
                            id: doc._id,
                            heading: doc.heading,
                            imageurl: doc.imageurl,
                            description: doc.description,
                            author: {Id: doc.author.Id, name: doc.author.name},
                            createdAt: doc.dateCreated,
                            minuteread: doc.minuteread
                        };
                        blogs.push(bloghead);
                    }
                    //console.log(bloghead);
                }
            },function(){
                //console.log(blogs);
                res.send(blogs);
            });
        }
    }
});

//save blog to bookmark section
router.get('/saveblog', authCheck, function(req,res){
    //console.log(req.query);
    var blogId = req.query.blogId;
        //save the blogs
        var savedBlogs = req.user.savedBlogs;
        if (blogId.match(/^[0-9a-fA-F]{24}$/)) {
            db.collection('blogs').findOne({"_id": objectId(blogId)}, function(err, blog){
                if(err){
                    res.send('Blog not found!');
                }
                else{
                    if(!blog){
                        res.send('Blog not found!');
                    }else{
                        if(savedBlogs.indexOf(blogId) === -1){
                        //blog not found
                            var userId = req.user.id;
                            db.collection('users').updateOne({_id: objectId(userId)},
                            {$push: {savedBlogs: blogId}});
                            res.send('Saved to bookmarks...');
                        }
                        else{
                            res.send('Already saved to the database');
                        }
                    }  
                }
            });
        } else {
            res.send('Not a valid request.');   
        }
    
});

//remove blog to bookmark section
router.get('/removeblog', authCheck, function(req,res){
    var blogId = req.query.blogId;
    var savedBlogs = req.user.savedBlogs;
    if (blogId.match(/^[0-9a-fA-F]{24}$/)) {
        db.collection('blogs').findOne({"_id": objectId(blogId)}, function(err, blog){
            if(err){
                res.send('Blog not found!');
            }
            else{
                if(!blog){
                    res.send('Blog not found!');
                }else{
                    if(savedBlogs.indexOf(blogId) === -1){
                        res.send('Blog is not yet bookmarked!');
                    }
                    else{
                        var userId = req.user.id;
                        db.collection('users').updateOne({_id: objectId(userId)},
                         {$pull: {savedBlogs: blogId}});
                        res.redirect('/user');
                    }
                }  
            }
        });
    } else {
        res.send('Not a valid request.');   
    }
});

//view blogs written by authors
router.get('/author/:id', function(req, res){
    var  blogs = [];
    var authId = req.params.id;
    var authName = '';
    //console.log(authId);
    //embedded docs query in mongoose
    var cursor = db.collection('blogs').find({"author.Id" : authId});
    cursor.forEach(function(doc, err){
        if (err){
            res.send('User not found!!');
        }
        else{
            authName = doc.author.name;
            var bloghead = {
                id: doc._id,
                heading: doc.heading,
                imageurl: doc.imageurl,
                description: doc.description,
                author: {Id: doc.author.Id, name: doc.author.name},
                createdAt: doc.dateCreated,
                minuteread: doc.minuteread
            };
            blogs.push(bloghead);
        }
    },function(){
        var author = {
            id: authId,
            name: authName,
            blogsArray: blogs
        };
        if(authName != ''){
            if(!author.blogsArray.length){
                res.send('User is not a valid author!!');
            }else{
                res.send(author);
            }
        }else{
            res.send('User not found!!');
        }
    });
});

//home 
router.get('/', function(req, res){
    var blogArray = [];
    //get latest 5 docs 
    var cursor = db.collection('blogs').find().sort({dateCreated:-1}).limit(5);
    cursor.forEach(function(doc, err){
		if(err) throw err;
		else {
			if(doc.verify.status){
                //verification status is true
                var bloghead = {
                    id: doc._id,
                    heading: doc.heading,
                    imageurl: doc.imageurl,
                    description: doc.description,
                    author: {Id: doc.author.Id, name: doc.author.name},
                    createdAt: doc.dateCreated,
                    minuteread: doc.minuteread
                };
                blogArray.push(bloghead);
            }
		}
	}, function() {
		res.render('pages/home', {user: req.user, blogarray: blogArray});
	});
});

router.get('/bookmarks', authCheck ,function(req,res){
    var blogId = req.user.savedBlogs;
    ///console.log(blogId);
    var blogsArray = [];
    function saveBookmarks(i){
        if(i<blogId.length){
            db.collection('blogs').findOne({_id: objectId(blogId[i])}, function(doc){
                if(doc){
                    var bloghead = {
                        id: doc._id,
                        heading: doc.heading,
                        description: doc.description,
                        imageurl: doc.imageurl,
                        author: {Id: doc.author.Id, name: doc.author.name},
                        createdAt: doc.dateCreated,
                        minuteread: doc.minuteread
                    };
                    blogsArray.push(bloghead);
                    saveBookmarks(i+1);
                    //console.log(bloghead);
                }else{
                    console.log('Error found...');
                    saveBookmarks(i+1);
                }
            });
        }else{
            //blogsArray = blogsArray.reverse();
            res.render('pages/bookmarks', {blogArray: blogsArray});
        }
    }
    saveBookmarks(0);
});

//view blog 
router.get('/view/:id',function(req, res){ 
    //console.log(req.params);
    var blogId = req.params.id;
    var pageUrl = 'localhost:7000/view/' + blogId;
    //console.log(pageUrl);
    db.collection('blogs').findOne({_id: objectId(req.params.id)},function(err, doc){
        if(err){
            res.render('pages/success', {msg: 'Error, page not found!'});
        }                                                                                                                                                                                                                       
        else{
            res.render('pages/blogview', {htmldoc: doc.htmlDoc,
                 pageUrl: pageUrl, uniqueId: blogId});
        }
    });
});

router.get('/createblog', authCheck ,function(req, res) {
    var user = req.user;
    if(user.usertype == 'contributor'){
        res.render('pages/createblog',{user: req.user});
    }
    else{
        res.render('pages/success',{msg: 'Please become a contributor and start writing your blog...'});
    }
});

/*const auth_moderatorCheck = (req, res, next) => {
    if(!req.user){
        res.redirect('/auth/moderator');
    } else {
        next();
    }
};*/

//create blog
router.post('/createblog', function(req, res){
    //var username = req.user.username;
    var htmldoc = req.body.editor;
    var stats = readingTime(htmldoc);
    var minuteRead  = stats.text;
    const dom = new JSDOM(htmldoc);
    var heading = dom.window.document.querySelector("h2");
    var imageUrl = dom.window.document.querySelector("img").getAttribute('src');
    var description = dom.window.document.querySelector("p").textContent;
    if(heading == null){
        res.render('pages/success', {msg: 'Please provide a suitable heading...'});
    }else if(imageUrl == null){
        res.render('pages/success', {msg: 'Please provide at least one image...'});
    }else{
        //console.log(heading.textContent);
        heading = heading.textContent;

        //generate token for the blog
        var verificationToken = randomstring.generate();

        //save blog into Database
        var newBlog = new Blog({
            heading: heading,
            imageurl: imageUrl,
            description: description,
            htmlDoc: htmldoc,
            author: {Id: req.user.id, name: req.user.username},
            minuteread: minuteRead,
            comment: [],
            likes: '0',
            verify: {
                token: verificationToken,
                status: false
            }
        });
        newBlog.save();
        res.render('pages/success', {msg: 'Post is send for verification'});
        const html = `Hi moderator,
	    <br/><br/>
	    Please click on the following link to verify blog:
		<br/>
		<a href="http://localhost:7000/verifyPost/${verificationToken}">
			http://localhost:7000/verifyPost
		</a>
	    <br/><br/>
	    Have a pleasant day.`
        // Send email
        sgMail.setApiKey(SENDGRID_API_KEY);
        const msg = {
        to: 'ankitadityasingh786@gmail.com',//moderator email ID
        from: 'admin@evbytes.com',
        subject: "Verify contributor's blog.",
        text: 'This is where the fun begins...',
        html: html,
        };
        sgMail.send(msg);
    }
});

router.get('/verifyPost/:token',  function(req, res){
    var verificationToken = req.params.token;
    db.collection('blogs').findOne({verify: {token: verificationToken, status: false}},function(err, doc){
        if(err){
            //send blog not found
            res.render('pages/success', {msg: err});
        }else if(doc==null){
            res.render('pages/success', {msg: 'Sorry, blog is already verified...'});
        }else{
            //send the htmlDoc to the ckeditor
            var htmldoc = doc.htmlDoc;
            var blogId = doc._id;
            res.render('pages/editor', {blogId: blogId, htmldoc: htmldoc});
        }
    });
});

router.post('/verifyBlog/:id', verifyObjectId, function(req, res){
    var blogId = req.params.id;
    //console.log(blogId);
    db.collection('blogs').findOneAndUpdate({_id: objectId(blogId)},
    {$set: {verify: {token: '', status: true}}}, {}, function(err, raw){
        if(err){
            //blog not found...
            res.render('pages/success', {msg: "Sorry, blog couldn't be found"});
        }else{
            var blog = raw.value;//updated raw document
            var authorId = blog.author.Id;
            //console.log('authorId',authorId);
            db.collection('users').findOne({_id: objectId(authorId)}, function(err, doc){
                var authEmail = doc.email;
                const html = `Hi user,
                <br/><br/>
                Your post has been published.
	            <br/><br/>
                Have a pleasant day.`
                sgMail.setApiKey(SENDGRID_API_KEY);
                const msg = {
                to: authEmail,//author email ID
                from: 'admin@evbytes.com',
                subject: "Blog published notification.",
                text: 'This is where the fun begins...',
                html: html,
                };
                sgMail.send(msg);
            });
            res.render('pages/success', {msg: "Blog is verified and submitted..."});
        }
    });
});

router.post('/deleteBlog/:id', verifyObjectId, function(req, res){
    var blogId = req.params.id;
    db.collection('blogs').findOneAndDelete({_id: objectId(blogId)}, function(err, raw){
        if(err){
            res.render('pages/success',{msg: "Sorry, blog couldn't be found"});
        }
        else{
            var blog = raw.value;//deleted document
            var authorId = blog.author.Id;
            var blogHtml = blog.htmlDoc;
            db.collection('users').findOne({_id: objectId(authorId)}, function(err, doc){
                var authEmail = doc.email;
                const html = `Sorry,
                <br/><br/>
                Your post has been deleted.
	            <br/><br/>
                Have a pleasant day.`
                sgMail.setApiKey(SENDGRID_API_KEY);
                const msg = {
                to: authEmail,//author email ID
                from: 'admin@evbytes.com',
                subject: "Blog deleted notification.",
                text: 'This is where the fun begins...',
                html: html,
                };
                sgMail.send(msg);
            });
            res.render('pages/success', {msg: "Blog is deleted and notification email is sent..."});
        }
    });
});

//edit posts
router.put('/', function(){
    //logic to edit post
});

//delete posts
router.delete('/', function(){
    //logic to delete post
});

module.exports = router;