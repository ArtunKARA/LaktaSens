/*
Faz 3 dry-run CSV -> PostgreSQL tablo yükleme

Amaç:
- data/processed/training/inek_aylik_snapshot.csv dosyasını
  suru_karar.feat_inek_aylik_snapshot tablosuna yükler.
- master_inek.external_animal_id alanında canonical_animal_id kullanır.
- Mevcut DDL'yi değiştirmez.

Çalıştırma:
psql çalışma dizini KDS/Sürüden_keep_cull olacak şekilde:
psql -d laktasens -f sql/05_load_training_snapshot_from_csv.sql
*/

set client_encoding = 'UTF8';

begin;

create temp table stage_training_snapshot (
    snapshot_id text,
    source_code text,
    external_animal_id text,
    canonical_animal_id text,
    referans_tarih text,
    observation_start text,
    observation_end text,
    first_cull_date text,
    laktasyon_no text,
    parite text,
    dim text,
    yas_gun text,
    gebe_mi text,
    servis_sayisi text,
    son_servis_gun text,
    gebelik_kaybi_flag text,
    son30_saglik_olay_sayisi text,
    mastitis_flag text,
    lameness_flag text,
    son30_ortalama_sut text,
    sut_trend_7g text,
    cull_30g text,
    cull_60g text,
    cull_90g text,
    cull_within_30d text,
    cull_within_60d text,
    cull_within_90d text,
    label_30d_observed text,
    label_60d_observed text,
    label_90d_observed text
) on commit drop;

\copy stage_training_snapshot from 'data/processed/training/inek_aylik_snapshot.csv' with (format csv, header true)

insert into suru_karar.master_inek (external_animal_id)
select distinct canonical_animal_id
from stage_training_snapshot
where nullif(canonical_animal_id, '') is not null
on conflict (external_animal_id) do nothing;

delete from suru_karar.feat_inek_aylik_snapshot f
using suru_karar.master_inek mi
where f.inek_id = mi.inek_id
  and mi.external_animal_id in (
      select distinct canonical_animal_id
      from stage_training_snapshot
      where nullif(canonical_animal_id, '') is not null
  );

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
    mi.inek_id,
    nullif(s.referans_tarih, '')::date,
    nullif(s.laktasyon_no, '')::integer,
    nullif(s.parite, '')::integer,
    nullif(s.dim, '')::integer,
    nullif(s.yas_gun, '')::integer,
    case nullif(s.gebe_mi, '')
        when '1' then true
        when '0' then false
        else null
    end,
    nullif(s.servis_sayisi, '')::integer,
    nullif(s.son_servis_gun, '')::integer,
    case nullif(s.gebelik_kaybi_flag, '')
        when '1' then true
        when '0' then false
        else null
    end,
    coalesce(nullif(s.son30_saglik_olay_sayisi, '')::integer, 0),
    coalesce(
        case nullif(s.mastitis_flag, '')
            when '1' then true
            when '0' then false
            else null
        end,
        false
    ),
    coalesce(
        case nullif(s.lameness_flag, '')
            when '1' then true
            when '0' then false
            else null
        end,
        false
    ),
    nullif(s.son30_ortalama_sut, '')::double precision,
    nullif(s.sut_trend_7g, '')::double precision,
    case nullif(s.cull_30g, '')
        when '1' then true
        when '0' then false
        else null
    end,
    case nullif(s.cull_60g, '')
        when '1' then true
        when '0' then false
        else null
    end,
    case nullif(s.cull_90g, '')
        when '1' then true
        when '0' then false
        else null
    end
from stage_training_snapshot s
join suru_karar.master_inek mi
    on mi.external_animal_id = s.canonical_animal_id
where nullif(s.canonical_animal_id, '') is not null
  and nullif(s.referans_tarih, '') is not null;

commit;
