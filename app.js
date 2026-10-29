    
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
      .select("full_name, employee_code, department, position, branch_name, address, birth_date, phone, email, photo_path, gender, birth_place, start_date, employment_status")
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
  profilePosition: employee.position,
  profileGender: employee.gender,
  profileBirthPlace: employee.birth_place,
  profileStartDate: employee.start_date,
  profileEmploymentStatus: employee.employment_status,
};

    Object.entries(fields).forEach(([id, value]) => {
      const element = document.getElementById(id);
      if (element) element.value = value || "";
    });
    // Muat foto profil yang tersimpan di Supabase Storage
if (employee.photo_path) {
  const { data: photoData, error: photoError } =
    await supabase.storage
      .from("profile-photos")
      .createSignedUrl(employee.photo_path, 3600);

  if (!photoError && photoData?.signedUrl) {
    const photoPreview = document.getElementById("profilePhotoPreview");
    if (photoPreview) {
      photoPreview.src = photoData.signedUrl;
    }
  }
}
    if (message) message.textContent = "Data profil berhasil dimuat.";
  } catch (error) {
    console.error("Gagal memuat profil:", error);
    if (message) message.textContent =
      "Profil gagal dimuat. Periksa izin akses database.";
  }
}

 
 

async function submitLeaveRequest(event) {
  event.preventDefault();

  const supabase = window.ABSENKU_SUPABASE;
  const message = document.getElementById("leaveRequestMessage");
  const button = event.submitter;

  const say = (text) => {
    if (message) message.textContent = text;
  };

  if (!supabase) {
    say("Koneksi Supabase belum tersedia.");
    return;
  }
 
async function submitNewEmployee(event) {
  event.preventDefault();

  const supabase = window.ABSENKU_SUPABASE;
  const message = document.getElementById("addEmployeeMessage");
  const form = document.getElementById("addEmployeeForm");

  const say = (text) => {
    if (message) message.textContent = text;
  };

  if (!supabase) {
    say("Koneksi Supabase belum tersedia.");
    return;
  }

  const employeeCode =
    document.getElementById("newEmployeeCode").value.trim();
  const fullName =
    document.getElementById("newEmployeeName").value.trim();

  if (!employeeCode || !fullName) {
    say("Nomor dan nama karyawan wajib diisi.");
    return;
  }

  try {
    say("Menyimpan data karyawan...");

    const { data: authData, error: authError } =
      await supabase.auth.getUser();

    if (authError) throw authError;
    if (!authData.user) {
      throw new Error("Silakan login terlebih dahulu.");
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("company_id, role, is_active")
      .eq("id", authData.user.id)
      .maybeSingle();

    if (profileError) throw profileError;

    if (
      !profile ||
      profile.role !== "admin" ||
      profile.is_active !== true ||
      !profile.company_id
    ) {
      throw new Error(
        "Hanya Admin aktif yang dapat menambahkan karyawan."
      );
    }

    const { error: insertError } = await supabase
      .from("employees")
      .insert({
        company_id: profile.company_id,
        employee_code: employeeCode,
        full_name: fullName,
        email:
          document.getElementById("newEmployeeEmail").value.trim() || null,
        phone:
          document.getElementById("newEmployeePhone").value.trim() || null,
        department:
          document.getElementById("newEmployeeDepartment").value.trim() || null,
        position:
          document.getElementById("newEmployeePosition").value.trim() || null,
        branch_name:
          document.getElementById("newEmployeeBranch").value.trim() || null,
        address:
          document.getElementById("newEmployeeAddress").value.trim() || null,
        is_active: true
      });

    if (insertError) throw insertError;

    form.reset();
    say("Data karyawan berhasil disimpan.");
  } catch (error) {
    console.error("Gagal menyimpan karyawan:", error);
    say("Gagal menyimpan: " +
      (error.message || "Periksa izin database."));
  }
}

document.getElementById("addEmployeeForm")?.addEventListener(
  "submit",
  submitNewEmployee
);

  const start = document.getElementById("leaveStart")?.value;
  const end = document.getElementById("leaveEnd")?.value;
  const type = document.getElementById("leaveType")?.value;
  const reason = document.getElementById("leaveReason")?.value.trim();
  const file = document.getElementById("leaveEvidence")?.files?.[0];

  if (!start || !end || end < start || !type || !reason || !file) {
    say("Lengkapi formulir dan periksa tanggal serta bukti.");
    return;
  }

  if (!["application/pdf", "image/jpeg", "image/png"].includes(file.type)) {
    say("Bukti harus berupa PDF, JPG, atau PNG.");
    return;
  }

  if (file.size > 10 * 1024 * 1024) {
    say("Ukuran bukti maksimal 10 MB.");
    return;
  }

  try {
    if (button) button.disabled = true;
    say("Mengirim pengajuan...");

    const { data: authData, error: authError } =
      await supabase.auth.getUser();
    if (authError) throw authError;

    const user = authData.user;
    if (!user) throw new Error("Silakan login terlebih dahulu.");

    const { data: employee, error: employeeError } = await supabase
      .from("employees")
      .select("id, company_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (employeeError) throw employeeError;
    if (!employee) throw new Error("Data karyawan tidak ditemukan.");

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("company_id,is_active")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) throw profileError;
    if (!profile || profile.is_active !== true ||
        profile.company_id !== employee.company_id) {
      throw new Error("Profil aktif atau data perusahaan tidak cocok.");
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${employee.company_id}/${employee.id}/${crypto.randomUUID()}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from("leave-evidence")
      .upload(path, file, { upsert: false, contentType: file.type });

    if (uploadError) throw uploadError;

    const { error: insertError } = await supabase
      .from("leave_requests")
      .insert({
        employee_id: employee.id,
        company_id: employee.company_id,
         request_type: ({
  cuti: "leave",
  sakit: "sick",
  izin: "permission"
})[type] || type,
        start_date: start,
        end_date: end,
        reason: reason,
        evidence_path: path,
        status: "pending"
      });

    if (insertError) {
      await supabase.storage.from("leave-evidence").remove([path]);
      throw insertError;
    }

    document.getElementById("leaveRequestForm")?.reset();
    say("Pengajuan berhasil dikirim dan menunggu persetujuan Admin/HRD.");
  } catch (error) {
    console.error("Pengajuan cuti/izin gagal:", error);
    say("Gagal mengirim pengajuan: " + (error.message || "Periksa koneksi dan izin Supabase."));
  } finally {
    if (button) button.disabled = false;
  }
}

document.getElementById("leaveRequestForm")?.addEventListener(
  "submit",
  submitLeaveRequest
);
(function () {
  function connectProfileMenu() {
    document.querySelectorAll('[data-page="profile"]').forEach(link => {
      if (link.dataset.profileConnected === "true") return;

      link.dataset.profileConnected = "true";

      link.addEventListener("click", function () {
        loadEmployeeProfile();
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", connectProfileMenu);
  } else {
    connectProfileMenu();
  }
})();
(function () {
  async function connectProfileChangeForm() {
    const form = document.getElementById("profileChangeForm");
    const message = document.getElementById("profileChangeMessage");

    if (!form || form.dataset.submitConnected === "true") return;
    form.dataset.submitConnected = "true";

    form.addEventListener("submit", async function (event) {
      event.preventDefault();

      const supabase = window.ABSENKU_SUPABASE;
      if (!supabase) {
        if (message) message.textContent = "Koneksi Supabase belum tersedia.";
        return;
      }

      if (message) message.textContent = "Mengirim pengajuan...";

      try {
        const { data: authData, error: authError } =
          await supabase.auth.getUser();

        if (authError) throw authError;

        const user = authData.user;
        if (!user) throw new Error("Silakan login terlebih dahulu.");

        const { data: employee, error: employeeError } = await supabase
          .from("employees")
          .select("id, company_id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (employeeError) throw employeeError;
        if (!employee) throw new Error("Data karyawan tidak ditemukan.");

        const value = id => {
          const el = document.getElementById(id);
          return el ? el.value.trim() : "";
        };

        const requestedData = {
          full_name: value("profileFullName"),
          gender: value("profileGender"),
          birth_place: value("profileBirthPlace"),
          birth_date: value("profileBirthDate"),
          address: value("profileAddress"),
          phone: value("profilePhone"),
          email: value("profileEmail"),
          department: value("profileDepartment"),
          position: value("profilePosition"),
          start_date: value("profileStartDate"),
          employment_status: value("profileEmploymentStatus"),
          supervisor: value("profileSupervisor")
        };

        const { error: insertError } = await supabase
          .from("profile_change_requests")
          .insert({
            company_id: employee.company_id,
            employee_id: employee.id,
            requested_by: user.id,
            requested_data: requestedData
          });

        if (insertError) throw insertError;

        if (message) {
          message.textContent =
            "Pengajuan berhasil dikirim. Menunggu persetujuan Admin/HRD.";
        }
      } catch (error) {
        console.error("Gagal mengirim pengajuan profil:", error);
        if (message) {
          message.textContent =
            "Pengajuan gagal dikirim. Pastikan izin akses Supabase sudah diatur.";
        }
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", connectProfileChangeForm);
  } else {
    connectProfileChangeForm();
  }
})();


/* ABSENKU — PENGHUBUNG PERSETUJUAN PROFIL */
(function () {
  const menu = document.querySelector(
    '[data-page="profile-approvals"]'
  );
  const message = () =>
    document.getElementById("profileApprovalsMessage");
  const list = () =>
    document.getElementById("profileApprovalsList");

  async function loadProfileApprovals() {
    const supabase = window.ABSENKU_SUPABASE;
    const msg = message();
    const container = list();

    if (!supabase || !msg || !container) return;

    msg.textContent = "Memeriksa akses Admin/HRD...";
    container.replaceChildren();

    try {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (authError) throw authError;
      if (!authData.user) {
        msg.textContent = "Silakan login terlebih dahulu.";
        return;
      }

      const { data: admin, error: adminError } = await supabase
        .from("profiles")
        .select("role, is_active, company_id")
        .eq("id", authData.user.id)
        .maybeSingle();

      if (adminError) throw adminError;

      if (
        !admin ||
        !admin.is_active ||
        !["admin", "hrd"].includes(admin.role)
      ) {
        msg.textContent =
          "Akses ditolak. Halaman ini khusus Admin/HRD aktif.";
        return;
      }

      msg.textContent = "Memuat pengajuan...";
      const { data: requests, error } = await supabase
        .from("profile_change_requests")
        .select("id, employee_id, requested_data, status, created_at")
        .eq("company_id", admin.company_id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (!requests || requests.length === 0) {
        msg.textContent = "Tidak ada pengajuan yang menunggu persetujuan.";
        return;
      }

      msg.textContent = "Pengajuan menunggu: " + requests.length;

      requests.forEach((request) => {
        const card = document.createElement("div");
        card.className = "about-box";

        const title = document.createElement("h3");
        title.textContent = "Pengajuan perubahan profil";

        const detail = document.createElement("p");
        detail.textContent =
          "ID karyawan: " + request.employee_id;

        const date = document.createElement("p");
        date.textContent =
          "Dikirim: " +
          new Date(request.created_at).toLocaleString("id-ID");

        const data = document.createElement("pre");
        data.style.whiteSpace = "pre-wrap";
        data.style.overflowWrap = "anywhere";
        data.textContent = JSON.stringify(
          request.requested_data || {},
          null,
          2
        );

        const note = document.createElement("input");
        note.type = "text";
        note.placeholder = "Catatan Admin (opsional)";
        note.maxLength = 500;

        const approve = document.createElement("button");
        approve.type = "button";
        approve.textContent = "Setujui";
 
(function () {
  const menu = document.querySelector('[data-page="profile-approvals"]');
  const message = () => document.getElementById("profileApprovalsMessage");
  const list = () => document.getElementById("profileApprovalsList");

  async function loadProfileApprovals() {
    const supabase = window.ABSENKU_SUPABASE;
    const msg = message();
    const container = list();

    if (!supabase || !msg || !container) return;

    msg.textContent = "Memeriksa akses...";
    container.replaceChildren();

    try {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (authError) throw authError;
      if (!authData.user) throw new Error("Silakan login terlebih dahulu.");

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role, is_active, company_id")
        .eq("id", authData.user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      if (
        !profile ||
        !profile.is_active ||
        !["admin", "hrd"].includes(profile.role)
      ) {
        msg.textContent = "Akses ditolak. Halaman ini khusus Admin/HRD aktif.";
        return;
      }

      msg.textContent = "Memuat pengajuan...";

      const [leaveResult, profileResult] = await Promise.all([
        supabase
          .from("leave_requests")
          .select("id, employee_id, request_type, start_date, end_date, reason, status, created_at")
          .eq("company_id", profile.company_id)
          .eq("status", "pending")
          .order("created_at", { ascending: false }),

        supabase
          .from("profile_change_requests")
          .select("id, employee_id, requested_by, requested_data, status, created_at")
          .eq("company_id", profile.company_id)
          .eq("status", "pending")
          .order("created_at", { ascending: false })
      ]);

      if (leaveResult.error) throw leaveResult.error;
      if (profileResult.error) throw profileResult.error;

      const leaveRequests = leaveResult.data || [];
      const profileRequests = profileResult.data || [];

      if (!leaveRequests.length && !profileRequests.length) {
        msg.textContent = "Tidak ada pengajuan yang menunggu persetujuan.";
        return;
      }

      msg.textContent =
        "Izin/cuti: " + leaveRequests.length +
        " · Perubahan profil: " + profileRequests.length;

      function addText(card, tag, text) {
        const el = document.createElement(tag);
        el.textContent = text;
        card.appendChild(el);
        return el;
      }

      function addReviewButtons(card, request, type) {
        if (profile.role !== "admin") {
          addText(card, "p", "HRD dapat memantau, tetapi tidak dapat memutuskan.");
          return;
        }

        const note = document.createElement("input");
        note.type = "text";
        note.maxLength = 500;
        note.placeholder = "Catatan Admin (opsional)";
        card.appendChild(note);

        for (const decision of ["approved", "rejected"]) {
          const button = document.createElement("button");
          button.type = "button";
          button.textContent = decision === "approved" ? "Setujui" : "Tolak";

          button.addEventListener("click", async () => {
            const label = decision === "approved" ? "menyetujui" : "menolak";
            if (!confirm("Yakin ingin " + label + " pengajuan ini?")) return;

            button.disabled = true;
            try {
              if (type === "profile") {
                const { error } = await supabase.rpc(
                  "review_profile_change_request",
                  {
                    p_request_id: request.id,
                    p_decision: decision,
                    p_admin_note: note.value.trim() || null
                  }
                );
                if (error) throw error;
              } else {
                const { data: userData, error: userError } =
                  await supabase.auth.getUser();
                if (userError) throw userError;

                const { error } = await supabase
                  .from("leave_requests")
                  .update({
                    status: decision,
                    reviewed_by: userData.user.id,
                    reviewed_at: new Date().toISOString(),
                    review_notes: note.value.trim() || null
                  })
                  .eq("id", request.id)
                  .eq("company_id", profile.company_id)
                  .eq("status", "pending");

                if (error) throw error;
              }

              msg.textContent = "Keputusan berhasil disimpan.";
              await loadProfileApprovals();
            } catch (err) {
              console.error("Gagal memproses pengajuan:", err);
              msg.textContent =
                "Gagal menyimpan keputusan: " +
                (err.message || "Periksa izin database.");
              button.disabled = false;
            }
          });

          card.appendChild(button);
        }
      }

      leaveRequests.forEach((request) => {
        const card = document.createElement("div");
        card.className = "about-box";

        addText(card, "h3", "Pengajuan " + (request.request_type || "izin/cuti"));
        addText(card, "p", "ID karyawan: " + request.employee_id);
        addText(card, "p", "Tanggal: " + request.start_date + " sampai " + request.end_date);
        addText(card, "p", "Alasan: " + (request.reason || "-"));
        addText(card, "p", "Dikirim: " + new Date(request.created_at).toLocaleString("id-ID"));

        addReviewButtons(card, request, "leave");
        container.appendChild(card);
      });

      profileRequests.forEach((request) => {
        const card = document.createElement("div");
        card.className = "about-box";

        addText(card, "h3", "Pengajuan perubahan profil");
        addText(card, "p", "ID karyawan: " + request.employee_id);
        addText(card, "p", "Dikirim: " + new Date(request.created_at).toLocaleString("id-ID"));

        const details = document.createElement("pre");
        details.style.whiteSpace = "pre-wrap";
        details.style.overflowWrap = "anywhere";
        details.textContent = JSON.stringify(request.requested_data || {}, null, 2);
        card.appendChild(details);

        addReviewButtons(card, request, "profile");
        container.appendChild(card);
      });
    } catch (err) {
      console.error("Gagal memuat persetujuan:", err);
      msg.textContent =
        "Pengajuan gagal dimuat: " + (err.message || "Periksa koneksi dan izin database.");
    }
  }

  if (menu) {
    menu.addEventListener("click", () => {
      setTimeout(loadProfileApprovals, 100);
    });
  }
})();
/* ABSENKU - Penghubung akun login karyawan */
document
  .getElementById("createEmployeeAccountForm")
  ?.addEventListener("submit", async function (event) {
    event.preventDefault();

    const supabase = window.ABSENKU_SUPABASE;
    const message = document.getElementById(
      "createEmployeeAccountMessage"
    );
    const say = (text) => {
      if (message) message.textContent = text;
    };

    if (!supabase) {
      say("Koneksi Supabase belum tersedia.");
      return;
    }

    const employeeId = document
      .getElementById("accountEmployeeId").value.trim();
    const email = document
      .getElementById("accountEmployeeEmail").value.trim();
    const password = document
      .getElementById("accountEmployeePassword").value;

    try {
      say("Memeriksa sesi admin...");

      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError) throw sessionError;

      if (!sessionData.session) {
        throw new Error("Silakan login sebagai Admin terlebih dahulu.");
      }

      say("Memproses pembuatan akun...");

      const { data, error } = await supabase.functions.invoke(
        "smooth-service",
        {
          body: {
            employee_id: employeeId,
            email: email,
            password: password
          }
        }
      );

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      say(data?.message || "Permintaan pembuatan akun selesai.");
      document.getElementById("accountEmployeePassword").value = "";
    } catch (error) {
      console.error("Gagal membuat akun karyawan:", error);
      say("Gagal: " + (error.message || "Periksa konfigurasi Supabase."));
    }
  });
/* ABSENKU - Unggah foto profil ke Supabase Storage */
(function setupProfilePhotoUpload() {
  const input = document.getElementById("profilePhotoInput");
  const preview = document.getElementById("profilePhotoPreview");

  if (!input || !preview || input.dataset.uploadReady === "1") return;
  input.dataset.uploadReady = "1";

  input.addEventListener("change", async function () {
    const file = input.files && input.files[0];
    if (!file) return;

    const supabase = window.ABSENKU_SUPABASE;
    if (!supabase) {
      alert("Koneksi Supabase belum tersedia.");
      return;
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      alert("Pilih foto JPG, PNG, atau WEBP.");
      input.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert("Ukuran foto maksimal 2 MB.");
      input.value = "";
      return;
    }

    try {
      input.disabled = true;

      const { data: authData, error: authError } =
        await supabase.auth.getUser();
      if (authError) throw authError;

      const user = authData.user;
      if (!user) throw new Error("Silakan login kembali.");

      const { data: employee, error: employeeError } = await supabase
        .from("employees")
        .select("id, company_id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle();

      if (employeeError) throw employeeError;
      if (!employee) throw new Error("Data karyawan aktif tidak ditemukan.");

      const extension = file.type === "image/png" ? "png" :
        file.type === "image/webp" ? "webp" : "jpg";

      const path = `${employee.company_id}/${employee.id}/${Date.now()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("profile-photos")
        .upload(path, file, {
          contentType: file.type,
          upsert: false
        });

      if (uploadError) throw uploadError;

       
const { data: updatedRows, error: updateError } = await supabase
  .from("employees")
  .update({ photo_path: path })
  .eq("id", employee.id)
  .eq("user_id", user.id)
  .select("id, photo_path");

if (updateError) throw updateError;

if (!updatedRows || updatedRows.length === 0 || !updatedRows[0].photo_path) {
  throw new Error(
    "Foto terunggah, tetapi photo_path tidak berhasil disimpan ke database."
  );
}


      const { data: signedData, error: signedError } =
        await supabase.storage
          .from("profile-photos")
          .createSignedUrl(path, 3600);

      if (signedError) throw signedError;

      preview.src = signedData.signedUrl;
      alert("Foto profil berhasil disimpan.");
    } catch (error) {
      console.error("Gagal menyimpan foto profil:", error);
      alert("Foto gagal disimpan: " + (error.message || "Periksa izin akses."));
    } finally {
      input.disabled = false;
    }
  });
})();
