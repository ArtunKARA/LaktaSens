/*
===============================================================================
Smart Feed Project B synthetic/proxy optimizer seed

Run after:
  00_postgresql_load_all.sql
  04_generate_synthetic_project_a_features.sql

Purpose:
- Add synthetic NEL and feed price proxy rows without changing observed rows.
- Seed ration constraints, scenarios, reward parameters, demo ration candidates,
  actions, states, transitions, and policy outputs.
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
    'smart_feed_synthetic_project_b_v1',
    'simulation',
    'B',
    'rule_based_synthetic_project_b_v1',
    'Synthetic Project B optimizer, state, action and reward seed.',
    jsonb_build_object(
        'is_synthetic', true,
        'rule_version', 'synthetic_project_b_v1',
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
-- Clean previous generated Project B rows.
-- ---------------------------------------------------------------------------

delete from ml_smart_feed.sim_policy_output
where run_id = (
    select run_id from ml_smart_feed.meta_experiment_run
    where run_kodu = 'smart_feed_synthetic_project_b_v1'
);

delete from ml_smart_feed.sim_transition
where run_id = (
    select run_id from ml_smart_feed.meta_experiment_run
    where run_kodu = 'smart_feed_synthetic_project_b_v1'
);

delete from ml_smart_feed.sim_action_log
where run_id = (
    select run_id from ml_smart_feed.meta_experiment_run
    where run_kodu = 'smart_feed_synthetic_project_b_v1'
);

delete from ml_smart_feed.sim_action
where run_id = (
    select run_id from ml_smart_feed.meta_experiment_run
    where run_kodu = 'smart_feed_synthetic_project_b_v1'
);

delete from ml_smart_feed.sim_state
where run_id = (
    select run_id from ml_smart_feed.meta_experiment_run
    where run_kodu = 'smart_feed_synthetic_project_b_v1'
);

delete from ml_smart_feed.opt_ration_score s
using ml_smart_feed.opt_ration_candidate c
where s.ration_candidate_id = c.ration_candidate_id
  and c.run_id = (
      select run_id from ml_smart_feed.meta_experiment_run
      where run_kodu = 'smart_feed_synthetic_project_b_v1'
  );

delete from ml_smart_feed.opt_ration_candidate_item i
using ml_smart_feed.opt_ration_candidate c
where i.ration_candidate_id = c.ration_candidate_id
  and c.run_id = (
      select run_id from ml_smart_feed.meta_experiment_run
      where run_kodu = 'smart_feed_synthetic_project_b_v1'
  );

delete from ml_smart_feed.opt_ration_candidate
where run_id = (
    select run_id from ml_smart_feed.meta_experiment_run
    where run_kodu = 'smart_feed_synthetic_project_b_v1'
);

delete from ml_smart_feed.sim_reward_parameter
where aciklama like 'synthetic_project_b_v1%';

delete from ml_smart_feed.opt_ration_constraint
where constraint_code like 'SYN_%';

delete from ml_smart_feed.opt_feed_price
where kaynak_id = (
    select kaynak_id from ml_smart_feed.meta_veri_kaynagi
    where kaynak_kod = 'synthetic_smart_feed_v1'
)
and price_date = date '2026-06-05';

delete from ml_smart_feed.opt_feed_nutrient_value
where kaynak_id = (
    select kaynak_id from ml_smart_feed.meta_veri_kaynagi
    where kaynak_kod = 'synthetic_smart_feed_v1'
)
and effective_date = date '2026-06-05';

-- ---------------------------------------------------------------------------
-- Synthetic NEL and cleaned nutrient proxy rows.
-- ---------------------------------------------------------------------------

with latest_nutrient as (
    select distinct on (n.feed_ingredient_id)
        n.feed_ingredient_id,
        i.feed_category,
        i.feed_name,
        n.dry_matter_percent,
        n.cp_percent_dm,
        n.ndf_percent_dm,
        n.starch_percent_dm,
        n.fat_percent_dm,
        n.ca_percent_dm,
        n.p_percent_dm,
        n.mp_percent_dm,
        n.pe_ndf_percent_dm,
        n.mg_percent_dm,
        n.k_percent_dm,
        n.na_percent_dm
    from ml_smart_feed.opt_feed_nutrient_value n
    join ml_smart_feed.opt_feed_ingredient i using(feed_ingredient_id)
    order by n.feed_ingredient_id, n.effective_date desc, n.nutrient_value_id desc
),
cleaned as (
    select
        l.feed_ingredient_id,
        l.feed_category,
        case
            when l.dry_matter_percent is null or l.dry_matter_percent <= 0 or l.dry_matter_percent > 100 then
                case l.feed_category
                    when 'forage' then 35.0
                    when 'concentrate' then 89.0
                    when 'mineral' then 95.0
                    else 80.0
                end
            else l.dry_matter_percent
        end as dry_matter_percent,
        coalesce(nullif(l.cp_percent_dm, 0), case l.feed_category when 'forage' then 12.0 when 'concentrate' then 16.0 when 'mineral' then 0.0 else 10.0 end) as cp_percent_dm,
        coalesce(l.ndf_percent_dm, case l.feed_category when 'forage' then 45.0 when 'concentrate' then 18.0 when 'mineral' then 0.0 else 30.0 end) as ndf_percent_dm,
        coalesce(l.starch_percent_dm, case l.feed_category when 'forage' then 8.0 when 'concentrate' then 38.0 when 'mineral' then 0.0 else 15.0 end) as starch_percent_dm,
        coalesce(l.fat_percent_dm, case l.feed_category when 'forage' then 3.0 when 'concentrate' then 4.0 when 'mineral' then 0.0 else 3.0 end) as fat_percent_dm,
        coalesce(l.ca_percent_dm, case l.feed_category when 'mineral' then 18.0 when 'forage' then 0.70 else 0.12 end) as ca_percent_dm,
        coalesce(l.p_percent_dm, case l.feed_category when 'mineral' then 6.0 when 'forage' then 0.25 else 0.35 end) as p_percent_dm,
        l.mp_percent_dm,
        l.pe_ndf_percent_dm,
        l.mg_percent_dm,
        l.k_percent_dm,
        l.na_percent_dm
    from latest_nutrient l
)
insert into ml_smart_feed.opt_feed_nutrient_value (
    feed_ingredient_id,
    effective_date,
    dry_matter_percent,
    nel_mcal_kg_dm,
    cp_percent_dm,
    mp_percent_dm,
    ndf_percent_dm,
    pe_ndf_percent_dm,
    starch_percent_dm,
    fat_percent_dm,
    ca_percent_dm,
    p_percent_dm,
    mg_percent_dm,
    k_percent_dm,
    na_percent_dm,
    kaynak_id
)
select
    c.feed_ingredient_id,
    date '2026-06-05',
    c.dry_matter_percent,
    case
        when c.feed_category = 'mineral' then 0.0
        when c.feed_category = 'concentrate' then least(2.20, greatest(1.35, 1.55 + c.starch_percent_dm * 0.006 + c.fat_percent_dm * 0.025 + c.cp_percent_dm * 0.003))
        when c.feed_category = 'forage' then least(1.70, greatest(0.90, 1.05 + c.cp_percent_dm * 0.006 + c.starch_percent_dm * 0.004 - c.ndf_percent_dm * 0.003))
        else least(1.90, greatest(0.60, 1.15 + c.cp_percent_dm * 0.004 + c.starch_percent_dm * 0.003))
    end as nel_mcal_kg_dm,
    c.cp_percent_dm,
    c.mp_percent_dm,
    c.ndf_percent_dm,
    c.pe_ndf_percent_dm,
    c.starch_percent_dm,
    c.fat_percent_dm,
    c.ca_percent_dm,
    c.p_percent_dm,
    c.mg_percent_dm,
    c.k_percent_dm,
    c.na_percent_dm,
    k.kaynak_id
from cleaned c
cross join ml_smart_feed.meta_veri_kaynagi k
where k.kaynak_kod = 'synthetic_smart_feed_v1'
on conflict (feed_ingredient_id, effective_date) do update
set
    dry_matter_percent = excluded.dry_matter_percent,
    nel_mcal_kg_dm = excluded.nel_mcal_kg_dm,
    cp_percent_dm = excluded.cp_percent_dm,
    mp_percent_dm = excluded.mp_percent_dm,
    ndf_percent_dm = excluded.ndf_percent_dm,
    pe_ndf_percent_dm = excluded.pe_ndf_percent_dm,
    starch_percent_dm = excluded.starch_percent_dm,
    fat_percent_dm = excluded.fat_percent_dm,
    ca_percent_dm = excluded.ca_percent_dm,
    p_percent_dm = excluded.p_percent_dm,
    mg_percent_dm = excluded.mg_percent_dm,
    k_percent_dm = excluded.k_percent_dm,
    na_percent_dm = excluded.na_percent_dm,
    kaynak_id = excluded.kaynak_id;

-- ---------------------------------------------------------------------------
-- Synthetic feed price proxy rows.
-- ---------------------------------------------------------------------------

with latest_actual_price as (
    select distinct on (feed_ingredient_id)
        feed_ingredient_id,
        price_per_kg_dm
    from ml_smart_feed.opt_feed_price
    where kaynak_id is distinct from (
        select kaynak_id from ml_smart_feed.meta_veri_kaynagi
        where kaynak_kod = 'synthetic_smart_feed_v1'
    )
    order by feed_ingredient_id, price_date desc
),
grain_reference as (
    select avg(price_per_kg_dm)::numeric(12,4) as grain_price
    from latest_actual_price
),
proxy as (
    select
        i.feed_ingredient_id,
        coalesce(
            p.price_per_kg_dm,
            case
                when i.feed_name ilike '%soybean%meal%' then g.grain_price * 1.45
                when i.feed_category = 'concentrate' then g.grain_price * 1.05
                when i.feed_category = 'forage' then g.grain_price * 0.38
                when i.feed_category = 'mineral' then g.grain_price * 1.25
                else g.grain_price * 0.65
            end
        )::numeric(12,4) as price_per_kg_dm
    from ml_smart_feed.opt_feed_ingredient i
    cross join grain_reference g
    left join latest_actual_price p on p.feed_ingredient_id = i.feed_ingredient_id
    where i.aktif
)
insert into ml_smart_feed.opt_feed_price (
    feed_ingredient_id,
    price_date,
    price_per_kg_dm,
    currency_code,
    kaynak_id
)
select
    p.feed_ingredient_id,
    date '2026-06-05',
    p.price_per_kg_dm,
    'TRY',
    k.kaynak_id
from proxy p
cross join ml_smart_feed.meta_veri_kaynagi k
where k.kaynak_kod = 'synthetic_smart_feed_v1'
on conflict (feed_ingredient_id, price_date) do update
set
    price_per_kg_dm = excluded.price_per_kg_dm,
    currency_code = excluded.currency_code,
    kaynak_id = excluded.kaynak_id;

-- ---------------------------------------------------------------------------
-- Scenarios, constraints and reward parameters.
-- ---------------------------------------------------------------------------

insert into ml_smart_feed.meta_senaryo (
    senaryo_kodu,
    senaryo_adi,
    senaryo_tipi,
    aciklama,
    parametre_json,
    aktif
)
values
    ('synthetic_baseline_v1', 'Synthetic baseline ration scenario v1', 'baseline', 'synthetic_project_b_v1 baseline scenario', jsonb_build_object('is_synthetic', true), true),
    ('synthetic_low_cost_v1', 'Synthetic low cost ration scenario v1', 'low_cost', 'synthetic_project_b_v1 low cost scenario', jsonb_build_object('is_synthetic', true), true),
    ('synthetic_risk_averse_v1', 'Synthetic risk averse ration scenario v1', 'risk_averse', 'synthetic_project_b_v1 risk averse scenario', jsonb_build_object('is_synthetic', true), true)
on conflict (senaryo_kodu) do update
set
    senaryo_adi = excluded.senaryo_adi,
    senaryo_tipi = excluded.senaryo_tipi,
    aciklama = excluded.aciklama,
    parametre_json = excluded.parametre_json,
    aktif = true;

insert into ml_smart_feed.opt_ration_scenario (
    senaryo_id,
    scenario_code,
    objective_type,
    weight_cost,
    weight_milk_revenue,
    weight_health_risk,
    weight_ration_change,
    parametre_json,
    aktif
)
select
    s.senaryo_id,
    v.scenario_code,
    v.objective_type,
    v.weight_cost,
    v.weight_milk_revenue,
    v.weight_health_risk,
    v.weight_ration_change,
    jsonb_build_object('is_synthetic', true, 'rule_version', 'synthetic_project_b_v1'),
    true
from ml_smart_feed.meta_senaryo s
join (
    values
        ('synthetic_baseline_v1', 'synthetic_baseline_v1', 'risk_balanced', 1.0, 1.0, 1.0, 0.4),
        ('synthetic_low_cost_v1', 'synthetic_low_cost_v1', 'least_cost', 1.5, 0.8, 0.7, 0.3),
        ('synthetic_risk_averse_v1', 'synthetic_risk_averse_v1', 'risk_balanced', 0.9, 1.0, 1.8, 0.6)
) as v(senaryo_kodu, scenario_code, objective_type, weight_cost, weight_milk_revenue, weight_health_risk, weight_ration_change)
    on v.senaryo_kodu = s.senaryo_kodu
on conflict (scenario_code) do update
set
    senaryo_id = excluded.senaryo_id,
    objective_type = excluded.objective_type,
    weight_cost = excluded.weight_cost,
    weight_milk_revenue = excluded.weight_milk_revenue,
    weight_health_risk = excluded.weight_health_risk,
    weight_ration_change = excluded.weight_ration_change,
    parametre_json = excluded.parametre_json,
    aktif = true;

insert into ml_smart_feed.opt_ration_constraint (
    constraint_code,
    lactation_stage,
    feeding_need_class,
    nutrient_code,
    min_value,
    max_value,
    unit,
    hard_constraint,
    aciklama
)
select
    v.constraint_code,
    v.lactation_stage,
    v.feeding_need_class,
    v.nutrient_code,
    v.min_value,
    v.max_value,
    v.unit,
    v.hard_constraint,
    'synthetic_project_b_v1 constraint from extension/NASEM proxy rules'
from (
    values
        ('SYN_EARLY_CP', 'early', null, 'cp', 17.0, 18.5, 'percent_dm', true),
        ('SYN_MID_CP', 'mid', null, 'cp', 16.0, 17.5, 'percent_dm', true),
        ('SYN_LATE_CP', 'late', null, 'cp', 13.0, 15.5, 'percent_dm', true),
        ('SYN_EARLY_NDF', 'early', null, 'ndf', 28.0, null, 'percent_dm', true),
        ('SYN_MID_NDF', 'mid', null, 'ndf', 28.0, null, 'percent_dm', true),
        ('SYN_LATE_NDF', 'late', null, 'ndf', 32.0, null, 'percent_dm', true),
        ('SYN_STARCH_MAX', null, null, 'starch', null, 28.0, 'percent_dm', true),
        ('SYN_FAT_MAX', null, null, 'fat', null, 7.0, 'percent_dm', true),
        ('SYN_CA_RANGE', null, null, 'ca', 0.75, 1.00, 'percent_dm', false),
        ('SYN_P_RANGE', null, null, 'p', 0.35, 0.40, 'percent_dm', false),
        ('SYN_EARLY_NEL', 'early', null, 'nel', 1.55, null, 'mcal_kg_dm', true),
        ('SYN_MID_NEL', 'mid', null, 'nel', 1.45, null, 'mcal_kg_dm', true),
        ('SYN_LATE_NEL', 'late', null, 'nel', 1.30, null, 'mcal_kg_dm', true),
        ('SYN_HIGH_ENERGY_DMI', null, 'high_energy', 'dmi', 22.0, 30.0, 'kg_dm_day', true),
        ('SYN_MAINTENANCE_DMI', null, 'maintenance', 'dmi', 18.0, 26.0, 'kg_dm_day', true),
        ('SYN_RISK_BALANCED_DMI', null, 'risk_balanced', 'dmi', 18.0, 27.0, 'kg_dm_day', true)
) as v(constraint_code, lactation_stage, feeding_need_class, nutrient_code, min_value, max_value, unit, hard_constraint);

insert into ml_smart_feed.sim_reward_parameter (
    senaryo_id,
    effective_date,
    milk_revenue_weight,
    feed_cost_weight,
    ketosis_penalty,
    mastitis_penalty,
    asidosis_penalty,
    energy_deficit_penalty,
    ration_change_penalty,
    aciklama
)
select
    s.senaryo_id,
    date '2026-06-05',
    case s.senaryo_kodu when 'synthetic_low_cost_v1' then 0.8 else 1.0 end,
    case s.senaryo_kodu when 'synthetic_low_cost_v1' then 1.5 else 1.0 end,
    case s.senaryo_kodu when 'synthetic_risk_averse_v1' then 2500 else 1500 end,
    case s.senaryo_kodu when 'synthetic_risk_averse_v1' then 4000 else 2500 end,
    case s.senaryo_kodu when 'synthetic_risk_averse_v1' then 2500 else 1800 end,
    case s.senaryo_kodu when 'synthetic_risk_averse_v1' then 1200 else 700 end,
    case s.senaryo_kodu when 'synthetic_risk_averse_v1' then 250 else 120 end,
    'synthetic_project_b_v1 reward parameters; TRY proxy penalties'
from ml_smart_feed.meta_senaryo s
where s.senaryo_kodu in ('synthetic_baseline_v1', 'synthetic_low_cost_v1', 'synthetic_risk_averse_v1');

-- ---------------------------------------------------------------------------
-- Demo ration candidate per Project A prediction.
-- ---------------------------------------------------------------------------

with selected_scenario as (
    select ration_scenario_id
    from ml_smart_feed.opt_ration_scenario
    where scenario_code = 'synthetic_baseline_v1'
),
project_a_run as (
    select run_id
    from ml_smart_feed.meta_experiment_run
    where run_kodu = 'smart_feed_synthetic_project_a_v1'
),
project_b_run as (
    select run_id
    from ml_smart_feed.meta_experiment_run
    where run_kodu = 'smart_feed_synthetic_project_b_v1'
)
insert into ml_smart_feed.opt_ration_candidate (
    run_id,
    ration_scenario_id,
    cow_id,
    record_date,
    source_prediction_id,
    candidate_rank,
    selected_flag,
    feasible_flag,
    infeasible_reason
)
select
    b.run_id,
    s.ration_scenario_id,
    p.cow_id,
    p.record_date,
    p.prediction_id,
    1,
    true,
    true,
    null
from ml_smart_feed.feat_prediction_a p
join project_a_run a on a.run_id = p.run_id
cross join project_b_run b
cross join selected_scenario s;

with basket as (
    select *
    from (
        values
            ('Corn Silage, Typical', 'silage'),
            ('Alfalfa Meal', 'alfalfa'),
            ('Corn Grain Dry, Medium Grind', 'corn_grain'),
            ('Barley Grain, Dry, Ground', 'barley_grain'),
            ('Soybean Meal, Solvent Extracted, 48% CP', 'soybean_meal')
    ) as b(feed_name, feed_role)
),
feed_ids as (
    select
        b.feed_role,
        i.feed_ingredient_id
    from basket b
    join ml_smart_feed.opt_feed_ingredient i on i.feed_name = b.feed_name
),
candidate_base as (
    select
        c.ration_candidate_id,
        p.feeding_need_class,
        greatest(coalesce(p.estimated_dmi_kg, 22), 16) as dmi
    from ml_smart_feed.opt_ration_candidate c
    join ml_smart_feed.feat_prediction_a p on p.prediction_id = c.source_prediction_id
    where c.run_id = (
        select run_id from ml_smart_feed.meta_experiment_run
        where run_kodu = 'smart_feed_synthetic_project_b_v1'
    )
),
fractions as (
    select
        cb.ration_candidate_id,
        cb.dmi,
        f.feed_ingredient_id,
        case
            when cb.feeding_need_class = 'high_energy' and f.feed_role = 'silage' then 0.40
            when cb.feeding_need_class = 'high_energy' and f.feed_role = 'corn_grain' then 0.22
            when cb.feeding_need_class = 'high_energy' and f.feed_role = 'barley_grain' then 0.18
            when cb.feeding_need_class = 'high_energy' and f.feed_role = 'soybean_meal' then 0.10
            when cb.feeding_need_class = 'high_energy' and f.feed_role = 'alfalfa' then 0.10
            when cb.feeding_need_class = 'protein_support' and f.feed_role = 'silage' then 0.42
            when cb.feeding_need_class = 'protein_support' and f.feed_role = 'soybean_meal' then 0.18
            when cb.feeding_need_class = 'protein_support' and f.feed_role = 'corn_grain' then 0.18
            when cb.feeding_need_class = 'protein_support' and f.feed_role = 'barley_grain' then 0.12
            when cb.feeding_need_class = 'protein_support' and f.feed_role = 'alfalfa' then 0.10
            when cb.feeding_need_class = 'risk_balanced' and f.feed_role = 'silage' then 0.55
            when cb.feeding_need_class = 'risk_balanced' and f.feed_role = 'alfalfa' then 0.15
            when cb.feeding_need_class = 'risk_balanced' and f.feed_role = 'corn_grain' then 0.12
            when cb.feeding_need_class = 'risk_balanced' and f.feed_role = 'barley_grain' then 0.10
            when cb.feeding_need_class = 'risk_balanced' and f.feed_role = 'soybean_meal' then 0.08
            when f.feed_role = 'silage' then 0.60
            when f.feed_role = 'alfalfa' then 0.15
            when f.feed_role = 'corn_grain' then 0.10
            when f.feed_role = 'barley_grain' then 0.10
            when f.feed_role = 'soybean_meal' then 0.05
            else 0
        end as fraction
    from candidate_base cb
    cross join feed_ids f
),
latest_nutrient as (
    select distinct on (feed_ingredient_id)
        feed_ingredient_id,
        dry_matter_percent
    from ml_smart_feed.opt_feed_nutrient_value
    order by feed_ingredient_id, effective_date desc, nutrient_value_id desc
),
latest_price as (
    select distinct on (feed_ingredient_id)
        feed_ingredient_id,
        price_per_kg_dm
    from ml_smart_feed.opt_feed_price
    order by feed_ingredient_id, price_date desc, feed_price_id desc
)
insert into ml_smart_feed.opt_ration_candidate_item (
    ration_candidate_id,
    feed_ingredient_id,
    amount_kg_dm,
    amount_kg_asfed,
    cost
)
select
    f.ration_candidate_id,
    f.feed_ingredient_id,
    f.dmi * f.fraction,
    (f.dmi * f.fraction) / nullif(coalesce(n.dry_matter_percent, 50) / 100.0, 0),
    (f.dmi * f.fraction * coalesce(p.price_per_kg_dm, 0))::numeric(12,4)
from fractions f
left join latest_nutrient n on n.feed_ingredient_id = f.feed_ingredient_id
left join latest_price p on p.feed_ingredient_id = f.feed_ingredient_id
where f.fraction > 0
on conflict (ration_candidate_id, feed_ingredient_id) do update
set
    amount_kg_dm = excluded.amount_kg_dm,
    amount_kg_asfed = excluded.amount_kg_asfed,
    cost = excluded.cost;

with latest_nutrient as (
    select distinct on (feed_ingredient_id)
        feed_ingredient_id,
        nel_mcal_kg_dm,
        cp_percent_dm,
        ndf_percent_dm,
        starch_percent_dm,
        fat_percent_dm,
        ca_percent_dm,
        p_percent_dm
    from ml_smart_feed.opt_feed_nutrient_value
    order by feed_ingredient_id, effective_date desc, nutrient_value_id desc
),
milk_price as (
    select milk_price_per_kg
    from ml_smart_feed.opt_milk_price
    order by price_date desc
    limit 1
),
reward as (
    select *
    from ml_smart_feed.sim_reward_parameter rp
    where rp.senaryo_id = (
        select senaryo_id from ml_smart_feed.meta_senaryo
        where senaryo_kodu = 'synthetic_baseline_v1'
    )
    order by effective_date desc
    limit 1
),
candidate_summary as (
    select
        c.ration_candidate_id,
        sum(i.amount_kg_dm) as total_dmi_kg,
        sum(i.cost) as total_feed_cost,
        sum(i.amount_kg_dm * n.nel_mcal_kg_dm) / nullif(sum(i.amount_kg_dm), 0) as ration_nel,
        sum(i.amount_kg_dm * n.cp_percent_dm) / nullif(sum(i.amount_kg_dm), 0) as ration_cp,
        sum(i.amount_kg_dm * n.ndf_percent_dm) / nullif(sum(i.amount_kg_dm), 0) as ration_ndf,
        sum(i.amount_kg_dm * n.starch_percent_dm) / nullif(sum(i.amount_kg_dm), 0) as ration_starch,
        sum(i.amount_kg_dm * n.fat_percent_dm) / nullif(sum(i.amount_kg_dm), 0) as ration_fat,
        p.expected_milk_yield_kg,
        p.energy_deficit_risk_score,
        p.ketosis_risk_score,
        p.mastitis_risk_score,
        p.asidosis_risk_score
    from ml_smart_feed.opt_ration_candidate c
    join ml_smart_feed.feat_prediction_a p on p.prediction_id = c.source_prediction_id
    join ml_smart_feed.opt_ration_candidate_item i on i.ration_candidate_id = c.ration_candidate_id
    left join latest_nutrient n on n.feed_ingredient_id = i.feed_ingredient_id
    where c.run_id = (
        select run_id from ml_smart_feed.meta_experiment_run
        where run_kodu = 'smart_feed_synthetic_project_b_v1'
    )
    group by c.ration_candidate_id, p.expected_milk_yield_kg, p.energy_deficit_risk_score, p.ketosis_risk_score, p.mastitis_risk_score, p.asidosis_risk_score
)
insert into ml_smart_feed.opt_ration_score (
    ration_candidate_id,
    total_dmi_kg,
    total_feed_cost,
    expected_milk_yield_kg,
    expected_milk_revenue,
    expected_margin,
    health_risk_penalty,
    ration_change_penalty,
    total_score,
    nutrient_summary_json,
    score_detail_json
)
select
    cs.ration_candidate_id,
    cs.total_dmi_kg,
    cs.total_feed_cost,
    cs.expected_milk_yield_kg,
    (cs.expected_milk_yield_kg * mp.milk_price_per_kg)::numeric(12,4),
    (cs.expected_milk_yield_kg * mp.milk_price_per_kg - cs.total_feed_cost)::numeric(12,4),
    (
        coalesce(cs.ketosis_risk_score, 0) * coalesce(rp.ketosis_penalty, 0)
        + coalesce(cs.mastitis_risk_score, 0) * coalesce(rp.mastitis_penalty, 0)
        + coalesce(cs.asidosis_risk_score, 0) * coalesce(rp.asidosis_penalty, 0)
        + coalesce(cs.energy_deficit_risk_score, 0) * coalesce(rp.energy_deficit_penalty, 0)
    )::numeric(12,4),
    rp.ration_change_penalty,
    (
        cs.expected_milk_yield_kg * mp.milk_price_per_kg
        - cs.total_feed_cost
        - (
            coalesce(cs.ketosis_risk_score, 0) * coalesce(rp.ketosis_penalty, 0)
            + coalesce(cs.mastitis_risk_score, 0) * coalesce(rp.mastitis_penalty, 0)
            + coalesce(cs.asidosis_risk_score, 0) * coalesce(rp.asidosis_penalty, 0)
            + coalesce(cs.energy_deficit_risk_score, 0) * coalesce(rp.energy_deficit_penalty, 0)
        )
        - coalesce(rp.ration_change_penalty, 0)
    )::numeric(14,4),
    jsonb_build_object(
        'nel_mcal_kg_dm', cs.ration_nel,
        'cp_percent_dm', cs.ration_cp,
        'ndf_percent_dm', cs.ration_ndf,
        'starch_percent_dm', cs.ration_starch,
        'fat_percent_dm', cs.ration_fat
    ),
    jsonb_build_object(
        'is_synthetic_proxy', true,
        'rule_version', 'synthetic_project_b_v1',
        'milk_price_per_kg', mp.milk_price_per_kg,
        'risk_penalty_source', 'sim_reward_parameter'
    )
from candidate_summary cs
cross join milk_price mp
cross join reward rp
on conflict (ration_candidate_id) do update
set
    total_dmi_kg = excluded.total_dmi_kg,
    total_feed_cost = excluded.total_feed_cost,
    expected_milk_yield_kg = excluded.expected_milk_yield_kg,
    expected_milk_revenue = excluded.expected_milk_revenue,
    expected_margin = excluded.expected_margin,
    health_risk_penalty = excluded.health_risk_penalty,
    ration_change_penalty = excluded.ration_change_penalty,
    total_score = excluded.total_score,
    nutrient_summary_json = excluded.nutrient_summary_json,
    score_detail_json = excluded.score_detail_json;

-- ---------------------------------------------------------------------------
-- Simulation state/action/policy plumbing.
-- ---------------------------------------------------------------------------

insert into ml_smart_feed.sim_state (
    run_id,
    cow_id,
    record_date,
    source_prediction_id,
    state_hash,
    state_json
)
select
    r.run_id,
    p.cow_id,
    p.record_date,
    p.prediction_id,
    md5(concat_ws('|', r.run_id::text, p.cow_id::text, p.record_date::text, p.prediction_id::text)),
    jsonb_build_object(
        'is_synthetic_proxy', true,
        'rule_version', 'synthetic_project_b_v1',
        'lactation_stage', p.lactation_stage,
        'feeding_need_class', p.feeding_need_class,
        'estimated_dmi_kg', p.estimated_dmi_kg,
        'expected_milk_yield_kg', p.expected_milk_yield_kg,
        'energy_deficit_risk_score', p.energy_deficit_risk_score,
        'ketosis_risk_score', p.ketosis_risk_score,
        'mastitis_risk_score', p.mastitis_risk_score,
        'asidosis_risk_score', p.asidosis_risk_score
    )
from ml_smart_feed.feat_prediction_a p
cross join ml_smart_feed.meta_experiment_run r
where r.run_kodu = 'smart_feed_synthetic_project_b_v1'
  and p.run_id = (
      select run_id from ml_smart_feed.meta_experiment_run
      where run_kodu = 'smart_feed_synthetic_project_a_v1'
  );

insert into ml_smart_feed.sim_action (
    run_id,
    action_type,
    ration_candidate_id,
    action_json
)
select
    c.run_id,
    'ration_choice',
    c.ration_candidate_id,
    jsonb_build_object(
        'is_synthetic_proxy', true,
        'rule_version', 'synthetic_project_b_v1',
        'action_code', 'choose_demo_ration_rank_1',
        'candidate_rank', c.candidate_rank
    )
from ml_smart_feed.opt_ration_candidate c
where c.run_id = (
    select run_id from ml_smart_feed.meta_experiment_run
    where run_kodu = 'smart_feed_synthetic_project_b_v1'
);

insert into ml_smart_feed.sim_policy_output (
    run_id,
    cow_id,
    record_date,
    state_id,
    recommended_action_id,
    recommended_ration_candidate_id,
    policy_name,
    expected_reward,
    confidence_score,
    explanation_json
)
select
    st.run_id,
    st.cow_id,
    st.record_date,
    st.state_id,
    a.action_id,
    c.ration_candidate_id,
    'synthetic_rule_policy_v1',
    sc.total_score,
    0.60,
    jsonb_build_object(
        'is_synthetic_proxy', true,
        'rule_version', 'synthetic_project_b_v1',
        'reason', 'Single deterministic demo ration selected for POC pipeline.'
    )
from ml_smart_feed.sim_state st
join ml_smart_feed.opt_ration_candidate c
    on c.source_prediction_id = st.source_prediction_id
   and c.run_id = st.run_id
join ml_smart_feed.sim_action a
    on a.ration_candidate_id = c.ration_candidate_id
   and a.run_id = st.run_id
left join ml_smart_feed.opt_ration_score sc on sc.ration_candidate_id = c.ration_candidate_id
where st.run_id = (
    select run_id from ml_smart_feed.meta_experiment_run
    where run_kodu = 'smart_feed_synthetic_project_b_v1'
);

with ordered_states as (
    select
        st.*,
        lead(st.state_id) over (partition by st.cow_id order by st.record_date) as next_state_id
    from ml_smart_feed.sim_state st
    where st.run_id = (
        select run_id from ml_smart_feed.meta_experiment_run
        where run_kodu = 'smart_feed_synthetic_project_b_v1'
    )
),
state_action as (
    select
        os.run_id,
        os.cow_id,
        os.state_id,
        os.next_state_id,
        po.recommended_action_id,
        po.expected_reward
    from ordered_states os
    join ml_smart_feed.sim_policy_output po
        on po.state_id = os.state_id
    where os.next_state_id is not null
)
insert into ml_smart_feed.sim_transition (
    run_id,
    cow_id,
    state_id,
    action_id,
    next_state_id,
    reward,
    done,
    transition_probability,
    transition_source
)
select
    run_id,
    cow_id,
    state_id,
    recommended_action_id,
    next_state_id,
    expected_reward,
    false,
    0.65,
    'simulated'
from state_action;

insert into ml_smart_feed.sim_action_log (
    run_id,
    cow_id,
    step_no,
    state_id,
    action_id,
    reward,
    done,
    log_json
)
select
    po.run_id,
    po.cow_id,
    dense_rank() over (partition by po.cow_id order by po.record_date) as step_no,
    po.state_id,
    po.recommended_action_id,
    po.expected_reward,
    false,
    jsonb_build_object(
        'is_synthetic_proxy', true,
        'rule_version', 'synthetic_project_b_v1',
        'policy_name', po.policy_name
    )
from ml_smart_feed.sim_policy_output po
where po.run_id = (
    select run_id from ml_smart_feed.meta_experiment_run
    where run_kodu = 'smart_feed_synthetic_project_b_v1'
);

commit;

\echo === Smart Feed Project B synthetic/proxy optimizer seed completed ===
