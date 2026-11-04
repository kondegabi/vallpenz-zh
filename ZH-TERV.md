# ZH-szimuláció – terv

A valódi ZH formátuma: 25 perc, 50 pont.

| Rész | Darab | Pontozás | Max. |
| --- | --- | --- | --- |
| Igaz-hamis | 8 | 3 vagy kevesebb jó: 0; 4 jó: 2; minden további jó +2 (8 jó: 10) | 10 |
| Feleletválasztós (elméleti vagy számítási) | 8 | jó válasz 3 pont | 24 |
| Számítási példa | 4 | jó megoldás 4 pont, elég a végeredmény | 16 |

Az új „ZH-szimuláció” a mostani „Vegyes ZH” helyére kerül. A régi lépésenkénti vegyes gyakorlás „Vegyes gyakorlás” néven megmarad.

## Menet

- **Egy oldalon, három szakaszban** (I. igaz-hamis, II. feleletválasztós, III. számítási), mint a papíron. A kérdések között szabadon lehet ugrálni, és bármelyik válasz módosítható.
- **Visszajelzés csak a beadás után**: közben nem látszik, mi jó.
- **Időzítés:** a fejlécben 25 perces visszaszámláló. Lejáratkor automatikus beadás; a „Beadás” gomb előtte is megnyomható.
- **Kiértékelés:**
  - pontszám szakaszonként és összesen, a fenti szabályokkal;
  - kérdésenként a jó válasz és egy rövid indok: igaz-hamisnál a képlettár forrásmondata, számításinál a gyakorló mód levezetése.
- **Statisztika:** a ZH-eredmények (dátum, pont, idő) a Statisztika oldalra kerülnek, külön blokkba.

## I. Igaz-hamis (8 kérdés)

**Forrás:** egy kézzel összeállított állításbank (kb. 50 állítás), csak a képlettárból. Ezekből jön:

- a „Magyarul:” mondatok;
- a „Csapda”, „Szabály”, „Mikor”, „Mit mutat / Mit mér”, „Korlátai”, „Értékek”, „Diverzifikáció” pontok;
- a 4.3 és a 7.5 táblázata;
- a „Hibák a diákon” javított sorai.

**Az állítások szerkezete:**
- Minden állításnak van igaz és hamis alakja; a ZH véletlenül az egyiket kapja.
- **Az igaz alak** a képlettár mondata, legfeljebb nyelvtanilag kerek mondattá igazítva.
- **A hamis alak** ugyanez egyetlen pontos cserével: N − 1 → N, D₁ → D₀, „nem” ↔ „igen”, piaci ↔ egyedi, 0 ↔ 1 stb.
- Mindegyikhez tartozik egy forráshivatkozás (képletszám és melyik pont); ez csak a kiértékelésben látszik.
- **Teszt:** minden igaz alak kulcsszavas magja szó szerint benne van a képlettárban, a hamis alak pedig pontosan egy helyen tér el.

**Minta** (így fogalmaznám meg):

| # | Igaz alak | Hamis alak | Forrás |
| --- | --- | --- | --- |
| 1 | Múltbeli hozamsorból számolt szórásnál a négyzetes eltérések összegét N − 1-gyel osztjuk. | … N-nel osztjuk. | 2.3, Csapda |
| 2 | Hosszú távon a számtani átlag kicsit felülbecsül, rövid távon a mértani kicsit alulbecsül. | Hosszú távon a mértani átlag becsül kicsit felül, rövid távon a számtani alul. | 1.3, Szabály |
| 3 | Az elemszám növelésével az egyedi kockázat eltűnik, a piaci kockázat megmarad. | … a piaci kockázat eltűnik, az egyedi megmarad. | 3.5 |
| 4 | A kockázatmentes eszköz bétája 0. | … bétája 1. | 4.2, Értékek |
| 5 | Az egyedi (diverzifikálható) kockázatot a piac nem fizeti meg. | … a piac megfizeti. | 4.3 táblázat |
| 6 | A Gordon-modellben a tavaly fizetett osztalékot előbb (1 + g)-vel fel kell szorozni. | … közvetlenül D₁-ként használjuk. | 7.1, Csapda |
| 7 | A hitel költségénél a kötvény kuponkamata nem releváns, csak a mai hozam (YTM). | … a kuponkamat számít, nem a YTM. | 7.3, Csapda |
| 8 | A WACC csak akkor használható diszkontrátaként, ha a projekt kockázata és tőkeszerkezete megegyezik a vállalatéval. | … bármely projektnél használható diszkontrátaként. | 7.4 |

**Sorsolás:** a 8 állítás különböző fejezetekből jön, és az igaz-hamis arány véletlen, nem mindig 4/4.

## II. Feleletválasztós (8 kérdés, mindegyik 4 opcióval)

Háromféle kérdés, keverve. Alapból 3 elméleti, 2 felismerős és 3 számítási, kicsit sorsolva.

**a) Felismerős:** „Melyik képletlánc kell ehhez a feladathoz?” Ugyanaz, mint a gyakorlóban: képletszámok nélkül, rövid feladatszöveggel. Forrása a Feladattípus-felismerő tábla.

**b) Elméleti:** egy kérdés és négy válasz, mindegyik a képlettár mondataiból. Például:
- „Melyik kockázatot fizeti meg a piac?” A válaszok a 4.3 táblázatának nevei.
- „Mit mér a szórás?” Egy jó válasz a képlettárból, három pedig más képletek „Mit mutat / Mit mér” mondataiból.

**c) Számítási:** egy rövid, egyetlen végeredményt kérő feladat a meglévő sablonokból.
- A helyes értéket a mag függvénye adja.
- A három rossz opció elsősorban a sablon tipikus hibáiból jön: D₀ D₁ helyett, N-nel osztás, kupon a YTM helyett, WACC a CAPM helyett stb. Így a rossz válaszok valódi hibás gondolatmenetek eredményei.
- Ha nincs elég tipikus hiba, a hiányzó opció egy közeli, de biztosan rossz érték, például az eredmény ±15–30%-a. Ezt a kiértékelés nem nevezi „tipikus hibának”.
- **Teszt:** a négy opció egymástól is és a helyes értéktől is a tűrésen túl tér el, és a helyes opció a sorrendben egyenletesen oszlik meg.

## III. Számítási példák (4 db)

- Négy különböző témakörből: például hozam/átlag vagy állapotos, CAPM vagy béta, NPV/IRR, tőkeköltség/WACC.
- **Csak a feladat végén kérdezett mennyiségek** kapnak beviteli mezőt (pl. NPV, IRR, döntés), a részlépések nem.
  - Ehhez minden sablonhoz meg kell jelölnöm, mely lépései a „végeredmények”. Ez apró kiegészítés, tesztelve.
- **Ellenőrzés:** ugyanaz a tűrés, mint a gyakorlóban.
- **A ZH-hoz túl hosszú sablonok kimaradnak.** Ilyen például a négylépcsős teljes állapotos lánc. Javaslat: a négy példát a rövidebb sablonokból sorsolom, de a WACC teljes lánc benne maradhat.

## Új kód

- `src/zh/allitasok.ts`: az igaz-hamis állításbank, forráshivatkozással.
- `src/zh/elmeleti.ts`: az elméleti feleletválasztós kérdések.
- `src/zh/sorsolas.ts`: egy ZH összeállítása seedből. Ugyanabból a seedből ugyanaz a ZH, így egy ZH később visszanézhető vagy újraírható.
- `src/zh/pontozas.ts`: a pontozási szabályok, tesztekkel. Például: 3 jó igaz-hamis 0 pont, 4 jó 2, 8 jó 10.
- `src/oldalak/ZhSzimulacio.tsx`: a felület. Mobilon is jó, a számláló mindig látszik.
- A sablonok kapnak egy `vegeredmenyek` mezőt.

## Nyitott kérdések

1. **Számítási példa több kérdéssel:** ha egy példa több mennyiséget kérdez (pl. NPV, IRR és döntés), a 4 pont csak akkor jár, ha mind jó? Vagy arányosan oszlik szét?
   - Javaslat: csak ha mind jó, ahogy a „minden helyes megoldás 4 pont” szól. Ezért a példák többnyire egy-két kérdésesek lesznek.
2. **Kerekítés:** a ZH-n van előírt pontosság (pl. két tizedes százalékban)? Ha nincs, a gyakorló tűrése marad: ±0,05 százalékpont.
3. **Igaz-hamis megfogalmazás:** megfelel a fenti 8 minta stílusa? Ha van régi ZH-kérdésed, abból pontosabban követném a hangnemet.
4. **Vegyes gyakorlás:** maradjon a régi lépésenkénti vegyes mód, vagy elég az új ZH-szimuláció?
