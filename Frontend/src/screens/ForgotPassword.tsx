import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { api } from '../lib/api';

export default function ForgotPassword({ navigate }: { navigate: (screen: string, type: string) => void }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setError('Please enter your email'); return; }
    setLoading(true);
    setError('');
    try {
      await api.forgotPassword(email);
      setSent(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-transparent min-h-dvh flex items-center justify-center p-4">
      <Card className="w-full max-w-sm border-outline-variant/30 shadow-sm border bg-white/95 dark:bg-[#191c1d]/95 backdrop-blur-xl">
        <CardHeader className="text-center pt-8 pb-4">
          <div className="mx-auto w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-primary-foreground mb-4">
            <span className="material-symbols-outlined font-light text-[24px]">lock_reset</span>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-1 opacity-80 text-primary">CLASSKHATA</p>
          <CardTitle className="text-2xl font-bold tracking-tight">Forgot Password</CardTitle>
          <CardDescription>Enter your email to receive a reset link.</CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="text-center space-y-3 py-4">
              <span className="material-symbols-outlined text-green-500 text-[48px]">mark_email_read</span>
              <p className="font-bold text-sm text-foreground">Reset link sent!</p>
              <p className="text-xs text-muted-foreground">Check your email and follow the link to reset your password. If SMTP isn't configured, the link is printed in the server console.</p>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              {error && <div className="text-destructive text-xs font-bold bg-destructive/10 p-2 rounded text-center">{error}</div>}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-1" htmlFor="fp-email">Email</label>
                <Input
                  id="fp-email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="bg-muted/50 border-0 focus-visible:ring-primary/20 h-10 text-sm"
                />
              </div>
              <Button className="w-full mt-2 font-bold" type="submit" disabled={loading}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="flex justify-center pb-8 pt-2">
          <p className="text-xs text-muted-foreground">
            Remember your password?
            <a onClick={() => navigate('login', 'push_back')} className="cursor-pointer text-primary font-bold ml-1 hover:underline underline-offset-4">Log in</a>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
