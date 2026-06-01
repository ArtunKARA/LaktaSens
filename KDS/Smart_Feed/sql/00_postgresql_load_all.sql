/*
===============================================================================
Smart Feed PostgreSQL full loader

Bu dosya ml_smart_feed semasini olusturur, meta seed verilerini basar ve
Proje A / Proje B dis veri yuklemelerini sirasiyla calistirir.

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

\echo [1/4] Sema ve tablolar olusturuluyor
\ir ml_smart_feed_create.sql

\echo [2/4] Meta veri kaynaklari seed ediliyor
\ir 01_seed_meta_veri_kaynagi.sql

\echo [3/4] Proje A dis veri yuklemesi yapiliyor
\ir 02_load_external_project_a.sql

\echo [4/4] Proje B dis veri yuklemesi yapiliyor
\ir 03_load_external_project_b.sql

\echo === Smart Feed PostgreSQL yukleme tamamlandi ===
