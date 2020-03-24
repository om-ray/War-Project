var mongojs = require("mongojs");
var db = mongojs(
  "mongodb+srv://om:mmmmmmmm9@cluster0-c3yq9.mongodb.net/test?retryWrites=true&w=majority",
  ["account", "progress"]
);

var express = require("express");
var app = express();
var serv = require("http").Server(app);
var nodemailer = require("nodemailer");
var io = require("socket.io")(serv, {});

app.get("/", function(req, res) {
  res.sendFile(__dirname + "/client/index.html");
});
app.get("/", function(req, res) {
  res.sendFile(__dirname + "/client/admin.html");
});
// app.get("/", function(req, res) {
//   res.sendFile(__dirname + "/client/jupiter.html");
// });
// app.get("/", function(req, res) {
//   res.sendFile(__dirname + "/client/saturn.html");
// });
app.use("/", express.static(__dirname + "/client"));

serv.listen(2000);
console.log("Server started.");
var SOCKET_LIST = {};

var Entity = function() {
  var self = {
    x: 900,
    y: 900,
    spdX: 0,
    spdY: 0,
    id: ""
  };
  self.update = function() {
    self.updatePosition();
  };
  self.updatePosition = function() {
    self.x += self.spdX;
    self.y += self.spdY;
  };
  self.getDistance = function(pt) {
    return Math.sqrt(Math.pow(self.x - pt.x, 2) + Math.pow(self.y - pt.y, 2));
  };
  return self;
};

var Player = function(id, db_id) {
  var self = Entity();
  self.id = db_id;
  self.number = "" + Math.floor(10 * Math.random());
  self.pressingRight = false;
  self.pressingLeft = false;
  self.pressingUp = false;
  self.pressingDown = false;
  self.pressingAttack = false;
  self.mouseAngle = 0;
  self.maxSpd = 10;
  self.hp = 100;
  self.hpMax = 100;
  self.score = 0;

  var super_update = self.update;
  self.update = function() {
    self.updateSpd();
    super_update();

    if (self.pressingAttack) {
      self.shootBullet(self.mouseAngle);
    }
  };
  self.shootBullet = function(angle) {
    var b = Bullet(self.id, angle);
    b.x = self.x;
    b.y = self.y;
  };

  self.updateSpd = function() {
    if (self.pressingRight) self.spdX = self.maxSpd;
    else if (self.pressingLeft) self.spdX = -self.maxSpd;
    else self.spdX = 0;

    if (self.pressingUp) self.spdY = -self.maxSpd;
    else if (self.pressingDown) self.spdY = self.maxSpd;
    else self.spdY = 0;
  };

  self.getInitPack = function() {
    return {
      id: self.id,
      x: self.x,
      y: self.y,
      number: self.number,
      hp: self.hp,
      hpMax: self.hpMax,
      score: self.score
    };
  };
  self.getUpdatePack = function() {
    return {
      id: self.id,
      x: self.x,
      y: self.y,
      hp: self.hp,
      score: self.score
    };
  };

  Player.list[self.id] = self;

  initPack.player.push(self.getInitPack());
  return self;
};
Player.list = {};
Player.onConnect = function(socket, player_db_id) {
  var player = Player(socket.id, player_db_id);

  socket.emit("timer");

  console.log("Player " + JSON.stringify(Player) + " joined");
  socket.on("keyPress", function(data) {
    if (data.inputId === "left") player.pressingLeft = data.state;
    else if (data.inputId === "right") player.pressingRight = data.state;
    else if (data.inputId === "up") player.pressingUp = data.state;
    else if (data.inputId === "down") player.pressingDown = data.state;
    else if (data.inputId === "attack") player.pressingAttack = data.state;
    else if (data.inputId === "mouseAngle") player.mouseAngle = data.state;
  });
  console.log(player_db_id);

  socket.emit("init", {
    selfId: player_db_id,
    player: Player.getAllInitPack(),
    bullet: Bullet.getAllInitPack()
  });
};
Player.getAllInitPack = function() {
  var players = [];
  for (var i in Player.list) players.push(Player.list[i].getInitPack());
  return players;
};

Player.onDisconnect = function(socket) {
  delete Player.list[this.id];
  removePack.player.push(socket.id);
};
Player.update = function() {
  var pack = [];
  for (var i in Player.list) {
    var player = Player.list[i];
    player.update();
    pack.push(player.getUpdatePack());
  }
  return pack;
};

var Bullet = function(parent, angle) {
  var self = Entity();
  self.id = Math.random();
  self.spdX = Math.cos((angle / 180) * Math.PI) * 20;
  self.spdY = Math.sin((angle / 180) * Math.PI) * 20;
  self.parent = parent;
  self.timer = 0;
  self.toRemove = false;
  var super_update = self.update;
  self.update = function() {
    if (self.timer++ > 100) self.toRemove = true;
    super_update();

    for (var i in Player.list) {
      var p = Player.list[i];
      if (self.getDistance(p) < 32 && self.parent !== p.id) {
        p.hp -= 5;

        if (p.hp <= 0) {
          var shooter = Player.list[self.parent];
          if (shooter) {
            shooter.score += 1;
            updateScore(shooter);
          }
          p.hp = p.hpMax;
          p.x = Math.random() * 1800;
          p.y = Math.random() * 1800;
        }
        self.toRemove = true;
      }
    }
  };
  self.getInitPack = function() {
    return {
      id: self.id,
      x: self.x,
      y: self.y
    };
  };
  self.getUpdatePack = function() {
    return {
      id: self.id,
      x: self.x,
      y: self.y
    };
  };

  Bullet.list[self.id] = self;
  initPack.bullet.push(self.getInitPack());
  return self;
};
Bullet.list = {};

Bullet.update = function() {
  var pack = [];
  for (var i in Bullet.list) {
    var bullet = Bullet.list[i];
    bullet.update();
    if (bullet.toRemove) {
      delete Bullet.list[i];
      removePack.bullet.push(bullet.id);
    } else pack.push(bullet.getUpdatePack());
  }
  return pack;
};

Bullet.getAllInitPack = function() {
  var bullets = [];
  for (var i in Bullet.list) bullets.push(Bullet.list[i].getInitPack());
  return bullets;
};

var DEBUG = true;
var isValidPassword = function(data, cb) {
  db.account.find({ email: data.email, password: data.password }, function(
    err,
    res
  ) {
    console.log(res[0]);

    if (res.length > 0) cb(true, res[0]);
    else cb(false);
  });
};
var isCorrectVerificationCode = function(email, verification_code, cb) {
  console.log("isCorrectVC: ", verification_code, "email: ", email);
  db.account.find({ email: email }, function(err, res) {
    if (res[0].code == verification_code) {
      console.log("going here???");
      // console.log("res: ", res);
      cb(true);
    } else cb(false);
  });
};
var isEmailTaken = function(data, cb) {
  db.account.find({ email: data.email }, function(err, res) {
    if (res.length > 0) cb(true);
    else cb(false);
  });
};

var addUser = function(data, cb) {
  console.log("addUser");
  db.account.insert(
    {
      email: data.email,
      password: data.password,
      code: data.code,
      score: data.score,
      matchesWon: 0,
      ties: 0,
      verified: false,
      hp: data.hp,
      Ip: data.ip,
      country: data.country,
      regionName: data.regionName,
      city: data.city
    },
    function(err) {
      cb();
    }
  );
};
// socket.emit(""")
var sendVerificationCode = function(data) {
  let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // true for 965, false for other ports
    auth: {
      user: "omihridesh@gmail.com", // generated ethereal user
      pass: "aq123edsMI.changed" // generated ethereal password
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  let mailOptions = {
    from: '"Nodemailer Contact" <omihridesh@gmail.com>', // sender address
    to: data.email, // list of receivers
    subject: "Node Contact Request", // Subject line
    text: data.code.toString() // plain text body
  };
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return console.log(error);
    }
    console.log("Message sent: %s", info.messageId);
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));

    res.render("contact", { msg: "Email has been sent" });
  });
};
var hpDown;
io.sockets.on("connection", function(socket) {
  socket.id = Math.random();
  SOCKET_LIST[socket.id] = socket;
  // console.log(JSON.stringify(db.account.find()));

  updateScore = function(shooter) {
    db.account.find({ _id: shooter.id }, function(err, shooter_accounts) {
      if (shooter_accounts.length > 0) {
        let shooter_account = shooter_accounts[0];
        io.emit("update score", {
          email: shooter_account.email,
          score: shooter.score
        });
      }
    });
  };

  socket.on("gimmeDaInfo", function() {
    console.log("searching");
    db.account.find(function(err, res) {
      console.log("done searching");
      res = res.map(function(player) {
        console.log(Player.list[player._id]);
        if (Player.list[player._id]) {
          player.hp = Player.list[player._id].hp;
          player.score = Player.list[player._id].score;
          return player;
        }
      });
      socket.emit("userInfo", JSON.stringify(res));
    });
  });

  socket.on("IP", function(data) {
    console.log(
      "ip: ",
      data.ip,
      " email: ",
      data.email,
      "geolocation: ",
      data.city,
      ",",
      data.regionName,
      ",",
      data.country
    );
    db.account.update(
      { email: data.email },
      {
        $set: {
          Ip: data.ip,
          hp: data.hp,
          score: data.score,
          country: data.country,
          regionName: data.regionName,
          city: data.city
        }
      },
      function(err) {
        console.error;
      }
    );
  });

  socket.on("sendScore", function(data) {
    // console.log("updating score in db");

    db.account.update(
      { email: data.email },
      {
        $set: {
          score: data.score
        }
      },
      function(err) {
        console.error;
      }
    );
  });

  hpDown = function() {
    console.log("emitting hpDown");

    socket.emit("hpDown");
  };
  var maximumScore;
  var scorearr = [];
  var winner = [];
  socket.on("score", function(score) {
    for (var i in score) {
      scorearr.push(score[i].score);
      maximumScore = Math.max(...scorearr);
      socket.emit("max_score", maximumScore);
    }
    for (var i in score) {
      if (score[i].score == maximumScore) {
        winner.push(score[i].email);
        if (winner.length > 1) {
          db.account.update(
            { email: score[i].email },
            {
              $inc: {
                ties: 1
              }
            },
            function(err) {
              console.error;
            }
          );
          socket.emit("tie", { winners: winner, score: maximumScore });
        } else {
          db.account.update(
            { email: score[i].email },
            {
              $inc: {
                matchesWon: 1
              }
            },
            function(err) {
              console.error;
            }
          );

          db.progress.find({ email: score[i].email }, function(err, res) {
            var date = new Date();
            console.log(res);
            if (res) {
              db.progress.update(
                {
                  email: score[i].email
                },
                {
                  $inc: {
                    NumberOfMatchesWon: 1
                  },
                  $set: {
                    MostRecentWin: date
                  }
                }
              );
            } else {
              db.progress.insert({
                email: score[i].email,
                NumberOfMatchesWon: 0,
                MostRecentWin: date
              });
            }
          });
          socket.emit("won", { score: maximumScore });
        }
      }
    }
  });

  socket.on("signIn", function(data) {
    db.account.find({ email: data.email }, function(err, res) {
      isValidPassword(data, function(isValid, player) {
        if (isValid && res[0].verified == true) {
          Player.onConnect(socket, player._id);
          socket.emit("signInResponse", { success: true });
          socket.emit("addToLeaderboard");
        } else {
          socket.emit("signInResponse", { success: false });
          socket.on("i did not verify", function() {
            socket.emit("input verification code");
          });
        }
      });
    });
  });
  socket.on("signUp", function(data) {
    console.log("in Sign up");
    isEmailTaken(data, function(res) {
      console.log("In isEmailTaken callback");
      if (res) {
        console.log("user exists");
        socket.emit("signUpResponse", { success: false });
      } else {
        data.code = Math.floor(100000 + Math.random() * 900000);
        sendVerificationCode(data);
        addUser(data, function() {
          console.log("added user");

          socket.emit("input verification code");
          socket.on("here is the verification code", function(code) {
            console.log("recieved verification code: ", code.verification_code);

            isCorrectVerificationCode(
              code.email,
              code.verification_code,
              function(res) {
                console.log("res: ", res);
                if (res) {
                  db.account.update(
                    { email: code.email },
                    {
                      $set: {
                        verified: true
                      }
                    },
                    function(err) {
                      console.log("updated");
                      if (err) console.error(err);
                      socket.emit("signUpResponse", { success: true });
                    }
                  );
                } else if (res == false) {
                  socket.emit("signUpResponse", { success: false });
                  console.error;
                }
              }
            );
          });
        });
      }
    });
  });

  socket.on("adding to leaderboard", function(data) {
    db.account.find(
      { email: { $ne: data.email } },
      function(err, res) {
        console.log("res:", res);
        for (var i in res) {
          socket.emit("players info", {
            email: res[i].email,
            score: res[i].score
          });
        }
      },
      function(err) {
        console.log(err);
      }
    );
  });

  socket.on("disconnect", function() {
    delete SOCKET_LIST[socket.id];
    Player.onDisconnect(socket);
  });
  socket.on("sendMsgToServer", function(data) {
    var playerName = ("" + socket.id).slice(2, 7);
    for (var i in SOCKET_LIST) {
      SOCKET_LIST[i].emit("addToChat", playerName + ": " + data);
    }
  });

  socket.on("evalServer", function(data) {
    if (!DEBUG) return;
    var res = eval(data);
    socket.emit("evalAnswer", res);
  });

  match = function() {
    socket.emit("match", function() {
      for (var i in Player.list) {
        var p = Player.list[i];
        p.x = 400;
        p.y = 400;
      }
    });
  };
  timer = function() {
    socket.emit("timer");
  };
});
// var match;
var timer;
setInterval(function() {
  console.log("match starting!");
  // match();
  timer();
}, 300000);

// function getTimeRemaining(endtime) {
//   var t = Date.parse(endtime) - Date.parse(new Date());
//   var seconds = Math.floor((t / 1000) % 60);
//   var minutes = Math.floor((t / 1000 / 60) % 60);
//   return {
//     'total': t,
//     'minutes': minutes,
//     'seconds': seconds
//   };
// }

// function initializeClock(id, endtime) {
//   var clock = document.getElementById(id);
//   var minutesSpan = clock.querySelector('.minutes');
//   var secondsSpan = clock.querySelector('.seconds');

//   function updateClock() {
//     var t = getTimeRemaining(endtime);

//     minutesSpan.innerHTML = ('0' + t.minutes).slice(-2);
//     secondsSpan.innerHTML = ('0' + t.seconds).slice(-2);

//     if (t.total <= 0) {
//       clearInterval(timeinterval);
//     }

//     if (t.minutes == 0 && t.seconds == 0) {
//       console.log('in this func');
//       deadline = new Date(deadline.getTime() + 5 * 60000);
//       initializeClock('clockdiv', deadline);
//     }
//   }

//   updateClock();
//   var timeinterval = setInterval(updateClock, 1000);
// }

// var deadline = new Date(Date.parse(new Date()));
// socket.on("timer", function () {
//   console.log("timer");
//   initializeClock('clockdiv', deadline);
// })

var initPack = { player: [], bullet: [] };
var removePack = { player: [], bullet: [] };

setInterval(function() {
  var pack = {
    player: Player.update(),
    bullet: Bullet.update()
  };

  for (var i in SOCKET_LIST) {
    var socket = SOCKET_LIST[i];
    socket.emit("init", initPack);
    socket.emit("update", pack);
    socket.emit("remove", removePack);
  }
  initPack.player = [];
  initPack.bullet = [];
  removePack.player = [];
  removePack.bullet = [];
}, 1000 / 25);
