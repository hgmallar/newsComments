var express = require("express");
var mongoose = require("mongoose");

// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
var axios = require("axios");
var cheerio = require("cheerio");

// Require all models
var db = require("./models");

var PORT = 3000;

// Initialize Express
var app = express();

// Configure middleware

// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Make public a static folder
app.use(express.static("public"));

// Connect to the Mongo DB
mongoose.connect("mongodb://localhost/techNews", { useNewUrlParser: true });

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

// A GET route for scraping the echoJS website
app.get("/scrape", function (req, res) {

  // First, we grab the body of the html with axios
  axios.get("https://www.npr.org/sections/technology/").then(function (response) {
    // Then, we load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(response.data);

    // Now, we grab every h2 within an article tag, and do the following:
    $("div .item-info").each(function (i, element) {
      // Save an empty result object
      var result = {};

      bAlreadyExists = false;

      // Add the text and href of every link, and save them as properties of the result object
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

      //if article already exists, don't recreate it
      db.Article.findOne({ title: result.title }, function (err, article) {
        if (article) {
          console.log("Article already exists in database");
        }
        else {
          db.Article.create(result)
            .then(function (dbArticle) {
              // View the added result in the console
              console.log(dbArticle);
            })
            .catch(function (err) {
              // If an error occurred, log it
              console.log(err);
            });
        }
      })
    });

  });
  // Send a message to the client
  res.send("Scrape Complete");
});

// Route for getting all Articles from the db
app.get("/articles", function (req, res) {
  db.Article.find({}).then(function (dbArticle) {
    res.json(dbArticle);
  })
    .catch(function (err) {
      res.json(err);
    });
});

// Route for getting all Articles from the db
app.get("/savedArticles", function (req, res) {
  db.Article.find({ saved: true }).then(function (dbArticle) {
    res.json(dbArticle);
  })
    .catch(function (err) {
      res.json(err);
    });
});

// Route for grabbing a specific Article by id, populate it with it's note
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
  // and update it's "note" property with the _id of the new note
  db.Note.create(req.body)
    .then(function (dbNote) {
      return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true })
    })
    .then(function (dbNote) {
      res.json(dbNote);
    })
    .catch(function (err) {
      res.json(err);
    });
});

app.post("/save/:id", function (req, res) {
  // Updates the saved value for one article using the req.params.id
  db.Article.update({ _id: req.params.id }, { saved: true }, function (dbArticle) {
    res.json(dbArticle);
  })
    .catch(function (err) {
      res.json(err);
    });
});

app.post("/deletesave/:id", function (req, res) {
  // Updates the saved value for one article using the req.params.id
  db.Article.update({ _id: req.params.id }, { saved: false }, function (dbArticle) {
    res.json(dbArticle);
  })
    .catch(function (err) {
      res.json(err);
    });
});

// Start the server
app.listen(PORT, function () {
  console.log("App running on port " + PORT + "!");
});
