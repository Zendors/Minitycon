// Web Mining Tycoon — Single-file React component
// Drop this file as `App.jsx` into a Create React App / Vite React project
// Uses Tailwind CSS for styling (Vercel + Tailwind recommended)
// Features:
// - Click-to-mine + auto mining (miners/rigs)
// - Shop with upgrades
// - Persistent save (localStorage)
// - Export/Import save JSON
// - Basic achievements
// - Responsive layout

import React, { useEffect, useState, useRef } from "react";

export default function WebMiningTycoon() {
  // Core resources
  const [coins, setCoins] = useState(0);
  const [hashPower, setHashPower] = useState(1); // affects income per click and per second

  // Assets
  const [miners, setMiners] = useState(0);
  const [rigs, setRigs] = useState(0);
  const [farms, setFarms] = useState(0);

  // Upgrades (multipliers)
  const [clickMultiplier, setClickMultiplier] = useState(1);
  const [autoMultiplier, setAutoMultiplier] = useState(1);

  // Prices
  const basePrices = useRef({
    miner: 10,
    rig: 200,
    farm: 2000,
  });

  // Shop: upgrade tiers
  const [upgrades, setUpgrades] = useState({
    "better-chip": { level: 0, baseCost: 50, desc: "Increase hash per click" },
    "cooling": { level: 0, baseCost: 250, desc: "Increase auto mining efficiency" },
  });

  // Game tick and timer
  const [elapsed, setElapsed] = useState(0);
  const tickRef = useRef(null);

  // Achievements
  const [achievements, setAchievements] = useState([]);

  // For toasts / feedback
  const [message, setMessage] = useState(null);
  useEffect(() => {
    if (!message) return;
    const id = setTimeout(() => setMessage(null), 2500);
    return () => clearTimeout(id);
  }, [message]);

  // Derived incomes
  const clickIncome = Math.floor(1 * hashPower * clickMultiplier);
  const autoIncomePerSecond = (miners * 0.5 + rigs * 5 + farms * 30) * autoMultiplier * hashPower;

  // Mining action (click)
  function mineOnce() {
    setCoins((c) => c + clickIncome);
    setMessage(`+${clickIncome} coins`);
  }

  // Buy asset utility
  function buyAsset(type) {
    const price = Math.floor(basePrices.current[type] * Math.pow(1.15, getAssetCount(type)));
    if (coins < price) {
      setMessage('Tidak cukup koin — dapatkan lebih banyak!');
      return;
    }
    setCoins((c) => c - price);
    if (type === 'miner') setMiners((n) => n + 1);
    if (type === 'rig') setRigs((n) => n + 1);
    if (type === 'farm') setFarms((n) => n + 1);
    setMessage(`Membeli 1 ${type}`);
  }

  function getAssetCount(type) {
    if (type === 'miner') return miners;
    if (type === 'rig') return rigs;
    if (type === 'farm') return farms;
    return 0;
  }

  // Buy upgrade
  function buyUpgrade(key) {
    const up = upgrades[key];
    const cost = Math.floor(up.baseCost * Math.pow(2, up.level));
    if (coins < cost) {
      setMessage("Koin tidak cukup untuk upgrade");
      return;
    }
    setCoins((c) => c - cost);
    setUpgrades((prev) => ({ ...prev, [key]: { ...prev[key], level: prev[key].level + 1 } }));

    // apply effect
    if (key === 'better-chip') {
      setClickMultiplier((m) => m * 1.5);
      setHashPower((h) => h * 1.2);
    }
    if (key === 'cooling') {
      setAutoMultiplier((m) => m * 1.4);
    }
    setMessage('Upgrade berhasil!');
  }

  // Passive tick
  useEffect(() => {
    tickRef.current = setInterval(() => {
      setCoins((c) => c + autoIncomePerSecond / 10); // tick 10x per second
      setElapsed((e) => e + 100);
    }, 100);
    return () => clearInterval(tickRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [miners, rigs, farms, autoMultiplier, hashPower]);

  // Achievements checker
  useEffect(() => {
    const newAchievements = [];
    if (miners >= 10 && !achievements.includes('10 miners')) newAchievements.push('10 miners');
    if (coins >= 10000 && !achievements.includes('10k coins')) newAchievements.push('10k coins');
    if (rigs >= 5 && !achievements.includes('5 rigs')) newAchievements.push('5 rigs');
    if (newAchievements.length) setAchievements((a) => [...a, ...newAchievements]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [miners, rigs, coins]);

  // Save/load
  useEffect(() => {
    const raw = localStorage.getItem('web-mining-tycoon-save');
    if (raw) {
      try {
        const s = JSON.parse(raw);
        setCoins(s.coins || 0);
        setHashPower(s.hashPower || 1);
        setMiners(s.miners || 0);
        setRigs(s.rigs || 0);
        setFarms(s.farms || 0);
        setClickMultiplier(s.clickMultiplier || 1);
        setAutoMultiplier(s.autoMultiplier || 1);
        setUpgrades(s.upgrades || upgrades);
        setAchievements(s.achievements || []);
        setMessage('Save loaded');
      } catch (e) {
        console.warn('Failed to parse save', e);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const s = {
      coins, hashPower, miners, rigs, farms, clickMultiplier, autoMultiplier, upgrades, achievements,
    };
    localStorage.setItem('web-mining-tycoon-save', JSON.stringify(s));
  }, [coins, hashPower, miners, rigs, farms, clickMultiplier, autoMultiplier, upgrades, achievements]);

  function resetGame() {
    if (!window.confirm('Reset game? Semua progress akan hilang.')) return;
    setCoins(0); setHashPower(1); setMiners(0); setRigs(0); setFarms(0);
    setClickMultiplier(1); setAutoMultiplier(1); setUpgrades({
      "better-chip": { level: 0, baseCost: 50, desc: "Increase hash per click" },
      "cooling": { level: 0, baseCost: 250, desc: "Increase auto mining efficiency" },
    });
    setAchievements([]);
    setMessage('Game disetel ulang');
  }

  function exportSave() {
    const s = localStorage.getItem('web-mining-tycoon-save');
    const blob = new Blob([s || '{}'], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'web-mining-tycoon-save.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  function importSaveFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const s = JSON.parse(reader.result);
        localStorage.setItem('web-mining-tycoon-save', JSON.stringify(s));
        window.location.reload();
      } catch (err) {
        alert('File save tidak valid');
      }
    };
    reader.readAsText(f);
  }

  // Helpers for UI price display
  function priceFor(type) {
    return Math.floor(basePrices.current[type] * Math.pow(1.15, getAssetCount(type)));
  }

  function upgradePrice(key) {
    const u = upgrades[key];
    return Math.floor(u.baseCost * Math.pow(2, u.level));
  }

  // Small UI
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 text-white p-6">
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-slate-900/50 rounded-2xl p-6 shadow-lg">
          <h1 className="text-2xl font-bold">Web Mining Tycoon</h1>
          <p className="text-sm text-slate-300 mt-1">Main klik, beli rig, upgrade, dominasi subdomain vercel.app mu!</p>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="bg-slate-800/40 p-4 rounded-xl">
              <h2 className="text-lg font-semibold">Koin</h2>
              <div className="text-3xl font-mono mt-2">{Math.floor(coins)}</div>
              <div className="text-sm text-slate-300">Hash power: {hashPower.toFixed(2)}</div>
              <div className="text-sm text-slate-300">Auto income/sec: {autoIncomePerSecond.toFixed(2)}</div>
            </div>

            <div className="bg-slate-800/40 p-4 rounded-xl flex flex-col justify-between">
              <div>
                <h2 className="text-lg font-semibold">Mine</h2>
                <p className="text-sm text-slate-300 mt-1">Klik tombol atau gunakan asset untuk mendapat koin.</p>
              </div>
              <div className="mt-4">
                <button onClick={mineOnce} className="w-full py-3 rounded-xl bg-amber-500 text-slate-900 font-bold hover:opacity-90">Mine (+{clickIncome})</button>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-semibold">Shop</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
              <div className="bg-slate-800/40 p-4 rounded-xl">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-semibold">Miner</div>
                    <div className="text-sm text-slate-300">Low-level worker (+0.5/s)</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono">{priceFor('miner')}</div>
                    <div className="text-xs text-slate-400">Owned: {miners}</div>
                  </div>
                </div>
                <button onClick={() => buyAsset('miner')} className="mt-3 w-full py-2 rounded-md bg-slate-700/60">Beli</button>
              </div>

              <div className="bg-slate-800/40 p-4 rounded-xl">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-semibold">Rig</div>
                    <div className="text-sm text-slate-300">GPU rig (+5/s)</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono">{priceFor('rig')}</div>
                    <div className="text-xs text-slate-400">Owned: {rigs}</div>
                  </div>
                </div>
                <button onClick={() => buyAsset('rig')} className="mt-3 w-full py-2 rounded-md bg-slate-700/60">Beli</button>
              </div>

              <div className="bg-slate-800/40 p-4 rounded-xl">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-semibold">Farm</div>
                    <div className="text-sm text-slate-300">Mining farm (+30/s)</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono">{priceFor('farm')}</div>
                    <div className="text-xs text-slate-400">Owned: {farms}</div>
                  </div>
                </div>
                <button onClick={() => buyAsset('farm')} className="mt-3 w-full py-2 rounded-md bg-slate-700/60">Beli</button>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-semibold">Upgrades</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              {Object.keys(upgrades).map((k) => (
                <div key={k} className="bg-slate-800/40 p-4 rounded-xl">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold">{k}</div>
                      <div className="text-sm text-slate-300">{upgrades[k].desc}</div>
                      <div className="text-xs text-slate-400 mt-1">Level: {upgrades[k].level}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono">{upgradePrice(k)}</div>
                      <button onClick={() => buyUpgrade(k)} className="mt-2 w-full py-1 rounded-md bg-amber-500 text-slate-900">Upgrade</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        <aside className="bg-slate-900/50 rounded-2xl p-6 shadow-lg">
          <h2 className="text-xl font-semibold">Control Panel</h2>
          <div className="mt-4 space-y-3">
            <div>
              <div className="text-sm text-slate-300">Elapsed: {(elapsed/1000).toFixed(1)} s</div>
            </div>

            <div>
              <button onClick={exportSave} className="w-full py-2 rounded-md bg-slate-700/60">Export Save</button>
              <label className="block mt-2 text-sm text-slate-300">Import Save</label>
              <input type="file" accept="application/json" onChange={importSaveFile} className="mt-1 w-full text-sm text-slate-200" />
            </div>

            <div>
              <button onClick={resetGame} className="w-full py-2 rounded-md bg-red-600">Reset Game</button>
            </div>

            <div>
              <h4 className="font-semibold">Achievements</h4>
              <ul className="text-sm text-slate-300 mt-2 list-disc list-inside max-h-48 overflow-auto">
                {achievements.length ? achievements.map((a, i) => <li key={i}>{a}</li>) : <li className="text-slate-500">Belum ada</li>}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold">Tips</h4>
              <p className="text-sm text-slate-300">Deploy this app to a vercel project. Subdomain will be &lt;project-name&gt;.vercel.app — gunakan nama proyek yang unik.</p>
            </div>

          </div>
        </aside>
      </div>

      {/* Toast message */}
      {message && (
        <div className="fixed right-6 bottom-6 bg-amber-400 text-slate-900 px-4 py-2 rounded-md shadow-lg">{message}</div>
      )}

      <footer className="max-w-5xl mx-auto text-center mt-8 text-slate-400 text-sm">Made for Vercel subdomain — tweak &amp; deploy!</footer>
    </div>
  );
}

/*
Deployment notes (small):
1. Create a new Vite React project or Next.js app. For Vercel, Next.js is recommended but Vite/CRA works too.
2. Add Tailwind CSS (official tailwind setup) or change classNames to plain CSS.
3. Put this component into pages/index.jsx (Next.js) or App.jsx (Vite/CRA) and ensure default export.
4. Push to GitHub and connect repo to Vercel. Vercel will build and publish to https://<project-name>.vercel.app

Optional enhancements you can add later:
- Prestige/reset with permanent multipliers
- Multiple currencies / resource types
- Animated charts and progression
- Social leaderboards (requires backend)
*/
