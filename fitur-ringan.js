
/* ABSENKU - Fitur Ringan
   Dashboard tambahan, motivasi, dan laporan CSV.
   Tidak mengubah fungsi login atau absensi asli.
*/
(function () {
  "use strict";

  window.ABSENKU_FITUR_RINGAN = {
    versi: "1.0.0",

    motivasi: [
      "Disiplin hari ini, sukses di masa depan! ⚓",
      "Mulai dengan semangat, selesaikan dengan bangga!",
      "Kerja keras hari ini membangun impian esok hari.",
      "Satu langkah kecil setiap hari membawa kemajuan besar."
    ],

    ambilMotivasi: function () {
      var daftar = this.motivasi;
      var indeks = Math.floor(Math.random() * daftar.length);
      return daftar[indeks];
    },

    unduhCSV: function (baris, namaFile) {
      if (!Array.isArray(baris) || baris.length === 0) {
        alert("Belum ada data untuk diunduh.");
        return;
      }

      function aman(nilai) {
        var teks = String(nilai == null ? "" : nilai);

        // Mencegah isi CSV ditafsirkan sebagai formula.
        if (/^[\s]*[=+\-@]/.test(teks)) {
          teks = "'" + teks;
        }

        return '"' + teks.replace(/"/g, '""') + '"';
      }

      var isi = "\uFEFF" + baris.map(function (kolom) {
        return kolom.map(aman).join(",");
      }).join("\r\n");

      var blob = new Blob([isi], {
        type: "text/csv;charset=utf-8;"
      });

      var url = URL.createObjectURL(blob);
      var tautan = document.createElement("a");

      tautan.href = url;
      tautan.download = namaFile || "laporan-absenku.csv";
      document.body.appendChild(tautan);
      tautan.click();
      tautan.remove();

      setTimeout(function () {
        URL.revokeObjectURL(url);
      }, 1000);
    }
  };

  console.log("ABSENKU: modul fitur ringan siap.");
})();
