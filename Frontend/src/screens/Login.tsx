import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { api } from '../lib/api'; // 1. Reverted to importing the 'api' object

export default function Login({ navigate }: { navigate: (screen: string, type: string) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in both fields');
      return;
    }
    
    setLoading(true);
    setError(''); // Clear previous errors on new attempt

    try {
      // 1. You MUST assign the API call to a variable named 'response'
      const response = await api.login(email, password);
      
      // 2. Extract the name (Checking both common Axios response structures to be safe)
      const teacherName = response?.user?.name || response?.data?.user?.name || 'Teacher';
      
      // 3. Save it to LocalStorage
      localStorage.setItem('ck_teacher_name', teacherName); 

      localStorage.setItem('ck_auth', 'true');
      
      navigate('dashboard', 'push');
      
    } catch (err: any) {
      // 3. Dynamic error handling from Axios/Express
      const serverMessage = err.response?.data?.message || 'Login failed. Please check your network and try again.';
      setError(serverMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-transparent min-h-[100dvh] flex items-center justify-center p-4">
      {/* Transactional Shell: Navigation suppressed for focus */}
      <Card className="w-full max-w-sm border-outline-variant/30 shadow-sm border bg-white/95 dark:bg-[#191c1d]/95 backdrop-blur-xl">
        <CardHeader className="text-center pt-8 pb-4">
          <div className="mx-auto w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-primary-foreground mb-4">
            <span className="material-symbols-outlined font-light text-[24px]">school</span>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-1 opacity-80 text-primary">CLASSKHATA</p>
          <CardTitle className="text-2xl font-bold tracking-tight">Welcome back</CardTitle>
          <CardDescription>Log in to manage your students.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleLogin}>
            {error && <div className="text-destructive text-xs font-bold bg-error/10 p-2 rounded text-center">{error}</div>}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-1" htmlFor="email">Email</label>
              <Input 
                className="bg-muted/50 border-0 focus-visible:ring-primary/20 h-10 transition-all text-sm" 
                id="email" name="email" placeholder="Enter your Email" type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between items-center px-1">
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="password">Password</label>
                {/* <a className="text-[10px] font-bold text-primary hover:underline transition-all" href="#">Forgot?</a> */}
              </div>
              <Input 
                className="bg-muted/50 border-0 focus-visible:ring-primary/20 h-10 transition-all text-sm" 
                id="password" name="password" placeholder="Enter your password" type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
            <Button className="w-full mt-2 font-bold transition-all active:scale-[0.98]" type="submit" disabled={loading}>
              {loading ? 'Logging in...' : 'Log In'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center pb-8 pt-2">
          <p className="text-xs text-muted-foreground">
            New to CLASSKHATA?
            <a onClick={() => navigate('signup', 'push')} className="cursor-pointer text-primary font-bold ml-1 hover:underline underline-offset-4">Sign up</a>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}