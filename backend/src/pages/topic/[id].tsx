import { useState, useRef } from "react";
import type { GetServerSideProps } from "next";
import axios from "axios";
import type { Topic, GlossaryEntry } from "@/src/common.type";

const LANGUAGES = [
  { key: "english",  label: "English"  },
  { key: "spanish",  label: "Español"  },
  { key: "japanese", label: "日本語"   },
  { key: "french",   label: "Français" },
  { key: "russian",  label: "Русский"  },
];
const EMPTY_TRANSLATIONS = Object.fromEntries(LANGUAGES.map((l) => [l.key, ""])) as GlossaryEntry["translations"];

// ── SEO Keywords section ──────────────────────────────────────────────────────

function CSVUpload({ topic, setTopic }: { topic: Topic; setTopic: (t: Topic) => void }) {
  const ref = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const keywords = text.split(/[\n,]/).map((k) => k.trim()).filter(Boolean);
    if (!keywords.length) return;
    const updated = Array.from(new Set([...(topic.seoKeywords || []), ...keywords]));
    const res = await fetch(`/api/topic/${topic._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seoKeywords: updated }),
    });
    if (res.ok) setTopic({ ...topic, seoKeywords: updated });
    if (ref.current) ref.current.value = "";
  };

  return (
    <div className="flex items-center gap-2 mb-4">
      <input type="file" ref={ref} accept=".csv" onChange={handleUpload} className="hidden" />
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
      >
        Upload CSV
      </button>
      <span className="text-xs text-gray-500">Import keywords from a CSV file</span>
    </div>
  );
}

// ── Glossary section ──────────────────────────────────────────────────────────

function GlossarySection({ topic, setTopic }: { topic: Topic; setTopic: (t: Topic) => void }) {
  const [adding, setAdding] = useState(false);
  const [newEntry, setNewEntry] = useState<{ sourceTerm: string; note: string; translations: GlossaryEntry["translations"] }>({
    sourceTerm: "", note: "", translations: { ...EMPTY_TRANSLATIONS },
  });
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [draft, setDraft] = useState<GlossaryEntry | null>(null);
  const [error, setError] = useState<string | null>(null);

  const save = async (glossary: GlossaryEntry[]) => {
    const res = await fetch(`/api/topic/${topic._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ glossary }),
    });
    if (!res.ok) throw new Error("Save failed");
    const updated = await res.json();
    setTopic({ ...topic, glossary: updated.glossary ?? glossary });
  };

  const addEntry = async () => {
    if (!newEntry.sourceTerm.trim()) { setError("Source term is required"); return; }
    try {
      await save([...(topic.glossary || []), { ...newEntry }]);
      setAdding(false);
      setNewEntry({ sourceTerm: "", note: "", translations: { ...EMPTY_TRANSLATIONS } });
      setError(null);
    } catch { setError("Failed to add term"); }
  };

  const saveEdit = async () => {
    if (editIdx === null || !draft) return;
    const updated = topic.glossary.map((e, i) => (i === editIdx ? draft : e));
    try { await save(updated); setEditIdx(null); setDraft(null); }
    catch { setError("Save failed"); }
  };

  const deleteEntry = async (idx: number) => {
    if (!confirm("Delete this term?")) return;
    const updated = topic.glossary.filter((_, i) => i !== idx);
    try { await save(updated); }
    catch { setError("Delete failed"); }
  };

  const glossary = topic.glossary || [];
  const input = "w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400";
  const th = "px-3 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wider text-left";
  const td = "px-3 py-3 text-sm";

  return (
    <div className="bg-white rounded-lg shadow p-6 mt-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Translation Glossary</h2>
        <button
          onClick={() => { setAdding(true); setEditIdx(null); }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
        >
          + Add Term
        </button>
      </div>

      {error && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">{error}</div>
      )}

      <div className="overflow-x-auto border rounded-lg">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className={th}>Source 中文</th>
              {LANGUAGES.map((l) => <th key={l.key} className={th}>{l.label}</th>)}
              <th className={th}>Note</th>
              <th className={`${th} w-24`}></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {adding && (
              <tr className="bg-blue-50">
                <td className={td}>
                  <input autoFocus placeholder="中文术语" value={newEntry.sourceTerm}
                    onChange={(e) => setNewEntry({ ...newEntry, sourceTerm: e.target.value })}
                    className={input} />
                </td>
                {LANGUAGES.map((l) => (
                  <td key={l.key} className={td}>
                    <input placeholder={l.label} value={newEntry.translations[l.key as keyof GlossaryEntry["translations"]] ?? ""}
                      onChange={(e) => setNewEntry({ ...newEntry, translations: { ...newEntry.translations, [l.key]: e.target.value } })}
                      className={input} />
                  </td>
                ))}
                <td className={td}>
                  <input placeholder="context" value={newEntry.note}
                    onChange={(e) => setNewEntry({ ...newEntry, note: e.target.value })}
                    className={input} />
                </td>
                <td className={`${td} whitespace-nowrap`}>
                  <button onClick={addEntry} className="text-sm px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-800 mr-2">Add</button>
                  <button onClick={() => { setAdding(false); setError(null); }} className="text-sm text-gray-500 hover:text-gray-700">Cancel</button>
                </td>
              </tr>
            )}

            {glossary.map((entry, idx) =>
              editIdx === idx ? (
                <tr key={idx} className="bg-blue-50">
                  <td className={td}>
                    <input value={draft?.sourceTerm ?? ""}
                      onChange={(e) => setDraft({ ...draft!, sourceTerm: e.target.value })}
                      className={input} />
                  </td>
                  {LANGUAGES.map((l) => (
                    <td key={l.key} className={td}>
                      <input value={draft?.translations[l.key as keyof GlossaryEntry["translations"]] ?? ""}
                        onChange={(e) => setDraft({ ...draft!, translations: { ...draft!.translations, [l.key]: e.target.value } })}
                        className={input} />
                    </td>
                  ))}
                  <td className={td}>
                    <input value={draft?.note ?? ""}
                      onChange={(e) => setDraft({ ...draft!, note: e.target.value })}
                      className={input} />
                  </td>
                  <td className={`${td} whitespace-nowrap`}>
                    <button onClick={saveEdit} className="text-sm px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-800 mr-2">Save</button>
                    <button onClick={() => { setEditIdx(null); setDraft(null); }} className="text-sm text-gray-500 hover:text-gray-700">Cancel</button>
                  </td>
                </tr>
              ) : (
                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                  <td className={`${td} font-medium`}>{entry.sourceTerm}</td>
                  {LANGUAGES.map((l) => (
                    <td key={l.key} className={`${td} text-gray-700`}>
                      {entry.translations?.[l.key as keyof GlossaryEntry["translations"]] || <span className="text-gray-300">—</span>}
                    </td>
                  ))}
                  <td className={`${td} text-gray-400 text-xs`}>{entry.note || "—"}</td>
                  <td className={`${td} whitespace-nowrap`}>
                    <button onClick={() => { setEditIdx(idx); setDraft({ ...entry, translations: { ...entry.translations } }); }}
                      className="text-sm text-blue-600 hover:underline mr-3">Edit</button>
                    <button onClick={() => deleteEntry(idx)} className="text-sm text-red-500 hover:underline">Delete</button>
                  </td>
                </tr>
              )
            )}

            {glossary.length === 0 && !adding && (
              <tr>
                <td colSpan={9} className="px-3 py-8 text-center text-gray-400 text-sm">
                  No terms yet.{" "}
                  <button onClick={() => setAdding(true)} className="text-blue-600 hover:underline">Add the first one</button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-gray-400">{glossary.length} term{glossary.length !== 1 ? "s" : ""}</p>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TopicPage({ initialTopic }: { initialTopic: Topic | null }) {
  const [topic, setTopic] = useState<Topic | null>(initialTopic);
  const [newKeywordString, setNewKeywordString] = useState("");

  if (!topic) return <div className="max-w-3xl mx-auto mt-8 px-4">Topic not found</div>;

  const handleAddKeyword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeywordString.trim()) return;
    const keywords = newKeywordString.split(",").map((k) => k.trim()).filter(Boolean);
    const updated = Array.from(new Set([...(topic.seoKeywords || []), ...keywords]));
    const res = await fetch(`/api/topic/${topic._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seoKeywords: updated }),
    });
    if (res.ok) { setTopic({ ...topic, seoKeywords: updated }); setNewKeywordString(""); }
  };

  const handleDeleteKeyword = async (kw: string) => {
    const updated = topic.seoKeywords.filter((k) => k !== kw);
    const res = await fetch(`/api/topic/${topic._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seoKeywords: updated }),
    });
    if (res.ok) setTopic({ ...topic, seoKeywords: updated });
  };

  return (
    <div className="max-w-5xl mx-auto mt-8 px-4 pb-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">{topic.name}</h1>
      <p className="text-sm text-gray-500 mb-6">Created: {new Date(topic.createdAt).toLocaleDateString()}</p>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">SEO Keywords</h2>
        <form onSubmit={handleAddKeyword} className="flex gap-4 mb-2">
          <input
            type="text"
            placeholder="Add keyword"
            value={newKeywordString}
            onChange={(e) => setNewKeywordString(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Add</button>
        </form>
        <p className="text-xs text-gray-500 mb-4">Separate multiple keywords with commas (,)</p>
        <CSVUpload topic={topic} setTopic={setTopic} />
        <div className="flex flex-wrap gap-2">
          {(topic.seoKeywords || []).map((kw) => (
            <span key={kw} className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full">
              {kw}
              <button onClick={() => handleDeleteKeyword(kw)} className="ml-1 text-gray-400 hover:text-red-600">×</button>
            </span>
          ))}
          {(!topic.seoKeywords || topic.seoKeywords.length === 0) && (
            <p className="text-gray-500 text-sm">No keywords added yet</p>
          )}
        </div>
      </div>

      <GlossarySection topic={topic} setTopic={setTopic} />
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  try {
    const BASE = process.env.NEXT_PUBLIC_DATA_PERSISTENCE_URL || "http://localhost:3000";
    const { data } = await axios.get(`${BASE}/api/topic/${params?.id}`);
    return { props: { initialTopic: data } };
  } catch {
    return { props: { initialTopic: null } };
  }
};
