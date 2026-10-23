 
const $ = (id) => document.getElementById(id);

// ===============================
// ABSENKU — STATUS LOGIN
// ===============================
const dashboard = $("app-dashboard");
let isLoggedIn = false;

// Dasbor selalu tersembunyi saat aplikasi dimuat
if (dashboard) {
  dashboard.style.display = "none";
}

// Panggil fungsi ini HANYA setelah autentikasi berhasil.
function showDashboardAfterLogin() {
  isLoggedIn = true;

  if (dashboard) {
    dashboard.style.display = "";
  }

  refresh();
}

// Panggil fungsi ini ketika logout.
function hideDashboardAfterLogout() {
  isLoggedIn = false;

  if (dashboard) {
    dashboard.style.display = "none";
  }
}

// ===============================
// PENYIMPANAN DEMO
// ===============================
const STORAGE_KEY = "absenku-demo-v1";

const dateKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const timeNow = () =>
  new Date().toLocaleTimeString("id-ID", {
    timeZone: "Asia/Makassar",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });

const prettyDate = (date = new Date()) =>
  date.toLocaleDateString("id-ID", {
    timeZone: "Asia/Makassar",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });

function getData() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { days: {} };
  } catch {
    return { days: {} };
  }
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function todayRecord() {
  const data = getData();
  return data.days[dateKey()] || {
    checkIn: null,
    checkOut: null
  };
}

// ===============================
// DASBOR DAN RIWAYAT
// ===============================

 function absLang(id, en, ms, zh) {
  let lang = "id";

  try {
    lang = localStorage.getItem("absenku-language") || "id";
  } catch (error) {}

  if (lang === "en") return en;
  if (lang === "ms") return ms;
  if (lang === "zh") return zh || en;

  return id;
}
function refresh() {
  if (!isLoggedIn) return;

  const rec = todayRecord();

   
   $("statusValue").textContent =
  rec.checkOut
    ? absLang("Selesai", "Finished", "Selesai", "已完成")
    : rec.checkIn
    ? absLang("Sudah check-in", "Checked in", "Sudah daftar masuk", "已签到")
    : absLang("Belum absen", "Not checked in", "Belum daftar masuk", "尚未签到");

   $("statusSub").textContent =
  rec.checkOut
    ? absLang("Absensi hari ini lengkap", "Today's attendance is complete", "Kehadiran hari ini lengkap", "今日考勤已完成")
    : rec.checkIn
    ? absLang("Jangan lupa check-out", "Don't forget to check out", "Jangan lupa daftar keluar", "别忘了签退")
    : absLang("Silakan check-in", "Please check in", "Sila daftar masuk", "请签到");


  $("checkInValue").textContent = rec.checkIn || "—";
  $("checkOutValue").textContent = rec.checkOut || "—";

  $("checkInBtn").disabled = !!rec.checkIn;
  $("checkOutBtn").disabled = !rec.checkIn || !!rec.checkOut;

  $("historyBody").innerHTML = "";

  const days = getData().days;
  const keys = Object.keys(days).sort((a, b) => b.localeCompare(a));

   
if (!keys.length) {
  $("historyBody").innerHTML =
    '<tr><td colspan="4" class="empty">' +
    absLang(
      "Belum ada data absensi.",
      "No attendance records yet.",
      "Belum ada rekod kehadiran."
    ) +
    '</td></tr>';
  return;
}


  keys.forEach((k) => {
    const r = days[k];
    const tr = document.createElement("tr");
     
const status = r.checkOut
  ? absLang("Lengkap", "Complete", "Lengkap")
  : r.checkIn
  ? absLang("Belum pulang", "Not checked out", "Belum daftar keluar")
  : absLang("Belum absen", "Not checked in", "Belum daftar masuk");


    tr.innerHTML =
      `<td>${k}</td>` +
      `<td>${r.checkIn || "—"}</td>` +
      `<td>${r.checkOut || "—"}</td>` +
      `<td><span class="status-pill">${status}</span></td>`;

    $("historyBody").appendChild(tr);
  });
}

// ===============================
// CHATBOT DEMO
// ===============================
function say(text, who = "bot") {
  const row = document.createElement("div");
  row.className = `message ${who === "user" ? "user-message" : ""}`;

  if (who === "bot") {
    const av = document.createElement("div");
    av.className = "mini-avatar";
    av.textContent = "✓";
    row.appendChild(av);
  }

  const bubble = document.createElement("div");
  bubble.className = "bubble";

  const b = document.createElement("b");
  b.textContent = who === "bot" ? "ABSENKU" : "Anda";

  const p = document.createElement("p");
  p.textContent = text;

  bubble.append(b, p);
  row.appendChild(bubble);

  $("chatWindow").appendChild(row);
  $("chatWindow").scrollTop = $("chatWindow").scrollHeight;
}

function reply(input) {
  const q = input.toLowerCase();

  if (q.includes("check-in") || q.includes("check in") || q.includes("absen masuk")) {
    const r = todayRecord();
    if (r.checkIn) return "Kamu sudah check-in hari ini pukul " + r.checkIn + ".";
    return "Untuk mencatat kehadiran, tekan tombol Check-in.";
  }

  if (q.includes("check-out") || q.includes("check out") || q.includes("absen pulang")) {
    const r = todayRecord();
    if (r.checkOut) return "Kamu sudah check-out pukul " + r.checkOut + ".";
    if (!r.checkIn) return "Kamu belum check-in. Lakukan check-in terlebih dahulu.";
    return "Untuk mengakhiri absensi, tekan tombol Check-out.";
  }

  if (q.includes("status")) {
    const r = todayRecord();
    return r.checkOut
      ? `Absensi lengkap. Masuk ${r.checkIn}, pulang ${r.checkOut}.`
      : r.checkIn
      ? `Sudah check-in pukul ${r.checkIn}, belum check-out.`
      : "Belum melakukan absensi hari ini.";
  }

  if (q.includes("riwayat") || q.includes("rekap")) {
    const d = getData().days;
    const keys = Object.keys(d).sort((a, b) => b.localeCompare(a));

    if (!keys.length) return "Belum ada riwayat absensi.";

    return "Riwayat terbaru: " +
      keys.slice(0, 5).map((k) =>
        `${k} (masuk ${d[k].checkIn || "—"}, pulang ${d[k].checkOut || "—"})`
      ).join("; ");
  }

  if (q.includes("jam kerja") || q.includes("jadwal")) {
    return "Jadwal demo: masuk 08.00 WITA, toleransi 10 menit, pulang 17.00 WITA. Aturan ini belum diterapkan sebagai validasi absensi.";
  }

  if (q.includes("bantuan") || q.includes("help") || q.includes("halo") || q.includes("hai")) {
    return "Saya dapat membantu mengecek status absensi, riwayat, dan jadwal kerja. Ketik: status, riwayat, atau jam kerja.";
  }

  return "Maaf, saya belum memahami pertanyaan itu. Coba ketik bantuan, status, riwayat, atau jam kerja.";
}

// ===============================
// CHECK-IN
// ===============================
/* ===== UCAPAN SEMANGAT ABSENKU ===== */
function showCheckInCelebration(jamMasuk) {
  const oldPopup = document.getElementById("absenku-celebration");
  if (oldPopup) oldPopup.remove();

  const messages = [
    "Awali hari dengan semangat, akhiri dengan prestasi! 💪",
    "Langkah kecil hari ini membawa kesuksesan esok hari! 🚀",
    "Kerja keras, kerja cerdas, dan tetap jaga semangat! ✨",
    "Hari baru, peluang baru untuk menjadi lebih baik! 🌟",
    "Berikan yang terbaik hari ini. Kamu pasti bisa! 🔥",
    "kerja kerja kerja 🤣🤣🤣🤣🤣👻👻👻"
  ];

  const quote = messages[Math.floor(Math.random() * messages.length)];
  const popup = document.createElement("div");
  popup.id = "absenku-celebration";

  popup.innerHTML = `
    <div class="celebration-card" role="dialog"
         aria-modal="true" aria-labelledby="celebration-title">
      <div class="celebration-icon">🎉</div>
      <h2 id="celebration-title">Absen Masuk Berhasil!</h2>
      <p class="celebration-time">Jam masuk: ${jamMasuk} WITA</p>
      <p class="celebration-message">${quote}</p>
      <p class="celebration-footer">
        Selamat bekerja dan semoga harimu luar biasa!
      </p>
      <button type="button" id="celebration-close">
        Mulai Hari dengan Semangat ✨
      </button>
    </div>
    <div class="celebration-confetti" aria-hidden="true"></div>
  `;

  document.body.appendChild(popup);

  const confetti = popup.querySelector(".celebration-confetti");
  const colors = ["#10b981", "#fbbf24", "#60a5fa", "#c084fc", "#fb7185"];

  for (let i = 0; i < 36; i++) {
    const piece = document.createElement("i");
    piece.style.left = Math.random() * 100 + "%";
    piece.style.background = colors[i % colors.length];
    piece.style.animationDelay = Math.random() * 1.5 + "s";
    piece.style.animationDuration = 2 + Math.random() * 2 + "s";
    piece.style.setProperty("--drift", (Math.random() * 160 - 80) + "px");
    confetti.appendChild(piece);
  }

  const closePopup = () => popup.remove();
  document.getElementById("celebration-close")
    .addEventListener("click", closePopup);

  popup.addEventListener("click", (event) => {
    if (event.target === popup) closePopup();
  });

  setTimeout(() => {
    if (popup.isConnected) closePopup();
  }, 12000);
}

$("checkInBtn").addEventListener("click", () => {
  if (!isLoggedIn) {
    alert("Silakan login terlebih dahulu.");
    return;
  }

  const data = getData();
  const k = dateKey();

  data.days[k] = data.days[k] || {
    checkIn: null,
    checkOut: null
  };

  if (data.days[k].checkIn) return;

  data.days[k].checkIn = timeNow();
  saveData(data);

  $("actionMessage").textContent =
    "Check-in berhasil dicatat pukul " + data.days[k].checkIn + ".";

   say("Check-in berhasil dicatat pukul " + data.days[k].checkIn + ".");
showCheckInCelebration(data.days[k].checkIn);
refresh();
});

// ===============================
// CHECK-OUT
// ===============================
$("checkOutBtn").addEventListener("click", () => {
  if (!isLoggedIn) {
    alert("Silakan login terlebih dahulu.");
    return;
  }

  const data = getData();
  const k = dateKey();
  const r = data.days[k];

  if (!r || !r.checkIn || r.checkOut) return;

  const now = new Date();
  const currentMinutes =
    Number(timeNow().slice(0, 2)) * 60 +
    Number(timeNow().slice(3, 5));

  // Aturan demo: check-out tidak boleh sebelum 17.00 WITA.
  if (currentMinutes < 17 * 60) {
    $("actionMessage").textContent =
      "Check-out ditolak. Jam pulang adalah 17.00 WITA.";
    alert("Check-out belum diizinkan. Tunggu hingga pukul 17.00 WITA.");
    return;
  }

  r.checkOut = timeNow();
  saveData(data);

  $("actionMessage").textContent =
    "Check-out berhasil dicatat pukul " + r.checkOut + ".";

  say("Check-out berhasil dicatat pukul " + r.checkOut + ".");
  refresh();
});

// ===============================
// CHAT DAN TOMBOL BANTUAN
// ===============================
$("chatForm").addEventListener("submit", (e) => {
  e.preventDefault();

  if (!isLoggedIn) {
    alert("Silakan login terlebih dahulu.");
    return;
  }

  const input = $("chatInput");
  const value = input.value.trim();

  if (!value) return;

  say(value, "user");
  say(reply(value));
  input.value = "";
});

document.querySelectorAll("[data-message]").forEach((btn) => {
  btn.addEventListener("click", () => {
    if (!isLoggedIn) {
      alert("Silakan login terlebih dahulu.");
      return;
    }

    const value = btn.dataset.message;
    say(value, "user");
    say(reply(value));
  });
});

// ===============================
// RESET DATA DEMO
// ===============================
$("clearBtn").addEventListener("click", () => {
  if (!isLoggedIn) {
    alert("Silakan login terlebih dahulu.");
    return;
  }

  if (confirm("Hapus seluruh data demo dari browser ini?")) {
    localStorage.removeItem(STORAGE_KEY);
    $("actionMessage").textContent = "Data demo telah direset.";
    refresh();
    say("Data demo sudah direset.");
  }
});

// ===============================
// JAM DIGITAL
// ===============================
function tick() {
  const now = new Date();

  $("clock").textContent = now.toLocaleTimeString("id-ID", {
    timeZone: "Asia/Makassar",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });

  $("clockDate").textContent = prettyDate(now);

  $("todayLabel").textContent = now.toLocaleDateString("id-ID", {
    timeZone: "Asia/Makassar",
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

tick();
setInterval(tick, 1000);

// Jangan tampilkan data dasbor sebelum login.
if (dashboard) dashboard.style.display = "none";

function showCheckInCelebration(jamMasuk) {
  const quotes = [
    "YOSSH! Semangat, Nakama! Terus kejar impianmu! 🏴‍☠️",
    "Satu langkah disiplin hari ini, satu langkah menuju impian besar! 🌊",
    "Pantang menyerah! Jadikan hari ini petualangan terbaikmu! ⚓",
    "Semangat bekerja! Harta karun kesuksesan dimulai dari disiplin! ✨"
  ];

  const quote = quotes[Math.floor(Math.random() * quotes.length)];

  alert(
    "🏴‍☠️ YOSSH! SEMANGAT, NAKAMA!\n\n" +
    quote +
    "\n\nCheck-in berhasil pukul " + jamMasuk + "."
  );
}
