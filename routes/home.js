const express = require('express');
const router = express.Router();
var mongo = require('mongodb').MongoClient;
var objectId = require('mongodb').ObjectID;
var mongoose = require('mongoose');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
var readingTime = require('reading-time');

var Blog = require('../models/blog');

var db = mongoose.connection;

//middleware for auth check
const authCheck = (req, res, next) => {
    if(!req.user){
        res.redirect('/auth/login');
    } else {
        next();
    }
};

function isNormalInteger(str) {
    var n = Math.floor(Number(str));
    return String(n) === str && n >= 0;
}

//sends random quotes on get requests
router.get('/quotes', function(req,res){
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
router.get('/', function(req, res, next){
    var blogArray = [];
    //get latest 5 docs 
    var cursor = db.collection('blogs').find().sort({dateCreated:-1}).limit(5);
    cursor.forEach(function(doc, err){
		if(err) throw err;
		else {
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
            db.collection('blogs').findOne({_id: objectId(blogId[i])}, function(err, doc){
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
router.get('/view/:id',function(req, res, next){ 
    //console.log(req.params);
    var blogId = req.params.id;
    var pageUrl = 'localhost:7000/view/' + blogId;
    console.log(pageUrl);
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

//create blog
router.post('/createblog', function(req, res, next){
    var html = req.body.editor;
    var stats = readingTime(html);
    var minuteRead  = stats.text;
    const dom = new JSDOM(html);
    var heading = dom.window.document.querySelector("h2");
    var imageUrl = dom.window.document.querySelector("img").getAttribute('src');
    var description = dom.window.document.querySelector("p").textContent;
    //console.log(description);
    if(heading == null){
        res.render('pages/success', {msg: 'Please provide a suitable heading...'});
    }else if(imageUrl == null){
        res.render('pages/success', {msg: 'Please provide at least one image...'});
    }else{
        console.log(heading.textContent);
        heading = heading.textContent;
        //save blog into Database
        var newBlog = new Blog({
            heading: heading,
            imageurl: imageUrl,
            description: description,
            htmlDoc: html,
            author: {Id: req.user.id, name: req.user.username},
            minuteread: minuteRead,
            comment: [],
            likes: '0'
        });
        newBlog.save();
        res.render('pages/success', {msg: 'Post created successfully...'});
    }
});

//edit posts
router.put('/', function(req, res, next){
    //logic to edit post
});

//delete posts
router.delete('/', function(req, res, next){
    //logic to delete post
});

module.exports = router;