"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { api } from "@/lib/api";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { EventClickArg, EventDropArg } from "@fullcalendar/core";

interface Term { id: string; name: string; academic_year: string; is_current: boolean; starts_at: string | null; ends_at: string | null; }
interface ExamPeriod { id: string; term: string; type: string; name: string; is_open: boolean; starts_at: string | null; ends_at: string | null; }
interface Holiday { id: string; term: string; type: string; name: string; starts_at: string | null; ends_at: string | null; }

const ORDER = ["FIRST", "SECOND", "THIRD"];
const TERM_COLORS: Record<string, string> = { FIRST: "#22c55e", SECOND: "#3b82f6", THIRD: "#a855f7" };

function fmt(d: string | null) { if (!d) return ""; return d.slice(0, 10); }

function toFCStart(d: string | null) { return d ? d.slice(0, 10) : undefined; }

function toFCEnd(d: string | null) {
  if (!d) return undefined;
  const date = new Date(d.slice(0, 10) + "T00:00:00");
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}

function fromFCEnd(d: Date): string {
  const date = new Date(d);
  date.setDate(date.getDate() - 1);
  return date.toISOString().slice(0, 10);
}

function dateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default function TermsPage() {
  const calendarRef = useRef<FullCalendar>(null);
  const [terms, setTerms] = useState<Term[]>([]);
  const [examPeriods, setExamPeriods] = useState<ExamPeriod[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  // Create dialog state
  const [showCreate, setShowCreate] = useState(false);
  const [createDate, setCreateDate] = useState<{ start: string; end: string } | null>(null);
  const [createType, setCreateType] = useState<"exam" | "holiday">("exam");
  const [createSubtype, setCreateSubtype] = useState("MID_TERM");
  const [createTermId, setCreateTermId] = useState("");

  // Edit dialog state
  const [showEdit, setShowEdit] = useState(false);
  const [editItem, setEditItem] = useState<{ id: string; type: "exam" | "holiday"; name: string; subtype: string; is_open?: boolean } | null>(null);

  async function fetchData() {
    try {
      const [termsRes, examsRes, holidaysRes] = await Promise.all([
        api.get("/terms/"),
        api.get("/exam-periods/"),
        api.get("/holidays/"),
      ]);
      setTerms(termsRes.data);
      setExamPeriods(examsRes.data);
      setHolidays(holidaysRes.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchData() }, []);

  const buildEvents = useCallback(() => {
    const events: any[] = [];

    for (const term of terms) {
      if (!term.starts_at && !term.ends_at) continue;
      const start = toFCStart(term.starts_at);
      const end = toFCEnd(term.ends_at);
      if (!start) continue;
      events.push({
        id: "term-" + term.id,
        title: "",
        start,
        end,
        allDay: true,
        display: "background",
        classNames: ["term-bg"],
        backgroundColor: TERM_COLORS[term.name] || "#6b7280",
      });
      events.push({
        id: "term-label-" + term.id,
        title: `${term.name} Term`,
        start,
        end,
        allDay: true,
        display: "list-item",
        classNames: ["term-label"],
        color: TERM_COLORS[term.name] || "#6b7280",
        textColor: "#fff",
        extendedProps: { type: "term", termId: term.id },
      });
    }

    for (const p of examPeriods) {
      if (!p.starts_at && !p.ends_at) continue;
      const start = toFCStart(p.starts_at);
      const end = toFCEnd(p.ends_at);
      if (!start) continue;
      events.push({
        id: "exam-" + p.id,
        title: p.name,
        start,
        end,
        allDay: true,
        backgroundColor: p.type === "MID_TERM" ? "#3b82f6" : "#f97316",
        borderColor: p.type === "MID_TERM" ? "#2563eb" : "#ea580c",
        classNames: p.is_open ? ["exam-open"] : [],
        extendedProps: { type: "exam", subtype: p.type, is_open: p.is_open, termId: p.term, apiId: p.id },
      });
    }

    for (const h of holidays) {
      if (!h.starts_at && !h.ends_at) continue;
      const start = toFCStart(h.starts_at);
      const end = toFCEnd(h.ends_at);
      if (!start) continue;
      events.push({
        id: "holiday-" + h.id,
        title: h.name,
        start,
        end,
        allDay: true,
        backgroundColor: "#6b7280",
        borderColor: "#4b5563",
        classNames: ["holiday-event"],
        extendedProps: { type: "holiday", subtype: h.type, termId: h.term, apiId: h.id },
      });
    }

    return events;
  }, [terms, examPeriods, holidays]);

  async function handleSetCurrent(termId: string) {
    await api.post(`/terms/${termId}/set_current/`);
    fetchData();
  }

  async function handleAdvance() {
    await api.post("/terms/advance/");
    fetchData();
  }

  function handleDateClick(info: { dateStr: string }) {
    setCreateDate({ start: info.dateStr, end: info.dateStr });
    const term = terms.find(t => {
      if (!t.starts_at) return false;
      return info.dateStr >= t.starts_at.slice(0, 10) && (!t.ends_at || info.dateStr <= t.ends_at.slice(0, 10));
    });
    setCreateTermId(term?.id || "");
    setCreateType("exam");
    setCreateSubtype("MID_TERM");
    setShowCreate(true);
  }

  async function handleCreate() {
    if (!createDate || !createTermId) return;
    try {
      if (createType === "exam") {
        const name = createSubtype === "MID_TERM" ? "Mid Term" : "Terminal Examination";
        await api.post("/exam-periods/", {
          term: createTermId,
          type: createSubtype,
          name,
          starts_at: createDate.start,
          ends_at: createDate.end,
        });
      } else {
        const name = createSubtype === "MID_TERM" ? "Mid Term Break" : "End of Term Break";
        await api.post("/holidays/", {
          term: createTermId,
          type: createSubtype,
          name,
          starts_at: createDate.start,
          ends_at: createDate.end,
        });
      }
      setShowCreate(false);
      fetchData();
    } catch { setMessage("Failed to create"); }
  }

  function handleEventClick(info: EventClickArg) {
    const ext = info.event.extendedProps;
    if (ext.type === "exam") {
      setEditItem({ id: ext.apiId, type: "exam", name: info.event.title, subtype: ext.subtype, is_open: ext.is_open });
      setShowEdit(true);
    } else if (ext.type === "holiday") {
      setEditItem({ id: ext.apiId, type: "holiday", name: info.event.title, subtype: ext.subtype });
      setShowEdit(true);
    }
  }

  async function handleToggleOpen() {
    if (!editItem || editItem.type !== "exam") return;
    const action = editItem.is_open ? "close" : "open";
    await api.post(`/exam-periods/${editItem.id}/${action}/`);
    setShowEdit(false);
    fetchData();
  }

  async function handleDelete() {
    if (!editItem) return;
    const endpoint = editItem.type === "exam" ? `/exam-periods/${editItem.id}/` : `/holidays/${editItem.id}/`;
    await api.delete(endpoint);
    setShowEdit(false);
    fetchData();
  }

  async function handleEventDrop(info: EventDropArg) {
    const ext = info.event.extendedProps;
    if (ext.type === "term") return;
    const apiId = ext.apiId;
    if (!apiId) return;
    const start = dateStr(info.event.start!);
    const end = fromFCEnd(info.event.end!);
    const endpoint = ext.type === "exam" ? `/exam-periods/${apiId}/` : `/holidays/${apiId}/`;
    try {
      await api.patch(endpoint, { starts_at: start, ends_at: end });
    } catch { fetchData(); }
  }

  async function handleEventResize(info: any) {
    const ext = info.event.extendedProps;
    if (ext.type === "term") return;
    const apiId = ext.apiId;
    if (!apiId) return;
    const start = dateStr(info.event.start!);
    const end = fromFCEnd(info.event.end!);
    const endpoint = ext.type === "exam" ? `/exam-periods/${apiId}/` : `/holidays/${apiId}/`;
    try {
      await api.patch(endpoint, { starts_at: start, ends_at: end });
    } catch { fetchData(); }
  }

  const currentTerm = terms.find(t => t.is_current);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;

  const termOptions = terms.sort((a, b) => ORDER.indexOf(a.name) - ORDER.indexOf(b.name));

  return (
    <>
      <header className="bg-white dark:bg-gray-900 border-b dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">Academic Calendar</h1>
          <div className="flex items-center gap-3">
            <select
              value={currentTerm?.id || ""}
              onChange={e => e.target.value && handleSetCurrent(e.target.value)}
              className="text-sm border dark:border-gray-700 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="">{currentTerm ? `${currentTerm.name} Term (${currentTerm.academic_year})` : "No term set"}</option>
              {termOptions.filter(t => !t.is_current).map(t => (
                <option key={t.id} value={t.id}>Set: {t.name} Term ({t.academic_year})</option>
              ))}
            </select>
            <button onClick={handleAdvance} className="bg-primary text-white px-3 py-1.5 rounded-lg text-sm hover:bg-primary-dark">Advance to Next Term</button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-8 w-full">
        {message && <p className="text-sm text-red-600 text-center mb-4">{message}</p>}

        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border dark:border-gray-700 p-4">
          <div className="mb-3 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-500" /> Term</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-500" /> Mid Term Exam</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-orange-500" /> Terminal Exam</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-500" /> Holiday</span>
            <span className="ml-auto text-gray-400">Click a date to create. Drag to move. Resize edges.</span>
          </div>
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            editable={true}
            selectable={true}
            events={buildEvents()}
            dateClick={handleDateClick}
            eventClick={handleEventClick}
            eventDrop={handleEventDrop}
            eventResize={handleEventResize}
            height="auto"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,dayGridWeek",
            }}
            buttonText={{ today: "Today", month: "Month", week: "Week" }}
            firstDay={1}
            dayMaxEvents={3}
          />
        </div>

        {/* Term date quick-edit */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {termOptions.map(term => (
            <div key={term.id} className={`bg-white dark:bg-gray-900 rounded-lg border dark:border-gray-700 p-4 ${term.is_current ? "ring-2 ring-primary" : ""}`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-sm">{term.name} Term ({term.academic_year})</h3>
                {term.is_current && <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 px-2 py-0.5 rounded-full">Current</span>}
              </div>
              <div className="flex gap-2 items-center text-sm">
                <div>
                  <label className="block text-xs text-gray-500">Starts</label>
                  <input type="date" value={fmt(term.starts_at)} onChange={async e => { await api.patch(`/terms/${term.id}/`, { starts_at: e.target.value || null }); fetchData(); }} className="border dark:border-gray-700 rounded px-2 py-1 text-sm w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500">Ends</label>
                  <input type="date" value={fmt(term.ends_at)} onChange={async e => { await api.patch(`/terms/${term.id}/`, { ends_at: e.target.value || null }); fetchData(); }} className="border dark:border-gray-700 rounded px-2 py-1 text-sm w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Create dialog */}
      {showCreate && createDate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowCreate(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl border dark:border-gray-700 p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <h2 className="font-semibold mb-4">New Event — {createDate.start}</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1">Type</label>
                <select value={createType} onChange={e => setCreateType(e.target.value as any)} className="w-full border dark:border-gray-700 rounded px-2 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                  <option value="exam">Exam Period</option>
                  <option value="holiday">Holiday</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Term</label>
                <select value={createTermId} onChange={e => setCreateTermId(e.target.value)} className="w-full border dark:border-gray-700 rounded px-2 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                  <option value="">Select term...</option>
                  {termOptions.map(t => <option key={t.id} value={t.id}>{t.name} Term ({t.academic_year})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Subtype</label>
                {createType === "exam" ? (
                  <select value={createSubtype} onChange={e => setCreateSubtype(e.target.value)} className="w-full border dark:border-gray-700 rounded px-2 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                    <option value="MID_TERM">Mid Term</option>
                    <option value="TERMINAL">Terminal</option>
                  </select>
                ) : (
                  <select value={createSubtype} onChange={e => setCreateSubtype(e.target.value)} className="w-full border dark:border-gray-700 rounded px-2 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                    <option value="MID_TERM">Mid Term Break</option>
                    <option value="END_OF_TERM">End of Term Break</option>
                  </select>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium mb-1">Start</label>
                  <input type="date" value={createDate.start} onChange={e => setCreateDate(prev => prev ? { ...prev, start: e.target.value } : null)} className="w-full border dark:border-gray-700 rounded px-2 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">End</label>
                  <input type="date" value={createDate.end} onChange={e => setCreateDate(prev => prev ? { ...prev, end: e.target.value } : null)} className="w-full border dark:border-gray-700 rounded px-2 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowCreate(false)} className="px-4 py-1.5 text-sm border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">Cancel</button>
              <button onClick={handleCreate} className="px-4 py-1.5 text-sm bg-primary text-white rounded-lg hover:bg-primary-dark">Create</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit dialog */}
      {showEdit && editItem && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowEdit(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl border dark:border-gray-700 p-6 w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
            <h2 className="font-semibold mb-1">{editItem.name}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 capitalize">{editItem.type} — {editItem.subtype.toLowerCase().replace(/_/g, " ")}</p>
            <div className="flex gap-2">
              {editItem.type === "exam" && (
                <button onClick={handleToggleOpen} className={`px-3 py-1.5 text-sm rounded-lg ${editItem.is_open ? "bg-gray-200 dark:bg-gray-700" : "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"}`}>
                  {editItem.is_open ? "Close" : "Open"} Results
                </button>
              )}
              <button onClick={handleDelete} className="px-3 py-1.5 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600">Delete</button>
              <button onClick={() => setShowEdit(false)} className="px-3 py-1.5 text-sm border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
