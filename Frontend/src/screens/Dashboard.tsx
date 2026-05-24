import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { api } from "../lib/api";
import { TeacherProfile } from "../lib/store";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { BarChart, Bar, ResponsiveContainer, Tooltip, XAxis } from 'recharts';

export interface Transaction {
  _id: string;
  studentName: string;
  amount: number;
  date: string;
  period: string;
  type: string;
}

export default function Dashboard({ navigate }: { navigate: (screen: string, type: string) => void }) {
  const [isLoading, setIsLoading] = useState(true);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [metrics, setMetrics] = useState({ totalStudents: 0, pendingCollections: 0, collectedThisMonth: 0, activeOverdue: 0 });
  const [analytics, setAnalytics] = useState<any>(null);
  const [teacher] = useState<TeacherProfile | null>({ name: localStorage.getItem('ck_teacher_name') || 'Teacher' } as TeacherProfile);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [m, txsResponse, analyticsData] = await Promise.all([
          api.getDashboardMetrics(),
          api.getTransactions(),
          api.getAnalytics()
        ]);
        setMetrics(m || {});
        setAnalytics(analyticsData || null);
        const txs = Array.isArray(txsResponse) ? txsResponse : [];
        const sorted = [...txs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setRecentTransactions(sorted.slice(0, 5));
      } catch (error) {
        console.error("Failed to load dashboard data", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const currentMonthLabel = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
  const currentMonthKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

  const handleGenerateFees = async () => {
    setIsGenerating(true);
    try {
      const result = await api.generateMonthlyFees(currentMonthKey);
      toast.success(`Fees generated for ${result.updatedCount} student(s) for ${currentMonthLabel}`);
      setGenerateDialogOpen(false);
    } catch {
      toast.error("Failed to generate fees. Try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const collectionRate = ((metrics?.collectedThisMonth || 0) + (metrics?.pendingCollections || 0)) > 0
    ? Math.round(((metrics?.collectedThisMonth || 0) / ((metrics?.collectedThisMonth || 0) + (metrics?.pendingCollections || 0))) * 100)
    : 0;

  if (isLoading) return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center gap-3">
      <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center">
        <span className="material-symbols-outlined text-primary-foreground text-[22px]">school</span>
      </div>
      <p className="font-bold text-primary text-sm">Loading Dashboard...</p>
    </div>
  );

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
          <div className="flex items-center gap-2">
            <button
              onClick={() => setGenerateDialogOpen(true)}
              className="flex items-center gap-1 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-[9px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-xl transition-colors"
            >
              <span className="material-symbols-outlined text-[14px]">calendar_add_on</span>
              New Month
            </button>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-headline text-xs font-black border border-primary/20 shadow-sm shrink-0">
              {(teacher?.name || 'CK').split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 pt-5 space-y-4">
        {/* Welcome + month comparison */}
        <div className="flex justify-between items-end gap-3">
          <div>
            <span className="font-label text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1 block">Welcome back,</span>
            <h2 className="font-headline text-2xl font-extrabold tracking-tight text-primary">Hi {teacher?.name?.split(' ')[0] || 'Teacher'}</h2>
          </div>
          {analytics?.revenueChange !== undefined && (
            <div className={`flex flex-col items-end shrink-0`}>
              <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">vs last month</span>
              <span className={`text-lg font-black ${analytics.revenueChange >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {analytics.revenueChange >= 0 ? '↑' : '↓'} {Math.abs(analytics.revenueChange)}%
              </span>
            </div>
          )}
        </div>

        {/* Generate Fees Dialog */}
        <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
          <DialogContent className="w-[88vw] max-w-[360px] rounded-2xl p-5 bg-background border-none shadow-2xl">
            <DialogHeader>
              <DialogTitle className="font-headline text-lg font-black text-primary">Start New Month?</DialogTitle>
              <DialogDescription className="text-xs font-medium mt-1">
                This will add ₹(monthlyFee) to each student's balance for <strong>{currentMonthLabel}</strong>. Students who already had fees generated this month are skipped automatically.
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-2 pt-3">
              <Button variant="outline" onClick={() => setGenerateDialogOpen(false)} className="flex-1 rounded-xl h-10 font-bold">Cancel</Button>
              <Button onClick={handleGenerateFees} disabled={isGenerating} className="flex-1 bg-primary text-primary-foreground rounded-xl h-10 font-bold">
                {isGenerating ? 'Generating...' : 'Generate Fees'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Hero Financial Card */}
        <Card className="bg-primary text-primary-foreground rounded-[2rem] p-5 shadow-lg relative overflow-hidden border-0">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/10 rounded-full -mr-40 -mt-40 blur-[80px] pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full -ml-20 -mb-20 blur-[50px] pointer-events-none"></div>
          <div className="relative z-10 flex flex-col gap-4">
            <div className="flex flex-row items-center justify-between gap-3 w-full">
              <div className="flex-1 min-w-0">
                <p className="font-label text-[10px] font-bold text-primary-foreground/80 uppercase tracking-widest flex items-center gap-1 mb-1">
                  <span className="material-symbols-outlined text-[14px]">account_balance</span> Collected
                </p>
                <h3 className="font-headline text-3xl font-black tracking-tight drop-shadow-sm truncate">
                  ₹{(metrics?.collectedThisMonth || 0).toLocaleString('en-IN')}
                </h3>
              </div>
              <div className="w-px h-10 bg-primary-foreground/20 shrink-0"></div>
              <div className="flex-1 min-w-0 flex flex-col items-end">
                <p className="font-label text-[10px] font-bold text-primary-foreground/80 uppercase tracking-widest flex items-center gap-1 mb-1">
                  <span className="material-symbols-outlined text-[14px]">pending_actions</span> Pending
                </p>
                <h4 className="font-headline text-xl font-bold truncate">
                  ₹{(metrics?.pendingCollections || 0).toLocaleString('en-IN')}
                </h4>
                <div className="flex items-center gap-1 text-[9px] text-primary-foreground/70 mt-0.5 font-medium">
                  <span className="material-symbols-outlined text-[12px]">groups</span>
                  <span>{metrics?.activeOverdue || 0} overdue</span>
                </div>
              </div>
            </div>
            {/* Collection rate progress */}
            <div className="w-full bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/20">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary-foreground/90">Collection Rate</span>
                <span className="text-sm font-black bg-white/20 px-2 py-0.5 rounded-md">{collectionRate}%</span>
              </div>
              <div className="w-full bg-black/20 rounded-full h-2 mb-2 overflow-hidden">
                <div className="bg-white h-full rounded-full transition-all duration-1000" style={{ width: `${collectionRate}%` }}></div>
              </div>
              <p className="text-[9px] font-bold text-primary-foreground/80 tracking-wide flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]">insights</span>
                {collectionRate >= 80 ? 'Excellent pacing! Revenue is healthy.' : 'Send reminders to boost your cash flow.'}
              </p>
            </div>
          </div>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-surface-container-lowest border-outline-variant shadow-sm rounded-2xl p-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-700 w-fit mb-2">
              <span className="material-symbols-outlined text-[20px]">groups</span>
            </div>
            <p className="font-label text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Enrolled</p>
            <h3 className="font-headline text-2xl font-black text-foreground">{metrics?.totalStudents || 0}</h3>
          </Card>
          <Card className="bg-surface-container-lowest border-outline-variant shadow-sm rounded-2xl p-4">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-xl text-orange-700 w-fit mb-2">
              <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
            </div>
            <p className="font-label text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Pending</p>
            <h3 className="font-headline text-2xl font-black text-foreground">₹{(metrics?.pendingCollections || 0).toLocaleString('en-IN')}</h3>
          </Card>
          <Card className="bg-surface-container-lowest border-outline-variant shadow-sm rounded-2xl p-4">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-xl text-green-700 w-fit mb-2">
              <span className="material-symbols-outlined text-[20px]">payments</span>
            </div>
            <p className="font-label text-[10px] font-bold text-muted-foreground uppercase tracking-wider">This Month</p>
            <h3 className="font-headline text-2xl font-black text-foreground">₹{(metrics?.collectedThisMonth || 0).toLocaleString('en-IN')}</h3>
          </Card>
          <Card className="bg-surface-container-lowest border-outline-variant shadow-sm rounded-2xl p-4">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-xl text-red-700 w-fit mb-2">
              <span className="material-symbols-outlined text-[20px]">warning</span>
            </div>
            <p className="font-label text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Overdue</p>
            <h3 className="font-headline text-2xl font-black text-foreground">{metrics?.activeOverdue || 0}</h3>
          </Card>
        </div>

        {/* 6-Month Revenue Trend (mini chart) */}
        {analytics?.monthlyRevenue?.length > 0 && (
          <Card className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm border-outline-variant">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-headline text-sm font-bold">Revenue Trend</h3>
              <a onClick={() => navigate('reports', 'push')} className="text-[10px] font-bold text-primary cursor-pointer hover:underline uppercase tracking-widest">Full Report</a>
            </div>
            <div className="h-32 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.monthlyRevenue}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} />
                  <Tooltip
                    cursor={{ fill: 'rgba(99,102,241,0.05)' }}
                    contentStyle={{ borderRadius: '8px', fontSize: '11px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(v: number) => [`₹${v.toLocaleString('en-IN')}`, 'Revenue']}
                  />
                  <Bar dataKey="revenue" fill="currentColor" className="fill-primary" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        {/* Top Defaulters */}
        {analytics?.topDefaulters?.length > 0 && (
          <Card className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm border-outline-variant">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-headline text-sm font-bold text-foreground flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-red-500">warning</span>
                Top Defaulters
              </h3>
              <Badge variant="destructive" className="text-[9px] font-bold px-2">{analytics.topDefaulters.length}</Badge>
            </div>
            <div className="space-y-2">
              {analytics.topDefaulters.slice(0, 3).map((d: any, i: number) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 font-bold text-[10px] shrink-0">
                      {d.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">{d.name}</p>
                      {d.classGrade && <p className="text-[9px] text-muted-foreground">{d.classGrade}</p>}
                    </div>
                  </div>
                  <span className="text-xs font-black text-red-600 shrink-0 ml-2">₹{d.dueAmount.toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Recent Activity */}
        <Card className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm border-outline-variant">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-headline text-sm font-bold">Recent Activity</h3>
            <a onClick={() => navigate('reports', 'push')} className="text-[10px] font-bold text-primary cursor-pointer hover:underline uppercase tracking-widest">View All</a>
          </div>
          <div className="space-y-2">
            {recentTransactions.map((t) => (
              <div key={t._id} className="flex justify-between items-center py-2 border-b border-outline-variant/30 last:border-0">
                <div className="flex gap-3 items-center">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <span className="material-symbols-outlined text-[16px]">payments</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{t.studentName || 'Student'}</p>
                    <p className="text-[10px] text-muted-foreground font-medium">{t.date ? new Date(t.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'} · {t.period}</p>
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
      </main>

      {/* BottomNavBar */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] flex justify-around items-center px-3 pb-3 pt-1.5 bg-white/80 dark:bg-background/80 backdrop-blur-2xl border-t border-outline-variant/30 shadow-[0_-8px_32px_rgba(0,0,0,0.05)] z-50">
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
