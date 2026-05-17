insert into users (id, email, name, role, created_at) values
('usr-admin', 'admin@bluu3.com', 'Admin Bluu3', 'admin', '2026-05-01T08:00:00.000Z'),
('usr-provider', 'provider@bluu3.com', 'Azur Piscines Pro', 'provider', '2026-05-01T08:10:00.000Z'),
('usr-owner-1', 'owner1@bluu3.com', 'Claire Martin', 'owner', '2026-05-01T08:20:00.000Z'),
('usr-owner-2', 'owner2@bluu3.com', 'Julien Moreau', 'owner', '2026-05-01T08:30:00.000Z')
on conflict (id) do update set email = excluded.email, name = excluded.name, role = excluded.role;

insert into properties (id, name, address, city, country, owner_id, provider_id, status, created_at) values
('prop-villa-azur', 'Villa Azur', '12 chemin des Pins', 'Nice', 'France', 'usr-owner-1', 'usr-provider', 'active', '2026-05-02T08:00:00.000Z'),
('prop-mas-olivier', 'Mas Olivier', '88 route de la Treille', 'Aix-en-Provence', 'France', 'usr-owner-1', 'usr-provider', 'active', '2026-05-02T08:20:00.000Z'),
('prop-domaine-luberon', 'Domaine Luberon', '4 traverse des Lavandes', 'Gordes', 'France', 'usr-owner-2', 'usr-provider', 'attention', '2026-05-02T08:40:00.000Z')
on conflict (id) do update set name = excluded.name, address = excluded.address, city = excluded.city, country = excluded.country, owner_id = excluded.owner_id, provider_id = excluded.provider_id, status = excluded.status;

insert into pools (id, property_id, name, location, owner_id, provider_id, volume, treatment_type, status, created_at) values
('pool-villa-azur', 'prop-villa-azur', 'Bassin principal Villa Azur', 'Nice', 'usr-owner-1', 'usr-provider', 54, 'salt', 'ok', '2026-05-02T09:00:00.000Z'),
('pool-mas-olivier', 'prop-mas-olivier', 'Piscine Mas Olivier', 'Aix-en-Provence', 'usr-owner-1', 'usr-provider', 72, 'chlorine', 'attention', '2026-05-02T09:30:00.000Z'),
('pool-rooftop-cannes', 'prop-villa-azur', 'Rooftop Cannes', 'Cannes', 'usr-owner-2', 'usr-provider', 38, 'salt', 'ok', '2026-05-02T10:00:00.000Z'),
('pool-bastide-luberon', 'prop-domaine-luberon', 'Bastide Luberon', 'Gordes', 'usr-owner-2', 'usr-provider', 92, 'chlorine', 'critical', '2026-05-02T10:30:00.000Z')
on conflict (id) do update set property_id = excluded.property_id, name = excluded.name, location = excluded.location, owner_id = excluded.owner_id, provider_id = excluded.provider_id, volume = excluded.volume, treatment_type = excluded.treatment_type, status = excluded.status;

insert into measurements (id, pool_id, ph, chlorine, temperature, orp, alkalinity, hardness, notes, measured_at) values
('mea-1', 'pool-villa-azur', 7.4, 2.1, 27.2, 710, 92, 210, 'Eau claire.', '2026-05-17T07:40:00.000Z'),
('mea-2', 'pool-villa-azur', 7.3, 2.0, 26.8, 705, 95, 208, 'RAS.', '2026-05-15T08:10:00.000Z'),
('mea-3', 'pool-villa-azur', 7.4, 2.2, 27.0, 715, 93, 211, 'Contrôle régulier.', '2026-05-12T07:45:00.000Z'),
('mea-4', 'pool-mas-olivier', 7.8, 1.1, 28.6, 620, 130, 260, 'Chlore bas, correction prévue.', '2026-05-17T08:05:00.000Z'),
('mea-5', 'pool-mas-olivier', 7.7, 1.3, 28.2, 640, 126, 255, 'Surveillance.', '2026-05-14T08:05:00.000Z'),
('mea-6', 'pool-mas-olivier', 7.5, 1.7, 27.8, 680, 108, 240, 'Après traitement.', '2026-05-11T08:25:00.000Z'),
('mea-7', 'pool-rooftop-cannes', 7.2, 2.5, 29.1, 735, 88, 205, 'Bonne stabilité.', '2026-05-17T09:00:00.000Z'),
('mea-8', 'pool-rooftop-cannes', 7.3, 2.3, 28.7, 728, 90, 203, 'Filtration OK.', '2026-05-13T09:20:00.000Z'),
('mea-9', 'pool-bastide-luberon', 8.0, 0.7, 31.4, 580, 142, 310, 'Valeurs critiques.', '2026-05-17T06:55:00.000Z'),
('mea-10', 'pool-bastide-luberon', 7.9, 0.9, 30.8, 600, 138, 300, 'Intervention urgente.', '2026-05-16T07:30:00.000Z'),
('mea-11', 'pool-bastide-luberon', 7.7, 1.2, 29.8, 625, 130, 292, 'Amélioration après traitement.', '2026-05-15T07:15:00.000Z'),
('mea-12', 'pool-rooftop-cannes', 7.2, 2.4, 28.9, 732, 89, 204, 'Contrôle pré-weekend.', '2026-05-11T09:10:00.000Z')
on conflict (id) do update set ph = excluded.ph, chlorine = excluded.chlorine, temperature = excluded.temperature, orp = excluded.orp, alkalinity = excluded.alkalinity, hardness = excluded.hardness, notes = excluded.notes, measured_at = excluded.measured_at;

insert into operational_checks (id, pool_id, provider_id, cover_ok, filtration_ok, safety_ok, cleanliness_ok, status, notes, checked_at) values
('chk-1', 'pool-villa-azur', 'usr-provider', true, true, true, true, 'ok', 'Ouverture validée.', '2026-05-17T07:45:00.000Z'),
('chk-2', 'pool-villa-azur', 'usr-provider', true, true, true, true, 'ok', 'Fermeture complète.', '2026-05-16T18:20:00.000Z'),
('chk-3', 'pool-mas-olivier', 'usr-provider', true, true, true, false, 'attention', 'Margelles à nettoyer.', '2026-05-17T08:15:00.000Z'),
('chk-4', 'pool-mas-olivier', 'usr-provider', true, true, true, true, 'ok', 'Après nettoyage.', '2026-05-15T11:10:00.000Z'),
('chk-5', 'pool-rooftop-cannes', 'usr-provider', true, true, true, true, 'ok', 'RAS rooftop.', '2026-05-17T09:05:00.000Z'),
('chk-6', 'pool-rooftop-cannes', 'usr-provider', true, true, true, true, 'ok', 'Contrôle filtration OK.', '2026-05-13T09:30:00.000Z'),
('chk-7', 'pool-bastide-luberon', 'usr-provider', false, false, true, false, 'critical', 'Filtration et couverture à reprendre.', '2026-05-17T07:05:00.000Z'),
('chk-8', 'pool-bastide-luberon', 'usr-provider', true, false, true, true, 'attention', 'Pompe à surveiller.', '2026-05-16T07:45:00.000Z')
on conflict (id) do update set cover_ok = excluded.cover_ok, filtration_ok = excluded.filtration_ok, safety_ok = excluded.safety_ok, cleanliness_ok = excluded.cleanliness_ok, status = excluded.status, notes = excluded.notes, checked_at = excluded.checked_at;

insert into interventions (id, pool_id, provider_id, type, status, scheduled_at, notes, report_url, created_at) values
('int-1', 'pool-villa-azur', 'usr-provider', 'maintenance', 'done', '2026-05-16T10:00:00.000Z', 'Nettoyage ligne d''eau.', null, '2026-05-10T08:00:00.000Z'),
('int-2', 'pool-mas-olivier', 'usr-provider', 'corrective chemistry', 'scheduled', '2026-05-17T14:00:00.000Z', 'Correction pH et chlore.', null, '2026-05-16T09:00:00.000Z'),
('int-3', 'pool-rooftop-cannes', 'usr-provider', 'maintenance', 'scheduled', '2026-05-18T09:30:00.000Z', 'Contrôle filtration.', null, '2026-05-15T12:00:00.000Z'),
('int-4', 'pool-bastide-luberon', 'usr-provider', 'corrective urgent', 'urgent', '2026-05-17T11:30:00.000Z', 'Traitement choc et diagnostic pompe.', null, '2026-05-17T07:15:00.000Z'),
('int-5', 'pool-bastide-luberon', 'usr-provider', 'corrective follow-up', 'scheduled', '2026-05-18T11:00:00.000Z', 'Re-mesure après traitement.', null, '2026-05-17T08:00:00.000Z')
on conflict (id) do update set type = excluded.type, status = excluded.status, scheduled_at = excluded.scheduled_at, notes = excluded.notes, report_url = excluded.report_url;

insert into eco_scores (pool_id, water_score, energy_score, chemistry_score, transport_score, co2_score, global_score, grade)
select 'pool-villa-azur', 92, 88, 96, 94, 90, 91, 'A'
where not exists (select 1 from eco_scores where pool_id = 'pool-villa-azur')
union all
select 'pool-mas-olivier', 73, 74, 58, 76, 74, 70, 'C'
where not exists (select 1 from eco_scores where pool_id = 'pool-mas-olivier')
union all
select 'pool-rooftop-cannes', 90, 91, 94, 92, 89, 91, 'A'
where not exists (select 1 from eco_scores where pool_id = 'pool-rooftop-cannes')
union all
select 'pool-bastide-luberon', 50, 48, 36, 42, 40, 45, 'D'
where not exists (select 1 from eco_scores where pool_id = 'pool-bastide-luberon');

insert into pool_passports (id, pool_id, qr_code_url, equipment_summary, history_summary, created_at) values
('pass-pool-villa-azur', 'pool-villa-azur', '/app/passport?pool=pool-villa-azur', 'Traitement au sel, 54 m3, filtration sable.', 'Historique stable avec suivi régulier.', '2026-05-17T09:35:00.000Z'),
('pass-pool-mas-olivier', 'pool-mas-olivier', '/app/passport?pool=pool-mas-olivier', 'Traitement chlore, 72 m3, filtration standard.', 'Historique sous surveillance chimique.', '2026-05-17T09:36:00.000Z'),
('pass-pool-rooftop-cannes', 'pool-rooftop-cannes', '/app/passport?pool=pool-rooftop-cannes', 'Traitement au sel, 38 m3, bassin rooftop.', 'Historique stable.', '2026-05-17T09:37:00.000Z'),
('pass-pool-bastide-luberon', 'pool-bastide-luberon', '/app/passport?pool=pool-bastide-luberon', 'Traitement chlore, 92 m3, pompe à surveiller.', 'Historique avec valeurs critiques récentes.', '2026-05-17T09:38:00.000Z')
on conflict (id) do update set qr_code_url = excluded.qr_code_url, equipment_summary = excluded.equipment_summary, history_summary = excluded.history_summary;

insert into reports (id, pool_id, type, title, period_start, period_end, pdf_url, status, created_at) values
('rep-1', 'pool-villa-azur', 'monthly', 'Rapport mensuel Villa Azur', '2026-05-01', '2026-05-31', '/api/exports/monthly?pool=pool-villa-azur', 'ready', '2026-05-17T10:00:00.000Z'),
('rep-2', 'pool-mas-olivier', 'monthly', 'Rapport mensuel Mas Olivier', '2026-05-01', '2026-05-31', '/api/exports/monthly?pool=pool-mas-olivier', 'draft', '2026-05-17T10:10:00.000Z'),
('rep-3', 'pool-bastide-luberon', 'intervention', 'Rapport intervention Bastide Luberon', '2026-05-17', '2026-05-17', '/api/exports/intervention?pool=pool-bastide-luberon', 'ready', '2026-05-17T10:20:00.000Z')
on conflict (id) do update set title = excluded.title, pdf_url = excluded.pdf_url, status = excluded.status;
