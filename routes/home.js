const express = require('express');
const router = express.Router();
var mongo = require('mongodb').MongoClient;
var objectId = require('mongodb').ObjectID;
var mongoose = require('mongoose');
//import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
var readingTime = require('reading-time');

var Blog = require('../models/blog');

var db = mongoose.connection;

//retrieving blog
router.get('/', function(req, res, next){
    var blogArray = [];
    var cursor = db.collection('blogs').find();
    cursor.forEach(function(doc, err){
		if(err) throw err;
		else {
			var bloghead = {
                id: doc._id,
                heading: doc.heading,
                author: doc.author,
                createdAt: doc.dateCreated,
                minuteread: doc.minuteread
            };
			blogArray.push(bloghead);
		}
	}, function() {
		blogArray = blogArray.reverse();
		res.render('pages/home', {blogarray: blogArray});
	});
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

router.get('/createblog', function(req, res) {
    res.render('pages/createblog');
});

//create blog
router.post('/createblog', function(req, res, next){
    var html = req.body.editor;
    var stats = readingTime(html);
    console.log(stats);
    var minuteRead  = stats.text;
    const dom = new JSDOM(html);
    var heading = dom.window.document.querySelector("h2");
    if(heading == null){
        res.render('pages/success', {msg: 'Please provide a suitable heading...'});
    }
    else{
        console.log(heading.textContent);
        heading = heading.textContent;
        //save blog into Database
        var newBlog = new Blog({
            heading: heading,
            htmlDoc: html,
            author: 'Admin_User',//req.user.id
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