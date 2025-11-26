import React, { useState } from "react";

// Simple single-file React component for a Used Motorcycle Assessment web app
// Tailwind CSS classes are used for styling. Export default component at bottom.

const currentYear = new Date().getFullYear();

function computeValuation(data) {
  // Basic valuation algorithm (example):
  // Start from "marketPrice" (user input). Apply depreciation by age and mileage,
  // then adjust by condition score and other factors.
  const age = Math.max(0, currentYear - Number(data.year || currentYear));
  const mileage = Number(data.mileage || 0);
  const base = Number(data.marketPrice || 0);

  // Age depreciation: 5% per year
  const ageDep = 0.05 * age;

  // Mileage factor: per 10k km -> 1.5% additional depreciation
  const mileageDep = 0.015 * Math.floor(mileage / 10000);

  // Condition score: each of 5 checks 0-2 (0=bad,1=fair,2=good). Normalize 0..1
  const condSum = (data.condition || []).reduce((s, v) => s + Number(v || 0), 0);
  const conditionFactor = condSum / (5 * 2); // 0..1

  // Accident penalty
  const accidentPenalty = data.accident === "yes" ? 0.12 : 0;

  // Modifications adjustment: if major mods decrease value, minor may increase
  let modAdj = 0;
  if (data.modifications === "major") modAdj = -0.08;
  if (data.modifications === "minor") modAdj = 0.02;

  // Service history bonus
  const serviceBonus = data.fullService === "yes" ? 0.03 : 0;

  // Compute total depreciation factor
  let totalDep = ageDep + mileageDep + (1 - conditionFactor) * 0.2 + accidentPenalty - modAdj - serviceBonus;
  // Clamp
  if (totalDep < 0) totalDep = 0;
  if (totalDep > 0.9) totalDep = 0.9;

  const estimatedPrice = Math.round(base * (1 - totalDep));

  // Build breakdown
  const breakdown = {
    base,
    age,
    ageDep: +(ageDep * 100).toFixed(2) + "%",
    mileageDep: +(mileageDep * 100).toFixed(2) + "%",
    conditionFactor: +conditionFactor.toFixed(2),
    accidentPenalty: +(accidentPenalty * 100).toFixed(2) + "%",
    modAdj: +(modAdj * 100).toFixed(2) + "%",
    serviceBonus: +(serviceBonus * 100).toFixed(2) + "%",
    totalDep: +(totalDep * 100).toFixed(2) + "%",
    estimatedPrice,
  };

  return breakdown;
}

export default function MotorAssessmentApp() {
  const [form, setForm] = useState({
    brand: "",
    model: "",
    year: currentYear,
    mileage: 0,
    marketPrice: 0,
    condition: [2, 2, 2, 2, 2],
    accident: "no",
    modifications: "none",
    fullService: "no",
    notes: "",
  });

  const [result, setResult] = useState(null);

  function handleChange(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleCondChange(index, value) {
    const c = [...form.condition];
    c[index] = Number(value);
    setForm((f) => ({ ...f, condition: c }));
  }

  function onEvaluate(e) {
    e && e.preventDefault();
    const breakdown = computeValuation(form);
    setResult(breakdown);
  }

  function downloadJSON() {
    const payload = { meta: { createdAt: new Date().toISOString() }, form, result };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${form.brand || 'motor'}_${form.model || 'report'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function reset() {
    setForm({
      brand: "",
      model: "",
      year: currentYear,
      mileage: 0,
      marketPrice: 0,
      condition: [2, 2, 2, 2, 2],
      accident: "no",
      modifications: "none",
      fullService: "no",
      notes: "",
    });
    setResult(null);
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-2xl p-6">
        <header className="mb-6">
          <h1 className="text-2xl font-bold">Aplikasi Penilaian Motor Bekas</h1>
          <p className="text-sm text-gray-600">Masukkan data motor, dapatkan skor kondisi dan estimasi harga.</p>
        </header>

        <form onSubmit={onEvaluate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Merek</label>
            <input value={form.brand} onChange={(e) => handleChange("brand", e.target.value)} className="mt-1 w-full rounded-md border p-2" placeholder="Honda/Yamaha..." />
          </div>

          <div>
            <label className="block text-sm font-medium">Model</label>
            <input value={form.model} onChange={(e) => handleChange("model", e.target.value)} className="mt-1 w-full rounded-md border p-2" placeholder="Contoh: Beat, NMAX..." />
          </div>

          <div>
            <label className="block text-sm font-medium">Tahun</label>
            <input type="number" value={form.year} onChange={(e) => handleChange("year", e.target.value)} className="mt-1 w-full rounded-md border p-2" min="1990" max={currentYear} />
          </div>

          <div>
            <label className="block text-sm font-medium">Kilometer (km)</label>
            <input type="number" value={form.mileage} onChange={(e) => handleChange("mileage", e.target.value)} className="mt-1 w-full rounded-md border p-2" />
          </div>

          <div>
            <label className="block text-sm font-medium">Harga Pasar (Rp)</label>
            <input type="number" value={form.marketPrice} onChange={(e) => handleChange("marketPrice", e.target.value)} className="mt-1 w-full rounded-md border p-2" />
          </div>

          <div>
            <label className="block text-sm font-medium">Riwayat Lengkap Service?</label>
            <select value={form.fullService} onChange={(e) => handleChange("fullService", e.target.value)} className="mt-1 w-full rounded-md border p-2">
              <option value="no">Tidak</option>
              <option value="yes">Ya (Buku/Struk)</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <h3 className="font-semibold">Checklist Kondisi (0=Buruk, 1=Cukup, 2=Baik)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
              {["Mesin","Suspensi","Ban","Body & Cat","Elektrikal"].map((label, i) => (
                <div key={i} className="border rounded p-2">
                  <div className="text-sm font-medium">{label}</div>
                  <select value={form.condition[i]} onChange={(e) => handleCondChange(i, e.target.value)} className="mt-1 w-full rounded-md border p-2">
                    <option value={0}>0 - Buruk</option>
                    <option value={1}>1 - Cukup</option>
                    <option value={2}>2 - Baik</option>
                  </select>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium">Pernah Kecelakaan?</label>
            <select value={form.accident} onChange={(e) => handleChange("accident", e.target.value)} className="mt-1 w-full rounded-md border p-2">
              <option value="no">Tidak</option>
              <option value="yes">Ya</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium">Modifikasi</label>
            <select value={form.modifications} onChange={(e) => handleChange("modifications", e.target.value)} className="mt-1 w-full rounded-md border p-2">
              <option value="none">Tidak ada</option>
              <option value="minor">Minor (aksesoris, jok, knalpot standar)</option>
              <option value="major">Major (ganti mesin/overhaul besar)</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium">Catatan / Kondisi Tambahan</label>
            <textarea value={form.notes} onChange={(e) => handleChange("notes", e.target.value)} className="mt-1 w-full rounded-md border p-2" rows={3} />
          </div>

          <div className="md:col-span-2 flex gap-3 justify-end">
            <button type="button" onClick={reset} className="px-4 py-2 rounded-xl border">Reset</button>
            <button type="submit" className="px-4 py-2 rounded-xl bg-indigo-600 text-white">Evaluasi</button>
          </div>
        </form>

        {/* Result panel */}
        {result && (
          <section className="mt-6 border-t pt-4">
            <h2 className="text-xl font-semibold">Hasil Penilaian</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
              <div className="bg-gray-50 rounded p-4">
                <p className="text-sm text-gray-600">Motor</p>
                <div className="font-medium text-lg">{form.brand} {form.model} — {form.year}</div>
                <div className="text-sm">Kilometer: {form.mileage} km</div>
                <div className="text-sm">Harga Pasar: Rp {Number(form.marketPrice).toLocaleString()}</div>
                <div className="mt-2">Estimasi Harga Jual: <span className="font-bold text-2xl">Rp {Number(result.estimatedPrice).toLocaleString()}</span></div>
              </div>

              <div className="rounded p-4 border">
                <h3 className="font-semibold">Rincian</h3>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>Depresiasi usia: {result.ageDep}</li>
                  <li>Depresiasi kilometer: {result.mileageDep}</li>
                  <li>Pengaruh kondisi: {(100 - parseFloat(result.totalDep)).toFixed(0)}% kondisi relatif</li>
                  <li>Penalty kecelakaan: {result.accidentPenalty}</li>
                  <li>Penyesuaian modifikasi: {result.modAdj}</li>
                  <li>Bonus service: {result.serviceBonus}</li>
                </ul>
              </div>
            </div>

            <div className="mt-4 flex gap-3 justify-end">
              <button onClick={downloadJSON} className="px-4 py-2 rounded-xl border">Download JSON</button>
              <button onClick={() => window.print()} className="px-4 py-2 rounded-xl bg-green-600 text-white">Cetak/Laporan</button>
            </div>
          </section>
        )}

        <footer className="mt-6 text-xs text-gray-500">
          <div>Algoritma estimasi hanya contoh — sesuaikan parameter dan harga pasar untuk hasil lebih akurat.</div>
        </footer>
      </div>
    </div>
  );
}
