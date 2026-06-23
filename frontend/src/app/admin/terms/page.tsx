"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

interface ExamPeriod {
  id: string;
  term: string;
  type: string;
  name: string;
  is_open: boolean;
  starts_at: string | null;
  ends_at: string | null;
}

interface Term {
  id: string;
  name: string;
  academic_year: string;
  is_current: boolean;
  starts_at: string | null;
  ends_at: string | null;
}

export default function TermsPage() {
  const [terms, setTerms] = useState<Term[]>([]);
  const [examPeriods, setExamPeriods] = useState<ExamPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingDates, setEditingDates] = useState<Record<string, { starts_at: string; ends_at: string }>>({});
  const [editingExam, setEditingExam] = useState<Record<string, { starts_at: string; ends_at: string }>>({});

  async function fetchData() {
    try {
      const [termsRes, examsRes] = await Promise.all([
        api.get("/terms/"),
        api.get("/exam-periods/"),
      ]);
      setTerms(termsRes.data);
      setExamPeriods(examsRes.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchData() }, []);

  function formatDate(d: string | null) {
    if (!d) return "";
    return d.slice(0, 16);
  }

  function displayDate(d: string | null) {
    if (!d) return "Not set";
    return new Date(d).toLocaleDateString();
  }

  async function saveTermDates(term: Term) {
    const d = editingDates[term.id];
    if (!d) return;
    await api.patch(`/terms/${term.id}/`, {
      starts_at: d.starts_at ? new Date(d.starts_at).toISOString() : null,
      ends_at: d.ends_at ? new Date(d.ends_at).toISOString() : null,
    });
    setEditingDates(prev => { const n = { ...prev }; delete n[term.id]; return n; });
    fetchData();
  }

  async function handleSetCurrent(term: Term) {
    await api.post(`/terms/${term.id}/set_current/`);
    fetchData();
  }

  async function handleAdvance() {
    await api.post("/terms/advance/");
    fetchData();
  }

  async function saveExamDates(period: ExamPeriod) {
    const d = editingExam[period.id];
    if (!d) return;
    await api.patch(`/exam-periods/${period.id}/`, {
      starts_at: d.starts_at ? new Date(d.starts_at).toISOString() : null,
      ends_at: d.ends_at ? new Date(d.ends_at).toISOString() : null,
    });
    setEditingExam(prev => { const n = { ...prev }; delete n[period.id]; return n; });
    fetchData();
  }

  async function toggleExamOpen(period: ExamPeriod) {
    const action = period.is_open ? "close" : "open";
    await api.post(`/exam-periods/${period.id}/${action}/`);
    fetchData();
  }

  async function createExamPeriod(termId: string, type: string) {
    const name = type === "MID_TERM" ? "Mid Term" : "Terminal";
    await api.post("/exam-periods/", { term: termId, type, name });
    fetchData();
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;

  const currentTerm = terms.find(t => t.is_current);
  const order = ["FIRST", "SECOND", "THIRD"];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="bg-white dark:bg-gray-900 border-b dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">Academic Terms</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">Current: {currentTerm ? `${currentTerm.name} Term (${currentTerm.academic_year})` : "None"}</span>
            <button onClick={handleAdvance} className="bg-primary text-white px-3 py-1.5 rounded-lg text-sm hover:bg-primary-dark">Advance to Next Term</button>
            <Link href="/admin" className="text-sm text-primary hover:underline">Back</Link>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {terms.sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name)).map(term => {
          const periods = examPeriods.filter(ep => ep.term === term.id);
          const dates = editingDates[term.id] || { starts_at: formatDate(term.starts_at), ends_at: formatDate(term.ends_at) };

          return (
            <div key={term.id} className={`bg-white dark:bg-gray-900 rounded-lg shadow-sm border dark:border-gray-700 ${term.is_current ? "ring-2 ring-primary" : ""}`}>
              <div className="p-4 border-b dark:border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="font-semibold text-lg">{term.name} Term — {term.academic_year}</h2>
                  {term.is_current && <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 px-2 py-0.5 rounded-full">Current</span>}
                  {!term.is_current && <button onClick={() => handleSetCurrent(term)} className="text-xs text-primary hover:underline">Set as Current</button>}
                </div>
              </div>
              <div className="p-4 space-y-4">
                <div className="flex gap-4 items-end">
                  <div>
                    <label className="block text-xs font-medium mb-1">Starts</label>
                    <input type="datetime-local" value={dates.starts_at} onChange={e => setEditingDates(prev => ({ ...prev, [term.id]: { ...prev[term.id] || { starts_at: formatDate(term.starts_at), ends_at: formatDate(term.ends_at) }, starts_at: e.target.value } }))} className="border dark:border-gray-700 rounded px-2 py-1 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Ends</label>
                    <input type="datetime-local" value={dates.ends_at} onChange={e => setEditingDates(prev => ({ ...prev, [term.id]: { ...prev[term.id] || { starts_at: formatDate(term.starts_at), ends_at: formatDate(term.ends_at) }, ends_at: e.target.value } }))} className="border dark:border-gray-700 rounded px-2 py-1 text-sm" />
                  </div>
                  {(editingDates[term.id]) && <button onClick={() => saveTermDates(term)} className="bg-primary text-white px-3 py-1.5 rounded text-xs hover:bg-primary-dark">Save Dates</button>}
                </div>

                <div className="ml-4 pl-4 border-l-2 border-gray-200 dark:border-gray-700 space-y-2">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Exam Periods</p>
                  {periods.length === 0 && <p className="text-xs text-gray-400">No exam periods defined.</p>}
                  {periods.map(period => {
                    const ed = editingExam[period.id] || { starts_at: formatDate(period.starts_at), ends_at: formatDate(period.ends_at) };
                    return (
                      <div key={period.id} className="flex items-center gap-3 text-sm">
                        <span className="font-medium w-24">{period.type === 'MID_TERM' ? 'Mid Term' : 'Terminal'}</span>
                        <input type="datetime-local" value={ed.starts_at} onChange={e => setEditingExam(prev => ({ ...prev, [period.id]: { ...prev[period.id] || { starts_at: formatDate(period.starts_at), ends_at: formatDate(period.ends_at) }, starts_at: e.target.value } }))} className="border dark:border-gray-700 rounded px-2 py-1 text-xs" />
                        <input type="datetime-local" value={ed.ends_at} onChange={e => setEditingExam(prev => ({ ...prev, [period.id]: { ...prev[period.id] || { starts_at: formatDate(period.starts_at), ends_at: formatDate(period.ends_at) }, ends_at: e.target.value } }))} className="border dark:border-gray-700 rounded px-2 py-1 text-xs" />
                        {(editingExam[period.id]) && <button onClick={() => saveExamDates(period)} className="text-primary text-xs hover:underline">Save</button>}
                        <button onClick={() => toggleExamOpen(period)} className={`text-xs px-2 py-0.5 rounded ${period.is_open ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" : "bg-gray-100 text-gray-600 dark:bg-gray-800"}`}>{period.is_open ? "Open" : "Closed"}</button>
                      </div>
                    );
                  })}
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => createExamPeriod(term.id, "MID_TERM")} className="text-xs text-primary hover:underline">+ Add Mid Term</button>
                    <button onClick={() => createExamPeriod(term.id, "TERMINAL")} className="text-xs text-primary hover:underline">+ Add Terminal</button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </main>
    </div>
  );
}
