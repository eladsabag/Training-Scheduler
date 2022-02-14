//jshint esversion:6
// require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const _ = require("lodash");
// const mongoose = require("mongoose");
// const session = require('express-session');
// const passport = require("passport");
// const passportLocalMongoose = require("passport-local-mongoose");
// const GoogleStrategy = require('passport-google-oauth20').Strategy;
// const findOrCreate = require("mongoose-findorcreate");

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

// mongoose.connect("mongodb://localhost:27017/osfitnessDB");

app.get("/", function(req,res) {
  res.render("home");
});

app.get("/hours", function(req,res) {
  res.render("hours");
});

app.get("/gallery", function(req,res) {
  res.render("gallery");
});

app.get("/map", function(req,res) {
  res.render("map");
});

app.get("/contact", function(req,res) {
  res.render("contact");
});

app.get("/scheduler", function(req,res) {
  res.render("scheduler");
});

app.get("/training", function(req,res) {
  res.render("training");
});

app.listen(3000, function() {
  console.log("Server started on port 3000.");
});
