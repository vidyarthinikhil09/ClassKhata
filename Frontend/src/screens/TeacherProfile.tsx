import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { api, VAPID_PUBLIC_KEY } from "../lib/api";
import { TeacherProfile as TeacherType } from "../lib/store";
import { useEffect, useRef, useState } from "react";
import { useTheme } from "../components/ThemeProvider";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return new Uint8Array([...rawData].map(char => char.charCodeAt(0)));
}

export default function TeacherProfile({ navigate }: { navigate: (screen: string, type: string) => void }) {
  const [teacher, setTeacher] = useState<TeacherType | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isViewProfileOpen, setIsViewProfileOpen] = useState(false);
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editInstituteName, setEditInstituteName] = useState('');
  const [editPhoto, setEditPhoto] = useState('');
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  const [pushStatus, setPushStatus] = useState<'idle' | 'loading' | 'subscribed' | 'denied'>('idle');
  const photoInputRef = useRef<HTMLInputElement>(null);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    api.getTeacherProfile().then(data => {
      setTeacher(data);
      setEditName(data.name);
      setEditEmail(data.email);
      setEditInstituteName(data.instituteName || '');
      setEditPhoto(data.photo || '');
      if (data.instituteName) localStorage.setItem('ck_institute_name', data.instituteName);
    });

    // Check current notification permission state
    if ('Notification' in window) {
      if (Notification.permission === 'granted') setPushStatus('subscribed');
      else if (Notification.permission === 'denied') setPushStatus('denied');
    }
  }, []);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 200;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        // Center-crop to square
        const size = Math.min(img.width, img.height);
        const sx = (img.width - size) / 2;
        const sy = (img.height - size) / 2;
        ctx.drawImage(img, sx, sy, size, size, 0, 0, 200, 200);
        setEditPhoto(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    const newErrors: Record<string, string> = {};
    if (!editName.trim()) newErrors.name = "Name is required";
    if (!editEmail.trim()) newErrors.email = "Email is required";
    else if (!editEmail.includes('@')) newErrors.email = "Enter a valid email";
    if (Object.keys(newErrors).length > 0) { setProfileErrors(newErrors); return; }

    if (teacher) {
      try {
        const updated = await api.updateTeacherProfile({
          name: editName, email: editEmail,
          instituteName: editInstituteName, photo: editPhoto
        });
        setTeacher(updated);
        localStorage.setItem('ck_teacher_name', updated.name);
        if (updated.instituteName) localStorage.setItem('ck_institute_name', updated.instituteName);
        setIsEditing(false);
        setProfileErrors({});
        toast.success("Profile updated successfully!");
      } catch (error: any) {
        toast.error("Update Failed: " + (error.response?.data?.message || "Check your network or backend."));
      }
    }
  };

  const handleEnablePush = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      toast.error("Push notifications are not supported on this browser.");
      return;
    }
    setPushStatus('loading');
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setPushStatus('denied');
        toast.error("Permission denied. Enable notifications in browser settings.");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });
      await api.savePushSubscription(sub.toJSON() as object);
      setPushStatus('subscribed');
      toast.success("Push notifications enabled!");
    } catch (err) {
      console.error(err);
      setPushStatus('idle');
      toast.error("Failed to enable notifications. Make sure you're using HTTPS.");
    }
  };

  const handleTestPush = async () => {
    try {
      await api.sendTestPush();
      toast.success("Test notification sent!");
    } catch {
      toast.error("Could not send test notification.");
    }
  };

  if (!teacher) return (
    <div className="min-h-dvh flex items-center justify-center font-bold text-primary">Loading Profile...</div>
  );

  const initials = (teacher?.name || 'OP').split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();

  return (
    <div className="min-h-dvh pb-24">
      {/* TopAppBar */}
      <header className="bg-white/70 dark:bg-background/80 backdrop-blur-2xl sticky top-0 z-40 border-b border-outline-variant/30 shadow-[0_4px_16px_rgba(0,0,0,0.02)]">
        <div className="flex justify-between items-center w-full px-4 py-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary rounded-lg flex items-center justify-center text-primary-foreground shadow-sm">
              <span className="material-symbols-outlined font-light text-[14px]">school</span>
            </div>
            <h1 className="font-headline text-base font-black text-primary dark:text-white uppercase tracking-widest">CLASSKHATA</h1>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pt-6 space-y-5">
        <h2 className="font-headline text-2xl font-extrabold tracking-tight text-primary">Profile</h2>

        {/* User Card */}
        <div className="flex flex-col items-center gap-4 bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-10 -mt-10 blur-2xl pointer-events-none"></div>
          {/* Avatar */}
          <div className="relative">
            {teacher.photo ? (
              <img src={teacher.photo} alt="Profile" className="w-20 h-20 rounded-full object-cover border-4 border-primary/20 shadow-md" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-primary/10 border-4 border-primary/20 flex items-center justify-center text-primary font-headline text-2xl font-black shadow-md">
                {initials}
              </div>
            )}
          </div>
          <div className="text-center z-10">
            <h2 className="text-2xl font-headline font-extrabold text-foreground tracking-tight">{teacher.name}</h2>
            <p className="text-sm text-primary font-bold uppercase tracking-wider mt-0.5">{teacher.role}</p>
            {teacher.instituteName && (
              <p className="text-xs text-muted-foreground mt-1 font-bold flex items-center justify-center gap-1">
                <span className="material-symbols-outlined text-[13px]">domain</span>
                {teacher.instituteName}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-0.5 font-medium flex items-center justify-center gap-1">
              <span className="material-symbols-outlined text-[14px]">mail</span>
              {teacher.email}
            </p>
          </div>
          <Button onClick={() => setIsEditing(true)} variant="outline" className="w-full rounded-xl border-outline-variant font-bold text-xs h-10 shadow-sm flex items-center gap-2 hover:bg-surface-container-high transition-colors">
            <span className="material-symbols-outlined text-[16px]">edit</span>
            Edit Profile
          </Button>
        </div>

        {/* Settings List */}
        <section className="space-y-3">
          <h3 className="font-label text-xs font-bold uppercase text-muted-foreground tracking-widest pl-1">App Settings</h3>
          <Card className="bg-surface-container-lowest rounded-2xl border-outline-variant overflow-hidden p-0 shadow-sm">
            <div onClick={() => setIsViewProfileOpen(true)} className="flex items-center justify-between p-4 px-5 border-b border-outline-variant/30 hover:bg-surface-container-low transition-colors cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                  <span className="material-symbols-outlined text-[20px]">person</span>
                </div>
                <div>
                  <span className="text-sm font-bold text-foreground">Personal Information</span>
                  <p className="text-xs text-muted-foreground font-medium">View your account details</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-muted-foreground">chevron_right</span>
            </div>
            <div onClick={() => setIsThemeOpen(true)} className="flex items-center justify-between p-4 px-5 border-b border-outline-variant/30 hover:bg-surface-container-low transition-colors cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                  <span className="material-symbols-outlined text-[20px]">palette</span>
                </div>
                <div>
                  <span className="text-sm font-bold text-foreground">Theme</span>
                  <p className="text-xs text-muted-foreground font-medium capitalize">{theme} Mode</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-muted-foreground">chevron_right</span>
            </div>
            {/* Push Notifications Row */}
            <div className="flex items-center justify-between p-4 px-5 hover:bg-surface-container-low transition-colors">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${pushStatus === 'subscribed' ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:border-green-800' : 'bg-primary/10 text-primary border-primary/20'}`}>
                  <span className="material-symbols-outlined text-[20px]">notifications</span>
                </div>
                <div>
                  <span className="text-sm font-bold text-foreground">Push Notifications</span>
                  <p className="text-xs text-muted-foreground font-medium">
                    {pushStatus === 'subscribed' ? 'Enabled — you\'ll get fee alerts' :
                     pushStatus === 'denied' ? 'Blocked in browser settings' :
                     'Get fee & reminder alerts on this device'}
                  </p>
                </div>
              </div>
              {pushStatus === 'subscribed' ? (
                <button onClick={handleTestPush} className="text-[10px] font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-lg hover:bg-primary/20 transition-colors shrink-0">Test</button>
              ) : pushStatus === 'denied' ? (
                <span className="text-[10px] font-bold text-red-500 shrink-0">Blocked</span>
              ) : (
                <button onClick={handleEnablePush} disabled={pushStatus === 'loading'} className="text-[10px] font-bold text-primary-foreground bg-primary px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors shrink-0 disabled:opacity-60">
                  {pushStatus === 'loading' ? 'Enabling...' : 'Enable'}
                </button>
              )}
            </div>
          </Card>
        </section>

        {/* Dialogs */}
        <Dialog open={isThemeOpen} onOpenChange={setIsThemeOpen}>
          <DialogContent className="sm:max-w-80 w-[80vw] rounded-3xl p-6 bg-background border-none shadow-2xl">
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

        <Dialog open={isViewProfileOpen} onOpenChange={setIsViewProfileOpen}>
          <DialogContent className="sm:max-w-90 w-[90vw] rounded-3xl p-6 bg-background border-none shadow-2xl">
            <DialogHeader>
              <DialogTitle className="font-headline text-xl font-black text-primary">Personal Details</DialogTitle>
              <DialogDescription className="text-xs font-medium">Your current account information.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-4">
              {[
                { icon: 'badge', label: 'Full Name', value: teacher.name },
                { icon: 'mail', label: 'Email Address', value: teacher.email },
                { icon: 'work', label: 'Role', value: teacher.role },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-4 p-3 bg-surface-container-lowest rounded-xl border border-outline-variant/50">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shrink-0">
                    <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-0.5">{item.label}</span>
                    <p className="text-sm font-bold text-foreground">{item.value}</p>
                  </div>
                </div>
              ))}
              <div className={`flex items-center gap-4 p-3 rounded-xl border ${teacher.instituteName ? 'bg-surface-container-lowest border-outline-variant/50' : 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800/40'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border shrink-0 ${teacher.instituteName ? 'bg-primary/10 text-primary border-primary/20' : 'bg-orange-100 text-orange-600 border-orange-200'}`}>
                  <span className="material-symbols-outlined text-[20px]">domain</span>
                </div>
                <div className="flex-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-0.5">Coaching Institute</span>
                  {teacher.instituteName
                    ? <p className="text-sm font-bold text-foreground">{teacher.instituteName}</p>
                    : <p className="text-sm font-bold text-orange-600">Not set — required for receipts</p>}
                </div>
              </div>
            </div>
            <Button onClick={() => setIsViewProfileOpen(false)} className="w-full bg-primary text-primary-foreground font-bold rounded-xl h-12">Close</Button>
          </DialogContent>
        </Dialog>

        {/* Edit Profile Dialog */}
        <Dialog open={isEditing} onOpenChange={setIsEditing}>
          <DialogContent className="sm:max-w-[425px] w-[90vw] rounded-3xl p-6 bg-background border-none shadow-2xl">
            <DialogHeader>
              <DialogTitle className="font-headline text-xl font-black text-primary">Edit Profile</DialogTitle>
              <DialogDescription className="text-xs font-medium">Update your personal information and photo.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Photo upload */}
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  {editPhoto ? (
                    <img src={editPhoto} alt="Profile" className="w-20 h-20 rounded-full object-cover border-4 border-primary/20" />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-primary/10 border-4 border-primary/20 flex items-center justify-center text-primary font-headline text-2xl font-black">{initials}</div>
                  )}
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[14px]">photo_camera</span>
                  </button>
                </div>
                <input ref={photoInputRef} type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />
                {editPhoto && (
                  <button type="button" onClick={() => setEditPhoto('')} className="text-[10px] font-bold text-muted-foreground hover:text-destructive transition-colors">Remove photo</button>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className={`text-xs font-bold uppercase tracking-wider ${profileErrors.name ? 'text-destructive' : 'text-muted-foreground'}`}>Full Name</Label>
                <Input value={editName || ''} onChange={e => { setEditName(e.target.value); setProfileErrors(p => ({ ...p, name: '' })); }}
                  className={`bg-surface-container-lowest ${profileErrors.name ? 'border-destructive ring-1 ring-destructive' : ''}`} />
                {profileErrors.name && <p className="text-[10px] font-bold text-destructive">Please enter your name</p>}
              </div>
              <div className="space-y-1.5">
                <Label className={`text-xs font-bold uppercase tracking-wider ${profileErrors.email ? 'text-destructive' : 'text-muted-foreground'}`}>Email Address</Label>
                <Input type="email" value={editEmail || ''} onChange={e => { setEditEmail(e.target.value); setProfileErrors(p => ({ ...p, email: '' })); }}
                  className={`bg-surface-container-lowest ${profileErrors.email ? 'border-destructive ring-1 ring-destructive' : ''}`} />
                {profileErrors.email && <p className="text-[10px] font-bold text-destructive">Enter a valid email</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-primary">Coaching Institute Name <span className="text-destructive">*</span></Label>
                <Input value={editInstituteName || ''} onChange={e => setEditInstituteName(e.target.value)}
                  placeholder="e.g. Sharma Classes, Excel Academy..." className="bg-surface-container-lowest" />
                <p className="text-[9px] text-muted-foreground font-medium">Appears on receipts instead of "ClassKhata"</p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button onClick={() => setIsEditing(false)} variant="ghost" className="font-bold">Cancel</Button>
              <Button onClick={handleSave} className="bg-primary text-primary-foreground font-bold rounded-xl shadow-md">Save Changes</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Sign Out */}
        <Button
          onClick={async () => {
            try { await api.logout(); } catch {}
            localStorage.removeItem('ck_auth');
            localStorage.removeItem('ck_teacher_name');
            localStorage.removeItem('ck_institute_name');
            navigate('login', 'push_back');
          }}
          className="w-full h-14 bg-error/10 text-error rounded-2xl text-sm font-bold flex items-center justify-center gap-2 mt-2 hover:bg-error hover:text-white transition-all shadow-none group"
        >
          <span className="material-symbols-outlined text-[22px] group-hover:-translate-x-1 transition-transform">logout</span>
          Sign Out of ClassKhata
        </Button>

        <p className="text-center text-[10px] text-muted-foreground font-bold uppercase tracking-widest pb-4">CLASSKHATA v1.0.0</p>
      </main>

      {/* BottomNavBar */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-120 flex justify-around items-center px-3 pb-3 pt-1.5 bg-white/80 dark:bg-background/80 backdrop-blur-2xl border-t border-outline-variant/30 shadow-[0_-8px_32px_rgba(0,0,0,0.05)] z-50">
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
