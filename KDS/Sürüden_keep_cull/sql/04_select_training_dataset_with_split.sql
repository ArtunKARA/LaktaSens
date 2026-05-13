/*
Faz 3: Model-ready eğitim veri seti ve zaman bazlı train/test split seçimi

Ön koşul:
- sql/03_build_feat_inek_aylik_snapshot.sql çalıştırılmış olmalıdır.

Not:
- Rastgele split yapmaz.
- 30/60/90 gün label'ları null olmayan satırları seçer.
- Split, referans_tarih sırasındaki yaklaşık %80 kırılım tarihine göre yapılır.
*/

with model_ready as (
    select
        f.snapshot_id,
        f.inek_id,
        mi.external_animal_id as canonical_animal_id,
        f.referans_tarih,
        f.laktasyon_no,
        f.parite,
        f.dim,
        f.yas_gun,
        f.gebe_mi,
        f.servis_sayisi,
        f.son_servis_gun,
        f.gebelik_kaybi_flag,
        f.son30_saglik_olay_sayisi,
        f.mastitis_flag,
        f.lameness_flag,
        f.son30_ortalama_sut,
        f.sut_trend_7g,
        f.cull_30g,
        f.cull_60g,
        f.cull_90g
    from suru_karar.feat_inek_aylik_snapshot f
    join suru_karar.master_inek mi
        on mi.inek_id = f.inek_id
    where f.cull_30g is not null
      and f.cull_60g is not null
      and f.cull_90g is not null
),
ordered as (
    select
        mr.*,
        row_number() over (order by mr.referans_tarih, mr.inek_id) as rn,
        count(*) over () as total_rows
    from model_ready mr
),
cutoff as (
    select min(referans_tarih) as cutoff_date
    from ordered
    where rn >= greatest(1, floor(total_rows * 0.8)::integer)
)
select
    ordered.*,
    case
        when ordered.referans_tarih < cutoff.cutoff_date then 'train'
        else 'test'
    end as split
from ordered
cross join cutoff
order by ordered.referans_tarih, ordered.inek_id;
