insert into users (id, email, name, role, created_at) values
('usr-admin', 'admin@bluu3.com', 'Admin Bluu3', 'admin', '2026-05-01T08:00:00.000Z'),
('usr-provider', 'provider@bluu3.com', 'Azur Piscines Pro', 'provider', '2026-05-01T08:10:00.000Z'),
('usr-owner-1', 'owner1@bluu3.com', 'Claire Martin', 'owner', '2026-05-01T08:20:00.000Z'),
('usr-owner-2', 'owner2@bluu3.com', 'Julien Moreau', 'owner', '2026-05-01T08:30:00.000Z')
on conflict (id) do update set email = excluded.email, name = excluded.name, role = excluded.role;

insert into pools (id, name, location, owner_id, provider_id, volume, treatment_type, status, created_at) values
('pool-villa-azur', 'Villa Azur', 'Nice', 'usr-owner-1', 'usr-provider', 54, 'salt', 'ok', '2026-05-02T09:00:00.000Z'),
('pool-mas-olivier', 'Mas Olivier', 'Aix-en-Provence', 'usr-owner-1', 'usr-provider', 72, 'chlorine', 'attention', '2026-05-02T09:30:00.000Z'),
('pool-rooftop-cannes', 'Rooftop Cannes', 'Cannes', 'usr-owner-2', 'usr-provider', 38, 'salt', 'ok', '2026-05-02T10:00:00.000Z'),
('pool-bastide-luberon', 'Bastide Luberon', 'Gordes', 'usr-owner-2', 'usr-provider', 92, 'chlorine', 'critical', '2026-05-02T10:30:00.000Z')
on conflict (id) do update set name = excluded.name, location = excluded.location, status = excluded.status;

insert into measurements (id, pool_id, ph, chlorine, temperature, orp, alkalinity, hardness, notes, measured_at) values
('mea-1', 'pool-villa-azur', 7.4, 2.1, 27.2, 710, 92, 210, 'Eau claire.', '2026-05-17T07:40:00.000Z'),
('mea-2', 'pool-villa-azur', 7.3, 2.0, 26.8, 705, 95, 208, 'RAS.', '2026-05-15T08:10:00.000Z'),
('mea-3', 'pool-mas-olivier', 7.8, 1.1, 28.6, 620, 130, 260, 'Chlore bas, correction prévue.', '2026-05-17T08:05:00.000Z'),
('mea-4', 'pool-mas-olivier', 7.7, 1.3, 28.2, 640, 126, 255, 'Surveillance.', '2026-05-14T08:05:00.000Z'),
('mea-5', 'pool-rooftop-cannes', 7.2, 2.5, 29.1, 735, 88, 205, 'Bonne stabilité.', '2026-05-17T09:00:00.000Z'),
('mea-6', 'pool-rooftop-cannes', 7.3, 2.3, 28.7, 728, 90, 203, 'Filtration OK.', '2026-05-13T09:20:00.000Z'),
('mea-7', 'pool-bastide-luberon', 8.0, 0.7, 31.4, 580, 142, 310, 'Valeurs critiques.', '2026-05-17T06:55:00.000Z'),
('mea-8', 'pool-bastide-luberon', 7.9, 0.9, 30.8, 600, 138, 300, 'Intervention urgente.', '2026-05-16T07:30:00.000Z'),
('mea-9', 'pool-villa-azur', 7.4, 2.2, 27.0, 715, 93, 211, 'Contrôle régulier.', '2026-05-12T07:45:00.000Z'),
('mea-10', 'pool-mas-olivier', 7.5, 1.7, 27.8, 680, 108, 240, 'Après traitement.', '2026-05-11T08:25:00.000Z')
on conflict (id) do nothing;

insert into interventions (id, pool_id, provider_id, type, status, scheduled_at, notes, report_url, created_at) values
('int-1', 'pool-villa-azur', 'usr-provider', 'maintenance', 'done', '2026-05-16T10:00:00.000Z', 'Nettoyage ligne d''eau.', null, '2026-05-10T08:00:00.000Z'),
('int-2', 'pool-mas-olivier', 'usr-provider', 'corrective chemistry', 'scheduled', '2026-05-17T14:00:00.000Z', 'Correction pH et chlore.', null, '2026-05-16T09:00:00.000Z'),
('int-3', 'pool-rooftop-cannes', 'usr-provider', 'maintenance', 'scheduled', '2026-05-18T09:30:00.000Z', 'Contrôle filtration.', null, '2026-05-15T12:00:00.000Z'),
('int-4', 'pool-bastide-luberon', 'usr-provider', 'corrective urgent', 'urgent', '2026-05-17T11:30:00.000Z', 'Traitement choc et diagnostic pompe.', null, '2026-05-17T07:15:00.000Z'),
('int-5', 'pool-bastide-luberon', 'usr-provider', 'corrective follow-up', 'scheduled', '2026-05-18T11:00:00.000Z', 'Re-mesure après traitement.', null, '2026-05-17T08:00:00.000Z')
on conflict (id) do nothing;

insert into eco_scores (pool_id, water_score, energy_score, chemistry_score, transport_score, co2_score, global_score, grade)
select id, 82, 80, 76, 84, 82, 80, 'B' from pools
where not exists (select 1 from eco_scores where eco_scores.pool_id = pools.id);

insert into pool_passports (id, pool_id, qr_code_url, equipment_summary, history_summary, created_at)
select 'pass-' || id, id, '/app/passport?pool=' || id, treatment_type || ' treatment, ' || volume || ' m3, filtration standard MVP.', 'Historique MVP des mesures et interventions disponible dans Bluu3.', now()
from pools
on conflict (id) do nothing;
