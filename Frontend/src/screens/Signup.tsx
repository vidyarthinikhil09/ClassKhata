import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { api } from '../lib/api';

export default function Signup({ navigate }: { navigate: (screen: string, type: string) => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      await api.register({ name, email, password });
      localStorage.setItem('ck_auth', 'true');
      navigate('dashboard', 'push');
    } catch (err) {
      setError('Signup failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-transparent min-h-[100dvh] flex items-center justify-center p-4">
      <Card className="w-full max-w-sm border-outline-variant/30 shadow-sm border bg-white/95 dark:bg-[#191c1d]/95 backdrop-blur-xl">
        <CardHeader className="text-center pt-8 pb-4">
          <div className="mx-auto w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-primary-foreground mb-4">
            <span className="material-symbols-outlined font-light text-[24px]">school</span>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-1 opacity-80 text-primary">CLASSKHATA</p>
          <CardTitle className="text-2xl font-bold tracking-tight">Create Account</CardTitle>
          <CardDescription>Join ClassKhata to manage your students securely.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSignup} autoComplete="off">
            {error && <div className="text-destructive text-xs font-bold bg-error/10 p-2 rounded text-center">{error}</div>}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-1" htmlFor="name">Full Name</label>
              <Input 
                className="bg-muted/50 border-0 focus-visible:ring-primary/20 h-10 transition-all text-sm" 
                id="name" name="name" placeholder="Enter Full Name" 
                value={name}
                onChange={e => setName(e.target.value)}
                autoComplete="off"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-1" htmlFor="email">Email</label>
              <Input 
                className="bg-muted/50 border-0 focus-visible:ring-primary/20 h-10 transition-all text-sm" 
                id="email" name="email" placeholder="Enter your Email" type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="off"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-1" htmlFor="password">Password</label>
              <Input 
                className="bg-muted/50 border-0 focus-visible:ring-primary/20 h-10 transition-all text-sm" 
                id="password" name="password" placeholder="Enter the password" type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            <Button className="w-full mt-2 font-bold transition-all active:scale-[0.98]" type="submit" disabled={loading}>
              {loading ? 'Creating Account...' : 'Sign Up'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center pb-8 pt-2">
          <p className="text-xs text-muted-foreground">
            Already have an account?
            <a onClick={() => navigate('login', 'push_back')} className="text-primary font-bold ml-1 hover:underline underline-offset-4 cursor-pointer">Log in</a>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
