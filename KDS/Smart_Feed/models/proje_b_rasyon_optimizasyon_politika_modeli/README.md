# Project B - Rasyon Optimizasyon ve Politika Modeli

Amac: `ml_smart_feed` semasindaki rasyon, state/action/reward tablolarindan
Project B icin reward, rasyon kalite sinifi ve politika baseline modellerini
egitmek.

## Icerik

- `project_b_training_notebook.ipynb`: veri import, parametre, egitim, metrik,
  grafik ve model kaydi akisi.
- `code/`: notebook tarafindan import edilen Python kodu.
- `artifacts/`: egitim sonucunda uretilen metrikler, tahminler ve opsiyonel
  model dosyalari.

## Desteklenen hedefler

- `reward`: regression.
- `total_score`: regression.
- `total_feed_cost`: regression.
- `good_ration`: binary classification; skor median ustu 1 kabul edilir.
- `reward_band`: multiclass classification; reward uc banda ayrilir.

## Not

Mevcut Project B tablolari sentetik/proxy rasyon ve reward kayitlari icerir.
Bu klasor optimizer ve RL/policy pipeline'ini elle test etmek icindir; gercek
aksiyon-outcome loglari geldikce ayni kodla yeniden egitim alinabilir.
