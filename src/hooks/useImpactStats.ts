import { useState, useEffect, useCallback } from 'react';
import { ImpactStats } from '../types';
import { api } from '../services/api';

const INITIAL_STATS: ImpactStats = {
  time_wasted_min: 47,
  money_saved_inr: 300000,
  mule_accounts_exposed: 4,
  scam_calls_blocked: 14,
  scam_messages_blocked: 31,
  weekly_trend: [4, 7, 11, 8, 15, 23],
};

export function useImpactStats(pollIntervalMs: number = 10000) {
  const [stats, setStats] = useState<ImpactStats>(INITIAL_STATS);
  const [loading, setLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    const data = await api.getImpactStats();
    if (data) {
      setStats({
        time_wasted_min: data.time_wasted_min ?? INITIAL_STATS.time_wasted_min,
        money_saved_inr: data.money_saved_inr ?? INITIAL_STATS.money_saved_inr,
        mule_accounts_exposed: data.mule_accounts_exposed ?? INITIAL_STATS.mule_accounts_exposed,
        scam_calls_blocked: data.scam_calls_blocked ?? INITIAL_STATS.scam_calls_blocked,
        scam_messages_blocked: data.scam_messages_blocked ?? INITIAL_STATS.scam_messages_blocked,
        weekly_trend: data.weekly_trend ?? INITIAL_STATS.weekly_trend,
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, pollIntervalMs);
    return () => clearInterval(interval);
  }, [fetchStats, pollIntervalMs]);

  return { stats, loading, refreshStats: fetchStats };
}
