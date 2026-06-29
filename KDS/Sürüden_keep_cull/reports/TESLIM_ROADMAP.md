# Teslim Yol Haritası — Keep/Cull RL Projesi

> Amaç: Teslim-2 isterlerine ve Teslim-3 savunma sorularına **birebir** uyan, tamamı
> `notebooks/rl_experiment_runner.ipynb` içinden tetiklenip görüntülenebilen bir teslim paketi üretmek.
> Tarih: 2026-06-13 · Branch: main · Arşiv adı: `255172008_ArtunKARA`

---

## İLERLEME DURUMU (2026-06-13)

**Tamamlanan (smoke profilinde uçtan uca doğrulandı):**
- ✅ FAZ 1 — `teslim/kod/seeds.txt` (5 seed) + `rl_core.py` (çok-seed Q-learning & DQN, ham log + greedy eval + DQN loss) + `train.py`
- ✅ FAZ 2 — `evaluate.py` → `teslim/sonuclar/sonuclar.csv` (+`sonuclar_agg.csv`, seed×metrik mean±std)
- ✅ FAZ 3 — `plotting.py` (5 standart grafik, başlık/birim/lejant/n=5 seed/MA/std bandı) + `sweep.py` (Grafik 4) + veri-temelli `yorumlar.md`
- ✅ FAZ 4 — `requirements.txt` (==), `run_all.sh`, `README.md`, `config.yaml`
- ✅ FAZ 6 — Notebook "14. Teslim Paketi" bölümü: tetikle (train/sweep/evaluate/plot) + 5 grafiği inline göster + checklist
- ✅ Ortam doğrulama: gymnasium 0.29.1 + stable_baselines3 2.3.2 kuruldu; yasak kalıp yok

- ✅ **`full` profil koşusu TAMAMLANDI** (2026-06-13, ~40 dk) — gerçek teslim artefaktları üretildi: 42 ham log, `sonuclar.csv`, 5 grafik (full), `yorumlar.md`.

**Full sonuç (seed×metrik ort., yüksek=iyi):** qlearning −204 (std 30) > mdp_value_iteration −225 > dqn −270 (std 20) > risk_threshold −385 > keep_all −428 > random −964 > cull_all −1300.
→ Ajanlar tüm baselineları geçiyor; **qlearning model-tabanlı MDP optimumunu bile sollluyor** (model-free, simülatöre doğrudan optimize ettiği için — raporda güçlü tartışma). DQN çok kararlı (std 20). Grafik 4 sweet-spot: epsilon=0.35 × alpha=0.18 (= seçilen varsayılanlar).

- ✅ **FAZ 5 içerik TAMAMLANDI** — `teslim/rapor/255172008_rapor.md`: Neden-RL gerekçesi, ödül formülü LaTeX↔kod (satır 76/120 doğrulandı), MDP formülasyonu, full sonuçlar + 5 grafik, **Teslim-3 savunma cevapları** (4 alan, kod satırlı: stokastiklik `rl_experiment_utils.py:161`, off-policy `rl_core.py:295/307/460`), dürüstlük notu. Env modülleri `kod/env/`'e vendor'landı (satır no kilitli).

- ✅ **Rapor PDF + Sunum PDF TAMAMLANDI** (xelatex): `rapor/255172008_rapor.pdf` (6 sayfa, formül/tablo/5 grafik) + `sunum/255172008_sunum.pdf` (13 slayt). Türkçe + LaTeX matematik + gömülü grafikler, 0 taşma. Kaynaklar: `.tex` (+ rapor `.md`).

- ✅ **FAZ 7 TAMAMLANDI** — `teslim/build_package.py`: `teslim/dist/255172008_ArtunKARA.zip` (5.25 MB) kurar + kabul-şartı checklist (13/13 ✓). `rl_core` layout-agnostik (standalone'da veri `kod/data`, config `kod/config`'ten; repo-içinde repo kökünden). Standalone `bash run_all.sh smoke` ile uçtan uca doğrulandı. Notebook 14.6 hücresi paketlemeyi tetikler. Video rehberi: `teslim/VIDEO_CEKIM_REHBERI.md`.

**KALAN (sadece kullanıcı):**
- 🎥 `255172008_video.mp4` çekimi (rehber hazır) — Claude çekemez.
- (Opsiyonel) raporda smoke yerine full grafiklerle final cilalama (zaten full üretildi).

---

## 0. Mevcut Durum — Güçlü Yanlar (zaten var, korunacak)

- **Gerçek/gerekçeli ortam:** `CowReplacementEnv` empirik geçiş modeliyle (`empirical_transition_model.csv`, 1592 geçiş satırı) ve ABD-2025 ekonomik ödül parametreleriyle besleniyor. Veri bütünlüğü zaten kurulu.
- **Gymnasium uyumlu** (`import gymnasium as gym` — yasaklı `import gym` YOK). ✓
- **RNG uyumlu:** Her yerde `np.random.default_rng` — yasaklı `np.random.seed` / `np.random.choice` YOK. ✓
- **Algoritma ailesi geniş:** MDP value iteration (model-based optimum referans), tabular Q-learning, tabular PPO-smoke, DQN-style FQI, SB3 PPO, SB3 DQN + heuristik baselinelar (keep_all, cull_all, random_policy, risk_threshold, milk_margin).
- **Notebook tetikleme iskeleti** kurulu: `run_model(...)`, `env.load_output_tables()`, figür galerisi, manifest kaydı.
- **IEEE raporu** taslağı var (`reports/ieee_keep_cull_rl_report/main.tex`, 1101 satır, PDF derleniyor).

---

## 1. İster → Durum Eşlemesi (GAP Tablosu)

| # | İster (Teslim-2) | Mevcut Durum | GAP | Öncelik |
|---|---|---|---|---|
| G1 | **≥5 seed**, ortalama ± std bandı | Her şey tek seed=42 | **YOK — en kritik** | 🔴 P0 |
| G2 | **Grafik 1 — Öğrenme eğrisi** (y: episode getirisi, x: episode/adım) | Q-learning ve SB3 eğitim sırasında episode getirisi loglamıyor | **YOK** | 🔴 P0 |
| G3 | **Grafik 2 — Test (eval) eğrisi** (deterministic/greedy, eğitim boyunca) | Sadece eğitim sonu tek eval var; eğitim boyunca eval eğrisi yok | **YOK** | 🔴 P0 |
| G4 | **Grafik 3 — Loss eğrisi** (+1 paragraf) / tablo yöntemde value-policy heatmap | SB3 loss loglanmıyor; tabular value/policy heatmap yok | **YOK** | 🔴 P0 |
| G5 | **Grafik 4 — Hiperparametre duyarlılığı** (≥2 param × ≥3 değer) | Sweep altyapısı yok | **YOK** | 🟠 P1 |
| G6 | **Grafik 5 — Baseline karşılaştırma** (random/heuristik vs ajan) | Veri var (`rl_algorithm_comparison_results.csv`), figür var ama seed bandı/standart yok | **KISMİ** | 🟠 P1 |
| G7 | Her grafikte: başlık, **birimli** eksen, lejant, seed bilgisi, hareketli ortalama | Mevcut figürlerde birim/seed/MA bandı eksik | **KISMİ** | 🔴 P0 |
| G8 | Her grafiğin altında **4 cümlelik yorum** (Gözlem→Karşılaştırma→Açıklama→Sonuç) | Yok | **YOK** | 🟠 P1 |
| G9 | `kod/` paketi: `env/ train.py evaluate.py config.yaml requirements.txt(==) seeds.txt run_all.sh README.md` | Hiçbiri yok (farklı dizin yapısı) | **YOK** | 🔴 P0 |
| G10 | `sonuclar/loglar/` — ham log (tfevents VEYA CSV) | Yok (ham per-seed log üretilmiyor) | **YOK — kabul şartı** | 🔴 P0 |
| G11 | `sonuclar/sonuclar.csv` — seed × metrik özeti | Yok | **YOK** | 🔴 P0 |
| G12 | `requirements.txt` **==** ile pinli | Ana req pinsiz; rl-req'de sadece torch pinli | **KISMİ** | 🟠 P1 |
| G13 | **Ödül formülü** raporda LaTeX + kodda satır no, birebir aynı | Formül `scripts/rl_mdp_utils.py:64 reward_components` içinde; raporda LaTeX eşlemesi doğrulanmalı | **KISMİ** | 🟠 P1 |
| G14 | **"Neden RL?"** bölümü (ardışıklık, gecikmeli ödül, stokastiklik, A*/DP'den pahalı mı) | docs'ta dağınık; raporda açık bölüm + kod kanıtı gerek | **KISMİ** | 🟠 P1 |
| G15 | Rapor 6–8 sayfa + sunum (.pptx/pdf) + her grafik ayrı PNG | IEEE rapor var; sunum + grafik PNG klasörü teslim formatında yok | **KISMİ** | 🟡 P2 |
| G16 | Teslim-3 savunma cevapları (determinizm/on-off/Markov/POMDP) projeye özel + kod satırı | Yok | **YOK** | 🟠 P1 |
| G17 | Tek arşiv `ogrno_AdSoyad.zip` + ayrı video | Paketleme adımı yok | **YOK** | 🟡 P2 |

**Özet:** Altyapı sağlam; eksik olan tek kelimeyle **"çok-seed + eğitim boyunca eğri loglama + standart 5 grafik + teslim paketleme"**. Bunların hepsi mevcut empirik ortamın üstüne eklenir, veri bütünlüğü bozulmaz (seed çeşitliliği ortamın stokastik geçişlerinden ve keşif rastgeleliğinden gelir — meşru).

---

## 2. Öncelikli Yol Haritası (Fazlar)

### FAZ 1 — Çok-seed eğitim + ham log altyapısı (P0) 🔴
Tüm grafiklerin temeli. Bunsuz hiçbir zorunlu grafik standardı sağlanamaz.

- **1.1** `seeds.txt` oluştur (≥5 seed, ör. `42, 123, 2024, 7, 99`).
- **1.2** `kod/train.py` giriş noktası: seçilen algoritmayı **her seed için** eğitir. Eğitim sırasında:
  - her episode'un **toplam getirisini** (episode return) → `sonuclar/loglar/<algo>_train_seed<NN>.csv`
  - periyodik **deterministic/greedy eval** getirisini → `sonuclar/loglar/<algo>_eval_seed<NN>.csv`
  - varsa **loss** (SB3 DQN/PPO logger'dan) → aynı log
- **1.3** Tabular Q-learning'e episode-return + periyodik greedy-eval loglaması ekle (şu an döngü getiriyi atıyor).
- **1.4** SB3 (script 36) içine `EvalCallback`/custom callback ile training-curve loglaması ekle (config'de `training_curve` zaten tanımlı ama script üretmiyor → `sb3_training_curve.csv` eksik).
- **1.5** Çıktı sözleşmesi: tüm ham loglar uzun-format CSV (`seed, episode|timestep, metric, value`) — grafikler bundan doğrulanabilir (kabul şartı G10).

### FAZ 2 — Değerlendirme + seed × metrik özeti (P0) 🔴
- **2.1** `kod/evaluate.py`: kaydedilmiş politikaları **deterministic/greedy** ≥N episode değerlendirir, her seed için final metrikleri çıkarır.
- **2.2** `sonuclar/sonuclar.csv` üret: satır = (algoritma, seed), kolon = metrikler (mean_return, median_return, cull_rate, steps, vs.) + en altta seed-agregat (mean ± std).

### FAZ 3 — Standart 5 grafik (P0/P1) 🔴🟠
Yeni bir çizim modülü (`kod/plotting.py`) — her grafik: başlık, **birimli** eksen, lejant, **seed bilgisi (n=… )**, **mean ± std bandı**, **hareketli ortalama (pencere=…)**. PNG → `sunum/grafikler/`.

1. **Öğrenme eğrisi** — y: episode getirisi (USD/$), x: episode; ≥5 seed mean±std + MA. (G2, G7)
2. **Eval eğrisi** — deterministic greedy getirisi, eğitim boyunca. (G3)
3. **Loss eğrisi** (SB3 DQN) + paragraf; **VE/VEYA** tabular value/policy heatmap (risk_band × dim_band). (G4)
4. **Hiperparametre duyarlılığı** — Q-learning: `epsilon_start ∈ {0.1, 0.35, 0.6}` × `alpha ∈ {0.05, 0.18, 0.4}` (keşif-sömürü yorumu). (G5)
5. **Baseline karşılaştırma** — random_policy / risk_threshold / keep_all vs ajan, seed bandlı. (G6)

- **3.x** Her grafiğin **4 cümlelik yorumunu** (Gözlem→Karşılaştırma→Açıklama→Sonuç) hem rapora hem grafik altına yaz. (G8)

### FAZ 4 — Teslim paketi iskeleti (P0/P1) 🔴🟠
Mevcut repoyu bozmadan, teslim formatına **export** eden bir `kod/` ağacı:
```
kod/
├── env/                 # cow_replacement_gym_env + training_environment kopyası/paketi
├── train.py             # FAZ 1
├── evaluate.py          # FAZ 2
├── plotting.py          # FAZ 3
├── config.yaml          # rl_env_rules.yaml'ın teslim kopyası/sadeleştirmesi
├── requirements.txt     # == ile pinli (G12)
├── seeds.txt            # ≥5 seed
├── run_all.sh           # train → evaluate → plot zinciri
└── README.md            # nasıl çalıştırılır
```
- **4.1** `requirements.txt` tüm paketleri `==` ile pinle (kurulu sürümlerden `pip freeze`).
- **4.2** `run_all.sh`: `python train.py --all-seeds && python evaluate.py && python plotting.py`.
- **4.3** README: tek komutla üretim + notebook tetikleme talimatı.

### FAZ 5 — Rapor + savunma içeriği (P1) 🟠
- **5.1** Rapora **"Neden RL?"** bölümü: ardışıklık (keep → sonraki state), gecikmeli ödül (gelecekteki süt/risk), stokastiklik (empirik p(s'|s,a), kod: `cow_replacement_gym_env.py` `_sample_keep_next_state`), A*/DP neden yetmez (dinamik bilinmiyor + 162 state + stokastik). (G14)
- **5.2** **Ödül formülü** LaTeX bloğu + kod satır referansı (`scripts/rl_mdp_utils.py:64`). Rapordaki LaTeX ile kod birebir aynı olmalı. (G13)
- **5.3** Teslim-3 savunma cevap iskeleti (Bölüm 4'e göre), her biri **kendi kodumuzdan** satır referanslı. (G16)

### FAZ 6 — Notebook entegrasyonu (P0, sürekli) 🔴
Her faz çıktısı notebook'tan **tetiklenebilir** ve **görülebilir** olmalı (kullanıcının ana isteği):
- "Çok-seed eğit" hücresi → `train.py` tüm seedler.
- "Değerlendir + sonuclar.csv" hücresi.
- "5 standart grafik" hücresi → PNG'leri inline gösterir.
- "Teslim paketle (zip)" hücresi → arşivi kurar.
- Mevcut analiz figürleri (01–10) korunur ama **teslim grafikleri ayrı, standart** olur.

### FAZ 7 — Paketleme + doğrulama (P2) 🟡
- **7.1** `ogrno_AdSoyad.zip` yapısını kuran script (`.venv/`, `__pycache__/`, ara ağırlık HARİÇ).
- **7.2** Kabul-şartı checklist doğrulayıcı (ham log var mı, 5 PNG var mı, seeds≥5, req `==`, vs.).
- **7.3** Video script/checklist (ayrı `.mp4`).

---

## 3. Teslim-3 Savunma Cevapları — Projeye Özel İskelet

> Bunlar rapora girecek; her cevap **kendi kodumuzdan** satır referanslı olacak.

**Alan 1 — Deterministik mi, stokastik mi? → STOKASTİK.**
- `keep` aksiyonu: empirik geçiş dağılımından örnekleniyor; aynı (s,a) için birden çok s' ve olasılıkları `empirical_transition_model.csv`'de (ör. `early|...|10_20` → 3 farklı s', her biri p=0.333). Kod: `cow_replacement_gym_env.py::_sample_keep_next_state` (`self.rng.choice(..., p=probabilities)`).
- `cull` aksiyonu: deterministik terminal.
- Başlangıç state'i de örnekleniyor (`_sample_initial_state`). Aynı seed → aynı yörünge (RNG determinizmi) ama dinamik gerçek stokastik.

**Alan 2 — On-policy mi, off-policy mi?**
- **Q-learning: off-policy** — davranış ε-greedy, hedef `max_a Q` (greedy). Kod: `tabular/q_learning.py` (action = ε-greedy; target = `reward + gamma*max(Q[next])`).
- **PPO: on-policy** — kendi politikasının topladığı veriyle güncelliyor.
- **DQN: off-policy** — replay buffer (`buffer_size`), target network.
- Veriyi üreten politika vs iyileştirilen politika ayrımı kod satırıyla gösterilecek.

**Alan 3 — Markov özelliği?**
- State vektörü: laktasyon evresi, parite, DIM, süt seviyesi/trendi, sağlık riski, cull-risk bandı. Trend bileşenleri (milk_trend) geçmişi özetliyor → tek-adım Markov yaklaşımı savunulabilir; bucketing kaynaklı bilgi kaybı tartışılacak.

**Alan 4 — POMDP?**
- Gerçek durum = ineğin tam fizyolojisi; gözlem = bucketlanmış aylık snapshot. Aradaki boşluk (gizli hastalık başlangıcı, gebelik detayı) → kısmi gözlemlenebilirlik. Vanilla DQN'in sınırı + belief/feature-engineering çözümü tartışılacak.

---

## 4. Riskler / Dikkat Edilecekler

- **Veri bütünlüğü:** Çok-seed çeşitliliği SADECE stokastik ortam + keşif rastgeleliğinden gelmeli; veri uydurma yok. Empirik geçiş modeli ve ödül parametreleri sabit kalır.
- **"Anlık ödül" tuzağı:** Öğrenme eğrisi y-ekseni **episode getirisi** olacak, asla per-step ödül (isterlerde en pahalı hata olarak işaretli).
- **Tutarlılık:** Raporda anlatılan her deneyin logu `sonuclar/loglar/` altında bulunmalı (final tutarlılık kalemi).
- **Statik-grid değiliz:** Ortam stokastik empirik MDP → baseline grafiği "bonus" ama yine de ekliyoruz (güçlü kanıt).

---

## 5. Önerilen Başlangıç Sırası

1. FAZ 1 (çok-seed + ham log) — her şeyi açan temel.
2. FAZ 2 (evaluate + sonuclar.csv).
3. FAZ 3 (5 standart grafik + yorumlar).
4. FAZ 6 (notebook hücreleri) — paralel ilerler.
5. FAZ 4 (kod/ paketi) + FAZ 5 (rapor/savunma).
6. FAZ 7 (zip + doğrulama).
