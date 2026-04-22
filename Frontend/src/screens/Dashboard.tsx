import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "../lib/api";
import { TeacherProfile } from "../lib/store";
import { useEffect, useState } from "react";

// 1. Interface stays OUTSIDE the component
export interface Transaction {
  _id: string;
  studentName: string;
  amount: number;
  date: string;
  period: string;
  type: string;
}

export default function Dashboard({ navigate }: { navigate: (screen: string, type: string) => void }) {
  // 2. ALL HOOKS MUST GO INSIDE THE COMPONENT
  const [isLoading, setIsLoading] = useState(true); // <-- Added missing loading state
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]); // <-- Moved inside safely
  
  const [metrics, setMetrics] = useState({
    totalStudents: 0,
    pendingCollections: 0,
    collectedThisMonth: 0
  });

  // <-- Fixed the infinite loading trap by reading the name from memory!
  const [teacher, setTeacher] = useState<TeacherProfile | null>({ 
    name: localStorage.getItem('ck_teacher_name') || 'Teacher' 
  } as TeacherProfile); 

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch both metrics and transactions at the same time
        const [m, txsResponse] = await Promise.all([
           api.getDashboardMetrics(),
           api.getTransactions() 
        ]);
        
        setMetrics(m || {});
        
        // Safely sort the newest transactions to the top and grab the first 5
        const txs = Array.isArray(txsResponse) ? txsResponse : [];
        const sortedTxs = [...txs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setRecentTransactions(sortedTxs.slice(0, 5));

      } catch (error) {
        console.error("Failed to load dashboard data", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Use the new isLoading state for the loading screen
  if (isLoading) return <div className="min-h-[100dvh] flex items-center justify-center font-bold text-primary">Loading Dashboard...</div>;

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
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-headline text-xs font-black border border-primary/20 shadow-sm shrink-0">
              {(localStorage.getItem('ck_teacher_name') || 'OP').split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 pt-5">
        {/* Welcome Header */}
        <div className="mb-6 flex justify-between items-end gap-3">
          <div>
            <span className="font-label text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant mb-1 block">Welcome back,</span>
            <h2 className="font-headline text-2xl font-extrabold tracking-tight text-primary">Hi {teacher.name?.split(' ')[0] || 'Teacher'}</h2>
          </div>
        </div>
        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* 1. Top Card: Financial Summary */}
          {/* 1. Top Card: Financial Summary (Single Row Layout) */}
          <Card className="md:col-span-12 bg-primary text-primary-foreground rounded-[2rem] p-5 shadow-lg relative overflow-hidden border-0">
            {/* Beautiful Ambient Glow Effects */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/10 rounded-full -mr-40 -mt-40 blur-[80px] pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full -ml-20 -mb-20 blur-[50px] pointer-events-none"></div>
            
            <div className="relative z-10 flex flex-col gap-5">
              
              {/* TOP ROW: Collected and Pending Side-by-Side */}
              <div className="flex flex-row items-center justify-between gap-3 w-full">
                
                {/* LEFT: Collected This Month */}
                <div className="flex-1 min-w-0">
                  <p className="font-label text-[10px] md:text-[11px] font-bold text-primary-foreground/80 uppercase tracking-widest flex items-center gap-1 mb-1 truncate">
                    <span className="material-symbols-outlined text-[14px]">account_balance</span>
                    Collected
                  </p>
                  <h3 className="font-headline text-3xl md:text-4xl font-black tracking-tight drop-shadow-sm truncate">
                    ₹{(metrics?.collectedThisMonth || 0).toLocaleString('en-IN')}
                  </h3>
                </div>

                {/* DIVIDER */}
                <div className="w-px h-10 bg-primary-foreground/20 shrink-0"></div>

                {/* RIGHT: Pending Dues */}
                <div className="flex-1 min-w-0 flex flex-col items-end sm:items-start sm:pl-3">
                  <p className="font-label text-[10px] md:text-[11px] font-bold text-primary-foreground/80 uppercase tracking-widest flex items-center gap-1 mb-1 truncate">
                    <span className="material-symbols-outlined text-[14px]">pending_actions</span>
                    Pending
                  </p>
                  <h4 className="font-headline text-xl md:text-2xl font-bold truncate">
                    ₹{(metrics?.pendingCollections || 0).toLocaleString('en-IN')}
                  </h4>
                  <div className="flex items-center gap-1 text-[9px] text-primary-foreground/70 mt-0.5 font-medium">
                    <span className="material-symbols-outlined text-[12px]">groups</span>
                    <span className="truncate">{metrics?.activeOverdue || 0} overdue</span>
                  </div>
                </div>

              </div>

              {/* BOTTOM ROW: The Collection Health Progress Bar */}
              <div className="w-full bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]">
                <div className="flex justify-between items-center mb-2.5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary-foreground/90">Collection Rate</span>
                  <span className="text-sm font-black bg-white/20 px-2 py-0.5 rounded-md">
                    {((metrics?.collectedThisMonth || 0) + (metrics?.pendingCollections || 0)) > 0 
                      ? Math.round(((metrics?.collectedThisMonth || 0) / ((metrics?.collectedThisMonth || 0) + (metrics?.pendingCollections || 0))) * 100) 
                      : 0}%
                  </span>
                </div>
                
                {/* Dynamic Progress Bar */}
                <div className="w-full bg-black/20 rounded-full h-2.5 mb-2.5 overflow-hidden">
                  <div 
                    className="bg-white h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(255,255,255,0.5)]" 
                    style={{ width: `${((metrics?.collectedThisMonth || 0) + (metrics?.pendingCollections || 0)) > 0 ? Math.round(((metrics?.collectedThisMonth || 0) / ((metrics?.collectedThisMonth || 0) + (metrics?.pendingCollections || 0))) * 100) : 0}%` }}
                  ></div>
                </div>
                
                {/* Smart Motivation Message */}
                <p className="text-[9px] font-bold text-primary-foreground/80 tracking-wide flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">insights</span>
                  {((metrics?.collectedThisMonth || 0) + (metrics?.pendingCollections || 0)) > 0 && Math.round(((metrics?.collectedThisMonth || 0) / ((metrics?.collectedThisMonth || 0) + (metrics?.pendingCollections || 0))) * 100) >= 80 
                    ? 'Excellent pacing! Revenue is healthy.' 
                    : 'Send reminders to boost your cash flow.'}
                </p>
              </div>

            </div>
          </Card>
          {/* 2. 2x2 Grid Stats */}
          <section className="col-span-1 md:col-span-12 lg:mt-4 grid grid-cols-2 gap-4">
            <Card className="bg-surface-container-lowest border-outline-variant shadow-sm rounded-2xl p-4 flex flex-col justify-center">
              <div className="flex flex-col items-start gap-2">
                <div className="p-2 bg-blue-100 rounded-xl text-blue-700">
                  <span className="material-symbols-outlined text-[20px]">groups</span>
                </div>
                <div>
                  <p className="font-label text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Enrolled</p>
                  {/* SAFE FALLBACK ADDED HERE */}
                  <h3 className="font-headline text-2xl font-black text-foreground">{metrics?.totalStudentsEnrolled || metrics?.totalStudents || 0}</h3>
                </div>
              </div>
            </Card>

            <Card className="bg-surface-container-lowest border-outline-variant shadow-sm rounded-2xl p-4 flex flex-col justify-center">
              <div className="flex flex-col items-start gap-2">
                <div className="p-2 bg-orange-100 rounded-xl text-orange-700">
                  <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
                </div>
                <div>
                  <p className="font-label text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Pending</p>
                  {/* SAFE FALLBACK ADDED HERE */}
                  <h3 className="font-headline text-2xl font-black text-foreground">₹{(metrics?.totalPendingCollected || metrics?.pendingCollections || 0).toLocaleString('en-IN')}</h3>
                </div>
              </div>
            </Card>

            <Card className="bg-surface-container-lowest border-outline-variant shadow-sm rounded-2xl p-4 flex flex-col justify-center">
              <div className="flex flex-col items-start gap-2">
                <div className="p-2 bg-green-100 rounded-xl text-green-700">
                  <span className="material-symbols-outlined text-[20px]">payments</span>
                </div>
                <div>
                  <p className="font-label text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Collected Month</p>
                  {/* SAFE FALLBACK ADDED HERE */}
                  <h3 className="font-headline text-2xl font-black text-foreground">₹{(metrics?.collectedThisMonth || 0).toLocaleString('en-IN')}</h3>
                </div>
              </div>
            </Card>

            <Card className="bg-surface-container-lowest border-outline-variant shadow-sm rounded-2xl p-4 flex flex-col justify-center">
              <div className="flex flex-col items-start gap-2">
                <div className="p-2 bg-red-100 rounded-xl text-red-700">
                  <span className="material-symbols-outlined text-[20px]">warning</span>
                </div>
                <div>
                  <p className="font-label text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Active Overdue</p>
                  {/* SAFE FALLBACK ADDED HERE */}
                  <h3 className="font-headline text-2xl font-black text-foreground">{metrics?.activeOverdue || 0}</h3>
                </div>
              </div>
            </Card>
          </section>
          
          {/* Recent Transactions Feed */}
        <Card className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border-outline-variant mt-4">
          <div className="flex justify-between items-center mb-4">
             <h3 className="font-headline text-base font-bold">Recent Activity</h3>
             <a onClick={() => navigate('reports', 'push')} className="text-[10px] font-bold text-primary cursor-pointer hover:underline uppercase tracking-widest">
               View All
             </a>
          </div>
          
          <div className="space-y-3">
            {recentTransactions.map((t) => (
              <div key={t._id} className="flex justify-between items-center py-2 border-b border-surface-container-high last:border-0">
                <div className="flex gap-3 items-center">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <span className="material-symbols-outlined text-[16px]">payments</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{t.studentName || 'Student'}</p>
                    <p className="text-[10px] text-muted-foreground font-medium">{t.date} • {t.period}</p>
                  </div>
                </div>
                <span className="text-sm font-black text-green-600">+₹{(t.amount || 0).toLocaleString('en-IN')}</span>
              </div>
            ))}

            {recentTransactions.length === 0 && (
               <div className="text-center text-xs text-muted-foreground py-6 bg-surface-container-low/30 rounded-xl border border-dashed border-outline-variant/50">
                 No recent activity found.
               </div>
            )}
          </div>
        </Card>


        </div>
      </main>
      {/* BottomNavBar */}
      <nav className="fixed bottom-0 left-0 md:hidden w-full flex justify-around items-center px-3 pb-3 pt-1.5 bg-white/80 dark:bg-background/80 backdrop-blur-2xl border-t border-outline-variant/30 shadow-[0_-8px_32px_rgba(0,0,0,0.05)] z-50">
        <a className="cursor-pointer flex flex-col items-center justify-center bg-primary text-primary-foreground rounded-xl px-4 py-1.5 transition-all shadow-md">
          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>dashboard</span>
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