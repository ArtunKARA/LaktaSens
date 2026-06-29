/*
===============================================================================
Smart Feed PostgreSQL full loader

Bu dosya ml_smart_feed semasini olusturur, meta seed verilerini basar ve
Proje A / Proje B dis veri yuklemelerini ve Proje A egitim datasetini
sirasiyla olusturur.

Kullanim:
  psql -U <user> -d <db_name> -f KDS/Smart_Feed/sql/00_postgresql_load_all.sql

Repo kokunden degil de baska bir klasorden calistiriyorsan:
  psql -U <user> -d <db_name> \
    -v repo_root='c:/Users/VICTUS/Desktop/Tubitak/LaktaSens' \
    -f c:/Users/VICTUS/Desktop/Tubitak/LaktaSens/KDS/Smart_Feed/sql/00_postgresql_load_all.sql

Notlar:
- Bu script psql metakomutlari kullanir: \ir, \cd, \copy.
- Veri dosyalari KDS/Smart_Feed/Data/external altindan okunur.
- Mevcut semayi silmez. Ayni veritabani uzerinde tekrar calistirirsan raw
  yukleme tablolarinda tekrar kayit olusabilir; temiz kurulum icin bos bir
  veritabani veya bos ml_smart_feed semasi kullan.
===============================================================================
*/

\set ON_ERROR_STOP on
\encoding UTF8

\if :{?repo_root}
\else
\set repo_root .
\endif

\echo === Smart Feed PostgreSQL yukleme basladi ===
\echo Repo root: :repo_root
\cd :repo_root

\echo [1/6] Sema ve tablolar olusturuluyor
\ir ml_smart_feed_create.sql

\echo [2/6] Meta veri kaynaklari seed ediliyor
\ir 01_seed_meta_veri_kaynagi.sql

\echo [3/6] Proje A dis veri yuklemesi yapiliyor
\ir 02_load_external_project_a.sql

\echo [4/6] Proje B dis veri yuklemesi yapiliyor
\ir 03_load_external_project_b.sql

\echo [5/6] Proje A MmCows proxy feature dataseti uretiliyor
\ir 04_generate_synthetic_project_a_features.sql

\echo [6/6] Proje A longitudinal sentetik egitim kohortu uretiliyor
\ir 06_generate_synthetic_project_a_longitudinal.sql

\echo === Smart Feed PostgreSQL yukleme tamamlandi ===
