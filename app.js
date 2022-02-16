//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const _ = require("lodash");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require("mongoose-findorcreate");

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

app.use(session({
  secret: "Os fitness is the best gym.",
  resave: false,
  saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/osfitnessDB");

const userSchema = new mongoose.Schema ({
  email: String,
  password: String,
  googleId: String,
  training: {
    name: String,
    date: Date
  }
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user,done) {
  done(null,user.id);
});
passport.deserializeUser(function(id, done){
  User.findById(id, function(err, user){
    done(err,user);
  });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/scheduler",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/", function(req,res) {
  res.render("home");
});

// If already logged in direct to the scheduler page
app.get("/training", function(req,res) {
  if(req.user) {
    res.redirect("/scheduler");
  } else {
    res.render("training");
  }
});

app.get("/auth/google",
  passport.authenticate('google', { scope: ["profile"] })
);

app.get('/auth/google/scheduler',
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/scheduler");
});

app.get("/login", function(req,res){
  res.render("login");
});

app.get("/register", function(req,res){
  res.render("register");
});

app.get("/scheduler", function(req,res){
  if(req.user) {
    User.findById(req.user.id, function(err, foundUser){
      if(err) {
        console.log(err);
      } else {
        if(foundUser) {
          res.render("scheduler",{foundUser: foundUser});
        }
      }
    });
  } else {
      res.redirect("/training");
  }
});

app.post("/scheduler", function(req,res){
  const submittedTraining = ["Gym",Date()];
  console.log(submittedTraining);

  console.log(req.user.id);

  User.findById(req.user.id, function(err, foundUser){
    if(err) {
      console.log(err);
    } else {
      if(foundUser) {
        foundUser.training.name = "Gym";
        foundUser.training.date = Date();
        foundUser.save(function(){
          res.redirect("/scheduler");
        });
      }
    }
  });
});

app.get("/logout", function(req,res) {
  req.logout();
  res.redirect("/");
});

app.post("/register", function(req,res){
  User.register({username: req.body.username}, req.body.password, function(err, user) {
    if(err) {
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req,res, function(){
        res.redirect("/scheduler");
      });
    }
  });
});

app.post('/login',
  passport.authenticate('local', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/scheduler');
  });

// Home page

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

app.listen(3000, function() {
  console.log("Server started on port 3000.");
});
