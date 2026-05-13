/*
Faz 3: suru_karar.feat_inek_aylik_snapshot üretimi

Notlar:
- DDL değiştirmez.
- Mevcut event_* tablolarından 1 inek x 1 ay sonu snapshot üretir.
- Feature hesapları yalnızca referans_tarih ve öncesindeki olayları kullanır.
- Kaynak bazlı replace yapmaz; unique (inek_id, referans_tarih) üzerinden upsert yapar.
*/

with all_events as (
    select inek_id, dogurma_tarihi as event_date
    from suru_karar.event_dogurma
    union all
    select inek_id, dollenme_tarihi
    from suru_karar.event_dollenme
    union all
    select inek_id, kuru_baslangic_tarihi
    from suru_karar.event_kuru
    union all
    select inek_id, sagim_tarihi
    from suru_karar.event_sut_olcum
    union all
    select inek_id, olay_tarihi
    from suru_karar.event_health
    union all
    select inek_id, cikarilma_tarihi
    from suru_karar.event_suruden_cikarma
    union all
    select inek_id, event_date
    from suru_karar.event_normalized
    where inek_id is not null
),
animal_bounds as (
    select
        e.inek_id,
        min(e.event_date) as first_event_date,
        max(e.event_date) as observation_end,
        min(c.cikarilma_tarihi) as first_cull_date
    from all_events e
    left join suru_karar.event_suruden_cikarma c
        on c.inek_id = e.inek_id
    group by e.inek_id
),
snapshot_dates as (
    select
        b.inek_id,
        b.first_event_date,
        b.observation_end,
        b.first_cull_date,
        month_end.referans_tarih
    from animal_bounds b
    cross join lateral (
        select (date_trunc('month', series_month)::date + interval '1 month - 1 day')::date as referans_tarih
        from generate_series(
            date_trunc('month', b.first_event_date)::date,
            date_trunc('month', least(b.observation_end, coalesce(b.first_cull_date, b.observation_end)))::date,
            interval '1 month'
        ) as gs(series_month)
    ) month_end
    where month_end.referans_tarih <= least(b.observation_end, coalesce(b.first_cull_date, b.observation_end))
),
features as (
    select
        s.inek_id,
        s.referans_tarih,
        last_calving.laktasyon_no,
        last_calving.parite,
        case
            when last_calving.dogurma_tarihi is not null
                then s.referans_tarih - last_calving.dogurma_tarihi
            else null
        end as dim,
        case
            when mi.dogum_tarihi is not null
                then s.referans_tarih - mi.dogum_tarihi
            else null
        end as yas_gun,
        pregnancy.gebe_mi,
        service_stats.servis_sayisi,
        case
            when service_stats.son_servis_tarihi is not null
                then s.referans_tarih - service_stats.son_servis_tarihi
            else null
        end as son_servis_gun,
        exists (
            select 1
            from suru_karar.event_normalized en
            where en.inek_id = s.inek_id
              and en.event_type = 'pregnancy_loss'
              and en.event_date between s.referans_tarih - interval '365 days' and s.referans_tarih
        ) as gebelik_kaybi_flag,
        health_stats.son30_saglik_olay_sayisi,
        health_stats.mastitis_flag,
        health_stats.lameness_flag,
        milk_stats.son30_ortalama_sut,
        case
            when milk_stats.recent_7_avg is not null and milk_stats.previous_7_avg is not null
                then milk_stats.recent_7_avg - milk_stats.previous_7_avg
            else null
        end as sut_trend_7g,
        case
            when s.first_cull_date > s.referans_tarih
             and s.first_cull_date <= s.referans_tarih + interval '30 days' then true
            when s.observation_end >= s.referans_tarih + interval '30 days' then false
            else null
        end as cull_30g,
        case
            when s.first_cull_date > s.referans_tarih
             and s.first_cull_date <= s.referans_tarih + interval '60 days' then true
            when s.observation_end >= s.referans_tarih + interval '60 days' then false
            else null
        end as cull_60g,
        case
            when s.first_cull_date > s.referans_tarih
             and s.first_cull_date <= s.referans_tarih + interval '90 days' then true
            when s.observation_end >= s.referans_tarih + interval '90 days' then false
            else null
        end as cull_90g
    from snapshot_dates s
    join suru_karar.master_inek mi
        on mi.inek_id = s.inek_id
    left join lateral (
        select d.dogurma_tarihi, d.laktasyon_no, d.parite
        from suru_karar.event_dogurma d
        where d.inek_id = s.inek_id
          and d.dogurma_tarihi <= s.referans_tarih
        order by d.dogurma_tarihi desc, d.dogurma_id desc
        limit 1
    ) last_calving on true
    left join lateral (
        select
            case
                when last_calving.dogurma_tarihi is null then null
                else count(*) filter (
                    where ed.dollenme_tarihi > last_calving.dogurma_tarihi
                      and ed.dollenme_tarihi <= s.referans_tarih
                )::integer
            end as servis_sayisi,
            max(ed.dollenme_tarihi) filter (
                where ed.dollenme_tarihi <= s.referans_tarih
            ) as son_servis_tarihi
        from suru_karar.event_dollenme ed
        where ed.inek_id = s.inek_id
    ) service_stats on true
    left join lateral (
        select
            case
                when latest_positive.event_date is null then null
                when exists (
                    select 1
                    from suru_karar.event_normalized blocker
                    where blocker.inek_id = s.inek_id
                      and blocker.event_type in ('pregnancy_loss', 'calving')
                      and blocker.event_date > latest_positive.event_date
                      and blocker.event_date <= s.referans_tarih
                ) then false
                else true
            end as gebe_mi
        from (
            select max(en.event_date) as event_date
            from suru_karar.event_normalized en
            where en.inek_id = s.inek_id
              and en.event_type = 'pregnancy_diagnosis_positive'
              and en.event_date <= s.referans_tarih
        ) latest_positive
    ) pregnancy on true
    left join lateral (
        select
            avg(m.sut_miktar_kg) filter (
                where m.sagim_tarihi between s.referans_tarih - interval '30 days' and s.referans_tarih
            ) as son30_ortalama_sut,
            avg(m.sut_miktar_kg) filter (
                where m.sagim_tarihi between s.referans_tarih - interval '7 days' and s.referans_tarih
            ) as recent_7_avg,
            avg(m.sut_miktar_kg) filter (
                where m.sagim_tarihi between s.referans_tarih - interval '14 days' and s.referans_tarih - interval '8 days'
            ) as previous_7_avg
        from suru_karar.event_sut_olcum m
        where m.inek_id = s.inek_id
    ) milk_stats on true
    left join lateral (
        select
            count(*)::integer as son30_saglik_olay_sayisi,
            bool_or(lower(coalesce(h.olay_tipi, '') || ' ' || coalesce(h.alt_tip, '') || ' ' || coalesce(h.aciklama, '')) like '%mastitis%') as mastitis_flag,
            bool_or(lower(coalesce(h.olay_tipi, '') || ' ' || coalesce(h.alt_tip, '') || ' ' || coalesce(h.aciklama, '')) like '%lameness%'
                 or lower(coalesce(h.olay_tipi, '') || ' ' || coalesce(h.alt_tip, '') || ' ' || coalesce(h.aciklama, '')) like '%renguera%') as lameness_flag
        from suru_karar.event_health h
        where h.inek_id = s.inek_id
          and h.olay_tarihi between s.referans_tarih - interval '30 days' and s.referans_tarih
    ) health_stats on true
)
insert into suru_karar.feat_inek_aylik_snapshot (
    inek_id,
    referans_tarih,
    laktasyon_no,
    parite,
    dim,
    yas_gun,
    gebe_mi,
    servis_sayisi,
    son_servis_gun,
    gebelik_kaybi_flag,
    son30_saglik_olay_sayisi,
    mastitis_flag,
    lameness_flag,
    son30_ortalama_sut,
    sut_trend_7g,
    cull_30g,
    cull_60g,
    cull_90g
)
select
    inek_id,
    referans_tarih,
    laktasyon_no,
    parite,
    dim,
    yas_gun,
    gebe_mi,
    servis_sayisi,
    son_servis_gun,
    gebelik_kaybi_flag,
    coalesce(son30_saglik_olay_sayisi, 0),
    coalesce(mastitis_flag, false),
    coalesce(lameness_flag, false),
    son30_ortalama_sut,
    sut_trend_7g,
    cull_30g,
    cull_60g,
    cull_90g
from features
on conflict (inek_id, referans_tarih) do update
set
    laktasyon_no = excluded.laktasyon_no,
    parite = excluded.parite,
    dim = excluded.dim,
    yas_gun = excluded.yas_gun,
    gebe_mi = excluded.gebe_mi,
    servis_sayisi = excluded.servis_sayisi,
    son_servis_gun = excluded.son_servis_gun,
    gebelik_kaybi_flag = excluded.gebelik_kaybi_flag,
    son30_saglik_olay_sayisi = excluded.son30_saglik_olay_sayisi,
    mastitis_flag = excluded.mastitis_flag,
    lameness_flag = excluded.lameness_flag,
    son30_ortalama_sut = excluded.son30_ortalama_sut,
    sut_trend_7g = excluded.sut_trend_7g,
    cull_30g = excluded.cull_30g,
    cull_60g = excluded.cull_60g,
    cull_90g = excluded.cull_90g;
