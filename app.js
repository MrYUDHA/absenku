 
<script>
(function () {
  var tombol = document.getElementById("cetak-laporan-absenku");
  var filter = document.getElementById("filter-bulan-absenku");

  if (!tombol) return;

  tombol.onclick = function () {
    var laporan = document.getElementById("laporan-cetak-absenku");
    var tabel = document.getElementById("tabel-cetak-absenku");

    if (!laporan || !tabel) {
      alert("Bagian laporan belum ditemukan. Periksa HTML laporan ABSENKU.");
      return;
    }

    var tabLaporan = window.open("", "_blank");

    if (!tabLaporan) {
      alert("Chrome memblokir tab baru. Izinkan pop-up untuk situs ABSENKU.");
      return;
    }

    var data = {};

    try {
      data = JSON.parse(localStorage.getItem("absenku-demo-v1") || "{}");
    } catch (e) {
      data = {};
    }

    var hari = data.days || {};
    var bulan = filter ? filter.value : "";
    var jumlah = 0;
    var lengkap = 0;
    var belum = 0;
    var totalMenitKerja = 0;

    tabel.replaceChildren();

    Object.keys(hari).sort().forEach(function (tanggal) {
      var catatan = hari[tanggal];

      if (bulan && tanggal.indexOf(bulan) !== 0) return;
      if (!catatan || !catatan.checkIn) return;

      jumlah++;

      if (catatan.checkOut) {
        lengkap++;

        var masuk = catatan.checkIn.split(":");
        var pulang = catatan.checkOut.split(":");

        var menitMasuk = Number(masuk[0]) * 60 + Number(masuk[1]);
        var menitPulang = Number(pulang[0]) * 60 + Number(pulang[1]);

        if (
          Number.isFinite(menitMasuk) &&
          Number.isFinite(menitPulang) &&
          menitPulang >= menitMasuk
        ) {
          totalMenitKerja += menitPulang - menitMasuk;
        }
      } else {
        belum++;
      }

      var baris = document.createElement("tr");

      [
        tanggal,
        catatan.checkIn || "—",
        catatan.checkOut || "—",
        catatan.checkOut ? "Lengkap" : "Belum check-out"
      ].forEach(function (nilai) {
        var sel = document.createElement("td");
        sel.textContent = nilai;
        sel.style.border = "1px solid #333";
        sel.style.padding = "8px";
        baris.appendChild(sel);
      });

      tabel.appendChild(baris);
    });

    function isiTeks(id, nilai) {
      var elemen = document.getElementById(id);
      if (elemen) elemen.textContent = nilai;
    }

    var profile = function (id) {
      var elemen = document.getElementById(id);
      return elemen && elemen.value ? elemen.value : "—";
    };

    var jamKerja = Math.floor(totalMenitKerja / 60);
    var sisaMenit = totalMenitKerja % 60;

    isiTeks("cetak-nama-karyawan", profile("profileFullName"));
    isiTeks("cetak-nik-karyawan", profile("profileEmployeeId"));
    isiTeks("cetak-jabatan-karyawan", profile("profilePosition"));
    isiTeks("cetak-email-karyawan", profile("profileEmail"));
    isiTeks("cetak-telepon-karyawan", profile("profilePhone"));

    isiTeks("cetak-total", jumlah);
    isiTeks("cetak-lengkap", lengkap);
    isiTeks("cetak-belum-pulang", belum);

    isiTeks(
      "cetak-total-jam-kerja",
      jamKerja + " jam " + sisaMenit + " menit"
    );
    isiTeks("cetak-total-hadir", jumlah + " hari");
    isiTeks("cetak-total-belum-checkout", belum + " hari");

    var jumlahHariKerja = 0;
    var sekarang = new Date();

    if (bulan) {
      var bagianBulan = bulan.split("-");
      var tahun = Number(bagianBulan[0]);
      var nomorBulan = Number(bagianBulan[1]);

      var batasHari =
        tahun === sekarang.getFullYear() &&
        nomorBulan === sekarang.getMonth() + 1
          ? sekarang.getDate()
          : new Date(tahun, nomorBulan, 0).getDate();

      for (var h = 1; h <= batasHari; h++) {
        var tanggalCek = new Date(tahun, nomorBulan - 1, h);
        var hariMinggu = tanggalCek.getDay();

        if (hariMinggu !== 0 && hariMinggu !== 6) {
          jumlahHariKerja++;
        }
      }

      isiTeks(
        "cetak-total-tidak-hadir",
        Math.max(0, jumlahHariKerja - jumlah) + " hari"
      );
    } else {
      isiTeks("cetak-total-tidak-hadir", "Pilih bulan");
    }

    isiTeks(
      "judul-bulan-cetak",
      "Periode: " + (bulan || "Semua bulan")
    );
    isiTeks(
      "tanggal-cetak-absenku",
      new Date().toLocaleDateString("id-ID", {
        timeZone: "Asia/Makassar"
      })
    );

    var isiLaporan = laporan.innerHTML;

    tabLaporan.document.open();
    tabLaporan.document.write(
      '<!DOCTYPE html>' +
      '<html lang="id"><head><meta charset="UTF-8">' +
      '<meta name="viewport" content="width=device-width, initial-scale=1">' +
      '<title>Laporan Absensi ABSENKU</title>' +
      '<style>' +
      'body{font-family:Arial,sans-serif;color:#111;background:#fff;padding:16px}' +
      'h1,h2{text-align:center}' +
      'table{width:100%;border-collapse:collapse;margin-bottom:20px}' +
      'th,td{border:1px solid #333;padding:8px;text-align:left}' +
      '.rekap-invoice-absenku{border:1px solid #999;padding:12px;margin:16px 0}' +
      '.rekap-item{display:flex;justify-content:space-between;gap:12px;padding:8px 0;border-bottom:1px solid #ddd}' +
      '.tombol-cetak{display:block;width:100%;padding:14px;margin:0 0 18px;background:#155eef;color:white;border:0;border-radius:8px;font-size:16px;font-weight:bold}' +
      '@media print{body{padding:0}.tombol-cetak{display:none}table{page-break-inside:auto}tr{page-break-inside:avoid}}' +
      '</style></head><body>' +
      '<button class="tombol-cetak" onclick="window.print()">Cetak / Simpan PDF</button>' +
      '<div id="laporan-cetak-absenku" style="display:block">' +
      isiLaporan +
      '</div>' +
      '</body></html>'
    );
    tabLaporan.document.close();
    tabLaporan.focus();
  };
})();
</script>
