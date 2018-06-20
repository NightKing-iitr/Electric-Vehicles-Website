const NewsAPI = require('newsapi');
const keys = require('../config/keys');
const newsapi = new NewsAPI(keys.newsapi.key);
const express = require('express');
const router = express.Router();
var countries = require('country-list')();
const Article = require('newspaperjs').Article;

var SourceArray = [];
var sortBy;
var url="localhost:7000/newsfeed";

var countryName = ["Argentina", "Australia", "Austria",
    "Belgium",
    "Brazil",
    "Bulgaria",
    "Canada",
    "China",
    "Colombia",
    "Cuba",
    "Czech Republic",
    "Egypt",
    "France",
    "Germany",
    "Greece",
    "Hong Kong",
    "Hungary",
    "India",
    "Indonesia",
    "Ireland",
    "Israel",
    "Italy",
    "Japan",
    "Latvia",
    "Lithuania",
    "Malaysia",
    "Mexico",
    "Morocco",
    "Netherlands",
    "New Zealand",
    "Nigeria",
    "Norway",
    "Philippines",
    "Poland",
    "Portugal",
    "Romania",
    "Russia",
    "Saudi Arabia",
    "Serbia",
    "Singapore",
    "Slovakia",
    "Slovenia",
    "South Africa",
    "South Korea",
    "Sweden",
    "Switzerland",
    "Taiwan",
    "Thailand",
    "Turkey",
    "UAE", "Ukraine", "United Kingdom", "United States", "Venuzuela"];
var CountryArray = [];

for(i in countryName){
    var name = countryName[i];
    var id = countries.getCode(name);
    if(name =="Russia"){
        id = 'ru';
    }
    else if(name == "South Korea"){
        id = 'kr';
    }
    else if(name == "Taiwan"){
        id = 'tw';
    }
    else if(name == "UAE"){
        id = 'ae';
    }
    else if(name == "Venuzuela"){
        id = 've';
    }
    //convert uppercase country id into lowercase
    id = id.toLowerCase();
    CountryArray.push({id: id, name: name});
}

newsapi.v2.sources({}).then(function(response, error){
    if(error) {
        console.log('No valid sources found!');
    }
    else {
        for(i in response.sources) {
            var source = response.sources[i];
            var sourceDetail = {
                name: source.name,
                id: source.id
            };
            if(source.language == 'en'){
                SourceArray.push(sourceDetail);
            }
        }
    }
});

var keywordsArray = [];

newsapi.v2.everything({
    q: 'electric-vehicles',
    language: 'en',
    sortBy: 'publishedAt',
}).then(function(response, error){
    if(response) {
        var articles = response.articles;
        for(i in articles){
            var url = articles[i].url;
            Article(url)
                .then(result=>{
                    var keywords = result.keywords;
                    for(key  in keywords){
                        //console.log(keywords[key]);
                        keywordsArray.push(keywords[key]);
                    }
                }).catch(reason=>{
                    console.log('No keywords found!');
            })    
        }
    }
});


router.get('/', function(req, res, next){
    console.log('Get home newsfeed!');
    url = url + '/';
    newsapi.v2.everything({
        q: 'electric-vehicles',
        language: 'en',
        sortBy: 'publishedAt',
        pageSize: 100,
        page: 1
    }).then(function(response, error){
        if(error) {
            res.send('Error found!');
        }
        else {
            //console.log(response.articles.length);
            var currPage  = 1;
            console.log('page no. = ' + req.query.page);
            if (typeof req.query.page !== 'undefined') {
                currPage = req.query.page;
            }
            console.log('currpage: ' + currPage);
            var newsArray = [];
            for(i=(currPage-1)*10; i<(currPage*10); i++){
                newsArray.push(response.articles[i]);
            }
            res.render('pages/newsfeed', {user: req.user, newsArray: newsArray,
                 sourceArray: SourceArray, countryArray: CountryArray, keywordsArray: keywordsArray,
                  url: url, sortBy: sortBy});
        }
    });
});


router.post('/', function(req, res, next){
    var query = req.body.searchTag;
    query = query.replace(/ /g,"-");
    console.log(query);
    query = 'electric-vehicles-'+ query;
    console.log(query);
    newsapi.v2.everything({
        q: query,
        language: 'en',
        sortBy: 'relevancy',
        pageSize: 100,
        //page:
    }).then(function(response, error){
        if(error) {
            res.send('Error found!');
        }
        else {
            var newsArray = [];
            for(i=0; i<10; i++){
                newsArray.push(response.articles[i]);
            }
            res.render('pages/newsfeed', {newsArray: newsArray,
                sourceArray: SourceArray, countryArray: CountryArray, keywordsArray: keywordsArray,
                sortBy: sortBy});
        }
    });
});

router.get('/sortBy', function(req, res, next){
    console.log('Sort function implemented!');
    //console.log(req.body);
    //console.log(req.query);
    sortBy = req.query.sortBy;
    console.log('sortBy: ' + sortBy);
    console.log('pageno.: ' + req.query.page);
    newsapi.v2.everything({
        q: 'electric-vehicles',
        language: 'en',
        sortBy: sortBy,
        pageSize: 100,
        page: 1
    }).then(function(response, error){
        if(error) {
            res.send('Error found!');
        }
        else {
            console.log(response.articles.length);
            var currPage  = 1;
            //console.log(req.query.page);
            if (typeof req.query.page !== 'undefined') {
                currPage = req.query.page;
            }
            var newsArray = [];
            for(i=(currPage-1)*10; i<(currPage*10); i++){
                newsArray.push(response.articles[i]);
            }
            res.render('pages/newsfeed', {newsArray: newsArray,
                sourceArray: SourceArray, countryArray: CountryArray,
                 keywordsArray: keywordsArray, sortBy: sortBy});
        }
    });
});

router.get('/source', function(req, res, next){
    console.log('Source is selected!');
    //console.log(req.body.source);
    var sourceName = req.query.source;
    console.log('source: ' + sourceName);
    console.log('pageno.: ' + req.query.page);
    newsapi.v2.everything({
        q: 'electric-vehicles',
        sources: sourceName,
        language: 'en',
        sortBy: 'publishedAt',
        pageSize: 100,
        page: 1
    }).then(function(response, error){
        if(error) {
            res.send('Error found!');
        }
        else {
            if(response.totalResults == 0){
                res.send('No relevant news found!');
            }
            else{
     
                var newsArray = [];
                var currPage = 1;
                if (typeof req.query.page !== 'undefined') {
                    currPage = req.query.page;
                }
            res.render('pages/newsfeed', {newsArray: newsArray,
                sourceArray: SourceArray, countryArray: CountryArray, keywordsArray: keywordsArray,
                sortBy: sortBy});
            }
        }
    });
});

router.post('/country', function(req, res, next){
    console.log(req.body.country);
    var country = req.body.country;
    newsapi.v2.everything({
        q: 'electric-vehicles-'+ country,
        language: 'en',
        sortBy: 'relevancy',
    }).then(function(response, error){
        if(error) {
            res.send('Error found!');
        }
        else {
            if(response.totalResults == 0){
                res.send('No relevant news found!');
            }
            else{
                var newsArray = [];
                for(i in response.articles){
                    newsArray.push(response.articles[i]);
                    if(newsArray.length == 10){
                        break;
                    }
                }
            res.render('pages/newsfeed', {newsArray: newsArray,
                sourceArray: SourceArray, countryArray: CountryArray, keywordsArray: keywordsArray,
                sortBy: sortBy});
            }
        }
    });
});

router.get('/:keyword', function(req, res, next){
    var keyword = req.params.keyword;
    var query = keyword.replace(/ /g,"-");
    console.log(query);
    newsapi.v2.everything({
        q: 'electric-vehicles-'+ query,
        language: 'en',
        sortBy: 'relevancy',
    }).then(function(response, error){
        if(error) {
            res.send('Error found!');
        }
        else {
            if(response.totalResults == 0){
                res.send('No relevant news found!');
            }
            else{
                var newsArray = [];
                for(i in response.articles){
                    newsArray.push(response.articles[i]);
                    if(newsArray.length == 10){
                        break;
                    }
                }
            res.render('pages/newsfeed', {newsArray: newsArray,
                sourceArray: SourceArray, countryArray: CountryArray, keywordsArray: keywordsArray,
                sortBy: sortBy});
            }
        }
    });
});

module.exports = router;