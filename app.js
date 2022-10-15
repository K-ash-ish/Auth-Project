require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require("mongoose-findorcreate");

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
  googleId: String,
  secret: String
});
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);
passport.use(User.createStrategy());
passport.serializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, {
      id: user.id,
      username: user.username,
      picture: user.picture
    });
  });
});

passport.deserializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, user);
  });
});
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/secrets",
    },
    function (accessToken, refreshToken, profile, cb) {
      User.findOrCreate({ googleId: profile.id }, function (err, user) {
        return cb(err, user);
      });
    }
  )
);

app.get("/", function (req, res) {
  res.render("home");
});
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile"] })
);

app.get(
  "/auth/google/secrets",
  passport.authenticate("google", { failureRedirect: "/login" }),
  function (req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
  }
);

app.get("/register", function (req, res) {
  res.render("register");
});
app.get("/login", function (req, res) {
  res.render("login");
});
app.get("/logout", function (req, res) {
  req.logout(function (err) {
    if (!err) {
      res.redirect("/");
    } else {
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
app.get("/submit", function (req, res) {
  if (req.isAuthenticated()) {
    res.render("submit");
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
app.post('/submit', function(req, res){
  const newSecret = req.body.secret;
  User.findById(req.user.id, function(err, foundUser){
    if(!err){
      if(foundUser){
        foundUser.secret = newSecret;
        foundUser.save(function(err){
          if(!err){
            res.redirect('/secrets');
          }
          else{
            console.log(err);
          }
        });
      }
    }
    else{
      console.log(err);
    }
  })
  console.log(req.user);
})

app.listen(port, function (req, res) {
  console.log("Server Running ");
});
