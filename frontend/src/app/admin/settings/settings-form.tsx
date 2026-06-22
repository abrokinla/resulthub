"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Config {
  id: string;
  passThreshold: number;
  distinctionThreshold: number;
  graduationType: string;
  graduationMinCumulative: number;
}

export function SettingsForm({ config }: { config: Config }) {
  const router = useRouter();
  const [form, setForm] = useState({
    passThreshold: config.passThreshold,
    distinctionThreshold: config.distinctionThreshold,
    graduationType: config.graduationType,
    graduationMinCumulative: config.graduationMinCumulative,
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    const res = await fetch("/api/school/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      setMessage("Settings saved!");
      router.refresh();
    } else {
      setMessage("Failed to save settings");
    }
    setSaving(false);
  }

  return (
    <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm border dark:border-gray-700">
      <h2 className="font-semibold mb-4">Grading Configuration</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Pass Threshold (%)
            </label>
            <input
              type="number"
              value={form.passThreshold}
              onChange={(e) =>
                setForm({ ...form, passThreshold: parseInt(e.target.value) })
              }
              className="border dark:border-gray-700 rounded-lg px-3 py-2 w-full"
              min={0}
              max={100}
            />
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Scores below this are shown in red
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Distinction Threshold (%)
            </label>
            <input
              type="number"
              value={form.distinctionThreshold}
              onChange={(e) =>
                setForm({
                  ...form,
                  distinctionThreshold: parseInt(e.target.value),
                })
              }
              className="border dark:border-gray-700 rounded-lg px-3 py-2 w-full"
              min={0}
              max={100}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Graduation Criteria
          </label>
          <select
            value={form.graduationType}
            onChange={(e) =>
              setForm({ ...form, graduationType: e.target.value })
            }
            className="border dark:border-gray-700 rounded-lg px-3 py-2 w-full"
          >
            <option value="passAll">Must pass all subjects</option>
            <option value="cumulativeAbove">
              Cumulative above minimum
            </option>
          </select>
        </div>

        {form.graduationType === "cumulativeAbove" && (
          <div>
            <label className="block text-sm font-medium mb-1">
              Minimum Cumulative Score
            </label>
            <input
              type="number"
              value={form.graduationMinCumulative}
              onChange={(e) =>
                setForm({
                  ...form,
                  graduationMinCumulative: parseInt(e.target.value),
                })
              }
              className="border dark:border-gray-700 rounded-lg px-3 py-2 w-full"
              min={0}
            />
          </div>
        )}

        {message && (
          <p
            className={`text-sm ${
              message.includes("saved") ? "text-success dark:text-green-400" : "text-red-600 dark:text-red-400"
            }`}
          >
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="bg-primary text-white px-6 py-2 rounded-lg text-sm hover:bg-primary-dark disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </form>
    </div>
  );
}
