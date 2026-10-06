import React, { useState } from 'react';
import { loginSuperuser } from '../config/superuser';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

const SuperuserLogin: React.FC<Props> = ({ onClose, onSuccess }) => {
  const [secret, setSecret] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!secret || busy) return;
    setBusy(true);
    setError('');
    const ok = await loginSuperuser(secret);
    setBusy(false);
    setSecret('');
    if (ok) onSuccess();
    else setError('Access denied.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <form onSubmit={submit} className="w-full max-w-sm bg-gray-900 border border-purple-500 rounded-lg p-6 space-y-4">
        <h2 className="text-white font-bold text-lg">Superuser access</h2>
        <input
          type="password"
          autoFocus
          autoComplete="off"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          className="w-full bg-black text-white border border-gray-600 rounded-sm px-3 py-2"
          placeholder="Secret"
        />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <div className="flex gap-3 justify-end">
          <button type="button" onClick={onClose} className="text-gray-300 px-4 py-2">
            Cancel
          </button>
          <button type="submit" disabled={busy} className="bg-purple-600 text-white px-4 py-2 rounded-sm disabled:opacity-50">
            {busy ? 'Checking…' : 'Enter'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SuperuserLogin;
