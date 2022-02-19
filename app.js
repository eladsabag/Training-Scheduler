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
const date = require(__dirname + "/date.js");

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

const scheduleSchema = new mongoose.Schema ({
  date: String,
  day: Number,
  hours: [{
    hour: String,
    kind: String,
    occupied: Boolean
  }]
});

const userSchema = new mongoose.Schema ({
  email: String,
  password: String,
  googleId: String,
  trainings: [scheduleSchema]
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const Schedule = new mongoose.model("Schedule", scheduleSchema);
const User = new mongoose.model("User", userSchema);

// Set initial 30 dates
// const dates = date.setInitialDates(30,0);
// for(var i = 0 ; i < 30; i++) {
//   const schedule =  new Schedule({
//     date: dates.dates[i],
//     day: dates.days[i],
//     hours: dates.hours[i]
//   });
//   schedule.save();
//
// }

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
  // Remove the old dates and add new dates when page loads
  Schedule.find({}, function(err, foundDates) {
    var isChecked = false;
    var counter = 29;
    if(err) {
      console.log(err);
    } else {
      if(foundDates) {
        foundDates.forEach(function(foundDate){
          if(foundDate.date !== date.getDate() && isChecked === false) {
            // if there is no match then delete
            Schedule.findOneAndDelete({},function(err){
              if(!err) {
                console.log("Successfully deleted old date");
              }
            });
            const dateToInsert = date.setInitialDates(1,counter++);
            const schedule = new Schedule({
              date: dateToInsert.dates[0],
              day: dateToInsert.days[0],
              hours: dateToInsert.hours[0]
            });
            schedule.save(function(err){
              if(!err) {
                console.log("Successfully added new date");
              }
            });
          } else {
            isChecked = true;
          }
        });
      }
    }
  });
  res.render("home");
});

// If already logged in direct to the scheduler page
app.get("/authentication", function(req,res) {
  if(req.user) {
    res.redirect("/scheduler");
  } else {
    res.render("authentication");
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
      res.redirect("/authentication");
  }
});

// POST - scheduler/progress
// app.post("/scheduler", function(req,res){
//   const submittedTraining = ["Gym",Date()];
//   console.log(submittedTraining);
//
//   console.log(req.user.id);
//
//   User.findById(req.user.id, function(err, foundUser){
//     if(err) {
//       console.log(err);
//     } else {
//       if(foundUser) {
//         foundUser.training.name = "Gym";
//         foundUser.training.date = Date();
//         foundUser.save(function(){
//           res.redirect("/scheduler");
//         });
//       }
//     }
//   });
// });

app.get("/scheduler/process", function(req,res){
  if(req.user) {
    res.render("process");
  } else {
    res.redirect("/authentication");
  }
});

app.post("/scheduler/process",function(req,res){
  const submittedDate = req.body.date;
  Schedule.findOne({date: submittedDate},function(err,foundDate){
    if(err) {
      console.log(err);
    } else {
      if(foundDate) {
        res.render("scheduler/process", {foundDate: foundDate});
      }
    }
  });
});

app.get("/logout", function(req,res) {
  req.logout();
  res.redirect("/");
});

app.post("/register", function(req,res){
  if(req.body.password.length > 0 && req.body.password.length < 6) {
    res.redirect('/register?error=' + encodeURIComponent('impossible-password'));
  } else {
    User.register({username: req.body.username}, req.body.password, function(err, user) {
      if(err) {
        console.log(err);
        res.redirect('/register?error=' + encodeURIComponent('incorrect-details'));
      } else {
        passport.authenticate("local")(req,res, function(){
          res.redirect("/scheduler");
        });
      }
    });
  }
});

app.post('/login',
  passport.authenticate('local', { failureRedirect: '/login?error=' + encodeURIComponent('incorrect-details') }),
  function(req, res) {
    res.redirect('/scheduler');
  });

// app.get("/scheduler/process/submit", function(req,res){
//   if(req.isAuthenticated()){
//     res.render("submit");
//   } else {
//     res.redirect("/login");
//   }
// });
//
// app.post("/scheduler/process/submit", function(req,res){
//
// });

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
