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






//mongodb+srv://rexclement:Aay0y4rK4cq3xe9r@cluster0.ozguu.mongodb.net/db?retryWrites=true&w=majority&appName=Cluster0
//mongodb+srv://rexclement:Aay0y4rK4cq3xe9r@cluster0.d7z2w.mongodb.net/db?retryWrites=true&w=majority&appName=Cluster0
