import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const SessionTimeout = () => {
    const navigate = useNavigate();
    let timeoutId;

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        alert("Session expired due to inactivity.");
        navigate('/login');
    };

    const resetTimer = () => {
        clearTimeout(timeoutId);
        // 30 minutes in milliseconds
        timeoutId = setTimeout(handleLogout, 30 * 60 * 1000); 
    };

    useEffect(() => {
        const events = ['mousemove', 'keydown', 'click', 'scroll'];
        
        events.forEach(event => window.addEventListener(event, resetTimer));
        resetTimer(); // Start the timer on load

        return () => {
            events.forEach(event => window.removeEventListener(event, resetTimer));
            clearTimeout(timeoutId);
        };
    }, []);

    return null; // This component runs invisibly in the background
};

export default SessionTimeout;