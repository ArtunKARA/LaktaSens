/*
===============================================================================
Smart Feed Project A synthetic/proxy feature generator

Run after:
  00_postgresql_load_all.sql

Purpose:
- Keep observed external raw data intact.
- Fill missing Project A modeling fields in norm_* and feat_* tables.
- Mark generated rows with source synthetic_smart_feed_v1 or rule metadata.
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
    'synthetic_smart_feed_v1',
    'Smart Feed synthetic and proxy data v1',
    'synthetic_rule_sql',
    'KDS/Smart_Feed/Data/external/synthetic_data_doc.md',
    'Rule-based synthetic/proxy data for POC only. Do not treat as observed farm data.',
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
    durum
)
values (
    'smart_feed_synthetic_project_a_v1',
    'baseline',
    'A',
    'rule_based_synthetic_project_a_v1',
    'Synthetic/proxy Project A feature and label generation.',
    jsonb_build_object(
        'is_synthetic', true,
        'rule_version', 'synthetic_project_a_v1',
        'doc_path', 'KDS/Smart_Feed/Data/external/synthetic_data_doc.md'
    ),
    'completed'
)
on conflict (run_kodu) do update
set
    aciklama = excluded.aciklama,
    parametre_json = excluded.parametre_json,
    bitis_zamani = now(),
    durum = 'completed';

-- ---------------------------------------------------------------------------
-- Clean previously generated Project A rows for the current cow-day backbone.
-- ---------------------------------------------------------------------------

delete from ml_smart_feed.feat_model_input_a
where run_id = (
    select run_id from ml_smart_feed.meta_experiment_run
    where run_kodu = 'smart_feed_synthetic_project_a_v1'
);

delete from ml_smart_feed.feat_prediction_a
where run_id = (
    select run_id from ml_smart_feed.meta_experiment_run
    where run_kodu = 'smart_feed_synthetic_project_a_v1'
);

with cow_days as (
    select c.cow_id, m.record_date
    from ml_smart_feed.raw_milk m
    join ml_smart_feed.norm_cow_profile c on c.external_cow_id = m.external_cow_id
)
delete from ml_smart_feed.feat_feeding_need_label f
using cow_days d
where f.cow_id = d.cow_id
  and f.record_date = d.record_date;

with cow_days as (
    select c.cow_id, m.record_date
    from ml_smart_feed.raw_milk m
    join ml_smart_feed.norm_cow_profile c on c.external_cow_id = m.external_cow_id
)
delete from ml_smart_feed.feat_health_risk_label f
using cow_days d
where f.cow_id = d.cow_id
  and f.record_date = d.record_date;

with cow_days as (
    select c.cow_id, m.record_date
    from ml_smart_feed.raw_milk m
    join ml_smart_feed.norm_cow_profile c on c.external_cow_id = m.external_cow_id
)
delete from ml_smart_feed.feat_milk_trend f
using cow_days d
where f.cow_id = d.cow_id
  and f.record_date = d.record_date;

with cow_days as (
    select c.cow_id, m.record_date
    from ml_smart_feed.raw_milk m
    join ml_smart_feed.norm_cow_profile c on c.external_cow_id = m.external_cow_id
)
delete from ml_smart_feed.feat_cow_day_snapshot f
using cow_days d
where f.cow_id = d.cow_id
  and f.record_date = d.record_date;

delete from ml_smart_feed.norm_feeding_daily
where kaynak_id = (
    select kaynak_id from ml_smart_feed.meta_veri_kaynagi
    where kaynak_kod = 'synthetic_smart_feed_v1'
);

delete from ml_smart_feed.norm_sensor_daily
where kaynak_id = (
    select kaynak_id from ml_smart_feed.meta_veri_kaynagi
    where kaynak_kod = 'synthetic_smart_feed_v1'
);

delete from ml_smart_feed.norm_environment_daily
where kaynak_id = (
    select kaynak_id from ml_smart_feed.meta_veri_kaynagi
    where kaynak_kod = 'synthetic_smart_feed_v1'
);

delete from ml_smart_feed.norm_milk_daily
where kaynak_id = (
    select kaynak_id from ml_smart_feed.meta_veri_kaynagi
    where kaynak_kod = 'synthetic_smart_feed_v1'
);

delete from ml_smart_feed.norm_lactation_daily
where kaynak_id = (
    select kaynak_id from ml_smart_feed.meta_veri_kaynagi
    where kaynak_kod = 'synthetic_smart_feed_v1'
);

delete from ml_smart_feed.norm_health_event
where source_table = 'raw_health:standardized_synthetic_project_a_v1';

-- ---------------------------------------------------------------------------
-- Mapping seeds.
-- ---------------------------------------------------------------------------

insert into ml_smart_feed.map_lactation_stage (
    kaynak_id,
    external_stage_name,
    standard_stage_code,
    min_dim,
    max_dim,
    aciklama
)
select
    k.kaynak_id,
    v.external_stage_name,
    v.standard_stage_code,
    v.min_dim,
    v.max_dim,
    'synthetic_project_a_v1 DIM stage rule'
from ml_smart_feed.meta_veri_kaynagi k
cross join (
    values
        ('dim_000_021', 'transition', 0, 21),
        ('dim_022_100', 'early', 22, 100),
        ('dim_101_200', 'mid', 101, 200),
        ('dim_201_305', 'late', 201, 305),
        ('dim_gt_305', 'late', 306, null)
) as v(external_stage_name, standard_stage_code, min_dim, max_dim)
where k.kaynak_kod = 'synthetic_smart_feed_v1'
on conflict do nothing;

insert into ml_smart_feed.map_health_event_type (
    kaynak_id,
    external_event_type,
    standard_event_type,
    risk_group,
    aciklama
)
select
    k.kaynak_id,
    v.external_event_type,
    v.standard_event_type,
    v.risk_group,
    'synthetic_project_a_v1 standard clinical event mapping'
from ml_smart_feed.meta_veri_kaynagi k
cross join (
    values
        ('Ketosis', 'ketosis', 'metabolic'),
        ('Clinical Mastitis', 'mastitis', 'udder_health'),
        ('Metritis', 'metritis', 'reproductive'),
        ('DA', 'displaced_abomasum', 'metabolic'),
        ('Lame', 'lameness', 'mobility'),
        ('Milk Fever', 'milk_fever', 'metabolic'),
        ('Retained Placenta', 'retained_placenta', 'reproductive')
) as v(external_event_type, standard_event_type, risk_group)
where k.kaynak_kod = 'synthetic_smart_feed_v1'
on conflict do nothing;

insert into ml_smart_feed.map_unit (
    source_unit,
    standard_unit,
    conversion_multiplier,
    aciklama
)
values
    ('lb', 'kg', 0.45359237, 'synthetic_project_a_v1 unit helper'),
    ('F', 'C_delta', 0.55555556, 'synthetic_project_a_v1 delta helper'),
    ('percent', 'percent', 1, 'synthetic_project_a_v1 unit helper')
on conflict (source_unit, standard_unit) do nothing;

-- ---------------------------------------------------------------------------
-- Cow profile.
-- ---------------------------------------------------------------------------

with source_cow as (
    select
        m.external_cow_id,
        coalesce(nullif(regexp_replace(m.external_cow_id, '[^0-9]', '', 'g'), '')::integer, 0) as cow_num,
        max(l.dim) as max_raw_dim,
        max(least(greatest(coalesce(l.dim, 0), 0), 305)) as max_model_dim
    from ml_smart_feed.raw_milk m
    left join ml_smart_feed.raw_lactation l
        on l.external_cow_id = m.external_cow_id
    group by m.external_cow_id
),
profile as (
    select
        s.external_cow_id,
        s.cow_num,
        case
            when s.cow_num % 5 = 0 then 3
            when s.cow_num % 3 = 0 then 2
            else 1
        end as parity,
        coalesce(s.max_raw_dim, s.max_model_dim, 150) as raw_dim_for_status,
        coalesce(s.max_model_dim, 150) as model_dim
    from source_cow s
)
insert into ml_smart_feed.norm_cow_profile (
    external_cow_id,
    cow_code,
    breed,
    parity,
    body_weight_kg,
    bcs,
    pregnancy_status,
    status,
    kaynak_id
)
select
    p.external_cow_id,
    'SYN_' || p.external_cow_id,
    'Holstein',
    p.parity,
    (610 + p.parity * 35 + (p.cow_num % 5) * 8)::double precision as body_weight_kg,
    least(
        3.7,
        greatest(
            2.55,
            case
                when p.model_dim <= 100 then 2.80
                when p.model_dim <= 200 then 3.00
                else 3.25
            end + ((p.cow_num % 5) - 2) * 0.05
        )
    )::double precision as bcs,
    case when p.raw_dim_for_status >= 150 then 'pregnant' else 'open' end,
    'active',
    k.kaynak_id
from profile p
cross join ml_smart_feed.meta_veri_kaynagi k
where k.kaynak_kod = 'synthetic_smart_feed_v1'
on conflict (external_cow_id) do update
set
    cow_code = excluded.cow_code,
    breed = excluded.breed,
    parity = excluded.parity,
    body_weight_kg = excluded.body_weight_kg,
    bcs = excluded.bcs,
    pregnancy_status = excluded.pregnancy_status,
    status = excluded.status,
    kaynak_id = excluded.kaynak_id;

update ml_smart_feed.map_external_cow m
set
    cow_id = c.cow_id,
    guven_skoru = greatest(coalesce(m.guven_skoru, 0), 0.85),
    notlar = concat_ws(' | ', m.notlar, 'linked by synthetic_project_a_v1')
from ml_smart_feed.norm_cow_profile c
where c.external_cow_id = m.external_cow_id
  and m.cow_id is distinct from c.cow_id;

-- ---------------------------------------------------------------------------
-- Normalize environment, lactation, milk, health, feeding, sensor.
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
    e.record_datetime::date,
    coalesce(e.external_farm_id, 'unknown_farm'),
    coalesce(e.barn_id, 'outdoor_or_average'),
    avg(e.temperature_c),
    max(e.temperature_c),
    avg(e.humidity_percent),
    avg(e.thi),
    max(e.thi),
    k.kaynak_id
from ml_smart_feed.raw_environment e
cross join ml_smart_feed.meta_veri_kaynagi k
where k.kaynak_kod = 'synthetic_smart_feed_v1'
group by e.record_datetime::date, coalesce(e.external_farm_id, 'unknown_farm'), coalesce(e.barn_id, 'outdoor_or_average'), k.kaynak_id
on conflict do nothing;

insert into ml_smart_feed.norm_lactation_daily (
    cow_id,
    record_date,
    lactation_no,
    parity,
    dim,
    pregnancy_status,
    lactation_stage,
    kaynak_id,
    source_table,
    source_row_id
)
select
    c.cow_id,
    (l.raw_payload->>'record_date')::date as record_date,
    c.parity,
    c.parity,
    least(greatest(l.dim, 0), 305) as dim,
    c.pregnancy_status,
    case
        when least(greatest(l.dim, 0), 305) <= 21 then 'transition'
        when least(greatest(l.dim, 0), 305) <= 100 then 'early'
        when least(greatest(l.dim, 0), 305) <= 200 then 'mid'
        else 'late'
    end as lactation_stage,
    k.kaynak_id,
    'raw_lactation+synthetic_project_a_v1',
    l.raw_lactation_id
from ml_smart_feed.raw_lactation l
join ml_smart_feed.norm_cow_profile c
    on c.external_cow_id = l.external_cow_id
cross join ml_smart_feed.meta_veri_kaynagi k
where k.kaynak_kod = 'synthetic_smart_feed_v1'
  and l.raw_payload ? 'record_date'
on conflict (cow_id, record_date) do update
set
    lactation_no = excluded.lactation_no,
    parity = excluded.parity,
    dim = excluded.dim,
    pregnancy_status = excluded.pregnancy_status,
    lactation_stage = excluded.lactation_stage,
    kaynak_id = excluded.kaynak_id,
    source_table = excluded.source_table,
    source_row_id = excluded.source_row_id;

with env as (
    select
        record_date,
        avg(avg_thi) as avg_thi
    from ml_smart_feed.norm_environment_daily
    group by record_date
),
milk_base as (
    select
        c.cow_id,
        c.external_cow_id,
        c.bcs,
        c.parity,
        m.raw_milk_id,
        m.record_date,
        m.daily_milk_yield_kg,
        coalesce(l.lactation_stage, 'unknown') as lactation_stage,
        coalesce(e.avg_thi, 65) as avg_thi,
        coalesce(nullif(regexp_replace(c.external_cow_id, '[^0-9]', '', 'g'), '')::integer, 0) as cow_num
    from ml_smart_feed.raw_milk m
    join ml_smart_feed.norm_cow_profile c on c.external_cow_id = m.external_cow_id
    left join ml_smart_feed.norm_lactation_daily l on l.cow_id = c.cow_id and l.record_date = m.record_date
    left join env e on e.record_date = m.record_date
)
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
    kaynak_id,
    source_table,
    source_row_id
)
select
    b.cow_id,
    b.record_date,
    b.daily_milk_yield_kg,
    fat.synthetic_fat,
    protein.synthetic_protein,
    fat.synthetic_fat / nullif(protein.synthetic_protein, 0),
    4.70,
    scc.synthetic_scc,
    4.70 + (scc.synthetic_scc / 1000000.0) * 1.35 + case when b.avg_thi > 75 then 0.15 else 0 end,
    k.kaynak_id,
    'raw_milk+synthetic_project_a_v1',
    b.raw_milk_id
from milk_base b
cross join ml_smart_feed.meta_veri_kaynagi k
cross join lateral (
    select least(
        4.60,
        greatest(
            3.10,
            3.65
            + case when b.lactation_stage = 'late' then 0.12 when b.lactation_stage = 'early' then -0.08 else 0 end
            + (40.0 - coalesce(b.daily_milk_yield_kg, 40)) * 0.008
            + ((b.cow_num % 5) - 2) * 0.03
            - case when b.avg_thi > 75 then 0.08 else 0 end
        )
    )::double precision as synthetic_fat
) fat
cross join lateral (
    select least(
        3.60,
        greatest(
            2.85,
            3.18
            + case when b.lactation_stage = 'late' then 0.06 when b.lactation_stage = 'early' then -0.04 else 0 end
            + (38.0 - coalesce(b.daily_milk_yield_kg, 38)) * 0.004
            + ((b.cow_num % 4) - 1) * 0.02
        )
    )::double precision as synthetic_protein
) protein
cross join lateral (
    select (
        85000
        + (b.cow_num % 7) * 12000
        + case when b.avg_thi > 75 then 45000 else 0 end
        + case when b.daily_milk_yield_kg < 0.92 * avg(b.daily_milk_yield_kg) over (partition by b.cow_id) then 90000 else 0 end
    )::double precision as synthetic_scc
) scc
where k.kaynak_kod = 'synthetic_smart_feed_v1'
on conflict (cow_id, record_date) do update
set
    daily_milk_yield_kg = excluded.daily_milk_yield_kg,
    milk_fat_percent = excluded.milk_fat_percent,
    milk_protein_percent = excluded.milk_protein_percent,
    fat_protein_ratio = excluded.fat_protein_ratio,
    lactose_percent = excluded.lactose_percent,
    scc = excluded.scc,
    milk_electrical_conductivity = excluded.milk_electrical_conductivity,
    kaynak_id = excluded.kaynak_id,
    source_table = excluded.source_table,
    source_row_id = excluded.source_row_id;

insert into ml_smart_feed.norm_health_event (
    cow_id,
    event_date,
    event_type,
    sub_type,
    severity,
    treatment_given,
    description,
    kaynak_id,
    source_table,
    source_row_id
)
select
    c.cow_id,
    h.event_date,
    coalesce(map.standard_event_type, 'other'),
    h.sub_type,
    coalesce(h.severity, case when h.event_type = 'medical_diagnosis' then 2 else 1 end),
    h.treatment_given,
    h.description,
    h.kaynak_id,
    'raw_health:standardized_synthetic_project_a_v1',
    h.raw_health_id
from ml_smart_feed.raw_health h
join ml_smart_feed.norm_cow_profile c on c.external_cow_id = h.external_cow_id
left join ml_smart_feed.map_health_event_type map
    on lower(map.external_event_type) = lower(coalesce(h.sub_type, h.event_type))
where h.event_type in ('medical_diagnosis', 'treatment', 'freshen', 'abortion', 'hoof_maintenance');

with base as (
    select
        c.cow_id,
        m.record_date,
        m.daily_milk_yield_kg,
        c.body_weight_kg,
        l.lactation_stage,
        e.avg_thi,
        coalesce(nullif(regexp_replace(c.external_cow_id, '[^0-9]', '', 'g'), '')::integer, 0) as cow_num
    from ml_smart_feed.norm_milk_daily m
    join ml_smart_feed.norm_cow_profile c on c.cow_id = m.cow_id
    left join ml_smart_feed.norm_lactation_daily l on l.cow_id = m.cow_id and l.record_date = m.record_date
    left join (
        select record_date, avg(avg_thi) as avg_thi
        from ml_smart_feed.norm_environment_daily
        group by record_date
    ) e on e.record_date = m.record_date
)
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
    kaynak_id,
    source_table
)
select
    b.cow_id,
    'synthetic_lactating_group',
    b.record_date,
    case
        when b.lactation_stage = 'early' then 'synthetic_high_energy_tmr'
        when b.lactation_stage = 'late' then 'synthetic_late_lactation_tmr'
        else 'synthetic_balanced_tmr'
    end,
    'TMR',
    dmi.estimated_dmi_kg / 0.50,
    50.0,
    dmi.estimated_dmi_kg,
    case
        when b.lactation_stage = 'early' then 45.0
        when b.lactation_stage = 'late' then 60.0
        else 55.0
    end,
    false,
    k.kaynak_id,
    'synthetic_project_a_v1'
from base b
cross join ml_smart_feed.meta_veri_kaynagi k
cross join lateral (
    select least(
        30.0,
        greatest(
            16.0,
            10.5
            + coalesce(b.daily_milk_yield_kg, 35) * 0.25
            + (coalesce(b.body_weight_kg, 650) - 600) * 0.008
            - case when b.lactation_stage = 'early' then 0.5 else 0 end
            - case when coalesce(b.avg_thi, 65) > 78 then 0.8 else 0 end
            + ((b.cow_num % 3) - 1) * 0.25
        )
    )::double precision as estimated_dmi_kg
) dmi
where k.kaynak_kod = 'synthetic_smart_feed_v1';

with cbt as (
    select
        c.cow_id,
        s.record_datetime::date as record_date,
        avg(s.body_temperature) filter (where s.body_temperature between 35 and 42) as avg_body_temperature
    from ml_smart_feed.raw_sensor s
    join ml_smart_feed.norm_cow_profile c on c.external_cow_id = s.external_cow_id
    where s.sensor_type = 'body_temperature'
    group by c.cow_id, s.record_datetime::date
),
multimodal as (
    select
        c.cow_id,
        s.record_datetime::date as record_date,
        avg(s.lying_time_minutes) as lying_time_minutes,
        avg(s.movement_distance_m) as movement_distance_m,
        avg(s.accel_magnitude_mean) as accel_magnitude_mean,
        avg(s.accel_magnitude_std) as accel_magnitude_std,
        avg(s.pressure_mean_pa) as pressure_mean_pa,
        avg(s.pressure_std_pa) as pressure_std_pa,
        avg(s.elevation_mean_m) as elevation_mean_m,
        avg(s.elevation_std_m) as elevation_std_m,
        max(s.kaynak_id) as kaynak_id
    from ml_smart_feed.raw_sensor s
    join ml_smart_feed.norm_cow_profile c on c.external_cow_id = s.external_cow_id
    where s.sensor_type = 'multimodal_daily_summary'
    group by c.cow_id, s.record_datetime::date
),
base as (
    select
        m.cow_id,
        m.record_date,
        m.daily_milk_yield_kg,
        f.estimated_dmi_kg,
        f.forage_concentrate_ratio,
        e.avg_temp,
        e.avg_thi,
        cbt.avg_body_temperature,
        mm.lying_time_minutes as observed_lying_time_minutes,
        mm.movement_distance_m,
        mm.accel_magnitude_mean,
        mm.accel_magnitude_std,
        mm.pressure_mean_pa,
        mm.pressure_std_pa,
        mm.elevation_mean_m,
        mm.elevation_std_m,
        mm.kaynak_id as observed_sensor_kaynak_id,
        coalesce(nullif(regexp_replace(c.external_cow_id, '[^0-9]', '', 'g'), '')::integer, 0) as cow_num
    from ml_smart_feed.norm_milk_daily m
    join ml_smart_feed.norm_cow_profile c on c.cow_id = m.cow_id
    left join ml_smart_feed.norm_feeding_daily f on f.cow_id = m.cow_id and f.record_date = m.record_date
    left join cbt on cbt.cow_id = m.cow_id and cbt.record_date = m.record_date
    left join multimodal mm on mm.cow_id = m.cow_id and mm.record_date = m.record_date
    left join (
        select record_date, avg(avg_temperature_c) as avg_temp, avg(avg_thi) as avg_thi
        from ml_smart_feed.norm_environment_daily
        group by record_date
    ) e on e.record_date = m.record_date
)
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
    b.cow_id,
    b.record_date,
    least(
        600.0,
        greatest(
            360.0,
            520.0
            + (coalesce(b.forage_concentrate_ratio, 55) - 55) * 1.2
            - case when coalesce(b.avg_thi, 65) > 75 then 35 else 0 end
            - case when coalesce(b.daily_milk_yield_kg, 35) > 50 then 20 else 0 end
            + ((b.cow_num % 5) - 2) * 8
        )
    ),
    35.0 + coalesce(b.daily_milk_yield_kg, 35) * 0.35 + ((b.cow_num % 6) * 3),
    coalesce(
        b.observed_lying_time_minutes,
        least(
            900.0,
            greatest(
                600.0,
                780.0
                - case when coalesce(b.avg_thi, 65) > 75 then 55 else 0 end
                + ((b.cow_num % 5) - 2) * 12
            )
        )
    ),
    coalesce(
        b.avg_body_temperature,
        38.70
        + case when coalesce(b.avg_thi, 65) > 75 then 0.20 else 0 end
        + ((b.cow_num % 5) - 2) * 0.04
    ),
    least(
        180.0,
        greatest(
            60.0,
            10.0
            + 1.60 * coalesce(b.estimated_dmi_kg, 22)
            + 1.30 * coalesce(b.daily_milk_yield_kg, 35)
            + 0.60 * coalesce(b.avg_temp, 20)
        )
    ),
    b.movement_distance_m,
    b.accel_magnitude_mean,
    b.accel_magnitude_std,
    b.pressure_mean_pa,
    b.pressure_std_pa,
    b.elevation_mean_m,
    b.elevation_std_m,
    coalesce(b.observed_sensor_kaynak_id, k.kaynak_id)
from base b
cross join ml_smart_feed.meta_veri_kaynagi k
where k.kaynak_kod = 'synthetic_smart_feed_v1'
on conflict (cow_id, record_date) do update
set
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
    kaynak_id = excluded.kaynak_id;

-- ---------------------------------------------------------------------------
-- Feature tables.
-- ---------------------------------------------------------------------------

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
    cow_id,
    record_date,
    avg(daily_milk_yield_kg) over (partition by cow_id order by record_date rows between 6 preceding and current row),
    avg(daily_milk_yield_kg) over (partition by cow_id order by record_date rows between 13 preceding and current row),
    avg(daily_milk_yield_kg) over (partition by cow_id order by record_date rows between 29 preceding and current row),
    daily_milk_yield_kg - lag(daily_milk_yield_kg, 7) over (partition by cow_id order by record_date),
    daily_milk_yield_kg - lag(daily_milk_yield_kg, 14) over (partition by cow_id order by record_date),
    case
        when daily_milk_yield_kg < 0.90 * avg(daily_milk_yield_kg) over (partition by cow_id order by record_date rows between 6 preceding and current row)
        then true
        else false
    end,
    var_samp(daily_milk_yield_kg) over (partition by cow_id order by record_date rows between 6 preceding and current row)
from ml_smart_feed.norm_milk_daily
on conflict (cow_id, record_date) do update
set
    milk_avg_7d = excluded.milk_avg_7d,
    milk_avg_14d = excluded.milk_avg_14d,
    milk_avg_30d = excluded.milk_avg_30d,
    milk_trend_7d = excluded.milk_trend_7d,
    milk_trend_14d = excluded.milk_trend_14d,
    milk_drop_flag = excluded.milk_drop_flag,
    milk_variance_7d = excluded.milk_variance_7d;

with env as (
    select record_date, avg(avg_thi) as avg_thi
    from ml_smart_feed.norm_environment_daily
    group by record_date
),
snapshot_base as (
    select
        c.cow_id,
        m.record_date,
        c.parity,
        c.body_weight_kg,
        c.bcs,
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
        e.avg_thi as thi,
        'mmcows_observed_with_proxy'::text as data_origin,
        true as is_synthetic
    from ml_smart_feed.norm_milk_daily m
    join ml_smart_feed.norm_cow_profile c on c.cow_id = m.cow_id
    left join ml_smart_feed.norm_lactation_daily l on l.cow_id = m.cow_id and l.record_date = m.record_date
    left join ml_smart_feed.norm_feeding_daily f on f.cow_id = m.cow_id and f.record_date = m.record_date
    left join ml_smart_feed.norm_sensor_daily s on s.cow_id = m.cow_id and s.record_date = m.record_date
    left join env e on e.record_date = m.record_date
)
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
select * from snapshot_base
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
    s.cow_id,
    s.record_date,
    (s.dim <= 100 and s.bcs >= 3.35 and s.daily_milk_yield_kg >= 48)
        or (s.estimated_dmi_kg / nullif(s.daily_milk_yield_kg, 0) < 0.46),
    (s.dim <= 120 and s.bcs >= 3.25 and s.daily_milk_yield_kg >= 46)
        or (s.estimated_dmi_kg / nullif(s.daily_milk_yield_kg, 0) < 0.48),
    (s.scc >= 200000 or s.milk_electrical_conductivity >= 5.35 or s.body_temperature >= 39.25),
    (s.scc >= 180000 or s.milk_electrical_conductivity >= 5.25 or s.body_temperature >= 39.15),
    (s.fat_protein_ratio < 1.08 and s.daily_milk_yield_kg > 42),
    (s.dim <= 21 and s.body_temperature >= 39.25),
    case
        when s.estimated_dmi_kg / nullif(s.daily_milk_yield_kg, 0) < 0.46 or (s.thi >= 78 and s.daily_milk_yield_kg > 45) then 'high'
        when s.estimated_dmi_kg / nullif(s.daily_milk_yield_kg, 0) < 0.52 or s.thi >= 75 then 'medium'
        else 'low'
    end,
    'synthetic_project_a_v1_proxy_rule',
    true
from ml_smart_feed.feat_cow_day_snapshot s
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
    s.cow_id,
    s.record_date,
    case
        when h.energy_deficit_risk = 'high' or h.ketosis_label_14d then 'high_energy'
        when s.milk_protein_percent < 3.05 then 'protein_support'
        when h.mastitis_label_14d or s.thi >= 75 then 'risk_balanced'
        when s.lactation_stage = 'transition' then 'transition_support'
        else 'maintenance'
    end,
    least(
        1.0,
        greatest(
            0.0,
            0.25
            + case when h.energy_deficit_risk = 'high' then 0.35 when h.energy_deficit_risk = 'medium' then 0.18 else 0 end
            + case when s.daily_milk_yield_kg > 50 then 0.20 when s.daily_milk_yield_kg > 43 then 0.10 else 0 end
            + case when s.thi >= 75 then 0.12 else 0 end
        )
    ),
    'synthetic_project_a_v1',
    'Proxy feeding need label generated from milk yield, DMI proxy, THI, milk components, and risk labels.'
from ml_smart_feed.feat_cow_day_snapshot s
join ml_smart_feed.feat_health_risk_label h on h.cow_id = s.cow_id and h.record_date = s.record_date
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
        'is_synthetic_proxy', true,
        'rule_version', 'synthetic_project_a_v1',
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
join ml_smart_feed.feat_feeding_need_label f on f.cow_id = s.cow_id and f.record_date = s.record_date
join ml_smart_feed.feat_health_risk_label h on h.cow_id = s.cow_id and h.record_date = s.record_date
left join ml_smart_feed.feat_milk_trend t on t.cow_id = s.cow_id and t.record_date = s.record_date
cross join ml_smart_feed.meta_experiment_run r
where r.run_kodu = 'smart_feed_synthetic_project_a_v1';

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
    s.cow_id,
    s.record_date,
    s.lactation_stage,
    f.feeding_need_class,
    s.estimated_dmi_kg,
    s.daily_milk_yield_kg,
    case h.energy_deficit_risk when 'high' then 0.78 when 'medium' then 0.46 else 0.16 end,
    case when h.ketosis_label_14d then 0.72 when h.energy_deficit_risk = 'medium' then 0.38 else 0.12 end,
    case when h.mastitis_label_14d then 0.68 when s.scc > 160000 then 0.42 else 0.10 end,
    case when h.asidosis_label_7d then 0.66 when s.fat_protein_ratio < 1.15 then 0.35 else 0.08 end,
    (
        h.energy_deficit_risk = 'high'
        or h.ketosis_label_14d
        or h.mastitis_label_14d
        or h.asidosis_label_7d
    ),
    jsonb_build_object(
        'is_synthetic_proxy', true,
        'rule_version', 'synthetic_project_a_v1',
        'reason', 'Rule baseline prediction generated before supervised model training.'
    )
from ml_smart_feed.feat_cow_day_snapshot s
join ml_smart_feed.feat_feeding_need_label f on f.cow_id = s.cow_id and f.record_date = s.record_date
join ml_smart_feed.feat_health_risk_label h on h.cow_id = s.cow_id and h.record_date = s.record_date
cross join ml_smart_feed.meta_experiment_run r
where r.run_kodu = 'smart_feed_synthetic_project_a_v1'
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

\echo === Smart Feed Project A synthetic/proxy generation completed ===
