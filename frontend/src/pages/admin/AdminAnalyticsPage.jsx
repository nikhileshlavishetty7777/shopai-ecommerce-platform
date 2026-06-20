import React, { useEffect, useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { analyticsService } from '../../services/endpoints';
import { FullPageSpinner } from '../../components/ui/Common';

const AdminAnalyticsPage = () => {
  const [userGrowth, setUserGrowth] = useState([]);
  const [ratingDist, setRatingDist] = useState([]);
  const [revenueTrend, setRevenueTrend] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      analyticsService.userGrowth(60),
      analyticsService.ratingDistribution(),
      analyticsService.revenueTrend(60),
    ]).then(([ug, rd, rt]) => {
      setUserGrowth(ug.data);
      setRatingDist(rd.data);
      setRevenueTrend(rt.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <FullPageSpinner />;

  return (
    <div className="space-y-6">
      <h1 className="font-display font-bold text-2xl">Analytics</h1>

      <div className="glass-card p-6">
        <h3 className="font-semibold mb-4">Revenue & Orders (60 Days)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={revenueTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="date" stroke="#94A3B8" fontSize={10} tickFormatter={(d) => d.slice(5)} />
            <YAxis yAxisId="left" stroke="#94A3B8" fontSize={11} />
            <YAxis yAxisId="right" orientation="right" stroke="#94A3B8" fontSize={11} />
            <Tooltip contentStyle={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 8 }} />
            <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#4F46E5" strokeWidth={2} dot={false} />
            <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#06B6D4" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h3 className="font-semibold mb-4">User Growth (60 Days)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={userGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" stroke="#94A3B8" fontSize={10} tickFormatter={(d) => d.slice(5)} />
              <YAxis stroke="#94A3B8" fontSize={11} />
              <Tooltip contentStyle={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 8 }} />
              <Bar dataKey="new_users" fill="#7C3AED" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-6">
          <h3 className="font-semibold mb-4">Rating Distribution</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={ratingDist}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="rating" stroke="#94A3B8" fontSize={11} />
              <YAxis stroke="#94A3B8" fontSize={11} />
              <Tooltip contentStyle={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 8 }} />
              <Bar dataKey="count" fill="#10B981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalyticsPage;
