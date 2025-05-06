const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  }
}); 

const Storesdb = mongoose.model('Store', userSchema);
module.exports = Storesdb;
