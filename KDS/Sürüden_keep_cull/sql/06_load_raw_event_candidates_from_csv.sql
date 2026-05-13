/*
Faz 2.1 candidate CSV -> PostgreSQL raw/event yükleme

Amaç:
- data/processed/raw_candidates CSV files
- data/processed/event_candidates CSV files
- data/processed/event_normalized_candidates.csv
- data/processed/map_external_inek_candidates.csv

dosyalarını suru_karar raw/event/map tablolarına yükler.

Not:
- Mevcut DDL'yi değiştirmez.
- master_inek.external_animal_id alanında canonical_animal_id kullanır.
- Idempotent çalışır: candidate kaynaklarının raw/event/map kayıtlarını silip tekrar yükler.
- psql çalışma dizini KDS/Sürüden_keep_cull olmalıdır.
*/

set client_encoding = 'UTF8';

begin;

create temp table stg_map_external_inek (
    source_code text,
    external_animal_id text,
    canonical_animal_id text,
    notlar text
) on commit drop;

create temp table stg_raw_repro_loss (
    candidate_id text,
    source_code text,
    file_name text,
    sheet_name text,
    source_row_number text,
    external_animal_id text,
    canonical_animal_id text,
    fparto text,
    nparto text,
    nlact text,
    nrosf text,
    fechasf text,
    fechaperd text,
    npre text,
    perdida text,
    tperd text,
    codigo_tperd text,
    estsf text,
    dgp text,
    delp text,
    sana_ribeiro text,
    cl100 text,
    cl150 text,
    clsf text,
    cltacto text,
    raw_payload text
) on commit drop;

create temp table stg_raw_milk (
    candidate_id text,
    source_code text,
    file_name text,
    sheet_name text,
    source_row_number text,
    external_animal_id text,
    canonical_animal_id text,
    external_machine_id text,
    sagim_tarihi text,
    sut_miktar_kg text,
    sagim_no text,
    conductivity text,
    yag_orani text,
    protein_orani text,
    scc text,
    raw_payload text
) on commit drop;

create temp table stg_raw_culling (
    candidate_id text,
    source_code text,
    file_name text,
    sheet_name text,
    source_row_number text,
    external_animal_id text,
    canonical_animal_id text,
    cikarilma_tarihi text,
    cikarilma_sebebi text,
    planned_cull text,
    satis_degeri text,
    raw_payload text
) on commit drop;

create temp table stg_raw_health (
    candidate_id text,
    source_code text,
    file_name text,
    sheet_name text,
    source_row_number text,
    external_animal_id text,
    canonical_animal_id text,
    olay_tarihi text,
    olay_tipi text,
    alt_tip text,
    siddet text,
    tedavi_verildi text,
    aciklama text,
    raw_payload text
) on commit drop;

create temp table stg_event_dogurma (
    candidate_id text,
    source_code text,
    file_name text,
    sheet_name text,
    source_row_number text,
    external_animal_id text,
    canonical_animal_id text,
    dogurma_tarihi text,
    parite text,
    laktasyon_no text,
    source_table text,
    source_candidate_id text,
    payload text
) on commit drop;

create temp table stg_event_dollenme (
    candidate_id text,
    source_code text,
    file_name text,
    sheet_name text,
    source_row_number text,
    external_animal_id text,
    canonical_animal_id text,
    dollenme_tarihi text,
    dollenme_sayisi text,
    tuttu_mu text,
    servis_durumu text,
    source_table text,
    source_candidate_id text,
    payload text
) on commit drop;

create temp table stg_event_kuru (
    candidate_id text,
    source_code text,
    file_name text,
    sheet_name text,
    source_row_number text,
    external_animal_id text,
    canonical_animal_id text,
    kuru_baslangic_tarihi text,
    source_table text,
    source_candidate_id text,
    payload text
) on commit drop;

create temp table stg_event_sut_olcum (
    candidate_id text,
    source_code text,
    file_name text,
    sheet_name text,
    source_row_number text,
    external_animal_id text,
    canonical_animal_id text,
    sagim_tarihi text,
    sut_miktar_kg text,
    sagim_no text,
    conductivity text,
    yag_orani text,
    protein_orani text,
    scc text,
    source_table text,
    source_candidate_id text,
    payload text
) on commit drop;

create temp table stg_event_suruden_cikarma (
    candidate_id text,
    source_code text,
    file_name text,
    sheet_name text,
    source_row_number text,
    external_animal_id text,
    canonical_animal_id text,
    cikarilma_tarihi text,
    cikarilma_sebebi text,
    planned_cull text,
    satis_degeri text,
    source_table text,
    source_candidate_id text,
    payload text
) on commit drop;

create temp table stg_event_health (
    candidate_id text,
    source_code text,
    file_name text,
    sheet_name text,
    source_row_number text,
    external_animal_id text,
    canonical_animal_id text,
    olay_tarihi text,
    olay_tipi text,
    alt_tip text,
    siddet text,
    tedavi_verildi text,
    aciklama text,
    source_table text,
    source_candidate_id text,
    payload text
) on commit drop;

create temp table stg_event_normalized (
    candidate_id text,
    source_code text,
    file_name text,
    sheet_name text,
    source_row_number text,
    external_animal_id text,
    canonical_animal_id text,
    event_date text,
    event_type text,
    source_table text,
    source_candidate_id text,
    numeric_value text,
    text_value text,
    payload text
) on commit drop;

\copy stg_map_external_inek from 'data/processed/map_external_inek_candidates.csv' with (format csv, header true)
\copy stg_raw_repro_loss from 'data/processed/raw_candidates/raw_repro_loss.csv' with (format csv, header true)
\copy stg_raw_milk from 'data/processed/raw_candidates/raw_milk.csv' with (format csv, header true)
\copy stg_raw_culling from 'data/processed/raw_candidates/raw_culling.csv' with (format csv, header true)
\copy stg_raw_health from 'data/processed/raw_candidates/raw_health.csv' with (format csv, header true)
\copy stg_event_dogurma from 'data/processed/event_candidates/event_dogurma.csv' with (format csv, header true)
\copy stg_event_dollenme from 'data/processed/event_candidates/event_dollenme.csv' with (format csv, header true)
\copy stg_event_kuru from 'data/processed/event_candidates/event_kuru.csv' with (format csv, header true)
\copy stg_event_sut_olcum from 'data/processed/event_candidates/event_sut_olcum.csv' with (format csv, header true)
\copy stg_event_suruden_cikarma from 'data/processed/event_candidates/event_suruden_cikarma.csv' with (format csv, header true)
\copy stg_event_health from 'data/processed/event_candidates/event_health.csv' with (format csv, header true)
\copy stg_event_normalized from 'data/processed/event_normalized_candidates.csv' with (format csv, header true)

create temp table stg_candidate_sources as
select distinct source_code from stg_map_external_inek where nullif(source_code, '') is not null
union
select distinct source_code from stg_event_normalized where nullif(source_code, '') is not null;

insert into suru_karar.meta_veri_kaynagi (kaynak_kod, kaynak_adi, kaynak_tip, aciklama, aktif)
select source_code, source_code, 'candidate_csv', 'Loaded from local candidate CSV files.', true
from stg_candidate_sources
on conflict (kaynak_kod) do update
set aktif = true;

insert into suru_karar.master_inek (external_animal_id)
select distinct canonical_animal_id
from stg_map_external_inek
where nullif(canonical_animal_id, '') is not null
on conflict (external_animal_id) do nothing;

delete from suru_karar.event_normalized where kaynak_id in (
    select kaynak_id from suru_karar.meta_veri_kaynagi mk join stg_candidate_sources s on s.source_code = mk.kaynak_kod
);
delete from suru_karar.event_health where kaynak_id in (
    select kaynak_id from suru_karar.meta_veri_kaynagi mk join stg_candidate_sources s on s.source_code = mk.kaynak_kod
);
delete from suru_karar.event_suruden_cikarma where kaynak_id in (
    select kaynak_id from suru_karar.meta_veri_kaynagi mk join stg_candidate_sources s on s.source_code = mk.kaynak_kod
);
delete from suru_karar.event_sut_olcum where kaynak_id in (
    select kaynak_id from suru_karar.meta_veri_kaynagi mk join stg_candidate_sources s on s.source_code = mk.kaynak_kod
);
delete from suru_karar.event_kuru where kaynak_id in (
    select kaynak_id from suru_karar.meta_veri_kaynagi mk join stg_candidate_sources s on s.source_code = mk.kaynak_kod
);
delete from suru_karar.event_dollenme where kaynak_id in (
    select kaynak_id from suru_karar.meta_veri_kaynagi mk join stg_candidate_sources s on s.source_code = mk.kaynak_kod
);
delete from suru_karar.event_dogurma where kaynak_id in (
    select kaynak_id from suru_karar.meta_veri_kaynagi mk join stg_candidate_sources s on s.source_code = mk.kaynak_kod
);
delete from suru_karar.raw_health where kaynak_id in (
    select kaynak_id from suru_karar.meta_veri_kaynagi mk join stg_candidate_sources s on s.source_code = mk.kaynak_kod
);
delete from suru_karar.raw_culling where kaynak_id in (
    select kaynak_id from suru_karar.meta_veri_kaynagi mk join stg_candidate_sources s on s.source_code = mk.kaynak_kod
);
delete from suru_karar.raw_milk where kaynak_id in (
    select kaynak_id from suru_karar.meta_veri_kaynagi mk join stg_candidate_sources s on s.source_code = mk.kaynak_kod
);
delete from suru_karar.raw_repro_loss where kaynak_id in (
    select kaynak_id from suru_karar.meta_veri_kaynagi mk join stg_candidate_sources s on s.source_code = mk.kaynak_kod
);
delete from suru_karar.map_external_inek where kaynak_id in (
    select kaynak_id from suru_karar.meta_veri_kaynagi mk join stg_candidate_sources s on s.source_code = mk.kaynak_kod
);

insert into suru_karar.map_external_inek (kaynak_id, external_animal_id, inek_id, notlar)
select
    mk.kaynak_id,
    s.external_animal_id,
    mi.inek_id,
    coalesce(nullif(s.notlar, ''), 'Loaded from map_external_inek_candidates.csv')
from stg_map_external_inek s
join suru_karar.meta_veri_kaynagi mk on mk.kaynak_kod = s.source_code
join suru_karar.master_inek mi on mi.external_animal_id = s.canonical_animal_id
where nullif(s.external_animal_id, '') is not null
on conflict (kaynak_id, external_animal_id) do update
set inek_id = excluded.inek_id,
    notlar = excluded.notlar;

insert into suru_karar.raw_repro_loss (
    kaynak_id, external_animal_id, fparto, nparto, nlact, nrosf, fechasf, fechaperd,
    npre, perdida, tperd, codigo_tperd, estsf, dgp, delp, sana_ribeiro,
    cl100, cl150, clsf, cltacto, raw_payload
)
select
    mk.kaynak_id,
    s.external_animal_id,
    nullif(s.fparto, '')::date,
    nullif(s.nparto, '')::integer,
    nullif(s.nlact, '')::integer,
    nullif(s.nrosf, '')::integer,
    nullif(s.fechasf, '')::date,
    nullif(s.fechaperd, '')::date,
    nullif(s.npre, '')::integer,
    nullif(s.perdida, '')::integer,
    nullif(s.tperd, '')::integer,
    nullif(s.codigo_tperd, '')::integer,
    nullif(s.estsf, '')::integer,
    nullif(s.dgp, '')::integer,
    nullif(s.delp, '')::integer,
    nullif(s.sana_ribeiro, '')::integer,
    nullif(s.cl100, '')::double precision,
    nullif(s.cl150, '')::double precision,
    nullif(s.clsf, '')::double precision,
    nullif(s.cltacto, '')::double precision,
    nullif(s.raw_payload, '')::jsonb
from stg_raw_repro_loss s
join suru_karar.meta_veri_kaynagi mk on mk.kaynak_kod = s.source_code
where nullif(s.external_animal_id, '') is not null;

insert into suru_karar.raw_milk (
    kaynak_id, external_animal_id, external_machine_id, sagim_tarihi, sut_miktar_kg,
    sagim_no, conductivity, yag_orani, protein_orani, scc, raw_payload
)
select
    mk.kaynak_id,
    s.external_animal_id,
    nullif(s.external_machine_id, ''),
    nullif(s.sagim_tarihi, '')::date,
    nullif(s.sut_miktar_kg, '')::double precision,
    nullif(s.sagim_no, '')::integer,
    nullif(s.conductivity, '')::double precision,
    nullif(s.yag_orani, '')::double precision,
    nullif(s.protein_orani, '')::double precision,
    nullif(s.scc, '')::double precision,
    nullif(s.raw_payload, '')::jsonb
from stg_raw_milk s
join suru_karar.meta_veri_kaynagi mk on mk.kaynak_kod = s.source_code
where nullif(s.external_animal_id, '') is not null
  and nullif(s.sagim_tarihi, '') is not null
  and nullif(s.sut_miktar_kg, '') is not null;

insert into suru_karar.raw_culling (
    kaynak_id, external_animal_id, cikarilma_tarihi, cikarilma_sebebi, planned_cull, satis_degeri, raw_payload
)
select
    mk.kaynak_id,
    s.external_animal_id,
    nullif(s.cikarilma_tarihi, '')::date,
    nullif(s.cikarilma_sebebi, ''),
    case nullif(s.planned_cull, '') when '1' then true when '0' then false else null end,
    nullif(s.satis_degeri, '')::numeric,
    nullif(s.raw_payload, '')::jsonb
from stg_raw_culling s
join suru_karar.meta_veri_kaynagi mk on mk.kaynak_kod = s.source_code
where nullif(s.external_animal_id, '') is not null
  and nullif(s.cikarilma_tarihi, '') is not null;

insert into suru_karar.raw_health (
    kaynak_id, external_animal_id, olay_tarihi, olay_tipi, alt_tip, siddet, tedavi_verildi, aciklama, raw_payload
)
select
    mk.kaynak_id,
    s.external_animal_id,
    nullif(s.olay_tarihi, '')::date,
    s.olay_tipi,
    nullif(s.alt_tip, ''),
    nullif(s.siddet, '')::integer,
    case nullif(s.tedavi_verildi, '') when '1' then true when '0' then false else null end,
    nullif(s.aciklama, ''),
    nullif(s.raw_payload, '')::jsonb
from stg_raw_health s
join suru_karar.meta_veri_kaynagi mk on mk.kaynak_kod = s.source_code
where nullif(s.external_animal_id, '') is not null
  and nullif(s.olay_tarihi, '') is not null
  and nullif(s.olay_tipi, '') is not null;

insert into suru_karar.event_dogurma (
    inek_id, kaynak_id, dogurma_tarihi, parite, laktasyon_no, source_table, source_row_id
)
select
    mi.inek_id,
    mk.kaynak_id,
    nullif(s.dogurma_tarihi, '')::date,
    nullif(s.parite, '')::integer,
    nullif(s.laktasyon_no, '')::integer,
    nullif(s.source_table, ''),
    nullif(s.source_row_number, '')::bigint
from stg_event_dogurma s
join suru_karar.meta_veri_kaynagi mk on mk.kaynak_kod = s.source_code
join suru_karar.master_inek mi on mi.external_animal_id = s.canonical_animal_id
where nullif(s.dogurma_tarihi, '') is not null;

insert into suru_karar.event_dollenme (
    inek_id, kaynak_id, dollenme_tarihi, dollenme_sayisi, tuttu_mu, servis_durumu, source_table, source_row_id
)
select
    mi.inek_id,
    mk.kaynak_id,
    nullif(s.dollenme_tarihi, '')::date,
    nullif(s.dollenme_sayisi, '')::integer,
    case when nullif(s.tuttu_mu, '') in ('e', 'h') then nullif(s.tuttu_mu, '')::char(1) else null end,
    nullif(s.servis_durumu, ''),
    nullif(s.source_table, ''),
    nullif(s.source_row_number, '')::bigint
from stg_event_dollenme s
join suru_karar.meta_veri_kaynagi mk on mk.kaynak_kod = s.source_code
join suru_karar.master_inek mi on mi.external_animal_id = s.canonical_animal_id
where nullif(s.dollenme_tarihi, '') is not null;

insert into suru_karar.event_kuru (
    inek_id, kaynak_id, kuru_baslangic_tarihi, source_table, source_row_id
)
select
    mi.inek_id,
    mk.kaynak_id,
    nullif(s.kuru_baslangic_tarihi, '')::date,
    nullif(s.source_table, ''),
    nullif(s.source_row_number, '')::bigint
from stg_event_kuru s
join suru_karar.meta_veri_kaynagi mk on mk.kaynak_kod = s.source_code
join suru_karar.master_inek mi on mi.external_animal_id = s.canonical_animal_id
where nullif(s.kuru_baslangic_tarihi, '') is not null;

insert into suru_karar.event_sut_olcum (
    inek_id, kaynak_id, sagim_tarihi, sut_miktar_kg, sagim_no, conductivity,
    yag_orani, protein_orani, scc, source_table, source_row_id
)
select
    mi.inek_id,
    mk.kaynak_id,
    nullif(s.sagim_tarihi, '')::date,
    nullif(s.sut_miktar_kg, '')::double precision,
    nullif(s.sagim_no, '')::integer,
    nullif(s.conductivity, '')::double precision,
    nullif(s.yag_orani, '')::double precision,
    nullif(s.protein_orani, '')::double precision,
    nullif(s.scc, '')::double precision,
    nullif(s.source_table, ''),
    nullif(s.source_row_number, '')::bigint
from stg_event_sut_olcum s
join suru_karar.meta_veri_kaynagi mk on mk.kaynak_kod = s.source_code
join suru_karar.master_inek mi on mi.external_animal_id = s.canonical_animal_id
where nullif(s.sagim_tarihi, '') is not null
  and nullif(s.sut_miktar_kg, '') is not null;

insert into suru_karar.event_suruden_cikarma (
    inek_id, kaynak_id, cikarilma_tarihi, cikarilma_sebebi, planned_cull, satis_degeri, source_table, source_row_id
)
select
    mi.inek_id,
    mk.kaynak_id,
    nullif(s.cikarilma_tarihi, '')::date,
    nullif(s.cikarilma_sebebi, ''),
    case nullif(s.planned_cull, '') when '1' then true when '0' then false else null end,
    nullif(s.satis_degeri, '')::numeric,
    nullif(s.source_table, ''),
    nullif(s.source_row_number, '')::bigint
from stg_event_suruden_cikarma s
join suru_karar.meta_veri_kaynagi mk on mk.kaynak_kod = s.source_code
join suru_karar.master_inek mi on mi.external_animal_id = s.canonical_animal_id
where nullif(s.cikarilma_tarihi, '') is not null;

insert into suru_karar.event_health (
    inek_id, kaynak_id, olay_tarihi, olay_tipi, alt_tip, siddet, tedavi_verildi, aciklama, source_table, source_row_id
)
select
    mi.inek_id,
    mk.kaynak_id,
    nullif(s.olay_tarihi, '')::date,
    s.olay_tipi,
    nullif(s.alt_tip, ''),
    nullif(s.siddet, '')::integer,
    case nullif(s.tedavi_verildi, '') when '1' then true when '0' then false else null end,
    nullif(s.aciklama, ''),
    nullif(s.source_table, ''),
    nullif(s.source_row_number, '')::bigint
from stg_event_health s
join suru_karar.meta_veri_kaynagi mk on mk.kaynak_kod = s.source_code
join suru_karar.master_inek mi on mi.external_animal_id = s.canonical_animal_id
where nullif(s.olay_tarihi, '') is not null
  and nullif(s.olay_tipi, '') is not null;

insert into suru_karar.event_normalized (
    inek_id, kaynak_id, event_date, event_type, source_table, source_row_id, numeric_value, text_value, payload
)
select
    mi.inek_id,
    mk.kaynak_id,
    nullif(s.event_date, '')::date,
    s.event_type,
    nullif(s.source_table, ''),
    nullif(s.source_row_number, '')::bigint,
    nullif(s.numeric_value, '')::double precision,
    nullif(s.text_value, ''),
    nullif(s.payload, '')::jsonb
from stg_event_normalized s
join suru_karar.meta_veri_kaynagi mk on mk.kaynak_kod = s.source_code
left join suru_karar.master_inek mi on mi.external_animal_id = s.canonical_animal_id
where nullif(s.event_date, '') is not null
  and nullif(s.event_type, '') is not null;

commit;
