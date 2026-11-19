import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2,
  Plus,
  Search,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  KeyRound,
  Pencil,
  Trash2,
  LogIn,
  Server,
  Users,
  Wifi,
  Calendar,
  Copy,
  Check,
  X,
  AlertTriangle,
  Lock,
  Unlock,
  Clock,
} from 'lucide-react';
import { TenantWithStats } from '../services/mockDatabase';
import { apiFetch as fetch } from '../services/authSession';

interface TenantManagerViewProps {
  onImpersonateSuccess: (data: {
    token: string;
    sessionId?: string;
    user: unknown;
    tenant: unknown;
    impersonator: unknown;
  }) => Promise<void>;
  showToast: (msg: string) => void;
}

const PRESET_ISOLATION_REASONS = [
  'Tagihan sewa bulanan belum dibayar. Silakan lakukan pembayaran dan konfirmasi ke Admin untuk aktivasi kembali.',
  'Masa aktif sewa aplikasi telah berakhir. Hubungi Superadmin untuk perpanjangan layanan.',
  'Akun dinonaktifkan sementara untuk pemeriksaan administrasi / keamanan.',
];

export const TenantManagerView: React.FC<TenantManagerViewProps> = ({
  onImpersonateSuccess,
  showToast,
}) => {
  const [tenants, setTenants] = useState<TenantWithStats[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<
    'ALL' | 'ACTIVE' | 'ISOLATED' | 'EXPIRED'
  >('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Create / Edit Tenant Modal
  const [showFormModal, setShowFormModal] = useState<boolean>(false);
  const [editingTenant, setEditingTenant] = useState<TenantWithStats | null>(null);
  const [formCompanyName, setFormCompanyName] = useState<string>('');
  const [formOwnerName, setFormOwnerName] = useState<string>('');
  const [formPhone, setFormPhone] = useState<string>('');
  const [formAdminUsername, setFormAdminUsername] = useState<string>('');
  const [formAdminEmail, setFormAdminEmail] = useState<string>('');
  const [formAdminPassword, setFormAdminPassword] = useState<string>('');
  const [formPlanName, setFormPlanName] = useState<string>('ISP Pro');
  const [formMonthlyPrice, setFormMonthlyPrice] = useState<number>(150000);
  const [formExpiresAt, setFormExpiresAt] = useState<string>('');
  const [formMaxOlts, setFormMaxOlts] = useState<number>(0);
  const [formMaxUsers, setFormMaxUsers] = useState<number>(0);
  const [formNotes, setFormNotes] = useState<string>('');
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Isolate Modal
  const [isolateTarget, setIsolateTarget] = useState<TenantWithStats | null>(null);
  const [isolateReason, setIsolateReason] = useState<string>(
    PRESET_ISOLATION_REASONS[0]
  );
  const [isolating, setIsolating] = useState<boolean>(false);

  // Reactivate Modal
  const [activateTarget, setActivateTarget] = useState<TenantWithStats | null>(null);
  const [activateExpiresAt, setActivateExpiresAt] = useState<string>('');
  const [activating, setActivating] = useState<boolean>(false);

  // Reset Password Modal
  const [resetPwdTarget, setResetPwdTarget] = useState<TenantWithStats | null>(null);
  const [resetPwdValue, setResetPwdValue] = useState<string>('');
  const [resettingPwd, setResettingPwd] = useState<boolean>(false);

  // Delete Confirmation Modal
  const [deleteTarget, setDeleteTarget] = useState<TenantWithStats | null>(null);
  const [deleteConfirmSlug, setDeleteConfirmSlug] = useState<string>('');
  const [deleting, setDeleting] = useState<boolean>(false);

  // Created Credentials Receipt Modal
  const [createdReceipt, setCreatedReceipt] = useState<{
    companyName: string;
    username: string;
    password: string;
    planName: string;
    expiresAt: string | null;
  } | null>(null);

  const loadTenants = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await fetch('/api/superadmin/tenants');
      const data = await resp.json();
      if (resp.ok && data?.ok && Array.isArray(data.tenants)) {
        setTenants(data.tenants);
      } else {
        showToast(data?.error || 'Gagal memuat daftar akun penyewa.');
      }
    } catch {
      showToast('Gagal terhubung ke server untuk memuat daftar penyewa.');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadTenants();
  }, [loadTenants]);

  const openCreateModal = () => {
    setEditingTenant(null);
    setFormCompanyName('');
    setFormOwnerName('');
    setFormPhone('');
    setFormAdminUsername('');
    setFormAdminEmail('');
    setFormAdminPassword('');
    setFormPlanName('ISP Standard');
    setFormMonthlyPrice(150000);
    // Default expiry 30 days from today (editable or can be cleared for unlimited)
    const nextMonth = new Date(Date.now() + 30 * 24 * 3600 * 1000);
    setFormExpiresAt(nextMonth.toISOString().slice(0, 10));
    setFormMaxOlts(0);
    setFormMaxUsers(0);
    setFormNotes('');
    setFormError(null);
    setShowFormModal(true);
  };

  const openEditModal = (t: TenantWithStats) => {
    setEditingTenant(t);
    setFormCompanyName(t.company_name);
    setFormOwnerName(t.owner_name);
    setFormPhone(t.phone);
    setFormAdminUsername(t.admin_username);
    setFormAdminEmail(t.admin_email);
    setFormAdminPassword('');
    setFormPlanName(t.plan_name);
    setFormMonthlyPrice(t.monthly_price);
    setFormExpiresAt(t.expires_at || '');
    setFormMaxOlts(t.max_olts);
    setFormMaxUsers(t.max_users);
    setFormNotes(t.notes);
    setFormError(null);
    setShowFormModal(true);
  };

  const handleSaveTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSubmitting(true);
    try {
      if (editingTenant) {
        const resp = await fetch(`/api/superadmin/tenants/${editingTenant.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            company_name: formCompanyName.trim(),
            owner_name: formOwnerName.trim(),
            admin_email: formAdminEmail.trim(),
            phone: formPhone.trim(),
            plan_name: formPlanName.trim(),
            monthly_price: Number(formMonthlyPrice || 0),
            expires_at: formExpiresAt.trim() || null,
            max_olts: Number(formMaxOlts || 0),
            max_users: Number(formMaxUsers || 0),
            notes: formNotes.trim(),
          }),
        });
        const data = await resp.json();
        if (!resp.ok || !data?.ok) {
          setFormError(data?.error || 'Gagal memperbarui data penyewa.');
          return;
        }
        setShowFormModal(false);
        showToast(`✓ Data penyewa "${formCompanyName.trim()}" berhasil diperbarui.`);
        await loadTenants();
      } else {
        const resp = await fetch('/api/superadmin/tenants', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            company_name: formCompanyName.trim(),
            owner_name: formOwnerName.trim() || formCompanyName.trim(),
            phone: formPhone.trim(),
            admin_username: formAdminUsername.trim().toLowerCase(),
            admin_email: formAdminEmail.trim(),
            admin_password: formAdminPassword,
            plan_name: formPlanName.trim(),
            monthly_price: Number(formMonthlyPrice || 0),
            expires_at: formExpiresAt.trim() || null,
            max_olts: Number(formMaxOlts || 0),
            max_users: Number(formMaxUsers || 0),
            notes: formNotes.trim(),
          }),
        });
        const data = await resp.json();
        if (!resp.ok || !data?.ok) {
          setFormError(data?.error || 'Gagal membuat akun penyewa baru.');
          return;
        }
        setShowFormModal(false);
        setCreatedReceipt({
          companyName: formCompanyName.trim(),
          username: formAdminUsername.trim().toLowerCase(),
          password: formAdminPassword,
          planName: formPlanName.trim(),
          expiresAt: formExpiresAt.trim() || null,
        });
        showToast(data.message || `✓ Akun penyewa "${formCompanyName.trim()}" berhasil dibuat!`);
        await loadTenants();
      }
    } catch {
      setFormError('Gagal terhubung ke server.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleConfirmIsolate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isolateTarget) return;
    setIsolating(true);
    try {
      const resp = await fetch(
        `/api/superadmin/tenants/${isolateTarget.id}/isolate`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: isolateReason.trim() }),
        }
      );
      const data = await resp.json();
      if (!resp.ok || !data?.ok) {
        showToast(data?.error || 'Gagal mengisolir akun penyewa.');
        return;
      }
      setIsolateTarget(null);
      showToast(data.message || 'Akun penyewa berhasil diisolir.');
      await loadTenants();
    } catch {
      showToast('Gagal menghubungi server.');
    } finally {
      setIsolating(false);
    }
  };

  const handleConfirmActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activateTarget) return;
    setActivating(true);
    try {
      const resp = await fetch(
        `/api/superadmin/tenants/${activateTarget.id}/activate`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            new_expires_at: activateExpiresAt.trim() || null,
          }),
        }
      );
      const data = await resp.json();
      if (!resp.ok || !data?.ok) {
        showToast(data?.error || 'Gagal mengaktifkan kembali akun penyewa.');
        return;
      }
      setActivateTarget(null);
      showToast(data.message || 'Akun penyewa berhasil diaktifkan kembali.');
      await loadTenants();
    } catch {
      showToast('Gagal menghubungi server.');
    } finally {
      setActivating(false);
    }
  };

  const handleConfirmResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPwdTarget) return;
    setResettingPwd(true);
    try {
      const resp = await fetch(
        `/api/superadmin/tenants/${resetPwdTarget.id}/reset-password`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ newPassword: resetPwdValue }),
        }
      );
      const data = await resp.json();
      if (!resp.ok || !data?.ok) {
        showToast(data?.error || 'Gagal mereset password admin penyewa.');
        return;
      }
      setResetPwdTarget(null);
      setResetPwdValue('');
      showToast(data.message || 'Password admin penyewa berhasil direset.');
    } catch {
      showToast('Gagal menghubungi server.');
    } finally {
      setResettingPwd(false);
    }
  };

  const handleConfirmDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deleteTarget) return;
    if (deleteConfirmSlug.trim().toLowerCase() !== deleteTarget.admin_username.toLowerCase()) {
      showToast(`Ketik "${deleteTarget.admin_username}" untuk konfirmasi hapus permanen.`);
      return;
    }
    setDeleting(true);
    try {
      const resp = await fetch(`/api/superadmin/tenants/${deleteTarget.id}`, {
        method: 'DELETE',
      });
      const data = await resp.json();
      if (!resp.ok || !data?.ok) {
        showToast(data?.error || 'Gagal menghapus akun penyewa.');
        return;
      }
      setDeleteTarget(null);
      setDeleteConfirmSlug('');
      showToast(data.message || 'Akun penyewa berhasil dihapus permanen.');
      await loadTenants();
    } catch {
      showToast('Gagal menghubungi server.');
    } finally {
      setDeleting(false);
    }
  };

  const handleImpersonate = async (t: TenantWithStats) => {
    try {
      const resp = await fetch(`/api/superadmin/tenants/${t.id}/impersonate`, {
        method: 'POST',
      });
      const data = await resp.json();
      if (!resp.ok || !data?.ok || !data.token) {
        showToast(data?.error || 'Gagal masuk ke workspace penyewa.');
        return;
      }
      await onImpersonateSuccess(data);
    } catch {
      showToast('Gagal menghubungi server untuk masuk workspace penyewa.');
    }
  };

  const copyText = (id: string, text: string) => {
    try {
      void navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1800);
    } catch {
      // ignore
    }
  };

  const totalTenants = tenants.length;
  const activeTenants = tenants.filter(
    (t) => t.status === 'ACTIVE' && !t.stats.is_expired
  ).length;
  const isolatedTenants = tenants.filter(
    (t) => t.status === 'ISOLATED' || t.stats.is_expired
  ).length;
  const totalRentedOlts = tenants.reduce((acc, t) => acc + t.stats.olts_count, 0);
  const totalRentedOnus = tenants.reduce((acc, t) => acc + t.stats.onus_count, 0);

  const filteredTenants = tenants.filter((t) => {
    if (statusFilter === 'ACTIVE' && (t.status !== 'ACTIVE' || t.stats.is_expired)) {
      return false;
    }
    if (statusFilter === 'ISOLATED' && t.status !== 'ISOLATED') {
      return false;
    }
    if (statusFilter === 'EXPIRED' && !t.stats.is_expired) {
      return false;
    }
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      t.company_name.toLowerCase().includes(q) ||
      t.owner_name.toLowerCase().includes(q) ||
      t.admin_username.toLowerCase().includes(q) ||
      t.admin_email.toLowerCase().includes(q) ||
      t.phone.toLowerCase().includes(q) ||
      t.plan_name.toLowerCase().includes(q)
    );
  });

  const formatRupiah = (amount: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(amount || 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-md border border-purple-500/40 bg-purple-500/15 px-2 py-0.5 font-mono text-[10px] font-bold text-purple-300">
              SUPERADMIN SAAS CONTROL
            </span>
          </div>
          <h2 className="mt-1 text-lg font-bold text-white">
            Manajemen Akun Penyewa (Multi-Tenant Terisolasi) &amp; Kontrol Isolir
          </h2>
          <p className="text-xs text-slate-400">
            Setiap akun penyewa memiliki database OLT, ONU, Zone, RK, User, Backup, dan Branding yang 100% terpisah. Anda dapat mengisolir atau mengaktifkan akun penyewa kapan saja secara instan.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void loadTenants()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-slate-700"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-950/50 transition hover:bg-emerald-500"
          >
            <Plus className="h-4 w-4" />
            Buat Akun Penyewa Baru
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Penyewa</span>
            <Building2 className="h-4 w-4 text-sky-400" />
          </div>
          <div className="mt-2 font-mono text-2xl font-bold text-white">
            {totalTenants}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Workspace 100% terisolasi
          </div>
        </div>

        <div className="rounded-xl border border-emerald-500/25 bg-emerald-950/20 p-4">
          <div className="flex items-center justify-between text-xs text-emerald-300/90">
            <span>Penyewa Aktif</span>
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 font-mono text-2xl font-bold text-emerald-300">
            {activeTenants}
          </div>
          <div className="mt-1 text-[11px] text-emerald-200/70">
            Dapat login &amp; kelola OLT
          </div>
        </div>

        <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-4">
          <div className="flex items-center justify-between text-xs text-rose-300/90">
            <span>Diisolir / Expired</span>
            <ShieldAlert className="h-4 w-4 text-rose-400" />
          </div>
          <div className="mt-2 font-mono text-2xl font-bold text-rose-300">
            {isolatedTenants}
          </div>
          <div className="mt-1 text-[11px] text-rose-200/70">
            Akses diblokir &amp; sesi diputus
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Infrastruktur Penyewa</span>
            <Server className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 font-mono text-2xl font-bold text-white">
            {totalRentedOlts}{' '}
            <span className="text-xs font-normal text-slate-400">OLT</span> ·{' '}
            {totalRentedOnus}{' '}
            <span className="text-xs font-normal text-slate-400">ONU</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Tersebar di seluruh akun sewa
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-900/80 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { id: 'ALL', label: `Semua (${totalTenants})` },
              { id: 'ACTIVE', label: `Aktif (${activeTenants})` },
              {
                id: 'ISOLATED',
                label: `Diisolir (${tenants.filter((t) => t.status === 'ISOLATED').length})`,
              },
              {
                id: 'EXPIRED',
                label: `Expired (${tenants.filter((t) => t.stats.is_expired).length})`,
              },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                statusFilter === tab.id
                  ? 'bg-sky-600 text-white'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama ISP, username, HP, paket..."
            className="w-full rounded-lg border border-slate-700 bg-slate-950 py-1.5 pr-3 pl-9 text-xs text-white placeholder-slate-500"
          />
        </div>
      </div>

      {/* Tenant List Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/80">
        {loading && tenants.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-12 text-xs text-slate-400">
            <RefreshCw className="h-4 w-4 animate-spin text-sky-400" />
            Memuat data akun penyewa...
          </div>
        ) : filteredTenants.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-sky-400">
              <Building2 className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-white">
              {tenants.length === 0
                ? 'Belum Ada Akun Penyewa'
                : 'Tidak Ada Penyewa yang Cocok dengan Filter'}
            </h3>
            <p className="mt-1 max-w-md text-xs text-slate-400">
              {tenants.length === 0
                ? 'Klik "Buat Akun Penyewa Baru" untuk membuat akun ISP/client yang memiliki database OLT & sub-user 100% terpisah dan dapat Anda isolir kapan saja.'
                : 'Coba ubah kata kunci pencarian atau pilih tab filter lainnya.'}
            </p>
            {tenants.length === 0 && (
              <button
                type="button"
                onClick={openCreateModal}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500"
              >
                <Plus className="h-4 w-4" />
                Buat Akun Penyewa Pertama
              </button>
            )}
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950/70 text-slate-300">
              <tr>
                <th className="px-4 py-3">ISP / Penyewa</th>
                <th className="px-4 py-3">Login Admin Penyewa</th>
                <th className="px-4 py-3">Status &amp; Masa Sewa</th>
                <th className="px-4 py-3">Resource Terpakai</th>
                <th className="px-4 py-3">Paket &amp; Biaya</th>
                <th className="px-4 py-3 text-right">Kontrol Superadmin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredTenants.map((t) => {
                const isIsolated = t.status === 'ISOLATED';
                const isExpired = t.stats.is_expired;
                return (
                  <tr
                    key={t.id}
                    className={`transition ${
                      isIsolated
                        ? 'bg-rose-950/15 hover:bg-rose-950/25'
                        : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="px-4 py-3.5 align-top">
                      <div className="font-bold text-white">{t.company_name}</div>
                      <div className="mt-0.5 text-[11px] text-slate-400">
                        PIC: {t.owner_name || '-'}
                        {t.phone ? ` · ${t.phone}` : ''}
                      </div>
                      <div className="mt-1 font-mono text-[10px] text-slate-500">
                        ID: {t.slug}
                      </div>
                      {t.notes && (
                        <div className="mt-1 max-w-[220px] truncate text-[10px] text-amber-300/80" title={t.notes}>
                          Catatan: {t.notes}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3.5 align-top">
                      <div className="flex items-center gap-1.5">
                        <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-[11px] font-bold text-sky-300">
                          {t.admin_username}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyText(t.id, t.admin_username)}
                          className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
                          title="Salin username"
                        >
                          {copiedId === t.id ? (
                            <Check className="h-3 w-3 text-emerald-400" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                      <div className="mt-1 text-[11px] text-slate-400">
                        {t.admin_email}
                      </div>
                      <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-500">
                        <Clock className="h-3 w-3" />
                        Last login: {t.stats.last_login_at || 'Belum pernah'}
                      </div>
                    </td>

                    <td className="px-4 py-3.5 align-top">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {isIsolated ? (
                          <span className="inline-flex items-center gap-1 rounded border border-rose-500/50 bg-rose-950/80 px-2 py-0.5 font-mono text-[10px] font-bold text-rose-300">
                            <Lock className="h-3 w-3" />
                            DIISOLIR
                          </span>
                        ) : isExpired ? (
                          <span className="inline-flex items-center gap-1 rounded border border-amber-500/50 bg-amber-950/80 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-300">
                            <AlertTriangle className="h-3 w-3" />
                            EXPIRED (AUTO-ISOLIR)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded border border-emerald-500/40 bg-emerald-950/80 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-300">
                            <ShieldCheck className="h-3 w-3" />
                            AKTIF
                          </span>
                        )}
                        {t.stats.active_sessions_count > 0 && (
                          <span className="rounded bg-sky-500/15 px-1.5 py-0.5 font-mono text-[10px] text-sky-300">
                            {t.stats.active_sessions_count} online
                          </span>
                        )}
                      </div>
                      <div className="mt-1.5 flex items-center gap-1 text-[11px] text-slate-300">
                        <Calendar className="h-3 w-3 text-slate-400" />
                        {t.expires_at ? (
                          <span className={isExpired ? 'font-bold text-rose-300' : ''}>
                            Exp: {t.expires_at}
                          </span>
                        ) : (
                          <span className="text-emerald-300/90">Unlimited</span>
                        )}
                      </div>
                      {isIsolated && t.isolation_reason && (
                        <div
                          className="mt-1 max-w-[230px] rounded border border-rose-500/30 bg-rose-950/40 px-2 py-1 text-[10px] text-rose-200/90"
                          title={t.isolation_reason}
                        >
                          {t.isolation_reason}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3.5 align-top">
                      <div className="space-y-1 font-mono text-[11px]">
                        <div className="flex items-center gap-1.5 text-slate-200">
                          <Server className="h-3 w-3 text-sky-400" />
                          <span>
                            OLT: <b>{t.stats.olts_count}</b>
                            {t.max_olts > 0 ? ` / ${t.max_olts}` : ' / ∞'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-200">
                          <Wifi className="h-3 w-3 text-emerald-400" />
                          <span>
                            ONU: <b>{t.stats.onus_count}</b> ({t.stats.online_onus_count} up)
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-200">
                          <Users className="h-3 w-3 text-purple-400" />
                          <span>
                            User: <b>{t.stats.users_count}</b>
                            {t.max_users > 0 ? ` / ${t.max_users}` : ' / ∞'}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 align-top">
                      <div className="font-semibold text-white">{t.plan_name}</div>
                      <div className="mt-0.5 font-mono text-[11px] text-emerald-300">
                        {t.monthly_price > 0
                          ? `${formatRupiah(t.monthly_price)}/bln`
                          : 'Gratis / Custom'}
                      </div>
                      <div className="mt-1 text-[10px] text-slate-500">
                        Dibuat: {t.created_at}
                      </div>
                    </td>

                    <td className="px-4 py-3.5 align-top text-right">
                      <div className="flex flex-wrap items-center justify-end gap-1.5">
                        {isIsolated || isExpired ? (
                          <button
                            type="button"
                            onClick={() => {
                              setActivateTarget(t);
                              if (isExpired) {
                                const nextMonth = new Date(
                                  Date.now() + 30 * 24 * 3600 * 1000
                                );
                                setActivateExpiresAt(
                                  nextMonth.toISOString().slice(0, 10)
                                );
                              } else {
                                setActivateExpiresAt(t.expires_at || '');
                              }
                            }}
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[11px] font-bold text-white transition hover:bg-emerald-500"
                            title="Cabut isolir dan aktifkan kembali akun penyewa"
                          >
                            <Unlock className="h-3.5 w-3.5" />
                            Aktifkan
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setIsolateTarget(t);
                              setIsolateReason(
                                t.isolation_reason || PRESET_ISOLATION_REASONS[0]
                              );
                            }}
                            className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-2.5 py-1.5 text-[11px] font-bold text-white transition hover:bg-rose-500"
                            title="Isolir akun penyewa seketika dan putuskan semua sesi aktifnya"
                          >
                            <Lock className="h-3.5 w-3.5" />
                            Isolir
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => void handleImpersonate(t)}
                          className="inline-flex items-center gap-1 rounded-lg border border-sky-500/40 bg-sky-500/15 px-2.5 py-1.5 text-[11px] font-semibold text-sky-300 transition hover:bg-sky-500/25 hover:text-white"
                          title="Masuk ke workspace penyewa ini sebagai Admin mereka"
                        >
                          <LogIn className="h-3.5 w-3.5" />
                          Masuk
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setResetPwdTarget(t);
                            setResetPwdValue('');
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2 py-1.5 text-[11px] font-medium text-slate-300 transition hover:bg-slate-700 hover:text-white"
                          title="Reset password admin penyewa"
                        >
                          <KeyRound className="h-3.5 w-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => openEditModal(t)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2 py-1.5 text-[11px] font-medium text-slate-300 transition hover:bg-slate-700 hover:text-white"
                          title="Edit info, kuota, dan tanggal expired penyewa"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setDeleteTarget(t);
                            setDeleteConfirmSlug('');
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-950/50 px-2 py-1.5 text-[11px] font-medium text-rose-300 transition hover:bg-rose-600 hover:text-white"
                          title="Hapus permanen akun penyewa beserta seluruh database-nya"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Create / Edit Tenant Modal */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-xs">
          <div className="animate-modal-in max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-6 text-xs text-slate-100 shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">
                  {editingTenant
                    ? `Edit Penyewa — ${editingTenant.company_name}`
                    : 'Buat Akun Penyewa Baru (Workspace Terisolasi)'}
                </h3>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  {editingTenant
                    ? 'Perbarui informasi bisnis, batas kuota OLT/User, atau masa berlaku sewa.'
                    : 'Akun penyewa otomatis dibuat sebagai ADMIN di workspace terpisah (0 OLT awal), bisa tambah/hapus OLT dan buat sub-user sendiri.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowFormModal(false)}
                className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 flex items-center gap-2 rounded-lg border border-rose-500/40 bg-rose-950/50 px-3 py-2 text-rose-200">
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveTenant} className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block font-semibold text-slate-200">
                    Nama ISP / Perusahaan Penyewa *
                  </label>
                  <input
                    type="text"
                    required
                    value={formCompanyName}
                    onChange={(e) => setFormCompanyName(e.target.value)}
                    placeholder="contoh: PT Berkah Net / RT RW Net Maju"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-semibold text-slate-200">
                    Nama Pemilik / PIC
                  </label>
                  <input
                    type="text"
                    value={formOwnerName}
                    onChange={(e) => setFormOwnerName(e.target.value)}
                    placeholder="contoh: Budi Santoso"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                  />
                </div>
              </div>

              {!editingTenant && (
                <div className="rounded-xl border border-sky-500/30 bg-sky-950/20 p-3.5">
                  <div className="mb-2.5 text-[11px] font-bold text-sky-300">
                    Kredensial Login Admin Penyewa (Role: ADMIN di Workspace Sendiri)
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block font-semibold text-slate-200">
                        Username Login *
                      </label>
                      <input
                        type="text"
                        required
                        value={formAdminUsername}
                        onChange={(e) => setFormAdminUsername(e.target.value)}
                        placeholder="contoh: berkahnet_admin"
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-white"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block font-semibold text-slate-200">
                        Password Awal * (min. 6 karakter)
                      </label>
                      <input
                        type="text"
                        required
                        minLength={6}
                        value={formAdminPassword}
                        onChange={(e) => setFormAdminPassword(e.target.value)}
                        placeholder="contoh: berkah2026"
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-emerald-300"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block font-semibold text-slate-200">
                    Email Admin Penyewa
                  </label>
                  <input
                    type="email"
                    value={formAdminEmail}
                    onChange={(e) => setFormAdminEmail(e.target.value)}
                    placeholder="admin@isp-penyewa.id"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-semibold text-slate-200">
                    Nomor WhatsApp / HP
                  </label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="0812xxxxxxxx"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block font-semibold text-slate-200">
                    Nama Paket Sewa
                  </label>
                  <input
                    type="text"
                    value={formPlanName}
                    onChange={(e) => setFormPlanName(e.target.value)}
                    placeholder="ISP Standard / Pro"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-semibold text-slate-200">
                    Harga Sewa / Bulan (Rp)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={10000}
                    value={formMonthlyPrice}
                    onChange={(e) => setFormMonthlyPrice(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-semibold text-slate-200">
                    Masa Berlaku (Kosong = Unlimited)
                  </label>
                  <input
                    type="date"
                    value={formExpiresAt}
                    onChange={(e) => setFormExpiresAt(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block font-semibold text-slate-200">
                    Batas Maksimal OLT (0 = Unlimited)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formMaxOlts}
                    onChange={(e) => setFormMaxOlts(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-semibold text-slate-200">
                    Batas Maksimal Sub-User (0 = Unlimited)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formMaxUsers}
                    onChange={(e) => setFormMaxUsers(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-white"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block font-semibold text-slate-200">
                  Catatan Tagihan / Internal Superadmin
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Contoh: Jatuh tempo tiap tanggal 5, transfer BCA..."
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-800 pt-4">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 font-semibold text-slate-300 hover:bg-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-5 py-2 font-bold text-white hover:bg-emerald-500 disabled:opacity-60"
                >
                  {formSubmitting ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5" />
                  )}
                  {editingTenant ? 'Simpan Perubahan' : 'Buat Akun Penyewa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Created Credentials Receipt Modal */}
      {createdReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-xs">
          <div className="animate-modal-in w-full max-w-md rounded-2xl border border-emerald-500/40 bg-slate-900 p-6 text-xs text-slate-100 shadow-2xl">
            <div className="mb-3 flex items-center gap-2.5 text-emerald-400">
              <ShieldCheck className="h-6 w-6" />
              <h3 className="text-base font-bold text-white">
                Akun Penyewa Siap Digunakan!
              </h3>
            </div>
            <p className="text-slate-300">
              Workspace terisolasi untuk <b>{createdReceipt.companyName}</b> berhasil dibuat. Kirimkan info login berikut kepada penyewa:
            </p>
            <div className="mt-4 space-y-2 rounded-xl border border-slate-800 bg-slate-950 p-3.5 font-mono text-xs">
              <div>
                <span className="text-slate-400">ISP / Workspace:</span>{' '}
                <span className="font-bold text-white">{createdReceipt.companyName}</span>
              </div>
              <div>
                <span className="text-slate-400">Username Admin:</span>{' '}
                <span className="font-bold text-sky-300">{createdReceipt.username}</span>
              </div>
              <div>
                <span className="text-slate-400">Password Awal:</span>{' '}
                <span className="font-bold text-emerald-300">{createdReceipt.password}</span>
              </div>
              <div>
                <span className="text-slate-400">Paket / Masa Aktif:</span>{' '}
                <span className="text-slate-200">
                  {createdReceipt.planName} ({createdReceipt.expiresAt || 'Unlimited'})
                </span>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  const msg = `Akses SmartOLT - ${createdReceipt.companyName}\nURL: ${window.location.origin}\nUsername: ${createdReceipt.username}\nPassword: ${createdReceipt.password}\nMasa Aktif: ${createdReceipt.expiresAt || 'Unlimited'}`;
                  copyText('receipt', msg);
                  showToast('✓ Info login disalin ke clipboard (siap paste ke WhatsApp).');
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-sky-500/40 bg-sky-500/15 px-3.5 py-2 font-semibold text-sky-300 hover:bg-sky-500/25"
              >
                <Copy className="h-3.5 w-3.5" />
                Salin untuk WhatsApp
              </button>
              <button
                type="button"
                onClick={() => setCreatedReceipt(null)}
                className="rounded-lg bg-emerald-600 px-4 py-2 font-bold text-white hover:bg-emerald-500"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Isolate Modal */}
      {isolateTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-xs">
          <div className="animate-modal-in w-full max-w-lg rounded-2xl border border-rose-500/40 bg-slate-900 p-6 text-xs text-slate-100 shadow-2xl">
            <div className="mb-3 flex items-center gap-2.5 text-rose-400">
              <ShieldAlert className="h-6 w-6" />
              <div>
                <h3 className="text-base font-bold text-white">
                  Isolir Akun Penyewa — {isolateTarget.company_name}
                </h3>
                <p className="text-[11px] text-rose-200/80">
                  Semua user di workspace ini akan langsung terputus (logout paksa) dan diblokir dari login sampai Anda aktifkan kembali.
                </p>
              </div>
            </div>

            <form onSubmit={handleConfirmIsolate} className="mt-4 space-y-3">
              <div>
                <label className="mb-1.5 block font-semibold text-slate-200">
                  Pilih Alasan Cepat:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_ISOLATION_REASONS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setIsolateReason(preset)}
                      className="rounded-md border border-slate-700 bg-slate-800 px-2.5 py-1 text-[11px] text-slate-300 hover:border-rose-500/50 hover:text-white"
                    >
                      Preset #{idx + 1}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1 block font-semibold text-slate-200">
                  Pesan Pemberitahuan Isolir (ditampilkan ke penyewa) *
                </label>
                <textarea
                  required
                  rows={3}
                  value={isolateReason}
                  onChange={(e) => setIsolateReason(e.target.value)}
                  className="w-full rounded-lg border border-rose-500/40 bg-slate-950 px-3 py-2 text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-800 pt-3">
                <button
                  type="button"
                  onClick={() => setIsolateTarget(null)}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 font-semibold text-slate-300 hover:bg-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isolating}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-5 py-2 font-bold text-white hover:bg-rose-500 disabled:opacity-60"
                >
                  <Lock className="h-3.5 w-3.5" />
                  {isolating ? 'Mengisolir...' : 'Isolir Sekarang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Activate / Un-isolate Modal */}
      {activateTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-xs">
          <div className="animate-modal-in w-full max-w-md rounded-2xl border border-emerald-500/40 bg-slate-900 p-6 text-xs text-slate-100 shadow-2xl">
            <div className="mb-3 flex items-center gap-2.5 text-emerald-400">
              <Unlock className="h-6 w-6" />
              <h3 className="text-base font-bold text-white">
                Aktifkan Kembali — {activateTarget.company_name}
              </h3>
            </div>
            <p className="text-slate-300">
              Status isolir akan segera dicabut dan penyewa dapat langsung login kembali dengan seluruh data OLT &amp; ONU mereka tetap utuh.
            </p>
            <form onSubmit={handleConfirmActivate} className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block font-semibold text-slate-200">
                  Perbarui Tanggal Masa Berlaku (Kosong = Unlimited)
                </label>
                <input
                  type="date"
                  value={activateExpiresAt}
                  onChange={(e) => setActivateExpiresAt(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-white"
                />
              </div>
              <div className="flex items-center justify-end gap-2 border-t border-slate-800 pt-3">
                <button
                  type="button"
                  onClick={() => setActivateTarget(null)}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 font-semibold text-slate-300 hover:bg-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={activating}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-5 py-2 font-bold text-white hover:bg-emerald-500 disabled:opacity-60"
                >
                  <Unlock className="h-3.5 w-3.5" />
                  {activating ? 'Mengaktifkan...' : 'Cabut Isolir & Aktifkan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Tenant Admin Password Modal */}
      {resetPwdTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-xs">
          <div className="animate-modal-in w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 text-xs text-slate-100 shadow-2xl">
            <h3 className="text-base font-bold text-white">
              Reset Password Admin — {resetPwdTarget.company_name}
            </h3>
            <p className="mt-1 text-slate-400">
              Username: <b className="font-mono text-sky-300">{resetPwdTarget.admin_username}</b>. Sesi aktif penyewa akan diputus setelah password diganti.
            </p>
            <form onSubmit={handleConfirmResetPassword} className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block font-semibold text-slate-200">
                  Password Baru (min. 6 karakter) *
                </label>
                <input
                  type="text"
                  required
                  minLength={6}
                  value={resetPwdValue}
                  onChange={(e) => setResetPwdValue(e.target.value)}
                  placeholder="Masukkan password baru"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-emerald-300"
                />
              </div>
              <div className="flex items-center justify-end gap-2 border-t border-slate-800 pt-3">
                <button
                  type="button"
                  onClick={() => setResetPwdTarget(null)}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 font-semibold text-slate-300 hover:bg-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={resettingPwd}
                  className="rounded-lg bg-sky-600 px-4 py-2 font-bold text-white hover:bg-sky-500 disabled:opacity-60"
                >
                  {resettingPwd ? 'Menyimpan...' : 'Simpan Password Baru'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Permanent Delete Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-xs">
          <div className="animate-modal-in w-full max-w-md rounded-2xl border border-rose-500/50 bg-slate-900 p-6 text-xs text-slate-100 shadow-2xl">
            <div className="mb-2 flex items-center gap-2 text-rose-400">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="text-base font-bold text-white">
                Hapus Permanen Akun Penyewa?
              </h3>
            </div>
            <p className="text-slate-300">
              Seluruh database OLT, ONU, Zone, RK, User, dan Backup milik{' '}
              <b>{deleteTarget.company_name}</b> akan dihapus permanen dan tidak bisa dikembalikan.
            </p>
            <form onSubmit={handleConfirmDelete} className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-slate-300">
                  Ketik username{' '}
                  <b className="font-mono text-rose-300">
                    {deleteTarget.admin_username}
                  </b>{' '}
                  untuk konfirmasi:
                </label>
                <input
                  type="text"
                  required
                  value={deleteConfirmSlug}
                  onChange={(e) => setDeleteConfirmSlug(e.target.value)}
                  placeholder={deleteTarget.admin_username}
                  className="w-full rounded-lg border border-rose-500/40 bg-slate-950 px-3 py-2 font-mono text-white"
                />
              </div>
              <div className="flex items-center justify-end gap-2 border-t border-slate-800 pt-3">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 font-semibold text-slate-300 hover:bg-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={
                    deleting ||
                    deleteConfirmSlug.trim().toLowerCase() !==
                      deleteTarget.admin_username.toLowerCase()
                  }
                  className="rounded-lg bg-rose-600 px-4 py-2 font-bold text-white hover:bg-rose-500 disabled:opacity-40"
                >
                  {deleting ? 'Menghapus...' : 'Hapus Permanen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
