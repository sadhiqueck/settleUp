import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, TrendingUp, TrendingDown, PieChart as PieChartIcon } from "lucide-react";
import { useAnalytics } from "@/hooks/useAnalytics";
import { formatCurrency } from "@/lib/format";
import {
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

const COLORS = ["#6366F1", "#F59E0B", "#10B981", "#F43F5E", "#8B5CF6", "#06B6D4"];

export default function AnalyticsPage() {
  const navigate = useNavigate();
  const { data: analytics, isLoading, error } = useAnalytics();

  if (isLoading) {
    return (
      <div className="chat-main-panel flex items-center justify-center h-full">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="chat-main-panel flex flex-col items-center justify-center h-full text-center p-8">
        <h2 className="text-xl font-bold text-destructive mb-2">Failed to load analytics</h2>
        <p className="text-muted-foreground mb-4">We couldn't fetch your spending data right now.</p>
        <button onClick={() => navigate("/dashboard")} className="clay-btn-secondary">
          Go back home
        </button>
      </div>
    );
  }

  const { overview, categoryBreakdown, monthlyTrend, topGroups } = analytics;

  return (
    <div className="chat-main-panel bg-slate-50/50">
      {/* Header */}
      <header className="chat-header sticky top-0 z-10 bg-white/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/dashboard")}
            className="md:hidden size-9 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="font-display text-lg font-extrabold text-foreground flex items-center gap-2">
              <PieChartIcon size={20} className="text-primary" />
              Expense Analytics
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Insights across all your groups
            </p>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 space-y-6">
        
        {/* Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="clay-card-elevated p-5 flex flex-col gap-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Spent</span>
            <span className="text-2xl font-black font-sans text-slate-800">
              {formatCurrency(overview.totalSpent)}
            </span>
            <span className="text-xs text-slate-400 mt-1">{overview.totalExpenses} expenses</span>
          </div>
          <div className="clay-card-elevated p-5 flex flex-col gap-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Paid</span>
            <span className="text-2xl font-black font-sans text-emerald-500">
              {formatCurrency(overview.totalPaid)}
            </span>
            <span className="text-xs text-slate-400 mt-1">Money out of pocket</span>
          </div>
          <div className="clay-card-elevated p-5 flex flex-col gap-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Net Balance</span>
            <span className={`text-2xl font-black font-sans flex items-center gap-1 ${overview.netBalance >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
              {overview.netBalance >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
              {formatCurrency(Math.abs(overview.netBalance))}
            </span>
            <span className="text-xs text-slate-400 mt-1">
              {overview.netBalance >= 0 ? "You are owed" : "You owe"}
            </span>
          </div>
          <div className="clay-card-elevated p-5 flex flex-col gap-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Settled</span>
            <span className="text-2xl font-black font-sans text-slate-800">
              {formatCurrency(overview.totalSettled)}
            </span>
            <span className="text-xs text-slate-400 mt-1">Payments confirmed</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Monthly Trend Chart */}
          <div className="clay-card-elevated p-5 lg:col-span-2 flex flex-col h-[360px]">
            <h3 className="font-display font-bold text-sm text-slate-700 mb-4">Spending Trend (6 Months)</h3>
            <div className="flex-1 min-h-0">
              {monthlyTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis 
                      dataKey="month" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fill: '#94A3B8' }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fill: '#94A3B8' }}
                      tickFormatter={(value) => `₹${value.toLocaleString('en-IN')}`}
                    />
                    <Tooltip 
                      formatter={(value: any) => [formatCurrency(value), "Spent"]}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Area type="monotone" dataKey="amount" stroke="#6366F1" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-sm">No trend data available</div>
              )}
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="clay-card-elevated p-5 flex flex-col h-[360px]">
            <h3 className="font-display font-bold text-sm text-slate-700 mb-2">By Category</h3>
            <div className="flex-1 min-h-0 flex flex-col justify-center">
              {categoryBreakdown.length > 0 ? (
                <>
                  <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryBreakdown}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={4}
                          dataKey="amount"
                          stroke="none"
                        >
                          {categoryBreakdown.map((_entry, index) => (
                            <Cell key={`cell-\${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: any) => formatCurrency(value)}
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2 mt-2 max-h-[100px] overflow-y-auto pr-1">
                    {categoryBreakdown.map((cat, index) => (
                      <div key={cat.category} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="size-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                          <span className="text-slate-600 capitalize">{cat.category.toLowerCase()}</span>
                        </div>
                        <span className="font-bold text-slate-800">{formatCurrency(cat.amount)}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center text-slate-400 text-sm">No category data</div>
              )}
            </div>
          </div>

          {/* Top Groups */}
          <div className="clay-card-elevated p-5 lg:col-span-3 flex flex-col h-[320px]">
            <h3 className="font-display font-bold text-sm text-slate-700 mb-4">Top Groups by Spending</h3>
            <div className="flex-1 min-h-0">
              {topGroups.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topGroups} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      axisLine={false} 
                      tickLine={false} 
                      width={120}
                      tick={{ fontSize: 12, fill: '#64748B', fontWeight: 600 }}
                    />
                    <Tooltip 
                      formatter={(value: any) => formatCurrency(value)}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      cursor={{ fill: '#F8FAFC' }}
                    />
                    <Bar dataKey="totalSpent" name="Total Spent" fill="#6366F1" radius={[0, 4, 4, 0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-sm">No group data available</div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
