"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

interface School {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  slug: string;
  logo_url: string | null;
}

interface Config {
  id: string;
  pass_threshold: number;
  distinction_threshold: number;
  graduation_type: string;
  graduation_min_cumulative: number;
  graduation_rules: Record<string, GraduationRule>;
  rating_scale: { grade: string; min: number; max: number; remark: string }[];
  affective_traits: string[];
  psychomotor_skills: string[];
}

interface GraduationRule {
  type: "passAll" | "cumulativeAbove" | "custom";
  min_cumulative: number;
  required_subjects: string[];
  min_additional: number;
}

const SECTIONS = [
  { value: "NURSERY", label: "Nursery" },
  { value: "PRIMARY", label: "Primary" },
  { value: "JUNIOR_SECONDARY", label: "Junior Secondary" },
  { value: "SENIOR_SECONDARY", label: "Senior Secondary" },
];

const DEFAULT_RULES: Record<string, GraduationRule> = {
  NURSERY: { type: "passAll", min_cumulative: 50, required_subjects: [], min_additional: 0 },
  PRIMARY: { type: "passAll", min_cumulative: 50, required_subjects: [], min_additional: 0 },
  JUNIOR_SECONDARY: { type: "custom", min_cumulative: 50, required_subjects: [], min_additional: 0 },
  SENIOR_SECONDARY: { type: "custom", min_cumulative: 50, required_subjects: [], min_additional: 0 },
};

export default function SettingsPage() {
  const router = useRouter();
  const [school, setSchool] = useState<School | null>(null);
  const [config, setConfig] = useState<Config | null>(null);
  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // School profile
  const [profile, setProfile] = useState({ name: "", email: "", phone: "", address: "" });

  // Config
  const [passThreshold, setPassThreshold] = useState(50);
  const [distinctionThreshold, setDistinctionThreshold] = useState(75);
  const [graduationRules, setGraduationRules] = useState<Record<string, GraduationRule>>(DEFAULT_RULES);
  const [affectiveTraits, setAffectiveTraits] = useState<string[]>([]);
  const [psychomotorSkills, setPsychomotorSkills] = useState<string[]>([]);
  const [newTrait, setNewTrait] = useState("");
  const [newSkill, setNewSkill] = useState("");

  // Logo upload
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const userRes = await api.get("/auth/me/");
        const user = userRes.data;
        const [schoolRes, configRes] = await Promise.all([
          api.get(`/schools/${user.schoolSlug}/`),
          api.get("/config/"),
        ]);
        const s = schoolRes.data;
        const c = configRes.data;
        setSchool(s);
        setConfig(c);
        setProfile({ name: s.name, email: s.email, phone: s.phone || "", address: s.address || "" });
        setPassThreshold(c.pass_threshold);
        setDistinctionThreshold(c.distinction_threshold);
        setGraduationRules(c.graduation_rules && Object.keys(c.graduation_rules).length > 0 ? c.graduation_rules : DEFAULT_RULES);
        setAffectiveTraits(c.affective_traits || []);
        setPsychomotorSkills(c.psychomotor_skills || []);
      } catch (err: any) {
        setError(err?.response?.data?.error || err?.message || "Failed to load settings");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await api.post("/schools/upload-logo/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSchool(prev => prev ? { ...prev, logo_url: res.data.url } : null);
    } finally {
      setUploading(false);
    }
  }

  function updateRule(section: string, update: Partial<GraduationRule>) {
    setGraduationRules(prev => ({
      ...prev,
      [section]: { ...prev[section], ...update },
    }));
  }

  async function handleSaveProfile() {
    if (!school) return;
    setSaving(true);
    try {
      await api.put(`/schools/${school.slug}/`, profile);
      setMessage("Profile saved!");
    } catch {
      setMessage("Failed to save profile");
    }
    setSaving(false);
  }

  async function handleSaveConfig() {
    setSaving(true);
    try {
      await api.put("/config/", {
        pass_threshold: passThreshold,
        distinction_threshold: distinctionThreshold,
        graduation_rules: graduationRules,
        affective_traits: affectiveTraits,
        psychomotor_skills: psychomotorSkills,
      });
      setMessage("Settings saved!");
    } catch {
      setMessage("Failed to save settings");
    }
    setSaving(false);
  }

  function addTrait() {
    if (newTrait.trim()) {
      setAffectiveTraits(prev => [...prev, newTrait.trim()]);
      setNewTrait("");
    }
  }

  function addSkill() {
    if (newSkill.trim()) {
      setPsychomotorSkills(prev => [...prev, newSkill.trim()]);
      setNewSkill("");
    }
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="bg-white dark:bg-gray-900 border-b dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">School Settings</h1>
          <Link href="/admin" className="text-sm text-primary hover:underline">Back to Dashboard</Link>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {error && <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">{error}</div>}
        {/* School Profile */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm border dark:border-gray-700">
          <h2 className="font-semibold mb-4">School Profile</h2>
          <div className="flex gap-8">
            <div className="flex flex-col items-center gap-2">
              {school?.logo_url ? (
                <img src={school.logo_url} alt="Logo" className="w-24 h-24 object-contain rounded-lg border dark:border-gray-700" />
              ) : (
                <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center text-gray-400 text-xs">No Logo</div>
              )}
              <label className="text-xs text-primary cursor-pointer hover:underline">
                {uploading ? "Uploading..." : "Upload Logo"}
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleLogoUpload} className="hidden" />
              </label>
            </div>
            <div className="flex-1 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">School Name</label>
                <input value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} className="w-full border dark:border-gray-700 rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input value={profile.email} onChange={e => setProfile(p => ({ ...p, email: e.target.value }))} className="w-full border dark:border-gray-700 rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} className="w-full border dark:border-gray-700 rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Address</label>
                <input value={profile.address} onChange={e => setProfile(p => ({ ...p, address: e.target.value }))} className="w-full border dark:border-gray-700 rounded-lg px-3 py-2" />
              </div>
            </div>
          </div>
          <button onClick={handleSaveProfile} disabled={saving} className="mt-4 bg-primary text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-dark disabled:opacity-50">Save Profile</button>
        </div>

        {/* Thresholds */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm border dark:border-gray-700">
          <h2 className="font-semibold mb-4">Grading Thresholds</h2>
          <div className="grid grid-cols-2 gap-4 max-w-md">
            <div>
              <label className="block text-sm font-medium mb-1">Pass Threshold (%)</label>
              <input type="number" value={passThreshold} onChange={e => setPassThreshold(parseInt(e.target.value))} className="w-full border dark:border-gray-700 rounded-lg px-3 py-2" min={0} max={100} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Distinction Threshold (%)</label>
              <input type="number" value={distinctionThreshold} onChange={e => setDistinctionThreshold(parseInt(e.target.value))} className="w-full border dark:border-gray-700 rounded-lg px-3 py-2" min={0} max={100} />
            </div>
          </div>
        </div>

        {/* Graduation Rules */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm border dark:border-gray-700">
          <h2 className="font-semibold mb-4">Graduation Rules (per section)</h2>
          <div className="space-y-4">
            {SECTIONS.map(section => {
              const rule = graduationRules[section.value] || DEFAULT_RULES[section.value];
              return (
                <details key={section.value} className="border dark:border-gray-700 rounded-lg">
                  <summary className="px-4 py-2 cursor-pointer font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-800">{section.label}</summary>
                  <div className="px-4 py-3 space-y-3 border-t dark:border-gray-700">
                    <div>
                      <label className="block text-xs font-medium mb-1">Graduation Type</label>
                      <select value={rule.type} onChange={e => updateRule(section.value, { type: e.target.value as any })} className="w-full border dark:border-gray-700 rounded px-2 py-1 text-sm">
                        <option value="passAll">Pass all subjects</option>
                        <option value="cumulativeAbove">Cumulative above minimum</option>
                        <option value="custom">Custom (specific subjects)</option>
                      </select>
                    </div>
                    {rule.type === "cumulativeAbove" && (
                      <div>
                        <label className="block text-xs font-medium mb-1">Minimum Cumulative Score</label>
                        <input type="number" value={rule.min_cumulative} onChange={e => updateRule(section.value, { min_cumulative: parseInt(e.target.value) })} className="w-full border dark:border-gray-700 rounded px-2 py-1 text-sm" min={0} max={100} />
                      </div>
                    )}
                    {rule.type === "custom" && (
                      <>
                        <div>
                          <label className="block text-xs font-medium mb-1">Required Subjects (must pass)</label>
                          <input value={rule.required_subjects.join(", ")} onChange={e => updateRule(section.value, { required_subjects: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })} className="w-full border dark:border-gray-700 rounded px-2 py-1 text-sm" placeholder="Mathematics, English" />
                          <p className="text-xs text-gray-400 mt-1">Comma-separated subject names</p>
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1">Minimum Additional Subjects to Pass</label>
                          <input type="number" value={rule.min_additional} onChange={e => updateRule(section.value, { min_additional: parseInt(e.target.value) })} className="w-full border dark:border-gray-700 rounded px-2 py-1 text-sm" min={0} />
                        </div>
                      </>
                    )}
                  </div>
                </details>
              );
            })}
          </div>
        </div>

        {/* Affective Traits & Psychomotor Skills */}
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm border dark:border-gray-700">
            <h2 className="font-semibold mb-4">Affective Traits</h2>
            <div className="space-y-2 mb-3">
              {affectiveTraits.map((trait, i) => (
                <div key={i} className="flex items-center justify-between text-sm bg-gray-50 dark:bg-gray-800 px-3 py-1.5 rounded">
                  <span>{trait}</span>
                  <button onClick={() => setAffectiveTraits(prev => prev.filter((_, j) => j !== i))} className="text-red-500 text-xs hover:underline">Remove</button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={newTrait} onChange={e => setNewTrait(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTrait())} className="flex-1 border dark:border-gray-700 rounded px-2 py-1 text-sm" placeholder="Add trait..." />
              <button onClick={addTrait} className="bg-primary text-white px-3 py-1 rounded text-sm hover:bg-primary-dark">Add</button>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm border dark:border-gray-700">
            <h2 className="font-semibold mb-4">Psychomotor Skills</h2>
            <div className="space-y-2 mb-3">
              {psychomotorSkills.map((skill, i) => (
                <div key={i} className="flex items-center justify-between text-sm bg-gray-50 dark:bg-gray-800 px-3 py-1.5 rounded">
                  <span>{skill}</span>
                  <button onClick={() => setPsychomotorSkills(prev => prev.filter((_, j) => j !== i))} className="text-red-500 text-xs hover:underline">Remove</button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={newSkill} onChange={e => setNewSkill(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())} className="flex-1 border dark:border-gray-700 rounded px-2 py-1 text-sm" placeholder="Add skill..." />
              <button onClick={addSkill} className="bg-primary text-white px-3 py-1 rounded text-sm hover:bg-primary-dark">Add</button>
            </div>
          </div>
        </div>

        <button onClick={handleSaveConfig} disabled={saving} className="bg-primary text-white px-6 py-2 rounded-lg text-sm hover:bg-primary-dark disabled:opacity-50 w-full">
          {saving ? "Saving..." : "Save All Settings"}
        </button>

        {message && (
          <p className={`text-sm text-center ${message.includes("saved") ? "text-green-600" : "text-red-600"}`}>{message}</p>
        )}
      </main>
    </div>
  );
}
