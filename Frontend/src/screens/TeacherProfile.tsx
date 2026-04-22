import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { api } from "../lib/api";
import { TeacherProfile as TeacherType } from "../lib/store";
import { useEffect, useState } from "react";
import { useTheme } from "../components/ThemeProvider";

export default function TeacherProfile({ navigate }: { navigate: (screen: string, type: string) => void }) {
  const [teacher, setTeacher] = useState<TeacherType | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isViewProfileOpen, setIsViewProfileOpen] = useState(false);
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    api.getTeacherProfile().then(data => {
      setTeacher(data);
      setEditName(data.name);
      setEditEmail(data.email);
    });
  }, []);

  const handleSave = async () => {
    const newErrors: Record<string, string> = {};
    if (!editName.trim()) newErrors.name = "Name is required";
    if (!editEmail.trim()) newErrors.email = "Email is required";
    else if (!editEmail.includes('@')) newErrors.email = "Enter a valid email";

    if (Object.keys(newErrors).length > 0) {
      setProfileErrors(newErrors);
      return;
    }

    if (teacher) {
      try {
        // We wrap this in a try/catch so it stops failing silently!
        const updated = await api.updateTeacherProfile({ name: editName, email: editEmail });
        setTeacher(updated);
        setIsEditing(false);
        setProfileErrors({});
        toast.success("Profile updated successfully!");
      } catch (error: any) {
        // This will pop up a red notification telling us exactly what the backend didn't like
        const errorMsg = error.response?.data?.message || "Check your network or backend server.";
        toast.error("Update Failed: " + errorMsg);
        console.error("Full error:", error);
      }
    }
  };

  if (!teacher) return null;
  return (
    <div className="min-h-[100dvh] pb-24">
      {/* TopAppBar */}
      <header className="bg-white/70 dark:bg-background/80 backdrop-blur-2xl sticky top-0 z-40 border-b border-outline-variant/30 shadow-[0_4px_16px_rgba(0,0,0,0.02)]">
        <div className="flex justify-between items-center w-full px-4 py-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary rounded-lg flex items-center justify-center text-primary-foreground shadow-sm">
              <span className="material-symbols-outlined font-light text-[14px]">school</span>
            </div>
            <h1 className="font-headline text-base font-black text-primary dark:text-white uppercase tracking-widest">CLASSKHATA</h1>
          </div>
          <div className="flex items-center gap-3">
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 pt-5 space-y-4">
        <div>
          <h2 className="font-headline text-2xl font-extrabold tracking-tight text-primary">Profile</h2>
        </div>
      </main>


      <main className="max-w-3xl mx-auto px-4 pt-8 space-y-8">
        {/* User Card */}
        <div className="flex flex-col md:flex-row items-center gap-6 bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-headline text-xs font-black border border-primary/20 shadow-sm shrink-0">
            {(localStorage.getItem('ck_teacher_name') || 'OP').split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
          </div>
          <div className="text-center md:text-left z-10">
            <h2 className="text-2xl font-headline font-extrabold text-foreground tracking-tight">{teacher.name}</h2>
            <p className="text-sm text-primary font-bold uppercase tracking-wider mt-1">{teacher.role}</p>
            <p className="text-xs text-muted-foreground mt-2 font-medium flex items-center justify-center md:justify-start gap-1">
              <span className="material-symbols-outlined text-[14px]">mail</span>
              {teacher.email}
            </p>
          </div>
          <div className="md:ml-auto w-full md:w-auto z-10">
            <Button onClick={() => setIsEditing(true)} variant="outline" className="w-full md:w-auto rounded-xl border-outline-variant font-bold text-xs h-10 shadow-sm flex items-center gap-2 hover:bg-surface-container-high transition-colors text-foreground">
              <span className="material-symbols-outlined text-[16px]">edit</span>
              Edit Profile
            </Button>
          </div>
        </div>

        <section className="space-y-3">
          <h3 className="font-label text-xs font-bold uppercase text-muted-foreground tracking-widest pl-1">Personal & App Settings</h3>
          <Card className="bg-surface-container-lowest rounded-2xl border-outline-variant overflow-hidden p-0 shadow-sm">
            <div onClick={() => setIsViewProfileOpen(true)} className="flex items-center justify-between p-4 px-5 border-b border-surface-container-high hover:bg-surface-container-low transition-colors cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                  <span className="material-symbols-outlined text-[20px]">person</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-foreground">Personal Information</span>
                  <span className="text-xs text-muted-foreground font-medium">Update your details & contacts</span>
                </div>
              </div>
              <span className="material-symbols-outlined text-muted-foreground">chevron_right</span>
            </div>
            <div onClick={() => setIsThemeOpen(true)} className="flex items-center justify-between p-4 px-5 hover:bg-surface-container-low transition-colors cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                  <span className="material-symbols-outlined text-[20px]">palette</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-foreground">Theme</span>
                  <span className="text-xs text-muted-foreground font-medium capitalize">{theme} Mode</span>
                </div>
              </div>
              <span className="material-symbols-outlined text-muted-foreground">chevron_right</span>
            </div>
          </Card>
        </section>

        {/* Theme Settings Dialog */}
        <Dialog open={isThemeOpen} onOpenChange={setIsThemeOpen}>
          <DialogContent className="sm:max-w-[320px] w-[80vw] rounded-3xl p-6 bg-background border-none shadow-2xl">
            <DialogHeader>
              <DialogTitle className="font-headline text-xl font-black text-primary">App Theme</DialogTitle>
              <DialogDescription className="text-xs font-medium">Select your preferred visual style.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-4">
              <Button onClick={() => { setTheme('light'); setIsThemeOpen(false); }} variant={theme === 'light' ? 'default' : 'outline'} className="w-full justify-start text-left font-bold gap-3 h-12 rounded-xl">
                <span className="material-symbols-outlined">light_mode</span> Light Mode
              </Button>
              <Button onClick={() => { setTheme('dark'); setIsThemeOpen(false); }} variant={theme === 'dark' ? 'default' : 'outline'} className="w-full justify-start text-left font-bold gap-3 h-12 rounded-xl">
                <span className="material-symbols-outlined">dark_mode</span> Dark Mode
              </Button>
              <Button onClick={() => { setTheme('system'); setIsThemeOpen(false); }} variant={theme === 'system' ? 'default' : 'outline'} className="w-full justify-start text-left font-bold gap-3 h-12 rounded-xl">
                <span className="material-symbols-outlined">settings_suggest</span> System Default
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Profile Dialog */}
        <Dialog open={isViewProfileOpen} onOpenChange={setIsViewProfileOpen}>
          <DialogContent className="sm:max-w-[360px] w-[90vw] rounded-3xl p-6 bg-background border-none shadow-2xl">
            <DialogHeader>
              <DialogTitle className="font-headline text-xl font-black text-primary">Personal Details</DialogTitle>
              <DialogDescription className="text-xs font-medium">
                Your current account information.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4 p-3 bg-surface-container-lowest rounded-xl border border-outline-variant/50">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                  <span className="material-symbols-outlined text-[20px]">badge</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-0.5">Full Name</span>
                  <p className="text-sm font-bold text-foreground">{teacher.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-3 bg-surface-container-lowest rounded-xl border border-outline-variant/50">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                  <span className="material-symbols-outlined text-[20px]">mail</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-0.5">Email Address</span>
                  <p className="text-sm font-bold text-foreground">{teacher.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-3 bg-surface-container-lowest rounded-xl border border-outline-variant/50">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                  <span className="material-symbols-outlined text-[20px]">work</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-0.5">Role</span>
                  <p className="text-sm font-bold text-foreground">{teacher.role}</p>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button onClick={() => setIsViewProfileOpen(false)} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl shadow-md h-12">Close</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Profile Dialog */}
        <Dialog open={isEditing} onOpenChange={setIsEditing}>
          <DialogContent className="sm:max-w-[425px] w-[90vw] rounded-3xl p-6 bg-background border-none shadow-2xl">
            <DialogHeader>
              <DialogTitle className="font-headline text-xl font-black text-primary">Edit Profile</DialogTitle>
              <DialogDescription className="text-xs font-medium">
                Update your personal information below.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label className={`text-xs font-bold uppercase tracking-wider ${profileErrors.name ? 'text-destructive' : 'text-muted-foreground'}`}>Full Name</Label>
                <Input
                  value={editName || ''}
                  onChange={e => { setEditName(e.target.value); setProfileErrors(prev => ({ ...prev, name: '' })); }}
                  className={`bg-surface-container-lowest transition-all ${profileErrors.name ? 'border-destructive ring-1 ring-destructive' : ''}`}
                />
                {profileErrors.name && <p className="text-[10px] font-bold text-destructive">Try: Please enter your name</p>}
              </div>
              <div className="space-y-1.5">
                <Label className={`text-xs font-bold uppercase tracking-wider ${profileErrors.email ? 'text-destructive' : 'text-muted-foreground'}`}>Email Address</Label>
                <Input
                  type="email"
                  value={editEmail || ''}
                  onChange={e => { setEditEmail(e.target.value); setProfileErrors(prev => ({ ...prev, email: '' })); }}
                  className={`bg-surface-container-lowest transition-all ${profileErrors.email ? 'border-destructive ring-1 ring-destructive' : ''}`}
                />
                {profileErrors.email && <p className="text-[10px] font-bold text-destructive">Try: user@example.com</p>}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button onClick={() => setIsEditing(false)} variant="ghost" className="font-bold dark:hover:bg-surface-container-low">Cancel</Button>
              <Button onClick={handleSave} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl shadow-md">Save Changes</Button>
            </div>
          </DialogContent>
        </Dialog>

        <Button onClick={() => { localStorage.removeItem('ck_auth'); navigate('login', 'push_back'); }} className="w-full h-14 bg-error/10 text-error rounded-2xl text-sm font-bold flex items-center justify-center gap-2 mt-8 hover:bg-error hover:text-white transition-all shadow-none group">
          <span className="material-symbols-outlined text-[22px] group-hover:-translate-x-1 transition-transform">logout</span>
          Sign Out of ClassKhata
        </Button>

        <p className="text-center text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-8 pb-4">CLASSKHATA v1.0.0</p>
      </main>

      {/* BottomNavBar */}
      <nav className="fixed bottom-0 left-0 md:hidden w-full flex justify-around items-center px-3 pb-3 pt-1.5 bg-white/80 dark:bg-background/80 backdrop-blur-2xl border-t border-outline-variant/30 shadow-[0_-8px_32px_rgba(0,0,0,0.05)] z-50">
        <a onClick={() => navigate('dashboard', 'none')} className="cursor-pointer flex flex-col items-center justify-center text-muted-foreground px-3 py-1.5 hover:bg-surface-container-low rounded-xl transition-all">
          <span className="material-symbols-outlined text-[20px]">dashboard</span>
          <span className="font-label text-[10px] font-semibold uppercase tracking-tighter mt-0.5">Dashboard</span>
        </a>
        <a onClick={() => navigate('roster', 'none')} className="cursor-pointer flex flex-col items-center justify-center text-muted-foreground px-3 py-1.5 hover:bg-surface-container-low rounded-xl transition-all">
          <span className="material-symbols-outlined text-[20px]">group</span>
          <span className="font-label text-[10px] font-semibold uppercase tracking-tighter mt-0.5">Students</span>
        </a>
        <a onClick={() => navigate('reports', 'none')} className="cursor-pointer flex flex-col items-center justify-center text-muted-foreground px-3 py-1.5 hover:bg-surface-container-low rounded-xl transition-all">
          <span className="material-symbols-outlined text-[20px]">payments</span>
          <span className="font-label text-[10px] font-semibold uppercase tracking-tighter mt-0.5">Reports</span>
        </a>
        <a className="cursor-pointer flex flex-col items-center justify-center bg-primary text-primary-foreground rounded-xl px-4 py-1.5 transition-all shadow-md">
          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>account_circle</span>
          <span className="font-label text-[10px] font-semibold uppercase tracking-tighter mt-0.5">Profile</span>
        </a>
      </nav>
    </div>
  );
}
