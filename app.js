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

mongoose.connect("mongodb+srv://eladsabag2:" + process.env.MONGO_PASSWORD + "@cluster0.hremd.mongodb.net/osfitnessDB?retryWrites=true&w=majority");

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
  givenName: String,
  familyName: String,
  email: String,
  password: String,
  googleId: String,
  trainings: Array
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const Schedule = new mongoose.model("Schedule", scheduleSchema);
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
  function(accessToken, emailAddresses,refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id, givenName: profile.name.givenName, familyName: profile.name.familyName }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/", function(req,res) {
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

app.post('/login',
  passport.authenticate('local', { failureRedirect: '/login?error=' + encodeURIComponent('incorrect-details') }),
  function(req, res) {
    res.redirect('/scheduler');
  });

app.get("/register", function(req,res){
  res.render("register");
});

app.get("/scheduler", function(req,res){
  // Remove the old dates and add new dates when page loads
  // Only happens once someone entering the page and update one time
  Schedule.find({}, function(err, foundDates) {
    var isChecked = false;
    var counter = 0;
    if(err) {
      console.log(err);
    } else {
      if(foundDates) {
        foundDates.sort().forEach(function(foundDate){
          if(foundDate.date !== date.getDate() && isChecked === false) {
            // if there is no match then delete
            Schedule.findByIdAndDelete(foundDate.id,function(err){
              if(!err) {
                console.log("Successfully deleted old date");
              }
            });
            counter++;
          } else {
            isChecked = true;
          }
        });
        const dateToInsert = date.setInitialDates(counter,30-counter);
        for(var i = 0 ; i < counter; i++){
          const schedule = new Schedule({
            date: dateToInsert.dates[i],
            day: dateToInsert.days[i],
            hours: dateToInsert.hours[i]
          });
          schedule.save();
        }
      }
    }
  });

  if(req.user) {
    User.findById(req.user.id, function(err, foundUser){
      if(err) {
        console.log(err);
      } else {
        if(foundUser) {
          res.render("scheduler",{foundUser: foundUser, givenName: foundUser.givenName, familyName: foundUser.familyName});
        }
      }
    });
  } else {
      res.redirect("/authentication");
  }
});

app.get("/scheduler/process", function(req,res){
  if(req.user) {
    Schedule.find({},function(err,foundSchedules) {
      if(!err) {
        res.render("process",{foundSchedules: foundSchedules.sort()});
      } else {
        res.redirect("/scheduler");
      }
    });
  } else {
    res.redirect("/authentication");
  }
});

app.post("/scheduler/process",function(req,res){
  var training = {
    kind: req.body.kind,
    hour: req.body.hour,
    day: new Date(req.body.date).getDay(),
    date: req.body.date
  };
  User.findByIdAndUpdate(req.user.id,{$push:{trainings: training}},{new:true},function(err,foundUser){
    if(!err) {
      // Need to update the hour to occupied
      res.redirect("/scheduler");
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
    User.register({username: req.body.username, givenName: req.body.givenName, familyName: req.body.familyName}, req.body.password, function(err, user) {
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

app.get("/about", function(req,res) {
  res.render("about");
});

app.get("/contact", function(req,res) {
  res.render("contact");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server started successfully.");
});
