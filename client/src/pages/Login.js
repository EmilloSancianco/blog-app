import React, { useState } from 'react';
import { Container, Form, Button, Spinner, Card } from 'react-bootstrap';
import { Notyf } from 'notyf';
import 'notyf/notyf.min.css';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
    const [usernameOrEmail, setUsernameOrEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const notyf = new Notyf({ duration: 3000, position: { x: 'right', y: 'top' } });
    const navigate = useNavigate(); // Initialize useNavigate hook

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const body = password ? { password } : {};
            if (usernameOrEmail.includes('@')) {
                body.email = usernameOrEmail;
            } else {
                body.username = usernameOrEmail;
            }

            const response = await fetch('https://blog-app-3sr0.onrender.com/users/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('token', data.auth);
                notyf.success('Login successful!');
                
                // Check if the username or email is "admin" or "admin@mail.com"
                if (usernameOrEmail === 'admin' || usernameOrEmail === 'admin@mail.com') {
                    // Redirect to the admin page if the user is "admin"
                    navigate('/admin');
                } else {
                    // Redirect to the home page if the user is not "admin"
                    navigate('/');
                }
            } else {
                notyf.error(data.error || 'Login failed');
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
                        <h2 className="text-center mb-4">Login</h2>
                        <Form onSubmit={handleLogin}>
                            <Form.Group className="mb-3" controlId="usernameOrEmail">
                                <Form.Label>Username or Email</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Enter username or email"
                                    value={usernameOrEmail}
                                    onChange={(e) => setUsernameOrEmail(e.target.value)}
                                    required
                                />
                            </Form.Group>

                            <Form.Group className="mb-3" controlId="password">
                                <Form.Label>Password</Form.Label>
                                <Form.Control
                                    type="password"
                                    placeholder="Enter password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </Form.Group>

                            <Button variant="primary" type="submit" className="w-100" disabled={isLoading}>
                                Login
                            </Button>
                        </Form>
                        <div className="text-center mt-3">
                            <p>New user? <a href="/register" className="text-primary">Register here</a></p>
                        </div>
                    </Card.Body>
                </Card>
            )}
        </Container>
    );
};

export default LoginPage;
