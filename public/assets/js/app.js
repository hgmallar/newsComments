//function to display notes in modal
function displayNotes(data) {
  //clear the notes
  $("#notesBody").empty();
  //if a note array exists
  if (data.note.length !== 0) {
    for (var i = 0; i < data.note.length; i++) {
      // get the body of the note and the associated x that will allow you to delete the note
      let noteP = $("<h6>").text(data.note[i].body);
      let span = $("<span>");
      span.addClass("deletenote");
      span.addClass("float-right");
      span.html("&times;");
      span.attr("data-id", data.note[i]._id);
      noteP.append(span);
      $("#notesBody").append(noteP);
    }
  }
  else {
    $("#notesBody").text("No new notes for this article yet.");
  }
}

// Grab the articles as a json
$.getJSON("/articles", function (data) {
  // For each one
  for (var i = 0; i < data.length; i++) {
    // Display the apropos information on the page
    var div = $("<div>");
    div.addClass("article").addClass("rounded");
    div.append("<h4>" + data[i].title + "<button type='button' data-id='" + data[i]._id + "' class='btn btn-secondary saveart float-right'>Save Article</button></h4>");
    div.append("<hr>");
    div.append("<p data-id='" + data[i]._id + "'>" + data[i].summary + "</p>");
    div.append("<a class='articleLink' href='" + data[i].link + "'>" + data[i].link + "</a>");
    $("#articles").append(div);
  }
});

// Grab the saved articles as a json
$.getJSON("/savedArticles", function (data) {
  // For each one
  for (var i = 0; i < data.length; i++) {
    // Display the apropos information on the page
    var div = $("<div>");
    div.addClass("article").addClass("rounded");
    div.append("<h4>" + data[i].title + "<button type='button' data-id='" + data[i]._id + "' class='btn btn-secondary deletesave float-right'>Delete From Save</button><button type='button' data-id='" + data[i]._id + "' class='btn btn-secondary articlenote float-right' data-id='" + data[i]._id + "'>Article Notes</button> </h4>");
    div.append("<hr>");
    div.append("<p data-id='" + data[i]._id + "'>" + data[i].summary + "</p>");
    div.append("<a class='articleLink' href='" + data[i].link + "'>" + data[i].link + "</a>");
    $("#savedArticles").append(div);
  }
});

//if scrape is clicked
$("#scrape").on("click", function () {
  var prevLength = 0;
  var finalLength = 0;
  //get the original number of articles
  $.ajax({
    method: "GET",
    url: "/articles",
    success: function (data) {
      prevLength = data.length;
    }
  }).then(function () {
    //then scrape the new articles, calculate the difference in number of articles and display, then reload the index page
    $.ajax({
      method: "GET",
      url: "/scrape",
      success: function (data) {
        finalLength = data.countNum;
        var diff = finalLength - prevLength;
        $("#modalBody").text(diff + " articles were added.");
        $("#myModal").modal("show");
        setTimeout(function () {
          window.location.href = "/";
        }, 3000);
      }
    });
  });
});

// When you click the saveart button
$(document).on("click", ".saveart", function () {
  // Grab the id associated with the article from the submit button
  var thisId = $(this).attr("data-id");

  // Run a POST request to update saved to true
  $.ajax({
    method: "POST",
    url: "/save/" + thisId,
  })
});

// When you click the deletesave button
$(document).on("click", ".deletesave", function () {
  // Grab the id associated with the article from the submit button
  var thisId = $(this).attr("data-id");

  // Run a POST request to update saved to false
  $.ajax({
    method: "POST",
    url: "/deletesave/" + thisId,
  })
    // With that done, reload the saved page
    .then(function (data) {
      window.location.href = "/saved";
    });
});

// When you click the savenote button
$(document).on("click", ".savenote", function () {
  // Grab the id associated with the article from the submit button
  var thisId = $(this).attr("data-id");

  // Run a POST request to create a note document and update the article with the id of the note 
  $.ajax({
    method: "POST",
    url: "/articles/" + thisId,
    data: {
      // Value taken from note textarea
      body: $("#bodyInput").val()
    }
  })
    .then(function (data) {
      $("#notesModal").modal("hide");
    });
  $("#bodyInput").val("");
});

// When you click the articlenote button
$(document).on("click", ".articlenote", function () {
  // Grab the id associated with the article from the submit button
  var thisId = $(this).attr("data-id");

  $.ajax({
    method: "GET",
    url: "/articles/" + thisId
  })
    // With that done, add the note information to the modal and display all notes
    .then(function (data) {
      displayNotes(data);
    });
  $(".savenote").attr("data-id", thisId);
  $("#notes-title").text(`Notes For Article: ${thisId}`);
  $("#notesModal").modal("show");

});

// When you click the deletenote button
$(document).on("click", ".deletenote", function () {
  // Grab the id associated with the article from the submit button
  var thisId = $(this).attr("data-id");
  var articleId = $(".savenote").attr("data-id");
  //update the notes array in the article to remove the note objectid
  $.ajax({
    method: "PUT",
    url: "/articles/" + articleId + "/" + thisId
  })
    .then(function (data) {
      //then delete the note document
      $.ajax({
        method: "DELETE",
        url: "/notes/" + thisId
      })
      //delete the deleted note from the data returned in the article before the update
      var deleteItem = false;
      var deleteIndex = 0;
      for (var i = 0; i < data.note.length; i++) {
        if (data.note[i]._id === thisId) {
          deleteItem = true;
          deleteIndex = i;
        }
      }
      if (deleteItem) {
        data.note.splice(deleteIndex, 1);
      }
      //update the notes display in the modal
      displayNotes(data);
      $("#notes-title").text(`Notes For Article: ${articleId}`);
      $("#notesModal").modal("show");
    });
});