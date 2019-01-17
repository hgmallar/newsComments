var mongoose = require("mongoose");

// Save a reference to the Schema constructor
var Schema = mongoose.Schema;

// Using the Schema constructor, create a new UserSchema object
var ArticleSchema = new Schema({
  // `title` is required and of type String and must be unique
  title: {
    type: String,
    required: true, 
    unique: true
  },
  // `summary` is required and of type String
  summary: {
    type: String,
    required: true
  },
  // `link` is required and of type String
  link: {
    type: String
  },
  // `saved` is defaulted to false and of type Boolean
  saved: {
    type: Boolean,
    default: false
  },
  // `note` is an array of objects that stores Note ids
  // The ref property links the ObjectId to the Note model
  // This allows us to populate the Article with associated Notes
  note: [{ 
    type: Schema.ObjectId, 
    ref: 'Note' 
  }]
});

// This creates our model from the above schema, using mongoose's model method
var Article = mongoose.model("Article", ArticleSchema);

// Export the Article model
module.exports = Article;
