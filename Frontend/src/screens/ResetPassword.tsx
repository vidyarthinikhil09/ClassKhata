import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { api } from '../lib/api';

export default function ResetPassword({ navigate }: { navigate: (screen: string, type: string) => void }) {
  const token = new URLSearchParams(window.location.search).get('token') || '';
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (newPassword !== confirm) { setError('Passwords do not match'); return; }
    if (!token) { setError('Invalid or missing reset token. Use the link from your email.'); return; }

    setLoading(true);
    setError('');
    try {
      await api.resetPassword(token, newPassword);
      setDone(true);
      // Clear the token from the URL without reloading
      window.history.replaceState({}, '', window.location.pathname);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Reset failed. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-transparent min-h-dvh flex items-center justify-center p-4">
      <Card className="w-full max-w-sm border-outline-variant/30 shadow-sm border bg-white/95 dark:bg-[#191c1d]/95 backdrop-blur-xl">
        <CardHeader className="text-center pt-8 pb-4">
          <div className="mx-auto w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-primary-foreground mb-4">
            <span className="material-symbols-outlined font-light text-[24px]">lock</span>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-1 opacity-80 text-primary">CLASSKHATA</p>
          <CardTitle className="text-2xl font-bold tracking-tight">Reset Password</CardTitle>
          <CardDescription>Enter your new password below.</CardDescription>
        </CardHeader>
        <CardContent>
          {done ? (
            <div className="text-center space-y-3 py-4">
              <span className="material-symbols-outlined text-green-500 text-[48px]">check_circle</span>
              <p className="font-bold text-sm text-foreground">Password reset successfully!</p>
              <Button onClick={() => navigate('login', 'push_back')} className="w-full font-bold mt-2">Go to Login</Button>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              {error && <div className="text-destructive text-xs font-bold bg-destructive/10 p-2 rounded text-center">{error}</div>}
              {!token && (
                <div className="text-amber-700 text-xs font-bold bg-amber-50 border border-amber-200 p-2 rounded text-center">
                  No reset token found. Please use the link from your email.
                </div>
              )}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-1" htmlFor="new-pass">New Password</label>
                <Input
                  id="new-pass"
                  type="password"
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="bg-muted/50 border-0 focus-visible:ring-primary/20 h-10 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-1" htmlFor="confirm-pass">Confirm Password</label>
                <Input
                  id="confirm-pass"
                  type="password"
                  placeholder="Repeat your password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  className="bg-muted/50 border-0 focus-visible:ring-primary/20 h-10 text-sm"
                />
              </div>
              <Button className="w-full mt-2 font-bold" type="submit" disabled={loading || !token}>
                {loading ? 'Resetting...' : 'Reset Password'}
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="flex justify-center pb-8 pt-2">
          <p className="text-xs text-muted-foreground">
            <a onClick={() => navigate('login', 'push_back')} className="cursor-pointer text-primary font-bold hover:underline underline-offset-4">Back to Login</a>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
