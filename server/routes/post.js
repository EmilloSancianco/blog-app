const express = require('express');
const postController = require('../controllers/post');
const { verify } = require('../auth');


const router = express.Router();

router.post('/createPost', verify, postController.createPost);

router.get('/getAllPosts', postController.getAllPosts);

router.get('/getPost/:id', postController.getPostById);

router.patch('/updatePost/:id', verify, postController.updatePost);

router.delete('/deletePost/:id', verify, postController.deletePost);

router.get('/comments/:id', postController.getComments);

router.post('/addComment/:id', verify, postController.addComment);

router.patch('/editComment/:postId/:commentId', verify, postController.editComment);

router.delete('/deleteComment/:postId/:commentId', verify, postController.deleteComment);


module.exports = router;