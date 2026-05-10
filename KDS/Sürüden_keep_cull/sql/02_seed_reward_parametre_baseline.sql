/*
Baseline reward scenario seed.

No uncertain economic value is filled with a fabricated number.
Real values must be populated only after manual review of USDA/Iowa State
sources and documented unit conversion decisions.
*/

insert into suru_karar.feat_reward_parametre (
    senaryo_kodu,
    gecerlilik_baslangic,
    gecerlilik_bitis,
    sut_fiyati,
    replacement_maliyeti,
    cull_satis_degeri,
    gunluk_bakim_maliyeti,
    tedavi_maliyeti,
    basarisiz_tohumlama_maliyeti,
    dusuk_verim_cezasi,
    aciklama
)
select
    $$baseline_external_pending$$,
    date $$2026-01-01$$,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    $$Placeholder baseline. Values intentionally NULL until USDA NASS milk price, USDA AMS cull cow reports, USDA ERS milk cost of production, and Iowa State heifer raising cost sources are manually inspected and unit conversions are approved.$$ 
where not exists (
    select 1
    from suru_karar.feat_reward_parametre
    where senaryo_kodu = $$baseline_external_pending$$
      and gecerlilik_baslangic = date $$2026-01-01$$
);
