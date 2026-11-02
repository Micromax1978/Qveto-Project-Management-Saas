import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Storage, initStorage, resetStorage } from '../services/storage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [activeWorkspaceId, setActiveWorkspaceIdState] = useState('ws_eng');
  const [isLoaded, setIsLoaded] = useState(false);

  const refreshAuth = useCallback(() => {
    initStorage();
    const storedUser = Storage.getCurrentUser();
    const storedOrg = Storage.getOrganization();
    const storedUsers = Storage.getUsers();
    const storedTeams = Storage.getTeams();
    const storedWsId = Storage.getActiveWorkspaceId();

    setCurrentUser(storedUser);
    setOrganization(storedOrg);
    setUsers(storedUsers);
    setTeams(storedTeams);
    setActiveWorkspaceIdState(storedWsId);
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  const switchUser = (userId) => {
    const target = users.find((u) => u.id === userId);
    if (target) {
      Storage.setCurrentUser(target);
      setCurrentUser(target);
    }
  };

  const switchWorkspace = (wsId) => {
    Storage.setActiveWorkspaceId(wsId);
    setActiveWorkspaceIdState(wsId);
  };

  const updateOrganization = (updates) => {
    const updated = { ...organization, ...updates };
    Storage.setOrganization(updated);
    setOrganization(updated);
  };

  const logout = () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('organizationId');
    } catch (e) {
      // ignore
    }
    Storage.setCurrentUser(null);
    setCurrentUser(null);
  };

  const loginAs = (user) => {
    Storage.setCurrentUser(user);
    setCurrentUser(user);
  };

  const handleResetData = () => {
    resetStorage();
    refreshAuth();
  };

  const activeWorkspace = organization?.workspaces?.find(
    (w) => w.id === activeWorkspaceId
  ) || organization?.workspaces?.[0] || null;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        organization,
        users,
        teams,
        activeWorkspace,
        activeWorkspaceId,
        isLoaded,
        switchUser,
        switchWorkspace,
        updateOrganization,
        logout,
        loginAs,
        refreshAuth,
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
