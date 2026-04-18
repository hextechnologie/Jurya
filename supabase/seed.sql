-- ============================================================
-- Jurya — Seed data (run AFTER schema.sql + jurya_domain_model.sql)
-- Single script — copy-paste into Supabase SQL Editor and run
-- ============================================================

-- 1. Insert concours
INSERT INTO public.concours (type, grade, "intitulé", coefficient_oral, "durée_épreuve_minutes", rubrique_jury, country, organisme_organisateur)
VALUES
(
  'territorial', 'B', 'Rédacteur territorial', 3.0, 20,
  '{"exposé_motivation":{"durée_minutes":5,"description":"Exposé du candidat sur son parcours et sa motivation pour exercer les fonctions de rédacteur territorial."},"entretien_jury":{"durée_minutes":15,"description":"Questions du jury portant sur les connaissances administratives, la culture territoriale, les missions du cadre d''emplois et la mise en situation professionnelle."}}'::jsonb,
  'FR', 'CNFPT / CDG'
),
(
  'territorial', 'A', 'Attaché territorial', 4.0, 25,
  '{"exposé_parcours":{"durée_minutes":5,"description":"Présentation par le candidat de son parcours, ses compétences et sa motivation."},"entretien_jury":{"durée_minutes":20,"description":"Échange avec le jury sur les aptitudes du candidat à exercer les missions d''attaché, ses connaissances de l''environnement territorial, le management et la conduite de projets."}}'::jsonb,
  'FR', 'CNFPT / CDG'
),
(
  'état', 'A', 'IRA – Instituts Régionaux d''Administration (concours externe)', 4.0, 25,
  '{"mise_en_situation_collective":{"durée_minutes":null,"description":"Épreuve collective de mise en situation : les candidats interagissent en groupe sur un cas pratique."},"entretien_individuel":{"durée_minutes":25,"description":"Entretien de motivation et de mise en situation avec le jury portant sur le parcours, les compétences, la connaissance de l''administration et les qualités relationnelles."}}'::jsonb,
  'FR', 'DGAFP'
),
(
  'CRFPA', 'N/A', 'CRFPA – Grand oral', 3.0, 45,
  '{"exposé":{"durée_minutes":15,"description":"Exposé sur un sujet portant sur les libertés et droits fondamentaux, tiré au sort parmi deux sujets."},"entretien_jury":{"durée_minutes":30,"description":"Discussion avec le jury sur l''exposé, puis échange sur le parcours, la motivation pour la profession d''avocat et la déontologie."}}'::jsonb,
  'FR', 'CNB / Universités'
),
(
  'grande_école', 'N/A', 'HEC Paris – Oral d''admission', 8.0, 30,
  '{"entretien_personnalité":{"durée_minutes":30,"description":"Entretien de personnalité avec un jury de trois personnes. Le candidat présente son parcours, ses expériences, sa personnalité et sa motivation. Le jury évalue la maturité, l''ouverture d''esprit, la capacité d''analyse et les qualités humaines."}}'::jsonb,
  'FR', 'HEC Paris'
);

-- 2. Insert concours_sessions 2026 (references concours by intitulé)
INSERT INTO public.concours_sessions (concours_id, year, country, inscription_open_date, inscription_close_date, "épreuves_écrites_date", "épreuves_orales_start_date", "épreuves_orales_end_date", "résultats_date", source_url, notes)
VALUES
(
  (SELECT id FROM public.concours WHERE "intitulé" = 'Rédacteur territorial'),
  2026, 'FR',
  NULL, NULL, NULL, NULL, NULL, NULL,
  'https://www.cig929394.fr/liste-des-concours/',
  'Dates 2026 non encore publiées par les CDG.'
),
(
  (SELECT id FROM public.concours WHERE "intitulé" = 'Attaché territorial'),
  2026, 'FR',
  NULL, NULL, NULL, NULL, NULL, NULL,
  'https://www.cig929394.fr/calendrier',
  'Dates 2026 non encore publiées par les CDG.'
),
(
  (SELECT id FROM public.concours WHERE "intitulé" LIKE 'IRA%'),
  2026, 'FR',
  NULL, NULL, NULL, NULL, NULL, NULL,
  'https://www.fonction-publique.gouv.fr/score',
  'Dates 2026 non encore publiées par la DGAFP.'
),
(
  (SELECT id FROM public.concours WHERE "intitulé" LIKE 'CRFPA%'),
  2026, 'FR',
  NULL, NULL, NULL, NULL, NULL, NULL,
  'https://cnb.avocat.fr',
  'Écrit début septembre, oral novembre-décembre. Dates 2026 à confirmer.'
),
(
  (SELECT id FROM public.concours WHERE "intitulé" LIKE 'HEC%'),
  2026, 'FR',
  NULL, NULL, '2026-04-22'::date, '2026-06-15'::date, '2026-07-06'::date, '2026-07-08'::date,
  'https://www.concours-bce.com/',
  'Écrits : 22-29 avril. Oraux : 15 juin – 6 juillet. Résultats : 8-9 juillet 2026.'
);
