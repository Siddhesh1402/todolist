//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");


const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

//Initialization passport and session>>>>>>>>>

app.use(session({
  secret: "My First ToDO List.",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

// <<<<<<<

// DATA BASE<<<<<

// mongoose.connect("mongodb://localhost:27017/todoListFinalDB",{useNewUrlParser: true, useUnifiedTopology: true });
mongoose.connect("mongodb+srv://admin-sharad:01102010@cluster0.zk5pm.mongodb.net/todoListFinalDB",{useNewUrlParser: true, useUnifiedTopology: true});


const itemsSchema = {
    name:String
};

const Item = mongoose.model("Item",itemsSchema);

const item1 = new Item({
  name : "Welcome to your todolist!"
});

const item2 = new Item({
  name : "Hit the + button to add a new item."
});

const item3 = new Item({
  name : "← Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema({
  username: String,
  password: String,
  items: [itemsSchema]
});

listSchema.plugin(passportLocalMongoose);

const List = mongoose.model("List",listSchema);

passport.use(List.createStrategy());

passport.serializeUser(List.serializeUser());
passport.deserializeUser(List.deserializeUser());

// >>>>>>>
app.get("/",function(req,res){
  res.render("home");
});

app.get("/login",function(req,res){
  res.render("login",{erroruser:"",errorpass:"",user:""});
});

app.get("/register",function(req,res){
  res.render("register",{userexist:"",passlen:"",username:""});
});


app.post("/register",function(req,res){

  const username= req.body.username;
  const password= req.body.password;
   List.findOne({username:username},function(err,foundUser){
     if(foundUser)
     {
       res.render("register",{userexist:"username already exist",passlen:"",username:""})
     }
     else if(password.length < 6)
      {
           res.render("register",{userexist:"",passlen:"password must be at least 6 character long",username:username})
      }
      else{
        List.register({username:username , items:defaultItems}, password, function(err,user){
        if(err)
        {
          console.log(err);
          res.redirect("/register");
        }
        else{
         passport.authenticate("local")(req,res,function(){
         // res.redirect("/login");
         res.redirect("/list"+username);
          });
        }
      });
     }
   });
});

 app.get("/list",function(req,res){
  if(req.isAuthenticated()){
    res.render("list");
  }
  else{
    res.redirect("/login");
  }
})

app.post("/login",function(req,res){
  const username= req.body.username;
  const password= req.body.password;
  List.findOne({username:username},function(err,foundList){
   if(err)
   {
     return err;
   }
    if(!foundList)
    {
      res.render("login",{erroruser:"!'wrong username'",errorpass:"",user:""});
    }
     });

       const list = new List({
         username: username,
         password: password
         });
          req.login(list,function(err){
           if(err)
           {
             return err;
           }
           else{
             passport.authenticate("local",{failureRedirect:"/wrongpassword"+username,successRedirect:"/list"+username})
             (req,res,function(){
             // res.redirect("/list"+username);
           });
            }
    });
});

app.get("/wrongpassword:username",function(req,res){
  const username = req.params.username;
   res.render("login",{erroruser:"",errorpass:"!'wrong password'",user:username});
});

app.get("/list:username",function(req,res){
  if(req.isAuthenticated()){
  const username = req.params.username;
  List.findOne({username:username},function(err,foundList){
   res.render("list",{id:req.user.id,newListItems:req.user.items});
   });
  }
  else{
    res.redirect("/login");
    }
});

const random = Math.floor(Math.random()*10);
// >>>>>>>>

app.post("/list", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;
// DATABASE<<<<<<

 const item = new Item({
  name : itemName
});
  List.findById(req.user.id,function(err,foundlist){
    if(err)
    {
      console.log(err);
    }
    else{
    foundlist.items.push(item);
    foundlist.save();
    res.redirect("/list"+listName+random+random);
  }
  });
// >>>>>>>>>

});

app.post("/delete",function(req,res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  List.findOneAndUpdate({_id:listName}, {$pull:{items:{_id:checkedItemId}}},function(err,foundList){
    if(!err){
      res.redirect("/list"+(listName+random+random));
    }
  });

});
app.get("/list:customListName",function(req,res){
  if(req.isAuthenticated()){
   List.findById(req.user.id,function(err,foundList){
   if(!err)
    {
      res.render("list", {id: foundList._id, newListItems:foundList.items});
    }
   });
   }
   else{
     res.redirect("/login");
   }
 });

 app.get("/logout",function(req,res){
 req.logout();
 res.redirect("/login");
 });

let port = process.env.PORT;
if (port == null || port == "") {
  port = 4000;
}

app.listen(port, function() {
  console.log("Server has started Successfully");
});


// app.listen(4000, function() {
//   console.log("Server has started Successfully");
// });

// app.get("/about", function(req, res){
//   res.render("about");
// });

// const md5= require("md5");

// const list = new List({
//   username:username,
//   password: password,
//   items:defaultItems
// });
//  list.save();
//  res.redirect("/login");

// const customListName = _.capitalize(req.params.customListName);
//  var str =String(customListName);
//  var len = customListName.length;
//  const realid = str.substr(0,(len-2));
//  var auth = str.substr((len-1),len);
