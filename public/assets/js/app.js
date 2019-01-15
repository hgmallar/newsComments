// Grab the articles as a json
$.getJSON("/articles", function (data) {
  // For each one
  for (var i = 0; i < data.length; i++) {
    // Display the apropos information on the page
    var div = $("<div>");
    div.addClass("article").addClass("rounded");
    div.append("<h4>" + data[i].title + "<button type='button' data-id='" + data[i]._id + "' class='btn btn-secondary savenote float-right'>Save Article</button></h4>");
    div.append("<hr>");
    div.append("<p data-id='" + data[i]._id + "'>" + data[i].summary + "</p>");
    div.append("<a class='articleLink' href='" + data[i].link + "'>" + data[i].link + "</a>");
    $("#articles").append(div);
  }
});

// Grab the articles as a json
$.getJSON("/savedArticles", function (data) {
  // For each one
  for (var i = 0; i < data.length; i++) {
    // Display the apropos information on the page
    var div = $("<div>");
    div.addClass("article").addClass("rounded");
    div.append("<h4>" + data[i].title + "<button type='button' data-id='" + data[i]._id + "' class='btn btn-secondary deletesave float-right'>Delete From Save</button><button type='button' data-id='" + data[i]._id + "' class='btn btn-secondary articlenote float-right'>Article Notes</button> </h4>");
    div.append("<hr>");
    div.append("<p data-id='" + data[i]._id + "'>" + data[i].summary + "</p>");
    div.append("<a class='articleLink' href='" + data[i].link + "'>" + data[i].link + "</a>");
    $("#savedArticles").append(div);
  }
});

$("#scrape").on("click", function () {
  $.ajax({
    method: "GET",
    url: "/scrape",
    success: function(data)
    {
      console.log("HERE" + data)
      $("#modalBody").text("10 articles were added.");
      $("#myModal").modal("show");
      setTimeout(function() {
        window.location.href = "/";
      }, 3000);
    }
  })  
});

// Whenever someone clicks a p tag
$(document).on("click", "p", function () {
  // Empty the notes from the note section
  $("#notes").empty();
  // Save the id from the p tag
  var thisId = $(this).attr("data-id");

  // Now make an ajax call for the Article
  $.ajax({
    method: "GET",
    url: "/articles/" + thisId
  })
    // With that done, add the note information to the page
    .then(function (data) {
      console.log(data);
      // The title of the article
      $("#notes").append("<h2>" + data.title + "</h2>");
      // An input to enter a new title
      $("#notes").append("<input id='titleinput' name='title' >");
      // A textarea to add a new note body
      $("#notes").append("<textarea id='bodyinput' name='body'></textarea>");
      // A button to submit a new note, with the id of the article saved to it
      $("#notes").append("<button data-id='" + data._id + "' id='savenote'>Save Note</button>");

      // If there's a note in the article
      if (data.note) {
        // Place the title of the note in the title input
        $("#titleinput").val(data.note.title);
        // Place the body of the note in the body textarea
        $("#bodyinput").val(data.note.body);
      }
    });
});

// When you click the savenote button
$(document).on("click", ".savenote", function () {
  // Grab the id associated with the article from the submit button
  var thisId = $(this).attr("data-id");

  // Run a POST request to update saved 
  $.ajax({
    method: "POST",
    url: "/save/" + thisId,
  })
});

// When you click the deletesave button
$(document).on("click", ".deletesave", function () {
  // Grab the id associated with the article from the submit button
  var thisId = $(this).attr("data-id");

  // Run a POST request to update saved 
  $.ajax({
    method: "POST",
    url: "/deletesave/" + thisId,
  })
    // With that done
    .then(function (data) {
      window.location.href = "/saved";
    });
});