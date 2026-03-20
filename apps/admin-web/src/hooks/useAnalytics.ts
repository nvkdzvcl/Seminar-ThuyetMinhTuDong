import { useState, useEffect, useCallback } from 'react';
import type { AnalyticsSummary, DailyListenData, TopPOI, TimeRange } from '../types';
import { fetchSummary, fetchDailyData, fetchTopPOIs } from '../services/analyticsService';

export function useAnalytics() {
  const [range, setRange] = useState<TimeRange>('all');
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [dailyData, setDailyData] = useState<DailyListenData[]>([]);
  const [topPois, setTopPois] = useState<TopPOI[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (r: TimeRange) => {
    setLoading(true);
    const [s, d, t] = await Promise.all([fetchSummary(r), fetchDailyData(r), fetchTopPOIs(r)]);
    setSummary(s);
    setDailyData(d);
    setTopPois(t);
    setLoading(false);
  }, []);

  useEffect(() => { load(range); }, [range, load]);

  return { range, setRange, summary, dailyData, topPois, loading };
}
