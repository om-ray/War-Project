var mongojs = require("mongojs");
var db = mongojs(
  "mongodb+srv://om:mmmmmmmm9@cluster0-c3yq9.mongodb.net/test?retryWrites=true&w=majority",
  ["account", "progress"]
);
var account = db.account.find;

var express = require("express");
var app = express();
var serv = require("http").Server(app);
app.get("/", function(req, res) {
  res.sendFile(__dirname + "/client/admin.html");
});

var getAllUsers = function (data) {
    account({
        email:data.email,
        health:data.health,
        score:data.score
    })
}

var getIP = function() {
  fetch("https://api.ipify.org?format=json")
    .then(results => results.json())
    .then(data => (ip = data.ip));
};

var getUsers = function() {
  var table_row = document.createElement("TR");
  var table_data_hp = document.createElement("TD");
  var table_data_e = document.createElement("TD");
  var table_data_mW = document.createElement("TD");
  var table_data_Ip = document.createElement("TD");
  var table_data_geoLocation = document.createElement("TD");
  var hpNode = document.createTextNode(hp);
  var eNode = document.createTextNode(e);
  var mWNode = document.createTextNode(mW);
  var IpNode = document.createTextNode(Ip);
  var geoLocationNode = document.createTextNode(geoLocation);
  table_data_hp.appendChild(hpNode);
  table_data_e.appendChild(eNode);
  table_data_mW.appendChild(mWNode);
  table_data_Ip.appendChild(IpNode);
  table_data_geoLocation.appendChild(geoLocationNode);
  adminTable.appendChild(table_data_hp);
  adminTable.appendChild(table_data_e);
  adminTable.appendChild(table_data_mW);
  adminTable.appendChild(table_data_Ip);
  adminTable.appendChild(table_data_geoLocation);
  adminTable.appendChild(table_row);
};

var refresh = function() {
  location.reload();
};

setInterval(function() {
    
    getUsers();
    refresh();
  }, 10);
