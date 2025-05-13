import React, { useState } from 'react';
import { Container, Form, Button, Spinner, Card } from 'react-bootstrap';
import { Notyf } from 'notyf';
import 'notyf/notyf.min.css';

const RegisterPage = () => {
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const notyf = new Notyf({ duration: 3000, position: { x: 'right', y: 'top' } });

    // Real-time validation function
    const validateForm = (updatedField = {}, updatedValue = null) => {
        const newErrors = {};

        // Email validation
        if (!email) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        // Username validation
        if (!username) {
            newErrors.username = 'Username is required';
        } else if (username.length < 3) {
            newErrors.username = 'Username must be at least 3 characters long';
        }

        // Password validation
        if (!password) {
            newErrors.password = 'Password is required';
        } else if (password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters long';
        }

        // Confirm password validation
        const confirmValue = updatedField === 'confirmPassword' ? updatedValue : confirmPassword;
        if (!confirmValue) {
            newErrors.confirmPassword = 'Please confirm your password';
        } else if (confirmValue !== (updatedField === 'password' ? updatedValue : password)) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle input changes and validate in real-time
    const handleInputChange = (field, value) => {
        switch (field) {
            case 'email':
                setEmail(value);
                validateForm('email', value);
                break;
            case 'username':
                setUsername(value);
                validateForm('username', value);
                break;
            case 'password':
                setPassword(value);
                validateForm('password', value);
                break;
            case 'confirmPassword':
                setConfirmPassword(value);
                validateForm('confirmPassword', value);
                break;
            default:
                break;
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        if (!validateForm()) {
            notyf.error('Please fix the errors in the form');
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch('http://localhost:4000/users/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, username, password }),
            });

            const data = await response.json();

            if (response.ok) {
                notyf.success('Registration successful! Redirecting to login...');
                setTimeout(() => {
                    window.location.href = '/login';
                }, 1000);
            } else {
                notyf.error(data.message || 'Registration failed');
            }
        } catch (error) {
            notyf.error('Internal server error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
            {isLoading ? (
                <div className="text-center">
                    <Spinner animation="border" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </Spinner>
                    <p>Loading...</p>
                </div>
            ) : (
                <Card style={{ width: '100%', maxWidth: '400px' }} className="p-4">
                    <Card.Body>
                        <h2 className="text-center mb-4">Register</h2>
                        <Form onSubmit={handleRegister}>
                            <Form.Group className="mb-3" controlId="email">
                                <Form.Label>Email</Form.Label>
                                <Form.Control
                                    type="email"
                                    placeholder="Enter email"
                                    value={email}
                                    onChange={(e) => handleInputChange('email', e.target.value)}
                                    isInvalid={!!errors.email}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.email}
                                </Form.Control.Feedback>
                            </Form.Group>

                            <Form.Group className="mb-3" controlId="username">
                                <Form.Label>Username</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Enter username"
                                    value={username}
                                    onChange={(e) => handleInputChange('username', e.target.value)}
                                    isInvalid={!!errors.username}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.username}
                                </Form.Control.Feedback>
                            </Form.Group>

                            <Form.Group className="mb-3" controlId="password">
                                <Form.Label>Password</Form.Label>
                                <Form.Control
                                    type="password"
                                    placeholder="Enter password"
                                    value={password}
                                    onChange={(e) => handleInputChange('password', e.target.value)}
                                    isInvalid={!!errors.password}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.password}
                                </Form.Control.Feedback>
                            </Form.Group>

                            <Form.Group className="mb-3" controlId="confirmPassword">
                                <Form.Label>Confirm Password</Form.Label>
                                <Form.Control
                                    type="password"
                                    placeholder="Confirm password"
                                    value={confirmPassword}
                                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                                    isInvalid={!!errors.confirmPassword}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.confirmPassword}
                                </Form.Control.Feedback>
                            </Form.Group>

                            <Button variant="primary" type="submit" className="w-100" disabled={isLoading}>
                                Register
                            </Button>
                        </Form>
                        <div className="text-center mt-3">
                            <p>Already have an account? <a href="/login" className="text-primary">Login here</a></p>
                        </div>
                    </Card.Body>
                </Card>
            )}
        </Container>
    );
};

export default RegisterPage;