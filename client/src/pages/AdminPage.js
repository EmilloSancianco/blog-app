import React, { useState, useEffect } from 'react';
import { Container, Spinner, Alert } from 'react-bootstrap';
import { Notyf } from 'notyf';
import 'notyf/notyf.min.css';
import { useNavigate } from 'react-router-dom';
import AppNavBar from '../components/AppNavBar';
import Post from '../components/Post';

const AdminPage = () => {
    const [posts, setPosts] = useState([]);
    const [comments, setComments] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const notyf = new Notyf({ duration: 3000, position: { x: 'right', y: 'top' } });
    const navigate = useNavigate();

    const getAuthHeaders = () => ({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
    });

    const decodeToken = (token) => {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map(function (c) {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                })
                .join('')
        );

        return JSON.parse(jsonPayload);
    };

    useEffect(() => {
        // Check if the user is admin based on the Bearer token
        const token = localStorage.getItem('token');
        if (!token) {
            notyf.error('You must be logged in to access the admin panel');
            navigate('/login');
            return;
        }

        try {
            const decodedToken = decodeToken(token);
            const usernameOrEmail = decodedToken.username || decodedToken.email;

            if (usernameOrEmail !== 'admin' && usernameOrEmail !== 'admin@mail.com') {
                notyf.error('You are not authorized to access the admin panel');
                navigate('/');
                return;
            }
        } catch (error) {
            notyf.error('Invalid token');
            navigate('/login');
            return;
        }

        const fetchPosts = async () => {
            try {
                const response = await fetch('https://blog-app-3sr0.onrender.com/posts/getAllPosts', {
                    headers: getAuthHeaders(),
                });

                if (!response.ok) throw new Error('Failed to fetch posts');
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

                // Fetch comments for each post
                const commentsData = {};
                for (const post of formattedPosts) {
                    try {
                        const commentResponse = await fetch(
                            `https://blog-app-3sr0.onrender.com/posts/comments/${post.id}`,
                            {
                                method: 'GET',
                                headers: { 'Content-Type': 'application/json' },
                            }
                        );

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

        fetchPosts();
    }, [navigate]);

    const handleUpdatePost = async (postId, updatedData) => {
        try {
            const response = await fetch(`https://blog-app-3sr0.onrender.com/posts/updatePost/${postId}`, {
                method: 'PATCH',
                headers: getAuthHeaders(),
                body: JSON.stringify(updatedData),
            });

            const data = await response.json();

            if (response.ok) {
                notyf.success('Post updated successfully!');
                setPosts(
                    posts.map(post =>
                        post.id === postId
                            ? { ...post, title: data.updatedPost.title, content: data.updatedPost.content }
                            : post
                    )
                );
                return true;
            } else {
                notyf.error(data.message || 'Failed to update post');
                return false;
            }
        } catch (err) {
            notyf.error(err.message || 'Internal server error');
            return false;
        }
    };

    const handleDeletePost = async (postId) => {
        try {
            const token = localStorage.getItem('token');
            // Delete all comments for the post
            const deleteCommentsResponse = await fetch(
                `https://blog-app-3sr0.onrender.com/posts/comments/${postId}`,
                {
                    method: 'DELETE',
                    headers: getAuthHeaders(),
                }
            );

            if (!deleteCommentsResponse.ok) {
                const errorData = await deleteCommentsResponse.json();
                notyf.error(errorData.message || 'Failed to delete comments');
                return false;
            }

            // Delete the post
            const deletePostResponse = await fetch(
                `https://blog-app-3sr0.onrender.com/posts/deletePost/${postId}`,
                {
                    method: 'DELETE',
                    headers: getAuthHeaders(),
                }
            );

            const data = await deletePostResponse.json();

            if (deletePostResponse.ok) {
                notyf.success('Post and all comments deleted successfully!');
                setPosts(posts.filter(post => post.id !== postId));
                setComments({ ...comments, [postId]: [] });
                return true;
            } else {
                notyf.error(data.message || 'Failed to delete post');
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
            const response = await fetch(
                `https://blog-app-3sr0.onrender.com/posts/deleteComment/${postId}/${commentId}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );

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

    return (
        <>
            <AppNavBar />
            <Container className="mt-5 pt-5">
                <h2 className="text-center mb-4">Admin Panel - All Posts</h2>

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
                    posts.map(post => (
                        <Post
                            key={post.id}
                            post={post}
                            comments={comments[post.id] || []}
                            currentUserId={''}
                            currentUsername={'Guest'}
                            isAuthenticated={true}
                            isAdmin={true}
                            handleUpdatePost={handleUpdatePost}
                            handleDeletePost={handleDeletePost}
                            handleDeleteComment={handleDeleteComment}
                            newComment={{}}
                            setNewComment={() => {}}
                            handleAddComment={() => notyf.error('Commenting disabled on admin panel')}
                            handleEditComment={() => notyf.error('Comment editing disabled on admin panel')}
                        />
                    ))
                )}
            </Container>
        </>
    );
};

export default AdminPage;