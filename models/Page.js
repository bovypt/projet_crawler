const mongoose = require('mongoose');

const pageSchema = new mongoose.Schema({
    url: {
        type: String,
        required: true,
        unique: true
    },
    title: {
        type: String,
        required: true
    },
    description: String,
    h1: String,
    links: [String],
    content: String,
    zipFile: String,
    crawledAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Page', pageSchema); 