const mongoose = require('mongoose');

const crawlSessionSchema = new mongoose.Schema({
    startUrl: {
        type: String,
        required: true
    },
    maxDepth: {
        type: Number,
        required: true
    },
    maxPages: {
        type: Number,
        required: true
    },
    delay: {
        type: Number,
        required: true
    },
    startedAt: {
        type: Date,
        default: Date.now
    },
    completedAt: Date,
    status: {
        type: String,
        enum: ['running', 'completed', 'failed'],
        default: 'running'
    },
    pagesCrawled: {
        type: Number,
        default: 0
    }
});

module.exports = mongoose.model('CrawlSession', crawlSessionSchema); 