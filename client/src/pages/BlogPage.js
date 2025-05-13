import React, { useState, useEffect } from 'react';
import { Container, Spinner, Alert, Button, Modal, Form } from 'react-bootstrap';
import { Notyf } from 'notyf';
import 'notyf/notyf.min.css';
import AppNavBar from '../components/AppNavBar';
import Post from '../components/Post';

const BlogPage = () => {
    const [posts, setPosts] = useState([]);
    const [comments, setComments] = useState({});
    const [newComment, setNewComment] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [postForm, setPostForm] = useState({ title: '', content: '' });
    const [formErrors, setFormErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [currentUsername, setCurrentUsername] = useState(null);
    const notyf = new Notyf({ duration: 3000, position: { x: 'right', y: 'top' } });
    const isAuthenticated = !!localStorage.getItem('token');

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const response = await fetch('https://blog-app-3sr0.onrender.com/posts/getAllPosts', {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch posts');
                }

                const data = await response.json();
                const formattedPosts = data.map(post => ({
                    id: post._id,
                    title: post.title,
                    content: post.content,
                    author: {
                        userId: post.author.userId,
                        name: post.author.name || 'Unknown Author',
                    },
                    createdAt: post.createdAt,
                    comments: post.comments || [],
                }));

                setPosts(formattedPosts);

                const commentsData = {};
                for (const post of formattedPosts) {
                    try {
                        const commentResponse = await fetch(`https://blog-app-3sr0.onrender.com/posts/comments/${post.id}`, {
                            method: 'GET',
                            headers: { 'Content-Type': 'application/json' },
                        });

                        if (commentResponse.ok) {
                            const comments = await commentResponse.json();
                            commentsData[post.id] = comments.map(comment => ({
                                id: comment._id,
                                commenter: comment.commenter,
                                comment: comment.comment,
                                commentedAt: comment.commentedAt,
                            }));
                        } else {
                            console.error(`Failed to fetch comments for post ${post.id}: ${commentResponse.status}`);
                        }
                    } catch (err) {
                        console.error(`Failed to fetch comments for post ${post.id}:`, err);
                    }
                }
                setComments(commentsData);
                setIsLoading(false);
            } catch (err) {
                setError(err.message || 'Internal server error');
                setIsLoading(false);
            }
        };

        const fetchUser = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;

                const response = await fetch('https://blog-app-3sr0.onrender.com/users/details', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    setCurrentUserId(data.id);
                    setCurrentUsername(data.username);
                }
            } catch (err) {
                console.error('Failed to fetch user:', err);
            }
        };

        fetchPosts();
        fetchUser();
    }, []);

    const handleAddComment = async (postId) => {
        if (!newComment[postId]) {
            notyf.error('Comment text is required');
            return;
        }

        if (!isAuthenticated) {
            notyf.error('You must be logged in to comment');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`https://blog-app-3sr0.onrender.com/posts/addComment/${postId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ comment: newComment[postId] }),
            });

            const data = await response.json();

            if (response.ok) {
                notyf.success('Comment added successfully!');
                setComments({
                    ...comments,
                    [postId]: [
                        ...(comments[postId] || []),
                        {
                            id: data.updatedPost.comments[data.updatedPost.comments.length - 1]._id,
                            commenter: data.updatedPost.comments[data.updatedPost.comments.length - 1].commenter,
                            comment: newComment[postId],
                            commentedAt: new Date(),
                        },
                    ],
                });
                setNewComment({ ...newComment, [postId]: '' });
            } else {
                notyf.error(data.error || 'Failed to add comment');
            }
        } catch (err) {
            notyf.error(err.message || 'Internal server error');
        }
    };

    const handleEditComment = async (postId, commentId, updatedComment) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`https://blog-app-3sr0.onrender.com/posts/editComment/${postId}/${commentId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ comment: updatedComment }),
            });

            const data = await response.json();

            if (response.ok) {
                notyf.success('Comment updated successfully!');
                setComments({
                    ...comments,
                    [postId]: comments[postId].map(comment =>
                        comment.id === commentId ? { ...comment, comment: updatedComment } : comment
                    ),
                });
                return true;
            } else {
                notyf.error(data.message || 'Failed to update comment');
                return false;
            }
        } catch (err) {
            notyf.error(err.message || 'Internal server error');
            return false;
        }
    };

    const handleDeleteComment = async (postId, commentId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`https://blog-app-3sr0.onrender.com/posts/deleteComment/${postId}/${commentId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if (response.ok) {
                notyf.success('Comment deleted successfully!');
                setComments({
                    ...comments,
                    [postId]: comments[postId].filter(comment => comment.id !== commentId),
                });
                return true;
            } else {
                notyf.error(data.message || 'Failed to delete comment');
                return false;
            }
        } catch (err) {
            notyf.error(err.message || 'Internal server error');
            return false;
        }
    };

    const handleOpenCreateModal = () => setShowCreateModal(true);
    const handleCloseCreateModal = () => {
        setShowCreateModal(false);
        setPostForm({ title: '', content: '' });
        setFormErrors({});
    };

    const validateForm = () => {
        const errors = {};
        if (!postForm.title) errors.title = 'Title is required';
        if (!postForm.content) errors.content = 'Content is required';
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleCreatePost = async (e) => {
        e.preventDefault();
        if (!validateForm()) {
            notyf.error('Please fix the errors in the form');
            return;
        }

        setIsSubmitting(true);

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('You must be logged in to create a post');
            }

            const response = await fetch('https://blog-app-3sr0.onrender.com/posts/createPost', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(postForm),
            });

            const data = await response.json();

            if (response.ok) {
                notyf.success('Post created successfully!');
                const newPost = {
                    id: data.post._id,
                    title: data.post.title,
                    content: data.post.content,
                    author: {
                        userId: data.post.author.userId,
                        name: data.post.author.name || 'Unknown Author',
                    },
                    createdAt: data.post.createdAt,
                    comments: data.post.comments || [],
                };
                setPosts([newPost, ...posts]);
                handleCloseCreateModal();
            } else {
                notyf.error(data.error || 'Failed to create post');
            }
        } catch (err) {
            notyf.error(err.message || 'Internal server error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdatePost = async (postId, updatedData) => {
        setIsSubmitting(true);

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('You must be logged in to update a post');
            }

            const response = await fetch(`https://blog-app-3sr0.onrender.com/posts/updatePost/${postId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(updatedData),
            });

            const data = await response.json();

            if (response.ok) {
                notyf.success('Post updated successfully!');
                setPosts(posts.map(post =>
                    post.id === postId
                        ? {
                              ...post,
                              title: data.updatedPost.title,
                              content: data.updatedPost.content,
                          }
                        : post
                ));
                return true;
            } else {
                notyf.error(data.message || 'Failed to update post');
                return false;
            }
        } catch (err) {
            notyf.error(err.message || 'Internal server error');
            return false;
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeletePost = async (postId) => {
        setIsSubmitting(true);

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('You must be logged in to delete a post');
            }

            const response = await fetch(`https://blog-app-3sr0.onrender.com/posts/deletePost/${postId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if (response.ok) {
                notyf.success('Post deleted successfully!');
                setPosts(posts.filter(post => post.id !== postId));
                return true;
            } else {
                notyf.error(data.message || 'Failed to delete post');
                return false;
            }
        } catch (err) {
            notyf.error(err.message || 'Internal server error');
            return false;
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <AppNavBar />
            <Container className="mt-5 pt-5">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2 className="text-center">Blog Posts</h2>
                    {isAuthenticated && (
                        <Button variant="primary" onClick={handleOpenCreateModal}>
                            Create Post
                        </Button>
                    )}
                </div>

                {isLoading ? (
                    <div className="text-center">
                        <Spinner animation="border" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </Spinner>
                        <p>Loading posts...</p>
                    </div>
                ) : error ? (
                    <Alert variant="danger" className="text-center">
                        {error}
                    </Alert>
                ) : posts.length === 0 ? (
                    <Alert variant="info" className="text-center">
                        No posts available.
                    </Alert>
                ) : (
                    posts.map((post) => (
                        <Post
                            key={post.id}
                            post={post}
                            comments={comments[post.id] || []}
                            newComment={newComment}
                            setNewComment={setNewComment}
                            handleAddComment={handleAddComment}
                            handleEditComment={handleEditComment}
                            handleDeleteComment={handleDeleteComment}
                            currentUserId={currentUserId}
                            currentUsername={currentUsername}
                            isAuthenticated={isAuthenticated} // Pass authentication status
                            handleUpdatePost={handleUpdatePost}
                            handleDeletePost={handleDeletePost}
                        />
                    ))
                )}

                <Modal show={showCreateModal} onHide={handleCloseCreateModal}>
                    <Modal.Header closeButton>
                        <Modal.Title>Create a New Post</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form onSubmit={handleCreatePost}>
                            <Form.Group className="mb-3" controlId="postTitle">
                                <Form.Label>Title</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Enter post title"
                                    value={postForm.title}
                                    onChange={(e) =>
                                        setPostForm({ ...postForm, title: e.target.value })
                                    }
                                    isInvalid={!!formErrors.title}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {formErrors.title}
                                </Form.Control.Feedback>
                            </Form.Group>

                            <Form.Group className="mb-3" controlId="postContent">
                                <Form.Label>Content</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={5}
                                    placeholder="Enter post content"
                                    value={postForm.content}
                                    onChange={(e) =>
                                        setPostForm({ ...postForm, content: e.target.value })
                                    }
                                    isInvalid={!!formErrors.content}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {formErrors.content}
                                </Form.Control.Feedback>
                            </Form.Group>

                            <Button
                                variant="primary"
                                type="submit"
                                className="w-100"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Spinner
                                            as="span"
                                            animation="border"
                                            size="sm"
                                            role="status"
                                            aria-hidden="true"
                                        />
                                        {' Submitting...'}
                                    </>
                                ) : (
                                    'Create Post'
                                )}
                            </Button>
                        </Form>
                    </Modal.Body>
                </Modal>
            </Container>
        </>
    );
};

export default BlogPage;