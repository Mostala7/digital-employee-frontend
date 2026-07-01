import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tempPassword, setTempPassword] = useState("");

  useEffect(() => {
    // When the app loads, check if we have a saved user in localStorage
    const savedUser = localStorage.getItem("currentUser");
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = (userData, token) => {
    setCurrentUser(userData);
    localStorage.setItem("currentUser", JSON.stringify(userData));
    localStorage.setItem("authToken", token);
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem("currentUser");
    localStorage.removeItem("authToken");
  };

  const value = {
    currentUser,
    login,
    logout,
    tempPassword,
    setTempPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
