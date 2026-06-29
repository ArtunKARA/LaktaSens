/* LaktaSens — Tarim ve Orman Bakanligi sunumu (PPTX) */
const path = require('path');
const fs = require('fs');

// resolve pptxgenjs from global install
let pptxgen;
for (const p of [
  'C:/Users/Artun/AppData/Roaming/npm/node_modules/pptxgenjs',
  'pptxgenjs',
]) { try { pptxgen = require(p); break; } catch (e) {} }
if (!pptxgen) { console.error('pptxgenjs not found'); process.exit(1); }

const ROOT = 'C:/Users/Artun/Desktop/Dosyalar/github_repos/LaktaSens';
const SHOTS = path.join(ROOT, 'presentation/bakanlik/screenshots');
const RL_BASELINE = path.join(ROOT, 'KDS/Sürüden_keep_cull/teslim/sunum/grafikler/05_baseline_karsilastirma.png');
const OUT = path.join(ROOT, 'presentation/bakanlik/LaktaSens_Bakanlik_Sunumu.pptx');

const C = {
  dark: '1B4332',   // deep forest (dark slides)
  green: '2D6A4F',
  green2: '40916C',
  light: '74C69D',
  mint: 'B7E4C7',
  bg: 'F4F8F1',     // very light green-white
  panel: 'EAF2E6',
  white: 'FFFFFF',
  gold: 'B8860B',
  goldLt: 'E9C46A',
  text: '1C2B22',
  muted: '5C6B61',
  red: 'A4161A',
  line: 'D8E3D4',
};
const HF = 'Cambria';   // headers (safe-list serif, true-width in QA)
const BF = 'Calibri';   // body

const pres = new pptxgen();
pres.defineLayout({ name: 'W', width: 13.333, height: 7.5 });
pres.layout = 'W';
pres.author = 'LaktaSens';
pres.title = 'LaktaSens — Tarim ve Orman Bakanligi Sunumu';
const W = 13.333, H = 7.5, M = 0.6;

const sh = () => ({ type: 'outer', color: '000000', blur: 9, offset: 3, angle: 90, opacity: 0.16 });
const shUp = () => ({ type: 'outer', color: '000000', blur: 8, offset: 3, angle: 270, opacity: 0.14 });

function card(s, x, y, w, h, fill = C.white, radius = 0.12, shadow = true) {
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x, y, w, h, fill: { color: fill }, line: { color: C.line, width: 1 },
    rectRadius: radius, ...(shadow ? { shadow: sh() } : {}),
  });
}
function circle(s, x, y, d, fill) {
  s.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: fill }, line: { type: 'none' } });
}
function badgeNum(s, x, y, d, n, fill = C.green, color = C.white) {
  circle(s, x, y, d, fill);
  s.addText(String(n), { x, y, w: d, h: d, align: 'center', valign: 'middle', fontFace: HF, bold: true, fontSize: d * 26, color, margin: 0 });
}
// framed screenshot (ratio 1440x900)
function shot(s, file, x, y, w, caption) {
  const ih = w * (900 / 1440);
  const i = 0.1;
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: x - i, y: y - i, w: w + 2 * i, h: ih + 2 * i, fill: { color: C.white }, line: { color: C.line, width: 1 }, rectRadius: 0.07, shadow: sh() });
  s.addImage({ path: path.join(SHOTS, file), x, y, w, h: ih });
  if (caption) s.addText(caption, { x: x - i, y: y + ih + 0.12, w: w + 2 * i, h: 0.3, fontSize: 10, italic: true, color: C.muted, align: 'center', fontFace: BF, margin: 0 });
  return ih;
}
function kicker(s, txt, x, y, color = C.gold) {
  s.addText(txt.toUpperCase(), { x, y, w: 8, h: 0.32, fontFace: BF, bold: true, fontSize: 12.5, color, charSpacing: 2, margin: 0 });
}
function title(s, txt, x, y, w, color = C.text, size = 33) {
  s.addText(txt, { x, y, w, h: 0.85, fontFace: HF, bold: true, fontSize: size, color, margin: 0 });
}

/* ---------- SLIDE 1 — KAPAK ---------- */
(() => {
  const s = pres.addSlide();
  s.background = { color: C.dark };
  // faint motif: large soft circles
  s.addShape(pres.shapes.OVAL, { x: 10.2, y: -2.2, w: 6.5, h: 6.5, fill: { color: C.green, transparency: 70 }, line: { type: 'none' } });
  s.addShape(pres.shapes.OVAL, { x: -1.8, y: 4.4, w: 5.2, h: 5.2, fill: { color: C.green2, transparency: 80 }, line: { type: 'none' } });

  // emblem
  const ex = M, ey = 0.8, d = 1.15;
  s.addShape(pres.shapes.OVAL, { x: ex, y: ey, w: d, h: d, fill: { color: C.green2 }, line: { color: C.goldLt, width: 2.5 } });
  s.addShape(pres.shapes.OVAL, { x: ex + d * 0.34, y: ey + d * 0.2, w: d * 0.32, h: d * 0.45, fill: { color: C.white }, line: { type: 'none' } }); // milk drop
  s.addText('T.C. TARIM VE ORMAN BAKANLIĞI SUNUMU', { x: ex + d + 0.25, y: ey + 0.28, w: 8, h: 0.6, fontFace: BF, bold: true, fontSize: 13, color: C.mint, charSpacing: 2, margin: 0, valign: 'middle' });

  // wordmark
  s.addText([
    { text: 'Lakta', options: { color: C.white } },
    { text: 'Sens', options: { color: C.goldLt } },
  ], { x: M, y: 2.55, w: 11, h: 1.3, fontFace: HF, bold: true, fontSize: 72, margin: 0 });
  s.addText('Akıllı Süt Hayvancılığı ve Karar Destek Platformu', { x: M, y: 3.85, w: 11, h: 0.6, fontFace: BF, fontSize: 23, color: C.mint, margin: 0 });

  // tagline
  s.addText('“Veriyle güçlenen çiftçi, kendine yeten Türkiye.”', { x: M, y: 5.0, w: 11.5, h: 0.7, fontFace: HF, italic: true, bold: true, fontSize: 24, color: C.goldLt, margin: 0 });

  // footer
  s.addShape(pres.shapes.LINE, { x: M, y: 6.55, w: 4.2, h: 0, line: { color: C.green2, width: 1.5 } });
  s.addText('Entegre Çiftlik Operasyonu  •  Sensör & Veri  •  Yapay Zekâ Yol Haritası', { x: M, y: 6.7, w: 9, h: 0.4, fontFace: BF, fontSize: 13, color: 'B9CFC0', margin: 0 });
  s.addText('Haziran 2026', { x: W - M - 3, y: 6.7, w: 3, h: 0.4, fontFace: BF, fontSize: 13, color: 'B9CFC0', align: 'right', margin: 0 });
  s.addNotes('Açılış: LaktaSens tek bir çiftçinin değil, ülkenin süt sürüsünün verisini görünür kılan yerli ve milli bir platformdur. Çiftçi için maliyet ve sağlık; devlet için izlenebilirlik, dışa bağımlılığın azalması ve doğru hedeflenmiş politika.');
})();

/* ---------- SLIDE 2 — NELERI ÇÖZÜYORUZ (+ yeni nesil) ---------- */
(() => {
  const s = pres.addSlide();
  s.background = { color: C.bg };
  kicker(s, 'Kamu yararı', M, 0.45);
  title(s, 'Neleri Çözüyoruz?', M, 0.78, 11);
  s.addText('Türkiye süt hayvancılığının kronik sorunlarına dijital çözüm', { x: M, y: 1.5, w: 11, h: 0.4, fontFace: BF, fontSize: 15, color: C.muted, margin: 0 });

  const probs = [
    ['Yem maliyeti & dışa bağımlılık', 'Süt maliyetinin büyük kısmı yem; hammadde ithalata bağlı.', 'Akıllı rasyon optimizasyonu maliyeti düşürür, yerli yemi önceler.'],
    ['Hayvan sağlığı & antibiyotik', 'Mastitis ve metabolik hastalıklar geç fark edilir.', 'Erken risk uyarısı = daha az hastalık, daha güvenli süt.'],
    ['Küçük üreticinin kaybı', 'Maliyet baskısıyla küçük çiftçi sektörden çekiliyor.', 'Büyük işletme teknolojisini her çiftçiye erişilebilir kılıyoruz.'],
    ['Veri & izlenebilirlik', 'Saha verisi kâğıtta kalıyor; politika veriye dayanamıyor.', 'Sahadan dijital, doğrulanabilir, devlet sistemlerine açık veri.'],
  ];
  const lx = M, lw = 7.5, ty = 2.05, rh = 1.18, gap = 0.1;
  probs.forEach((p, i) => {
    const y = ty + i * (rh + gap);
    card(s, lx, y, lw, rh, C.white, 0.1);
    circle(s, lx + 0.28, y + rh / 2 - 0.27, 0.54, C.green);
    s.addText('✓', { x: lx + 0.28, y: y + rh / 2 - 0.27, w: 0.54, h: 0.54, align: 'center', valign: 'middle', fontFace: BF, bold: true, fontSize: 22, color: C.white, margin: 0 });
    s.addText(p[0], { x: lx + 1.0, y: y + 0.12, w: lw - 1.2, h: 0.34, fontFace: BF, bold: true, fontSize: 14.5, color: C.text, margin: 0 });
    s.addText([
      { text: p[1] + '  ', options: { color: C.muted } },
      { text: '→ ' + p[2], options: { color: C.green, bold: true } },
    ], { x: lx + 1.0, y: y + 0.46, w: lw - 1.2, h: 0.62, fontFace: BF, fontSize: 11.5, margin: 0, valign: 'top' });
  });

  // right panel: yeni nesil
  const rx = lx + lw + 0.35, rw = W - M - rx;
  card(s, rx, ty, rw, 4 * (rh + gap) - gap, C.dark, 0.14);
  s.addText('GELECEĞİ KURUYORUZ', { x: rx + 0.35, y: ty + 0.32, w: rw - 0.7, h: 0.34, fontFace: BF, bold: true, fontSize: 12.5, color: C.goldLt, charSpacing: 1.5, margin: 0 });
  s.addText('Yeni Nesli Tarıma Kazandırmak', { x: rx + 0.35, y: ty + 0.66, w: rw - 0.7, h: 0.7, fontFace: HF, bold: true, fontSize: 21, color: C.white, margin: 0 });
  const yn = [
    ['Cebinden yönetilen çiftlik', 'Akıllı telefondan tek ekran; genç için cazip, modern bir meslek.'],
    ['Kürek değil, karar', 'Ağır el işçiliği yerine veri ve analiz; tarımda nitelikli istihdam.'],
    ['Yapay zekâ rehberliği', 'Sade arayüz + AI önerileri; deneyimsiz genç çiftçiye usta desteği.'],
  ];
  let yy = ty + 1.55;
  yn.forEach((p) => {
    circle(s, rx + 0.35, yy + 0.02, 0.32, C.gold);
    s.addText('›', { x: rx + 0.35, y: yy + 0.02, w: 0.32, h: 0.32, align: 'center', valign: 'middle', fontFace: BF, bold: true, fontSize: 16, color: C.white, margin: 0 });
    s.addText(p[0], { x: rx + 0.8, y: yy - 0.04, w: rw - 1.15, h: 0.32, fontFace: BF, bold: true, fontSize: 13.5, color: C.white, margin: 0 });
    s.addText(p[1], { x: rx + 0.8, y: yy + 0.28, w: rw - 1.15, h: 0.55, fontFace: BF, fontSize: 11, color: C.mint, margin: 0 });
    yy += 0.95;
  });
  s.addNotes('Sorunları siyasi/kamu diliyle ver. Sağ panel kritik: yeni nesli tarıma çekmek istihdam ve kırsal kalkınma mesajıdır — “köyde kazanmayı” mümkün kılıyoruz.');
})();

/* ---------- SLIDE 3 — SUNUM AKIŞI ---------- */
(() => {
  const s = pres.addSlide();
  s.background = { color: C.bg };
  kicker(s, 'Yol haritası', M, 0.45);
  title(s, 'Bu Sunumda Ne Göstereceğiz?', M, 0.78, 12);
  s.addText('Bir vaatten somut teknolojiye — dört adımda', { x: M, y: 1.5, w: 11, h: 0.4, fontFace: BF, fontSize: 15, color: C.muted, margin: 0 });

  const steps = [
    ['Bugün Çalışan Platform', 'Çiftçi, tedarikçi ve depo operasyonu tek ekranda — bugün canlı.', C.green],
    ['Sahadan Canlı Veri', 'Sensörlerle ahır ve hayvan; fiziksel dünya dijitale akıyor.', C.green2],
    ['Yapay Zekâ ile Karar Zekâsı', 'Riski önceden gör, rasyonu optimize et, doğru kararı ver.', C.gold],
    ['Türkiye İçin Anlamı', 'Daha az maliyet, daha sağlıklı sürü, veriye dayalı politika.', C.dark],
  ];
  const n = steps.length, gap = 0.4, cw = (W - 2 * M - (n - 1) * gap) / n, cy = 2.35, chh = 3.5;
  steps.forEach((st, i) => {
    const x = M + i * (cw + gap);
    card(s, x, cy, cw, chh, C.white, 0.12);
    badgeNum(s, x + cw / 2 - 0.45, cy + 0.45, 0.9, i + 1, st[2]);
    s.addText(st[0], { x: x + 0.25, y: cy + 1.6, w: cw - 0.5, h: 0.9, fontFace: HF, bold: true, fontSize: 17, color: C.text, align: 'center', valign: 'top', margin: 0 });
    s.addText(st[1], { x: x + 0.28, y: cy + 2.45, w: cw - 0.56, h: 0.95, fontFace: BF, fontSize: 12.5, color: C.muted, align: 'center', valign: 'top', margin: 0 });
    if (i < n - 1) s.addText('→', { x: x + cw - 0.02, y: cy + chh / 2 - 0.3, w: gap, h: 0.6, align: 'center', valign: 'middle', fontFace: BF, bold: true, fontSize: 24, color: C.light, margin: 0 });
  });
  s.addText('Amaç: bugün gerçek olanı net göstermek, yarının karar zekâsını dürüstçe konumlandırmak.', { x: M, y: 6.35, w: W - 2 * M, h: 0.5, fontFace: BF, italic: true, fontSize: 13.5, color: C.green, align: 'center', margin: 0 });
  s.addNotes('Dikkat çekici çerçeve: bu bir vaat değil, somut adımlar. Canlı modüller ile AI yol haritasını ayırdığımızı baştan söylüyoruz — güven verir.');
})();

/* ---------- helper: standard content header ---------- */
function head(s, kick, ttl) {
  s.background = { color: C.bg };
  kicker(s, kick, M, 0.45);
  title(s, ttl, M, 0.78, 12);
}

/* ---------- SLIDE 4 — PLATFORM GENEL BAKIŞ ---------- */
(() => {
  const s = pres.addSlide();
  head(s, 'Çözüm', 'Tek Platform, Tüm Operasyon');
  s.addText('LaktaSens; çiftçiyi, tedarikçiyi, depoyu ve sensörü tek bir izlenebilir operasyon zincirinde birleştirir.', { x: M, y: 1.6, w: 6.4, h: 0.8, fontFace: BF, fontSize: 14.5, color: C.text, margin: 0 });

  const mods = [
    ['Döngü & Sürü Takibi', 'Sağmal, kuru, gebe, servis, yenidoğan ve çıkarılacaklar'],
    ['Ambar & Depo', 'Stok, mal kabul, tüketim, sevk ve izlenebilirlik'],
    ['Tedarik & İhale', 'Market, toplu alım ihalesi, sipariş ve sevkiyat'],
    ['Sensör İzleme', 'Ahır/inek sıcaklık, nem, tasma; canlı saha verisi'],
    ['Analitik', 'İhtiyaç, tedarik ve tüketim analizleri'],
    ['Yapay Zekâ (yol haritası)', 'Risk, tahmin, anomali ve öneri merkezi'],
  ];
  const gx = M, gy = 2.5, gw = 6.4, cw = (gw - 0.3) / 2, chh = 1.18, gpy = 0.16;
  mods.forEach((m, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = gx + col * (cw + 0.3), y = gy + row * (chh + gpy);
    card(s, x, y, cw, chh, C.white, 0.1);
    circle(s, x + 0.22, y + 0.22, 0.42, C.panel);
    s.addText(String(i + 1), { x: x + 0.22, y: y + 0.22, w: 0.42, h: 0.42, align: 'center', valign: 'middle', fontFace: HF, bold: true, fontSize: 16, color: C.green, margin: 0 });
    s.addText(m[0], { x: x + 0.78, y: y + 0.16, w: cw - 0.95, h: 0.34, fontFace: BF, bold: true, fontSize: 12.5, color: C.text, margin: 0 });
    s.addText(m[1], { x: x + 0.78, y: y + 0.5, w: cw - 0.95, h: 0.6, fontFace: BF, fontSize: 10, color: C.muted, margin: 0 });
  });

  // right: screenshot
  shot(s, 'ai_genel_ozet.png', 7.5, 1.85, 5.25, 'Çiftçi paneli — tek merkezden operasyon görünümü');
  // role chips
  s.addText([
    { text: '3 Rol:  ', options: { bold: true, color: C.green } },
    { text: 'Çiftçi  •  Tedarikçi  •  Yönetim', options: { color: C.text } },
  ], { x: 7.5, y: 6.35, w: 5.25, h: 0.4, fontFace: BF, fontSize: 13, align: 'center', margin: 0 });
  s.addNotes('Mesaj: yüzeysel değil, operasyon derinliği olan iki taraflı bir platform. Sidebar her ekranda modül genişliğini gösterir.');
})();

/* ---------- SLIDE 5 — SENSÖR ---------- */
(() => {
  const s = pres.addSlide();
  head(s, 'Sahadan canlı veri', 'Sensör İzleme: Fiziksel Dünyadan Dijitale');
  const tx = M, tw = 4.7;
  s.addText('Ahır ve hayvan; sıcaklık, nem ve tasma verisiyle 7/24 izlenir. Sistem fiziksel dünyaya bağlanır.', { x: tx, y: 1.75, w: tw, h: 1.0, fontFace: BF, fontSize: 14.5, color: C.text, margin: 0 });
  const pts = [
    ['Sıcaklık stresi (THI)', 'Verim kaybına yol açan ısı stresi erken yakalanır.'],
    ['Soğuk zincir', 'Depo/süt soğuk zinciri sapmaları anında görünür.'],
    ['Sağlık eşikleri', 'Vücut sıcaklığı ideal/riskli aralıklara göre yorumlanır.'],
  ];
  let y = 2.95;
  pts.forEach((p) => {
    circle(s, tx, y + 0.02, 0.34, C.green2);
    s.addText('•', { x: tx, y: y + 0.02, w: 0.34, h: 0.34, align: 'center', valign: 'middle', fontFace: BF, bold: true, fontSize: 20, color: C.white, margin: 0 });
    s.addText(p[0], { x: tx + 0.5, y: y - 0.04, w: tw - 0.5, h: 0.32, fontFace: BF, bold: true, fontSize: 13.5, color: C.text, margin: 0 });
    s.addText(p[1], { x: tx + 0.5, y: y + 0.28, w: tw - 0.5, h: 0.5, fontFace: BF, fontSize: 11.5, color: C.muted, margin: 0 });
    y += 1.0;
  });
  shot(s, 'sensor_sicaklik.png', 5.7, 1.75, 7.0, 'Nem–sıcaklık izleme ve inek vücut sıcaklığı risk aralıkları (canlı grafik)');
  s.addNotes('“Saha verisi dijital panele akıyor” mesajı. THI doğrudan iklim değişikliği–verim bağına köprü.');
})();

/* ---------- SLIDE 6 — TEDARIK & İHALE ---------- */
(() => {
  const s = pres.addSlide();
  head(s, 'İki taraflı pazar', 'Tedarik & Şeffaf Alım');
  shot(s, 'ihale_baslat.png', M, 1.75, 7.0, 'İhale başlatma — planlı toplu alım ve teklif toplama');
  const tx = 8.2, tw = W - M - tx;
  s.addText('Çiftçi satın alma kararını platform içinde verir; tedarikçi aynı ağda teklif sunar.', { x: tx, y: 1.85, w: tw, h: 0.9, fontFace: BF, fontSize: 14.5, color: C.text, margin: 0 });
  const pts = [
    ['Yem Market', 'Ürün, fiyat, stok ve tedarikçi karşılaştırması tek ekranda.'],
    ['Toplu Alım İhalesi', 'Planlı talep + teklif toplama ile ölçeklenebilir tedarik ağı.'],
    ['Sipariş → Sevkiyat → Depo', 'Karar siparişten depoya kadar uçtan uca izlenir.'],
  ];
  let y = 3.0;
  pts.forEach((p) => {
    circle(s, tx, y + 0.02, 0.34, C.gold);
    s.addText('•', { x: tx, y: y + 0.02, w: 0.34, h: 0.34, align: 'center', valign: 'middle', fontFace: BF, bold: true, fontSize: 20, color: C.white, margin: 0 });
    s.addText(p[0], { x: tx + 0.5, y: y - 0.04, w: tw - 0.5, h: 0.32, fontFace: BF, bold: true, fontSize: 13.5, color: C.text, margin: 0 });
    s.addText(p[1], { x: tx + 0.5, y: y + 0.28, w: tw - 0.5, h: 0.6, fontFace: BF, fontSize: 11.5, color: C.muted, margin: 0 });
    y += 1.05;
  });
  s.addNotes('Tedarik tarafında ölçeklenebilir ağ ve şeffaf fiyat. İki taraflı yapı = tek kullanıcı tipine bağlı değil.');
})();

/* ---------- SLIDE 7 — DEPO & ANALITİK ---------- */
(() => {
  const s = pres.addSlide();
  head(s, 'Operasyondan analitiğe', 'Depo & Akıllı Analitik');
  const tx = M, tw = 4.9;
  s.addText('Depo yalnızca teslim almaz; sürekli izler ve operasyon verisini analitiğe dönüştürür.', { x: tx, y: 1.75, w: tw, h: 1.0, fontFace: BF, fontSize: 14.5, color: C.text, margin: 0 });
  const pts = [
    ['Stok & tüketim', 'Anlık stok, mal kabul ve tüketim geçmişi.'],
    ['İhtiyaç analizi', 'Sürü dağılımına göre yem ihtiyacı tahmini.'],
    ['Tedarik & tüketim analizi', 'Geçmişe dönük kontrol ve planlama.'],
  ];
  let y = 2.95;
  pts.forEach((p) => {
    circle(s, tx, y + 0.02, 0.34, C.green);
    s.addText('•', { x: tx, y: y + 0.02, w: 0.34, h: 0.34, align: 'center', valign: 'middle', fontFace: BF, bold: true, fontSize: 20, color: C.white, margin: 0 });
    s.addText(p[0], { x: tx + 0.5, y: y - 0.04, w: tw - 0.5, h: 0.32, fontFace: BF, bold: true, fontSize: 13.5, color: C.text, margin: 0 });
    s.addText(p[1], { x: tx + 0.5, y: y + 0.28, w: tw - 0.5, h: 0.5, fontFace: BF, fontSize: 11.5, color: C.muted, margin: 0 });
    y += 1.0;
  });
  shot(s, 'yem_ihtiyac_analizi.png', 5.9, 1.75, 6.8, 'Sürü dağılımı ve yem tüketimine dayalı ihtiyaç analizi');
  s.addNotes('Ürün form dolduran panel değil; operasyon verisini analitik katmana taşıyor. Bu, AI için veri temelini kurar.');
})();

/* ---------- SLIDE 8 — AI VIZYONU (dark) ---------- */
(() => {
  const s = pres.addSlide();
  s.background = { color: C.dark };
  s.addShape(pres.shapes.OVAL, { x: 9.8, y: -2.6, w: 6.5, h: 6.5, fill: { color: C.green, transparency: 78 }, line: { type: 'none' } });
  kicker(s, 'Yol haritası — Vizyon', M, 0.5, C.goldLt);
  s.addText('Yapay Zekâ: Geleceğin Karar Zekâsı', { x: M, y: 0.85, w: 12, h: 0.85, fontFace: HF, bold: true, fontSize: 33, color: C.white, margin: 0 });
  s.addText('“Her inek için, her gün, en doğru besleme ve sağlık kararı — saniyeler içinde, açıklanabilir biçimde.”', { x: M, y: 1.7, w: 12, h: 0.5, fontFace: HF, italic: true, fontSize: 16, color: C.goldLt, margin: 0 });

  // pipeline
  const items = [
    ['Veri', 'Sensör + süt + sağlık + çevre', C.green2],
    ['Proje A', 'Risk & ihtiyaç tahmini, erken uyarı', C.green],
    ['Proje B', 'Maliyet-verim-risk rasyon optimizasyonu', C.gold],
    ['Karar', 'Açıklamalı öneri + IOFC ekonomisi', C.light],
  ];
  const n = items.length, gap = 0.55, cw = (W - 2 * M - (n - 1) * gap) / n, cy = 2.55, chh = 2.1;
  items.forEach((it, i) => {
    const x = M + i * (cw + gap);
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: cy, w: cw, h: chh, fill: { color: '244C3A' }, line: { color: '356B50', width: 1 }, rectRadius: 0.1 });
    circle(s, x + 0.3, cy + 0.3, 0.42, it[2]);
    s.addText(it[0], { x: x + 0.9, y: cy + 0.28, w: cw - 1.1, h: 0.5, fontFace: HF, bold: true, fontSize: 17, color: C.white, margin: 0, valign: 'middle' });
    s.addText(it[1], { x: x + 0.3, y: cy + 0.95, w: cw - 0.6, h: 1.0, fontFace: BF, fontSize: 12, color: C.mint, margin: 0, valign: 'top' });
    if (i < n - 1) s.addText('→', { x: x + cw - 0.02, y: cy + chh / 2 - 0.3, w: gap, h: 0.6, align: 'center', valign: 'middle', fontFace: BF, bold: true, fontSize: 26, color: C.goldLt, margin: 0 });
  });

  // parallel RL note
  card(s, M, 5.25, W - 2 * M, 1.5, '244C3A', 0.12, false);
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: M, y: 5.25, w: W - 2 * M, h: 1.5, fill: { color: '244C3A' }, line: { color: '356B50', width: 1 }, rectRadius: 0.12 });
  circle(s, M + 0.35, 5.6, 0.8, C.green);
  s.addText('RL', { x: M + 0.35, y: 5.6, w: 0.8, h: 0.8, align: 'center', valign: 'middle', fontFace: HF, bold: true, fontSize: 22, color: C.white, margin: 0 });
  s.addText('Sürüden Tut / Çıkar Kararı (Pekiştirmeli Öğrenme)', { x: M + 1.4, y: 5.45, w: 10.4, h: 0.4, fontFace: BF, bold: true, fontSize: 15, color: C.white, margin: 0 });
  s.addText('Doğru hayvanı doğru zamanda elde tutmak — ekonomik ve verim temelli, ulusal sürü kapasitesini koruyan kararlar.', { x: M + 1.4, y: 5.85, w: 11.0, h: 0.7, fontFace: BF, fontSize: 12.5, color: C.mint, margin: 0 });
  s.addNotes('Bu slayt vizyon. Siyasi kanca: ülke ölçeğinde her hayvan için akıllı, açıklanabilir karar. Canlı değil yol haritası olduğunu sonraki slaytta dürüstçe söyle.');
})();

/* ---------- SLIDE 9 — AI EKRANLAR (demo) ---------- */
(() => {
  const s = pres.addSlide();
  head(s, 'Yapay zekâ, üründe', 'AI Karar Ekranları (Demo)');
  s.addText('Vizyonu somutlaştıran demo ekranlar — risk, anomali ve öneriler çiftçinin diline çevrilir.', { x: M, y: 1.55, w: 12, h: 0.4, fontFace: BF, fontSize: 14, color: C.muted, margin: 0 });
  const files = [
    ['ai_risk_skorlari.png', 'Risk Skorları — mastitis, kalite, verim kaybı'],
    ['ai_anomaliler.png', 'Anomaliler — kritik/yüksek öncelikli sapmalar'],
    ['ai_oneri_merkezi.png', 'Öneri Merkezi — etkisi ve önceliğiyle aksiyonlar'],
  ];
  const n = 3, gap = 0.4, w = (W - 2 * M - (n - 1) * gap) / n;
  files.forEach((f, i) => {
    const x = M + i * (w + gap);
    shot(s, f[0], x, 2.25, w, f[1]);
  });
  s.addText('Not: Bu ekranlar gösterim amaçlı demo verilerle çalışır; model entegrasyonu yol haritasındadır.', { x: M, y: 6.55, w: W - 2 * M, h: 0.4, fontFace: BF, italic: true, fontSize: 12, color: C.muted, align: 'center', margin: 0 });
  s.addNotes('Dürüstlük: ekranların kendisi de “Sadece demo amaçlıdır” yazıyor. Bunu saklamıyoruz — güven verir.');
})();

/* ---------- SLIDE 10 — ELDEKI AI SONUÇLARI (honest) ---------- */
(() => {
  const s = pres.addSlide();
  head(s, 'Şeffaflık', 'Yapay Zekâ: Şu Ana Kadar Ne Yaptık?');

  // left: Proje A stat cards
  s.addText('Proje A — Sağlık/Risk Modeli Altyapısı', { x: M, y: 1.6, w: 6.2, h: 0.4, fontFace: BF, bold: true, fontSize: 15, color: C.green, margin: 0 });
  const stats = [
    ['19', 'sınıflandırma modeli karşılaştırıldı'],
    ['5×5', 'tekrarlı, inek-bazlı çapraz doğrulama'],
    ['↓ECE', 'olasılık kalibrasyonu uygulandı'],
    ['Açıkl.', 'açıklanabilir özellik önemi (SHAP/permütasyon)'],
  ];
  const gx = M, gy = 2.1, cw = 3.0, chh = 1.15, gp = 0.2;
  stats.forEach((st, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = gx + col * (cw + gp), y = gy + row * (chh + gp);
    card(s, x, y, cw, chh, C.white, 0.1);
    s.addText(st[0], { x: x + 0.2, y: y + 0.12, w: cw - 0.4, h: 0.55, fontFace: HF, bold: true, fontSize: 28, color: C.gold, margin: 0 });
    s.addText(st[1], { x: x + 0.2, y: y + 0.68, w: cw - 0.4, h: 0.42, fontFace: BF, fontSize: 10.5, color: C.muted, margin: 0 });
  });
  s.addText('Çıkarım: Riskli inekleri ayırt eden model altyapısı kuruldu ve titizce doğrulandı.', { x: M, y: 4.75, w: 6.2, h: 0.6, fontFace: BF, italic: true, fontSize: 12.5, color: C.text, margin: 0 });

  // right: RL baseline chart
  s.addText('Keep/Cull — Pekiştirmeli Öğrenme', { x: 6.9, y: 1.6, w: 6.0, h: 0.4, fontFace: BF, bold: true, fontSize: 15, color: C.green, margin: 0 });
  // baseline image ratio 1681x895
  const bw = 6.0, bh = bw * (895 / 1681);
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 6.9 - 0.0, y: 2.05, w: bw + 0.2, h: bh + 0.2, fill: { color: C.white }, line: { color: C.line, width: 1 }, rectRadius: 0.06, shadow: sh() });
  s.addImage({ path: RL_BASELINE, x: 7.0, y: 2.15, w: bw, h: bh });
  s.addText('Öğrenen ajan (qlearning −204) naif kuralları (cull_all −1300) açık ara geçiyor; MDP optimumuna eşit.', { x: 6.9, y: 2.15 + bh + 0.25, w: 6.1, h: 0.6, fontFace: BF, fontSize: 11, color: C.muted, margin: 0 });

  // honest caveat band
  card(s, M, 6.35, W - 2 * M, 0.78, C.panel, 0.1, false);
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: M, y: 6.35, w: W - 2 * M, h: 0.78, fill: { color: C.panel }, line: { color: C.light, width: 1 }, rectRadius: 0.1 });
  s.addText([
    { text: 'Önemli not:  ', options: { bold: true, color: C.red } },
    { text: 'Bu sonuçlar yöntem ve altyapıyı doğrulamak için sentetik/temsili veriyle üretildi. Gerçek saha verisiyle doğrulama ve üretime geçiş hedefimizdir.', options: { color: C.text } },
  ], { x: M + 0.25, y: 6.35, w: W - 2 * M - 0.5, h: 0.78, fontFace: BF, fontSize: 12, valign: 'middle', margin: 0 });
  s.addNotes('Kullanıcının istediği “hafif bahis + ne var elimizde”. Abartma yok: altyapı kuruldu/doğrulandı; gerçek veri ve üretim hedef. Caveat’i atlama — bakanlıkta güveni bu kurar.');
})();

/* ---------- SLIDE 11 — KAPANIŞ: VIZYON & MISYON (dark) ---------- */
(() => {
  const s = pres.addSlide();
  s.background = { color: C.dark };
  s.addShape(pres.shapes.OVAL, { x: -2.2, y: 3.8, w: 6, h: 6, fill: { color: C.green2, transparency: 80 }, line: { type: 'none' } });
  kicker(s, 'Vizyon & Misyon', M, 0.55, C.goldLt);
  s.addText('Veriyle Güçlenen Çiftçi, Kendine Yeten Türkiye', { x: M, y: 0.9, w: 12, h: 1.0, fontFace: HF, bold: true, fontSize: 30, color: C.white, margin: 0 });

  // vizyon card
  card(s, M, 2.1, 5.9, 4.0, '244C3A', 0.14, false);
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: M, y: 2.1, w: 5.9, h: 4.0, fill: { color: '244C3A' }, line: { color: '356B50', width: 1 }, rectRadius: 0.14 });
  s.addText('VİZYON', { x: M + 0.4, y: 2.35, w: 5, h: 0.4, fontFace: BF, bold: true, fontSize: 13, color: C.goldLt, charSpacing: 2, margin: 0 });
  s.addText('Bereketli topraklarımızda üretilen her damla sütü veriyle değerli kılmak; dışa bağımlılığı azaltarak kendine yeten, güçlü ve dijital bir Türkiye tarımı inşa etmek.', { x: M + 0.4, y: 2.8, w: 5.1, h: 3.1, fontFace: HF, fontSize: 17, color: C.white, margin: 0, valign: 'top', lineSpacingMultiple: 1.15 });

  // misyon list
  const mx = M + 6.4, mw = W - M - mx;
  s.addText('MİSYON', { x: mx, y: 2.35, w: 5, h: 0.4, fontFace: BF, bold: true, fontSize: 13, color: C.goldLt, charSpacing: 2, margin: 0 });
  const mis = [
    'Akıllı karar gücünü Anadolu’daki küçük üreticinin de hizmetine sunmak — kimseyi geride bırakmadan.',
    'Yem maliyetini düşürerek cari açıkla mücadeleye ve üreticinin kazancına omuz vermek.',
    'Hayvanları hastalanmadan koruyarak gıda güvenliğini ve sofraların bereketini güvence altına almak.',
    'Ürettiği veriyle devletin politikalarına, desteklemelerine ve denetimine güç katan yerli ve milli bir altyapı kurmak.',
  ];
  let y = 2.85;
  mis.forEach((m) => {
    circle(s, mx, y + 0.04, 0.28, C.gold);
    s.addText('✓', { x: mx, y: y + 0.04, w: 0.28, h: 0.28, align: 'center', valign: 'middle', fontFace: BF, bold: true, fontSize: 13, color: C.white, margin: 0 });
    s.addText(m, { x: mx + 0.45, y: y - 0.05, w: mw - 0.45, h: 0.78, fontFace: BF, fontSize: 13, color: C.mint, margin: 0, valign: 'top' });
    y += 0.82;
  });

  s.addText('Devlet  —  Üretici  —  Teknoloji:  el ele, üretim için.', { x: M, y: 6.55, w: 12, h: 0.5, fontFace: HF, italic: true, bold: true, fontSize: 18, color: C.goldLt, align: 'center', margin: 0 });
  s.addNotes('Kapanış: vizyon-misyon politik tonda. Son cümle çağrı: devlet-üretici-teknoloji işbirliği. Buradan soru-cevaba geç.');
})();

pres.writeFile({ fileName: OUT }).then(() => console.log('WROTE', OUT)).catch((e) => { console.error(e); process.exit(1); });
