import React, { useState, useEffect } from 'react';
import { Container, Spinner, Alert, Card, Button } from 'react-bootstrap';
import { Notyf } from 'notyf';
import 'notyf/notyf.min.css';
import { useNavigate } from 'react-router-dom';
import AppNavBar from '../components/AppNavBar';
import Post from '../components/Post';

const ProfilePage = () => {
    const [user, setUser] = useState(null);
    const [posts, setPosts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [currentUsername, setCurrentUsername] = useState(null);
    const notyf = new Notyf({ duration: 3000, position: { x: 'right', y: 'top' } });
    const isAuthenticated = !!localStorage.getItem('token');
    const navigate = useNavigate();

    useEffect(() => {
        if (!isAuthenticated) {
            notyf.error('You must be logged in to view your profile');
            navigate('/login');
            return;
        }

        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch('http://localhost:4000/users/details', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to fetch profile');
                }

                const data = await response.json();
                setUser(data);
                setCurrentUserId(data.id);
                setCurrentUsername(data.username);
            } catch (err) {
                setError(err.message || 'Internal server error');
                setIsLoading(false);
            }
        };

        const fetchPosts = async () => {
            try {
                const response = await fetch('http://localhost:4000/posts/getAllPosts', {
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
            } catch (err) {
                setError(err.message || 'Internal server error');
            } finally {
                setIsLoading(false); // Set isLoading to false after both fetches
            }
        };

        fetchProfile();
        fetchPosts();
    }, [isAuthenticated, navigate]);

    const handleUpdatePost = async (postId, updatedData) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:4000/posts/updatePost/${postId}`, {
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
                        ? { ...post, title: data.updatedPost.title, content: data.updatedPost.content }
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
        }
    };

    const handleDeletePost = async (postId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:4000/posts/deletePost/${postId}`, {
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
        }
    };

    const userPosts = posts.filter(post => post.author.userId === currentUserId);

    if (!isAuthenticated) return null; // Redirect handled in useEffect

    return (
        <>
            <AppNavBar />
            <Container className="mt-5 pt-5">
                <h2 className="text-center mb-4">My Profile</h2>

                {isLoading ? (
                    <div className="text-center">
                        <Spinner animation="border" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </Spinner>
                        <p>Loading profile...</p>
                    </div>
                ) : error ? (
                    <Alert variant="danger" className="text-center">
                        {error}
                    </Alert>
                ) : !user ? (
                    <Alert variant="danger" className="text-center">
                        Unable to load profile data
                    </Alert>
                ) : (
                    <>
                        <Card className="mb-4">
                            <Card.Body>
                                <Card.Title>{user.username}</Card.Title>
                                <Card.Text>
                                    <strong>Email:</strong> {user.email}
                                    <br />
                                    <strong>User ID:</strong> {user.id}
                                </Card.Text>
                            </Card.Body>
                        </Card>

                        <h3 className="mb-3">My Posts</h3>
                        {userPosts.length === 0 ? (
                            <Alert variant="info" className="text-center">
                                You have not created any posts yet.
                            </Alert>
                        ) : (
                            userPosts.map(post => (
                                <Post
                                    key={post.id}
                                    post={post}
                                    comments={post.comments}
                                    currentUserId={currentUserId}
                                    currentUsername={currentUsername}
                                    isAuthenticated={isAuthenticated}
                                    handleUpdatePost={handleUpdatePost}
                                    handleDeletePost={handleDeletePost}
                                    newComment={{}}
                                    setNewComment={() => {}}
                                    handleAddComment={() => notyf.error('Commenting disabled on profile page')}
                                    handleEditComment={() => notyf.error('Comment editing disabled on profile page')}
                                    handleDeleteComment={() => notyf.error('Comment deletion disabled on profile page')}
                                />
                            ))
                        )}
                    </>
                )}
            </Container>
        </>
    );
};

export default ProfilePage;