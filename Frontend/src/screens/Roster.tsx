import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { api } from "../lib/api";
import { useState, useEffect } from "react";

// Replaces the old store.ts import with the live MongoDB shape
export interface Student {
  _id: string;
  name: string;
  guardianName?: string;
  guardianPhone?: string;
  whatsapp: string;
  classGrade: string;
  subjects: string;
  monthlyFee: number;
  startDate: string;
  endDate?: string;
  status: string;
  dueAmount: number;
  lastPaymentDate?: string | null;
  avatarInitials: string;
}

export default function Roster({ navigate }: { navigate: (screen: string, type: string) => void }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [open, setOpen] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [classGrade, setClassGrade] = useState('');
  const [subjects, setSubjects] = useState('');
  const [monthlyFee, setMonthlyFee] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [openingDueAmount, setOpeningDueAmount] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (startDate && monthlyFee) {
      const start = new Date(startDate);
      const now = new Date();
      let months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth()) + 1;
      if (months < 1) months = 1; // At least charge for one month (the starting month)
      setOpeningDueAmount((months * parseFloat(monthlyFee)).toString());
    } else if (monthlyFee && !startDate && !openingDueAmount) {
      setOpeningDueAmount(monthlyFee);
    }
  }, [startDate, monthlyFee]);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('All');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  const fetchStudents = async () => {
    try {
      const data = await api.getStudents();
      setStudents(data || []);
    } catch (error) {
      console.error("Failed to fetch students", error);
      setStudents([]);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleCreateStudent = async () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = "Student name is required";
    else if (name.length < 3) newErrors.name = "Name too short, use full name";
    if (!whatsapp.trim()) newErrors.whatsapp = "WhatsApp number is required";
    else if (whatsapp.length !== 10) newErrors.whatsapp = "Enter exactly 10 digits";
    if (guardianPhone.trim() && guardianPhone.length !== 10) {
      newErrors.guardianPhone = "Enter exactly 10 digits";
    }
    if (!classGrade.trim()) newErrors.classGrade = "Class is required";
    if (!startDate) newErrors.startDate = "Start date is required"; // Prevents Zod crashes!

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const fee = parseFloat(monthlyFee) || 0;
    const due = openingDueAmount !== '' ? parseFloat(openingDueAmount) : fee;

    // Generate Initials automatically (e.g., "Rahul Sharma" -> "RS")
    const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    try {
      // Pushing live data to the Express backend
      await api.addStudent({
        name,
        guardianName,
        guardianPhone,
        whatsapp,
        classGrade,
        subjects,
        monthlyFee: fee,
        startDate,
        endDate,
        dueAmount: due,
        avatarInitials: initials
      });

      await fetchStudents();
      setOpen(false);
      toast.success(`Success`, {
        description: `${name} has been successfully added to your roster.`
      });

      // Reset
      setName('');
      setGuardianName('');
      setGuardianPhone('');
      setWhatsapp('');
      setClassGrade('');
      setSubjects('');
      setMonthlyFee('');
      setStartDate('');
      setEndDate('');
      setOpeningDueAmount('');
      setErrors({});
    } catch (error: any) {
      toast.error("Failed to add student", {
        description: error.response?.data?.message || "Check your network connection."
      });
    }
  };

  // Safe fallback processing for mapping
  const uniqueClasses = ['All', ...new Set(students.map(s => s.classGrade))];
  const uniqueSubjects = ['All', ...new Set(students.flatMap(s => (s.subjects || '').split(',').map(sub => sub.trim()).filter(Boolean)))];
  const statusOptions = ['All', 'Paid', 'Partial', 'Pending', 'Unpaid', 'Overdue'];

  const filteredStudents = students.filter(student => {
    const safeSubjects = student.subjects || '';
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      safeSubjects.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = selectedClass === 'All' || student.classGrade === selectedClass;
    const matchesSubject = selectedSubject === 'All' || safeSubjects.toLowerCase().includes(selectedSubject.toLowerCase());
    const matchesStatus = selectedStatus === 'All' || student.status === selectedStatus;
    return matchesSearch && matchesClass && matchesSubject && matchesStatus;
  });

  return (
    <div className="min-h-[100dvh] pb-24">
      <header className="bg-white/70 dark:bg-background/80 backdrop-blur-2xl sticky top-0 z-40 border-b border-outline-variant/30 shadow-[0_4px_16px_rgba(0,0,0,0.02)]">
        <div className="flex justify-between items-center w-full px-4 py-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary rounded-lg flex items-center justify-center text-primary-foreground shadow-sm">
              <span className="material-symbols-outlined font-light text-[14px]">school</span>
            </div>
            <h1 className="font-headline text-base font-black text-primary dark:text-white uppercase tracking-widest">CLASSKHATA</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-headline text-xs font-black border border-primary/20 shadow-sm shrink-0">
              {(localStorage.getItem('ck_teacher_name') || 'OP').split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 pt-5">
        <section className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="font-headline text-2xl font-extrabold tracking-tight text-primary">Student Roster</h2>
              <p className="text-muted-foreground text-sm font-medium mt-1">Managing {filteredStudents.length} filtered enrollments</p>
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1 group">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-muted-foreground text-[20px]">search</span>
                </div>
                <Input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-surface-container-lowest border-none rounded-xl h-12 pl-10 pr-4 focus-visible:ring-primary/20 transition-all text-sm font-medium"
                  placeholder="Search students..."
                  type="text"
                />
              </div>
              <Dialog>
                {/* Removed asChild and replaced Button with a styled div */}
                <DialogTrigger>
                  <div className="flex items-center justify-center h-12 w-12 p-0 rounded-xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm hover:bg-surface-container-low transition-colors cursor-pointer">
                    <span className="material-symbols-outlined">filter_list</span>
                  </div>
                </DialogTrigger>
                <DialogContent className="w-[85vw] max-w-[320px] rounded-2xl p-5 bg-background shadow-2xl border-none">
                  <DialogHeader className="pb-2">
                    <DialogTitle className="font-headline text-lg font-black text-primary">Filter Students</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Class</Label>
                      <select
                        value={selectedClass}
                        onChange={e => setSelectedClass(e.target.value)}
                        className="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-outline-variant text-sm font-medium focus:ring-1 focus:ring-primary outline-none transition-all"
                      >
                        {uniqueClasses.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Subject</Label>
                      <select
                        value={selectedSubject}
                        onChange={e => setSelectedSubject(e.target.value)}
                        className="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-outline-variant text-sm font-medium focus:ring-1 focus:ring-primary outline-none transition-all"
                      >
                        {uniqueSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Payment Status</Label>
                      <select
                        value={selectedStatus}
                        onChange={e => setSelectedStatus(e.target.value)}
                        className="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-outline-variant text-sm font-medium focus:ring-1 focus:ring-primary outline-none transition-all"
                      >
                        {statusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>
                    <Button onClick={() => { setSelectedClass('All'); setSelectedSubject('All'); setSelectedStatus('All'); setSearchQuery(''); }} variant="ghost" className="w-full text-[11px] font-bold uppercase tracking-wider text-primary hover:bg-primary/5 rounded-lg">Clear All Filters</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </section>

        <div className="space-y-4">
          <div className="flex flex-col gap-4">
            {filteredStudents.map((student) => (
              <Card key={student._id} onClick={() => { localStorage.setItem('ck_current_student', student._id); navigate('profile', 'push'); }} className="bg-surface-container-lowest border-outline-variant rounded-xl p-4 transition-all hover:bg-surface-container-high group cursor-pointer shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center text-primary font-headline text-sm font-bold border border-outline-variant/30">
                      {student.avatarInitials}
                    </div>
                    <div>
                      <h3 className="font-headline font-bold text-sm text-foreground">{student.name}</h3>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="material-symbols-outlined text-[12px] text-muted-foreground">menu_book</span>
                        <span className="text-muted-foreground text-xs font-medium">{student.classGrade} • {student.subjects || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {student.status === 'Paid' && <Badge variant="secondary" className="bg-primary-fixed text-on-primary-fixed-variant px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Paid</Badge>}
                    {student.status === 'Partial' && <Badge variant="secondary" className="bg-orange-100 text-orange-700 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Partial</Badge>}
                    {student.status === 'Pending' && <Badge variant="secondary" className="bg-tertiary-fixed text-on-tertiary-fixed-variant px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-tertiary-fixed/80">Pending</Badge>}
                    {student.status === 'Unpaid' && <Badge variant="secondary" className="bg-red-100 text-red-700 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Unpaid</Badge>}
                    {student.status === 'Overdue' && <Badge variant="destructive" className="px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Overdue</Badge>}
                  </div>
                </div>
              </Card>
            ))}
            {filteredStudents.length === 0 && (
              <div className="text-center text-sm text-muted-foreground py-8">No students found matching your filters.</div>
            )}
          </div>
        </div>
      </main>

      <Dialog open={open} onOpenChange={setOpen}>
        {/* Removed asChild and replaced Button with a styled div */}
        <DialogTrigger>
          <div className="fixed bottom-20 right-6 bg-primary text-primary-foreground hover:bg-primary/90 w-14 h-14 rounded-2xl flex items-center justify-center p-0 shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:shadow-primary/20 scale-98 active:scale-95 transition-all z-50 cursor-pointer">
            <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 0" }}>add</span>
          </div>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[380px] w-[90vw] rounded-2xl p-0 overflow-visible bg-background border-none shadow-2xl">
          <DialogHeader className="pt-6 px-6 pb-2">
            <DialogTitle className="font-headline text-xl font-bold">Add Student</DialogTitle>
            <DialogDescription className="text-xs">
              Enter enrollment details to add a new student to your roster.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-y-auto px-6 pb-8 space-y-5 scrollbar-none">
            <div className="space-y-1.5 group">
              <Label className={`text-xs font-bold uppercase tracking-wider ${errors.name ? 'text-destructive' : 'text-muted-foreground'}`}>Student Name *</Label>
              <Input
                value={name}
                onChange={e => { setName(e.target.value.replace(/[^A-Za-z\s]/g, '')); setErrors(prev => ({ ...prev, name: '' })); }}
                placeholder="e.g. Aarav Sharma"
                className={`bg-surface-container-lowest transition-all ${errors.name ? 'border-destructive focus-visible:ring-destructive/20 ring-1 ring-destructive' : ''}`}
              />
              {errors.name && <p className="text-[10px] font-bold text-destructive animate-in fade-in slide-in-from-top-1">Try: Please enter complete name</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Guardian Name</Label>
                <Input
                  value={guardianName}
                  onChange={e => setGuardianName(e.target.value.replace(/[^A-Za-z\s]/g, ''))}
                  placeholder="e.g. Rahul Sharma"
                  className="bg-surface-container-lowest"
                />
              </div>
              <div className="space-y-1.5">
                <Label className={`text-xs font-bold uppercase tracking-wider ${errors.guardianPhone ? 'text-destructive' : 'text-muted-foreground'}`}>Guardian Phone</Label>
                <Input
                  value={guardianPhone}
                  onChange={e => { setGuardianPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); setErrors(prev => ({ ...prev, guardianPhone: '' })); }}
                  type="tel"
                  placeholder="9876543210"
                  className={`bg-surface-container-lowest transition-all ${errors.guardianPhone ? 'border-destructive ring-destructive ring-1' : ''}`}
                />
                {errors.guardianPhone && <p className="text-[10px] font-bold text-destructive">Use: 10 digit number</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className={`text-xs font-bold uppercase tracking-wider ${errors.whatsapp ? 'text-destructive' : 'text-muted-foreground'}`}>Student WhatsApp Number *</Label>
              <div className="flex items-center">
                <span className={`bg-surface-container-high px-3 py-2 text-sm border border-r-0 border-outline-variant rounded-l-md text-muted-foreground ${errors.whatsapp ? 'border-destructive' : ''}`}>+91</span>
                <Input
                  value={whatsapp}
                  onChange={e => { setWhatsapp(e.target.value.replace(/\D/g, '').slice(0, 10)); setErrors(prev => ({ ...prev, whatsapp: '' })); }}
                  type="tel"
                  placeholder="9876543210"
                  className={`rounded-l-none bg-surface-container-lowest border-l-0 transition-all ${errors.whatsapp ? 'border-destructive ring-destructive ring-1 ring-offset-0' : ''}`}
                />
              </div>
              {errors.whatsapp && <p className="text-[10px] font-bold text-destructive">Try: Exactly 10 digits required</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className={`text-xs font-bold uppercase tracking-wider ${errors.classGrade ? 'text-destructive' : 'text-muted-foreground'}`}>Class / Grade *</Label>
                <Input
                  value={classGrade}
                  onChange={e => { setClassGrade(e.target.value.replace(/\D/g, '').slice(0, 2)); setErrors(prev => ({ ...prev, classGrade: '' })); }}
                  type="text"
                  inputMode="numeric"
                  placeholder="e.g. 12"
                  className={`bg-surface-container-lowest transition-all ${errors.classGrade ? 'border-destructive ring-destructive ring-1' : ''}`}
                />
                {errors.classGrade && <p className="text-[10px] font-bold text-destructive">Required field</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Monthly Fee</Label>
                <Input value={monthlyFee} onChange={e => setMonthlyFee(e.target.value.replace(/\D/g, '').slice(0, 6))} type="text" inputMode="numeric" placeholder="e.g. 5000" className="bg-surface-container-lowest" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Subjects</Label>
              <Input value={subjects} onChange={e => setSubjects(e.target.value)} placeholder="e.g. Physics, Chemistry, Biology" className="bg-surface-container-lowest" />
            </div>

            <div className="grid grid-cols-2 gap-4 pb-4">
              <div className="space-y-1.5">
                <Label className={`text-xs font-bold uppercase tracking-wider ${errors.startDate ? 'text-destructive' : 'text-muted-foreground'}`}>Start Date *</Label>
                <Input
                  value={startDate}
                  onChange={e => { setStartDate(e.target.value); setErrors(prev => ({ ...prev, startDate: '' })); }}
                  type="date"
                  className={`bg-surface-container-lowest appearance-none min-h-[44px] px-3 ${errors.startDate ? 'border-destructive ring-destructive ring-1' : ''}`}
                  style={{ colorScheme: 'light dark' }}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">End Date</Label>
                <Input
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  type="date"
                  className="bg-surface-container-lowest appearance-none min-h-[44px] px-3"
                  style={{ colorScheme: 'light dark' }}
                />
              </div>
              <div className="space-y-1.5 col-span-2 pt-2 border-t border-outline-variant/30">
                <Label className="text-xs font-bold uppercase tracking-wider text-primary">Opening Pending Balance (₹)</Label>
                <Input
                  value={openingDueAmount}
                  onChange={e => setOpeningDueAmount(e.target.value.replace(/\D/g, ''))}
                  type="text"
                  inputMode="numeric"
                  className="bg-surface-container-lowest border-primary/30 focus-visible:ring-primary/20 h-11"
                  placeholder="Auto-calculated from Start Date..."
                />
                <p className="text-[9.5px] text-muted-foreground font-medium uppercase tracking-wider leading-tight">Calculates unpaid months from Start Date. Edit this if they already paid partially.</p>
              </div>
            </div>

            <Button onClick={handleCreateStudent} className="w-full mt-4 bg-primary text-primary-foreground hover:bg-primary/90 font-bold rounded-xl shadow-md h-12 active:scale-95 transition-transform">
              Save Student
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* BottomNavBar */}
      <nav className="fixed bottom-0 left-0 md:hidden w-full flex justify-around items-center px-3 pb-3 pt-1.5 bg-white/80 dark:bg-background/80 backdrop-blur-2xl border-t border-outline-variant/30 shadow-[0_-8px_32px_rgba(0,0,0,0.05)] z-50">
        <div onClick={() => navigate('dashboard', 'none')} className="cursor-pointer flex flex-col items-center justify-center text-muted-foreground px-3 py-1.5 hover:bg-surface-container-low rounded-xl transition-all">
          <span className="material-symbols-outlined text-[20px]">dashboard</span>
          <span className="font-label text-[10px] font-semibold uppercase tracking-tighter mt-0.5">Dashboard</span>
        </div>
        <div className="flex flex-col items-center justify-center bg-primary text-primary-foreground rounded-xl px-4 py-1.5 transition-all shadow-md">
          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>group</span>
          <span className="font-label text-[10px] font-semibold uppercase tracking-tighter mt-0.5">Students</span>
        </div>
        <div onClick={() => navigate('reports', 'none')} className="cursor-pointer flex flex-col items-center justify-center text-muted-foreground px-3 py-1.5 hover:bg-surface-container-low rounded-xl transition-all">
          <span className="material-symbols-outlined text-[20px]">payments</span>
          <span className="font-label text-[10px] font-semibold uppercase tracking-tighter mt-0.5">Reports</span>
        </div>
        <div onClick={() => navigate('teacher_profile', 'none')} className="cursor-pointer flex flex-col items-center justify-center text-muted-foreground px-3 py-1.5 hover:bg-surface-container-low rounded-xl transition-all">
          <span className="material-symbols-outlined text-[20px]">account_circle</span>
          <span className="font-label text-[10px] font-semibold uppercase tracking-tighter mt-0.5">Profile</span>
        </div>
      </nav>
    </div>
  );
}