const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({
  text: String,
  created_on: { type: Date, default: new Date() },
  delete_password: String,
  reported: { type: Boolean, default: false }
});

const threadSchema = new mongoose.Schema({
  board: String,
  text: String,
  created_on: { type: Date, default: new Date() },
  bumped_on: { type: Date, default: new Date() },
  reported: { type: Boolean, default: false },
  delete_password: String,
  replies: [replySchema]
});

module.exports = mongoose.model('Thread', threadSchema);
