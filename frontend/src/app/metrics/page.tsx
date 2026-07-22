"use client";

import { useState, useEffect } from "react";
import { AppShell } from "../../components/AppShell";
import { useI18n } from "../../lib/i18n";
import { TrendingUp, TrendingDown, Users, Clock, AlertTriangle, CheckCircle, BarChart3, Activity } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "up" | "down" | "neutral";
  icon: React.ReactNode;
  color: string;
}

function MetricCard({ title, value, change, changeType, icon, color }: MetricCardProps) {
  const changeColor = changeType === "up" ? "text-green-600 dark:text-green-400" :
                      changeType === "down" ? "text-red-600 dark:text-red-400" :
                      "text-gray-500 dark:text-gray-400";
  const changeIcon = changeType === "up" ? <TrendingUp className="w-3 h-3" /> :
                     changeType === "down" ? <TrendingDown className="w-3 h-3" /> : null;

  return (
    <div className="rounded-xl border border-slate-200 dark:border-halo-border bg-white dark:bg-halo-card p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className={`rounded-lg p-3 ${color} bg-opacity-10`}>
          {icon}
        </div>
        {change && (
          <div className={`flex items-center gap-1 text-sm font-medium ${changeColor}`}>
            {changeIcon}
            <span>{change}</span>
          </div>
        )}
      </div>
      <h3 className="text-sm font-medium text-slate-600 dark:text-halo-muted">{title}</h3>
      <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}

interface ChartDataPoint {
  date: string;
  value: number;
}

function SparklineChart({ data, color, height = 60 }: { data: { date: string; value: number }[]; color: string; height?: number }) {
  if (data.length < 2) return <div className="h-[60px]" />;
  
  const values = data.map(d => d.value);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((d.value - min) / (max - min || 1)) * 100;
    return `${x}% ${y}%`;
  }).join(", ");

  return (
    <svg className="w-full h-[60px]" viewBox="0 0 100 100" preserveAspectRatio="none">
      <defs>
        <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,100 ${points} 100,100`} fill="url(#gradient)" />
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

interface PilotMetrics {
  dailyActiveMOs: number;
  dailyActiveMOsChange: string;
  avgTimePerPatient: number;
  avgTimePerPatientChange: string;
  evalScore: number;
  evalScoreChange: string;
  redFlagDetection: number;
  redFlagDetectionChange: string;
  totalTriages: number;
  overrideRate: number;
  writebackSuccess: number;
  patientSatisfaction: number;
  triagesByArchetype: Record<string, number>;
  triagesByDay: { date: string; value: number }[];
  activeMOsByDay: { date: string; value: number }[];
  avgTimeByDay: { date: string; value: number }[];
}

const archetypeLabels: Record<string, string> = {
  uncontrolled_dm: "Uncontrolled DM",
  missed_tb_fu: "Missed TB FU",
  polypharmacy_elderly: "Polypharmacy Elderly",
  high_risk_anc: "High-Risk ANC",
  faltering_growth: "Faltering Growth"
};

function generateMockMetrics(timeRange: string) {
  const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() - days);

  const triagesByDay: { date: string; value: number }[] = [];
  const activeMOsByDay: { date: string; value: number }[] = [];
  const avgTimeByDay: { date: string; value: number }[] = [];

  for (let i = 0; i < days; i++) {
    const date = new Date(baseDate);
    date.setDate(baseDate.getDate() + i);
    const dateStr = date.toISOString().split("T")[0];

    const baseTriages = 45 + Math.random() * 30;
    const weekend = date.getDay() === 0 || date.getDay() === 6;
    triagesByDay.push({
      date: dateStr,
      value: Math.round(baseTriages * (weekend ? 0.6 : 1))
    });

    activeMOsByDay.push({
      date: dateStr,
      value: Math.round(180 + Math.random() * 40)
    });

    avgTimeByDay.push({
      date: dateStr,
      value: Math.round(2.8 + Math.random() * 0.8)
    });
  }

  return {
    dailyActiveMOs: 187,
    dailyActiveMOsChange: "+12% vs last week",
    avgTimePerPatient: 2.5,
    avgTimePerPatientChange: "-15% vs baseline",
    evalScore: 9.2,
    evalScoreChange: "+0.3 vs last month",
    redFlagDetection: 96.8,
    redFlagDetectionChange: "+2.1% vs baseline",
    totalTriages: 1247,
    overrideRate: 12.3,
    writebackSuccess: 99.2,
    patientSatisfaction: 4.3,
    triagesByArchetype: {
      uncontrolled_dm: 312,
      missed_tb_fu: 289,
      polypharmacy_elderly: 234,
      high_risk_anc: 215,
      faltering_growth: 197
    },
    triagesByDay,
    activeMOsByDay,
    avgTimeByDay
  };
}

export default function MetricsDashboard() {
  const { t } = useI18n();
  const [timeRange, setTimeRange] = useState("7d");
  const [metrics, setMetrics] = useState<PilotMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMetrics(generateMockMetrics(timeRange));
    setLoading(false);
  }, [timeRange]);

  if (loading) {
    return (
      <AppShell>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#1a5276] dark:border-[#5b6ee1] border-t-transparent" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Metrics Dashboard</h1>
            <p className="text-sm text-slate-500 dark:text-halo-muted">Pilot Performance Metrics — 50 PHCs across 3 States</p>
          </div>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="rounded-lg border border-slate-300 dark:border-halo-border bg-white dark:bg-halo-card px-3 py-2 text-sm text-slate-900 dark:text-white"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
        </div>
        {metrics && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              <MetricCard
                title="Daily Active MOs"
                value={metrics.dailyActiveMOs}
                change={metrics.dailyActiveMOsChange}
                changeType="up"
                icon={<Users className="w-6 h-6 text-blue-600" />}
                color="bg-blue-600"
              />
              <MetricCard
                title="Avg Time/Patient"
                value={metrics.avgTimePerPatient + " min"}
                change={metrics.avgTimePerPatientChange}
                changeType="down"
                icon={<Clock className="w-6 h-6 text-green-600" />}
                color="bg-green-600"
              />
              <MetricCard
                title="Eval Score"
                value={metrics.evalScore + "/10"}
                change={metrics.evalScoreChange}
                changeType="up"
                icon={<CheckCircle className="w-6 h-6 text-purple-600" />}
                color="bg-purple-600"
              />
              <MetricCard
                title="Red Flag Detection"
                value={metrics.redFlagDetection + "%"}
                change={metrics.redFlagDetectionChange}
                changeType="up"
                icon={<AlertTriangle className="w-6 h-6 text-red-600" />}
                color="bg-red-600"
              />
              <MetricCard
                title="Writeback Success"
                value={metrics.writebackSuccess + "%"}
                change="+0.1%"
                changeType="up"
                icon={<Activity className="w-6 h-6 text-orange-600" />}
                color="bg-orange-600"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Triages Over Time</h3>
                <div className="h-64">
                  <SparklineChart data={metrics.triagesByDay} color="#8b5cf6" height={256} />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Total: {metrics.totalTriages} triages</p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Active MOs Over Time</h3>
                <div className="h-64">
                  <SparklineChart data={metrics.activeMOsByDay} color="#10b981" height={256} />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Avg: {Math.round(metrics.activeMOsByDay.reduce((a, b) => a + b.value, 0) / metrics.activeMOsByDay.length)} MOs/day</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Avg Time Trend</h3>
                <div className="h-64">
                  <SparklineChart data={metrics.avgTimeByDay} color="#f59e0b" height={256} />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Target: {'<'}2.5 min</p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Triages by Archetype</h3>
                <div className="space-y-3">
                  {Object.entries(metrics.triagesByArchetype).map(([key, value]) => {
                    const percentage = ((value / metrics.totalTriages) * 100).toFixed(1);
                    return (
                      <div key={key} className="flex items-center gap-4">
                        <span className="w-40 text-sm text-gray-600 dark:text-gray-400">{key.replace("_", " ").toUpperCase()}</span>
                        <div className="flex-1 h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-purple-600 rounded-full transition-all duration-500"
                            style={{ width: `${((value / metrics.totalTriages) * 100)}%` }}
                          />
                        </div>
                        <span className="w-16 text-right text-sm font-medium text-gray-900 dark:text-white">
                          {value} ({percentage}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <MetricCard
                title="Total Triages"
                value={metrics.totalTriages}
                change="+15% vs last month"
                changeType="up"
                icon={<BarChart3 className="w-6 h-6 text-indigo-600" />}
                color="bg-indigo-600"
              />
              <MetricCard
                title="Override Rate"
                value={metrics.overrideRate + "%"}
                change="-2.1% vs last month"
                changeType="down"
                icon={<TrendingDown className="w-6 h-6 text-amber-600" />}
                color="bg-amber-600"
              />
              <MetricCard
                title="Patient Satisfaction"
                value={metrics.patientSatisfaction + "/5"}
                change="+0.2 vs last month"
                changeType="up"
                icon={<Users className="w-6 h-6 text-pink-600" />}
                color="bg-pink-600"
              />
              <MetricCard
                title="Red Flag Detection"
                value={metrics.redFlagDetection + "%"}
                change={metrics.redFlagDetectionChange}
                changeType="up"
                icon={<AlertTriangle className="w-6 h-6 text-red-600" />}
                color="bg-red-600"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30">
                    <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">System Health</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">All systems operational</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">99.9%</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Uptime</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{'<'}{'100ms'}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">API p95</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">0</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Critical Alerts</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                    <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Pilot Progress</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Week 3 of 8</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-gray-400">MOs Onboarded</span>
                      <span className="font-medium">187 / 200</span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full" style={{ width: "93.5%" }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-gray-400">PHCs Active</span>
                      <span className="font-medium">47 / 50</span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-green-600 rounded-full" style={{ width: "94%" }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-gray-400">States Live</span>
                      <span className="font-medium">3 / 3</span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-600 rounded-full" style={{ width: "100%" }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <button className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors">
                    Export Weekly Report
                  </button>
                  <button className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors">
                    View Alerts (0)
                  </button>
                  <button className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors">
                    Manage MOs
                  </button>
                  <button className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors">
                    PHC Settings
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}