const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CommentSchema = new Schema({
    date: {
        type: Date,
        default: Date.now
    },
    comment: String,
    author: {
        type: Schema.ObjectId,
        ref: 'User'
    },
    post: {
        type: Schema.ObjectId,
        ref: 'Post'
    }
});

const CommentModel = mongoose.model('postcomments', CommentSchema);
module.exports = CommentModel;