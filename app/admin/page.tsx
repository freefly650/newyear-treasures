"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
  dollCount: number;
}

interface RestoreResult {
  imported: number;
  replaceAll: boolean;
  userId: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [secret, setSecret] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createName, setCreateName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);

  const [backupUserId, setBackupUserId] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const [restoreUserId, setRestoreUserId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [replaceAll, setReplaceAll] = useState(true);
  const [copyImages, setCopyImages] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<RestoreResult | null>(null);

  const [deleteConfirmUserId, setDeleteConfirmUserId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [resetPasswordUserId, setResetPasswordUserId] = useState<string | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [resetPasswordConfirm, setResetPasswordConfirm] = useState("");
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);
  const [resetPasswordError, setResetPasswordError] = useState<string | null>(null);
  const [resetPasswordSuccess, setResetPasswordSuccess] = useState<string | null>(null);

  const headers = useCallback(
    () => (secret ? { "x-admin-secret": secret } : undefined),
    [secret]
  );

  const fetchUsers = useCallback(() => {
    if (!secret) return;
    setUsersError(null);
    fetch("/api/admin/users", { headers: headers() })
      .then((res) => {
        if (!res.ok) throw new Error(res.status === 401 ? "Invalid admin secret" : "Failed to load users");
        return res.json();
      })
      .then(setUsers)
      .catch((e) => setUsersError(e instanceof Error ? e.message : "Failed"));
  }, [secret, headers]);

  useEffect(() => {
    if (secret) fetchUsers();
    else setUsers([]);
  }, [secret, fetchUsers]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreateSuccess(null);
    if (!createEmail.trim() || createPassword.length < 6) {
      setCreateError("Email and password (min 6 chars) required.");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers() },
        body: JSON.stringify({
          email: createEmail.trim().toLowerCase(),
          password: createPassword,
          name: createName.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Create failed");
      setCreateSuccess(data.message || "User created.");
      setCreateEmail("");
      setCreatePassword("");
      setCreateName("");
      fetchUsers();
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : "Create failed");
    } finally {
      setCreating(false);
    }
  };

  const handleLoginAs = async (userId: string) => {
    try {
      const res = await fetch("/api/admin/login-as", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers() },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Login-as failed");
      }
      router.push("/");
      router.refresh();
    } catch (e) {
      setUsersError(e instanceof Error ? e.message : "Login-as failed");
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPasswordUserId) return;
    setResetPasswordError(null);
    setResetPasswordSuccess(null);
    if (resetPassword.length < 6) {
      setResetPasswordError("Password must be at least 6 characters.");
      return;
    }
    if (resetPassword !== resetPasswordConfirm) {
      setResetPasswordError("Passwords do not match.");
      return;
    }
    setResetPasswordLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(resetPasswordUserId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...headers() },
        body: JSON.stringify({ password: resetPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Reset failed");
      setResetPasswordSuccess(data.message || "Password updated.");
      setResetPassword("");
      setResetPasswordConfirm("");
    } catch (e) {
      setResetPasswordError(e instanceof Error ? e.message : "Reset failed");
    } finally {
      setResetPasswordLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    setUsersError(null);
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(userId)}`, {
        method: "DELETE",
        headers: headers(),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Delete failed");
      }
      setDeleteConfirmUserId(null);
      fetchUsers();
      if (backupUserId === userId) setBackupUserId("");
      if (restoreUserId === userId) setRestoreUserId("");
    } catch (e) {
      setUsersError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  const handleDownload = async () => {
    if (!backupUserId) {
      setDownloadError("Select a user to export.");
      return;
    }
    setDownloadError(null);
    setDownloading(true);
    try {
      const res = await fetch(`/api/admin/dump?userId=${encodeURIComponent(backupUserId)}`, {
        headers: headers(),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Download failed (${res.status})`);
      }
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const stamp = new Date().toISOString().replace(/[:.]/g, "-");
      a.href = url;
      a.download = `newyear-treasures-backup-${stamp}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setDownloadError(e instanceof Error ? e.message : "Download failed");
    } finally {
      setDownloading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError(null);
    setUploadResult(null);
    if (!restoreUserId) {
      setUploadError("Select a user to restore into.");
      return;
    }
    if (!file) {
      setUploadError("Choose a backup JSON file first.");
      return;
    }
    setUploading(true);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const body = { userId: restoreUserId, replaceAll, copyImages, toys: parsed.toys ?? [] };
      const res = await fetch("/api/admin/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers() },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Restore failed (${res.status})`);
      }
      const result = (await res.json()) as RestoreResult;
      setUploadResult(result);
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Restore failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mx-auto min-h-screen max-w-3xl px-4 py-6 pb-10 safe-area-padding sm:px-6 sm:py-8">
      <header className="mb-6 sm:mb-8 flex items-center justify-between">
        <h1 className="font-display text-2xl font-normal text-ink sm:text-3xl">
          Адмін · Користувачі та резервні копії
        </h1>
        <Link
          href="/"
          className="text-sm text-mauve underline touch-manipulation hover:text-ink"
        >
          Назад до колекції
        </Link>
      </header>

      <section className="mb-8 rounded-2xl border border-blush/40 bg-white/90 p-5 shadow-sm sm:p-6">
        <h2 className="font-display text-lg text-ink sm:text-xl">Admin access</h2>
        <p className="mt-1 text-sm text-mauve">
          Set <code className="text-xs">ADMIN_SECRET</code> in your environment, then enter it here to manage users and backups.
        </p>
        <div className="mt-3 max-w-sm">
          <input
            type="password"
            value={secret}
            onChange={(e) => {
              setSecret(e.target.value);
              setUsersError(null);
            }}
            placeholder="Admin secret"
            className="min-h-[44px] w-full rounded-xl border border-blush/50 bg-cream/50 px-4 py-2 text-sm text-ink placeholder:text-mauve/50 focus:border-rose focus:outline-none focus:ring-2 focus:ring-rose/20"
          />
        </div>
        {usersError && (
          <p className="mt-2 text-sm text-rose" role="alert">
            {usersError}
          </p>
        )}
      </section>

      {secret && (
        <>
          <section className="mb-8 rounded-2xl border border-blush/40 bg-white/90 p-5 shadow-sm sm:p-6">
            <h2 className="font-display text-lg text-ink sm:text-xl">Users</h2>
            <p className="mt-1 text-sm text-mauve">
              List of registered users. Use “Login as” to act as that user.
            </p>
            {users.length === 0 && !usersError && (
              <p className="mt-3 text-sm text-mauve">No users yet, or enter admin secret and refresh.</p>
            )}
            {users.length > 0 && (
              <ul className="mt-4 space-y-2">
                {users.map((u) => (
                  <li
                    key={u.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-blush/30 bg-cream/30 px-3 py-2"
                  >
                    <span className="text-sm text-ink">
                      {u.name ? (
                        <>
                          {u.name}{" "}
                          <span className="text-mauve">({u.email})</span>
                          {" – "}
                          <span className="text-mauve/90">
                            {(u.dollCount ?? 0) === 1 ? "1 doll" : `${u.dollCount ?? 0} toys`}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-ink">{u.email}</span>
                          {" – "}
                          <span className="text-mauve/90">
                            {(u.dollCount ?? 0) === 1 ? "1 doll" : `${u.dollCount ?? 0} toys`}
                          </span>
                        </>
                      )}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setResetPasswordUserId(u.id);
                          setResetPassword("");
                          setResetPasswordConfirm("");
                          setResetPasswordError(null);
                          setResetPasswordSuccess(null);
                        }}
                        className="rounded-lg border border-mauve/40 bg-white px-3 py-1.5 text-sm text-mauve hover:bg-mauve/10"
                      >
                        Reset password
                      </button>
                      <button
                        type="button"
                        onClick={() => handleLoginAs(u.id)}
                        className="rounded-lg border border-rose/30 bg-white px-3 py-1.5 text-sm text-rose hover:bg-rose/10"
                      >
                        Login as
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmUserId(u.id)}
                        className="rounded-lg border border-rose/50 bg-white px-3 py-1.5 text-sm text-rose hover:bg-rose/10"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {resetPasswordUserId && (
              <form onSubmit={handleResetPassword} className="mt-4 rounded-xl border border-blush/50 bg-cream/30 p-4 space-y-3">
                <p className="text-sm font-medium text-ink">
                  Reset password for: {users.find((u) => u.id === resetPasswordUserId)?.email ?? resetPasswordUserId}
                </p>
                <input
                  type="password"
                  value={resetPassword}
                  onChange={(e) => setResetPassword(e.target.value)}
                  placeholder="New password (min 6)"
                  minLength={6}
                  className="min-h-[44px] w-full max-w-xs rounded-xl border border-blush/50 bg-cream/50 px-4 py-2 text-sm"
                  required
                />
                <input
                  type="password"
                  value={resetPasswordConfirm}
                  onChange={(e) => setResetPasswordConfirm(e.target.value)}
                  placeholder="Confirm new password"
                  minLength={6}
                  className="min-h-[44px] w-full max-w-xs rounded-xl border border-blush/50 bg-cream/50 px-4 py-2 text-sm"
                  required
                />
                {resetPasswordError && <p className="text-sm text-rose">{resetPasswordError}</p>}
                {resetPasswordSuccess && <p className="text-sm text-mauve">{resetPasswordSuccess}</p>}
                <div className="flex gap-2">
                  {resetPasswordSuccess ? (
                    <button
                      type="button"
                      onClick={() => {
                        setResetPasswordUserId(null);
                        setResetPasswordSuccess(null);
                      }}
                      className="min-h-[44px] rounded-xl border border-mauve/30 px-4 py-2 text-sm text-mauve hover:bg-mauve/10"
                    >
                      Done
                    </button>
                  ) : (
                    <>
                      <button
                        type="submit"
                        disabled={resetPasswordLoading}
                        className="min-h-[44px] rounded-xl bg-rose px-4 py-2 text-sm font-medium text-white hover:bg-rose/90 disabled:opacity-50"
                      >
                        {resetPasswordLoading ? "Updating…" : "Update password"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setResetPasswordUserId(null);
                          setResetPassword("");
                          setResetPasswordConfirm("");
                          setResetPasswordError(null);
                          setResetPasswordSuccess(null);
                        }}
                        disabled={resetPasswordLoading}
                        className="min-h-[44px] rounded-xl border border-mauve/30 px-4 py-2 text-sm text-mauve hover:bg-mauve/10 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </form>
            )}

            {deleteConfirmUserId && (
              <div
                className="mt-4 rounded-xl border border-rose/40 bg-rose/5 p-4"
                role="alertdialog"
                aria-labelledby="delete-user-confirm-title"
              >
                <p id="delete-user-confirm-title" className="font-medium text-ink">
                  Are you sure you want to delete this user?
                </p>
                <p className="mt-1 text-sm text-mauve">
                  This will remove their account, all their toys, and all their images from Cloudinary. This cannot be undone.
                </p>
                <div className="mt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => handleDeleteUser(deleteConfirmUserId)}
                    disabled={deleting}
                    className="min-h-[44px] rounded-xl bg-rose px-4 py-2 text-sm font-medium text-white hover:bg-rose/90 disabled:opacity-50"
                  >
                    {deleting ? "Deleting…" : "Yes"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmUserId(null)}
                    disabled={deleting}
                    className="min-h-[44px] rounded-xl border border-mauve/30 px-4 py-2 text-sm text-mauve hover:bg-mauve/10 disabled:opacity-50"
                  >
                    No
                  </button>
                </div>
              </div>
            )}
          </section>

          <section className="mb-8 rounded-2xl border border-blush/40 bg-white/90 p-5 shadow-sm sm:p-6">
            <h2 className="font-display text-lg text-ink sm:text-xl">Create test user</h2>
            <p className="mt-1 text-sm text-mauve">
              Create a user with email and password (min 6 characters). They can sign in from the login page.
            </p>
            <form onSubmit={handleCreateUser} className="mt-4 space-y-3">
              <input
                type="email"
                value={createEmail}
                onChange={(e) => setCreateEmail(e.target.value)}
                placeholder="Email"
                className="min-h-[44px] w-full max-w-xs rounded-xl border border-blush/50 bg-cream/50 px-4 py-2 text-sm"
                required
              />
              <input
                type="text"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="Name (optional)"
                className="min-h-[44px] w-full max-w-xs rounded-xl border border-blush/50 bg-cream/50 px-4 py-2 text-sm"
              />
              <input
                type="password"
                value={createPassword}
                onChange={(e) => setCreatePassword(e.target.value)}
                placeholder="Password (min 6)"
                minLength={6}
                className="min-h-[44px] w-full max-w-xs rounded-xl border border-blush/50 bg-cream/50 px-4 py-2 text-sm"
                required
              />
              {createError && <p className="text-sm text-rose">{createError}</p>}
              {createSuccess && <p className="text-sm text-mauve">{createSuccess}</p>}
              <button
                type="submit"
                disabled={creating}
                className="min-h-[48px] rounded-xl bg-rose px-5 py-3 text-sm font-medium text-white hover:bg-rose/90 disabled:opacity-60"
              >
                {creating ? "Creating…" : "Create user"}
              </button>
            </form>
          </section>

          <section className="mb-8 rounded-2xl border border-blush/40 bg-white/90 p-5 shadow-sm sm:p-6">
            <h2 className="font-display text-lg text-ink sm:text-xl">Download backup</h2>
            <p className="mt-1 text-sm text-mauve">
              Export one user’s toys (and image URLs) to a JSON file.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <select
                value={backupUserId}
                onChange={(e) => setBackupUserId(e.target.value)}
                className="min-h-[44px] rounded-xl border border-blush/50 bg-cream/50 px-4 py-2 text-sm"
              >
                <option value="">Select user</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.email}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleDownload}
                disabled={downloading || !backupUserId}
                className="min-h-[48px] rounded-xl bg-rose px-5 py-3 text-sm font-medium text-white hover:bg-rose/90 disabled:opacity-60"
              >
                {downloading ? "Preparing…" : "Download backup (JSON)"}
              </button>
            </div>
            {downloadError && <p className="mt-2 text-sm text-rose">{downloadError}</p>}
          </section>

          <section className="rounded-2xl border border-blush/40 bg-white/90 p-5 shadow-sm sm:p-6">
            <h2 className="font-display text-lg text-ink sm:text-xl">Restore from file</h2>
            <p className="mt-1 text-sm text-mauve">
              Restore a backup into a selected user. Existing toys for that user can be replaced or appended.
            </p>
            <form onSubmit={handleUpload} className="mt-4 space-y-4">
              <div>
                <label className="block text-sm text-mauve mb-1">Restore into user</label>
                <select
                  value={restoreUserId}
                  onChange={(e) => setRestoreUserId(e.target.value)}
                  className="min-h-[44px] w-full max-w-xs rounded-xl border border-blush/50 bg-cream/50 px-4 py-2 text-sm"
                >
                  <option value="">Select user</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.email}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <input
                  type="file"
                  accept="application/json"
                  onChange={(e) => {
                    setFile(e.target.files?.[0] ?? null);
                    setUploadError(null);
                    setUploadResult(null);
                  }}
                  className="text-sm"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={replaceAll}
                  onChange={(e) => setReplaceAll(e.target.checked)}
                  className="h-4 w-4 rounded border-mauve/50 text-rose focus:ring-rose"
                />
                Replace all existing toys for this user (recommended for full refresh)
              </label>
              <div>
                <span className="block text-sm text-mauve mb-1">Copy images</span>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm text-ink cursor-pointer">
                    <input
                      type="radio"
                      name="copyImages"
                      checked={copyImages}
                      onChange={() => setCopyImages(true)}
                      className="h-4 w-4 border-mauve/50 text-rose focus:ring-rose"
                    />
                    Yes — re-upload into target user’s folder (recommended)
                  </label>
                  <label className="flex items-center gap-2 text-sm text-ink cursor-pointer">
                    <input
                      type="radio"
                      name="copyImages"
                      checked={!copyImages}
                      onChange={() => setCopyImages(false)}
                      className="h-4 w-4 border-mauve/50 text-rose focus:ring-rose"
                    />
                    No — keep image URLs by reference (faster, same assets)
                  </label>
                </div>
              </div>
              {uploadError && <p className="text-sm text-rose">{uploadError}</p>}
              {uploadResult && (
                <p className="text-sm text-mauve">
                  Imported {uploadResult.imported} toys into user.{" "}
                  {uploadResult.replaceAll ? "Existing data was cleared first." : ""}
                </p>
              )}
              <button
                type="submit"
                disabled={uploading}
                className="min-h-[48px] rounded-xl border border-mauve/30 bg-cream/70 px-5 py-3 text-sm font-medium text-ink hover:bg-cream disabled:opacity-60"
              >
                {uploading ? "Restoring…" : "Restore from backup"}
              </button>
            </form>
          </section>
        </>
      )}
    </div>
  );
}
