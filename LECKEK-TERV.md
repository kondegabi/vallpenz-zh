# Leckék – A fázis: terv

A diákat a `forras/zh1/` mappából oldalanként renderelve néztem meg (a PDF oldalszáma = a dia száma). Kódot még nem írtam.

## Közös felépítés

**Útvonalak:** `#/leckek` (navigátor + „Minden együtt” áttekintő), `#/lecke/1` … `#/lecke/12`. A fő menübe új pont: **Leckék**.

**Egy lecke szerkezete**

```
[lecke-navigátor: 1 2 3 … 12]                    [Diás nézet | Bővített nézet]
Cím                                               ┌──────────────┐
┌ keretezett képlet (KaTeX), a mozgatott tag      │ apró címke   │
│ kiemelőszínű                                     │ NAGY SZÁM    │  ← élő kijelző
└──────────────────────────────────────────────── └──────────────┘
[fő csúszka a fejlécben, saját skálával]
┌──────────────── fő grafikon (SVG) ────────────────┐   kulcsszámok (2–4 sor)
│                                                    │   …
└────────────────────────────────────────────────────┘
tanulság-sor (egy kisbetűs mondat, a bemenettől függhet)
[többi csúszka + szám mező]          (mobilon minden csúszka a grafikon alatt)
[Vissza a diás példához]
┌ Próbáld ki ┐ ┌ Próbáld ki ┐ ┌ Próbáld ki ┐   (teljesítéskor zöld pipa)
Kapcsolódik: képletoldal(ak) · gyakorlósablon(ok)
```

**Kódszerkezet**

- `src/leckek/szamitas/lNN.ts`: tiszta függvény, amely egy lecke állapotából előállítja a kijelzett számokat, a görbék pontjait és a „Próbáld ki” feltételeit. Kizárólag a `src/calc` függvényeit hívja, saját pénzügyi képlet nincs benne. Ehhez van a diás teszt.
- `src/leckek/lNN-*.tsx`: csak megjelenítés (SVG + React).
- `src/leckek/ui/`: közös komponensek (B fázis).
- `src/calc/szimulacio.ts`: seedelt normális mintavétel. A meglévő mulberry32-t átköltöztetem a `src/lib`-be, és a gyakorló mód is onnan használja.

**Közös komponensek (B fázis):** tengely (d3-scale, monospace feliratok, mértékegységgel), csúszka + szám mező egy állapotra kötve, árnyékolt sáv, kiemelt pont (húzható változattal), „Próbáld ki” doboz, keretezett képlet fejléc kiemelhető taggal (a meglévő `kiemel.ts` `\htmlClass`-os megoldásával), élő kijelző, tanulság-sor, nézetkapcsoló, panelpár azonos skálával, vízszintes komponenssávok, lecke-navigátor.

**Színek:** a meglévő tokenekre épül. Új: `--fokusz` (meleg borostyán/arany) a lecke fő elemére; másodlagos sorozatok `--akcent` (hideg kék); az összesítő/átlag `--szoveg` (sötét témában fehér, világosban sötét); a halvány szimulált elemek `--szoveg-3` alacsony átlátszósággal.

**Mozgás:** kb. 200 ms-os átmenet (CSS transition / interpolált path). A szimulált vonalak az első megjelenéskor fokozatosan rajzolódnak ki. `prefers-reduced-motion` esetén nincs animáció.

**Új függőség:** `d3-scale`, `d3-shape` (+ típusok). Más d3-modul nem kell.

---

## Leckénként

Jelölés: **[megvan]** = meglévő mag-függvény; **[új]** = új mag-függvény teszttel; **[levezetés: x.y]** = a képlettárban nincs kiírva, a jelzett képletből következik, a lecke ezt ki is írja.

### 1. Számtani, mértani és folytonos átlag (1.2–1.4)

- **Diás nézet**
  - 1. ea 14. dia (Ross 12.4): „1 dollár növekedése” log skálán, tengelyek: „Index ($, log skála)” × „Év vége”. A pálya a beírt árfolyamokból indexálva fut 1 dollárról.
  - Alatta a 30–31. dia kamatozós sora: 1 $ × (1 + 1/m)^m, m = 1, 2, 4, 12, 52, 365, … → e, és a P–T ábra 100-ról indulva.
  - ⚠ A 14. dia öt eszközosztályos idősorát nem tudom visszaadni: az adatok nincsenek a képlettárban (lásd kérdések).
- **Bővített nézet:** két panel azonos skálával. „Kis ingadozás”: 100 → 110 → 105 (1.4 #1 példa). „Nagy ingadozás”: 100 → 200 → 100 (1.3 példa). Mindkettő fölött a számtani, a mértani és a folytonos átlag kijelzője, a különbség sávként.
- **Tengelyek:** év (0…n) × árfolyam (USD); alatta oszlopok: a három átlag (%).
- **Bemenet:** szerkeszthető árfolyamlista (2–6 év), a második panelé is.
- **Mag-függvények**
  - [megvan] `hozamokArfolyamokbol`, `szamtaniAtlag`, `mertaniAtlag`, `folytonosHozam`.
  - [új] `indexPalya(arak)` (P_t / P_0).
  - [új] `diszkretTokesites(r, m, T)` = (1 + r/m)^(mT) [levezetés: 1.4, az e jel magyarázata a jeltáblában; a 30. dián ki is van írva].
- **Diás alap:** 100 → 200 → 100 → számtani 25%, mértani 0%, folytonos 0%.
- **Próbáld ki**
  - Keress pályát, ahol a számtani átlag > 0, a mértani < 0.
  - Mikor egyezik a számtani és a mértani átlag? (Ha minden évben ugyanakkora a hozam.) – C fázisban javítva: a folytonos átlag ilyenkor is ln(1 + r), tehát a három átlag csak 0 hozamnál egyezik.
  - (C fázis) A 31. dia P–T ábrája a felhasználó döntése szerint mértani másolat: három P₀·e^(r_c·T) görbe (alap: 10/20/30%, a középső csúszkával állítható) és a végpontjukig húzott szaggatott húrok, értelmező felirat nélkül.
  - Növeld m-et, amíg az érték 4 tizedesre e lesz.
- **Érvénytelen:** nem pozitív árfolyam → „Az árfolyam csak pozitív lehet (ln és osztás miatt).”

### 2. Normális eloszlás és szigma-szabályok (2.4)

- **Diás nézet:** 1. ea 26. dia (Ross 12.11). Haranggörbe, középen „0”, alatta −3σ … +3σ, a sávhatárok értéke, a 68%/95%/99% zárójelek. A tengelyfelirat: „Hozam (%)”.
- **Bővített nézet**
  - A 25. dia (Ross 12.10) és a 21. dia (12.9) gyakorisági ábrájának élő változata: hisztogram + illesztett haranggörbe, árnyékolt sávok, monospace sávhatár-címkék.
  - ⚠ A valódi éves adatsor nincs meg, ezért a hisztogram csak szimulált (fix seed) lehet, „szemléltető” jelöléssel (lásd kérdések).
- **Bemenet:** E(r), σ.
- **Mag-függvények**
  - [megvan] `szigmaSav`.
  - [új] `normalisSuruseg(x, E, σ)`: ⚠ a képlettárban nincs (lásd kérdések).
- **Diás alap:** 12,0%, 19,8% → 68%: −7,8% … 31,8%; 95%: −27,6% … 51,6%; 99%: −47,4% … 71,4%.
  - ⚠ A dián a görbe közepén **12.1%** áll, a sávhatárok viszont 12,0%-ból jönnek ki. A képlettár 12,0%-ot használ, én is azt.
- **Próbáld ki**
  - Duplázd meg σ-t: a 95%-os sáv szélessége is duplázódik (79,2 → 158,4 százalékpont).
  - Állítsd be úgy, hogy a −1σ határ éppen 0% legyen (E = σ).
- **Érvénytelen:** σ ≤ 0.

### 3. Várható hozam és szórás állapotokból (2.1–2.2)

- **Diás nézet:** 2. ea 11. dia. E(r)–σ(r) sík, × jelekből álló szemléltető pontfelhő (fix seed). Rajta kiemelve a számolt eszköz (σ, E(r)) pontja. Felirat: „nagyobb kockázat, nagyobb várható hozam”.
- **Bővített nézet**
  - Állapotonkénti oszlopok; az oszlop szélessége a valószínűség, magassága a hozam.
  - Vízszintes vonal E(r)-nél, árnyékolt sáv ±σ-nál.
  - Mellette a 2.2-es kidolgozó táblázat élőben (a képlettár oszlopfejlécével).
- **Bemenet:** állapottáblázat, 2–4 sor (valószínűség, hozam).
- **Mag-függvények:** [megvan] `varhatoHozam`, `variancia`, `szoras`, `varianciaLevezetes`.
- **Diás alap:** 20% / 80%; 10% / 30% → E(r) 26%, σ² 0,0064, σ 8%.
- **Próbáld ki**
  - Csak a valószínűségeket mozgasd: σ az 50/50-nél a legnagyobb (két állapotnál).
  - Állítsd be, hogy E(r) = 20% legyen ugyanezekkel a hozamokkal (50/50).
- **Érvénytelen:** a valószínűségek összege ≠ 1 vagy negatív → „A valószínűségek összege most X; 1-nek kell lennie.” A grafikon helyén üzenet jelenik meg.

### 4. Kételemű portfólió (3.1–3.4) – B fázis

- **Diás nézet**
  - 3. ea 11–12. dia. E(r)–σ(r) sík, a két eszköz ×-szel. A súlyhoz tartozó portfóliók görbéje: a felső (hatékony) ág vastag „Hatékony portfóliók” felirattal, az alsó ág vékony.
  - Az „A” pont a minimális szórású portfólió.
  - ⚠ B1–B3: lásd kérdések.
- **Bővített nézet**
  - Korreláció-csúszka a fejlécben (−1 … 0 … +1); a skálapontoknál az adott korrelációhoz tartozó σ(rP) a választott súlynál.
  - A görbe kiemelőszínű, a két eszköz kék pont, a választott súly a kiemelt pont.
  - Mellette kis kovariancia-pontdiagram előjeles negyedekkel. Ez fix seedű, k korrelációjú szimulált minta, „szemléltető” jelöléssel.
- **Bemenet:** a₁ súly (0–100%), k, σ₁, σ₂, E₁, E₂.
- **Mag-függvények**
  - [megvan] `portfolioHozam`, `portfolioVarianciaKorr`.
  - [új] `portfolioGorbe(...)`: mintavételezés a súlyok mentén.
  - [új] `minVarianciaSuly(σ₁, σ₂, k)` = (σ₂² − kσ₁σ₂) / (σ₁² + σ₂² − 2kσ₁σ₂) [levezetés: 3.4, deriválással]. Teszt: k = −1-nél 0,818 (a képlettár 81,8%-a).
  - [új] `korreltMinta(n, k, seed)` a szimulációhoz.
- **Diás alap:** A: 20%, 10%; B: 25%, 45%; k = −1.
  - 50/50: σ 17,5% (2. ea 19. dia; a 3.4-ből számolva).
  - 81,8%: σ = 0, E = 20,9% (képlettár).
- **Próbáld ki**
  - k = −1 mellett keresd meg a σ = 0 súlyt (81,8%).
  - k = +1: a görbe egyenes lesz a két pont között.
  - k = 0: hol van a minimális szórás?
- **Érvénytelen:** σ < 0; k-t a csúszka eleve −1 és 1 közé szorítja.

### 5. Diverzifikáció (3.5, 4.3)

- **Diás nézet:** 3. ea 8. dia. σ(rP) az n függvényében, pontok n-nél. Szaggatott vízszintes vonal a nem diverzifikálható szintnél, kapcsos zárójelek: „diverzifikálható kockázat”, „nem-diverzifikálható (szisztematikus) kockázat”. A görbe végén „(közelítően) hatékony portfólió”.
- **Bővített nézet:** 100 halvány szimulált eszközpálya és egy vastag portfóliópálya. Élő kijelző: „egy eszköz kockázata” kontra „a keverék kockázata”.
- **Bemenet:** n, átlagos σ, átlagos k.
- **Mag-függvények**
  - [új] `egyenloSulyuVariancia(n, σ, k)` = σ²/n + (1 − 1/n)·k·σ² [levezetés: 3.5, egyenlő súlyokkal és egyforma σ-val, k-val]. Teszt: kis n-re egyezik a `portfolioVarianciaN`-nel.
  - [új] az alsó szint σ·√k.
  - [új] `egyFaktorosPalyak(...)` a szimulációhoz (4.1 szerkezete).
- **Diás alap:** σ 42,5%, k 0,6 → n = 2: 38,0% (a dián 38,2%, mert ott a két szórás eltér); alsó szint 32,9%.
- **Próbáld ki**
  - n = 50, k = 0 → kb. 6%; k = 0,6 → kb. 33%.
  - Keresd meg azt az n-t, ahol a diverzifikálható rész 1 százalékpont alá esik.
- **Érvénytelen:** ha k < −1/(n − 1), a variancia negatív lenne → „n elemnél ilyen alacsony átlagos korreláció nem lehetséges.”
- ⚠ A 9–10. diák Ross-számai: lásd kérdések.

### 6. Tőkeallokációs és tőkepiaci egyenes (3.5, 5.4)

- **Diás nézet**
  - 3. ea 14. dia: r_f-ből szaggatott egyenesek r_i, r_j, r_k pontokon át; r_k a lefelé menő.
  - 15. dia: tőkepiaci egyenes, érintési pont r_M „Piaci portfólió”, E(r_M) és σ(r_M) a tengelyeken.
- **Bővített nézet:** CAL r_f-ből. A w csúszkával a pont végigmegy az egyenesen; 100% fölött (hitel) a vonal szaggatottra vált. Kijelző: E(rP), σ(rP).
- **Bemenet:** w (0–200%), r_f, E(r_A), σ(r_A).
- **Mag-függvények**
  - [megvan] `kevertPortfolio` (E és β).
  - [új] `kevertSzoras(w, σ_A)` = w·σ_A [levezetés: 3.4, σ_f = 0 és cov = 0 mellett].
  - [új] `erintesiPortfolio(...)`: a görbe azon pontja, ahol (E − r_f)/σ maximális [levezetés: 3.5, a CML definíciója: „érintő”]. A görbe a 4. lecke két eszközéből jön.
- **Diás alap:** E(r_A) 20%, r_f 8%; w = 25% → 11%; w = 150% → 26%.
  - ⚠ σ(r_A) nincs a képlettárban (lásd kérdések).
- **Próbáld ki**
  - w = 150%: E(rP) = 26%, a pont az egyenes szaggatott részén van.
  - w = 25%: E(rP) = 11%.
- **Érvénytelen:** σ_A ≤ 0.

### 7. Karakterisztikus egyenes és kockázatfelbontás (4.1–4.3)

- **Diás nézet**
  - 3. ea 19. dia: (r_M, r_i) pontfelhő, a tengelyeken pöttyözött haranggörbék, „Karakterisztikus egyenes” β_i-vel és az „1” egységháromszöggel.
  - Alatta: r_i = β_i r_M + ε_i; k_{M,ε} = 0; σ²(r_i) = β²σ²(r_M) + σ²(ε_i).
  - A 21. dia felbontó ábrája szövegként (piaci / egyedi kockázat).
  - A 16–18. dia idősora és eloszlása kis panelként; a 22. dia hídja egy kis SML-panel, ahová β_i átvetül → link a 8. leckére.
- **Bővített nézet**
  - Pontfelhő a regressziós egyenessel.
  - Vízszintes sávok β = 0,5 / 1 / 2 esetére: „a piac +1% → az eszköz +β%”.
  - Kockázatfelbontó sáv: β²σ²(r_M) és σ²(ε).
- **Bemenet:** β, σ(r_M), σ(ε).
- **Mag-függvények**
  - [megvan] `kockazatFelbontas` (4.3).
  - [megvan] `betaCov` + `kovariancia`/`variancia` egyenlő valószínűséggel a mintára (4.2).
  - [új] `normalisMinta(seed)`.
- **Alapértékek:** β 1,2, σ(r_M) 20%, σ(ε) 25%. **Szemléltető, nem diás**, így jelölve.
- **Próbáld ki**
  - Növeld σ(ε)-t: a becsült meredekség lényegében nem változik, az egyedi rész nő.
  - σ(ε) = 0: minden pont az egyenesen van, teljes = piaci.
  - β = 0: vízszintes egyenes.

### 8. SML és árazottság (5.1–5.3) – B fázis

- **Diás nézet**
  - 3. ea 23. / 4. ea 16. dia: SML, r_f a tengelymetszetben, r_M a β = 1-nél „Piaci portfólió” felirattal, E(r_M) szaggatott vetülettel, mellette a CAPM-képlet.
  - A 4. ea 13–14. dia meredekség-ábrái (A: 0,075, B: 0,0667): lásd kérdések.
- **Bővített nézet**
  - SML kiemelőszínnel; körülötte béta-sávonként szimulált hozamfelhő (fix seed, szemléltető).
  - Húzható eszközpontok; a vonal fölött zöld „alulárazott”, alatta piros „túlárazott”.
  - Kijelző: a húzott pont CAPM szerinti hozama és meredeksége.
- **Bemenet:** r_f, E(r_M), eszközök (β, E(r)) húzással vagy mezőben.
- **Mag-függvények:** [megvan] `capm`, `mrp`, `meredekseg`, `arazas`. A húzás csak a képernyő-koordinátát váltja vissza β-ra és E(r)-re.
- **Diás alap:** r_f 2%, E(r_M) 8,5%; G (1,6; 12%) → CAPM 12,4%, túlárazott; H (0,8; 9%) → 7,2%, alulárazott; SML-meredekség 6,5%.
- **Próbáld ki**
  - Húzd G-t az SML-re (12,4%).
  - Tedd H-t helyesen árazottá (7,2%).
  - Hol metszi az SML a β = 1-et? (E(r_M))

### 9. Osztalékmodell érzékenysége (7.1)

- **Diás nézet:** ⚠ ehhez nincs ábra a diákon (4. ea 25–27. dia csak szöveg), lásd kérdések. Javaslat: egyszerű vonaldiagram a dia jelöléseivel (r_E, g, D_0, P_0), bővített elemek nélkül.
- **Bővített nézet:** két kis grafikon azonos g-tengellyel.
  - r_E(g) = D_0(1 + g)/P_0 + g.
  - P_0(g) = D_0(1 + g)/(r_E − g), függőleges szaggatott aszimptotával g = r_E-nél.
- **Mag-függvények:** [megvan] `d1`, `gordonRE`, `gordonAr`.
- **Diás alap:** D_0 4, P_0 60, g 6% → D_1 4,24, r_E 13,07% (a javított érték). A második grafikon r_E-je alapból ez, így g = 6%-nál P_0 = 60.
- **Próbáld ki**
  - Közelítsd g-t r_E-hez: P_0 elszáll („nagyon érzékeny g-re”).
  - Duplázd D_0-t: hogyan változik r_E?
- **Érvénytelen:** g ≥ r_E → „g ≥ r_E esetén a modell nem értelmezett (a nevező nem pozitív).”

### 10. NPV-profil és IRR (6.1–6.2) – B fázis

- **Diás nézet:** ⚠ nincs ábra a diákon (4. ea 19–21. dia csak szöveg). Javaslat: NPV–r görbe a dia jelöléseivel (CF_0 … CF_n, r, NPV, IRR), egyszerű stílusban.
- **Bővített nézet**
  - NPV-görbe, az IRR-pont kiemelve, függőleges vonal a választott r-nél.
  - Élő NPV-kijelző; a nulla fölötti és alatti rész halványan színezve.
- **Bemenet:** pénzáramlások (szerkeszthető lista), r.
- **Mag-függvények**
  - [megvan] `npv`, `irr`, `npvDontes`.
  - [új] `npvProfil(cf, rMin, rMax, lepes)`.
- **Diás alap:** −165 000; 63 120; 70 800; 91 080; r 12% → NPV 12 627,41; IRR 16,13%.
- **Próbáld ki**
  - Mekkora r-nél vált az NPV negatívba? (≈ IRR)
  - Növeld CF_0-t úgy, hogy 12%-nál az NPV 0 legyen.
- **Érvénytelen:** nincs előjelváltás a pénzáramlásokban → „Nincs IRR: a pénzáramlások előjele nem vált.” A görbe ilyenkor is megjelenik, de IRR-pont nélkül.

### 11. WACC összetétele (7.3–7.4)

- **Diás nézet:** ⚠ nincs ábra a diákon (5. ea 7–9. dia csak szöveg). Javaslat: halmozott oszlop a dia képletének két tagjával.
- **Bővített nézet**
  - Vízszintes sávok: E/V × r_E és D/V × r_D × (1 − T_C), a részek értékével a sor végén.
  - Mellette szürkén az adópajzs nélküli változat, kiemelve a különbség.
  - Egysoros megjegyzés: a valóságban r_E függ a tőkeszerkezettől (MM), ez a lecke ezt nem modellezi.
- **Bemenet:** E/V, r_E, r_D, T_C (D/V = 1 − E/V).
- **Mag-függvények:** [megvan] `wacc`, `rdAdozasUtan`.
- **Diás alap:** E/V 0,8576, r_E 13,18%, r_D 11%, T_C 21% → WACC 12,54%.
- **Próbáld ki:** T_C = 0 → a WACC 12,87%-ra nő, ami +0,33 százalékpont (= D/V × r_D × T_C).

### 12. WACC vagy projekt-CAPM (7.5)

- **Diás nézet:** 5. ea 13. dia (Ross 14.1).
  - SML r_f = 7-ből, „= 8%” meredekségcímkével; vízszintes „WACC = 15%” vonal; β_firm = 1,0.
  - A (0,6; 14) és B (1,2; 16) pont.
  - A „téves elutasítás” és a „téves elfogadás” tartomány árnyékolva.
- **Bővített nézet:** ugyanez kiemelőszínű SML-lel, húzható projektpontokkal. Élő kijelző: hány projektnél tévedne a WACC-szabály.
- **Bemenet:** r_f, MRP, cég-β (→ WACC), projektek (β, E(r)).
- **Mag-függvények:** [megvan] `capm`, `hozamDontes`.
- **Diás alap:** WACC 15%; A: 11,8% → elfogadni; B: 16,6% → elutasítani.
- **Próbáld ki**
  - Helyezz egy projektet a „téves elutasítás” tartományba.
  - Helyezz egyet a „téves elfogadás” tartományba.
  - Állítsd a projekt bétáját 1-re: ott a két szabály egyezik.

---

## Áttekintő („Minden együtt”)

Kis élő előnézetek (diás nézet, nem interaktív) a függőségi térkép sorrendjében: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 12, mellékágon 9 → 11 és 10.

## Új mag-függvények összesítve (mind teszttel)

| Függvény | Hol | Honnan |
| --- | --- | --- |
| `indexPalya` | hozam.ts | 1.1 |
| `diszkretTokesites` | hozam.ts | levezetés: 1.4 (e jel), 30. dia |
| `normalisSuruseg` | kockazat.ts | ⚠ nincs a képlettárban |
| `portfolioGorbe`, `minVarianciaSuly` | portfolio.ts | 3.1, 3.4 (levezetés) |
| `egyenloSulyuVariancia` | portfolio.ts | levezetés: 3.5 |
| `kevertSzoras`, `erintesiPortfolio` | portfolio.ts | levezetés: 3.4, 3.5 |
| `npvProfil` | npv.ts | 6.1 |
| `normalisMinta`, `korreltMinta`, `egyFaktorosPalyak` | szimulacio.ts | szemléltető szimuláció (4.1 szerkezete) |
