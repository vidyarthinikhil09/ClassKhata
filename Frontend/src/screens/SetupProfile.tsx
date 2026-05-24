import { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { api } from '../lib/api';
import { toast } from 'sonner';

export default function SetupProfile({ navigate }: { navigate: (screen: string, type: string) => void }) {
  const [instituteName, setInstituteName] = useState('');
  const [loading, setLoading] = useState(false);
  const teacherName = localStorage.getItem('ck_teacher_name') || 'Teacher';

  const handleSave = async () => {
    const trimmed = instituteName.trim();
    if (!trimmed) {
      toast.error("Please enter your institute name to continue");
      return;
    }
    setLoading(true);
    try {
      await api.updateTeacherProfile({ instituteName: trimmed });
      localStorage.setItem('ck_institute_name', trimmed);
      navigate('dashboard', 'push');
    } catch {
      toast.error("Failed to save. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-6 bg-background">
      {/* Decorative top strip */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-primary" />

      <div className="w-full max-w-sm space-y-8">
        {/* Icon + Brand */}
        <div className="text-center space-y-3">
          <div className="mx-auto w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-primary-foreground shadow-lg">
            <span className="material-symbols-outlined text-[32px]">domain</span>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-1">CLASSKHATA</p>
            <h1 className="font-headline text-2xl font-black text-foreground tracking-tight">One last step</h1>
            <p className="text-sm text-muted-foreground font-medium mt-1">
              Add your coaching institute name to personalise receipts and reminders sent to parents.
            </p>
          </div>
        </div>

        {/* Greeting */}
        <div className="bg-primary/5 border border-primary/15 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-headline text-sm font-black border border-primary/20 shrink-0">
            {teacherName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="text-xs font-bold text-foreground">Welcome, {teacherName.split(' ')[0]}!</p>
            <p className="text-[11px] text-muted-foreground font-medium">Your institute name will appear on every payment receipt.</p>
          </div>
        </div>

        {/* Input */}
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Coaching Institute Name <span className="text-destructive">*</span>
            </label>
            <Input
              value={instituteName}
              onChange={e => setInstituteName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              placeholder="e.g. Sharma Classes, Excel Academy..."
              className="h-14 text-base font-bold bg-surface-container-lowest border-outline-variant focus-visible:ring-primary/20 rounded-xl px-4"
              autoFocus
            />
            <p className="text-[10px] text-muted-foreground font-medium px-1">
              This is shown on receipts in place of "ClassKhata", with a small "Powered by ClassKhata" tag.
            </p>
          </div>

          {/* Preview chip */}
          {instituteName.trim() && (
            <div className="border border-outline-variant/50 rounded-xl p-3 bg-surface-container-lowest space-y-1">
              <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Receipt preview</p>
              <p className="text-sm font-black text-primary">{instituteName.trim()}</p>
              <p className="text-[9px] text-muted-foreground">Powered by ClassKhata</p>
            </div>
          )}

          <Button
            onClick={handleSave}
            disabled={loading || !instituteName.trim()}
            className="w-full h-13 text-base font-bold bg-primary text-primary-foreground rounded-xl shadow-md disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save & Continue'}
          </Button>
        </div>

        <p className="text-center text-[10px] text-muted-foreground font-medium">
          You can update this anytime from your Profile settings.
        </p>
      </div>
    </div>
  );
}
