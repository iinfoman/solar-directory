-- Run schema.sql first, then this seed file
-- Paste both into the Supabase SQL editor

insert into installers (name, city, province, blurb, services, verified, years_in_business, min_system_size_kw, max_system_size_kw, phone, email, website)
values
(
  'Meridian Solar Engineering',
  'Johannesburg',
  'Gauteng',
  'Johannesburg''s most trusted C&I solar contractor. Over a decade delivering high-performance rooftop and ground-mount systems to manufacturers, logistics hubs, and retail parks across Gauteng.',
  array['Commercial Rooftop','Ground-Mount C&I','Battery Storage','O&M Contracts'],
  true, 12, 50, 5000,
  '+27 11 234 5678', 'info@meridiansolar.co.za', 'https://meridiansolar.co.za'
),
(
  'SunPower Africa',
  'Cape Town',
  'Western Cape',
  'Cape Town''s premier solar installer for commercial and industrial clients. Specialists in large-format PV, energy storage, and grid-tied systems for the hospitality, retail, and agri sectors.',
  array['Commercial PV','Industrial Systems','Energy Storage','Solar Finance Advisory'],
  true, 9, 30, 10000,
  '+27 21 456 7890', 'projects@sunpowerafrica.co.za', 'https://sunpowerafrica.co.za'
),
(
  'Beacon Energy Solutions',
  'Durban',
  'KwaZulu-Natal',
  'KwaZulu-Natal''s leading commercial solar contractor. We design and build cost-effective solar systems for warehouses, shopping centres, and cold storage facilities across the province.',
  array['Commercial Solar','Cold Storage Optimisation','Wheeling Agreements','Power Purchase Agreements'],
  true, 7, 100, 8000,
  '+27 31 567 8901', 'hello@beaconenergy.co.za', 'https://beaconenergy.co.za'
),
(
  'AfriSun Energy',
  'Sandton',
  'Gauteng',
  'Sandton-based C&I solar developer with a 400+ MW portfolio. We handle projects from feasibility through to grid connection and long-term operations across Southern Africa.',
  array['C&I Development','Grid Connection','Power Purchase Agreements','Operations & Maintenance'],
  true, 11, 500, 50000,
  '+27 10 789 0123', 'projects@afrisun.co.za', 'https://afrisun.co.za'
),
(
  'Sol-Tech Engineers',
  'Cape Town',
  'Western Cape',
  'Engineering-first solar company founded by electrical engineers. We specialise in technically complex C&I projects: high-voltage systems, transformer-coupled arrays, and custom BMS integration.',
  array['HV Solar Engineering','BMS Integration','Transformer Systems','Technical Due Diligence'],
  true, 11, 200, 20000,
  '+27 21 890 1234', 'eng@soltechsa.co.za', 'https://soltechsa.co.za'
),
(
  'Cape Verde Solar',
  'George',
  'Western Cape',
  'Garden Route specialists servicing the agri, hospitality, and light industrial sectors. We design systems for load-shedding resilience and long-term energy cost reduction.',
  array['Agricultural Solar','Hospitality Systems','Diesel Offset','Remote Monitoring'],
  true, 8, 20, 2000,
  '+27 44 345 6789', 'info@capeVerdesolar.co.za', null
),
(
  'Coastal Solar KZN',
  'Durban',
  'KwaZulu-Natal',
  'Durban-based installer with a reputation for clean, professional C&I installations. We work with property owners and facilities managers to maximise solar returns with minimal disruption.',
  array['Rooftop Commercial','Carport Solar','Battery Backup','Meter & Grid Compliance'],
  true, 6, 50, 4000,
  '+27 31 678 9012', 'info@coastalsolarkzn.co.za', 'https://coastalsolarkzn.co.za'
),
(
  'Bright Future Solar',
  'Pretoria',
  'Gauteng',
  'Pretoria-based commercial installer serving government buildings, schools, and SME factories. Competitive pricing, fast delivery, and a strong track record on public-sector projects.',
  array['Government Solar','School & Campus Systems','SME Installations','Net Metering'],
  false, 5, 10, 1500,
  '+27 12 456 7890', 'sales@brightfuture.co.za', 'https://brightfuturesolar.co.za'
),
(
  'Highveld Energy',
  'Johannesburg',
  'Gauteng',
  'Young and hungry Joburg installer building a portfolio in the mid-market commercial space. Focused on transparent quoting, fast turnaround, and quality workmanship on every job.',
  array['Commercial PV','Battery Backup','System Upgrades','Energy Audits'],
  false, 3, 20, 1000,
  '+27 11 890 1234', 'info@highveldenergy.co.za', null
),
(
  'SolarTech SA',
  'Bellville',
  'Western Cape',
  'Bellville-based solar contractor serving the Cape Metro with no-fuss, well-priced commercial installations. Strong partnerships with Tier-1 panel manufacturers and local electrical contractors.',
  array['Rooftop Commercial','Inverter & Storage','Compliance Certificates','Annual Maintenance'],
  false, 4, 15, 800,
  '+27 21 234 5678', 'info@solartechsa.co.za', 'https://solartechsa.co.za'
);
