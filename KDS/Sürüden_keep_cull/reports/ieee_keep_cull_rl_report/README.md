# IEEE Keep/Cull RL Raporu

Bu klasör, LaTeX rapor dosyalarını ve ileride eklenecek şekil/tablo
parçalarını bir arada tutmak için oluşturuldu. Böylece ana `reports/` dizini
kalabalıklaşmadan IEEE raporu ayrı bir çalışma alanında yönetilir.

## Dosyalar

- `main.tex`: Türkçe IEEEtran conference rapor kaynağı.
- `figures/`: üretilecek şema ve grafikler için ayrılmış klasör.
- `tables/`: ileride ayrılacak büyük LaTeX tablo parçaları için ayrılmış klasör.
- `build/`: yerel LaTeX derleme çıktıları için ayrılmış klasör.

Üst dizindeki `../ieee_keep_cull_rl_report.tex` dosyası aynı Türkçe içeriğin
referans kopyası olarak tutulur.

## Derleme

`KDS/Sürüden_keep_cull` klasöründen:

```bash
pdflatex -interaction=nonstopmode -halt-on-error \
  -output-directory=reports/ieee_keep_cull_rl_report/build \
  reports/ieee_keep_cull_rl_report/main.tex
```

Referans ve tablo numaralarının tam oturması için komut gerekirse iki kez
çalıştırılır.

## Kalan TODO'lar

- Yazar adları ve kurum bilgisi.
- Teşekkür metni.
- Kamusal süt sığırcılığı veri setleri için kesin bibliyografik kaynaklar.
- Gymnasium kaynak formatının son gönderim öncesi doğrulanması.

