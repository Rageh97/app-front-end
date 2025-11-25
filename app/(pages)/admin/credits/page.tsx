'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

type CreditPlan = {
  plan_id: number;
  plan_name: string;
  period: string;
  credits_per_period: number;
  amount: string;
  isActive: boolean;
  credits_per_image: number;
  tokens_per_credit: number;
};

export default function AdminCreditsPage() {
  const { t } = useTranslation();
  const apiBase = useMemo(() => process.env.NEXT_PUBLIC_API_URL, []);
  const [plans, setPlans] = useState<CreditPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<Partial<CreditPlan>>({ plan_name: '', period: 'month', credits_per_period: 50, amount: '0', isActive: true, credits_per_image: 1, tokens_per_credit: 1000 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<CreditPlan>>({});

  const headers = useMemo(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('a') : null;
    const clientId = (global as any).clientId1328;
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) h['Authorization'] = token;
    if (clientId) h['User-Client'] = clientId;
    return h;
  }, []);

  const loadPlans = async () => {
    if (!apiBase) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiBase}/api/credits/plans`, { headers });
      if (res.status === 200) {
        const data = await res.json();
        setPlans(data);
      } else {
        setError(t('credits.failedToLoad'));
      }
    } catch (e) {
      setError(t('credits.networkError'));
    } finally {
      setLoading(false);
    }
  };



  useEffect(() => {
    loadPlans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onCreate = async () => {
    if (!apiBase) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${apiBase}/api/credits/plans`, {
        method: 'POST',
        headers,
        body: JSON.stringify(form),
      });
      if (res.status === 200) {
        setForm({ plan_name: '', period: 'month', credits_per_period: 50, amount: '0', isActive: true });
        await loadPlans();
      } else {
        setError(t('credits.failedToCreate'));
      }
    } catch (e) {
      setError(t('credits.networkError'));
    } finally {
      setSaving(false);
    }
  };

  const onToggleActive = async (plan_id: number, isActive: boolean) => {
    if (!apiBase) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${apiBase}/api/credits/plans/${plan_id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ isActive }),
      });
      if (res.status === 200) {
        await loadPlans();
      } else {
        setError(t('credits.failedToUpdate'));
      }
    } catch (e) {
      setError(t('credits.networkError'));
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (plan_id: number) => {
    if (!apiBase) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${apiBase}/api/credits/plans/${plan_id}`, {
        method: 'DELETE',
        headers,
      });
      if (res.status === 200) {
        await loadPlans();
      } else {
        setError(t('credits.failedToDelete'));
      }
    } catch (e) {
      setError(t('credits.networkError'));
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (plan: CreditPlan) => {
    setEditingId(plan.plan_id);
    setEditForm({
      plan_name: plan.plan_name,
      period: plan.period,
      credits_per_period: plan.credits_per_period,
      amount: plan.amount,
      isActive: plan.isActive,
      credits_per_image: plan.credits_per_image,
      tokens_per_credit: plan.tokens_per_credit,
    });
  };

  const saveEdit = async () => {
    if (!apiBase || editingId == null) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${apiBase}/api/credits/plans/${editingId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(editForm),
      });
      if (res.status === 200) {
        setEditingId(null);
        setEditForm({});
        await loadPlans();
      } else {
        const text = await res.text();
        setError(text || t('credits.failedToUpdate'));
      }
    } catch (e) {
      setError(t('credits.networkError'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">

      {/* Create New Plan Form */}
      <div className="bg-[#19023790] rounded-xl p-6 text-white mb-6">
        <h2 className="text-lg font-semibold mb-4">{t('credits.createNewPlan')}</h2>
        <div className="grid md:grid-cols-6 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">{t('credits.planNameLabel')}</label>
        <input
              className="w-full px-3 py-2 rounded bg-white   outline-none text-black"
       
          value={form.plan_name ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, plan_name: e.target.value }))}
        />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">{t('credits.periodLabel')}</label>
        <select
              className="w-full px-3 py-1 rounded bg-white  text-black"
          value={form.period}
          onChange={(e) => setForm((f) => ({ ...f, period: e.target.value }))}
        >
              <option value="day">{t('credits.day')}</option>
              <option value="month">{t('credits.month')}</option>
              <option value="year">{t('credits.year')}</option>
        </select>
          </div>
          <div>
            <label className="block text-sm  font-medium mb-2">{t('credits.creditsLabel')}</label>
        <input
          type="number"
              className="w-full px-3 py-2  rounded bg-white outline-none  text-black"
              placeholder="0"
          value={form.credits_per_period ?? 0}
          onChange={(e) => setForm((f) => ({ ...f, credits_per_period: parseInt(e.target.value || '0') }))}
        />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">{t('credits.amountLabel')}</label>
        <input
              className="w-full px-3 py-2 rounded bg-white  outline-none text-black"
              placeholder="0.00"
          value={form.amount ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
        />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">{t('credits.creditsPerImageLabel')}</label>
            <input
              type="number"
              className="w-full px-3 py-2 rounded bg-white  outline-none text-black inner-shadow"
              placeholder="1"
              value={form.credits_per_image ?? 1}
              onChange={(e) => setForm((f) => ({ ...f, credits_per_image: parseInt(e.target.value || '1') }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Tokens per Credit (Chat)</label>
            <input
              type="number"
              className="w-full px-3 py-2 rounded bg-white  outline-none text-black inner-shadow"
              placeholder="1000"
              value={form.tokens_per_credit ?? 1000}
              onChange={(e) => setForm((f) => ({ ...f, tokens_per_credit: parseInt(e.target.value || '1000') }))}
            />
            <small className="text-gray-400 text-xs">Default: 1000 (1000 tokens per credit)</small>
          </div>
        </div>
        <div className="flex gap-3 mt-4">
          <button
            className=" bg-primary text-white px-4 py-2 rounded-md"
            onClick={onCreate}
            disabled={saving}
          >
            {saving ? t('credits.saving') : t('credits.createPlan')}
          </button>
          {error && <span className="text-red-300 text-sm">{error}</span>}
        </div>
      </div>

      {/* Plans Table */}
      <div className="bg-[#19023790] rounded-md overflow-hidden">
        {loading ? (
          <div className="p-6 text-center text-gray-400">{t('credits.loading')}</div>
        ) : plans.length === 0 ? (
          <div className="p-6 text-center text-gray-400">{t('credits.noPlans')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#19023790]">
                <tr>
                  <th className="px-4 py-3 text-sm font-medium  text-center text-orange font-bold">{t('credits.planNameLabel')}</th>
                  <th className="px-4 py-3 text-sm font-medium  text-center text-orange font-bold">{t('credits.periodLabel')}</th>
                  <th className="px-4 py-3 text-sm font-medium text-orange text-center font-bold">{t('credits.creditsLabel')}</th>
                  <th className="px-4 py-3 text-sm font-medium  text-center text-orange font-bold">{t('credits.amountLabel')}</th>
                  <th className="px-4 py-3 text-sm font-medium  text-center text-orange font-bold">{t('credits.creditsPerImageLabel')}</th>
                  <th className="px-4 py-3 text-sm font-medium  text-center text-orange font-bold">Tokens/Credit</th>
                  {/* <th className="px-4 py-3 text-left text-sm font-medium text-white text-center">{t('credits.statusLabel')}</th> */}
                  <th className="px-4 py-3 text-sm font-medium  text-center text-orange font-bold">{t('credits.actionsLabel')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2b1a40]">
                {plans.map((p) => (
                  <tr key={p.plan_id} className="hover:bg-[#2b1a40]/50">
                    {editingId === p.plan_id ? (
                      <>
                        <td className="px-4 py-3">
                          <input
                            className="w-full rounded-md p-2 bg-[#2b1a40] text-white text-sm"
                            value={editForm.plan_name ?? ''}
                            onChange={(e) => setEditForm((f) => ({ ...f, plan_name: e.target.value }))}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <select
                            className="w-full rounded-md p-2 bg-[#2b1a40] text-white text-sm"
                            value={editForm.period ?? 'month'}
                            onChange={(e) => setEditForm((f) => ({ ...f, period: e.target.value }))}
                          >
                            <option value="day">{t('credits.day')}</option>
                            <option value="month">{t('credits.month')}</option>
                            <option value="year">{t('credits.year')}</option>
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            className="w-full rounded-md p-2 bg-[#2b1a40] text-white text-sm"
                            value={editForm.credits_per_period ?? 0}
                            onChange={(e) => setEditForm((f) => ({ ...f, credits_per_period: parseInt(e.target.value) || 0 }))}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            className="w-full rounded-md p-2 bg-[#2b1a40] text-white text-sm"
                            value={editForm.amount ?? ''}
                            onChange={(e) => setEditForm((f) => ({ ...f, amount: e.target.value }))}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            className="w-full rounded-md p-2 bg-[#2b1a40] text-white text-sm"
                            value={editForm.credits_per_image ?? 1}
                            onChange={(e) => setEditForm((f) => ({ ...f, credits_per_image: parseInt(e.target.value) || 1 }))}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            className="w-full rounded-md p-2 bg-[#2b1a40] text-white text-sm"
                            value={editForm.tokens_per_credit ?? 1000}
                            onChange={(e) => setEditForm((f) => ({ ...f, tokens_per_credit: parseInt(e.target.value) || 1000 }))}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={!!editForm.isActive}
                              onChange={(e) => setEditForm((f) => ({ ...f, isActive: e.target.checked }))}
                            />
                            {t('credits.isActive')}
                          </label>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={saveEdit}
                              disabled={saving}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                            >
                              {saving ? t('credits.saving') : t('credits.save')}
                            </button>
                            <button
                              onClick={() => { setEditingId(null); setEditForm({}); }}
                              className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm"
                            >
                              {t('credits.cancel')}
                            </button>
              </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3 text-white font-medium text-center">{p.plan_name}</td>
                        <td className="px-4 py-3 text-white text-center">{p.period}</td>
                        <td className="px-4 py-3 text-white text-center">{p.credits_per_period}</td>
                        <td className="px-4 py-3 text-white text-center">${p.amount}</td>
                        <td className="px-4 py-3 text-white text-center">{p.credits_per_image}</td>
                        <td className="px-4 py-3 text-white text-center">{p.tokens_per_credit || 1000}</td>
                        {/* <td className="px-4 py-3 text-center">
                <button
                            className={`px-3 py-1 rounded text-sm ${p.isActive ? 'bg-green-600 text-white' : 'bg-gray-600 text-white'}`}
                  onClick={() => onToggleActive(p.plan_id, !p.isActive)}
                  disabled={saving}
                >
                            {p.isActive ? t('credits.active') : t('credits.inactive')}
                          </button>
                        </td> */}
                        <td className="px-4 py-3 flex justify-center">
                          <div className="flex gap-2">
                            <button
                              className="px-1 py-1 rounded bg-primary text-white text-sm hover:bg-blue-700"
                              onClick={() => startEdit(p)}
                              disabled={saving}
                            >
                              {t('credits.edit')}
                </button>
                <button
                              className="px-1 py-1 rounded bg-red text-white text-sm hover:bg-red-700"
                  onClick={() => onDelete(p.plan_id)}
                  disabled={saving}
                >
                              {t('credits.delete')}
                </button>
              </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
        )}
      </div>
    </div>
  );
}








