
(function () {
  "use strict";

  const sb = window.ABSENKU_SUPABASE;
  let currentUser = null;
  let currentProfile = null;
  let currentConversation = null;
  let realtimeChannel = null;

  function byId(id) {
    return document.getElementById(id);
  }

  function addChatInterface() {
    const chatPanel = byId("chat");
    if (!chatPanel || byId("absenku-live-chat")) return;

    const section = document.createElement("section");
    section.id = "absenku-live-chat";
    section.className = "panel";
    section.style.marginTop = "18px";

    section.innerHTML = `
      <div class="panel-heading">
        <div>
          <h2>💬 Live Chat ABSENKU</h2>
          <p class="muted">Komunikasi dengan Admin/HR atau rekan kerja.</p>
        </div>
      </div>

      <p id="live-chat-status" role="status">
        Silakan muat daftar pengguna untuk memulai.
      </p>

      <label for="live-chat-type">Jenis percakapan</label>
      <select id="live-chat-type">
        <option value="hr">Admin / HR</option>
        <option value="employee">Rekan kerja</option>
      </select>

      <label for="live-chat-recipient">Pilih penerima</label>
      <select id="live-chat-recipient">
        <option value="">Memuat pengguna...</option>
      </select>

      <button type="button" id="live-chat-start">
        Mulai percakapan
      </button>

      <hr>

      <label for="live-chat-existing">Percakapan saya</label>
      <select id="live-chat-existing">
        <option value="">Pilih percakapan</option>
      </select>

      <button type="button" id="live-chat-open">
        Buka percakapan
      </button>

      <div id="live-chat-messages"
        style="height:240px; overflow-y:auto; border:1px solid #ddd;
        border-radius:10px; padding:12px; margin:12px 0;">
        Pesan akan tampil di sini.
      </div>

      <form id="live-chat-form">
        <label for="live-chat-input">Pesan</label>
        <textarea id="live-chat-input" rows="3" maxlength="5000"
          placeholder="Tulis pesan..." required></textarea>
        <button type="submit">Kirim pesan</button>
      </form>
    `;

    chatPanel.appendChild(section);

    byId("live-chat-type").addEventListener("change", loadRecipients);
    byId("live-chat-start").addEventListener("click", startConversation);
    byId("live-chat-open").addEventListener("click", openSelectedConversation);
    byId("live-chat-form").addEventListener("submit", sendMessage);
  }

  function status(message) {
    const el = byId("live-chat-status");
    if (el) el.textContent = message;
  }

  async function initialize() {
    addChatInterface();

    if (!sb) {
      status("Koneksi Supabase belum tersedia.");
      return;
    }

    const { data, error } = await sb.auth.getUser();

    if (error || !data.user) {
      status("Silakan login terlebih dahulu untuk menggunakan Live Chat.");
      return;
    }

    currentUser = data.user;

    const result = await sb
      .from("profiles")
      .select("id, full_name, role, is_active, company_id")
      .eq("id", currentUser.id)
      .single();

    if (result.error || !result.data) {
      status("Profil pengguna tidak dapat dibaca. Periksa izin tabel profiles.");
      return;
    }

    currentProfile = result.data;

    if (!currentProfile.company_id || currentProfile.is_active === false) {
      status("Profil belum aktif atau belum memiliki perusahaan.");
      return;
    }

    await loadRecipients();
    await loadConversations();
    status("Live Chat siap digunakan.");
  }

  async function loadRecipients() {
    if (!currentProfile) return;

    const type = byId("live-chat-type").value;
    const select = byId("live-chat-recipient");
    select.replaceChildren();

    const { data, error } = await sb
      .from("profiles")
      .select("id, full_name, role")
      .eq("company_id", currentProfile.company_id)
      .eq("is_active", true)
      .neq("id", currentUser.id);

    if (error) {
      status("Daftar pengguna gagal dimuat. Periksa izin baca tabel profiles.");
      return;
    }

    const people = (data || []).filter(function (person) {
      const role = String(person.role || "").toLowerCase();

      if (type === "hr") {
        return ["admin", "hr", "administrator", "super_admin"].includes(role);
      }

      return !["admin", "hr", "administrator", "super_admin"].includes(role);
    });

    if (!people.length) {
      const option = document.createElement("option");
      option.value = "";
      option.textContent = "Tidak ada penerima yang tersedia";
      select.appendChild(option);
      return;
    }

    people.forEach(function (person) {
      const option = document.createElement("option");
      option.value = person.id;
      option.textContent =
        (person.full_name || "Pengguna") + " (" + person.role + ")";
      select.appendChild(option);
    });
  }

  async function loadConversations() {
    const select = byId("live-chat-existing");
    select.replaceChildren();

    const { data: memberships, error: memberError } = await sb
      .from("chat_members")
      .select("conversation_id")
      .eq("user_id", currentUser.id);

    if (memberError) {
      status("Percakapan gagal dimuat. Periksa kebijakan akses chat_members.");
      return;
    }

    const ids = (memberships || []).map(function (item) {
      return item.conversation_id;
    });

    if (!ids.length) {
      const option = document.createElement("option");
      option.value = "";
      option.textContent = "Belum ada percakapan";
      select.appendChild(option);
      return;
    }

    const { data: conversations, error } = await sb
      .from("chat_conversations")
      .select("id, title, chat_type, created_at")
      .in("id", ids)
      .order("created_at", { ascending: false });

    if (error) {
      status("Daftar percakapan gagal dimuat.");
      return;
    }

    (conversations || []).forEach(function (conversation) {
      const option = document.createElement("option");
      option.value = conversation.id;
      option.textContent =
        (conversation.title || "Percakapan") +
        " — " + conversation.chat_type;
      select.appendChild(option);
    });
  }

  async function startConversation() {
    const recipientId = byId("live-chat-recipient").value;
    const type = byId("live-chat-type").value;

    if (!recipientId) {
      status("Pilih penerima terlebih dahulu.");
      return;
    }

    status("Membuat percakapan...");

    const { data: conversation, error } = await sb
      .from("chat_conversations")
      .insert({
        company_id: currentProfile.company_id,
        created_by: currentUser.id,
        chat_type: type,
        title: type === "hr" ? "Chat Admin/HR" : "Chat Rekan Kerja"
      })
      .select("id")
      .single();

    if (error) {
      status("Gagal membuat percakapan: " + error.message);
      return;
    }

    const { error: memberError } = await sb
      .from("chat_members")
      .insert([
        { conversation_id: conversation.id, user_id: currentUser.id },
        { conversation_id: conversation.id, user_id: recipientId }
      ]);

    if (memberError) {
      status(
        "Percakapan dibuat, tetapi anggota gagal ditambahkan. " +
        "Periksa kebijakan akses chat_members."
      );
      return;
    }

    await loadConversations();
    byId("live-chat-existing").value = conversation.id;
    await openConversation(conversation.id);
  }

  async function openSelectedConversation() {
    const id = byId("live-chat-existing").value;

    if (!id) {
      status("Pilih percakapan terlebih dahulu.");
      return;
    }

    await openConversation(id);
  }

  async function openConversation(id) {
    currentConversation = id;

    if (realtimeChannel) {
      await sb.removeChannel(realtimeChannel);
      realtimeChannel = null;
    }

    await loadMessages();

    realtimeChannel = sb
      .channel("absenku-live-chat-" + id)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: "conversation_id=eq." + id
        },
        function () {
          loadMessages();
        }
      )
      .subscribe();

    status("Percakapan terbuka. Pesan baru akan diperbarui otomatis.");
  }

  async function loadMessages() {
    if (!currentConversation) return;

    const box = byId("live-chat-messages");
    box.replaceChildren();

    const { data, error } = await sb
      .from("chat_messages")
      .select("id, sender_id, message, created_at")
      .eq("conversation_id", currentConversation)
      .order("created_at", { ascending: true });

    if (error) {
      box.textContent = "Pesan gagal dimuat. Periksa izin chat_messages.";
      return;
    }

    (data || []).forEach(function (message) {
      const item = document.createElement("div");
      item.style.padding = "8px";
      item.style.marginBottom = "8px";
      item.style.borderRadius = "8px";
      item.style.background =
        message.sender_id === currentUser.id ? "#dbeafe" : "#f1f5f9";

      const who = document.createElement("strong");
      who.textContent =
        message.sender_id === currentUser.id ? "Saya" : "Rekan chat";

      const body = document.createElement("p");
      body.style.whiteSpace = "pre-wrap";
      body.textContent = message.message;

      const time = document.createElement("small");
      time.textContent = new Date(message.created_at).toLocaleString("id-ID");

      item.append(who, body, time);
      box.appendChild(item);
    });

    box.scrollTop = box.scrollHeight;
  }

  async function sendMessage(event) {
    event.preventDefault();

    const input = byId("live-chat-input");
    const message = input.value.trim();

    if (!currentConversation) {
      status("Buka percakapan terlebih dahulu.");
      return;
    }

    if (!message) return;

    const { error } = await sb.from("chat_messages").insert({
      conversation_id: currentConversation,
      sender_id: currentUser.id,
      message: message
    });

    if (error) {
      status("Pesan gagal dikirim: " + error.message);
      return;
    }

    input.value = "";
    await loadMessages();
  }

  function installLoginHook() {
    const original = window.showDashboardAfterLogin;

    if (typeof original !== "function") return;

    window.showDashboardAfterLogin = function () {
      const result = original.apply(this, arguments);
      initialize().catch(function () {
        status("Live Chat gagal dimulai. Coba muat ulang halaman.");
      });
      return result;
    };
  }

  function start() {
    addChatInterface();
    installLoginHook();

    if (sb) {
      sb.auth.getSession().then(function (result) {
        if (result.data && result.data.session) {
          initialize().catch(function () {
            status("Live Chat gagal dimulai.");
          });
        } else {
          status("Silakan login terlebih dahulu untuk menggunakan Live Chat.");
        }
      });
    } else {
      status("Koneksi Supabase belum tersedia.");
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();

