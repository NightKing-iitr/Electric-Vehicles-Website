const mongoose = require('mongoose');

const blogSchema = mongoose.Schema({
    heading: {
        type: String
    },
    htmlDoc: {
        type: String
    },
    dateCreated: {
        type: Date,
        default: Date.now
    },
    author: {
        type: String
    },
    minuteread: {
        type: String
    },
    comment: [
        {
            body: {type: String}
        }
    ],
    likes: {
        type: String
    }
});

var Blog = module.exports = mongoose.model('Blog', blogSchema);