// frontend/src/App.jsx
import React, { useState, useEffect } from 'react';
import { auth } from './firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth'; // signOut is not needed here anymore for admin check
import LoginPage from './components/LoginPage';
import DashboardPage from './components/DashboardPage';

// const ADMIN_EMAIL = ""; // This check will now be in DashboardPage or backend

function App() {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser); // Allow any authenticated user
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  if (loadingAuth) {
    return <div className="min-h-screen flex items-center justify-center"><p>Loading authentication...</p></div>;
  }

  return (
    <div>
      {/* Pass the user object to DashboardPage so it can determine if admin */}
      {user ? <DashboardPage currentUser={user} /> : <LoginPage />}
    </div>
  );
}

export default App;