// ─────────────────────────────────────────────────────────────
// app.js  —  Paylaşılan Yardımcı Fonksiyonlar
// Bu dosya normal <script> olarak yüklenir (type=module değil).
// Firebase işlemleri her sayfanın kendi <script type="module">
// bloğunda yapılır.
// ─────────────────────────────────────────────────────────────

// ─── Durum Haritası ───
const STATUS_MAP = {
  'tasarimda':        { label: 'Tasarımda',       icon: '🎨', step: 1 },
  'merkez-onayinda':  { label: 'Merkez Onayında', icon: '🔍', step: 2 },
  'yayinlandi':       { label: 'Yayınlandı',      icon: '✅', step: 3 },
};

function statusBadgeHTML(status) {
  const s = STATUS_MAP[status] || { label: status, icon: '❓' };
  return `<span class="status-badge ${status}">${s.icon} ${s.label}</span>`;
}

// ─── Tarih Formatlayıcılar ───
function formatDate(val) {
  if (!val) return '—';
  // Firestore Timestamp veya ISO string
  const d = val?.toDate ? val.toDate() : new Date(typeof val === 'string' ? val + (val.length === 10 ? 'T00:00' : '') : val);
  return d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function formatDateTime(val) {
  if (!val) return '—';
  const d = val?.toDate ? val.toDate() : new Date(val);
  return d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatRelative(val) {
  if (!val) return '—';
  const d   = val?.toDate ? val.toDate() : new Date(val);
  const now = Date.now();
  const diff = Math.floor((now - d.getTime()) / 1000);
  if (diff < 60)     return 'Az önce';
  if (diff < 3600)   return `${Math.floor(diff / 60)} dakika önce`;
  if (diff < 86400)  return `${Math.floor(diff / 3600)} saat önce`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} gün önce`;
  return formatDate(val);
}

// ─── HTML Escape ───
function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─── Toast Bildirimi ───
function showToast(message, type = 'info') {
  const icons     = { success: '✅', error: '❌', info: 'ℹ️' };
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type] || 'ℹ️'}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.transition = 'all 0.3s ease';
    toast.style.opacity    = '0';
    toast.style.transform  = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ─── Avatar Baş Harfi ───
function makeAvatar(name) {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}
