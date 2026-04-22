import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { api } from "../lib/api";
import { useEffect, useState } from "react";

// Live MongoDB Interfaces
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
  avatarInitials: string;
}

export interface Transaction {
  _id: string;
  studentId: string;
  amount: number;
  date: string;
  period: string;
  type: string;
}

export default function Profile({ navigate }: { navigate: (screen: string, type: string) => void }) {
  // 1. ALL STATE HOOKS
  const [student, setStudent] = useState<Student | null>(null);
  const [teacherInitials, setTeacherInitials] = useState(() => {
    const name = localStorage.getItem('ck_teacher_name') || 'MS';
    return name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentPeriod, setPaymentPeriod] = useState('');

  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Edit states
  const [editName, setEditName] = useState('');
  const [editGuardianName, setEditGuardianName] = useState('');
  const [editGuardianPhone, setEditGuardianPhone] = useState('');
  const [editWhatsapp, setEditWhatsapp] = useState('');
  const [editClassGrade, setEditClassGrade] = useState('');
  const [editSubjects, setEditSubjects] = useState('');
  const [editMonthlyFee, setEditMonthlyFee] = useState('');
  const [editDueAmount, setEditDueAmount] = useState('');

  // 2. DATA FETCHING FUNCTION
  const fetchProfileData = async () => {
    const studentId = localStorage.getItem('ck_current_student');
    if (studentId) {
      try {
        
        const st = await api.getStudent(studentId);
        setStudent(st);

        const allTxs = await api.getTransactions();
        const studentTxs = allTxs.filter((tx: any) => tx.studentId === studentId);
        setTransactions(studentTxs);

        const fee = st.monthlyFee || 0;
        setPaymentAmount(fee.toString());
        setEditName(st.name);
        setEditGuardianName(st.guardianName || '');
        setEditGuardianPhone(st.guardianPhone || '');
        setEditWhatsapp(st.whatsapp);
        setEditClassGrade(st.classGrade);
        setEditSubjects(st.subjects);
        setEditMonthlyFee(fee.toString());
        setEditDueAmount(st.dueAmount.toString());
      } catch (error) {
        toast.error("Failed to load student profile");
        navigate('roster', 'push_back');
      }
    }
  };

  // 3. ALL USE-EFFECT HOOKS MUST GO HERE
  useEffect(() => {
    fetchProfileData();
  }, []);

  const getMonthlyBreakdown = () => {
    if (!student || !student.startDate) return [];
    try {
      const start = new Date(student.startDate);
      const now = new Date();
      if (isNaN(start.getTime())) return [];

      const breakdown = [];
      let current = new Date(start.getFullYear(), start.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 1);

      while (current <= end) {
        const monthYear = current.toLocaleString('default', { month: 'long', year: 'numeric' });
        const monthTxs = transactions.filter(t => t.period === monthYear);
        const paidAmount = monthTxs.reduce((sum, t) => sum + t.amount, 0);
        const fee = student.monthlyFee;

        let status = 'Unpaid';
        if (paidAmount >= fee) status = 'Paid';
        else if (paidAmount > 0) status = 'Partial';

        breakdown.push({
          period: monthYear,
          fee: fee,
          paid: paidAmount,
          balance: fee - paidAmount,
          status
        });
        current.setMonth(current.getMonth() + 1);
      }
      return breakdown.reverse();
    } catch (e) {
      return [];
    }
  };

  const monthlyBreakdown = getMonthlyBreakdown();

  useEffect(() => {
    if (paymentDialogOpen && monthlyBreakdown.length > 0) {
      const oldestUnpaid = monthlyBreakdown.slice().reverse().find(b => b.status !== 'Paid');
      if (oldestUnpaid) setPaymentPeriod(oldestUnpaid.period);
      else setPaymentPeriod(monthlyBreakdown[0].period);
    }
  }, [paymentDialogOpen, monthlyBreakdown.length, student]);

  useEffect(() => {
    if (paymentDialogOpen && student) {
      setPaymentAmount(student.dueAmount > 0 ? student.dueAmount.toString() : student.monthlyFee.toString());
      setPaymentDate(new Date().toISOString().split('T')[0]);
    }
  }, [paymentDialogOpen, student]);


  // 👇 4. THE EARLY RETURN GOES HERE, SAFELY BELOW ALL HOOKS 👇
  if (!student) return <div className="min-h-[100dvh] flex items-center justify-center font-bold text-primary">Loading Profile...</div>;


  // 5. REGULAR FUNCTIONS
  const handleEditSubmit = async () => {
    if (student) {
      try {
        await api.updateStudent(student._id, {
          name: editName,
          guardianName: editGuardianName,
          guardianPhone: editGuardianPhone,
          whatsapp: editWhatsapp,
          classGrade: editClassGrade,
          subjects: editSubjects,
          monthlyFee: parseFloat(editMonthlyFee) || 0,
        });
        setEditDialogOpen(false);
        toast.success("Student updated successfully");
        fetchProfileData(); 
      } catch (err) {
        toast.error("Failed to update student");
      }
    }
  };

  const handlePaymentSubmit = async () => {
    let remainingAmount = parseFloat(paymentAmount);
    if (isNaN(remainingAmount) || remainingAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (remainingAmount > (student?.dueAmount || 0)) {
      toast.error(`Error: Amount cannot exceed the total pending balance of ₹${student.dueAmount}`);
      return; // Instantly stops the function before any database calls are made!
    }

    const chronologicalBreakdown = [...monthlyBreakdown].reverse();
    const unpaidMonths = chronologicalBreakdown.filter(b => b.status !== 'Paid');

    toast.info("Processing waterfall payment...");
    try {
      for (const month of unpaidMonths) {
        if (remainingAmount <= 0) break;
        
        const owed = month.fee - month.paid;
        const payForThisMonth = Math.min(owed, remainingAmount);
        
        await api.addTransaction({
          studentId: student._id,
          studentName: student.name,
          amount: payForThisMonth,
          date: paymentDate,
          period: month.period,
          type: 'Tuition'
        });
        remainingAmount -= payForThisMonth;
      }

      if (remainingAmount > 0 && chronologicalBreakdown.length > 0) {
        const currentMonth = chronologicalBreakdown[chronologicalBreakdown.length - 1].period;
        await api.addTransaction({
          studentId: student._id,
          studentName: student.name,
          amount: remainingAmount,
          date: paymentDate,
          period: currentMonth,
          type: 'Advance / Overpayment'
        });
      }

      const currentDue = student.dueAmount || 0;
      const newDueAmount = Math.max(0, currentDue - parseFloat(paymentAmount));

      await api.updateStudent(student._id, {
        dueAmount: newDueAmount,
        status: newDueAmount === 0 ? 'Paid' : 'Partial'
      });
      
      setPaymentDialogOpen(false);
      toast.success(`₹${paymentAmount} payment recorded successfully!`);
      fetchProfileData(); 
    } catch (error) {
      toast.error("Failed to process the payment.");
    }
  };

  const handleDelete = async () => {
    if (student) {
      try {
        await api.deleteStudent(student._id);
        toast.success("Student Deleted", {
          description: `${student.name} has been removed.`
        });
        setDeleteDialogOpen(false);
        navigate('roster', 'push_back');
      } catch (err) {
        toast.error("Failed to delete student");
      }
    }
  };

  // 6. JSX RENDER
  return (
    <div className="min-h-[100dvh] pb-24">
      {/* TopAppBar */}
      <header className="bg-white/70 dark:bg-background/80 backdrop-blur-2xl sticky top-0 z-40 border-b border-outline-variant/30 shadow-[0_4px_16px_rgba(0,0,0,0.02)]">
        <div className="flex justify-between items-center w-full px-4 py-2">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate('roster', 'push_back')} className="h-8 w-8 hover:bg-surface-container-low transition-colors rounded-lg">
              <span className="material-symbols-outlined text-primary text-[20px]">arrow_back</span>
            </Button>
            <div className="w-6 h-6 bg-primary rounded-lg flex items-center justify-center text-primary-foreground shadow-sm">
              <span className="material-symbols-outlined font-light text-[14px]">school</span>
            </div>
            <h1 className="font-headline text-base font-black text-primary dark:text-white uppercase tracking-widest">CLASSKHATA</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
              <DialogTrigger>
                <div className="flex items-center justify-center h-8 w-8 text-primary hover:bg-primary/10 rounded-lg cursor-pointer transition-colors">
                  <span className="material-symbols-outlined text-[18px]">edit</span>
                </div>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[380px] w-[90vw] rounded-2xl p-0 overflow-hidden bg-background border-none shadow-2xl">
                 <DialogHeader className="p-5 pb-2 bg-surface-container-lowest border-b border-outline-variant/30">
                   <DialogTitle className="font-headline text-lg font-black text-primary">Edit Student</DialogTitle>
                 </DialogHeader>
                 <div className="max-h-[60vh] overflow-y-auto p-5 space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Student Name</Label>
                      <Input value={editName} onChange={e => setEditName(e.target.value)} className="bg-surface-container-lowest" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Guardian Name</Label>
                      <Input value={editGuardianName} onChange={e => setEditGuardianName(e.target.value)} placeholder="e.g., Rajesh Sharma" className="bg-surface-container-lowest" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Phone</Label>
                        <Input value={editGuardianPhone} onChange={e => setEditGuardianPhone(e.target.value)} type="tel" placeholder="10-digit number" className="bg-surface-container-lowest" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">WhatsApp</Label>
                        <Input value={editWhatsapp} onChange={e => setEditWhatsapp(e.target.value)} type="tel" className="bg-surface-container-lowest" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Class / Grade</Label>
                      <Input value={editClassGrade} onChange={e => setEditClassGrade(e.target.value)} className="bg-surface-container-lowest" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Subjects</Label>
                      <Input value={editSubjects} onChange={e => setEditSubjects(e.target.value)} className="bg-surface-container-lowest" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Monthly Fee (₹)</Label>
                      <Input value={editMonthlyFee} onChange={e => setEditMonthlyFee(e.target.value)} type="number" className="bg-surface-container-lowest" />
                    </div>
                 </div>
                 <div className="p-3 bg-surface-container-lowest border-t border-outline-variant/30 flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setEditDialogOpen(false)} className="rounded-xl font-bold">Cancel</Button>
                    <Button onClick={handleEditSubmit} className="bg-primary text-primary-foreground rounded-xl font-bold">Save Changes</Button>
                 </div>
              </DialogContent>
            </Dialog>

            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <DialogTrigger>
                <div className="flex items-center justify-center h-8 w-8 text-destructive hover:bg-destructive/10 rounded-lg cursor-pointer transition-colors">
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </div>
              </DialogTrigger>
              <DialogContent className="w-[85vw] max-w-[320px] rounded-2xl p-5 bg-background shadow-2xl border-none">
                <DialogHeader className="pb-2">
                  <DialogTitle className="font-headline text-lg font-black text-destructive">Delete Student?</DialogTitle>
                  <DialogDescription className="text-xs font-medium text-muted-foreground">
                    This will permanently remove {student.name} and their records. This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex flex-row gap-2 mt-2 sm:justify-start">
                  <Button variant="outline" className="flex-1 rounded-xl h-10 font-bold" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                  <Button variant="destructive" className="flex-1 rounded-xl h-10 font-bold" onClick={handleDelete}>Delete</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-headline text-xs font-black border border-primary/20 shadow-sm">
              {teacherInitials}
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-md mx-auto px-3 pt-3">
        {/* Student Profile Identity - Compact */}
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/40 p-3 shadow-sm mb-3">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-headline text-base font-black border border-primary/20">
              {student.avatarInitials || 'ST'}
            </div>
            <div>
              <h2 className="font-headline text-base font-black text-primary leading-tight">{student.name}</h2>
              <p className="text-muted-foreground font-bold text-[9px] uppercase tracking-widest">{student.classGrade} • {student.subjects || 'N/A'}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 border-t border-outline-variant/30 pt-3">
            <div className="flex flex-col">
               <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Guardian</span>
               <div className="flex items-center gap-1.5">
                 <span className="material-symbols-outlined text-primary text-[14px]">person</span>
                 <span className="font-bold text-xs text-foreground truncate">{student.guardianName || 'N/A'}</span>
               </div>
            </div>
            <div className="flex flex-col">
               <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">WhatsApp / Call</span>
               <div className="flex items-center gap-1.5">
                 <span className="material-symbols-outlined text-primary text-[14px]">call</span>
                 <span className="font-bold text-xs text-foreground truncate">{student.whatsapp}</span>
               </div>
            </div>
          </div>
        </div>

        {/* Payment Summary Section - Professional Mobile */}
        <div className="grid grid-cols-1 gap-3 mb-3">
          <Card className="bg-surface-container-lowest border-outline-variant shadow-sm rounded-xl p-3 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full -mr-10 -mt-10 blur-xl"></div>
             
             <div className="flex justify-between items-center mb-3">
                <div>
                  <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest block mb-0.5">Fixed Monthly Fee</span>
                  <p className="text-foreground font-black text-xs">₹{student.monthlyFee} <span className="text-[9px] text-muted-foreground font-bold">/ MONTH</span></p>
                </div>
                <div className="flex flex-col items-end">
                  {student.status === 'Paid' && <Badge className="bg-green-100 text-green-700 rounded-lg font-bold uppercase text-[7px] px-1.5 py-0.5">Fully Paid</Badge>}
                  {student.status === 'Partial' && <Badge className="bg-orange-100 text-orange-700 rounded-lg font-bold uppercase text-[7px] px-1.5 py-0.5">Partial Paid</Badge>}
                  {student.status === 'Unpaid' && <Badge className="bg-red-100 text-red-700 rounded-lg font-bold uppercase text-[7px] px-1.5 py-0.5">Unpaid</Badge>}
                  {student.status === 'Overdue' && <Badge variant="destructive" className="rounded-lg font-bold uppercase text-[7px] px-1.5 py-0.5">Overdue</Badge>}
                  {student.status === 'Pending' && <Badge className="bg-tertiary-fixed text-on-tertiary-fixed-variant rounded-lg font-bold uppercase text-[7px] px-1.5 py-0.5">Pending</Badge>}
                </div>
             </div>

             <div className="flex flex-col gap-4 bg-surface-container-low/50 p-3 rounded-xl border border-outline-variant/30">
               <div className="flex items-center justify-between gap-2">
                 <div className="flex flex-col">
                   <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Pending Balance</span>
                   <span className="text-2xl font-headline font-black text-foreground leading-none mt-1">₹{(student.dueAmount || 0).toLocaleString('en-IN')}</span>
                 </div>
                 
                 <div className="flex flex-col items-end gap-2">
                   <div className="text-[9px] font-bold text-muted-foreground uppercase bg-surface-container-high px-2 py-0.5 rounded-md">
                     {new Date().toLocaleString('default', { month: 'short', year: 'numeric' })}
                   </div>
                   {student.dueAmount > 0 && (
                     <a
                       href={`https://wa.me/${student.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello ${student.guardianName || 'Guardian'}, this is a gentle reminder that ₹${student.dueAmount} is pending for ${student.name}'s tuition fee.`)}`}
                       target="_blank"
                       rel="noopener noreferrer"
                       className="flex items-center justify-center gap-1 bg-green-500 hover:bg-green-600 text-white rounded-lg px-2.5 py-1.5 shadow-sm transition-colors"
                     >
                       <span className="material-symbols-outlined text-[14px]">send</span>
                       <span className="text-[9px] font-bold uppercase tracking-wider">Reminder</span>
                     </a>
                   )}
                 </div>
               </div>
               
               {student.dueAmount <= 0 ? (
                 <Button disabled className="bg-surface-container-highest text-muted-foreground w-full h-12 rounded-xl font-bold flex items-center justify-center gap-2 opacity-80 cursor-not-allowed">
                   <span className="material-symbols-outlined text-green-600">check_circle</span>
                   <span className="text-foreground">All Dues Cleared</span>
                 </Button>
               ) : (
                 <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
                   <DialogTrigger render={<Button className="bg-primary hover:bg-primary/90 text-primary-foreground w-full h-12 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2" />}>
                     <span className="material-symbols-outlined">payments</span>
                     Update Payment Status
                   </DialogTrigger>
                   <DialogContent className="w-[90vw] rounded-3xl p-6 bg-background border-none shadow-2xl">
                     <DialogHeader>
                       <DialogTitle className="font-headline text-xl font-black uppercase text-primary">Record Payment</DialogTitle>
                       <DialogDescription className="text-xs font-medium">
                         Enter the amount received. It will automatically fill the oldest pending months first.
                       </DialogDescription>
                     </DialogHeader>
                     <div className="space-y-4 py-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold uppercase text-muted-foreground tracking-widest block">Payment Date</Label>
                          <Input 
                            type="date" 
                            value={paymentDate} 
                            onChange={e => setPaymentDate(e.target.value)} 
                            className="bg-surface-container-lowest border-outline-variant rounded-xl h-12 w-full text-sm font-medium px-3"
                            style={{ colorScheme: 'light dark' }}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold uppercase text-muted-foreground tracking-widest block">Amount Received (₹)</Label>
                          <Input 
                            type="number" 
                            value={paymentAmount} 
                            onChange={e => setPaymentAmount(e.target.value)}
                            className="bg-surface-container-lowest border-primary/30 rounded-xl h-14 w-full text-xl font-black px-4 focus-visible:ring-primary/20"
                            placeholder="₹ 0"
                          />
                          <p className="text-[10px] font-bold text-muted-foreground mt-1 text-right">
                            Total Pending: <span className="text-destructive">₹{student.dueAmount}</span>
                          </p>
                        </div>
                     </div>
                     <div className="flex gap-2 pt-2">
                       <Button onClick={() => setPaymentDialogOpen(false)} variant="outline" className="flex-1 rounded-xl h-12 font-bold">Cancel</Button>
                       <Button onClick={handlePaymentSubmit} className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-12 font-bold shadow-md">
                         Submit ₹{paymentAmount || 0}
                       </Button>
                     </div>
                   </DialogContent>
                 </Dialog>
               )}
             </div>
          </Card>
        </div>

        {/* Monthly Due Breakdown */}
        {monthlyBreakdown.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-headline text-base font-black text-primary uppercase tracking-tight">Monthly Breakdown</h3>
          </div>
          <div className="space-y-2 max-h-[340px] overflow-y-auto overscroll-contain pr-1 pb-1 scrollbar-hide">
            {monthlyBreakdown.map((b, i) => (
              <div key={b.period + i} className="flex flex-col p-3 bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm relative overflow-hidden">
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${b.status === 'Paid' ? 'bg-green-500' : b.status === 'Partial' ? 'bg-orange-500' : 'bg-red-500'}`}></div>
                <div className="flex justify-between items-center ml-2">
                  <div>
                    <p className="font-bold text-[13px] text-foreground uppercase tracking-tight">{b.period}</p>
                    <p className="text-[10px] text-muted-foreground font-medium mt-0.5">Fee: ₹{b.fee} | Paid: ₹{b.paid}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-headline font-black text-sm tracking-tight ${b.status === 'Paid' ? 'text-green-600' : b.status === 'Partial' ? 'text-orange-600' : 'text-red-600'}`}>
                      {b.status === 'Paid' ? 'CLEAR' : `DUE: ₹${b.balance}`}
                    </p>
                    <div className="mt-1">
                      {b.status === 'Paid' && <Badge className="bg-green-100 text-green-700 uppercase text-[8px] px-2 py-0 border-none font-bold">Paid</Badge>}
                      {b.status === 'Partial' && <Badge className="bg-orange-100 text-orange-700 uppercase text-[8px] px-2 py-0 border-none font-bold">Partial</Badge>}
                      {b.status === 'Unpaid' && <Badge className="bg-red-100 text-red-700 uppercase text-[8px] px-2 py-0 border-none font-bold">Unpaid</Badge>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        )}

        {/* Payment History Timeline */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-headline text-base font-black text-primary uppercase tracking-tight">Payment History</h3>
          </div>
          <div className="space-y-2">
            {transactions.map((tx) => (
              <div key={tx._id} className="flex items-center justify-between p-3 bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-sm transition-all hover:border-primary/20">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center text-primary border border-primary/10">
                    <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                  </div>
                  <div>
                    <p className="font-bold text-xs text-foreground uppercase tracking-tight">{tx.period}</p>
                    <p className="text-[8px] text-muted-foreground uppercase font-black tracking-widest">{tx.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-headline font-black text-primary text-xs tracking-tight">₹{tx.amount}</p>
                    <Badge className="bg-green-50 text-green-700 rounded-full font-black uppercase text-[7px] px-1.5 py-0 shadow-none border-none">Recorded</Badge>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={async () => { 
                      try {
                        await api.deleteTransaction(tx._id);
                        toast.success("Payment reverted");
                        fetchProfileData();
                      } catch(e) {
                        toast.error("Failed to revert payment");
                      }
                    }}
                    className="h-7 w-7 text-destructive hover:bg-destructive/10 rounded-md"
                    title="Revert Payment"
                   >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </Button>
                </div>
              </div>
            ))}
             {transactions.length === 0 && (
              <div className="text-center text-muted-foreground text-xs py-10 bg-surface-container-low/30 rounded-2xl border-2 border-dashed border-outline-variant/50">
                No payment history available yet
              </div>
            )}
          </div>
        </div>
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
        <a onClick={() => navigate('teacher_profile', 'none')} className="cursor-pointer flex flex-col items-center justify-center text-muted-foreground px-3 py-1.5 hover:bg-surface-container-low rounded-xl transition-all">
          <span className="material-symbols-outlined text-[20px]">account_circle</span>
          <span className="font-label text-[10px] font-semibold uppercase tracking-tighter mt-0.5">Profile</span>
        </a>
      </nav>
    </div>
  );
}