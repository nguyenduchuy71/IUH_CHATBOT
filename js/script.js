// on input/text enter--------------------------------------------------------------------------------------
$(".usrInput").on("keyup keypress", function (e) {
  var keyCode = e.keyCode || e.which;
  var text = $(".usrInput").val();
  if (keyCode === 13) {
    if (text == "" || $.trim(text) == "") {
      e.preventDefault();
      return false;
    } else {
      $(".usrInput").blur();
      setUserResponse(text);
      send(text);
      e.preventDefault();
      return false;
    }
  }
});

//------------------------------------- Set user response------------------------------------

function setUserResponse(val) {
  var UserResponse =
    '<img class="userAvatar" src=' +
    "./images/userAvatar.jpg" +
    '><p class="userMsg">' +
    val +
    ' </p><div class="clearfix"></div>';
  $(UserResponse).appendTo(".chats").show("slow");
  $(".usrInput").val("");
  scrollToBottomOfResults();
  $(".suggestions").remove();
}

//---------------------------------- Scroll to the bottom of the chats-------------------------------
function scrollToBottomOfResults() {
  var terminalResultsDiv = document.getElementById("chats");
  terminalResultsDiv.scrollTop = terminalResultsDiv.scrollHeight;
}

function send(message) {
  $.ajax({
    url: "http://localhost:5005/webhooks/rest/webhook",
    type: "POST",
    contentType: "application/json",
    data: JSON.stringify({
      message: message,
    }),
    success: function (data, textStatus) {
      if (data != null) {
        setBotResponse(data);
      }
      firebase.auth().onAuthStateChanged((user) => {
        if (user) {
          db.collection("noidungtrochuyen")
            .add({
              nd_user: message,
              ten_user: user["email"],
              bot_chat: data[0]["text"],
              timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            })
            .then(() => {
              console.log(user);
            })
            .catch((err) => {
              console.log(err);
            });
        } else {
          user = null;
        }
      });
      // console.log(data);
    },
    error: function (errorMessage) {
      setBotResponse("");
      console.log("Error" + errorMessage);
    },
  });
}

//------------------------------------ Set bot response -------------------------------------
function setBotResponse(val) {
  setTimeout(function () {
    if (val.length < 1) {
      //if there is no response from Rasa
      msg = "Xin lỗi mình không hiểu ý của bạn";

      var BotResponse =
        '<img class="botAvatar" src="./images/botAvatar.png"><p class="botMsg">' +
        msg +
        '</p><div class="clearfix"></div>';
      $(BotResponse).appendTo(".chats").hide().fadeIn(1000);
    } else {
      //if we get response from Rasa
      for (i = 0; i < val.length; i++) {
        //check if there is text message
        if (val[i].hasOwnProperty("text")) {
          var BotResponse =
            '<img class="botAvatar" src="./images/botAvatar.png"><p class="botMsg">' +
            val[i].text +
            '</p><div class="clearfix"></div>';
          $(BotResponse).appendTo(".chats").hide().fadeIn(1000);
        }

        //check if there is image
        if (val[i].hasOwnProperty("image")) {
          var BotResponse =
            '<div class="singleCard">' +
            '<img class="imgcard" src="' +
            val[i].image +
            '">' +
            '</div><div class="clearfix">';
          $(BotResponse).appendTo(".chats").hide().fadeIn(1000);
        }

        //check if there is  button message
        if (val[i].hasOwnProperty("buttons")) {
          addSuggestion(val[i].buttons);
        }
      }
      scrollToBottomOfResults();
    }
  }, 500);
}

function setBotRes(text) {
  var BotResponse =
    '<img class="botAvatar" src="./images/botAvatar.png"><p class="botMsg">' +
    text +
    '</p><div class="clearfix"></div>';
  $(BotResponse).appendTo(".chats");
}

// ------------------------------------------ Toggle chatbot -----------------------------------------------
$("#profile_div").click(function () {
  $(".profile_div").toggle();
  $(".widget").toggle();
  $(".chatbot").css("display", "none");
  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      db.collection("noidungtrochuyen")
        .orderBy("timestamp")
        .get()
        .then(function (querySnapshot) {
          querySnapshot.forEach(function (doc) {
            if (user.email == doc.data()["ten_user"]) {
              setUserResponse(doc.data()["nd_user"]);
              setBotRes(doc.data()["bot_chat"]);
            }
          });
        });
    } else {
      user = null;
    }
  });
  scrollToBottomOfResults();
});

$("#close").click(function () {
  $(".chatbot").css("display", "block");
  $(".profile_div").toggle();
  $(".widget").toggle();
  $(".chat").empty();
});

// ------------------------------------------ Suggestions -----------------------------------------------

function addSuggestion(textToAdd) {
  setTimeout(function () {
    var suggestions = textToAdd;
    var suggLength = textToAdd.length;
    $(
      ' <div class="singleCard"> <div class="suggestions"><div class="menu"></div></div></diV>'
    )
      .appendTo(".chats")
      .hide()
      .fadeIn(1000);
    // Loop through suggestions
    for (i = 0; i < suggLength; i++) {
      $(
        '<div class="menuChips" data-payload=\'' +
          suggestions[i].payload +
          "'>" +
          suggestions[i].title +
          "</div>"
      ).appendTo(".menu");
    }
    scrollToBottomOfResults();
  }, 1000);
}

// on click of suggestions, get the value and send to rasa
$(document).on("click", ".menu .menuChips", function () {
  var text = this.innerText;
  var payload = this.getAttribute("data-payload");
  setUserResponse(text);
  send(payload);
  $(".suggestions").remove(); //delete the suggestions
});
