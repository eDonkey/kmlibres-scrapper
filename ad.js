// Ad.js
const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    nickname: { type: String, required: true },
    comment: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});

const adSchema = new mongoose.Schema({
    adId: { type: String, required: true, unique: true },
    images: [String],
    kilometers: String,
    description: String,
    timestamp: { type: Date, default: Date.now },
    comments: [commentSchema] // Campo para almacenar los comentarios
});

const Ad = mongoose.model('Ad', adSchema);

module.exports = Ad;
