const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PostLikeSchema = new Schema({
    post: {
        type: Schema.ObjectId,
        ref: 'Post'
    },
    votes: [
        {
            author: {
                type: Schema.ObjectId,
                ref: 'User'
            }
        }]
});

const PostLikeModel = mongoose.model('postlikes', PostLikeSchema);

module.exports = PostLikeModel;