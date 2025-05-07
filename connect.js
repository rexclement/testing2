const mongoose = require('mongoose');
// require("dotenv").config({path: "./config.env"})
require('dotenv').config();
const uri = process.env.ATLAS_URI;
const connectToMongo = async () => {
    try {
      await mongoose.connect(uri, {
        useNewUrlParser: true, // Still recommended
        useUnifiedTopology: true 
  
      });
      console.log("Connected to MongoDB successfully");
    } catch (error) {
      console.error("Failed to connect to MongoDB", error);
    }
  };
  
  module.exports = connectToMongo;