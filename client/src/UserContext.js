import React, { createContext, useState } from 'react';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState({
        token: localStorage.getItem('token') || null,
        isAdmin: localStorage.getItem('isAdmin') === 'true' || false, // You can store the isAdmin flag in localStorage
    });

    return (
        <UserContext.Provider value={{ user, setUser }}>
            {children}
        </UserContext.Provider>
    );
};

export default UserContext;
