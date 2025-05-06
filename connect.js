const mongoose = require('mongoose');
require("dotenv").config({path: "./config.env"})

const connectToMongo = async () => {
    try {
      await mongoose.connect(process.env.ATLAS_URI, {
        useNewUrlParser: true, // Still recommended
        useUnifiedTopology: true 
  
      });
      console.log("Connected to MongoDB successfully");
    } catch (error) {
      console.error("Failed to connect to MongoDB", error);
    }
  };
  
  module.exports = connectToMongo;