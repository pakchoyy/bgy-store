-- Ulasan dari aplikasi BGY (bantuguruyuk.web.id) boleh tampil di produk lisensinya.
-- Ulasan ini tidak punya pesanan, jadi order_id boleh kosong khusus source = 'bgy'.
-- Di toko diberi label "Pengguna aplikasi BGY", bukan "Pembeli Terverifikasi".
alter table public.product_reviews alter column order_id drop not null;
alter table public.product_reviews add column if not exists source text not null default 'order';
alter table public.product_reviews add column if not exists bgy_review_id bigint;
alter table public.product_reviews drop constraint if exists product_reviews_source_check;
alter table public.product_reviews add constraint product_reviews_source_check
  check (source in ('order', 'bgy') and (order_id is not null or source = 'bgy'));
create unique index if not exists product_reviews_bgy_unique on public.product_reviews (product_id, bgy_review_id)
  where bgy_review_id is not null;

-- Rollback:
-- delete from public.product_reviews where source = 'bgy';
-- drop index if exists product_reviews_bgy_unique;
-- alter table public.product_reviews drop constraint if exists product_reviews_source_check;
-- alter table public.product_reviews drop column if exists bgy_review_id, drop column if exists source;
-- alter table public.product_reviews alter column order_id set not null;
