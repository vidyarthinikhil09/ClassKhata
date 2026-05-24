import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import Login from './screens/Login';
import Dashboard from './screens/Dashboard';
import Profile from './screens/Profile';
import TeacherProfile from './screens/TeacherProfile';
import Reports from './screens/Reports';
import Roster from './screens/Roster';
import Signup from './screens/Signup';
import ForgotPassword from './screens/ForgotPassword';
import ResetPassword from './screens/ResetPassword';
import SetupProfile from './screens/SetupProfile';
import { ThemeProvider } from './components/ThemeProvider';
import { Toaster } from 'sonner';
import { api } from './lib/api';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('token')) return 'reset_password';
    const isAuth = localStorage.getItem('ck_auth');
    if (isAuth !== 'true') return 'login';
    const hasInstitute = localStorage.getItem('ck_institute_name');
    return hasInstitute ? 'dashboard' : 'setup_profile';
  });

  const [transitionType, setTransitionType] = useState('none');

  // OTA update detection
  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW({
    onRegistered(r) { console.log('SW registered:', r?.scope); },
    onRegisterError(error) { console.error('SW registration error:', error); }
  });

  useEffect(() => {
    if (localStorage.getItem('ck_auth') === 'true') {
      api.checkAuth().then((data) => {
        if (data?.name) localStorage.setItem('ck_teacher_name', data.name);
        if (data?.instituteName) {
          localStorage.setItem('ck_institute_name', data.instituteName);
        } else {
          localStorage.removeItem('ck_institute_name');
          setCurrentScreen('setup_profile');
        }
      }).catch(() => {
        localStorage.removeItem('ck_auth');
        localStorage.removeItem('ck_teacher_name');
        localStorage.removeItem('ck_institute_name');
        setCurrentScreen('login');
      });
    }
  }, []);

  const navigate = (screen: string, type: string) => {
    setTransitionType(type);
    setCurrentScreen(screen);
  };

  const variants = {
    initial: (type: string) => ({
      x: type === 'push' ? '100%' : type === 'push_back' ? '-100%' : 0,
      opacity: type === 'none' ? 0.9 : 1
    }),
    animate: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.3, ease: 'easeOut' as const }
    },
    exit: (type: string) => ({
      x: type === 'push' ? '-20%' : type === 'push_back' ? '100%' : 0,
      opacity: type === 'none' ? 0.9 : 0.8,
      transition: { duration: 0.3, ease: 'easeIn' as const }
    })
  };

  return (
    <ThemeProvider defaultTheme="light" storageKey="ck_theme">
      <div className="relative w-full h-full min-h-screen overflow-hidden bg-background/0 text-on-surface font-body max-w-120 mx-auto shadow-2xl xl:border-x border-outline-variant/30">
        {/* OTA Update Banner */}
        {needRefresh && (
          <div className="fixed top-0 left-0 right-0 z-200 flex items-center justify-between gap-3 bg-primary text-primary-foreground px-4 py-3 shadow-lg">
            <div className="flex items-center gap-2 min-w-0">
              <span className="material-symbols-outlined text-[18px] shrink-0">system_update</span>
              <p className="text-xs font-bold truncate">New version available!</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => updateServiceWorker(true)}
                className="text-[10px] font-black uppercase tracking-wider bg-white text-primary px-3 py-1.5 rounded-lg hover:bg-white/90 transition-colors"
              >
                Update
              </button>
            </div>
          </div>
        )}

        <AnimatePresence custom={transitionType}>
          <motion.div
            key={currentScreen}
            custom={transitionType}
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-full h-full absolute inset-0 overflow-y-auto overflow-x-hidden bg-background/80"
            style={{ paddingTop: needRefresh ? '52px' : undefined }}
          >
            {currentScreen === 'login' && <Login navigate={navigate} />}
            {currentScreen === 'signup' && <Signup navigate={navigate} />}
            {currentScreen === 'dashboard' && <Dashboard navigate={navigate} />}
            {currentScreen === 'profile' && <Profile navigate={navigate} />}
            {currentScreen === 'teacher_profile' && <TeacherProfile navigate={navigate} />}
            {currentScreen === 'reports' && <Reports navigate={navigate} />}
            {currentScreen === 'roster' && <Roster navigate={navigate} />}
            {currentScreen === 'forgot_password' && <ForgotPassword navigate={navigate} />}
            {currentScreen === 'reset_password' && <ResetPassword navigate={navigate} />}
            {currentScreen === 'setup_profile' && <SetupProfile navigate={navigate} />}
          </motion.div>
        </AnimatePresence>
        <Toaster position="top-center" richColors theme="system" />
      </div>
    </ThemeProvider>
  );
}
