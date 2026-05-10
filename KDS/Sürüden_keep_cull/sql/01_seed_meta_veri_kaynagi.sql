/*
Idempotent seed for suru_karar.meta_veri_kaynagi.
Run after the suru_karar schema has been created.
*/

insert into suru_karar.meta_veri_kaynagi (
    kaynak_kod,
    kaynak_adi,
    kaynak_tip,
    aciklama,
    aktif
)
values
    ($$embryo_losses_mendeley$$, $$EmbryoLosses - Mendeley Data$$, $$mendeley_manual$$, $$role=ana_omurga_adayi; url=https://data.mendeley.com/datasets/5mk46rtr7j/1; license=CC BY 4.0; targets=raw_milk,raw_repro_loss,raw_health,raw_culling; events=event_dogurma,event_dollenme,event_sut_olcum,event_health,event_suruden_cikarma; TODO / manual inspection required for exact file schema.$$ , true),
    ($$primiparous_social_env$$, $$Productional data of primiparous dairy cows reared in different social environments$$, $$mendeley_manual$$, $$role=ana_omurga_etl_tasarim_adayi; url=https://data.mendeley.com/datasets/j42n4x723g/2; license=CC BY 4.0; targets=raw_milk,raw_repro_loss,raw_culling,raw_health; events=event_dogurma,event_dollenme,event_sut_olcum,event_suruden_cikarma,event_health; TODO / manual inspection required for exact file schema.$$ , true),
    ($$marcenat_inrae$$, $$Marcenat / INRAE productive-functional-longevity dataset$$, $$data_gouv_manual$$, $$role=culling_health_feeding_destek_verisi; url=https://entrepot.recherche.data.gouv.fr/dataset.xhtml?persistentId=doi:10.15454/MEN81R; license=Etalab Open License 2.0; targets=raw_milk,raw_repro_loss,raw_health,raw_culling; events=event_dogurma,event_dollenme,event_sut_olcum,event_health,event_suruden_cikarma; TODO / manual inspection required for exact file schema.$$ , true),
    ($$scc_grazing_cows$$, $$Associations of somatic cell count with milk yield and reproductive performance in grazing dairy cows$$, $$mendeley_manual$$, $$role=yardimci_sut_ureme_saglik_verisi; url=https://data.mendeley.com/datasets/d8kgk57b9h/3; license=CC BY 4.0 / restricted-access note; targets=raw_milk,raw_repro_loss,raw_health; events=event_sut_olcum,event_dollenme,event_dogurma,event_health; TODO / manual inspection required and access may be restricted.$$ , true),
    ($$chiozza_lameness$$, $$Chiozza-LogronoJ Lameness Grazing Dairy Cows$$, $$mendeley_manual$$, $$role=yardimci_saglik_verisi; url=https://data.mendeley.com/datasets/thb3rmxxr6/1; license=CC BY 4.0; targets=raw_health,raw_milk,raw_repro_loss; events=event_health,event_sut_olcum,event_dollenme,event_dogurma; TODO / manual inspection required for exact file schema.$$ , true),
    ($$organic_scm$$, $$Subclinical mastitis in certified organic herds supplemental dataset$$, $$mendeley_manual$$, $$role=yardimci_saglik_mastitis_scc_verisi; url=https://data.mendeley.com/datasets/rx9hfpzg6m/1; license=CC BY 4.0; targets=raw_health,raw_milk,raw_culling,raw_repro_loss; events=event_health,event_sut_olcum,event_suruden_cikarma,event_dollenme; TODO / manual inspection required for exact file schema.$$ , true),
    ($$calving_afc_culling$$, $$Calving difficulty / AFC / culling dataset$$, $$mendeley_manual$$, $$role=yardimci_ureme_culling_risk_verisi; url=https://data.mendeley.com/datasets/4k96p8z3d3/1; license=CC BY 4.0; targets=raw_repro_loss,raw_milk,raw_culling,raw_health; events=event_dogurma,event_suruden_cikarma,event_sut_olcum,event_health; TODO / manual inspection required for exact file schema.$$ , true),
    ($$usda_nass_milk_price$$, $$USDA NASS milk price$$, $$api_manual$$, $$role=ekonomik_reward_parametre; url=https://quickstats.nass.usda.gov/api; license=Official public USDA data; target=feat_reward_parametre; API key and exact query parameters required before automated extraction.$$ , true),
    ($$usda_ams_cull_cow$$, $$USDA AMS cull cow reports$$, $$pdf$$, $$role=ekonomik_reward_parametre; url=https://www.ams.usda.gov/mnreports/ams_2467.pdf; license=Official public USDA market report; target=feat_reward_parametre; direct PDF downloadable, parser required.$$ , true),
    ($$usda_ers_milk_cost$$, $$USDA ERS milk cost of production$$, $$ers_manual$$, $$role=ekonomik_reward_parametre; url=https://www.ers.usda.gov/data-products/milk-cost-of-production-estimates/; license=Official public USDA ERS data; target=feat_reward_parametre; manual CSV/XLSX URL confirmation required.$$ , true),
    ($$iowa_state_heifer_cost$$, $$Iowa State heifer raising costs$$, $$pdf$$, $$role=ekonomik_reward_parametre; url=https://www.extension.iastate.edu/dairyteam/files/documents/What%27s%20It%20Cost%20to%20Raise%20Heifers%202024_0.pdf; license=Iowa State University Extension publication; target=feat_reward_parametre; direct PDF downloadable, manual value review required.$$ , true)
on conflict (kaynak_kod) do update
set
    kaynak_adi = excluded.kaynak_adi,
    kaynak_tip = excluded.kaynak_tip,
    aciklama = excluded.aciklama,
    aktif = excluded.aktif;
