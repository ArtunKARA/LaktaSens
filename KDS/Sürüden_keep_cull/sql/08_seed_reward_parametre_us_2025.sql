/*
Seed reviewed reward parameters for a US 2025 prototype baseline.

Source-derived values:
- sut_fiyati: USDA NASS 2025 US TOTAL average milk price converted from USD/cwt to USD/kg.
- gunluk_bakim_maliyeti: USDA ERS 2025 U.S. total operating cost converted to USD/cow/day.

Synthetic assumptions are explicitly documented in aciklama and in
reports/reward_baseline_us_2025_review.md.
*/

begin;

drop table if exists pg_temp.stg_reward_parametre_us_2025;
create temp table stg_reward_parametre_us_2025 on commit drop as
select
    $$baseline_us_2025_mixed_source_v1$$::text as senaryo_kodu,
    date '2025-01-01' as gecerlilik_baslangic,
    date '2025-12-31' as gecerlilik_bitis,
    0.4668::numeric(12,4) as sut_fiyati,
    2500.00::numeric(12,2) as replacement_maliyeti,
    1200.00::numeric(12,2) as cull_satis_degeri,
    8.5337::numeric(12,4) as gunluk_bakim_maliyeti,
    150.00::numeric(12,2) as tedavi_maliyeti,
    35.00::numeric(12,2) as basarisiz_tohumlama_maliyeti,
    2.33::numeric(12,2) as dusuk_verim_cezasi,
    $$US 2025 prototype baseline. Source-derived: NASS 2025 US TOTAL monthly average 21.175 USD/cwt converted to 0.4668 USD/kg; ERS operating cost 13.75 USD/cwt with 226.53 cwt/cow/year converted to 8.5337 USD/cow/day. Synthetic assumptions: replacement_maliyeti=2500.00 USD/head, cull_satis_degeri=1200.00 USD/head, tedavi_maliyeti=150.00 USD/event, basarisiz_tohumlama_maliyeti=35.00 USD/service, dusuk_verim_cezasi=5.00 kg/day * milk price = 2.33 USD/day. Adjust before production use.$$::text as aciklama;

update suru_karar.feat_reward_parametre target
set
    gecerlilik_bitis = source.gecerlilik_bitis,
    sut_fiyati = source.sut_fiyati,
    replacement_maliyeti = source.replacement_maliyeti,
    cull_satis_degeri = source.cull_satis_degeri,
    gunluk_bakim_maliyeti = source.gunluk_bakim_maliyeti,
    tedavi_maliyeti = source.tedavi_maliyeti,
    basarisiz_tohumlama_maliyeti = source.basarisiz_tohumlama_maliyeti,
    dusuk_verim_cezasi = source.dusuk_verim_cezasi,
    aciklama = source.aciklama
from stg_reward_parametre_us_2025 source
where target.senaryo_kodu = source.senaryo_kodu
  and target.gecerlilik_baslangic = source.gecerlilik_baslangic;

insert into suru_karar.feat_reward_parametre (
    senaryo_kodu, gecerlilik_baslangic, gecerlilik_bitis, sut_fiyati,
    replacement_maliyeti, cull_satis_degeri, gunluk_bakim_maliyeti,
    tedavi_maliyeti, basarisiz_tohumlama_maliyeti, dusuk_verim_cezasi, aciklama
)
select
    senaryo_kodu, gecerlilik_baslangic, gecerlilik_bitis, sut_fiyati,
    replacement_maliyeti, cull_satis_degeri, gunluk_bakim_maliyeti,
    tedavi_maliyeti, basarisiz_tohumlama_maliyeti, dusuk_verim_cezasi, aciklama
from stg_reward_parametre_us_2025 source
where not exists (
    select 1
    from suru_karar.feat_reward_parametre target
    where target.senaryo_kodu = source.senaryo_kodu
      and target.gecerlilik_baslangic = source.gecerlilik_baslangic
);

drop table if exists pg_temp.stg_reward_parametre_legacy_alias;
create temp table stg_reward_parametre_legacy_alias on commit drop as
select
    $$baseline_external_pending$$::text as senaryo_kodu,
    date '2026-01-01' as gecerlilik_baslangic,
    null::date as gecerlilik_bitis,
    sut_fiyati, replacement_maliyeti, cull_satis_degeri, gunluk_bakim_maliyeti,
    tedavi_maliyeti, basarisiz_tohumlama_maliyeti, dusuk_verim_cezasi,
    $$Legacy placeholder alias populated from baseline_us_2025_mixed_source_v1 so prototype DB checks are not left with empty economic parameters. Use baseline_us_2025_mixed_source_v1 as the canonical scenario. US 2025 prototype baseline. Source-derived: NASS 2025 US TOTAL monthly average 21.175 USD/cwt converted to 0.4668 USD/kg; ERS operating cost 13.75 USD/cwt with 226.53 cwt/cow/year converted to 8.5337 USD/cow/day. Synthetic assumptions: replacement_maliyeti=2500.00 USD/head, cull_satis_degeri=1200.00 USD/head, tedavi_maliyeti=150.00 USD/event, basarisiz_tohumlama_maliyeti=35.00 USD/service, dusuk_verim_cezasi=5.00 kg/day * milk price = 2.33 USD/day. Adjust before production use.$$::text as aciklama
from stg_reward_parametre_us_2025;

update suru_karar.feat_reward_parametre target
set
    gecerlilik_bitis = source.gecerlilik_bitis,
    sut_fiyati = source.sut_fiyati,
    replacement_maliyeti = source.replacement_maliyeti,
    cull_satis_degeri = source.cull_satis_degeri,
    gunluk_bakim_maliyeti = source.gunluk_bakim_maliyeti,
    tedavi_maliyeti = source.tedavi_maliyeti,
    basarisiz_tohumlama_maliyeti = source.basarisiz_tohumlama_maliyeti,
    dusuk_verim_cezasi = source.dusuk_verim_cezasi,
    aciklama = source.aciklama
from stg_reward_parametre_legacy_alias source
where target.senaryo_kodu = source.senaryo_kodu
  and target.gecerlilik_baslangic = source.gecerlilik_baslangic;

insert into suru_karar.feat_reward_parametre (
    senaryo_kodu, gecerlilik_baslangic, gecerlilik_bitis, sut_fiyati,
    replacement_maliyeti, cull_satis_degeri, gunluk_bakim_maliyeti,
    tedavi_maliyeti, basarisiz_tohumlama_maliyeti, dusuk_verim_cezasi, aciklama
)
select
    senaryo_kodu, gecerlilik_baslangic, gecerlilik_bitis, sut_fiyati,
    replacement_maliyeti, cull_satis_degeri, gunluk_bakim_maliyeti,
    tedavi_maliyeti, basarisiz_tohumlama_maliyeti, dusuk_verim_cezasi, aciklama
from stg_reward_parametre_legacy_alias source
where not exists (
    select 1
    from suru_karar.feat_reward_parametre target
    where target.senaryo_kodu = source.senaryo_kodu
      and target.gecerlilik_baslangic = source.gecerlilik_baslangic
);

commit;
