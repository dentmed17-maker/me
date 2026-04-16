import { useEffect } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/useAuthStore';
import { auth } from '../lib/firebase';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { Button } from './ui/button';
import { LogOut, Calendar, MessageCircle, Settings, Home, Globe } from 'lucide-react';

export function Layout() {
  const { t, i18n } = useTranslation();
  const { user, profile } = useAuthStore();
  const navigate = useNavigate();

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error(error);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'ar' ? 'fr' : 'ar';
    i18n.changeLanguage(newLang);
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = newLang;
  };

  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col">
      <header className="sticky top-0 z-50 bg-card border-b border-border h-20 flex items-center justify-between px-10">
        <Link to="/" className="font-serif italic text-2xl tracking-tight text-foreground">
          {t('app_name')}
        </Link>
        
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-2">
            <Home className="w-4 h-4" /> {t('home')}
          </Link>
          {user && (
            <>
              <Link to="/appointments" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-2">
                <Calendar className="w-4 h-4" /> {t('appointments')}
              </Link>
              <Link to="/chat" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-2">
                <MessageCircle className="w-4 h-4" /> {t('chat')}
              </Link>
            </>
          )}
          {profile?.role === 'admin' && (
            <Link to="/admin" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-2">
              <Settings className="w-4 h-4" /> {t('admin')}
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-4">
          <button onClick={toggleLanguage} className="text-xs uppercase tracking-widest font-semibold text-muted-foreground hover:text-foreground transition-colors">
            {i18n.language === 'ar' ? 'FR / AR' : 'AR / FR'}
          </button>
          {user ? (
            <Button variant="outline" size="sm" onClick={handleLogout} className="rounded-md gap-2 border-border">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">{t('logout')}</span>
            </Button>
          ) : (
            <Button size="sm" onClick={handleLogin} className="rounded-md bg-primary text-primary-foreground">
              {t('login')}
            </Button>
          )}
        </div>
      </header>

      {/* Mobile Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border flex justify-around p-3 z-50">
        <Link to="/" className="flex flex-col items-center text-muted-foreground hover:text-primary">
          <Home className="w-5 h-5" />
          <span className="text-[10px] mt-1 uppercase tracking-wider">{t('home')}</span>
        </Link>
        {user && (
          <>
            <Link to="/appointments" className="flex flex-col items-center text-muted-foreground hover:text-primary">
              <Calendar className="w-5 h-5" />
              <span className="text-[10px] mt-1 uppercase tracking-wider">{t('appointments')}</span>
            </Link>
            <Link to="/chat" className="flex flex-col items-center text-muted-foreground hover:text-primary">
              <MessageCircle className="w-5 h-5" />
              <span className="text-[10px] mt-1 uppercase tracking-wider">{t('chat')}</span>
            </Link>
          </>
        )}
        {profile?.role === 'admin' && (
          <Link to="/admin" className="flex flex-col items-center text-muted-foreground hover:text-primary">
            <Settings className="w-5 h-5" />
            <span className="text-[10px] mt-1 uppercase tracking-wider">{t('admin')}</span>
          </Link>
        )}
      </div>

      <main className="flex-1 max-w-6xl w-full mx-auto p-6 md:p-10 pb-24 md:pb-10">
        <Outlet />
      </main>
    </div>
  );
}
