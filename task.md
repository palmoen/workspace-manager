# Workspace Manager (WM) – MVP: QR-registrering for kontorstoler

## Kontekst
Kontorcompaniet er møbelleverandør til Norwegian. Vi skal gjennomføre en fysisk
befaring hos Norwegian (én avdeling) der alle kontorstoler skal merkes med en
QR-etikett og registreres med produktdata, garantiinfo og status.

Dette er en **stram MVP** med under én ukes tidsramme. Bygg kun det som er
beskrevet under – ikke legg til dashboard, kundeportal, servicemeldinger,
innlogging utover PIN, eller andre "nice to have"-funksjoner uten å spørre
først.

## Tech stack
- Next.js (App Router), TypeScript
- PostgreSQL via Prisma ORM (bruk Supabase eller Neon som hosting – anbefal en)
- Hosting: Vercel
- Domene: wm.kontorcompaniet.no (subdomene, settes opp senere via CNAME)
- QR-generering: bibliotek som støtter logo-embedding i senter av koden
  (f.eks. qr-code-styling), feilkorreksjonsnivå H
- Ingen ekstern UI-kit nødvendig – enkelt, mobilvennlig, rent design

## Datamodell (Prisma-skjema)

```
Tenant
  id, navn, logoUrl
  -- kun 1 rad i MVP, men modelleres for flere senere

Kunde
  id, tenantId, navn        -- f.eks. "Norwegian"

Lokasjon
  id, kundeId, navn         -- f.eks. "Fornebu, avd. X"

Produsent
  id, navn                  -- delt katalog, ikke tenant-låst

Modell
  id, produsentId, navn

Asset
  id                        -- permanent, = asset_id trykt på etikett/QR
  status                    -- enum: ubrukt | registrert | trenger_service | kassert
  tenantId
  kundeId                   -- nullable, satt ved registrering
  lokasjonId                -- nullable
  modellId                  -- nullable
  kjopsdato                 -- nullable
  garantiMaaneder            -- nullable
  opprettet, sistEndret
```

Viktig: `Asset`-rader opprettes UBUNDET til kunde (poolen). Kunde/lokasjon/modell/
kjøpsdato/garanti settes først når asset registreres via scan. Slett aldri en
Asset-rad, selv ved status "kassert" – historikk skal bevares.

## Sider / funksjonalitet

### 1. `/asset/[id]`
- Hvis Asset med denne id ikke finnes eller status = "ubrukt": vis
  registreringsskjema (produsent, modell, kjøpsdato, garantimåneder, kunde,
  lokasjon). Produsent/modell er søkbare nedtrekkslister med mulighet for å
  legge til ny direkte i skjemaet uten å forlate siden.
- Hvis Asset allerede er registrert: vis dataene, med mulighet for å redigere
  (samme skjema, forhåndsutfylt).
- Lagring krever en enkel delt PIN-kode (miljøvariabel), sjekket via en kort
  sesjon/cookie – ikke fullt brukersystem.
- Denne siden er den QR-koden peker til: `https://wm.kontorcompaniet.no/asset/{id}`

### 2. `/admin/print`
PIN-beskyttet (samme PIN som over).
- **Batch-generering:** generer N nye, tomme Asset-rader (status "ubrukt") og
  vis en utskriftsvennlig side med QR-etiketter for print (én per Asset).
- **Reprint:** søkefelt for å slå opp en eksisterende asset_id og skrive ut
  etiketten på nytt (samme QR/id, ingen ny rad opprettes).

### 3. Etikett-design (kritisk, ferdig spesifisert – ikke gjett)
- Fysisk størrelse: 50x40mm, printes via nettleserens print-dialog mot en
  Zebra ZD421 (ingen direkte ZPL-integrasjon i MVP).
- Innhold er stående (portrett), men skal roteres 90° i print-CSS slik at
  papirrullen kan mates liggende gjennom skriveren.
- QR-kode med Kontorcompaniet-logoens sirkel-symbol plassert i senter
  (kvadratisk "hvit sone" bak symbolet så QR-mønsteret ikke berører det
  direkte). Feilkorreksjonsnivå H.
- Asset-ID i lesbar klartekst under QR-koden (monospace, tydelig).
- Alt i sort/hvit (direkte termisk print, ingen fargebånd).
- Logo-fil (SVG, full farge) ligger i prosjektmappen som
  `Kontorcompaniet_Horisontal.svg` – bruk kun sirkel-symbolet (de to `st1`/
  `st2`-path-elementene), konvertert til ren sort, IKKE hele ordmerket, i
  selve QR-embedding. Ordmerket kan brukes andre steder (f.eks. sidetopp) i
  original farge.

## Eksplisitt utenfor scope (ikke bygg dette nå)
- Dashboard/oversikt over alle assets
- Kundevisning/portal for Norwegian
- Servicemeldinger/reklamasjonsskjema fra sluttbruker
- Offline-støtte
- Multi-domene per tenant / white-labeling
- Fakturering eller betalingsløsning
- Fullverdig brukersystem med roller (kun delt PIN i MVP)

## Arbeidsmåte
1. Lag en kort plan (filstruktur, migrasjonssteg, rekkefølge) og vis meg den
   før du begynner å skrive kode.
2. Sett opp prosjekt, Prisma-skjema og kjør første migrasjon.
3. Bygg `/asset/[id]` inkludert PIN-sjekk.
4. Bygg `/admin/print` (batch-generering + reprint).
5. Bygg etikett-komponenten/print-CSS nøyaktig som spesifisert over.
6. Gi meg en kort oppsummering av hva som gjenstår for å deploye
   (miljøvariabler, database-URL, Vercel-oppsett) – ikke deploy noe uten at
   jeg har bekreftet verdiene.
