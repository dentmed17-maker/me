import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './lib/firebase';
import { useAuthStore } from './store/useAuthStore';
import { Layout } from './components/Layout';
import Home from './pages/Home';
import Appointments from './pages/Appointments';
import Chat from './pages/Chat';
import Admin from './pages/Admin';
import './i18n';

export default function App() {
  const { setUser, fetchProfile, isAuthReady } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        await fetchProfile(user.uid);
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, [setUser, fetchProfile]);

  if (!isAuthReady) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="appointments" element={<Appointments />} />
          <Route path="chat" element={<Chat />} />
          <Route path="admin" element={<Admin />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
