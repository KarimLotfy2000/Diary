//jshint esversion:6
const express = require("express")
const bodyParser = require("body-parser")
const ejs = require("ejs")
const mongoose = require("mongoose")
const session = require("express-session")
const passport = require("passport")
const passportLocalMongoose = require("passport-local-mongoose")

const app = express();



//to apply  ejs
app.set("view engine", "ejs")

//to apply bodyparser
app.use(bodyParser.urlencoded({ extended: true }))


//for the local  files to be applied 
app.use(express.static('public'));
app.use(express.static(__dirname + '/images/'));



var sess = {
    secret: 'SECRETCODE__',
    resave: false,
    saveUninitialized: false,
    cookie: {}
}

if (app.get('env') === 'production') {
    app.set('trust proxy', 1) // trust first proxy
    sess.cookie.secure = true // serve secure cookies
}

app.use(session(sess))

app.use(passport.initialize())
app.use(passport.session())


//Connecting to DB Atlas
mongoose.connect('mongodb+srv://KLotfy:test@cluster0.ggnv6ch.mongodb.net/UserDB')
    .then(() => console.log('connected to DB successfully!'))
    .catch(e => console.log(e));




//User Schema 
const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    secrets:[String]
    // secret:String
})

userSchema.plugin(passportLocalMongoose) // Hash and salt the passwords 

const User = new mongoose.model("User", userSchema)

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());



//GET METHODS 
app.get("/", (req, res) => {
    res.render("home")
})

app.get("/secrets", (req, res) => {
    if (req.isAuthenticated()) {

        
       User.findById(req.user.id,(err,foundUser)=>{
            res.render("secrets",{usersSecrets:foundUser.secrets})
        console.log(foundUser.secrets)
       })
       
       
    }
    else {
        res.redirect("/login")
    }
})

app.get("/register", (req, res) => {
    res.render("register")
})<


app.get("/login", (req, res) => {
    res.render("login")
})

app.get("/submit", (req, res) => {
    res.render("submit")
})


app.get('/logout', function(req, res, next){
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});



app.get("/submit",(req,res)=>{
    if (req.isAuthenticated()) {
        res.render("submit")
    }
    else {
        res.redirect("/login")
    }
})

//POST METHODS
app.post("/register", (req, res) => {

    User.register({ username: req.body.username, active: false }, req.body.password, function (err, user) {
        if (err) {
            console.log(err)
            res.redirect("/register") // To try Again 

        }
        else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/secrets")
            })
        }

    });


})



app.post("/login", (req, res) => {

    const user = new User({
        username: req.body.username,
        password: req.body.password
    })
    req.login(user, function (err) {
        if (err) {
            console.log(err);
        }
        else {
            passport.authenticate("local")(req, res, function () {
            res.redirect("/secrets")
            })
        }
    })


})

let i=0
app.post("/submit",(req,res)=>{
    
    const secret=req.body.secret

    
    
    User.findById(req.user.id,(err,foundUser)=>{
        if(err){
            console.log(err);
        }
        else{
            if(foundUser){
                
            
                 foundUser.secrets[i]=secret
                 
                 
                foundUser.save(()=>{res.redirect("/secrets")})
                
               i++

                 
              
            }
        }
    })
    
})




app.listen(3000, err => console.log("Server started on port 3000"))