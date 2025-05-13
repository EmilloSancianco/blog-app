import React, { useState } from 'react';
import { Card, Form, Button, ListGroup, Dropdown, Modal } from 'react-bootstrap';
import { Notyf } from 'notyf';
import 'notyf/notyf.min.css';

const Post = ({ post, comments, newComment, setNewComment, handleAddComment, handleEditComment, handleDeleteComment, currentUserId, currentUsername, isAuthenticated, isAdmin, handleUpdatePost, handleDeletePost }) => {
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showEditCommentModal, setShowEditCommentModal] = useState(false);
    const [showDeleteCommentModal, setShowDeleteCommentModal] = useState(false);
    const [editForm, setEditForm] = useState({ title: post.title, content: post.content });
    const [editFormErrors, setEditFormErrors] = useState({});
    const [editCommentForm, setEditCommentForm] = useState({ comment: '' });
    const [editCommentId, setEditCommentId] = useState(null);
    const [deleteCommentId, setDeleteCommentId] = useState(null);
    const notyf = new Notyf({ duration: 3000, position: { x: 'right', y: 'top' } });

    const formattedDate = post.createdAt
        ? new Date(post.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
          })
        : 'Unknown Date';

    const isAuthor = currentUserId && post.author.userId === currentUserId;
    const canDeletePost = isAuthor || isAdmin;

    const handleOpenEditModal = () => setShowEditModal(true);
    const handleCloseEditModal = () => {
        setShowEditModal(false);
        setEditForm({ title: post.title, content: post.content });
        setEditFormErrors({});
    };

    const handleOpenDeleteModal = () => setShowDeleteModal(true);
    const handleCloseDeleteModal = () => setShowDeleteModal(false);

    const handleOpenEditCommentModal = (commentId, commentText) => {
        setEditCommentId(commentId);
        setEditCommentForm({ comment: commentText });
        setShowEditCommentModal(true);
    };

    const handleCloseEditCommentModal = () => {
        setShowEditCommentModal(false);
        setEditCommentForm({ comment: '' });
        setEditCommentId(null);
    };

    const handleOpenDeleteCommentModal = (commentId) => {
        setDeleteCommentId(commentId);
        setShowDeleteCommentModal(true);
    };

    const handleCloseDeleteCommentModal = () => {
        setShowDeleteCommentModal(false);
        setDeleteCommentId(null);
    };

    const validateEditForm = () => {
        const errors = {};
        if (!editForm.title) errors.title = 'Title is required';
        if (!editForm.content) errors.content = 'Content is required';
        setEditFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const validateEditCommentForm = () => {
        if (!editCommentForm.comment) {
            notyf.error('Comment text is required');
            return false;
        }
        return true;
    };

    const handleSubmitEdit = async (e) => {
        e.preventDefault();
        if (!validateEditForm()) {
            notyf.error('Please fix the errors in the form');
            return;
        }

        const success = await handleUpdatePost(post.id, editForm);
        if (success) handleCloseEditModal();
    };

    const handleSubmitDelete = async () => {
        const success = await handleDeletePost(post.id);
        if (success) handleCloseDeleteModal();
    };

    const handleSubmitEditComment = async (e) => {
        e.preventDefault();
        if (!validateEditCommentForm()) return;

        const success = await handleEditComment(post.id, editCommentId, editCommentForm.comment);
        if (success) handleCloseEditCommentModal();
    };

    const handleSubmitDeleteComment = async () => {
        const success = await handleDeleteComment(post.id, deleteCommentId);
        if (success) handleCloseDeleteCommentModal();
    };

    return (
        <Card className="mb-4">
            <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                    <Card.Title>{post.title}</Card.Title>
                    {(isAuthor || isAdmin) && (
                        <Dropdown>
                            <Dropdown.Toggle
                                variant="link"
                                id={`dropdown-${post.id}`}
                                className="text-muted p-0"
                                style={{ textDecoration: 'none' }}
                            >
                                <span style={{ fontSize: '1.5rem' }}>⋮</span>
                            </Dropdown.Toggle>
                            <Dropdown.Menu>
                                {isAuthor && (
                                    <Dropdown.Item onClick={handleOpenEditModal}>Edit</Dropdown.Item>
                                )}
                                {canDeletePost && (
                                    <Dropdown.Item onClick={handleOpenDeleteModal}>Delete</Dropdown.Item>
                                )}
                            </Dropdown.Menu>
                        </Dropdown>
                    )}
                </div>
                <Card.Subtitle className="mb-2 text-muted">
                    Posted by {post.author.name} on {formattedDate}
                </Card.Subtitle>
                <Card.Text>{post.content}</Card.Text>

                <hr />
                <h5>Comments</h5>
                <ListGroup className="mb-3">
                    {comments.length > 0 ? (
                        comments.map((comment) => {
                            // Check if the current user can delete the comment
                            const canDeleteComment = currentUsername && (comment.commenter === currentUsername || isAdmin);

                            return (
                                <ListGroup.Item key={comment.id} className="d-flex justify-content-between align-items-start">
                                    <div>
                                        <strong>{comment.commenter}</strong>: {comment.comment}
                                        <br />
                                        <small>
                                            {new Date(comment.commentedAt).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </small>
                                    </div>
                                    {canDeleteComment && (
                                        <Dropdown>
                                            <Dropdown.Toggle
                                                variant="link"
                                                id={`dropdown-comment-${comment.id}`}
                                                className="text-muted p-0"
                                                style={{ textDecoration: 'none' }}
                                            >
                                                <span style={{ fontSize: '1.2rem' }}>⋮</span>
                                            </Dropdown.Toggle>
                                            <Dropdown.Menu>
                                                <Dropdown.Item
                                                    onClick={() => handleOpenEditCommentModal(comment.id, comment.comment)}
                                                >
                                                    Edit
                                                </Dropdown.Item>
                                                <Dropdown.Item
                                                    onClick={() => handleOpenDeleteCommentModal(comment.id)}
                                                >
                                                    Delete
                                                </Dropdown.Item>
                                            </Dropdown.Menu>
                                        </Dropdown>
                                    )}
                                </ListGroup.Item>
                            );
                        })
                    ) : (
                        <ListGroup.Item>No comments yet.</ListGroup.Item>
                    )}
                </ListGroup>

                <Form>
                    <Form.Group controlId={`commentInput-${post.id}`}>
                        <Form.Control
                            type="text"
                            placeholder={isAuthenticated ? "Add a comment..." : "Log in to add a comment"}
                            value={newComment[post.id] || ''}
                            onChange={(e) =>
                                isAuthenticated && setNewComment({ ...newComment, [post.id]: e.target.value })
                            }
                            disabled={!isAuthenticated}
                        />
                    </Form.Group>
                    <Button
                        className="mt-2"
                        variant="primary"
                        onClick={() => handleAddComment(post.id)}
                        disabled={!isAuthenticated}
                    >
                        Submit
                    </Button>
                </Form>
            </Card.Body>

            {/* Edit and Delete Post Modals */}
            <Modal show={showEditModal} onHide={handleCloseEditModal}>
                <Modal.Header closeButton>
                    <Modal.Title>Edit Post</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleSubmitEdit}>
                        <Form.Group className="mb-3" controlId="editPostTitle">
                            <Form.Label>Title</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Enter post title"
                                value={editForm.title}
                                onChange={(e) =>
                                    setEditForm({ ...editForm, title: e.target.value })
                                }
                                isInvalid={!!editFormErrors.title}
                            />
                            <Form.Control.Feedback type="invalid">
                                {editFormErrors.title}
                            </Form.Control.Feedback>
                        </Form.Group>

                        <Form.Group className="mb-3" controlId="editPostContent">
                            <Form.Label>Content</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={5}
                                placeholder="Enter post content"
                                value={editForm.content}
                                onChange={(e) =>
                                    setEditForm({ ...editForm, content: e.target.value })
                                }
                                isInvalid={!!editFormErrors.content}
                            />
                            <Form.Control.Feedback type="invalid">
                                {editFormErrors.content}
                            </Form.Control.Feedback>
                        </Form.Group>

                        <Button
                            variant="primary"
                            type="submit"
                            className="w-100"
                            disabled={false}
                        >
                            Save Changes
                        </Button>
                    </Form>
                </Modal.Body>
            </Modal>

            {/* Delete Post Modal */}
            <Modal show={showDeleteModal} onHide={handleCloseDeleteModal}>
                <Modal.Header closeButton>
                    <Modal.Title>Confirm Deletion</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    Are you sure you want to delete the post "{post.title}"? This action cannot be undone.
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseDeleteModal}>
                        Cancel
                    </Button>
                    <Button variant="danger" onClick={handleSubmitDelete}>
                        Delete
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Edit Comment Modal */}
            <Modal show={showEditCommentModal} onHide={handleCloseEditCommentModal}>
                <Modal.Header closeButton>
                    <Modal.Title>Edit Comment</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleSubmitEditComment}>
                        <Form.Group className="mb-3" controlId="editComment">
                            <Form.Label>Comment</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                value={editCommentForm.comment}
                                onChange={(e) =>
                                    setEditCommentForm({ comment: e.target.value })
                                }
                            />
                        </Form.Group>

                        <Button variant="primary" type="submit" className="w-100">
                            Save Changes
                        </Button>
                    </Form>
                </Modal.Body>
            </Modal>

            {/* Delete Comment Modal */}
            <Modal show={showDeleteCommentModal} onHide={handleCloseDeleteCommentModal}>
                <Modal.Header closeButton>
                    <Modal.Title>Confirm Deletion</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    Are you sure you want to delete this comment? This action cannot be undone.
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseDeleteCommentModal}>
                        Cancel
                    </Button>
                    <Button variant="danger" onClick={handleSubmitDeleteComment}>
                        Delete
                    </Button>
                </Modal.Footer>
            </Modal>
        </Card>
    );
};

export default Post;
