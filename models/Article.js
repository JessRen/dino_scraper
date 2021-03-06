// Require mongoose
var mongoose = require("mongoose");
// Create Schema class
var Schema = mongoose.Schema;
// Create article schema
var ArticleSchema = new Schema({
  // title is a required string
  title: {
    type: String,
    required: true,
    index : {
      unique : true,
      dropDups : true
    }
  },
  // link is a required string
  link: {
    type: String,
    required: true
  },

  // This only saves one note's ObjectId, ref refers to the Note model
  notes: [{
    type: Schema.Types.ObjectId,
    ref: "Note",
    required: true
  }]

  // notes: [{
  //   type: Schema.Types.ObjectId,
  //   ref: "Note"
  // }]
});

// Create the Article model with the ArticleSchema
var Article = mongoose.model("Article", ArticleSchema);

// Export the model
module.exports = Article;
