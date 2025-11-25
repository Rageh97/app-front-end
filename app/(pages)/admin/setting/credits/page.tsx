'use client';

import React, { useEffect, useMemo, useState } from 'react';

const CreditsSettingsPage = () => {
  const [value, setValue] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const apiBase = useMemo(() => process.env.NEXT_PUBLIC_API_URL, []);

  const getHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('a') : null;
    const clientId = (global as any)?.clientId1328;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = token;
    if (clientId) headers['User-Client'] = clientId;
    return headers;
  };

  const load = async () => {
    if (!apiBase) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiBase}/api/credits/cost-per-image`);
      if (res.status === 200) {
        const data = await res.json();
        setValue(data.creditsPerImage || 1);
      } else {
        setError('Failed to load current value');
      }
    } catch (e) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    if (!apiBase) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`${apiBase}/api/credits/cost-per-image`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ value }),
      });
      if (res.status === 200) {
        setSuccess('Updated successfully');
      } else if (res.status === 401) {
        setError('Unauthorized');
      } else {
        const text = await res.text();
        setError(text || 'Failed to update');
      }
    } catch (e) {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-xl text-white font-semibold mb-4">Credits Settings</h1>
      <div className="bg-[#35214f] p-4 rounded-md inner-shadow">
        <label className="block text-white mb-2">Credits required per image</label>
        <input
          type="number"
          min={1}
          max={100}
          className="w-full rounded-md p-2 bg-white text-black"
          value={value}
          onChange={(e) => setValue(parseInt(e.target.value) || 1)}
        />
        <div className="mt-4 flex gap-3">
          <button
            onClick={save}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={load}
            disabled={loading}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md"
          >
            {loading ? 'Loading...' : 'Reload'}
          </button>
        </div>
        {error && <div className="text-red mt-3">{error}</div>}
        {success && <div className="text-green-400 mt-3">{success}</div>}
      </div>
    </div>
  );
};

export default CreditsSettingsPage;








































