const Post = require('../models/Post')
const auth = require('../auth');

// Create a new post (Authenticated users only)
module.exports.createPost = async (req, res) => {
    try {
        const { title, content } = req.body;
        const user = req.user; // From auth.verify middleware

        // Validate input
        if (!title || !content) {
            return res.status(400).json({ error: 'Title and content are required' });
        }

        const newPost = new Post({
            title,
            content,
            author: {
              userId: user.id,  
              name: user.username
            }
        });

        const savedPost = await newPost.save();
        return res.status(201).json({
            message: 'Post created successfully',
            post: savedPost
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// Read all posts (Public)
module.exports.getAllPosts = async (req, res) => {
    try {
        const posts = await Post.find().sort({ createdAt: -1 });

        // Flatten the author field
        const flattenedPosts = posts.map(post => {
            return {
                _id: post._id,
                title: post.title,
                content: post.content,
                author: post.author,  // Keep the entire author object
                createdAt: post.createdAt,
                comments: post.comments,
                __v: post.__v
            };
        });

        return res.status(200).json(flattenedPosts);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};



// Read single post by ID (Public)
module.exports.getPostById = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        // Flatten the author field just like in the getAllPosts method
        const flattenedPost = {
            _id: post._id,
            title: post.title,
            content: post.content,
            author: post.author,  // Keep the entire author object
            createdAt: post.createdAt,
            comments: post.comments,
            __v: post.__v
        };

        return res.status(200).json(flattenedPost);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};


// Update a post (Authenticated users only, must be post author)

module.exports.updatePost = async (req, res) => {
    try {
        const { title, content } = req.body;
        const user = req.user; // From auth.verify middleware

        // Check if user is authenticated
        if (!user) {
            return res.status(401).json({ auth: 'Failed', message: 'Authorization required' });
        }

        // Find the post by ID
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        // Confirm author exists and user is authorized
        if (
            !post.author ||
            !post.author.userId ||
            post.author.userId.toString() !== user.id.toString()
        ) {
            return res.status(403).json({ message: 'Unauthorized to update this post' });
        }

        // Apply updates if provided
        if (title) post.title = title;
        if (content) post.content = content;

        const updatedPost = await post.save();

        return res.status(200).json({
            message: 'Post updated successfully',
            updatedPost: {
                _id: updatedPost._id,
                title: updatedPost.title,
                content: updatedPost.content,
                author: updatedPost.author,
                createdAt: updatedPost.createdAt,
                comments: updatedPost.comments,
                __v: updatedPost.__v
            }
        });

    } catch (error) {
        console.error('Update Post Error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};




// Delete a post (Authenticated users only, must be post author)
module.exports.deletePost = async (req, res) => {
    try {
        const user = req.user; // This comes from the auth middleware
        const post = await Post.findById(req.params.id); // Find the post by its ID

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        // Check if the user is either the author of the post or an admin
        if (
            post.author.userId.toString() !== user.id.toString() && // The user is not the author
            !user.isAdmin // The user is not an admin (default false)
        ) {
            return res.status(403).json({ message: 'Unauthorized to delete this post' });
        }

        await post.deleteOne(); // Delete the post
        return res.status(200).json({ message: 'Post deleted successfully' });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// Add a comment to a post (Authenticated users only)
module.exports.addComment = async (req, res) => {
    try {
        const { comment } = req.body;
        const user = req.user;
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        if (!comment) {
            return res.status(400).json({ error: 'Comment text is required' });
        }

        const newComment = {
            commenter: user.username,
            comment,
            commentedAt: new Date()
        };

        post.comments.push(newComment);
        const updatedPost = await post.save();

        return res.status(201).json({
            message: 'Comment added successfully',
            updatedPost: {
                _id: updatedPost._id,
                title: updatedPost.title,
                content: updatedPost.content,
                author: updatedPost.author, 
                createdAt: updatedPost.createdAt,
                comments: updatedPost.comments,
                __v: updatedPost.__v
            }
        });

    } catch (error) {
        console.error('Add Comment Error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};


// Get all comments for a post (Public)
module.exports.getComments = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        return res.status(200).json(post.comments);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports.editComment = async (req, res) => {
    try {
        const { comment } = req.body;  // Changed to `comment`
        const user = req.user; // From auth.verify middleware
        const { postId, commentId } = req.params;

        if (!comment) {  // Checking for `comment` instead of `commentText`
            return res.status(400).json({ message: 'Updated comment text is required.' });
        }

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ message: 'Post not found.' });
        }

        const existingComment = post.comments.id(commentId);
        if (!existingComment) {
            return res.status(404).json({ message: 'Comment not found.' });
        }

        // Only the original commenter can edit their comment
        if (existingComment.commenter !== user.username) {
            return res.status(403).json({ message: 'You are not authorized to edit this comment.' });
        }

        // Update the comment text
        existingComment.comment = comment;  // Updated field to `comment`

        await post.save();

        return res.status(200).json({ message: 'Comment updated successfully.', updatedComment: existingComment });
    } catch (error) {
        console.error('Edit Comment Error:', error);
        return res.status(500).json({ error: 'Internal server error.' });
    }
};


module.exports.deleteComment = async (req, res) => {
    try {
        const user = req.user;
        const { postId, commentId } = req.params;

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ message: 'Post not found.' });
        }

        const comment = post.comments.id(commentId);
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found.' });
        }

        // Allow if the user is the commenter or an admin
        if (
            comment.commenter !== user.username &&
            !user.isAdmin
        ) {
            return res.status(403).json({ message: 'You are not authorized to delete this comment.' });
        }

        comment.deleteOne();
        await post.save();

        return res.status(200).json({ message: 'Comment deleted successfully.' });

    } catch (error) {
        console.error('Delete Comment Error:', error);
        return res.status(500).json({ error: 'Internal server error.' });
    }
};
