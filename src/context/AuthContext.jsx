import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import { auth } from "../firebase-config";
import { getUserProfile } from "../services/userServices";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        const fetchedProfile = await getUserProfile(currentUser.uid);
        setProfile(fetchedProfile);
        setRole(fetchedProfile?.role ?? "customer");
      } else {
        setProfile(null);
        setRole(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  function logout() {
    return firebaseSignOut(auth);
  }

  async function refreshProfile() {
    if (!auth.currentUser) return;
    setProfile(await getUserProfile(auth.currentUser.uid));
  }

  const value = {
    user,
    profile,
    role,
    loading,
    logout,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}