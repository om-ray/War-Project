var WIDTH = 800;
var HEIGHT = 800;
var socket = io();

dragElement(document.getElementById("mydiv"));

function dragElement(elmnt) {
  var pos1 = 0,
    pos2 = 0,
    pos3 = 0,
    pos4 = 0;
  if (document.getElementById(elmnt.id + "header")) {
    /* if present, the header is where you move the DIV from:*/
    document.getElementById(elmnt.id + "header").onmousedown = dragMouseDown;
  } else {
    /* otherwise, move the DIV from anywhere inside the DIV:*/
    elmnt.onmousedown = dragMouseDown;
  }

  function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();
    // get the mouse cursor position at startup:
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    // calculate the new cursor position:
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // set the element's new position:
    elmnt.style.top = elmnt.offsetTop - pos2 + "px";
    elmnt.style.left = elmnt.offsetLeft - pos1 + "px";
  }

  function closeDragElement() {
    /* stop moving when mouse button is released:*/
    document.onmouseup = null;
    document.onmousemove = null;
  }
}
//sign
var signDiv = document.getElementById("signDiv");
var signDivEmail = document.getElementById("signDiv-email");
var signDivSignIn = document.getElementById("signDiv-signIn");
var signDivSignUp = document.getElementById("signDiv-signUp");
var signDivPassword = document.getElementById("signDiv-password");
var verificationDiv = document.getElementById("verification-div");
var verificationInput = document.getElementById("verification-input");
var verifClose = document.getElementById("verif_close");
var scoreClose = document.getElementById("score_close");
var scoreDiv = document.getElementById("scoreDiv");
// var scoreSecond = document.getElementById('second').innerHTML = '';
// var scoreThird = document.getElementById('third').innerHTML = '';

if (signDivEmail.value != null && signDivPassword.value != null) {
  signDivSignIn.onclick = function () {
    socket.emit("signIn", {
      email: signDivEmail.value,
      password: signDivPassword.value,
    });
  };
  signDivSignUp.onclick = function () {
    socket.emit("signUp", {
      email: signDivEmail.value,
      password: signDivPassword.value,
    });
  };
}

socket.on("max_score", function (a) {
  // console.log(a)
  // var scoreFirst = document.getElementById('first').innerHTML = a;
  var scorelist = document.createElement("LI");
  var scoreheading = document.createElement("H4");
  var headingnode = document.createTextNode(a);
  scoreheading.appendChild(headingnode);
  scorelist.appendChild(scoreheading);
  scoreol.appendChild(scorelist);
});

scoreClose.onclick = function () {
  scoreDiv.style.display = "none";
};
winDiv_close.onclick = function () {
  winDiv.style.display = "none";
};
tie_close.onclick = function () {
  tieDiv.style.display = "none";
};
matchDiv_close.onclick = function () {
  matchDone.style.display = "none";
};

// function verification_code() {
// 	var verification = window.prompt("Please enter verification code", "recieved in email")
// 	if (verification != null) {
// 		console.log("Sending this code to server:", verification);
// 		socket.emit("verify", verification, {
// 			email: signDivEmail.value
// 		});
// 	};
// }

socket.on("signInResponse", function (data) {
  if (data.success) {
    signDiv.style.display = "none";
    gameDiv.style.display = "inline-block";
    mapdiv.style.display = "inline-block";
    leaderboardDiv.style.display = "inline-block";
    timer.style.display = "inline-block";
    timerBox.style.display = "inline-block";
    var email = signDivEmail.value;
    addToLeaderboard(email);
    console.log("email:", email);
    socket.on("addToLeaderboard", function () {
      fixRanking(email, Player.list[selfId].score);
      socket.on("current time", function (current_time) {
        var minutes = current_time.minutes;
        var seconds = current_time.seconds;
        var counter = document.getElementById("timer");
        var counter_text = document.getElementById("matchText");

        counter.innerHTML = minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
        counter_text.innerHTML = "Match ends in:";
      });

      socket.on("current time2", function (current_time) {
        var minutes = current_time.minutes;
        var seconds = current_time.seconds;
        var counter = document.getElementById("timer");
        var counter_text = document.getElementById("matchText");

        counter.innerHTML = minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
        counter_text.innerHTML = "Match starts in:";
      });

      socket.emit("adding to leaderboard", {
        email: email,
        score: Player.list[selfId].score,
      });
    });
    sendIp();
  } else {
    alert(
      "Sign in unsuccessful. Please make sure that you have created an account and have verified you account"
    );
    socket.emit("i did not verify");
  }
});

socket.on("input verification code", function () {
  verificationDiv.style.display = "flex";
  verifClose.onclick = function () {
    console.log(verificationInput.value);

    if (verificationInput.value != null) {
      verificationDiv.style.display = "none";
      socket.emit("here is the verification code", {
        verification_code: verificationInput.value,
        email: signDivEmail.value,
      });
    } else {
      alert("You didn't type anything In");
    }
  };
});

socket.on("players info", function (res) {
  console.log("player info:", res);
  addToLeaderboard(res.email, res.score);
});
socket.on("update score", function (data) {
  fixScores(data.email, data.score);
  fixRanking(data.email, data.score);
});
var fixScores = function (email, score) {
  console.log("updating leaderboard");

  // for (var i in Email) {
  var Email = document.getElementsByClassName("emailTableData");
  var Score = document.getElementsByClassName("scoreTableData");

  for (var u in Email) {
    if (Email[u].innerHTML == email) {
      console.log("updating leaderboard");
      Score[u].innerHTML = score;
    }
  }
};
var emailAndScoreArray = [];
function fixRanking(email, score) {
  var Email = document.getElementsByClassName("emailTableData");
  var Score = document.getElementsByClassName("scoreTableData");
  //pushing email and score into emailAndScoreArray
  var pushToArray = function (email, score) {
    emailAndScoreArray.push({ email: email, score: score });
  };
  //removing duplicates from array
  var removeDupes = function () {
    for (var i = emailAndScoreArray.length - 1; i > 0; i--) {
      console.log("emailAndScoreArray: ", emailAndScoreArray);
      if (emailAndScoreArray.length > 1) {
        console.log("emailAndScoreArray.length: ", emailAndScoreArray.length);
        console.log("i: ", i, " i - 1: ", i - 1);
        if (emailAndScoreArray[i].email === emailAndScoreArray[i - 1].email) {
          if (emailAndScoreArray[i].score <= emailAndScoreArray[i - 1].score) {
            emailAndScoreArray.splice(i, 1);
          } else if (
            emailAndScoreArray[i].score >= emailAndScoreArray[i - 1].score
          ) {
            emailAndScoreArray.splice(i - 1, 1);
          }
        }
      }
    }
  };
  //sorting array
  var sortArray = function () {
    console.log("emailAndScoreArray sorted: ", emailAndScoreArray);
    emailAndScoreArray.sort((a, b) => b.score - a.score);
  };

  //fixing the leaderboard ranking
  var setLeaderboard = function () {
    for (var o = 0; o < emailAndScoreArray.length; o++) {
      console.log("o: ", o);

      Email[o].innerHTML = emailAndScoreArray[o].email;
      Score[o].innerHTML = emailAndScoreArray[o].score;
    }
  };
  //calling all the functions
  //pushes to array
  pushToArray(email, score);
  //removes duplicates
  removeDupes();
  //sorts array
  sortArray();
  //makes sure there are no duplicates
  removeDupes();
  //updates the leaderboard
  setLeaderboard();
}

socket.on("signUpResponse", function (data) {
  if (data.success) {
    alert("Sign up successful.");
    // addToLeaderboard();
    sendIp();
  } else alert("Sign up unsuccessful.");
});
var chatText = document.getElementById("chat-text");
var chatInput = document.getElementById("chat-input");
var chatForm = document.getElementById("chat-form");

var addToLeaderboard = function (email, score) {
  var table_row = document.createElement("TR");
  // var table_data_place_ol = document.createElement("OL");
  // var table_data_place_li = document.createElement("LI");
  var table_data_score = document.createElement("TD");
  var table_data_email = document.createElement("TD");
  var scoreNode = document.createTextNode(score == undefined ? 0 : score);
  var emailNode = document.createTextNode(email);
  table_data_score.appendChild(scoreNode);
  table_data_email.appendChild(emailNode);
  leaderboard_table_body.appendChild(table_data_score);
  table_data_score.setAttribute("class", "scoreTableData");
  table_data_email.setAttribute("class", "emailTableData");
  leaderboard_table_body.appendChild(table_data_email);
  leaderboard_table_body.appendChild(table_row);
};

socket.on("addToChat", function (data) {
  chatText.innerHTML += "<div>" + data + "</div>";
});
socket.on("evalAnswer", function (data) {
  console.log(data);
});

chatForm.onsubmit = function (e) {
  e.preventDefault();
  if (chatInput.value[0] === "/")
    socket.emit("evalServer", chatInput.value.slice(1));
  else socket.emit("sendMsgToServer", chatInput.value);
  chatInput.value = "";
};

//game
var tileset = new Image();
var startX;
var startY;
var clippingWidth;
var clippingHeight;
var placeX = 0;
var placeY = 0;
var mapJson;
tileset.src = "/img/final_tileset.jpg";

var xmlhttp = new XMLHttpRequest();

xmlhttp.onreadystatechange = function () {
  if (this.readyState == 4 && this.status == 200) {
    mapJson = JSON.parse(this.responseText);
  }
};
xmlhttp.open("GET", "img/WarMap.json", true);
xmlhttp.send();
updateTileData = function () {
  // placeX++;
  // console.log(mapJson);
  for (var i = 0; i < mapJson.layers.length; i += 1) {
    for (var u = 0; u < mapJson.layers[i].data.length; u += 1) {
      var dataValues = mapJson.layers[i].data[u] - 1;
      startX = (dataValues % 11) * 32;
      startY = Math.floor(dataValues / 11) * 32;
      clippingWidth = 32;
      clippingHeight = 32;
      placeX = (u % mapJson.layers[i].width) * 32;
      placeY = Math.floor(u / mapJson.layers[i].height) * 32;

      ctx.drawImage(
        tileset,
        startX,
        startY,
        clippingWidth,
        clippingHeight,
        placeX - Player.list[selfId].x,
        placeY - Player.list[selfId].y,
        clippingWidth,
        clippingHeight
      );
    }
  }
};
var Img = {};
Img.player = new Image();
Img.player.src = "/img/player2spritesheet.png";
Img.bullet = new Image();
Img.bullet.src = "/img/bullet.png";
Img.map = new Image();
Img.map.src = "/img/map.png";

var ctx = document.getElementById("ctx").getContext("2d");
ctx.font = "30px Arial";

var Player = function (initPack) {
  var self = {};
  self.id = initPack.id;
  self.number = initPack.number;
  self.x = initPack.x;
  self.y = initPack.y;
  self.hp = initPack.hp;
  self.hpMax = initPack.hpMax;
  self.score = initPack.score;
  self.sx = 0;
  self.sy = 0;

  self.draw = function () {
    var x = self.x - Player.list[selfId].x + WIDTH / 2;
    var y = self.y - Player.list[selfId].y + HEIGHT / 2;

    var hpWidth = (30 * self.hp) / self.hpMax;
    ctx.fillStyle = "red";
    ctx.fillRect(x - hpWidth / 2, y - 50, hpWidth, 4);

    var width = 32 * 2;
    var height = 48 * 2;

    ctx.drawImage(
      Img.player,
      self.sx,
      self.sy,
      32,
      48,
      x - width / 2,
      y - height / 2,
      width,
      height
    );

    //ctx.fillText(self.score,self.x,self.y-60);
  };
  self.resetSx = function () {
    if (self.sx >= 64) {
      self.sx = 0;
    }
  };

  Player.list[self.id] = self;

  return self;
};
Player.list = {};

var Bullet = function (initPack) {
  var self = {};
  self.id = initPack.id;
  self.x = initPack.x;
  self.y = initPack.y;

  self.draw = function () {
    var width = Img.bullet.width / 2;
    var height = Img.bullet.height / 2;

    var x = self.x - Player.list[selfId].x + WIDTH / 2;
    var y = self.y - Player.list[selfId].y + HEIGHT / 2;

    ctx.drawImage(
      Img.bullet,
      0,
      0,
      Img.bullet.width,
      Img.bullet.height,
      x - width / 2,
      y - height / 2,
      width,
      height
    );
  };

  Bullet.list[self.id] = self;
  return self;
};
Bullet.list = {};

var selfId = null;

socket.on("init", function (data) {
  if (data.selfId) selfId = data.selfId;
  //{ player : [{id:123,number:'1',x:0,y:0},{id:1,number:'2',x:0,y:0}], bullet: []}
  for (var i = 0; i < data.player.length; i++) {
    new Player(data.player[i]);
  }
  for (var i = 0; i < data.bullet.length; i++) {
    new Bullet(data.bullet[i]);
  }
});

socket.on("hpDown", function () {
  sendHp();
});

socket.on("update", function (data) {
  //{ player : [{id:123,x:0,y:0},{id:1,x:0,y:0}], bullet: []}

  for (var i = 0; i < data.player.length; i++) {
    var pack = data.player[i];
    var p = Player.list[pack.id];
    if (p) {
      if (pack.x !== undefined) p.x = pack.x;
      if (pack.y !== undefined) p.y = pack.y;
      if (pack.hp !== undefined) {
        p.hp = pack.hp;
      }
      if (pack.score !== undefined) {
        p.score = pack.score;
      }
    }
  }
  for (var i = 0; i < data.bullet.length; i++) {
    var pack = data.bullet[i];
    var b = Bullet.list[data.bullet[i].id];
    if (b) {
      if (pack.x !== undefined) b.x = pack.x;
      if (pack.y !== undefined) b.y = pack.y;
    }
  }
});

socket.on("remove", function (data) {
  //{player:[12323],bullet:[12323,123123]}
  for (var i = 0; i < data.player.length; i++) {
    delete Player.list[data.player[i]];
  }
  for (var i = 0; i < data.bullet.length; i++) {
    delete Bullet.list[data.bullet[i]];
  }
});

const fps = {
  sampleSize: 60,
  value: 0,
  _sample_: [],
  _index_: 0,
  _lastTick_: false,
  tick: function () {
    // if is first tick, just set tick timestamp and return
    if (!this._lastTick_) {
      this._lastTick_ = performance.now();
      return 0;
    }
    // calculate necessary values to obtain current tick FPS
    let now = performance.now();
    let delta = (now - this._lastTick_) / 1000;
    let fps = 1 / delta;
    // add to fps samples, current tick fps value
    this._sample_[this._index_] = Math.round(fps);

    // iterate samples to obtain the average
    let average = 0;
    for (i = 0; i < this._sample_.length; i++) average += this._sample_[i];

    average = Math.round(average / this._sample_.length);

    // set new FPS
    this.value = average;
    // store current timestamp
    this._lastTick_ = now;
    // increase sample index counter, and reset it
    // to 0 if exceded maximum sampleSize limit
    this._index_++;
    if (this._index_ === this.sampleSize) this._index_ = 0;
    return this.value;
  },
};

function loop() {
  let fpsValue = fps.tick();
  window.fps.innerHTML = fpsValue;
  requestAnimationFrame(loop);
}
// set FPS calulation based in the last 120 loop cicles
fps.sampleSize = 120;
// start loop
loop();

setInterval(function () {
  if (!selfId) return;
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  updateTileData();
  drawScore();
  console.log("startX: ", startX);
  console.log("startY: ", startY);
  // console.log("clippingWidth: ", clippingWidth);
  // console.log("clippingHeight: ", clippingHeight);
  console.log("placeX: ", placeX);
  console.log("placeY: ", placeY);

  // addToLeaderboard();
  for (var i in Player.list) {
    Player.list[i].draw();
    Player.list[i].resetSx();
  }
  for (var i in Bullet.list) Bullet.list[i].draw();
  saveToLocalStorage();
}, 55);
// setInterval(function () {

socket.on("match", function () {
  for (var i in Player.list) {
    matchDone.style.display = "inline-block";
    scoreDiv.style.display = "inline-block";
    socket.emit("score", [
      { score: Player.list[i].score, email: signDivEmail.value },
    ]);
    socket.on("won", function (winners) {
      winDiv.style.display = "inline-block";
      console.log(winners);
      scoreWin.innerHTML = winners.score;
    });
    socket.on("tie", function (winners) {
      tieDiv.style.display = "inline-block";
      emailTie.innerHTML = winners.winners;
      scoreTie.innerHTML = winners.score;
      console.log(winners);
    });
  }
});
// }, 300000);

var saveToLocalStorage = function () {
  var email = JSON.stringify(signDivEmail.value);
  var score = JSON.stringify(Player.list[selfId].score);
  var hp = JSON.stringify(Player.list[selfId].hp);
  // console.log(
  //   "Saving:" +
  //     " " +
  //     email +
  //     ", " +
  //     score +
  //     ", and" +
  //     " " +
  //     hp +
  //     " to localStorage"
  // );
  window.localStorage.setItem("email", email);
  window.localStorage.setItem("score", score);
  window.localStorage.setItem("hp", hp);
};

var changemap1 = function () {
  Img.map.src = "/img/map.png";
};
var changemap2 = function () {
  Img.map.src = "/img/JupiterMap.png";
};
var changemap3 = function () {
  Img.map.src = "/img/SaturnMap.png";
};

var drawScore = function () {
  ctx.fillStyle = "black";
  ctx.fillText(" " + Player.list[selfId].score, 0, 30);
};

// for (var i in Player.list) {
// 	Math.max(...Player.list[i].score(o => o.y), 0);
// 		console.log(a);
// }
document.onkeydown = function (event) {
  if (event.keyCode === 68) {
    //d
    Player.list[selfId].sx += 32;
    Player.list[selfId].sy = 96;
    socket.emit("keyPress", {
      inputId: "right",
      state: true,
    });
  } else if (event.keyCode === 83) {
    //s
    Player.list[selfId].sx += 32;
    Player.list[selfId].sy = 0;
    socket.emit("keyPress", {
      inputId: "down",
      state: true,
    });
  } else if (event.keyCode === 65) {
    //a
    Player.list[selfId].sx += 32;
    Player.list[selfId].sy = 48;
    socket.emit("keyPress", {
      inputId: "left",
      state: true,
    });
  } else if (event.keyCode === 87) {
    // w
    Player.list[selfId].sx += 32;
    Player.list[selfId].sy = 144;
    socket.emit("keyPress", {
      inputId: "up",
      state: true,
    });
  }
  if (event.keyCode === 32) {
    socket.emit("keyPress", {
      inputId: "attack",
      state: true,
    });
  }
  if (event.keyCode === 16) {
    socket.emit("keyPress", {
      inputId: "sprint",
      state: true,
    });
  }
};
document.onkeyup = function (event) {
  if (event.keyCode === 68) {
    //d
    Player.list[selfId].sx = 0;
    socket.emit("keyPress", {
      inputId: "right",
      state: false,
    });
  } else if (event.keyCode === 83) {
    //s
    Player.list[selfId].sx = 0;
    socket.emit("keyPress", {
      inputId: "down",
      state: false,
    });
  } else if (event.keyCode === 65) {
    //a
    Player.list[selfId].sx = 0;
    socket.emit("keyPress", {
      inputId: "left",
      state: false,
    });
  } else if (event.keyCode === 87) {
    // w
    Player.list[selfId].sx = 0;
    socket.emit("keyPress", {
      inputId: "up",
      state: false,
    });
  }
  if (event.keyCode === 32) {
    socket.emit("keyPress", {
      inputId: "attack",
      state: false,
    });
  }
  if (event.keyCode === 16) {
    socket.emit("keyPress", {
      inputId: "sprint",
      state: false,
    });
  }
};

// document.onmousedown = function (event) {
// 	socket.emit('keyPress', {
// 		inputId: 'attack',
// 		state: true
// 	});
// }
// document.onmouseup = function (event) {
// 	socket.emit('keyPress', {
// 		inputId: 'attack',
// 		state: false
// 	});
// }
document.onmousemove = function (event) {
  var x = -(WIDTH / 2) + event.clientX - 8;
  var y = -(HEIGHT / 2) + event.clientY - 8;
  var angle = (Math.atan2(y, x) / Math.PI) * 180;
  socket.emit("keyPress", {
    inputId: "mouseAngle",
    state: angle,
  });
};
var sendIp = function () {
  fetch("https://api.ipify.org?format=json")
    .then((results) => results.json())
    .then(function (data) {
      console.log(data.ip);
      var email = signDivEmail.value;
      fetch(
        `http://ip-api.com/json/${data.ip}?fields=status,message,country,regionName,city`
      )
        .then((res) => res.json())
        .then(function (geolocation) {
          socket.emit("IP", {
            ip: data.ip,
            email: email,
            hp: Player.list[selfId].hp,
            score: Player.list[selfId].score,
            country: geolocation.country,
            regionName: geolocation.regionName,
            city: geolocation.city,
          });
        });
    });
};
