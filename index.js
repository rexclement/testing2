const bcrypt = require('bcryptjs');
const express = require("express");
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const {configureCloudinary} = require ("./middlewares/cloudinary");


const bodyParser = require("body-parser");


const cors = require("cors");
const path = require("path");
const fs = require("fs-extra");
const connectTOMongo=require("./connect");
const upload = require("./middlewares/upload"); // Import multer middleware
const event_router = require("./routers/Events");
const document_router = require("./routers/Document");
const members_router = require("./routers/Member");
const cell_router = require("./routers/Prayer_cells");
const Storesdb = require("./models/store");
const { redirect } = require('react-router-dom');
const serverless = require('serverless-http');

const MongoStore = require("connect-mongo");

// require("dotenv").config({path: "./config.env"})
require('dotenv').config();


connectTOMongo();
configureCloudinary();




const saltRounds = 10;
const port = process.env.PORT || 5000;
const app = express();
app.use(cors({
  origin: "https://rexclement.github.io",
  credentials: true
}));


app.use(bodyParser.urlencoded({ extended: true }));






app.use(express.json());




app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.ATLAS_URI,
    ttl: 60 * 60, // 1 hour in seconds
  }),
  cookie: {
    maxAge: 60 * 60 * 1000, // 1 hour in milliseconds
    secure: true,
    sameSite: 'none',
    httpOnly: true
  }
}));



app.use(passport.initialize());
app.use(passport.session());





passport.use(new LocalStrategy(async (username, password, done) => {
  try {
    // console.log(username);
    const user = await Storesdb.findOne({ username });
    if (!user) return done(null, false, { message: 'User not found' });
    console.log("✅ User found in passport LocalStratergy:", user.username);
    const isValid = await bcrypt.compare(password, user.password);
    // console.log(isValid)
    if (!isValid) return done(null, false, { message: 'Wrong password' });

    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));

// Session serialization
passport.serializeUser((user, done) => {
  console.log("✅ User found in serializer:", user.username);
  // Store minimal info in session
  done(null, { id: user._id, username: user.username });
});

passport.deserializeUser(async (sessionUser, done) => {
  try {
    console.log("🔍 Deserializing user:", sessionUser); // See what’s inside

    const user = await Storesdb.findById(sessionUser.id);
    if (user) {
      console.log("✅ User found:", user.username);
      done(null, { id: user._id, username: user.username });
    } else {
      console.log("❌ User not found in DB");
      done(null, false);
    }
  } catch (err) {
    console.log("🔥 Error in deserializeUser:", err);
    done(err);
  }
});


function isAuthenticated(req, res, next) {
  
  if (req.isAuthenticated()) {
    return next(); // user is logged in, continue to route
  }else{
    res.redirect('/');
  }
   // not logged in, redirect to /home
}

app.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ success: false, message: 'Login failed' });

    req.login(user, (err) => {
      if (err) return next(err);

      // Do NOT manually set session fields here.
      return res.json({ success: true, message: 'Login successful', user: user.username });
    });
  })(req, res, next);
});


app.use((req, res, next) => {
  console.log('Session:', req.session);
  console.log('User:', req.user);
  next();
});



app.get('/check-auth', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ loggedIn: true, user: req.user });
  } else {
    res.json({ loggedIn: false });
  }
});



app.use('/events',  event_router);

app.use("/document",document_router);

app.use("/members", members_router);

app.use("/cell",cell_router);





// Serve uploaded files statically
app.use("/uploads", express.static("uploads"));



app.post('/changeme', async (req, res) => {
    const { username, password } = req.body;

  try {
    // Delete all existing user data
    await Storesdb.deleteMany({});

    // Hash the password before saving
    bcrypt.hash(password,saltRounds, async (err,hash) =>{
        if (err){
          console.log("Error Hashing Password:",err);
        }else{
            const newUser = new Storesdb({
                username,
                password: hash
              });
          
              await newUser.save();
        }
      });

    res.json({ message: 'User saved with hashed password.' });

  } catch (error) {
    console.error('Error saving user:', error);
    res.status(500).json({ error: 'Something went wrong.' });
  }
  });

  app.get('/', (req, res) => {
    res.send('Hello from Express on Render!');
  });
  


app.listen(port, () => console.log("Server running on port 5000"));


