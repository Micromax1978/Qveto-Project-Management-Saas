import React, { createContext, useContext, useState, useEffect } from 'react';
import { Storage, initStorage, resetStorage } from '../services/storage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [users, setUsers] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    initStorage();
    setCurrentUser(Storage.getCurrentUser());
    setOrganization(Storage.getOrganization());
    setUsers(Storage.getUsers());
    setIsLoaded(true);
  }, []);

  const switchUser = (userId) => {
    const target = users.find((u) => u.id === userId);
    if (target) {
      Storage.setCurrentUser(target);
      setCurrentUser(target);
    }
  };

  const handleResetData = () => {
    resetStorage();
    setCurrentUser(Storage.getCurrentUser());
    setOrganization(Storage.getOrganization());
    setUsers(Storage.getUsers());
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        organization,
        users,
        isLoaded,
        switchUser,
        resetData: handleResetData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
