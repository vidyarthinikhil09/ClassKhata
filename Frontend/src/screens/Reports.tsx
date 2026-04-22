import { BarChart, Bar, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { api } from "../lib/api";
import { useEffect, useState } from "react";

// Live MongoDB Interface
export interface Transaction {
  _id: string;
  studentName: string;
  amount: number;
  date: string;
  period: string;
  type: string;
}

export default function Reports({ navigate }: { navigate: (screen: string, type: string) => void }) {
  const [metrics, setMetrics] = useState<any>({});
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [m, txsResponse] = await Promise.all([
          api.getDashboardMetrics(),
          api.getTransactions()
        ]);

        setMetrics(m || {});

        const txs = Array.isArray(txsResponse) ? txsResponse : [];
        const sortedTxs = [...txs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setTransactions(sortedTxs);

        // --- LIVE TRUE CASH FLOW GRAPH CALCULATION ---
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const now = new Date();
        const currentMonthIndex = now.getMonth();
        const currentYear = now.getFullYear();

        const dynamicChartData = [];
        
        // Loop backwards to get the last 6 months
        for (let i = 5; i >= 0; i--) {
          let targetMonth = currentMonthIndex - i;
          let targetYear = currentYear;
          
          // Handle wrapping around to the previous year (e.g., if it's Feb, 3 months ago was Nov of last year)
          if (targetMonth < 0) {
            targetMonth += 12;
            targetYear -= 1;
          }

          const monthName = months[targetMonth];
          
          // Create a YYYY-MM prefix to match against the exact transaction date (e.g., "2026-04")
          const targetPrefix = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}`;

          // Filter by the EXACT date the money entered your pocket, ignoring the invoice 'period'
          const monthlyRevenue = txs
            .filter((t: Transaction) => t.date && t.date.startsWith(targetPrefix))
            .reduce((sum: number, t: Transaction) => sum + (t.amount || 0), 0);

          dynamicChartData.push({ name: monthName, revenue: monthlyRevenue });
        }
        
        setChartData(dynamicChartData);

      } catch (error) {
        console.error("Failed to load reports data", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) return <div className="min-h-[100dvh] flex items-center justify-center font-bold text-primary">Loading Reports...</div>;

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
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-headline text-xs font-black border border-primary/20 shadow-sm shrink-0">
            {(localStorage.getItem('ck_teacher_name') || 'OP').split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 pt-5 space-y-4">
        <div>
          <span className="font-label text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1 block">Overview</span>
          <h2 className="font-headline text-2xl font-extrabold tracking-tight text-primary">Financial Analytics</h2>
        </div>

        {/* LIVE Revenue Chart */}
        <Card className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border-outline-variant">
          <h3 className="font-headline text-base font-bold mb-4">Monthly Revenue</h3>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%" minHeight={190}>
              <BarChart data={chartData}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={10} />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', fontSize: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="revenue" fill="currentColor" className="fill-primary" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-surface-container-lowest p-4 rounded-xl border-outline-variant flex flex-col justify-center shadow-sm">
            <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Outstanding</p>
            <p className="text-xl font-bold text-destructive">₹{(metrics?.pendingExpected || metrics?.pendingCollections || 0).toLocaleString('en-IN')}</p>
          </Card>
          <Card className="bg-surface-container-lowest p-4 rounded-xl border-outline-variant flex flex-col justify-center shadow-sm">
            <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Avg per Student</p>
            {/* Simple math fallback: Total collections divided by total students */}
            <p className="text-xl font-bold text-tertiary">
              ₹{metrics?.totalStudents ? Math.round((metrics.collectedThisMonth || 0) / metrics.totalStudents).toLocaleString('en-IN') : 0}
            </p>
          </Card>
        </div>

        {/* Recent Transactions */}
        <Card className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border-outline-variant">
          <h3 className="font-headline text-base font-bold mb-3">Recent Transactions</h3>
          <div className="space-y-3">
            {transactions.slice(0, 5).map((t) => (
              <div key={t._id} className="flex justify-between items-center py-2 border-b border-surface-container-high last:border-0">
                <div className="flex gap-3 items-center">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[16px]">payments</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold">{t.studentName || 'Student'} - {t.type || 'Tuition'}</p>
                    <p className="text-[10px] text-muted-foreground">{t.date} • {t.period}</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-primary">+₹{(t.amount || 0).toLocaleString('en-IN')}</span>
              </div>
            ))}
            {transactions.length === 0 && (
              <div className="text-center text-xs text-muted-foreground py-4">No recent transactions found. Go to a student's profile to log a payment!</div>
            )}
          </div>
        </Card>
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
        <a className="cursor-pointer flex flex-col items-center justify-center bg-primary text-primary-foreground rounded-xl px-4 py-1.5 transition-all shadow-md">
          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
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