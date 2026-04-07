import React, { createContext, useContext, useState } from 'react';
import api from '@/api/axiosConfig';

// 1. Define what a User looks like
interface User {
  name: string;
  role: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  role: string | null;
  user: User | null; // <-- ADDED: Now the whole app can see the user object!
  login: (email: string, password: string) => Promise<string>;
  signup: (name: string, email: string, phone: string, password: string) => Promise<boolean>;
  verifyOtp: (email: string, otp: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    !!localStorage.getItem('access_token')
  );
  
  const [role, setRole] = useState<string | null>(
    localStorage.getItem('user_role')
  ); 

  // 2. Initialize the user state from localStorage so it survives page refreshes!
  const [user, setUser] = useState<User | null>(() => {
    const savedName = localStorage.getItem('user_name');
    const savedRole = localStorage.getItem('user_role');
    if (savedName && savedRole) {
      return { name: savedName, role: savedRole };
    }
    return null;
  });

  const login = async (email: string, password: string): Promise<string> => {
    const response = await api.post('auth/login/', { email, password });
    
    // Fallbacks just in case your Django API uses 'full_name' or 'name' or 'first_name'
    const exactName = response.data.full_name || response.data.name || response.data.first_name || 'Landlord';

    localStorage.setItem('access_token', response.data.access);
    localStorage.setItem('refresh_token', response.data.refresh);
    localStorage.setItem('user_role', response.data.role); 
    localStorage.setItem('user_name', exactName); // <-- ADDED: Save name to hard drive
    
    // Update React state simultaneously so the router instantly knows!
    setRole(response.data.role); 
    setUser({ name: exactName, role: response.data.role }); // <-- ADDED: Update User state
    setIsAuthenticated(true);
    
    return response.data.role; 
  };

  const signup = async (name: string, email: string, phone: string, password: string): Promise<boolean> => {
    await api.post('auth/register/landlord/', {
      full_name: name,
      email: email,
      phone_number: phone,
      password: password,
      confirm_password: password
    });
    return true;
  };

  const verifyOtp = async (email: string, otp: string): Promise<boolean> => {
    await api.post('auth/verify-otp/', { email: email, otp_code: otp });
    return true;
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_name'); // <-- Clear it out on logout
    setRole(null); 
    setUser(null); // <-- Clear React state
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, role, user, login, signup, verifyOtp, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};