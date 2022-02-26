const express = require('express');
const router = new express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const Followers = require('../models/Followers');
const Following = require('../models/Following');
const auth = require('../middleware/auth');
const Post = require('../models/Post');
const PostLike = require('../models/PostLike');
const PostComment = require('../models/PostComment');
require('dotenv').config();

router.post('/adduser', async (req, res) => {
    const user = await new User(req.body);
    try {
        await user.save();
        const token = await user.generateAuthToken()
        res.send({ user, token });
    } catch (error) {
        res.status(400).send({message: 'Unable to register', error})
    }
})

router.post('/authenticate', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        res.send({ user, token })
    } catch (e) {
        console.log(e);
        res.status(400).send(e)
    }
})

router.post('/follow/:id', auth, async (req, res) => {
    const userId = req.params.id;
    const user = req.user;

    try {
        const userToFollow = await User.findById(userId);
        if (!userToFollow) {
            return res.status(400).send({ error: 'no user with this id' });
        }

        const followerUpdate = await Followers.updateOne(
            { user: userId, 'followers.user': { $ne: user._id } },
            { $push: { followers: { user: user._id } } }
        )

        const followingUpdate = await Following.updateOne(
            { user: user._id, 'following.user': { $ne: userId } },
            { $push: { following: { user: userId } } }
        );

        if (!followerUpdate.modifiedCount || !followingUpdate.modifiedCount) {
            if (!followerUpdate.matchedCount || !followingUpdate.matchedCount) {
                return res.status(500).send({ error: 'You already follow this user' });
            }
        }

        return res.send({success: true, operation: 'follow'})

    } catch (error) {
        res.send(400).send(error);
    }
})

router.post('/unfollow/:id', auth, async(req,res)=>{
    const userId = req.params.id;
    const user = req.user;

    try {
        const userToUnFollow = await User.findById(userId);
        if (!userToUnFollow) {
            return res.status(400).send({ error: 'No user with this id' });
        }

        const followerUnfollowUpdate = await Followers.updateOne(
            {
              user: userId,
            },
            { $pull: { followers: { user: user._id } } }
          );
    
          const followingUnfollowUpdate = await Following.updateOne(
            { user: user._id },
            { $pull: { following: { user: userId } } }
          );

          if (!followerUnfollowUpdate.modifiedCount || !followingUnfollowUpdate.modifiedCount) {
            return res.status(500).send({ error: 'Could not unfollow user please try again later.' });
          }
          return res.send({ success: true, operation: 'unfollow' });
    } catch (error) {
        res.send(400).send(error);
    }
})

router.get('/user', auth, async (req, res) => {
    const user = req.user;
    const allFollowers = await Followers.findOne({user: user._id});
    const allFollowing = await Following.findOne({user: user._id});
    const userData = {
        username: user.email,
        followers: allFollowers.followers.length,
        following: allFollowing.following.length
    }

    res.send(userData);
})

router.post('/posts', auth, async (req, res) => {
    const user = req.user;
    const post = new Post({
        title: req.body.title,
        caption: req.body.caption,
        author: user._id
    })

    const postLike = new PostLike({
        post: post._id
    })

    try {
        await post.save();
        await postLike.save();
        res.send(post);
    } catch (error) {
        res.status(400).send("Not able to upload the post");
    }
})

router.delete('/posts/:id', auth, async (req, res) => {
    const postId = req.params.id;
    const user = req.user;

    try {
        const post = await Post.findOne({ _id: postId, author: user._id });
        if (!post) {
            return res.status(404).send({ error: "No post with this id assosciated with user"})
        }

        const postDelete = await Post.deleteOne({ _id: postId });
        if (!postDelete.deletedCount) {
            return res.status(500).send({ error: 'Could not delete the post.' });
        }

        res.send('Post successfully deleted');
    } catch (error) {
        res.status(500).send('Not able to delete the post')
    }
})

router.post('/like/:id', auth, async (req, res) => {
    const postId = req.params.id;
    const user = req.user
    try {
        const postLikeUpdate = await PostLike.updateOne(
            { post: postId, 'votes.author': { $ne: user._id } },
            {
                $push: { votes: { author: user._id } },
            }
        )
        if(!postLikeUpdate.modifiedCount){
            if(!postLikeUpdate.matchedCount){
                res.status(404).send("User has already liked the post")
            }
        }

        res.status(204).send("Post successfully liked")
    } catch (error) {
        res.status(500).send("Not able to like the post")
    }
})

router.post('/unlike/:id', auth, async(req, res)=>{
    console.log("")
})

router.post('/comment/:id', auth, async(req, res)=>{
    const postId = req.params.id;
    const user = req.user;
    const comment = req.body.comment;

    if(!comment){
        return res.status(404).send({ error: "Comment cannot be empty"})
    }

    try {
        const post = Post.findById(postId);
        if(!post){
            return res.status(404).send({ error: 'No post with this id'})
        }

        const addComment = new PostComment({
            comment,
            author: user._id,
            post: postId
        })

        await addComment.save();
        return res.send({addComment})
    } catch (error) {
        res.status(500).send("Not able to comment on post");
    }

})

router.get('/posts/:id', async(req, res)=> {
    const postId = req.params.id;

    try {
        const post = await Post.findById(postId);
        if(!post){
            return res.status(400).send({ error: 'No post found with this id'})
        }

        const allPostLikes = await PostLike.findOne({post: postId});
        const allPostComments = await PostComment.find({post: postId})

        const postData = {
            title: post.title,
            caption: post.caption,
            likes: allPostLikes.votes.length,
            comment: allPostComments.length
        }

        res.send(postData);
    } catch (error) {
        res.status(500).send("Not able to fetch post data");
    }
})

router.get('/all_posts', auth, async(req, res) => {
    const user = req.user;
    try {
        const allPosts = await Post.find({author: user._id});
        const allPostsData = [];

        for (let i = 0; i < allPosts.length; i++) {
            const post = allPosts[i];
            const allPostLikes = await PostLike.findOne({post: post._id});
            const allPostComments = await PostComment.find({post: post._id});

            const allComments = [];

            for (let i = 0; i < allPostComments.length; i++) {
                const comment = allPostComments[i];
                allComments.push(comment.comment)
            }

            const postData = {
                id: post._id,
                title: post.title,
                caption: post.caption,
                created_at: post.createdAt,
                comments: allComments,
                likes: allPostLikes.votes.length
            }

            allPostsData.push(postData);
        }
        res.send(allPostsData);
    } catch (error) {
        res.status(500).send("Not able to fetch all posts")
        console.log(error);
    }
})

module.exports = router;