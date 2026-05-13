/*
Synthetic smoke-test records for empty prototype tables.

This file is intentionally explicit: rows inserted here are not trained model
outputs and must not be used as scientific results. They only keep prototype
tables non-empty for UI/DB integration checks.
*/

begin;

insert into suru_karar.master_sagim_makine (
    external_machine_id,
    makine_ad,
    hazne_hacmi,
    qr
)
values (
    'synthetic_placeholder_machine',
    'Synthetic placeholder milking machine',
    null,
    'synthetic_placeholder_machine'
)
on conflict (external_machine_id) do update
set makine_ad = excluded.makine_ad;

insert into suru_karar.meta_experiment_run (
    run_kodu,
    run_tipi,
    aciklama,
    parametre_json,
    bitis_zamani,
    durum
)
values (
    'synthetic_smoke_test_not_trained',
    'simulation',
    'Synthetic smoke-test run. Not a trained model and not a production policy.',
    jsonb_build_object(
        'source', 'sql/07_seed_synthetic_smoke_test_records.sql',
        'purpose', 'keep prototype RL tables non-empty for integration checks',
        'trained_model', false
    ),
    now(),
    'completed'
)
on conflict (run_kodu) do update
set aciklama = excluded.aciklama,
    parametre_json = excluded.parametre_json,
    bitis_zamani = excluded.bitis_zamani,
    durum = excluded.durum;

delete from suru_karar.rl_action_log_simulated
where run_id = (
    select run_id from suru_karar.meta_experiment_run
    where run_kodu = 'synthetic_smoke_test_not_trained'
);

delete from suru_karar.rl_policy_result
where run_id = (
    select run_id from suru_karar.meta_experiment_run
    where run_kodu = 'synthetic_smoke_test_not_trained'
);

delete from suru_karar.rl_value_result
where run_id = (
    select run_id from suru_karar.meta_experiment_run
    where run_kodu = 'synthetic_smoke_test_not_trained'
);

delete from suru_karar.feat_transition_dataset
where run_id = (
    select run_id from suru_karar.meta_experiment_run
    where run_kodu = 'synthetic_smoke_test_not_trained'
);

with run as (
    select run_id
    from suru_karar.meta_experiment_run
    where run_kodu = 'synthetic_smoke_test_not_trained'
),
ordered_snapshot as (
    select
        f.*,
        lead(f.referans_tarih) over (partition by f.inek_id order by f.referans_tarih) as next_state_tarih,
        lead(f.snapshot_id) over (partition by f.inek_id order by f.referans_tarih) as next_snapshot_id
    from suru_karar.feat_inek_aylik_snapshot f
),
transition_source as (
    select
        os.inek_id,
        os.state_tarih,
        os.next_state_tarih,
        os.state_json,
        os.next_state_json,
        os.action,
        os.done
    from (
        select
            cur.inek_id,
            cur.referans_tarih as state_tarih,
            nxt.referans_tarih as next_state_tarih,
            jsonb_build_object(
                'snapshot_id', cur.snapshot_id,
                'referans_tarih', cur.referans_tarih,
                'laktasyon_no', cur.laktasyon_no,
                'parite', cur.parite,
                'dim', cur.dim,
                'yas_gun', cur.yas_gun,
                'gebe_mi', cur.gebe_mi,
                'servis_sayisi', cur.servis_sayisi,
                'son_servis_gun', cur.son_servis_gun,
                'gebelik_kaybi_flag', cur.gebelik_kaybi_flag,
                'son30_saglik_olay_sayisi', cur.son30_saglik_olay_sayisi,
                'mastitis_flag', cur.mastitis_flag,
                'lameness_flag', cur.lameness_flag,
                'son30_ortalama_sut', cur.son30_ortalama_sut,
                'sut_trend_7g', cur.sut_trend_7g
            ) as state_json,
            jsonb_build_object(
                'snapshot_id', nxt.snapshot_id,
                'referans_tarih', nxt.referans_tarih,
                'laktasyon_no', nxt.laktasyon_no,
                'parite', nxt.parite,
                'dim', nxt.dim,
                'yas_gun', nxt.yas_gun,
                'gebe_mi', nxt.gebe_mi,
                'servis_sayisi', nxt.servis_sayisi,
                'son_servis_gun', nxt.son_servis_gun,
                'gebelik_kaybi_flag', nxt.gebelik_kaybi_flag,
                'son30_saglik_olay_sayisi', nxt.son30_saglik_olay_sayisi,
                'mastitis_flag', nxt.mastitis_flag,
                'lameness_flag', nxt.lameness_flag,
                'son30_ortalama_sut', nxt.son30_ortalama_sut,
                'sut_trend_7g', nxt.sut_trend_7g
            ) as next_state_json,
            case when cur.cull_30g is true then 'cull' else 'keep' end as action,
            cur.cull_30g is true as done
        from ordered_snapshot cur
        join suru_karar.feat_inek_aylik_snapshot nxt
            on nxt.snapshot_id = cur.next_snapshot_id
        where cur.next_snapshot_id is not null
    ) os
)
insert into suru_karar.feat_transition_dataset (
    inek_id,
    state_tarih,
    next_state_tarih,
    state_json,
    action,
    reward,
    next_state_json,
    done,
    source_type,
    run_id
)
select
    ts.inek_id,
    ts.state_tarih,
    ts.next_state_tarih,
    ts.state_json,
    ts.action,
    null,
    ts.next_state_json,
    ts.done,
    'generated',
    run.run_id
from transition_source ts
cross join run;

with run as (
    select run_id, run_kodu
    from suru_karar.meta_experiment_run
    where run_kodu = 'synthetic_smoke_test_not_trained'
),
sample_states as (
    select
        td.transition_id,
        td.inek_id,
        td.state_tarih,
        td.state_json,
        td.action,
        td.next_state_json,
        td.done,
        md5(td.state_json::text) as state_hash,
        row_number() over (order by td.transition_id) as rn
    from suru_karar.feat_transition_dataset td
    join run on run.run_id = td.run_id
)
insert into suru_karar.rl_action_log_simulated (
    run_id,
    inek_id,
    step_no,
    state_tarih,
    state_json,
    secilen_action,
    reward,
    next_state_json,
    done
)
select
    run.run_id,
    ss.inek_id,
    ss.rn,
    ss.state_tarih,
    ss.state_json,
    ss.action,
    null,
    ss.next_state_json,
    ss.done
from sample_states ss
cross join run
where ss.rn <= 1000;

with run as (
    select run_id, run_kodu
    from suru_karar.meta_experiment_run
    where run_kodu = 'synthetic_smoke_test_not_trained'
),
sample_states as (
    select distinct on (md5(td.state_json::text))
        md5(td.state_json::text) as state_hash,
        td.state_json,
        td.action
    from suru_karar.feat_transition_dataset td
    join run on run.run_id = td.run_id
    order by md5(td.state_json::text), td.transition_id
    limit 1000
)
insert into suru_karar.rl_policy_result (
    run_id,
    run_kodu,
    state_hash,
    state_json,
    onerilen_action,
    state_value,
    q_keep,
    q_cull
)
select
    run.run_id,
    run.run_kodu,
    ss.state_hash,
    ss.state_json,
    ss.action,
    null,
    null,
    null
from sample_states ss
cross join run;

with run as (
    select run_id, run_kodu
    from suru_karar.meta_experiment_run
    where run_kodu = 'synthetic_smoke_test_not_trained'
),
policy_states as (
    select policy_result_id, state_hash, state_json
    from suru_karar.rl_policy_result rp
    join run on run.run_id = rp.run_id
    order by policy_result_id
)
insert into suru_karar.rl_value_result (
    run_id,
    run_kodu,
    state_hash,
    state_json,
    action,
    q_value,
    v_value
)
select
    run.run_id,
    run.run_kodu,
    ps.state_hash,
    ps.state_json,
    action_choice.action,
    null,
    null
from policy_states ps
cross join run
cross join (values ('keep'), ('cull')) as action_choice(action);

commit;
