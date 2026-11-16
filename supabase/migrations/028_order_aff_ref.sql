-- Kode affiliate Buat Soal (BGY) yang dibawa pembeli dari link teman (?aff=KODE).
-- Disimpan di pesanan, lalu ditempel ke link aktivasi BGY (&ref=KODE) supaya komisi tercatat otomatis.
alter table public.orders add column if not exists aff_ref text;
alter table public.orders drop constraint if exists orders_aff_ref_check;
alter table public.orders add constraint orders_aff_ref_check check (aff_ref is null or aff_ref ~ '^[A-Z0-9][A-Z0-9-]{2,14}$');

-- Rollback:
-- alter table public.orders drop constraint if exists orders_aff_ref_check;
-- alter table public.orders drop column if exists aff_ref;
