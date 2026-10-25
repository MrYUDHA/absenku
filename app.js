  
const $ = (id) => document.getElementById(id);

// ===============================
// ABSENKU — STATUS LOGIN
// ===============================
const dashboard = $("app-dashboard");
let isLoggedIn = false;

if (dashboard) dashboard.style.display = "none";

function showDashboardAfterLogin() {
  isLoggedIn = true;
  if (dashboard) dashboard.style.display = "";
  refresh();
}

function hideDashboardAfterLogout() {
  isLoggedIn = false;
  if (dashboard) dashboard.style.display = "none";
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
  } catch (error) {
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
// TERJEMAHAN 4 BAHASA
// ===============================
function getLanguage() {
  try {
    return localStorage.getItem("absenku-language") || "id";
  } catch (error) {
    return "id";
  }
}

function absLang(id, en, ms, zh) {
  const lang = getLanguage();
  if (lang === "en") return en || id;
  if (lang === "ms") return ms || id;
  if (lang === "zh") return zh || en || id;
  return id;
}

// ===============================
// DASBOR DAN RIWAYAT
// ===============================
function refresh() {
  if (!isLoggedIn) return;

  const rec = todayRecord();

  $("statusValue").textContent = rec.checkOut
    ? absLang("Selesai", "Finished", "Selesai", "已完成")
    : rec.checkIn
    ? absLang("Sudah check-in", "Checked in", "Sudah daftar masuk", "已签到")
    : absLang("Belum absen", "Not checked in", "Belum daftar masuk", "尚未签到");

  $("statusSub").textContent = rec.checkOut
    ? absLang("Absensi hari ini lengkap", "Today's attendance is complete", "Kehadiran hari ini lengkap", "今日考勤已完成")
    : rec.checkIn
    ? absLang("Jangan lupa check-out", "Don't forget to check out", "Jangan lupa daftar keluar", "别忘了签退")
    : absLang("Silakan check-in", "Please check in", "Sila daftar masuk", "请签到");

  $("checkInValue").textContent = rec.checkIn || "—";
  $("checkOutValue").textContent = rec.checkOut || "—";

  $("checkInBtn").disabled = !!rec.checkIn;
  $("checkOutBtn").disabled = !rec.checkIn || !!rec.checkOut;

  const historyBody = $("historyBody");
  historyBody.innerHTML = "";

  const days = getData().days;
  const keys = Object.keys(days).sort((a, b) => b.localeCompare(a));

  if (!keys.length) {
    historyBody.innerHTML =
      '<tr><td colspan="4" class="empty">' +
      absLang(
        "Belum ada data absensi.",
        "No attendance records yet.",
        "Belum ada rekod kehadiran.",
        "暂无考勤记录。"
      ) +
      "</td></tr>";
    return;
  }

  keys.forEach((k) => {
    const r = days[k];
    const tr = document.createElement("tr");

    const status = r.checkOut
      ? absLang("Lengkap", "Complete", "Lengkap", "已完成")
      : r.checkIn
      ? absLang("Belum pulang", "Not checked out", "Belum daftar keluar", "尚未签退")
      : absLang("Belum absen", "Not checked in", "Belum daftar masuk", "尚未签到");

    const dateCell = document.createElement("td");
    dateCell.textContent = k;

    const inCell = document.createElement("td");
    inCell.textContent = r.checkIn || "—";

    const outCell = document.createElement("td");
    outCell.textContent = r.checkOut || "—";

    const statusCell = document.createElement("td");
    const pill = document.createElement("span");
    pill.className = "status-pill";
    pill.textContent = status;
    statusCell.appendChild(pill);

    tr.append(dateCell, inCell, outCell, statusCell);
    historyBody.appendChild(tr);
  });
}

// ===============================
// CHATBOT
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
  b.textContent = who === "bot"
    ? "ABSENKU"
    : absLang("Anda", "You", "Anda", "你");

  const p = document.createElement("p");
  p.textContent = text;

  bubble.append(b, p);
  row.appendChild(bubble);

  $("chatWindow").appendChild(row);
  $("chatWindow").scrollTop = $("chatWindow").scrollHeight;
}

function reply(input) {
  const q = input.toLowerCase();
  const r = todayRecord();
  const lang = getLanguage();

  const messages = {
    id: {
      checkedIn: `Kamu sudah check-in hari ini pukul ${r.checkIn}.`,
      pressIn: "Untuk mencatat kehadiran, tekan tombol Check-in.",
      checkedOut: `Kamu sudah check-out pukul ${r.checkOut}.`,
      noIn: "Kamu belum check-in. Lakukan check-in terlebih dahulu.",
      pressOut: "Untuk mengakhiri absensi, tekan tombol Check-out.",
      complete: `Absensi lengkap. Masuk ${r.checkIn}, pulang ${r.checkOut}.`,
      notOut: `Sudah check-in pukul ${r.checkIn}, belum check-out.`,
      noToday: "Belum melakukan absensi hari ini.",
      noHistory: "Belum ada riwayat absensi.",
      history: "Riwayat terbaru: ",
      schedule: "Jadwal demo: masuk 08.00 WITA, toleransi 10 menit, pulang 17.00 WITA. Aturan ini belum diterapkan sebagai validasi absensi.",
      help: "Saya dapat membantu mengecek status absensi, riwayat, dan jadwal kerja. Ketik: status, riwayat, atau jam kerja.",
      unknown: "Maaf, saya belum memahami pertanyaan itu. Coba ketik bantuan, status, riwayat, atau jam kerja."
    },
    en: {
      checkedIn: `You checked in today at ${r.checkIn}.`,
      pressIn: "To record attendance, press Check-in.",
      checkedOut: `You checked out at ${r.checkOut}.`,
      noIn: "You have not checked in. Please check in first.",
      pressOut: "To finish attendance, press Check-out.",
      complete: `Attendance complete. In ${r.checkIn}, out ${r.checkOut}.`,
      notOut: `Checked in at ${r.checkIn}, not checked out yet.`,
      noToday: "You have not recorded attendance today.",
      noHistory: "There is no attendance history yet.",
      history: "Recent history: ",
      schedule: "Demo schedule: check-in 08:00 WITA, 10-minute grace period, check-out 17:00 WITA. These rules are not yet enforced.",
      help: "I can help check attendance status, history, and work schedule. Type: status, history, or work hours.",
      unknown: "Sorry, I don't understand. Try help, status, history, or work hours."
    },
    ms: {
      checkedIn: `Anda telah daftar masuk hari ini pada ${r.checkIn}.`,
      pressIn: "Untuk merekod kehadiran, tekan butang Check-in.",
      checkedOut: `Anda telah daftar keluar pada ${r.checkOut}.`,
      noIn: "Anda belum daftar masuk. Sila daftar masuk dahulu.",
      pressOut: "Untuk menamatkan kehadiran, tekan Check-out.",
      complete: `Kehadiran lengkap. Masuk ${r.checkIn}, keluar ${r.checkOut}.`,
      notOut: `Sudah daftar masuk pada ${r.checkIn}, belum daftar keluar.`,
      noToday: "Anda belum merekod kehadiran hari ini.",
      noHistory: "Belum ada sejarah kehadiran.",
      history: "Sejarah terkini: ",
      schedule: "Jadual demo: masuk 08.00 WITA, toleransi 10 minit, keluar 17.00 WITA. Peraturan ini belum dikuatkuasakan.",
      help: "Saya boleh menyemak status kehadiran, sejarah dan jadual kerja. Taip: status, sejarah atau waktu kerja.",
      unknown: "Maaf, saya belum memahami soalan itu. Cuba taip bantuan, status, sejarah atau waktu kerja."
    },
    zh: {
      checkedIn: `你今天已于 ${r.checkIn} 签到。`,
      pressIn: "如需记录考勤，请点击“签到”按钮。",
      checkedOut: `你已于 ${r.checkOut} 签退。`,
      noIn: "你还没有签到，请先签到。",
      pressOut: "如需结束考勤，请点击“签退”按钮。",
      complete: `考勤已完成。签到时间 ${r.checkIn}，签退时间 ${r.checkOut}。`,
      notOut: `你已于 ${r.checkIn} 签到，尚未签退。`,
      noToday: "你今天还没有进行考勤。",
      noHistory: "暂无考勤记录。",
      history: "最近的考勤记录：",
      schedule: "演示排班：08:00 WITA签到，允许迟到10分钟，17:00 WITA签退。这些规则尚未启用为考勤验证。",
      help: "我可以帮助查询考勤状态、考勤记录和工作时间。请输入：状态、记录或工作时间。",
      unknown: "抱歉，我暂时无法理解这个问题。请尝试输入：帮助、状态、记录或工作时间。"
    }
  };

  const a = messages[lang] || messages.id;

  if (
    q.includes("check-in") || q.includes("check in") ||
    q.includes("absen masuk") || q.includes("签到")
  ) {
    return r.checkIn ? a.checkedIn : a.pressIn;
  }

  if (
    q.includes("check-out") || q.includes("check out") ||
    q.includes("absen pulang") || q.includes("签退")
  ) {
    if (r.checkOut) return a.checkedOut;
    if (!r.checkIn) return a.noIn;
    return a.pressOut;
  }

  if (q.includes("status") || q.includes("状态")) {
    return r.checkOut ? a.complete : r.checkIn ? a.notOut : a.noToday;
  }

  if (
    q.includes("riwayat") || q.includes("rekap") ||
    q.includes("history") || q.includes("sejarah") ||
    q.includes("记录")
  ) {
    const days = getData().days;
    const keys = Object.keys(days).sort((x, y) => y.localeCompare(x));

    if (!keys.length) return a.noHistory;

    return a.history + keys.slice(0, 5).map((k) => {
      const inLabel = lang === "zh" ? "签到" : lang === "en" ? "in" : "masuk";
      const outLabel = lang === "zh" ? "签退" : lang === "en" ? "out" : "pulang";
      return `${k} (${inLabel} ${days[k].checkIn || "—"}, ${outLabel} ${days[k].checkOut || "—"})`;
    }).join("; ");
  }

  if (
    q.includes("jam kerja") || q.includes("jadwal") ||
    q.includes("schedule") || q.includes("工作时间")
  ) return a.schedule;

  if (
    q.includes("bantuan") || q.includes("help") ||
    q.includes("halo") || q.includes("hai") || q.includes("帮助")
  ) return a.help;

  return a.unknown;
}

// ===============================
// UCAPAN SEMANGAT CHECK-IN
// ===============================
function showCheckInCelebration(jamMasuk) {
  const oldPopup = document.getElementById("absenku-celebration");
  if (oldPopup) oldPopup.remove();

  const quotes = [
    absLang(
      "Awali hari dengan semangat, akhiri dengan prestasi! 💪",
      "Start your day with energy and end it with achievement! 💪",
      "Mulakan hari dengan semangat, akhiri dengan kejayaan! 💪",
      "以饱满的热情开始新的一天，以出色的成绩结束！💪"
    ),
    absLang(
      "Langkah kecil hari ini membawa kesuksesan esok hari! 🚀",
      "Small steps today lead to tomorrow's success! 🚀",
      "Langkah kecil hari ini membawa kejayaan esok! 🚀",
      "今天迈出一小步，明天成就大成功！🚀"
    ),
    absLang(
      "Kerja keras, kerja cerdas, dan tetap jaga semangat! ✨",
      "Work hard, work smart, and keep your spirits up! ✨",
      "Bekerja keras, bekerja bijak dan kekal bersemangat! ✨",
      "努力工作，聪明做事，保持热情！✨"
    ),
    absLang(
      "YOSSH! Semangat, Nakama! Terus kejar impianmu! 🏴‍☠️",
      "YOSSH! Stay strong, Nakama! Keep chasing your dreams! 🏴‍☠️",
      "YOSSH! Terus bersemangat, Nakama! Kejar impian anda! 🏴‍☠️",
      "哟西！伙伴们，加油！继续追逐梦想！🏴‍☠️"
    )
  ];

  const quote = quotes[Math.floor(Math.random() * quotes.length)];
  const title = absLang("Absen Masuk Berhasil!", "Check-in Successful!", "Daftar Masuk Berjaya!", "签到成功！");
  const timeLabel = absLang("Jam masuk:", "Check-in time:", "Waktu masuk:", "签到时间：");
  const footer = absLang("Selamat bekerja dan semoga harimu luar biasa!", "Have a great day at work!", "Selamat bekerja, semoga hari anda hebat!", "祝你工作顺利，度过美好的一天！");
  const closeLabel = absLang("Mulai Hari dengan Semangat ✨", "Start the Day with Energy ✨", "Mulakan Hari dengan Semangat ✨", "充满干劲地开启新一天 ✨");

  const popup = document.createElement("div");
  popup.id = "absenku-celebration";
  popup.innerHTML = `
    <div class="celebration-card" role="dialog" aria-modal="true" aria-labelledby="celebration-title">
      <div class="celebration-icon">🎉</div>
      <h2 id="celebration-title"></h2>
      <p class="celebration-time"></p>
      <p class="celebration-message"></p>
      <p class="celebration-footer"></p>
      <button type="button" id="celebration-close"></button>
    </div>
    <div class="celebration-confetti" aria-hidden="true"></div>
  `;

  popup.querySelector("#celebration-title").textContent = title;
  popup.querySelector(".celebration-time").textContent = `${timeLabel} ${jamMasuk} WITA`;
  popup.querySelector(".celebration-message").textContent = quote;
  popup.querySelector(".celebration-footer").textContent = footer;
  popup.querySelector("#celebration-close").textContent = closeLabel;
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
  popup.querySelector("#celebration-close").addEventListener("click", closePopup);
  popup.addEventListener("click", (event) => {
    if (event.target === popup) closePopup();
  });

  setTimeout(() => {
    if (popup.isConnected) closePopup();
  }, 12000);
}

// ===============================
// CHECK-IN
// ===============================
$("checkInBtn").addEventListener("click", () => {
  if (!isLoggedIn) {
    alert(absLang("Silakan login terlebih dahulu.", "Please log in first.", "Sila log masuk dahulu.", "请先登录。"));
    return;
  }

  const data = getData();
  const k = dateKey();
  data.days[k] = data.days[k] || { checkIn: null, checkOut: null };

  if (data.days[k].checkIn) return;

  data.days[k].checkIn = timeNow();
  saveData(data);

  $("actionMessage").textContent =
    absLang("Check-in berhasil dicatat pukul ", "Check-in recorded at ", "Daftar masuk berjaya direkod pada ", "签到成功，时间：") +
    data.days[k].checkIn + ".";

  say($("actionMessage").textContent);
  showCheckInCelebration(data.days[k].checkIn);
  refresh();
});

// ===============================
// CHECK-OUT
// ===============================
$("checkOutBtn").addEventListener("click", () => {
  if (!isLoggedIn) {
    alert(absLang("Silakan login terlebih dahulu.", "Please log in first.", "Sila log masuk dahulu.", "请先登录。"));
    return;
  }

  const data = getData();
  const k = dateKey();
  const r = data.days[k];

  if (!r || !r.checkIn || r.checkOut) return;

  const currentTime = timeNow();
  const currentMinutes =
    Number(currentTime.slice(0, 2)) * 60 +
    Number(currentTime.slice(3, 5));

  if (currentMinutes < 17 * 60) {
    $("actionMessage").textContent = absLang(
      "Check-out ditolak. Jam pulang adalah 17.00 WITA.",
      "Check-out denied. Check-out time is 17:00 WITA.",
      "Daftar keluar ditolak. Waktu pulang ialah 17.00 WITA.",
      "签退失败。签退时间为 WITA 17:00。"
    );

    alert(absLang(
      "Check-out belum diizinkan. Tunggu hingga pukul 17.00 WITA.",
      "Check-out is not allowed yet. Please wait until 17:00 WITA.",
      "Daftar keluar belum dibenarkan. Sila tunggu sehingga 17.00 WITA.",
      "目前还不能签退，请等到 WITA 17:00。"
    ));
    return;
  }

  r.checkOut = currentTime;
  saveData(data);

  $("actionMessage").textContent =
    absLang("Check-out berhasil dicatat pukul ", "Check-out recorded at ", "Daftar keluar berjaya direkod pada ", "签退成功，时间：") +
    r.checkOut + ".";

  say($("actionMessage").textContent);
  refresh();
});

// ===============================
// CHAT DAN TOMBOL BANTUAN
// ===============================
$("chatForm").addEventListener("submit", (e) => {
  e.preventDefault();

  if (!isLoggedIn) {
    alert(absLang("Silakan login terlebih dahulu.", "Please log in first.", "Sila log masuk dahulu.", "请先登录。"));
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
      alert(absLang("Silakan login terlebih dahulu.", "Please log in first.", "Sila log masuk dahulu.", "请先登录。"));
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
    alert(absLang("Silakan login terlebih dahulu.", "Please log in first.", "Sila log masuk dahulu.", "请先登录。"));
    return;
  }

  if (confirm(absLang(
    "Hapus seluruh data demo dari browser ini?",
    "Delete all demo data from this browser?",
    "Padam semua data demo daripada pelayar ini?",
    "确定删除此浏览器中的所有演示数据吗？"
  ))) {
    localStorage.removeItem(STORAGE_KEY);
    $("actionMessage").textContent = absLang(
      "Data demo telah direset.",
      "Demo data has been reset.",
      "Data demo telah ditetapkan semula.",
      "演示数据已重置。"
    );
    refresh();
    say($("actionMessage").textContent);
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

// Sembunyikan dasbor sebelum autentikasi.
if (dashboard) dashboard.style.display = "none";

/* ===============================
   ABSENKU — MUAT PROFIL KARYAWAN
================================ */
async function loadEmployeeProfile() {
  const supabase = window.ABSENKU_SUPABASE;
  const message = document.getElementById("profileChangeMessage");
  if (message) message.textContent = "Fungsi pemuatan profil berjalan...";

  if (!supabase) {
    if (message) message.textContent = "Koneksi Supabase belum tersedia.";
    return;
  }

  try {
    const { data: authData, error: authError } =
      await supabase.auth.getUser();

    if (authError) throw authError;

    const user = authData.user;
    if (!user) {
      if (message) message.textContent = "Silakan login terlebih dahulu.";
      return;
    }

    const { data: employee, error } = await supabase
      .from("employees")
      .select("full_name, employee_code, department, position, branch_name, address, birth_date, phone, email")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) throw error;

    if (!employee) {
      if (message) message.textContent =
        "Data karyawan untuk akun ini belum ditemukan.";
      return;
    }

     
const fields = {
  profileFullName: employee.full_name,
  profileEmployeeId: employee.employee_code,
  profileAddress: employee.address,
  profileBirthDate: employee.birth_date,
  profilePhone: employee.phone,
  profileEmail: employee.email,
  profileDepartment: employee.department,
  profilePosition: employee.position
};

    Object.entries(fields).forEach(([id, value]) => {
      const element = document.getElementById(id);
      if (element) element.value = value || "";
    });

    if (message) message.textContent = "Data profil berhasil dimuat.";
  } catch (error) {
    console.error("Gagal memuat profil:", error);
    if (message) message.textContent =
      "Profil gagal dimuat. Periksa izin akses database.";
  }
}

 
document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll('[data-page="profile"]').forEach(link => {
    link.addEventListener("click", function () {
      loadEmployeeProfile();
    });
  });
});
