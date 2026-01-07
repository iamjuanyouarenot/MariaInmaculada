import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));

    useEffect(() => {
        if (token) {
            // You might want to decode token or just assume logged in for this demo
            setUser({ username: localStorage.getItem('username') });
        }
    }, [token]);

    const login = (newToken, username) => {
        setToken(newToken);
        setUser({ username });
        localStorage.setItem('token', newToken);
        localStorage.setItem('username', username);
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('username');
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
