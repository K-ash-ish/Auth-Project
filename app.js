const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const app = express();
const port = 3000;

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");

app.get('/', function(req, res){
    res.render('home');
});
app.get('/register', function(req, res){
    res.render('register');
});
app.get('/login', function(req, res){
    res.render('login');
});

app.listen(port, function(req, res){
    console.log('Server Running ');
});

