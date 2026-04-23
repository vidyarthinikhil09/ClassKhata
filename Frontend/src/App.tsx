import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import Login from './screens/Login';
import Dashboard from './screens/Dashboard';
import Profile from './screens/Profile'; // Student profile
import TeacherProfile from './screens/TeacherProfile';
import Reports from './screens/Reports';
import Roster from './screens/Roster';
import Signup from './screens/Signup';
import { ThemeProvider } from './components/ThemeProvider';
import { Toaster } from 'sonner';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState(() => {
    // When React wakes up, check if the user is already authenticated
    const isAuth = localStorage.getItem('ck_auth');
    return isAuth === 'true' ? 'dashboard' : 'login';
  }); 
  
  const [transitionType, setTransitionType] = useState('none');

  // 🗑️ Delete that extra useState block that was sitting right here! 🗑️

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
      transition: { duration: 0.3, ease: 'easeOut' }
    },
    exit: (type: string) => ({
      x: type === 'push' ? '-20%' : type === 'push_back' ? '100%' : 0,
      opacity: type === 'none' ? 0.9 : 0.8,
      transition: { duration: 0.3, ease: 'easeIn' }
    })
  };

  return (
    <ThemeProvider defaultTheme="light" storageKey="ck_theme">
      <div className="relative w-full h-full min-h-screen overflow-hidden bg-background/0 text-on-surface font-body max-w-[480px] mx-auto shadow-2xl xl:border-x border-outline-variant/30">
        <AnimatePresence custom={transitionType}>
          <motion.div
            key={currentScreen}
            custom={transitionType}
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-full h-full absolute inset-0 overflow-y-auto overflow-x-hidden bg-background/80"
          >
            {currentScreen === 'login' && <Login navigate={navigate} />}
            {currentScreen === 'signup' && <Signup navigate={navigate} />}
            {currentScreen === 'dashboard' && <Dashboard navigate={navigate} />}
            {currentScreen === 'profile' && <Profile navigate={navigate} />}
            {currentScreen === 'teacher_profile' && <TeacherProfile navigate={navigate} />}
            {currentScreen === 'reports' && <Reports navigate={navigate} />}
            {currentScreen === 'roster' && <Roster navigate={navigate} />}
          </motion.div>
        </AnimatePresence>
        <Toaster position="top-center" richColors theme="system" />
      </div>
    </ThemeProvider>
  );
}
