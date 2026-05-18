/*
Idempotent seed for ml_smart_feed.meta_veri_kaynagi.
Run after KDS/Smart_Feed/sql/ml_smart_feed_create.sql has created the schema.
*/

insert into ml_smart_feed.meta_veri_kaynagi (
    kaynak_kod,
    kaynak_adi,
    kaynak_tip,
    dosya_adi,
    aciklama,
    aktif
)
values
    (
        $$mmcows_multimodal$$,
        $$MmCows: A Multimodal Dataset for Dairy Cattle Monitoring$$,
        $$manual_large_dataset$$,
        null,
        $$role=ana_omurga_cow_day_multimodal; urls=https://github.com/neis-lab/mmcows | https://huggingface.co/datasets/neis-lab/mmcows | https://www.kaggle.com/datasets/hienvuvg/mmcows; targets=raw_cow,raw_milk,raw_sensor,raw_environment,raw_health; large files, manual download required.$$,
        true
    ),
    (
        $$transition_cow_part2$$,
        $$Transition cow nutrition and management strategies of dairy herds in the northeastern United States: Part II$$,
        $$mendeley_manual$$,
        null,
        $$role=ana_omurga_saglik_metabolik_label; url=https://data.mendeley.com/datasets/n9r22yzj5d/2; doi=https://doi.org/10.17632/n9r22yzj5d.2; targets=raw_cow,raw_lactation,raw_health,raw_milk; license=CC BY 4.0; manual schema inspection required.$$,
        true
    ),
    (
        $$czech_production_repro$$,
        $$Association between production and reproduction parameters based on parity and breed of dairy cows in the Czech Republic$$,
        $$mendeley_manual$$,
        null,
        $$role=yardimci_laktasyon_ureme_sut_verisi; url=https://data.mendeley.com/datasets/6vy2tvv7jn/1; doi=https://doi.org/10.17632/6vy2tvv7jn.1; targets=raw_cow,raw_lactation,raw_milk; manual schema inspection required.$$,
        true
    ),
    (
        $$plos_rumiwatch_calving$$,
        $$Assessment of feeding, ruminating and locomotion behaviors in dairy cows around calving$$,
        $$supplementary_files$$,
        $$s1_raw_data.xlsx; s1_ration_table.docx; s2_activity_definitions.docx; s3_diagnosis_criteria.docx$$,
        $$role=yardimci_saglik_davranis_risk_verisi; url=https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0264834; targets=raw_sensor,raw_health,raw_feed; local files downloaded; observed S1 raw data is group-level summary, not individual cow-day.$$,
        true
    ),
    (
        $$agroscope_activity_zenodo$$,
        $$Time Series of Dairy Cow Activity and Barn Area Use$$,
        $$zenodo_csv$$,
        $$data_documentation.md; activity_all_cows_sample_probe.csv$$,
        $$role=yardimci_sensor_davranis_verisi; url=https://zenodo.org/records/15005885; targets=raw_sensor; license=CC BY 4.0; documentation and probe downloaded, full CSV files planned.$$,
        true
    ),
    (
        $$ns_dairy_cattle$$,
        $$The Nutrition System for Dairy Cattle (NS Dairy Cattle)$$,
        $$mendeley_workbook_manual$$,
        null,
        $$role=besin_ihtiyac_kisit_parametre; url=https://data.mendeley.com/datasets/hvc7smjjb7/4; doi=https://doi.org/10.17632/hvc7smjjb7.4; targets=raw_feed,raw_feed_ingredient,opt_ration_constraint; license=MIT; manual workbook inspection required.$$,
        true
    ),
    (
        $$nasem_2021_ncbi$$,
        $$NASEM 2021 Nutrient Requirements of Dairy Cattle + NCBI feed composition chapter$$,
        $$reference_html_pdf$$,
        null,
        $$role=besin_degeri_referans_parametre; urls=https://nap.nationalacademies.org/catalog/25806/nutrient-requirements-of-dairy-cattle-eighth-revised-edition | https://www.ncbi.nlm.nih.gov/books/NBK600601/; targets=raw_feed_ingredient,opt_feed_nutrient_value,opt_ration_constraint; parser required.$$,
        true
    ),
    (
        $$feedipedia$$,
        $$Feedipedia feed databases$$,
        $$reference_html_manual$$,
        null,
        $$role=besin_degeri_yardimci_parametre; urls=https://feedipedia.org/ | https://www.feedipedia.org/content/feed-databases; targets=raw_feed_ingredient,opt_feed_nutrient_value; per-database license review required.$$,
        true
    ),
    (
        $$nasa_power_environment$$,
        $$NASA POWER Daily API$$,
        $$api_csv_json$$,
        null,
        $$role=cevre_parametre_verisi; url=https://power.larc.nasa.gov/docs/services/api/temporal/daily/; targets=raw_environment,norm_environment_daily; requires farm latitude/longitude and date range.$$,
        true
    ),
    (
        $$usda_ams_dairy$$,
        $$USDA AMS Dairy Market News$$,
        $$api_or_pdf$$,
        null,
        $$role=ekonomik_reward_parametre; urls=https://www.ams.usda.gov/market-news/dairy | https://mymarketnews.ams.usda.gov/mymarketnews-api/faqs; targets=raw_economic_parameter,opt_feed_price,opt_milk_price,sim_reward_parameter; API preferred, PDF parser fallback.$$,
        true
    ),
    (
        $$eu_agri_food_milk$$,
        $$European Commission Agri-food Data Portal - Milk and dairy products$$,
        $$api_json_excel$$,
        null,
        $$role=ekonomik_reward_parametre; urls=https://agridata.ec.europa.eu/extensions/DataPortal/milk.html | https://agridata.ec.europa.eu/extensions/API_Documentation/milk.html; targets=raw_economic_parameter,opt_milk_price,sim_reward_parameter.$$,
        true
    ),
    (
        $$ulusal_sut_konseyi$$,
        $$Ulusal Süt Konseyi çiğ süt tavsiye fiyatları$$,
        $$html_parser$$,
        null,
        $$role=ekonomik_reward_parametre_tr; url=https://ulusalsutkonseyi.org.tr/yillara-gore-cig-sut-fiyatlari-2194/; targets=raw_economic_parameter,opt_milk_price,sim_reward_parameter; date ranges must be expanded to effective periods.$$,
        true
    ),
    (
        $$turib_feed_commodities$$,
        $$TÜRİB ELÜS hububat fiyatları$$,
        $$html_parser$$,
        null,
        $$role=ekonomik_yem_fiyat_parametre_tr; urls=https://www.turib.com.tr/ | https://www.turib.com.tr/arpa-fiyatlari/; targets=raw_economic_parameter,opt_feed_price,sim_reward_parameter; market snapshots must keep capture timestamp.$$,
        true
    )
on conflict (kaynak_kod) do update
set
    kaynak_adi = excluded.kaynak_adi,
    kaynak_tip = excluded.kaynak_tip,
    dosya_adi = excluded.dosya_adi,
    aciklama = excluded.aciklama,
    aktif = excluded.aktif;
