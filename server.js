// get the data INTO mongoDB and then from mongoDB to rendering upon html
// reference Activity 20 Mongoose

var express = require('express');
// var handleBars =  require('handleBars');
var exphbs = require('express-handlebars');
var app = express();
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var cheerio = require('cheerio');
var request = require('request');
var morgan = require('morgan');
var request = require('request');
var PORT = process.env.PORT || 3000

// use morgan and bodyparser with our app
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({
  extended: false
}));

// make public a static dir
app.use(express.static('public'));

//set view engine handlebars
app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

var MONGODB_URI = process.env.MONGODB_URI || "mongodb://heroku_67g8jqt0:hbqhj9t76c3jo9vr0h00obm6ii@ds235785.mlab.com:35785/heroku_67g8jqt0";

// Database configuration with mongoose
mongoose.connect(MONGODB_URI);
var db = mongoose.connection;
// Example using MLAB: 
// mongoose.connect('mongodb://heroku_btbfbd6f:383sqddqj7o5pk1atr65adhcue@ds127958.mlab.com:27958/heroku_btbfbd6f');
// Got MY URI string for https://dinosaurscraper.herokuapp.com/

// show any mongoose errors
db.on('error', function(err) {
  console.log('Mongoose Error: ', err);
});

// once logged in to the db through mongoose, log a success message
db.once('open', function() {
  console.log('Mongoose connection successful.');
});


// And we bring in our Note and Article models
var Note = require('./models/Note.js');
var Article = require('./models/Article.js');


// Routes
// ======

// Simple index route
app.get('/', function(req, res) {
  // res.send(index.html);

  res.redirect('/scrape');
});

// A GET request to scrape the abcnews website.
app.get('/scrape', function(req, res) {

  // first, we grab the body of the html with request
  request('https://www.newdinosaurs.com/', function(error, response, html) {
    // then, we load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(html);
    console.log($)
    console.log('line 54');

    var titles = [];
    // now, we grab every h2 within an article tag, and do the following:
    
    $('.td-block-span6').each(function(i, element) {
        // li h1
        console.log("dino", element.children.children)
      
        // save an empty result object
        var result = {};
         // add the text and href of every link, 
        // and save them as properties of the result obj
        result.title = $(this).text().trim();

        result.link = $(this).attr('href');
       
        console.log(result);

        var entry = new Article(result);

        // //88-95, commented out for test entry.save(function(err, doc){
        //   if(err){
        //     console.log(err);
        //   }
        //   else {
        //     console.log(doc);
        //   }
        // });
        // using our Article model, create a new entry.
        // Notice the (result):
        // This effectively passes the result object to the entry (and the title and link)
        // // now, save that entry to the db
    });
  });
  // tell the browser that we finished scraping the text.
  // res.send("Scrape Complete");
  // res.render('main.handlebars');
  res.redirect('/articles');
});

// this will get the articles we scraped from the mongoDB
// app.get('/articles', function(req, res){
//   // grab every doc in the Articles array
//   Article.find({}, function(err, doc){
//     // log any errors
//     if (err){
//       console.log(err);
//     } 
//     // or send the doc to the browser as a json object
//     else {
//       res.json(doc);
//     }
//   });
// });

app.get('/articles', function(req, res){

  Article.find().sort({_id: -1})
//.populate('notes') == find articles above, then find the corresponding (by articlId) 
// and populate/tack it on to the object
  .populate('notes')
  .exec(function(err, doc){
    if(err){
      console.log(err);
    }
    else{
      var hbsObject={articles: doc}
      // var hbsObject2={notes: doc}
      // var hbsObject2={newNotes: title}
      res.render('index', hbsObject);
      // res.json(hbsObject);
      // res.render('index', hbsObject2);
    }
  })
})

// // grab an article by it's ObjectId
// app.get('/articles/:id', function(req, res){
//   // using the id passed in the id parameter, 
//   // prepare a query that finds the matching one in our db...
//   Article.findOne({'_id': req.params.id})
//   // and populate all of the notes associated with it.
//   .populate('notes')
//   // now, execute our query
//   .exec(function(err, doc){
//     // log any errors
//     if (err){
//       console.log(err);
//     } 
//     // otherwise, send the doc to the browser as a json object
//     else {
//       res.json(doc);
//     }
//   });

//   // console.log(article.notes.ref);
  
// });


// replace the existing note of an article with a new one
// or if no note exists for an article, make the posted note it's note.
app.post('/articles/:id', function(req, res){
  // create a new note and pass the req.body to the entry.
  var newNote = new Note(req.body); // {"text":"submit comment view here"}

  console.log(newNote.title);
  // and save the new note the db
  newNote.save(function(err, doc){
    // log any errors
    if(err){
      console.log(err);
    } else {
      // using the Article id passed in the id parameter of our url, 
      // prepare a query that finds the matching Article in our db
      // and update it to make it's lone note the one we just saved      
      Article.findOneAndUpdate({'_id': req.params.id}, { $push: { "notes": doc._id } }, { new: true }, function(err, doc) {          
        // log any errors
        if (err){
          console.log(err);
        } else {
          // or send the document to the browser
          // res.send(doc);
          res.redirect('/articles');
        }
      });
    }
  });
});

app.post('delete/note/:id', function (req, res){

  var noteId = req.params.id;

  Comment.findByIdAndRemove(noteId, function(err, data){
    if(err){
      console.log(err);
    }else{
      console.log('Comment' + noteId + 'Deleted');
    }
    })
  });







// listen on port 3000
app.listen(PORT, function() {
  console.log('App running on port 3000!');
});


// {
//     "_id" : ObjectId("584c14dae59fb102a28702e3"),
//     "title" : "Ohio Interstate Reopens After 50-Vehicle Pileup",
//     "link" : "http://abcnews.go.com/Travel/wireStory/ohio-interstate-reopens-14-hours-50-vehicle-pileup-44087532",
//     "__v" : 0
// }