# e-freight.nl installeren

De database staat al klaar in Supabase (Miltiaccounting). Dit zijn de stappen achter de pc.

## 1. Bestanden online zetten
1. Maak op GitHub een nieuwe repository `e-freight` en upload alle bestanden uit deze map (behalve dit bestand mag ook).
2. Ga naar Vercel → **Add New → Project** → kies `e-freight` → **Deploy** (geen instellingen nodig).
3. In Vercel: **Settings → Domains** → voeg `e-freight.nl` en `www.e-freight.nl` toe. Vercel toont welke DNS-records je bij Hostinger moet invullen.

## 2. Supabase instellen (Miltiaccounting)
1. **Authentication → URL Configuration**
   - Site URL: `https://e-freight.nl`
   - Redirect URLs: `https://e-freight.nl/**` en `https://www.e-freight.nl/**`
2. **Authentication → Emails → SMTP Settings**: zet je eigen mailserver aan (bijv. Hostinger-mail, `noreply@e-freight.nl`). De standaard Supabase-mail verstuurt maar een paar mails per uur.
3. **Edge Functions → Secrets**: `ANTHROPIC_API_KEY` (voor foto's/scans van NOA's).

## 3. Eerste keer gebruiken
1. Ga naar e-freight.nl → **Account aanmaken** → **Bij mijn bedrijf aansluiten** → code `DNATA1`, met milton.remak@shipitnow.nl.
   Je wordt automatisch beheerder van DNATA en platform-admin.
2. Geef collega's de bedrijfscode (tab **Team**). Zij melden zich aan, jij keurt ze goed. Maak daar ook een nieuwe code als je wilt.
3. Nieuwe bedrijven kiezen **Nieuw bedrijf** en zijn direct zelf beheerder.

## Wat er al werkt
- Accounts per bedrijf, aansluiten met bedrijfscode, goedkeuren door beheerder.
- NOA-register volledig (uploaden/uitlezen, chauffeurs, ophalen, tijden, dagrapport, Excel/PDF).
- Collega's tegelijk: wijzigingen verschijnen live; wie een verouderde versie opslaat krijgt een melding in plaats van andermans werk te overschrijven.
- Talen NL/EN/ES/HI per gebruiker (Instellingen).
- Admin (alleen jij): gebruik per bedrijf per maand, prijzen, gratis/actief, conceptfacturen in Milfin (Shipitnow).
- DNATA is gratis. Oude pagina's op milfin.nl (uld.html, noa.html) blijven werken op dezelfde DNATA-gegevens.

## Nog te doen
- ULD-register: de database staat klaar, het scherm volgt zodra uld.html en cmr-blanco.pdf er zijn.
