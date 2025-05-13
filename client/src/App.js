import './App.css';
import { useState, useEffect } from 'react';
import { Container } from 'react-bootstrap';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { UserProvider } from './UserContext';

import LoginPage from './pages/Login';
import RegisterPage from './pages/RegisterPage';
import BlogPage from './pages/BlogPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';

function App() {
    const [user, setUser] = useState({
        id: null,
        isAdmin: null,
    });

    const unsetUser = () => {
        localStorage.clear();
        setUser({
            id: null,
            isAdmin: null,
        });
    };

    useEffect(() => {
        if (localStorage.getItem('token')) {
            fetch('http://localhost:4000/users/details', {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            })
                .then((res) => res.json())
                .then((data) => {
                    if (data._id) {
                        setUser({
                            id: data._id,
                            isAdmin: data.isAdmin,
                        });
                    }
                });
        }
    }, []);

    return (
        <UserProvider value={{ user, setUser, unsetUser }}>
            <Router>
                <Container>
                    <Routes>
                        {/* Redirect root path to blog for now */}
                        <Route path="/" element={<Navigate to="/blog" />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/register" element={<RegisterPage />} />
                        <Route path="/profile" element={<ProfilePage />} />
                        <Route path="/blog" element={<BlogPage />} />
                        {/* Admin is accessible to anyone for now */}
                        <Route path="/admin" element={<AdminPage />} />
                    </Routes>
                </Container>
            </Router>
        </UserProvider>
    );
}

export default App;
