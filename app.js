const $ = (id) => document.getElementById(id);
document.getElementById("app-dashboard").style.display = "";
const STORAGE_KEY = "absensibot-demo-v1";
const dateKey = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; };
const timeNow = () => new Date().toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit",hour12:false});
const prettyDate = (date = new Date()) => date.toLocaleDateString("id-ID",{weekday:"long",day:"numeric",month:"long",year:"numeric"});
function getData(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY))||{days:{}}}catch{return {days:{}}}}
function saveData(data){localStorage.setItem(STORAGE_KEY,JSON.stringify(data))}
function todayRecord(){const data=getData();return data.days[dateKey()]||{checkIn:null,checkOut:null}}
function refresh(){
 const rec=todayRecord();
 $("statusValue").textContent=rec.checkOut?"Selesai":rec.checkIn?"Sudah check-in":"Belum absen";
 $("statusSub").textContent=rec.checkOut?"Absensi hari ini lengkap":rec.checkIn?"Jangan lupa check-out":"Silakan check-in";
 $("checkInValue").textContent=rec.checkIn||"—"; $("checkOutValue").textContent=rec.checkOut||"—";
 $("checkInBtn").disabled=!!rec.checkIn; $("checkOutBtn").disabled=!rec.checkIn||!!rec.checkOut;
 $("historyBody").innerHTML="";
 const days=getData().days; const keys=Object.keys(days).sort((a,b)=>b.localeCompare(a));
 if(!keys.length){$("historyBody").innerHTML='<tr><td colspan="4" class="empty">Belum ada data absensi.</td></tr>';return}
 keys.forEach(k=>{const r=days[k],tr=document.createElement("tr");const status=r.checkOut?"Lengkap":r.checkIn?"Belum pulang":"Belum absen";tr.innerHTML=`<td>${k}</td><td>${r.checkIn||"—"}</td><td>${r.checkOut||"—"}</td><td><span class="status-pill">${status}</span></td>`;$("historyBody").appendChild(tr)});
}
function say(text,who="bot"){
 const row=document.createElement("div");row.className=`message ${who==="user"?"user-message":""}`;
 if(who==="bot"){const av=document.createElement("div");av.className="mini-avatar";av.textContent="✓";row.appendChild(av)}
 const bubble=document.createElement("div");bubble.className="bubble";
 const b=document.createElement("b");b.textContent=who==="bot"?"AbsensiBot":"Anda";const p=document.createElement("p");p.textContent=text;bubble.append(b,p);row.appendChild(bubble);$("chatWindow").appendChild(row);$("chatWindow").scrollTop=$("chatWindow").scrollHeight;
}
function reply(input){
 const q=input.toLowerCase();
 if(q.includes("check-in")||q.includes("check in")||q.includes("absen masuk")){const r=todayRecord();if(r.checkIn)return "Kamu sudah check-in hari ini pukul "+r.checkIn+".";return "Untuk mencatat kehadiran, tekan tombol Check-in pada bagian Absensi Hari Ini."}
 if(q.includes("check-out")||q.includes("check out")||q.includes("absen pulang")){const r=todayRecord();if(r.checkOut)return "Kamu sudah check-out pukul "+r.checkOut+".";if(!r.checkIn)return "Kamu belum check-in. Lakukan check-in terlebih dahulu.";return "Untuk mengakhiri absensi, tekan tombol Check-out."}
 if(q.includes("status")){const r=todayRecord();return `Status hari ini: ${r.checkOut?"Absensi lengkap. Check-in "+r.checkIn+", check-out "+r.checkOut:r.checkIn?"Sudah check-in pukul "+r.checkIn+", belum check-out.":"Belum melakukan absensi hari ini."}`}
 if(q.includes("riwayat")||q.includes("rekap")){const d=getData().days,keys=Object.keys(d).sort((a,b)=>b.localeCompare(a));if(!keys.length)return "Belum ada riwayat absensi. Silakan lakukan check-in terlebih dahulu.";return "Riwayat terbaru: "+keys.slice(0,5).map(k=>`${k} (masuk ${d[k].checkIn||"—"}, pulang ${d[k].checkOut||"—"})`).join("; ")}
 if(q.includes("jam kerja")||q.includes("jadwal"))return "Contoh jadwal kerja pada demo ini adalah pukul 08.00–17.00. Silakan sesuaikan dengan kebijakan perusahaan. Jadwal ini belum terhubung ke sistem HR.";
 if(q.includes("bantuan")||q.includes("help")||q.includes("halo")||q.includes("hai"))return "Saya bisa membantu mengecek status absensi, melihat riwayat, menjelaskan check-in/check-out, dan memberi contoh informasi jam kerja. Coba ketik: status, riwayat, jam kerja, atau check-in.";
 return "Maaf, saya belum memahami pertanyaan itu. Coba ketik “bantuan”, “status”, “riwayat”, atau “jam kerja”.";
}
$("checkInBtn").addEventListener("click",()=>{const data=getData();const k=dateKey();data.days[k]=data.days[k]||{checkIn:null,checkOut:null};if(data.days[k].checkIn)return;data.days[k].checkIn=timeNow();saveData(data);$("actionMessage").textContent="Check-in berhasil dicatat pukul "+data.days[k].checkIn+".";say("Check-in berhasil dicatat pukul "+data.days[k].checkIn+". Semoga harimu produktif!");refresh()});
$("checkOutBtn").addEventListener("click",()=>{const data=getData(),k=dateKey(),r=data.days[k];if(!r||!r.checkIn)return;if(r.checkOut)return;r.checkOut=timeNow();saveData(data);$("actionMessage").textContent="Check-out berhasil dicatat pukul "+r.checkOut+".";say("Check-out berhasil dicatat pukul "+r.checkOut+". Terima kasih, sampai jumpa!");refresh()});
$("chatForm").addEventListener("submit",e=>{e.preventDefault();const input=$("chatInput"),value=input.value.trim();if(!value)return;say(value,"user");say(reply(value));input.value=""});
document.querySelectorAll("[data-message]").forEach(btn=>btn.addEventListener("click",()=>{const value=btn.dataset.message;say(value,"user");say(reply(value))}));
$("clearBtn").addEventListener("click",()=>{if(confirm("Hapus seluruh data demo dari browser ini?")){localStorage.removeItem(STORAGE_KEY);$("actionMessage").textContent="Data demo telah direset.";refresh();say("Data demo sudah direset. Kamu bisa mulai absensi lagi.")}});
function tick(){const now=new Date();$("clock").textContent=now.toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:false});$("clockDate").textContent=prettyDate(now);$("todayLabel").textContent=now.toLocaleDateString("id-ID",{day:"numeric",month:"short",year:"numeric"})}
tick();setInterval(tick,1000);refresh();
