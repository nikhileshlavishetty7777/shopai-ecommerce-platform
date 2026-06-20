import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { FiTrendingUp, FiTarget, FiActivity } from 'react-icons/fi';
import { aiService } from '../../services/endpoints';
import { FullPageSpinner } from '../../components/ui/Common';

const AdminForecastPage = () => {
  const [forecast, setForecast] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  const load = (d) => {
    setLoading(true);
    Promise.all([
      aiService.forecastRevenue(d),
      aiService.revenueSummary(),
    ]).then(([f, s]) => {
      setForecast(f.data);
      setSummary(s.data);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(days); }, [days]);

  if (loading || !forecast) return <FullPageSpinner />;

  const chartData = [
    ...forecast.historical.map((h) => ({ date: h.date, actual: h.revenue, forecast: null })),
    ...forecast.forecast.map((f) => ({ date: f.date, actual: null, forecast: f.revenue })),
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="font-display font-bold text-2xl flex items-center gap-2"><FiTrendingUp /> AI Sales Forecast</h1>
        <select value={days} onChange={(e) => setDays(Number(e.target.value))} className="input-field py-2 text-sm w-40">
          <option value={7}>Next 7 days</option>
          <option value={30}>Next 30 days</option>
          <option value={60}>Next 60 days</option>
          <option value={90}>Next 90 days</option>
        </select>
      </div>

      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Today', value: summary.today },
            { label: 'This Week', value: summary.this_week },
            { label: 'This Month', value: summary.this_month },
            { label: 'This Year', value: summary.this_year },
          ].map((item) => (
            <div key={item.label} className="glass-card p-4">
              <p className="text-xs text-gray-400 mb-1">{item.label}</p>
              <p className="font-display font-bold text-xl">₹{item.value.toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-2 text-primary"><FiTarget size={16} /><span className="text-sm font-medium">Total Forecast</span></div>
          <p className="font-display font-bold text-2xl">₹{forecast.total_forecast.toLocaleString()}</p>
          <p className="text-xs text-gray-400">Next {days} days</p>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-2 text-accent"><FiActivity size={16} /><span className="text-sm font-medium">Avg Daily Forecast</span></div>
          <p className="font-display font-bold text-2xl">₹{forecast.avg_daily_forecast.toLocaleString()}</p>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-2 text-success"><FiTrendingUp size={16} /><span className="text-sm font-medium">Growth Rate</span></div>
          <p className="font-display font-bold text-2xl">{forecast.growth_rate}%</p>
          <p className="text-xs text-gray-400">Week-over-week</p>
        </div>
      </div>

      <div className="glass-card p-6">
        <h3 className="font-semibold mb-1">Revenue Forecast (Linear Regression Model)</h3>
        <p className="text-xs text-gray-400 mb-4">
          Model accuracy: R² = {forecast.model_accuracy.r2_score} | MAE = ₹{forecast.model_accuracy.mae}
        </p>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="date" stroke="#94A3B8" fontSize={10} tickFormatter={(d) => d.slice(5)} />
            <YAxis stroke="#94A3B8" fontSize={11} />
            <Tooltip contentStyle={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 8 }} />
            <Legend />
            <Area type="monotone" dataKey="actual" name="Actual Revenue" stroke="#4F46E5" fill="url(#actualGrad)" strokeWidth={2} connectNulls />
            <Area type="monotone" dataKey="forecast" name="Forecasted Revenue" stroke="#06B6D4" fill="url(#forecastGrad)" strokeWidth={2} strokeDasharray="5 5" connectNulls />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AdminForecastPage;
