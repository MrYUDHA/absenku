
window.ABSENKU_SUPABASE_CONFIG = {
  url: "https://rnwkaonfucunrnicuawy.supabase.co",
  anonKey: "sb_publishable_aiz33tIFXpyhwZW4ZuJBWA_YI4aYDzK"
};
if (window.supabase && window.ABSENKU_SUPABASE_CONFIG) {
  window.ABSENKU_SUPABASE = window.supabase.createClient(
    window.ABSENKU_SUPABASE_CONFIG.url,
    window.ABSENKU_SUPABASE_CONFIG.anonKey
  );
}

const loginForm = document.getElementById("login-form");

if (loginForm) {
  loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const message = document.getElementById("login-message");
    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;
    const supabase = window.ABSENKU_SUPABASE;

    if (!supabase) {
      message.textContent = "Koneksi Supabase belum tersedia.";
      return;
    }

    message.textContent = "Sedang memeriksa akun...";

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
      });

      if (error) throw error;

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("full_name, role, is_active")
        .eq("id", data.user.id)
        .single();

      if (profileError) {
        await supabase.auth.signOut();
        throw new Error("Profil akun belum tersedia atau belum lengkap.");
      }

      if (profile.is_active === false) {
        await supabase.auth.signOut();
        throw new Error("Akun dinonaktifkan. Hubungi admin.");
      }

      document.getElementById("login-screen").style.display = "none";
      window.showDashboardAfterLogin();

      message.textContent =
        "Login berhasil. Selamat datang, " +
        (profile.full_name || email) +
        " (" + profile.role + ").";
    } catch (error) {
      message.textContent = "Login gagal: " + error.message;
    }
  });
}

  
