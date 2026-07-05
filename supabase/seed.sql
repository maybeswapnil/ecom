-- Placeholder catalog seed — mirrors Print Company v2.dc.html mockup content.
-- Pexels stock images stand in until real photographs are supplied (SPEC.md open item).

-- Prices in paise: mockup bases were 2400/3900/6200/9800 (rupees) for A4/A3/A2/A1,
-- with finish upcharges of 0/0/600/800 rupees for Black/White/Oak/Walnut.

with p as (
  insert into products (slug, title, description, story, tags, images, status)
  values
    ('winter-range', 'Winter Range', 'The range after first snow, late afternoon.', null,
     array['place:Zanskar, Ladakh','year:2023','landscape','bw'],
     '[{"url": "https://images.pexels.com/photos/14916502/pexels-photo-14916502.jpeg?auto=compress&cs=tinysrgb&w=1400", "alt": "Winter Range — framed photographic print"}]'::jsonb,
     'live'),
    ('pangong', 'Pangong', 'Bare mountains meeting still, dark water.', null,
     array['place:Ladakh','year:2022','landscape','colour'],
     '[{"url": "https://images.pexels.com/photos/14916496/pexels-photo-14916496.jpeg?auto=compress&cs=tinysrgb&w=1400", "alt": "Pangong — framed photographic print"}]'::jsonb,
     'live'),
    ('monsoon-sea', 'Monsoon Sea', 'The Arabian Sea, flat and silver before rain.', null,
     array['place:Gokarna, Karnataka','year:2021','landscape','bw'],
     '[{"url": "https://images.pexels.com/photos/1769085/pexels-photo-1769085.jpeg?auto=compress&cs=tinysrgb&w=1400", "alt": "Monsoon Sea — framed photographic print"}]'::jsonb,
     'live'),
    ('the-peacock', 'The Peacock', 'Crossing the ramparts at closing time.', null,
     array['place:Amber Fort, Jaipur','year:2022','landscape','colour'],
     '[{"url": "https://images.pexels.com/photos/1837172/pexels-photo-1837172.jpeg?auto=compress&cs=tinysrgb&w=1400", "alt": "The Peacock — framed photographic print"}]'::jsonb,
     'live'),
    ('the-swan', 'The Swan', 'White against black water, early morning.', null,
     array['place:Udaipur','year:2023','portrait','bw'],
     '[{"url": "https://images.pexels.com/photos/1837168/pexels-photo-1837168.jpeg?auto=compress&cs=tinysrgb&w=1400", "alt": "The Swan — framed photographic print"}]'::jsonb,
     'live'),
    ('two-at-dusk', 'Two at Dusk', 'Figures on the ghats as the light went.', null,
     array['place:Varanasi','year:2024','portrait','colour'],
     '[{"url": "https://images.pexels.com/photos/6022540/pexels-photo-6022540.jpeg?auto=compress&cs=tinysrgb&w=1400", "alt": "Two at Dusk — framed photographic print"}]'::jsonb,
     'live'),
    ('valley-road', 'Valley Road', 'The road down, cut into the mountainside.', null,
     array['place:Khardung La, Ladakh','year:2023','portrait','colour'],
     '[{"url": "https://images.pexels.com/photos/17615049/pexels-photo-17615049.jpeg?auto=compress&cs=tinysrgb&w=1400", "alt": "Valley Road — framed photographic print"}]'::jsonb,
     'live'),
    ('cargo', 'Cargo', 'Stacked containers, rust and primary red.', null,
     array['place:Chennai Harbour','year:2021','portrait','colour'],
     '[{"url": "https://images.pexels.com/photos/3704162/pexels-photo-3704162.jpeg?auto=compress&cs=tinysrgb&w=1400", "alt": "Cargo — framed photographic print"}]'::jsonb,
     'live'),
    ('leaf-bed', 'Leaf Bed', 'The forest floor, printed in silver grey.', null,
     array['place:Munnar, Kerala','year:2020','portrait','bw'],
     '[{"url": "https://images.pexels.com/photos/4305470/pexels-photo-4305470.jpeg?auto=compress&cs=tinysrgb&w=1400", "alt": "Leaf Bed — framed photographic print"}]'::jsonb,
     'live'),
    ('cassette-i', 'Cassette I', 'A study in plastic, tape and open sky.', null,
     array['place:Studio, Bengaluru','year:2020','portrait','colour'],
     '[{"url": "https://images.pexels.com/photos/1760826/pexels-photo-1760826.jpeg?auto=compress&cs=tinysrgb&w=1400", "alt": "Cassette I — framed photographic print"}]'::jsonb,
     'live'),
    ('cassette-ii', 'Cassette II', 'The same tape, let go.', null,
     array['place:Studio, Bengaluru','year:2020','portrait','colour'],
     '[{"url": "https://images.pexels.com/photos/4261203/pexels-photo-4261203.jpeg?auto=compress&cs=tinysrgb&w=1400", "alt": "Cassette II — framed photographic print"}]'::jsonb,
     'live')
  returning id, slug
),
sizes (size_label, base_paise, weight_g, width_mm, height_mm) as (
  values
    ('A4', 240000, 600, 210, 300),
    ('A3', 390000, 900, 300, 420),
    ('A2', 620000, 1400, 420, 590),
    ('A1', 980000, 2200, 590, 840)
),
finishes (frame_finish, upcharge_paise) as (
  values
    ('Black', 0),
    ('White', 0),
    ('Oak', 60000),
    ('Walnut', 80000)
)
insert into product_variants
  (product_id, sku, size_label, frame_finish, price_paise, stock_qty, weight_g, width_mm, height_mm, active)
select
  p.id,
  'PC-' || upper(p.slug) || '-' || sizes.size_label || '-' || upper(left(finishes.frame_finish, 3)),
  sizes.size_label,
  finishes.frame_finish,
  sizes.base_paise + finishes.upcharge_paise,
  12,
  sizes.weight_g,
  sizes.width_mm,
  sizes.height_mm,
  true
from p
cross join sizes
cross join finishes;
