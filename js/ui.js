/* ============================================================
   VENTURE CONNECT — Shared UI helpers
   ============================================================ */

const ICONS = {
  home: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
  spark: '<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>',
  edit: '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>',
  briefcase: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
  trending: '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>',
  message: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  bell: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>',
  check: '<polyline points="20 6 9 17 4 12"/>',
  checkCircle: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
  circle: '<circle cx="12" cy="12" r="9"/>',
  alert: '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
  info: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
  x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
  chevR: '<polyline points="9 18 15 12 9 6"/>',
  chevL: '<polyline points="15 18 9 12 15 6"/>',
  chevD: '<polyline points="6 9 12 15 18 9"/>',
  arrowR: '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>',
  send: '<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>',
  clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',
  target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  layers: '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  heart: '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>',
  bookmark: '<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>',
  star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
  scan: '<path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><line x1="7" y1="12" x2="17" y2="12"/>',
  present: '<rect x="3" y="3" width="18" height="13" rx="2"/><path d="M8 21l4-5 4 5"/><line x1="12" y1="16" x2="12" y2="21"/>',
  users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  verify: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/><path d="M12 2v4"/>',
  trophy: '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>',
  eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
  eyeOff: '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>',
  filter: '<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>',
  trash: '<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  mapPin: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
  dollar: '<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
  menu: '<line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>',
  plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
  refresh: '<polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>',
  external: '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>',
  wallet: '<path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/>',
  award: '<circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
  lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  video: '<polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>'
};

function Icon(name, size) {
  const p = ICONS[name] || ICONS.info;
  size = size || 18;
  return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + '</svg>';
}

/* ---- score ring ---- */
function Ring(score, size, label) {
  size = size || 96;
  const stroke = Math.max(7, Math.round(size * 0.085));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - score / 100);
  const color = score >= 80 ? "var(--success)" : score >= 70 ? "var(--accent-deep)" : "var(--warning)";
  return '<div class="ring-wrap' + (size < 70 ? " sm" : "") + '" style="width:' + size + 'px;height:' + size + 'px">' +
    '<svg width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '">' +
    '<circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="rgba(23,24,31,0.07)" stroke-width="' + stroke + '"/>' +
    '<circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="' + color + '" stroke-width="' + stroke + '" stroke-linecap="round" stroke-dasharray="' + c + '" stroke-dashoffset="' + off + '" transform="rotate(-90 ' + size / 2 + ' ' + size / 2 + ')" style="transition: stroke-dashoffset .9s cubic-bezier(.22,1,.36,1)"/>' +
    '</svg>' +
    '<div class="ring-val"><b>' + score + '</b><span>' + (label || "score") + '</span></div></div>';
}

/* ---- toast ---- */
function toast(msg, type, iconName) {
  type = type || "success";
  const ic = iconName || (type === "error" ? "alert" : type === "info" ? "info" : "checkCircle");
  const root = document.getElementById("toast-root");
  const t = document.createElement("div");
  t.className = "toast " + type;
  t.innerHTML = '<span class="t-ic">' + Icon(ic, 16) + '</span><span>' + msg + '</span>';
  root.appendChild(t);
  setTimeout(() => { t.classList.add("out"); setTimeout(() => t.remove(), 320); }, 3200);
}

/* ---- modal ---- */
function openModal(html) {
  const root = document.getElementById("modal-root");
  root.innerHTML = '<div class="modal-backdrop" onclick="if(event.target===this)closeModal()"><div class="modal">' + html + '</div></div>';
}
function closeModal() { document.getElementById("modal-root").innerHTML = ""; }

/* ---- dropdown ---- */
function openDropdown(anchorId, html) {
  closeDropdown();
  const a = document.getElementById(anchorId);
  if (!a) return;
  const d = document.createElement("div");
  d.className = "dropdown";
  d.id = "active-dropdown";
  d.dataset.anchor = anchorId;
  d.innerHTML = html;
  document.body.appendChild(d);
  const r = a.getBoundingClientRect();
  const ddw = 260;
  let left = Math.min(r.left, window.innerWidth - ddw - 12);
  d.style.left = left + "px";
  d.style.top = (r.bottom + 8) + "px";
  document.addEventListener("click", closeDropdownOnOutside, { once: true });
}
function closeDropdown() {
  const d = document.getElementById("active-dropdown");
  if (d) d.remove();
}
function closeDropdownOnOutside(e) {
  const d = document.getElementById("active-dropdown");
  if (!d) return;
  if (e.target.closest("#active-dropdown")) return;
  const anchor = d.dataset.anchor;
  if (anchor && e.target.closest("#" + anchor)) return;
  closeDropdown();
}

/* ---- badges & status maps ---- */
const QC_STATUS_META = {
  "Ready to Submit": { tone: "success", icon: "checkCircle" },
  "Needs Revision": { tone: "warning", icon: "alert" },
  "Incomplete": { tone: "danger", icon: "alert" },
  "Eligibility Mismatch": { tone: "danger", icon: "lock" },
  "Manual Review": { tone: "info", icon: "eye" }
};
function qcBadge(status) {
  const m = QC_STATUS_META[status] || { tone: "neutral", icon: "info" };
  return '<span class="badge badge-' + m.tone + '">' + Icon(m.icon, 12) + status + '</span>';
}
function gateBadge(gate) {
  if (gate === "passed") return '<span class="badge badge-success">' + Icon("shield", 12) + 'PASSED</span>';
  if (gate === "review") return '<span class="badge badge-info">' + Icon("eye", 12) + 'In Review</span>';
  return '<span class="badge badge-warning">' + Icon("clock", 12) + 'In Progress</span>';
}
function evidenceBadge(st) {
  const map = {
    "Verified": "badge-success",
    "Under review": "badge-info",
    "Needs clarification": "badge-warning"
  };
  return '<span class="badge ' + (map[st] || "badge-neutral") + '">' + (st === "Verified" ? Icon("check", 12) : st === "Needs clarification" ? Icon("alert", 12) : Icon("clock", 12)) + st + '</span>';
}

/* ---- avatars / logos ---- */
function initials(name) {
  return name.split(/\s+/).slice(0, 2).map(w => w[0]).join("").toUpperCase();
}
function startupLogo(s, size) {
  size = size || 46;
  return '<div class="sc-logo" style="width:' + size + 'px;height:' + size + 'px;border-radius:' + Math.round(size * 0.3) + 'px;background:' + s.logo + ';font-size:' + Math.round(size * 0.38) + 'px">' + initials(s.name) + '</div>';
}
function personAvatar(name, size) {
  size = size || 40;
  const cls = size < 38 ? " sm" : "";
  return '<div class="avatar' + cls + '" style="width:' + size + 'px;height:' + size + 'px;border-radius:' + Math.round(size * 0.32) + 'px;font-size:' + Math.round(size * 0.36) + 'px">' + initials(name) + '</div>';
}

/* ---- formatting ---- */
function fmtDate(iso) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function timeAgo(s) { return s; }

/* ---- skeleton ---- */
function skeletonCard(lines) {
  lines = lines || 3;
  let out = '<div class="glass card">';
  for (let i = 0; i < lines; i++) out += '<div class="skeleton" style="height:14px;margin-bottom:12px;width:' + (100 - i * 14) + '%"></div>';
  return out + '</div>';
}
function skeletonGrid(n) {
  let out = '<div class="grid-3">';
  for (let i = 0; i < n; i++) out += skeletonCard(4);
  return out + '</div>';
}

/* ---- empty state ---- */
function emptyState(icon, title, sub, ctaHtml) {
  return '<div class="empty glass"><div class="e-ic">' + Icon(icon, 28) + '</div><h3>' + title + '</h3><p>' + sub + '</p>' + (ctaHtml || "") + '</div>';
}

/* ---- progress bar ---- */
function bar(pct, cls) {
  return '<div class="bar ' + (cls || "") + '"><span style="width:' + Math.max(0, Math.min(100, pct)) + '%"></span></div>';
}

/* ---- field status icon for workspace ---- */
function sectionOk(len) { return len >= 25; }

/* ---- relative date from "days ago" style ---- */
function timeLabel(label) { return label; }

/* ---- password visibility toggle ---- */
function togglePwVis(el) {
  const input = el.closest('.field').querySelector('input');
  if (input.type === 'password') {
    input.type = 'text';
    el.innerHTML = Icon('eyeOff', 14);
  } else {
    input.type = 'password';
    el.innerHTML = Icon('eye', 14);
  }
}

window.UI = { Icon, Ring, toast, openModal, closeModal, openDropdown, closeDropdown, qcBadge, gateBadge, evidenceBadge, initials, startupLogo, personAvatar, fmtDate, skeletonCard, skeletonGrid, emptyState, bar };
