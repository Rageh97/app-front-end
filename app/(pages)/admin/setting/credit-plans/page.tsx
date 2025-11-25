'use client';

import React, { useEffect, useMemo, useState } from 'react';

type Plan = {
  plan_id: number;
  plan_name: string;
  period: string;
  credits_per_period: number;
  amount: string;
  isActive: boolean;
};

const CreditPlansPage = () => {
  const apiBase = useMemo(() => process.env.NEXT_PUBLIC_API_URL, []);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const getHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('a') : null;
    const clientId = (global as any)?.clientId1328;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = token;
    if (clientId) headers['User-Client'] = clientId;
    return headers;
  };

  const loadPlans = async () => {
    if (!apiBase) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiBase}/api/credits/plans`);
      if (res.status === 200) {
        const data = await res.json();
        setPlans(data);
      } else {
        setError('Failed to load plans');
      }
    } catch (e) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const savePlan = async (plan: Plan) => {
    if (!apiBase) return;
    setSavingId(plan.plan_id);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`${apiBase}/api/credits/plans/${plan.plan_id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({
          plan_name: plan.plan_name,
          period: plan.period,
          credits_per_period: plan.credits_per_period,
          amount: plan.amount,
          isActive: plan.isActive,
        }),
      });
      if (res.status === 200) {
        setSuccess('Plan updated');
        await loadPlans();
      } else {
        const text = await res.text();
        setError(text || 'Update failed');
      }
    } catch (e) {
      setError('Network error');
    } finally {
      setSavingId(null);
    }
  };

  useEffect(() => { loadPlans(); }, []);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-xl text-white font-semibold mb-4">Credit Plans</h1>

      {loading ? (
        <div className="text-white">Loading...</div>
      ) : error ? (
        <div className="text-red">{error}</div>
      ) : (
        <div className="grid gap-4">
          {plans.map((plan) => (
            <div key={plan.plan_id} className="bg-[#35214f] p-4 rounded-md inner-shadow text-white">
              <div className="grid md:grid-cols-5 grid-cols-1 gap-3 items-center">
                <input
                  className="rounded-md p-2 bg-white text-black"
                  value={plan.plan_name}
                  onChange={(e) => setPlans((prev) => prev.map(p => p.plan_id === plan.plan_id ? { ...p, plan_name: e.target.value } : p))}
                />
                <select
                  className="rounded-md p-2 bg-white text-black"
                  value={plan.period}
                  onChange={(e) => setPlans((prev) => prev.map(p => p.plan_id === plan.plan_id ? { ...p, period: e.target.value } : p))}
                >
                  <option value="day">day</option>
                  <option value="month">month</option>
                  <option value="year">year</option>
                </select>
                <input
                  type="number"
                  className="rounded-md p-2 bg-white text-black"
                  value={plan.credits_per_period}
                  onChange={(e) => setPlans((prev) => prev.map(p => p.plan_id === plan.plan_id ? { ...p, credits_per_period: parseInt(e.target.value) || 0 } : p))}
                />
                <input
                  className="rounded-md p-2 bg-white text-black"
                  value={plan.amount}
                  onChange={(e) => setPlans((prev) => prev.map(p => p.plan_id === plan.plan_id ? { ...p, amount: e.target.value } : p))}
                />
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={plan.isActive}
                      onChange={(e) => setPlans((prev) => prev.map(p => p.plan_id === plan.plan_id ? { ...p, isActive: e.target.checked } : p))}
                    />
                    Active
                  </label>
                  <button
                    onClick={() => savePlan(plan)}
                    disabled={savingId === plan.plan_id}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md"
                  >
                    {savingId === plan.plan_id ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {success && <div className="text-green-400 mt-4">{success}</div>}
    </div>
  );
};

export default CreditPlansPage;








































