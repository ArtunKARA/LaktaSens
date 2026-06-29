/*
===============================================================================
Smart Feed Project A longitudinal synthetic training cohort

Purpose:
- Expand the short 16-cow / 15-day MmCows POC backbone with a separate,
  explicitly synthetic longitudinal cohort.
- Generate correlated but non-identical milk, feeding, sensor, environment,
  and health-risk trajectories.
- Populate the current normalized data model before building Project A
  feature, label, model-input, and prediction tables.
- Keep synthetic rows identifiable through data_origin / label_origin.

Default size:
- 120 cows x 180 days = 21,600 cow-day rows.

Run after:
  04_generate_synthetic_project_a_features.sql
===============================================================================
*/

\set ON_ERROR_STOP on
\encoding UTF8

begin;

insert into ml_smart_feed.meta_veri_kaynagi (
    kaynak_kod,
    kaynak_adi,
    kaynak_tip,
    dosya_adi,
    aciklama,
    aktif
)
values (
    'synthetic_project_a_longitudinal_v1',
    'Project A longitudinal synthetic training cohort v1',
    'synthetic_longitudinal_sql',
    'KDS/Smart_Feed/sql/06_generate_synthetic_project_a_longitudinal.sql',
    'Synthetic 120-cow, 180-day longitudinal cohort. POC/training only; not observed farm data.',
    true
)
on conflict (kaynak_kod) do update
set
    kaynak_adi = excluded.kaynak_adi,
    kaynak_tip = excluded.kaynak_tip,
    dosya_adi = excluded.dosya_adi,
    aciklama = excluded.aciklama,
    aktif = true;

insert into ml_smart_feed.meta_experiment_run (
    run_kodu,
    run_tipi,
    proje_kodu,
    model_adi,
    aciklama,
    parametre_json,
    bitis_zamani,
    durum
)
values (
    'smart_feed_synthetic_project_a_longitudinal_v1',
    'baseline',
    'A',
    'longitudinal_synthetic_generator_v2_normalized',
    'Normalized synthetic longitudinal cohort for Project A model development.',
    jsonb_build_object(
        'is_synthetic', true,
        'generator_version', 'synthetic_project_a_longitudinal_v2_normalized',
        'data_origin', 'synthetic_longitudinal_v1',
        'pipeline', jsonb_build_array(
            'norm_cow_profile',
            'norm_environment_daily',
            'norm_lactation_daily',
            'norm_milk_daily',
            'norm_feeding_daily',
            'norm_sensor_daily',
            'norm_health_event',
            'feat_cow_day_snapshot',
            'feat_milk_trend',
            'feat_health_risk_label',
            'feat_feeding_need_label',
            'feat_model_input_a',
            'feat_prediction_a'
        ),
        'cow_count', 120,
        'days_per_cow', 180,
        'row_count', 21600
    ),
    now(),
    'completed'
)
on conflict (run_kodu) do update
set
    aciklama = excluded.aciklama,
    parametre_json = excluded.parametre_json,
    bitis_zamani = now(),
    durum = 'completed';

-- ---------------------------------------------------------------------------
-- Clean previously generated longitudinal cohort rows (idempotent re-run).
-- ---------------------------------------------------------------------------

delete from ml_smart_feed.feat_model_input_a
where run_id = (
    select run_id
    from ml_smart_feed.meta_experiment_run
    where run_kodu = 'smart_feed_synthetic_project_a_longitudinal_v1'
);

delete from ml_smart_feed.feat_prediction_a
where run_id = (
    select run_id
    from ml_smart_feed.meta_experiment_run
    where run_kodu = 'smart_feed_synthetic_project_a_longitudinal_v1'
);

delete from ml_smart_feed.norm_environment_daily
where kaynak_id = (
    select kaynak_id
    from ml_smart_feed.meta_veri_kaynagi
    where kaynak_kod = 'synthetic_project_a_longitudinal_v1'
);

delete from ml_smart_feed.map_external_cow
where kaynak_id = (
    select kaynak_id
    from ml_smart_feed.meta_veri_kaynagi
    where kaynak_kod = 'synthetic_project_a_longitudinal_v1'
);

delete from ml_smart_feed.norm_cow_profile
where external_cow_id like 'SYN_A_%';

insert into ml_smart_feed.norm_cow_profile (
    external_cow_id,
    cow_code,
    breed,
    birth_date,
    parity,
    body_weight_kg,
    bcs,
    pregnancy_status,
    status,
    kaynak_id
)
select
    format('SYN_A_%s', lpad(cow_no::text, 3, '0')),
    format('SYN_A_%s', lpad(cow_no::text, 3, '0')),
    case cow_no % 5 when 0 then 'Jersey' else 'Holstein' end,
    date '2017-01-01' + (((cow_no * 73) % 1460)::integer),
    1 + (cow_no % 4),
    545.0 + (cow_no % 4) * 42.0 + (cow_no % 11) * 3.5,
    2.80 + (cow_no % 8) * 0.08,
    case when cow_no % 4 = 0 then 'pregnant' else 'open' end,
    'active',
    k.kaynak_id
from generate_series(1, 120) cow_no
cross join ml_smart_feed.meta_veri_kaynagi k
where k.kaynak_kod = 'synthetic_project_a_longitudinal_v1';

insert into ml_smart_feed.map_external_cow (
    kaynak_id,
    external_cow_id,
    cow_id,
    guven_skoru,
    notlar
)
select
    k.kaynak_id,
    c.external_cow_id,
    c.cow_id,
    1.0,
    'Deterministic mapping for synthetic_project_a_longitudinal_v2_normalized'
from ml_smart_feed.norm_cow_profile c
join ml_smart_feed.meta_veri_kaynagi k
    on k.kaynak_id = c.kaynak_id
where k.kaynak_kod = 'synthetic_project_a_longitudinal_v1'
on conflict (kaynak_id, external_cow_id) do update
set
    cow_id = excluded.cow_id,
    guven_skoru = excluded.guven_skoru,
    notlar = excluded.notlar;

create function pg_temp.rand01(value text, seed bigint)
returns double precision
language sql
immutable
as $$
    select mod(abs(hashtextextended(value, seed)), 1000000)::double precision / 1000000.0
$$;

create temporary table tmp_project_a_longitudinal as
with grid as (
    select cow_no, dim
    from generate_series(1, 120) cow_no
    cross join generate_series(1, 180) dim
),
base as (
    select
        g.*,
        date '2024-01-01' + ((((g.cow_no - 1) % 12) * 3 + g.dim - 1)::integer) as record_date,
        1 + (g.cow_no % 4) as parity,
        545.0 + (g.cow_no % 4) * 42.0 + (g.cow_no % 11) * 3.5 as body_weight_kg,
        2.80 + (g.cow_no % 8) * 0.08 as base_bcs,
        pg_temp.rand01(g.cow_no::text, 11) as predisposition,
        pg_temp.rand01(concat(g.cow_no, ':', g.dim), 13) - 0.5 as daily_noise,
        pg_temp.rand01(concat(g.cow_no, ':', g.dim / 14), 17) as episode_noise,
        pg_temp.rand01(concat(g.cow_no, ':', g.dim), 19) as ketosis_noise,
        pg_temp.rand01(concat(g.cow_no, ':', g.dim), 23) as mastitis_noise,
        pg_temp.rand01(concat(g.cow_no, ':', g.dim), 29) as asidosis_noise,
        pg_temp.rand01(concat(g.cow_no, ':', g.dim), 37) as risk_label_noise,
        62.0
            + 12.0 * sin(2.0 * pi() * (g.dim + (g.cow_no % 30)) / 180.0)
            + (pg_temp.rand01(concat(g.cow_no, ':', g.dim), 31) - 0.5) * 5.0 as thi
    from grid g
),
latent as (
    select
        b.*,
        least(
            1.0,
            greatest(
                0.0,
                0.08
                + b.predisposition * 0.24
                + case when b.dim <= 35 then (36 - b.dim) / 35.0 * 0.26 else 0 end
                + greatest(b.thi - 72.0, 0) / 22.0
                + case
                    when b.episode_noise < 0.07 then 0.48
                    when b.episode_noise < 0.16 then 0.24
                    else 0
                  end
                + b.daily_noise * 0.16
            )
        ) as latent_risk
    from base b
),
production as (
    select
        l.*,
        greatest(
            12.0,
            24.0
            + (15.0 + l.parity * 1.8) * (1.0 - exp(-l.dim / 24.0)) * exp(-l.dim / 420.0)
            - l.latent_risk * 5.0
            + l.daily_noise * 4.0
        ) as daily_milk_yield_kg
    from latent l
),
features as (
    select
        p.*,
        greatest(2.15, least(4.20, p.base_bcs - p.latent_risk * 0.42 + p.daily_noise * 0.10)) as bcs,
        greatest(3.20, least(5.60, 4.15 - p.daily_milk_yield_kg * 0.008 + p.latent_risk * 0.24 + p.daily_noise * 0.16)) as milk_fat_percent,
        greatest(2.65, least(4.10, 3.45 - p.daily_milk_yield_kg * 0.004 - p.latent_risk * 0.10 + p.daily_noise * 0.10)) as milk_protein_percent,
        greatest(40000.0, 65000.0 + power(p.latent_risk, 2) * 480000.0 + (p.daily_noise + 0.5) * 45000.0) as scc,
        greatest(11.0, 13.5 + p.daily_milk_yield_kg * 0.23 + sqrt(p.dim) * 0.08 - p.latent_risk * 1.6 + p.daily_noise) as estimated_dmi_kg
    from production p
)
select
    f.*,
    least(1.0, greatest(0.0, f.latent_risk + (f.risk_label_noise - 0.5) * 0.42)) as label_risk,
    f.milk_fat_percent / nullif(f.milk_protein_percent, 0) as fat_protein_ratio,
    4.45 + f.latent_risk * 0.95 + f.daily_noise * 0.16 as milk_electrical_conductivity,
    47.0 + (f.cow_no % 4) * 4.0 as forage_concentrate_ratio,
    greatest(280.0, 530.0 - f.latent_risk * 150.0 - greatest(f.thi - 72.0, 0) * 3.2 + f.daily_noise * 45.0) as rumination_minutes,
    greatest(10.0, 62.0 - f.latent_risk * 23.0 + f.daily_noise * 18.0) as activity_level,
    greatest(420.0, least(1050.0, 690.0 + f.latent_risk * 125.0 + f.daily_noise * 90.0)) as lying_time_minutes,
    38.45 + f.latent_risk * 0.62 + greatest(f.thi - 75.0, 0) * 0.018 + f.daily_noise * 0.10 as body_temperature,
    greatest(45.0, 44.0 + f.daily_milk_yield_kg * 1.35 + greatest(f.thi - 68.0, 0) * 1.05 + f.daily_noise * 5.0) as water_intake_liter,
    greatest(350.0, 2300.0 - f.latent_risk * 900.0 + f.daily_noise * 620.0) as movement_distance_m,
    9.81 + f.daily_noise * 0.20 as accel_magnitude_mean,
    greatest(0.20, 0.72 - f.latent_risk * 0.30 + f.daily_noise * 0.15) as accel_magnitude_std,
    97900.0 + sin(f.dim / 12.0) * 160.0 + f.daily_noise * 80.0 as pressure_mean_pa,
    75.0 + f.latent_risk * 55.0 + (f.daily_noise + 0.5) * 25.0 as pressure_std_pa,
    289.0 + f.daily_noise * 3.0 as elevation_mean_m,
    7.0 + f.latent_risk * 4.0 + (f.daily_noise + 0.5) as elevation_std_m
from features f;

-- ---------------------------------------------------------------------------
-- Populate the normalized layer first. Feature tables are built from these
-- normalized records so the synthetic cohort follows the current data model.
-- ---------------------------------------------------------------------------

insert into ml_smart_feed.norm_environment_daily (
    record_date,
    external_farm_id,
    barn_id,
    avg_temperature_c,
    max_temperature_c,
    avg_humidity_percent,
    avg_thi,
    max_thi,
    kaynak_id
)
select
    t.record_date,
    'synthetic_project_a_farm',
    'synthetic_longitudinal_barn',
    18.0 + (avg(t.thi) - 62.0) * 0.55,
    21.0 + (max(t.thi) - 62.0) * 0.55,
    60.0 + 8.0 * sin(extract(doy from t.record_date) / 18.0),
    avg(t.thi),
    max(t.thi),
    k.kaynak_id
from tmp_project_a_longitudinal t
cross join ml_smart_feed.meta_veri_kaynagi k
where k.kaynak_kod = 'synthetic_project_a_longitudinal_v1'
group by t.record_date, k.kaynak_id
on conflict do nothing;

insert into ml_smart_feed.norm_lactation_daily (
    cow_id,
    record_date,
    calving_date,
    expected_calving_date,
    lactation_no,
    parity,
    dim,
    pregnancy_status,
    lactation_stage,
    kaynak_id,
    source_table
)
select
    c.cow_id,
    t.record_date,
    t.record_date - t.dim,
    case when t.cow_no % 4 = 0 then t.record_date - t.dim + 400 else null end,
    t.parity,
    t.parity,
    t.dim,
    case when t.cow_no % 4 = 0 then 'pregnant' else 'open' end,
    case when t.dim <= 21 then 'transition' when t.dim <= 100 then 'early' else 'mid' end,
    k.kaynak_id,
    'synthetic_project_a_longitudinal_v2_normalized'
from tmp_project_a_longitudinal t
join ml_smart_feed.norm_cow_profile c
    on c.external_cow_id = format('SYN_A_%s', lpad(t.cow_no::text, 3, '0'))
cross join ml_smart_feed.meta_veri_kaynagi k
where k.kaynak_kod = 'synthetic_project_a_longitudinal_v1';

insert into ml_smart_feed.norm_milk_daily (
    cow_id,
    record_date,
    daily_milk_yield_kg,
    milk_fat_percent,
    milk_protein_percent,
    fat_protein_ratio,
    lactose_percent,
    scc,
    milk_electrical_conductivity,
    milk_temperature,
    kaynak_id,
    source_table
)
select
    c.cow_id,
    t.record_date,
    t.daily_milk_yield_kg,
    t.milk_fat_percent,
    t.milk_protein_percent,
    t.fat_protein_ratio,
    greatest(4.35, least(4.95, 4.72 - t.latent_risk * 0.12 + t.daily_noise * 0.08)),
    t.scc,
    t.milk_electrical_conductivity,
    greatest(36.5, least(39.5, t.body_temperature - 0.45 + t.daily_noise * 0.08)),
    k.kaynak_id,
    'synthetic_project_a_longitudinal_v2_normalized'
from tmp_project_a_longitudinal t
join ml_smart_feed.norm_cow_profile c
    on c.external_cow_id = format('SYN_A_%s', lpad(t.cow_no::text, 3, '0'))
cross join ml_smart_feed.meta_veri_kaynagi k
where k.kaynak_kod = 'synthetic_project_a_longitudinal_v1';

insert into ml_smart_feed.norm_feeding_daily (
    cow_id,
    group_id,
    record_date,
    ration_name,
    ration_type,
    feed_amount_asfed_kg,
    dry_matter_percent,
    estimated_dmi_kg,
    forage_concentrate_ratio,
    feed_change_last7d,
    refusal_amount_kg,
    kaynak_id,
    source_table
)
select
    c.cow_id,
    case when t.dim <= 100 then 'synthetic_high_group' else 'synthetic_mid_group' end,
    t.record_date,
    case when t.dim <= 21 then 'synthetic_transition_tmr'
         when t.dim <= 100 then 'synthetic_high_energy_tmr'
         else 'synthetic_balanced_tmr'
    end,
    'TMR',
    t.estimated_dmi_kg / ((48.0 + (t.cow_no % 5) * 0.8) / 100.0),
    48.0 + (t.cow_no % 5) * 0.8,
    t.estimated_dmi_kg,
    t.forage_concentrate_ratio,
    (t.dim % 45 = 0),
    greatest(0.0, t.estimated_dmi_kg * (0.015 + t.latent_risk * 0.035)),
    k.kaynak_id,
    'synthetic_project_a_longitudinal_v2_normalized'
from tmp_project_a_longitudinal t
join ml_smart_feed.norm_cow_profile c
    on c.external_cow_id = format('SYN_A_%s', lpad(t.cow_no::text, 3, '0'))
cross join ml_smart_feed.meta_veri_kaynagi k
where k.kaynak_kod = 'synthetic_project_a_longitudinal_v1';

insert into ml_smart_feed.norm_sensor_daily (
    cow_id,
    record_date,
    rumination_minutes,
    activity_level,
    lying_time_minutes,
    body_temperature,
    water_intake_liter,
    movement_distance_m,
    accel_magnitude_mean,
    accel_magnitude_std,
    pressure_mean_pa,
    pressure_std_pa,
    elevation_mean_m,
    elevation_std_m,
    kaynak_id
)
select
    c.cow_id,
    t.record_date,
    t.rumination_minutes,
    t.activity_level,
    t.lying_time_minutes,
    t.body_temperature,
    t.water_intake_liter,
    t.movement_distance_m,
    t.accel_magnitude_mean,
    t.accel_magnitude_std,
    t.pressure_mean_pa,
    t.pressure_std_pa,
    t.elevation_mean_m,
    t.elevation_std_m,
    k.kaynak_id
from tmp_project_a_longitudinal t
join ml_smart_feed.norm_cow_profile c
    on c.external_cow_id = format('SYN_A_%s', lpad(t.cow_no::text, 3, '0'))
cross join ml_smart_feed.meta_veri_kaynagi k
where k.kaynak_kod = 'synthetic_project_a_longitudinal_v1';

insert into ml_smart_feed.norm_health_event (
    cow_id,
    event_date,
    event_type,
    sub_type,
    severity,
    treatment_given,
    description,
    kaynak_id,
    source_table
)
select
    c.cow_id,
    t.record_date,
    event.event_type,
    'synthetic_latent_episode',
    case when t.latent_risk >= 0.80 then 3 when t.latent_risk >= 0.68 then 2 else 1 end,
    t.latent_risk >= 0.72,
    'Synthetic future-event target source; not an observed clinical diagnosis.',
    k.kaynak_id,
    'synthetic_project_a_longitudinal_v2_normalized'
from tmp_project_a_longitudinal t
join ml_smart_feed.norm_cow_profile c
    on c.external_cow_id = format('SYN_A_%s', lpad(t.cow_no::text, 3, '0'))
cross join ml_smart_feed.meta_veri_kaynagi k
cross join lateral (
    values
        ('ketosis', t.latent_risk > 0.64 and t.ketosis_noise < 0.16),
        ('mastitis', t.latent_risk > 0.68 and t.mastitis_noise < 0.10),
        ('asidosis', t.latent_risk > 0.66 and t.asidosis_noise < 0.10),
        ('metritis', t.dim <= 28 and t.latent_risk > 0.70 and t.mastitis_noise < 0.07)
) as event(event_type, is_event)
where k.kaynak_kod = 'synthetic_project_a_longitudinal_v1'
  and event.is_event;

-- ---------------------------------------------------------------------------
-- Build the current Project A feature layer from the normalized layer.
-- ---------------------------------------------------------------------------

insert into ml_smart_feed.feat_cow_day_snapshot (
    cow_id,
    record_date,
    parity,
    body_weight_kg,
    bcs,
    dim,
    pregnancy_status,
    lactation_stage,
    daily_milk_yield_kg,
    milk_fat_percent,
    milk_protein_percent,
    fat_protein_ratio,
    scc,
    milk_electrical_conductivity,
    ration_type,
    dry_matter_percent,
    estimated_dmi_kg,
    forage_concentrate_ratio,
    feed_change_last7d,
    rumination_minutes,
    activity_level,
    lying_time_minutes,
    body_temperature,
    water_intake_liter,
    movement_distance_m,
    accel_magnitude_mean,
    accel_magnitude_std,
    pressure_mean_pa,
    pressure_std_pa,
    elevation_mean_m,
    elevation_std_m,
    thi,
    data_origin,
    is_synthetic
)
select
    c.cow_id,
    m.record_date,
    l.parity,
    c.body_weight_kg,
    t.bcs,
    l.dim,
    l.pregnancy_status,
    l.lactation_stage,
    m.daily_milk_yield_kg,
    m.milk_fat_percent,
    m.milk_protein_percent,
    m.fat_protein_ratio,
    m.scc,
    m.milk_electrical_conductivity,
    f.ration_type,
    f.dry_matter_percent,
    f.estimated_dmi_kg,
    f.forage_concentrate_ratio,
    f.feed_change_last7d,
    s.rumination_minutes,
    s.activity_level,
    s.lying_time_minutes,
    s.body_temperature,
    s.water_intake_liter,
    s.movement_distance_m,
    s.accel_magnitude_mean,
    s.accel_magnitude_std,
    s.pressure_mean_pa,
    s.pressure_std_pa,
    s.elevation_mean_m,
    s.elevation_std_m,
    e.avg_thi,
    'synthetic_longitudinal_v1',
    true
from ml_smart_feed.norm_cow_profile c
join ml_smart_feed.norm_milk_daily m on m.cow_id = c.cow_id
join ml_smart_feed.norm_lactation_daily l on l.cow_id = c.cow_id and l.record_date = m.record_date
join ml_smart_feed.norm_feeding_daily f on f.cow_id = c.cow_id and f.record_date = m.record_date
join ml_smart_feed.norm_sensor_daily s on s.cow_id = c.cow_id and s.record_date = m.record_date
join tmp_project_a_longitudinal t
    on t.record_date = m.record_date
   and c.external_cow_id = format('SYN_A_%s', lpad(t.cow_no::text, 3, '0'))
join ml_smart_feed.norm_environment_daily e
    on e.record_date = m.record_date
   and e.external_farm_id = 'synthetic_project_a_farm'
   and e.barn_id = 'synthetic_longitudinal_barn'
where c.external_cow_id like 'SYN_A_%'
on conflict (cow_id, record_date) do update
set
    parity = excluded.parity,
    body_weight_kg = excluded.body_weight_kg,
    bcs = excluded.bcs,
    dim = excluded.dim,
    pregnancy_status = excluded.pregnancy_status,
    lactation_stage = excluded.lactation_stage,
    daily_milk_yield_kg = excluded.daily_milk_yield_kg,
    milk_fat_percent = excluded.milk_fat_percent,
    milk_protein_percent = excluded.milk_protein_percent,
    fat_protein_ratio = excluded.fat_protein_ratio,
    scc = excluded.scc,
    milk_electrical_conductivity = excluded.milk_electrical_conductivity,
    ration_type = excluded.ration_type,
    dry_matter_percent = excluded.dry_matter_percent,
    estimated_dmi_kg = excluded.estimated_dmi_kg,
    forage_concentrate_ratio = excluded.forage_concentrate_ratio,
    feed_change_last7d = excluded.feed_change_last7d,
    rumination_minutes = excluded.rumination_minutes,
    activity_level = excluded.activity_level,
    lying_time_minutes = excluded.lying_time_minutes,
    body_temperature = excluded.body_temperature,
    water_intake_liter = excluded.water_intake_liter,
    movement_distance_m = excluded.movement_distance_m,
    accel_magnitude_mean = excluded.accel_magnitude_mean,
    accel_magnitude_std = excluded.accel_magnitude_std,
    pressure_mean_pa = excluded.pressure_mean_pa,
    pressure_std_pa = excluded.pressure_std_pa,
    elevation_mean_m = excluded.elevation_mean_m,
    elevation_std_m = excluded.elevation_std_m,
    thi = excluded.thi,
    data_origin = excluded.data_origin,
    is_synthetic = excluded.is_synthetic;

insert into ml_smart_feed.feat_milk_trend (
    cow_id,
    record_date,
    milk_avg_7d,
    milk_avg_14d,
    milk_avg_30d,
    milk_trend_7d,
    milk_trend_14d,
    milk_drop_flag,
    milk_variance_7d
)
select
    c.cow_id,
    t.record_date,
    avg(t.daily_milk_yield_kg) over (
        partition by t.cow_no order by t.record_date rows between 6 preceding and current row
    ),
    avg(t.daily_milk_yield_kg) over (
        partition by t.cow_no order by t.record_date rows between 13 preceding and current row
    ),
    avg(t.daily_milk_yield_kg) over (
        partition by t.cow_no order by t.record_date rows between 29 preceding and current row
    ),
    t.daily_milk_yield_kg - lag(t.daily_milk_yield_kg, 7) over (
        partition by t.cow_no order by t.record_date
    ),
    t.daily_milk_yield_kg - lag(t.daily_milk_yield_kg, 14) over (
        partition by t.cow_no order by t.record_date
    ),
    t.daily_milk_yield_kg < 0.90 * avg(t.daily_milk_yield_kg) over (
        partition by t.cow_no order by t.record_date rows between 6 preceding and current row
    ),
    var_samp(t.daily_milk_yield_kg) over (
        partition by t.cow_no order by t.record_date rows between 6 preceding and current row
    )
from tmp_project_a_longitudinal t
join ml_smart_feed.norm_cow_profile c
    on c.external_cow_id = format('SYN_A_%s', lpad(t.cow_no::text, 3, '0'))
on conflict (cow_id, record_date) do update
set
    milk_avg_7d = excluded.milk_avg_7d,
    milk_avg_14d = excluded.milk_avg_14d,
    milk_avg_30d = excluded.milk_avg_30d,
    milk_trend_7d = excluded.milk_trend_7d,
    milk_trend_14d = excluded.milk_trend_14d,
    milk_drop_flag = excluded.milk_drop_flag,
    milk_variance_7d = excluded.milk_variance_7d;

insert into ml_smart_feed.feat_health_risk_label (
    cow_id,
    record_date,
    ketosis_label_7d,
    ketosis_label_14d,
    mastitis_label_7d,
    mastitis_label_14d,
    asidosis_label_7d,
    metritis_label_14d,
    energy_deficit_risk,
    label_origin,
    is_synthetic
)
select
    c.cow_id,
    t.record_date,
    exists (
        select 1
        from ml_smart_feed.norm_health_event e
        where e.cow_id = c.cow_id
          and e.event_type = 'ketosis'
          and e.event_date > t.record_date
          and e.event_date <= t.record_date + interval '7 days'
    ),
    exists (
        select 1
        from ml_smart_feed.norm_health_event e
        where e.cow_id = c.cow_id
          and e.event_type = 'ketosis'
          and e.event_date > t.record_date
          and e.event_date <= t.record_date + interval '14 days'
    ),
    exists (
        select 1
        from ml_smart_feed.norm_health_event e
        where e.cow_id = c.cow_id
          and e.event_type = 'mastitis'
          and e.event_date > t.record_date
          and e.event_date <= t.record_date + interval '7 days'
    ),
    exists (
        select 1
        from ml_smart_feed.norm_health_event e
        where e.cow_id = c.cow_id
          and e.event_type = 'mastitis'
          and e.event_date > t.record_date
          and e.event_date <= t.record_date + interval '14 days'
    ),
    exists (
        select 1
        from ml_smart_feed.norm_health_event e
        where e.cow_id = c.cow_id
          and e.event_type = 'asidosis'
          and e.event_date > t.record_date
          and e.event_date <= t.record_date + interval '7 days'
    ),
    exists (
        select 1
        from ml_smart_feed.norm_health_event e
        where e.cow_id = c.cow_id
          and e.event_type = 'metritis'
          and e.event_date > t.record_date
          and e.event_date <= t.record_date + interval '14 days'
    ),
    case when t.label_risk >= 0.72 then 'high' when t.label_risk >= 0.43 then 'medium' else 'low' end,
    'synthetic_longitudinal_forward_event_v1',
    true
from tmp_project_a_longitudinal t
join ml_smart_feed.norm_cow_profile c
    on c.external_cow_id = format('SYN_A_%s', lpad(t.cow_no::text, 3, '0'))
on conflict (cow_id, record_date) do update
set
    ketosis_label_7d = excluded.ketosis_label_7d,
    ketosis_label_14d = excluded.ketosis_label_14d,
    mastitis_label_7d = excluded.mastitis_label_7d,
    mastitis_label_14d = excluded.mastitis_label_14d,
    asidosis_label_7d = excluded.asidosis_label_7d,
    metritis_label_14d = excluded.metritis_label_14d,
    energy_deficit_risk = excluded.energy_deficit_risk,
    label_origin = excluded.label_origin,
    is_synthetic = excluded.is_synthetic;

insert into ml_smart_feed.feat_feeding_need_label (
    cow_id,
    record_date,
    feeding_need_class,
    need_score,
    rule_version,
    aciklama
)
select
    c.cow_id,
    t.record_date,
    case
        when t.latent_risk >= 0.72 then 'risk_balanced'
        when t.dim <= 21 then 'transition_support'
        when t.daily_milk_yield_kg >= 43 then 'high_energy'
        when t.milk_protein_percent < 3.10 then 'protein_support'
        else 'maintenance'
    end,
    least(1.0, 0.18 + t.latent_risk * 0.58 + greatest(t.daily_milk_yield_kg - 35.0, 0) / 80.0),
    'synthetic_longitudinal_v1',
    'Synthetic longitudinal feeding-need label; not observed farm decision.'
from tmp_project_a_longitudinal t
join ml_smart_feed.norm_cow_profile c
    on c.external_cow_id = format('SYN_A_%s', lpad(t.cow_no::text, 3, '0'))
on conflict (cow_id, record_date) do update
set
    feeding_need_class = excluded.feeding_need_class,
    need_score = excluded.need_score,
    rule_version = excluded.rule_version,
    aciklama = excluded.aciklama;

insert into ml_smart_feed.feat_model_input_a (
    snapshot_id,
    cow_id,
    record_date,
    feature_json,
    target_json,
    dataset_split,
    run_id
)
select
    s.snapshot_id,
    s.cow_id,
    s.record_date,
    jsonb_build_object(
        'is_synthetic', true,
        'generator_version', 'synthetic_project_a_longitudinal_v2_normalized',
        'data_origin', 'synthetic_longitudinal_v1',
        'parity', s.parity,
        'body_weight_kg', s.body_weight_kg,
        'bcs', s.bcs,
        'dim', s.dim,
        'lactation_stage', s.lactation_stage,
        'daily_milk_yield_kg', s.daily_milk_yield_kg,
        'milk_fat_percent', s.milk_fat_percent,
        'milk_protein_percent', s.milk_protein_percent,
        'fat_protein_ratio', s.fat_protein_ratio,
        'estimated_dmi_kg', s.estimated_dmi_kg,
        'rumination_minutes', s.rumination_minutes,
        'lying_time_minutes', s.lying_time_minutes,
        'body_temperature', s.body_temperature,
        'water_intake_liter', s.water_intake_liter,
        'movement_distance_m', s.movement_distance_m,
        'accel_magnitude_mean', s.accel_magnitude_mean,
        'accel_magnitude_std', s.accel_magnitude_std,
        'pressure_mean_pa', s.pressure_mean_pa,
        'pressure_std_pa', s.pressure_std_pa,
        'elevation_mean_m', s.elevation_mean_m,
        'elevation_std_m', s.elevation_std_m,
        'thi', s.thi,
        'milk_avg_7d', t.milk_avg_7d,
        'milk_trend_7d', t.milk_trend_7d
    ),
    jsonb_build_object(
        'feeding_need_class', f.feeding_need_class,
        'need_score', f.need_score,
        'energy_deficit_risk', h.energy_deficit_risk,
        'ketosis_label_14d', h.ketosis_label_14d,
        'mastitis_label_14d', h.mastitis_label_14d,
        'asidosis_label_7d', h.asidosis_label_7d
    ),
    case
        when s.cow_id % 10 in (0, 1, 2, 3, 4, 5, 6) then 'train'
        when s.cow_id % 10 in (7, 8) then 'validation'
        else 'test'
    end,
    r.run_id
from ml_smart_feed.feat_cow_day_snapshot s
join ml_smart_feed.feat_feeding_need_label f
    on f.cow_id = s.cow_id and f.record_date = s.record_date
join ml_smart_feed.feat_health_risk_label h
    on h.cow_id = s.cow_id and h.record_date = s.record_date
left join ml_smart_feed.feat_milk_trend t
    on t.cow_id = s.cow_id and t.record_date = s.record_date
cross join ml_smart_feed.meta_experiment_run r
where s.data_origin = 'synthetic_longitudinal_v1'
  and r.run_kodu = 'smart_feed_synthetic_project_a_longitudinal_v1';

insert into ml_smart_feed.feat_prediction_a (
    run_id,
    cow_id,
    record_date,
    lactation_stage,
    feeding_need_class,
    estimated_dmi_kg,
    expected_milk_yield_kg,
    energy_deficit_risk_score,
    ketosis_risk_score,
    mastitis_risk_score,
    asidosis_risk_score,
    early_warning_flag,
    explanation_json
)
select
    r.run_id,
    c.cow_id,
    t.record_date,
    case when t.dim <= 21 then 'transition' when t.dim <= 100 then 'early' else 'mid' end,
    f.feeding_need_class,
    t.estimated_dmi_kg,
    t.daily_milk_yield_kg,
    t.latent_risk,
    least(1.0, t.latent_risk * 0.82 + t.ketosis_noise * 0.18),
    least(1.0, t.latent_risk * 0.76 + t.mastitis_noise * 0.24),
    least(1.0, t.latent_risk * 0.80 + t.asidosis_noise * 0.20),
    (t.latent_risk >= 0.64),
    jsonb_build_object(
        'is_synthetic', true,
        'generator_version', 'synthetic_project_a_longitudinal_v2_normalized',
        'latent_risk', t.latent_risk
    )
from tmp_project_a_longitudinal t
join ml_smart_feed.norm_cow_profile c
    on c.external_cow_id = format('SYN_A_%s', lpad(t.cow_no::text, 3, '0'))
join ml_smart_feed.feat_feeding_need_label f
    on f.cow_id = c.cow_id and f.record_date = t.record_date
cross join ml_smart_feed.meta_experiment_run r
where r.run_kodu = 'smart_feed_synthetic_project_a_longitudinal_v1'
on conflict (run_id, cow_id, record_date) do update
set
    lactation_stage = excluded.lactation_stage,
    feeding_need_class = excluded.feeding_need_class,
    estimated_dmi_kg = excluded.estimated_dmi_kg,
    expected_milk_yield_kg = excluded.expected_milk_yield_kg,
    energy_deficit_risk_score = excluded.energy_deficit_risk_score,
    ketosis_risk_score = excluded.ketosis_risk_score,
    mastitis_risk_score = excluded.mastitis_risk_score,
    asidosis_risk_score = excluded.asidosis_risk_score,
    early_warning_flag = excluded.early_warning_flag,
    explanation_json = excluded.explanation_json;

commit;

\echo === Project A longitudinal synthetic cohort completed ===
