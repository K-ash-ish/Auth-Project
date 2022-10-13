require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();
const port = 3000;

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(
  session({
    secret: "HelloWorld",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB");
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
});
userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", function (req, res) {
  res.render("home");
});
app.get("/register", function (req, res) {
  res.render("register");
});
app.get("/login", function (req, res) {
  res.render("login");
});
app.get("/logout", function (req, res) {
  req.logout(function(err){
    if(!err){
      res.redirect("/");
    }
    else{
      console.log(err);
    }
  });
});
app.get("/secrets", function (req, res) {
  if (req.isAuthenticated()) {
    res.render("secrets");
  } else {
    res.redirect("/login");
  }
});

app.post("/register", function (req, res) {
  User.register(
    { username: req.body.username },
    req.body.password,
    function (err, newUser) {
      if (!err) {
        passport.authenticate("local")(req, res, function () {
          res.redirect("/secrets");
        });
      } else {
        console.log(err);
        res.redirect("/register");
      }
    }
  );
});

app.post("/login", function (req, res) {
  const newUser = new User({
    username: req.body.username,
    password: req.body.password,
  });
  req.login(newUser, function (err) {
    if (!err) {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/secrets");
      });
    } else {
      console.log(err);
      res.redirect("/login");
    }
  });
});

app.listen(port, function (req, res) {
  console.log("Server Running ");
});
