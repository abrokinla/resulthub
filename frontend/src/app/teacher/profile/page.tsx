"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function TeacherProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [form, setForm] = useState({ name: "", phone: "", address: "" });
  const [pwd, setPwd] = useState({ current: "", newPwd: "", confirm: "" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [pwdMsg, setPwdMsg] = useState("");
  const [isErr, setIsErr] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    api.get("/auth/profile").then((res: any) => {
      const data = res.data;
      setUser(data);
      setProfile(data.teacher_profile);
      setForm({
        name: data.name || "",
        phone: data.teacher_profile?.phone || "",
        address: data.teacher_profile?.address || "",
      });
    }).catch(() => router.push("/login"));
  }, [router]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    try {
      await api.patch("/auth/profile", form);
      setMsg("Profile updated");
      setIsErr(false);
    } catch {
      setMsg("Failed to update profile");
      setIsErr(true);
    }
    setSaving(false);
  }

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwdMsg("");
    if (pwd.newPwd !== pwd.confirm) {
      setPwdMsg("Passwords do not match");
      return;
    }
    if (pwd.newPwd.length < 6) {
      setPwdMsg("Password must be at least 6 characters");
      return;
    }
    try {
      await api.post("/auth/change-password", {
        current_password: pwd.current,
        new_password: pwd.newPwd,
      });
      setPwdMsg("Password changed");
      setPwd({ current: "", newPwd: "", confirm: "" });
    } catch (err: any) {
      const body = err?.response?.data || err;
      setPwdMsg(body?.current_password?.[0] || "Failed to change password");
    }
  }

  async function handleProfilePic(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await api.post("/auth/upload-profile-picture", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setProfile((p: any) => ({ ...p, profile_picture: data.url }));
    } catch {
      alert("Upload failed");
    }
    setUploading(false);
  }

  async function handleCredential(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const name = prompt("Name this credential (e.g. Resume, Certificate):");
    if (!name) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("name", name);
      const { data } = await api.post("/auth/upload-credential", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setProfile((p: any) => ({ ...p, certificates: data.certificates }));
    } catch {
      alert("Upload failed");
    }
    setUploading(false);
  }

  if (!user) return <div className="p-8 text-center text-gray-500">Loading...</div>;

  return (
    <>
      <header className="bg-white dark:bg-gray-900 border-b dark:border-gray-800">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">My Profile</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">

        {/* Profile Picture */}
        <section className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm border dark:border-gray-700">
          <h2 className="font-semibold mb-4">Profile Picture</h2>
          <div className="flex items-center gap-4">
            {profile?.profile_picture ? (
              <img
                src={profile.profile_picture}
                alt="Profile"
                className="w-20 h-20 rounded-full object-cover border dark:border-gray-600"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-2xl text-gray-400">
                {user.name?.[0]?.toUpperCase()}
              </div>
            )}
            <label className="cursor-pointer text-sm text-primary hover:underline">
              {uploading ? "Uploading..." : "Change Photo"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleProfilePic}
                disabled={uploading}
              />
            </label>
          </div>
        </section>

        {/* Personal Info */}
        <section className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm border dark:border-gray-700">
          <h2 className="font-semibold mb-4">Personal Information</h2>
          <form onSubmit={handleSave} className="space-y-3">
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Email</label>
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full border rounded-lg px-3 py-2 bg-gray-100 dark:bg-gray-800 dark:border-gray-600 text-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Full Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 dark:bg-gray-800 dark:border-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Phone</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 dark:bg-gray-800 dark:border-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Address</label>
              <textarea
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                rows={2}
                className="w-full border rounded-lg px-3 py-2 dark:bg-gray-800 dark:border-gray-600"
              />
            </div>
            {msg && (
              <p className={`text-sm ${isErr ? "text-red-600" : "text-green-600"}`}>{msg}</p>
            )}
            <button
              type="submit"
              disabled={saving}
              className="bg-primary text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-dark disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </section>

        {/* Credentials */}
        <section className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm border dark:border-gray-700">
          <h2 className="font-semibold mb-4">Credentials</h2>
          {profile?.certificates?.length > 0 && (
            <ul className="mb-4 space-y-2">
              {profile.certificates.map((cert: any, i: number) => (
                <li key={i} className="flex items-center justify-between text-sm">
                  <span>{cert.name}</span>
                  <a
                    href={cert.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    View
                  </a>
                </li>
              ))}
            </ul>
          )}
          <label className="inline-block cursor-pointer text-sm text-primary hover:underline">
            {uploading ? "Uploading..." : (profile?.certificates?.length ? "Add Another" : "Upload Credential")}
            <input
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.png"
              className="hidden"
              onChange={handleCredential}
              disabled={uploading}
            />
          </label>
        </section>

        {/* Change Password */}
        <section className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm border dark:border-gray-700">
          <h2 className="font-semibold mb-4">Change Password</h2>
          <form onSubmit={handlePassword} className="space-y-3">
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Current Password</label>
              <input
                type="password"
                value={pwd.current}
                onChange={(e) => setPwd({ ...pwd, current: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 dark:bg-gray-800 dark:border-gray-600"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">New Password</label>
              <input
                type="password"
                value={pwd.newPwd}
                onChange={(e) => setPwd({ ...pwd, newPwd: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 dark:bg-gray-800 dark:border-gray-600"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Confirm New Password</label>
              <input
                type="password"
                value={pwd.confirm}
                onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 dark:bg-gray-800 dark:border-gray-600"
                required
              />
            </div>
            {pwdMsg && (
              <p className={`text-sm ${pwdMsg === "Password changed" ? "text-green-600" : "text-red-600"}`}>
                {pwdMsg}
              </p>
            )}
            <button
              type="submit"
              className="bg-primary text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-dark"
            >
              Change Password
            </button>
          </form>
        </section>

      </main>
    </>
  );
}
