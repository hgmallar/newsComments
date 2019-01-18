var express = require("express");
var mongoose = require("mongoose");

// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
var axios = require("axios");
var cheerio = require("cheerio");

// Require all models
var db = require("./models");

var PORT =  process.env.PORT || 3000;

// Initialize Express
var app = express();

// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Make public a static folder
app.use(express.static("public"));

// Connect to the Mongo DB
var MONGODB_URI = "mongodb://localhost/techNews" || "mongodb://mongolab-adjacent-76880";
mongoose.connect(MONGODB_URI, { useNewUrlParser: true });

// Handlebars
var exphbs = require("express-handlebars");

app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

// Routes
app.get("/", function (req, res) {
  res.render("index");
});

app.get("/saved", function (req, res) {
  res.render("saved");
});

// A GET route for scraping the NPR Technology website
app.get("/scrape", function (req, res) {

  var count = 0;

  // First, we grab the body of the html with axios
  axios.get("https://www.npr.org/sections/technology/").then(function (response) {
    // Then, we load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(response.data);

    // Now, we grab every div within an item-info class, and do the following:
    $("div .item-info").each(function (i, element) {
      // Save an empty result object
      var result = {};

      // Add the text, summary, and href of every item, and save them as properties of the result object
      result.title = $(this)
        .children("h2")
        .first()
        .text();
      result.link = $(this)
        .children("h2")
        .first()
        .children("a")
        .first()
        .attr("href");
      result.summary = $(this)
        .children("p")
        .first()
        .text();

      //create an article with the info
      db.Article.create(result)
        .then(function (dbArticle) {
          // View the added result in the console
          console.log(dbArticle);
        })
        .catch(function (err) {
          // If an error occurred, log it
          console.log(err);
        });
      count++;
    })

  }).then(function () {
    // Send a message to the client
    res.send({countNum: count});
  })
});

// Route for getting all articles from the db
app.get("/articles", function (req, res) {
  db.Article.find({}).sort({ _id: -1 }).then(function (dbArticle) {
    res.json(dbArticle);
  })
    .catch(function (err) {
      res.json(err);
    });
});

// Route for getting all saved articles from the db
app.get("/savedArticles", function (req, res) {
  db.Article.find({ saved: true }).sort({ _id: -1 }).then(function (dbArticle) {
    res.json(dbArticle);
  })
    .catch(function (err) {
      res.json(err);
    });
});

// Route for grabbing a specific article by id, populate it with it's note
app.get("/articles/:id", function (req, res) {
  // Finds one article using the req.params.id,
  // and run the populate method with "note",
  // then responds with the article with the note included
  db.Article.findOne({ _id: req.params.id })
    .populate("note")
    .then(function (dbArticle) {
      res.json(dbArticle);
    })
    .catch(function (err) {
      res.json(err);
    });
});

// Route for saving/updating an Article's associated Note
app.post("/articles/:id", function (req, res) {
  // Save the new note that gets posted to the Notes collection
  // then find an article from the req.params.id
  // and update it's "note" array property with the _id of the new note
  db.Note.create(req.body)
    .then(function (dbNote) {
      db.Article.findOne({ _id: req.params.id })
        .then(function (dbArticle) {
          //get the original array
          var noteArray = dbArticle.note;
          //add the new note id to the array
          noteArray.push(dbNote._id);
          //update the article with the new array
          return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: noteArray });
        })
        .catch(function (err) {
          res.json(err);
        });
    })
    .catch(function (err) {
      res.json(err);
    });
});

app.post("/save/:id", function (req, res) {
  // Updates the saved value to true for one article using the req.params.id
  db.Article.updateOne({ _id: req.params.id }, { saved: true }, function (dbArticle) {
    res.json(dbArticle);
  })
    .catch(function (err) {
      res.json(err);
    });
});

app.post("/deletesave/:id", function (req, res) {
  // Updates the saved value to false for one article using the req.params.id
  db.Article.updateOne({ _id: req.params.id }, { saved: false }, function (dbArticle) {
    res.json(dbArticle);
  })
    .catch(function (err) {
      res.json(err);
    });
});

app.put("/articles/:id/:deleteId", function (req, res) {
  //finds an article using req.params.id and deletes the note id given as req.params.deleteId from the note array
  db.Article.findOneAndUpdate({ _id: req.params.id }, { $pullAll: { note: [req.params.deleteId] } })
    .populate("note")
    .then(function (dbArticle) {
      res.json(dbArticle);
    })
    .catch(function (err) {
      res.json(err);
    });
});

app.delete("/notes/:id", function (req, res) {
  //deletes the note from the collection given req.params.id
  db.Note.deleteOne({ _id: req.params.id }, function (dbNote) {
    res.json(dbNote);
  })
    .catch(function (err) {
      res.json(err);
    });
});

// Start the server
app.listen(PORT, function () {
  console.log("App running on port " + PORT + "!");
});
