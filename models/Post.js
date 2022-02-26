const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const postSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    caption: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    author: {
        type: Schema.ObjectId,
        ref: 'User'
    }
})

postSchema.pre('deleteOne', async function (next) {
    const postId = this.getQuery()['_id'];
    try {
        await mongoose.model('postcomments').deleteMany({ post: postId });
        await mongoose.model('postlikes').deleteOne({ post: postId });
        next();
    } catch (err) {
        next(err);
    }
});

const Post = mongoose.model('Posts', postSchema);
module.exports = Post