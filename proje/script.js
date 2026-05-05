// ─────────────────────────────────────────────
//  VERİ
// ─────────────────────────────────────────────

const KULLANICILAR = [
  { email: "ogrenci1", sifre: "123", rol: "ogrenci", ad: "Ali Yılmaz" },
  { email: "ogrenci2", sifre: "123", rol: "ogrenci", ad: "Zeynep Kaya" },
  { email: "ogrenci3", sifre: "123", rol: "ogrenci", ad: "Murat Demir" },
  { email: "ogrenci4", sifre: "123", rol: "ogrenci", ad: "Elif Çelik" },
  { email: "hoca1", sifre: "123", rol: "hoca", ad: "Halil İbrahim Şeker", brans: "Öğretim Görevlisi" },
  { email: "hoca2", sifre: "123", rol: "hoca", ad: "Adem Ekinci",         brans: "Öğretim Görevlisi" },
  { email: "hoca3", sifre: "123", rol: "hoca", ad: "Anıl Tunç",           brans: "Öğretim Görevlisi" },
  { email: "hoca4", sifre: "123", rol: "hoca", ad: "Selin Arslan",        brans: "Öğretim Görevlisi" }
];

// 09:00-11:45 sabah, 14:00-14:45 öğleden sonra, 15'er dakika aralıklı
const SAATLER = (function() {
  const saatler = [];
  for (let h = 9; h < 12; h++) {
    for (let m = 0; m < 60; m += 15) {
      saatler.push(String(h).padStart(2,'0') + ':' + String(m).padStart(2,'0'));
    }
  }
  for (let m = 0; m < 60; m += 15) {
    saatler.push('14:' + String(m).padStart(2,'0'));
  }
  return saatler;
})();

// ─────────────────────────────────────────────
//  YARDIMCI FONKSİYONLAR
// ─────────────────────────────────────────────

function aktifKullanici() {
  return JSON.parse(localStorage.getItem("aktifKullanici"));
}

function randevulariGetir() {
  return JSON.parse(localStorage.getItem("randevular")) || [];
}

function randevulariKaydet(r) {
  localStorage.setItem("randevular", JSON.stringify(r));
}

function hocalariGetir() {
  return KULLANICILAR.filter(u => u.rol === "hoca");
}

function uniqueId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

function badgeHtml(durum) {
  const map = {
    "bekliyor":     '<span class="badge badge-warning">⏳ Bekliyor</span>',
    "onaylandi":    '<span class="badge badge-success">✔ Onaylandı</span>',
    "reddedildi":   '<span class="badge badge-danger">✖ Reddedildi</span>'
  };
  return map[durum] || durum;
}

function tarihFormatla(tarih) {
  if (!tarih) return "";
  const [y, m, d] = tarih.split("-");
  return `${d}/${m}/${y}`;
}

// ─────────────────────────────────────────────
//  GİRİŞ / ÇIKIŞ
// ─────────────────────────────────────────────

function girisYap() {
  const email = document.getElementById("email").value.trim();
  const sifre = document.getElementById("sifre").value.trim();

  if (!email || !sifre) {
    showAlert("Lütfen e-posta ve şifrenizi girin.", "error");
    return;
  }

  const user = KULLANICILAR.find(u => u.email === email && u.sifre === sifre);

  if (user) {
    localStorage.setItem("aktifKullanici", JSON.stringify(user));
    window.location.href = user.rol === "ogrenci" ? "dashboard.html" : "hoca.html";
  } else {
    showAlert("E-posta veya şifre hatalı.", "error");
  }
}

function cikis() {
  localStorage.removeItem("aktifKullanici");
  window.location.href = "index.html";
}

function sayfaKoruma(gerekliRol) {
  const user = aktifKullanici();
  if (!user) { window.location.href = "index.html"; return null; }
  if (gerekliRol && user.rol !== gerekliRol) {
    window.location.href = user.rol === "hoca" ? "hoca.html" : "dashboard.html";
    return null;
  }
  return user;
}

function showAlert(mesaj, tip) {
  const el = document.getElementById("alert");
  if (!el) return;
  el.textContent = mesaj;
  el.className = `alert alert-${tip} show`;
  setTimeout(() => el.classList.remove("show"), 3500);
}

// ─────────────────────────────────────────────
//  NAVBAR RENDER
// ─────────────────────────────────────────────

function navbarRender(baslik) {
  const user = aktifKullanici();
  const navbar = document.querySelector(".navbar");
  if (!navbar || !user) return;

  navbar.innerHTML = `
    <div class="navbar-brand">
      <span class="dot"></span>
      ${baslik}
    </div>
    <div class="navbar-right">
      <span class="navbar-user">${user.ad}</span>
      <button class="btn-cikis" onclick="cikis()">Çıkış Yap</button>
    </div>
  `;
}

// ─────────────────────────────────────────────
//  ÖĞRENCİ DASHBOARD
// ─────────────────────────────────────────────

function dashboardYukle() {
  const user = sayfaKoruma("ogrenci");
  if (!user) return;

  navbarRender("Öğrenci Paneli");

  document.getElementById("hosgeldin-ad").textContent = user.ad;

  const randevular = randevulariGetir();
  const benim = randevular.filter(r => r.ogrenciEmail === user.email);

  document.getElementById("stat-toplam").textContent = benim.length;
  document.getElementById("stat-bekliyor").textContent = benim.filter(r => r.durum === "bekliyor").length;
  document.getElementById("stat-onaylandi").textContent = benim.filter(r => r.durum === "onaylandi").length;
}

function randevuGit()     { window.location.href = "randevu.html"; }
function randevularimGit(){ window.location.href = "randevularim.html"; }

// ─────────────────────────────────────────────
//  RANDEVU OLUŞTUR
// ─────────────────────────────────────────────

let secilenHoca = null;
let secilenSaat = null;

function randevuSayfasiYukle() {
  const user = sayfaKoruma("ogrenci");
  if (!user) return;

  navbarRender("Randevu Oluştur");

  // Eski hoca saat ayarlarını temizle (tutarsızlığı önler)
  localStorage.removeItem("hocaAyarlar");

  const bugun = new Date().toISOString().split("T")[0];
  document.getElementById("tarih").min = bugun;

  hocaGridiOlustur();
}

function hocaGridiOlustur() {
  const grid = document.getElementById("hoca-grid");
  const hocalar = hocalariGetir();

  grid.innerHTML = "";

  hocalar.forEach(h => {
    const initials = h.ad.split(" ").filter(w => /^[A-ZÇĞİÖŞÜ]/i.test(w) && w.length > 2).slice(-2).map(w => w[0].toUpperCase()).join("");

    const card = document.createElement("div");
    card.className = "hoca-card";
    card.dataset.email = h.email;
    card.innerHTML = `
      <div class="avatar">${initials}</div>
      <h4>${h.ad}</h4>
      <p>${h.brans}</p>
    `;
    card.onclick = () => hocaSec(h.email, card);
    grid.appendChild(card);
  });
}

function hocaSec(email, cardEl) {
  secilenHoca = email;
  secilenSaat = null;

  document.querySelectorAll(".hoca-card").forEach(c => c.classList.remove("active"));
  cardEl.classList.add("active");

  const tarih = document.getElementById("tarih").value;
  if (tarih) saatleriGoster();
}

function saatleriGoster() {
  if (!secilenHoca) return;

  const tarih = document.getElementById("tarih").value;
  if (!tarih) return;

  const bugun = new Date().toISOString().split("T")[0];
  const secilenGun = new Date(tarih).getDay();

  if (tarih < bugun) {
    showAlert("Geçmiş bir tarihe randevu alamazsınız.", "error");
    document.getElementById("tarih").value = "";
    document.getElementById("saat-bolum").style.display = "none";
    return;
  }

  if (secilenGun === 0 || secilenGun === 6) {
    showAlert("Hafta sonu için randevu oluşturulamaz.", "error");
    document.getElementById("tarih").value = "";
    document.getElementById("saat-bolum").style.display = "none";
    return;
  }

  const div = document.getElementById("saatler");
  div.innerHTML = "";
  secilenSaat = null;

  const randevular = randevulariGetir();
  const hocaninAktifSaatleri = hocaSaatleriniGetir(secilenHoca);

  hocaninAktifSaatleri.forEach(s => {
    const dolu = randevular.find(r =>
      r.hocaEmail === secilenHoca &&
      r.tarih === tarih &&
      r.saat === s &&
      r.durum !== "reddedildi"
    );

    const btn = document.createElement("button");
    btn.className = "saat-btn";
    btn.textContent = s;

    if (dolu) {
      btn.disabled = true;
      btn.title = "Bu saat dolu";
    } else {
      btn.onclick = () => saatSec(s, btn);
    }

    div.appendChild(btn);
  });

  document.getElementById("saat-bolum").style.display = "block";
}

function saatSec(saat, btn) {
  secilenSaat = saat;
  document.querySelectorAll(".saat-btn").forEach(b => b.classList.remove("selected"));
  btn.classList.add("selected");
}

function randevuOlustur() {
  const user = aktifKullanici();
  const tarih = document.getElementById("tarih").value;

  if (!secilenHoca)  { showAlert("Lütfen bir hoca seçin.", "error"); return; }
  if (!tarih)        { showAlert("Lütfen tarih seçin.", "error"); return; }
  if (!secilenSaat)  { showAlert("Lütfen bir saat seçin.", "error"); return; }

  const randevular = randevulariGetir();

  const cakisma = randevular.find(r =>
    r.ogrenciEmail === user.email &&
    r.hocaEmail === secilenHoca &&
    r.tarih === tarih &&
    r.saat === secilenSaat
  );

  if (cakisma) {
    showAlert("Bu saate zaten randevu talebiniz var.", "error");
    return;
  }

  const hoca = KULLANICILAR.find(u => u.email === secilenHoca);

  const yeni = {
    id: uniqueId(),
    ogrenciEmail: user.email,
    ogrenciAd: user.ad,
    hocaEmail: secilenHoca,
    hocaAd: hoca.ad,
    tarih: tarih,
    saat: secilenSaat,
    durum: "bekliyor",
    olusturmaTarihi: new Date().toISOString()
  };

  randevular.push(yeni);
  randevulariKaydet(randevular);

  showAlert("Randevu talebiniz gönderildi! Hocanın onayını bekleyin.", "success");

  secilenSaat = null;
  document.querySelectorAll(".saat-btn").forEach(b => b.classList.remove("selected"));

  setTimeout(() => saatleriGoster(), 1500);
}

// ─────────────────────────────────────────────
//  ÖĞRENCİ RANDEVULARIM
// ─────────────────────────────────────────────

function randevularimYukle() {
  const user = sayfaKoruma("ogrenci");
  if (!user) return;

  navbarRender("Randevularım");

  const randevular = randevulariGetir();
  const benim = randevular
    .filter(r => r.ogrenciEmail === user.email)
    .sort((a, b) => new Date(b.olusturmaTarihi) - new Date(a.olusturmaTarihi));

  const liste = document.getElementById("liste");
  liste.innerHTML = "";

  if (benim.length === 0) {
    liste.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📅</div>
        <p>Henüz randevu talebiniz yok.<br>Randevu almak için <strong>Randevu Oluştur</strong> sayfasına gidin.</p>
      </div>
    `;
    return;
  }

  benim.forEach(r => {
    const div = document.createElement("div");
    div.className = "randevu-item";

    const redMesaji = r.durum === "reddedildi" && r.redSebebi
      ? `<p style="color: var(--danger); font-size: 0.85rem; margin-top: 6px;"><strong>Red Sebebi:</strong> ${r.redSebebi}</p>`
      : "";

    div.innerHTML = `
      <div class="randevu-info">
        <h4>🎓 ${r.hocaAd}</h4>
        <p>${tarihFormatla(r.tarih)} — ${r.saat}</p>
        ${redMesaji}
      </div>
      <div class="randevu-actions">
        ${badgeHtml(r.durum)}
        ${r.durum === "bekliyor" ? `<button class="btn btn-danger" style="padding:6px 12px;font-size:0.8rem;" onclick="randevuIptal('${r.id}')">İptal Et</button>` : ""}
      </div>
    `;
    liste.appendChild(div);
  });
}

function randevuIptal(id) {
  if (!confirm("Bu randevu talebini iptal etmek istiyor musunuz?")) return;

  let randevular = randevulariGetir();
  randevular = randevular.filter(r => r.id !== id);
  randevulariKaydet(randevular);
  randevularimYukle();
}

// ─────────────────────────────────────────────
//  HOCA PANELİ
// ─────────────────────────────────────────────

function hocaPaneliYukle() {
  const user = sayfaKoruma("hoca");
  if (!user) return;

  navbarRender("Hoca Paneli");

  document.getElementById("hoca-ad").textContent = user.ad;
  document.getElementById("hoca-brans").textContent = user.brans;

  hocaRandevulariGoster(user);
}

function hocaRandevulariGoster(user, filtre = "hepsi") {
  const randevular = randevulariGetir();
  let hocanin = randevular
    .filter(r => r.hocaEmail === user.email)
    .sort((a, b) => {
      if (a.tarih !== b.tarih) return a.tarih.localeCompare(b.tarih);
      return a.saat.localeCompare(b.saat);
    });

  if (filtre !== "hepsi") {
    hocanin = hocanin.filter(r => r.durum === filtre);
  }

  const tumHocaRandevular = randevular.filter(r => r.hocaEmail === user.email);
  document.getElementById("stat-toplam").textContent  = tumHocaRandevular.length;
  document.getElementById("stat-bekliyor").textContent = tumHocaRandevular.filter(r => r.durum === "bekliyor").length;
  document.getElementById("stat-onaylandi").textContent = tumHocaRandevular.filter(r => r.durum === "onaylandi").length;

  const liste = document.getElementById("liste");
  liste.innerHTML = "";

  if (hocanin.length === 0) {
    liste.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📭</div>
        <p>Bu filtreye ait randevu bulunmuyor.</p>
      </div>
    `;
    return;
  }

  hocanin.forEach(r => {
    const div = document.createElement("div");
    div.className = "randevu-item";

    const aksiyonlar = r.durum === "bekliyor"
      ? `<button class="btn btn-success" onclick="randevuKabul('${r.id}')">✔ Onayla</button>
         <button class="btn btn-danger"  onclick="randevuReddetAc('${r.id}')">✖ Reddet</button>`
      : badgeHtml(r.durum);

    const redMesaji = r.durum === "reddedildi" && r.redSebebi
      ? `<p style="color: var(--danger); font-size: 0.85rem; margin-top: 6px;"><strong>Red Sebebi:</strong> ${r.redSebebi}</p>`
      : "";

    const reddetmeFormu = r.durum === "bekliyor"
      ? `<div id="red-form-${r.id}" style="display:none; width:100%; margin-top:15px; border-top:1px dashed var(--border); padding-top:15px;">
            <textarea id="red-sebep-${r.id}" class="form-control" placeholder="Reddetme sebebinizi yazın..." style="height:80px; margin-bottom:10px; font-size:0.9rem;"></textarea>
            <div style="display:flex; gap:8px;">
               <button class="btn btn-danger" style="flex:1;" onclick="randevuReddetOnayla('${r.id}')">Reddetmeyi Tamamla</button>
               <button class="btn" style="flex:1; border:1px solid var(--border);" onclick="randevuReddetKapat('${r.id}')">Vazgeç</button>
            </div>
         </div>`
      : "";

    div.innerHTML = `
      <div style="width:100%">
        <div style="display:flex; align-items:center; justify-content:space-between; width:100%;">
          <div class="randevu-info">
            <h4>👤 ${r.ogrenciAd}</h4>
            <p>${tarihFormatla(r.tarih)} — ${r.saat}</p>
            ${redMesaji}
          </div>
          <div class="randevu-actions">
            ${aksiyonlar}
          </div>
        </div>
        ${reddetmeFormu}
      </div>
    `;
    liste.appendChild(div);
  });
}

function filtreUygula(filtre) {
  const user = aktifKullanici();
  document.querySelectorAll(".filtre-btn").forEach(b => b.classList.remove("active-filtre"));
  event.target.classList.add("active-filtre");
  hocaRandevulariGoster(user, filtre);
}

function randevuKabul(id) {
  let randevular = randevulariGetir();
  const r = randevular.find(r => r.id === id);
  if (!r) return;
  r.durum = "onaylandi";
  randevulariKaydet(randevular);
  hocaPaneliYukle();
}

function randevuReddetAc(id) {
  document.getElementById(`red-form-${id}`).style.display = "block";
}

function randevuReddetKapat(id) {
  document.getElementById(`red-form-${id}`).style.display = "none";
}

function randevuReddetOnayla(id) {
  const sebep = document.getElementById(`red-sebep-${id}`).value.trim();

  let randevular = randevulariGetir();
  const r = randevular.find(r => r.id === id);
  if (!r) return;

  r.durum = "reddedildi";
  r.redSebebi = sebep !== "" ? sebep : "Sebep belirtilmedi.";

  randevulariKaydet(randevular);
  hocaPaneliYukle();
}

// ─────────────────────────────────────────────
//  HOCA AYARLARI
// ─────────────────────────────────────────────

function hocaSaatleriniGetir(hocaEmail) {
  // Her zaman güncel SAATLER listesini kullan
  return SAATLER;
}

function ayarlariGoster() {
  const div = document.getElementById("ayarlar-bolum");
  div.style.display = div.style.display === "none" ? "block" : "none";

  if (div.style.display === "block") {
      const user = aktifKullanici();
      const seciliSaatler = hocaSaatleriniGetir(user.email);
      const saatKapsayici = document.getElementById("saat-secenekleri");
      saatKapsayici.innerHTML = "";

      const tumSaatler = SAATLER;

      tumSaatler.forEach(s => {
          const btn = document.createElement("button");
          btn.className = "saat-btn " + (seciliSaatler.includes(s) ? "selected" : "");
          btn.textContent = s;
          btn.onclick = () => btn.classList.toggle("selected");
          saatKapsayici.appendChild(btn);
      });
  }
}

function saatleriKaydet() {
  const user = aktifKullanici();
  const seciliBtnler = document.querySelectorAll("#saat-secenekleri .saat-btn.selected");
  const yeniSaatler = Array.from(seciliBtnler).map(b => b.textContent);

  if(yeniSaatler.length === 0) {
      showAlert("En az bir saat seçmelisiniz!", "error");
      return;
  }

  const ayarlar = JSON.parse(localStorage.getItem("hocaAyarlar")) || {};
  ayarlar[user.email] = yeniSaatler;
  localStorage.setItem("hocaAyarlar", JSON.stringify(ayarlar));

  showAlert("Çalışma saatleriniz başarıyla güncellendi.", "success");
  setTimeout(() => { document.getElementById("ayarlar-bolum").style.display = "none"; }, 1000);
}

// ─────────────────────────────────────────────
//  ENTER İLE GİRİŞ
// ─────────────────────────────────────────────

document.addEventListener("keydown", function(e) {
  if (e.key === "Enter" && typeof girisYap === "function") {
    const emailEl = document.getElementById("email");
    if (emailEl) girisYap();
  }
});