const NewsAPI = require('newsapi');
const newsapi = new NewsAPI('5c844fe332f34b5c9da5159c9b8a544a');
const express = require('express');
const router = express.Router();
var countries = require('country-list')();
const Article = require('newspaperjs').Article;

var SourceArray = [];
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
    url = url + '/';
    newsapi.v2.everything({
        q: 'electric-vehicles',
        language: 'en',
        sortBy: 'publishedAt',
        page: 1
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
                 sourceArray: SourceArray, countryArray: CountryArray, keywordsArray: keywordsArray, url: url});
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
                sourceArray: SourceArray, countryArray: CountryArray, keywordsArray: keywordsArray});
        }
    });
});

router.post('/sortBy', function(req, res, next){
    console.log(req.body);
    var sortBy = req.body.sortBy;
    newsapi.v2.everything({
        q: 'electric-vehicles',
        language: 'en',
        sortBy: sortBy,
        page: 1
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
                sourceArray: SourceArray, countryArray: CountryArray, keywordsArray: keywordsArray});
        }
    });
});

router.post('/source', function(req, res, next){
    console.log(req.body.source);
    var sourceName = req.body.source;
    newsapi.v2.everything({
        q: 'electric-vehicles',
        sources: sourceName,
        language: 'en',
        sortBy: 'publishedAt',
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
                var count = 10;
                if(count > response.totalResults) {
                    count = response.totalResults;
                }
                for(i=0; i<count; i++){
                    newsArray.push(response.articles[i]);
                }
            res.render('pages/newsfeed', {newsArray: newsArray,
                sourceArray: SourceArray, countryArray: CountryArray, keywordsArray: keywordsArray});
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
                sourceArray: SourceArray, countryArray: CountryArray, keywordsArray: keywordsArray});
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
                sourceArray: SourceArray, countryArray: CountryArray, keywordsArray: keywordsArray});
            }
        }
    });
});

router.get('/page/:pagenum', function(req, res, next){
    console.log(req.params);
    res.send('Working page!');
});

module.exports = router;