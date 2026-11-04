# Új fejezet hozzáadása

A 2. ZH anyaga folyamatosan érkezik (eddig: tőkeszerkezet; hátravan: tőkebevonás, készpénz- és likviditáskezelés, osztalékpolitika). Ez a leírás azt mutatja meg, hogyan lesz a `keplettar.md` egy új szakaszából új rész az appban.

## Melyik ZH-hoz tartozik

Az app egy, de a két ZH anyaga külön van. A fejléc legördülő menüje (1. ZH / 2. ZH / Összes anyag) minden oldalra hat.

- **Forrás:** a diák a `forras/zh1/` és a `forras/zh2/` mappában vannak.
- **Képlet:** a `keplettar.md` rész-fejléce dönti el: ami a `# 2. ZH anyaga` sor után áll, az a 2. ZH-é. Új 2. ZH-s fejezetet ide, a 8. után írj, folytatólagos számozással (9., 10. …), így a képletszám sosem ütközik. Kézi címke nem kell.
- **Felismerő sor:** a lánc utolsó képletének ZH-ja.
- **Hibák a diákon:** a `ZH` oszlop.
- **Lecke:** a `kepletek` lista képleteiből.
- **Feladattípus:** a `CSALADOK` listában a család `kor` mezője (`src/gyakorlas/sablonok/index.ts`).
- **Igaz-hamis és elméleti kérdés:** a `forras` mező fejezete.

A `src/__tests__/zh-korok.test.ts` ujjlenyomattal őrzi, hogy az 1. ZH tartalma nem változik: ha a képlettár 1–7. fejezete vagy az 1. ZH sorsolása módosul, a teszt elbukik.

Röviden: **a képletek kódmódosítás nélkül megjelennek**. A gyakorló feladat (sablon) és a teszt viszont kód. Az igaz-hamis állítás és az elméleti kérdés egy-egy adatbejegyzés.

## 1. A képlettár (kód nélkül)

Írd be a `keplettar.md`-be a meglévő fejezetek mintájára:

```text
## 8. Tőkeszerkezet

Egy-két mondatos bevezető.

### 8.1 A képlet neve

` ` `latex
(a képlet)
` ` `

**Magyarul:** a képlet egy mondatban.

| Jel | Jelentés |
| --- | --- |
| `x` | mit jelent |

- **Mikor:** …
- **Kell hozzá:** 7.4
- **Csapda:** …
- **Forrás:** Tőkeszerkezet, 22. dia
- **Példa (6. ea):** a dia példája számokkal
```

A latex-blokk kerítése három backtick (itt szóközzel elválasztva, hogy ne zárja le ezt a blokkot).

A szemináriumi példa címkéje `Példa (szem. 3)` vagy `Példa (szem. adó 3)`; a diasor nélküli forrásokat a `Forrás:` pont nevezi meg. A zárójeles forrás a címkében mindig tesztet kér.

- A fejezetszám és a képletszám lehet kétjegyű is (8.1, 10.12). A beolvasó, a szövegbeli hivatkozás, a link (`#/k/10.12`) és a felismerő lánc is kezeli; ezt a `src/content/bovites.test.ts` ellenőrzi.
- Ennyivel már megjelenik a Képletek oldalon, az oldalsávban, és saját képletoldalt kap a „Kell hozzá” / „Erre épül” kapcsolatokkal.
- **A térkép** (`## A képletek térképe`) kézzel írt szöveg: ide is írd be az új fejezetet.
- **Felismerő tábla:** új sor a `## Feladattípus-felismerő` táblázat végére; az azonosítója automatikusan F15, F16… lesz. A láncban a képletszámokat írd (pl. `5.1 → 8.1`).
- **Hibák a diákon:** új sor a táblázatba, a Státusz oszlopba „számítással igazolva: …” vagy „nyitott – kérdezd meg az oktatót”.

## 2. Kötelező kiegészítések (kevés kód, a tesztek jelzik, ha hiányzik)

| Mit | Hol | Melyik teszt kéri |
| --- | --- | --- |
| A jeltábla minden sorához kiemelési minta (melyik LaTeX-részlet villanjon fel) | `src/content/jelek.ts` | `content.test.ts`: „minden jeltáblának van megfeleltetése” |
| Minden diás „**Példa (N. ea):**” ponthoz számolóteszt `<id> <címke>` néven | `src/calc/__tests__/` | `lefedettseg.test.ts` |
| Az új számolófüggvények (csak a képlettár képletei) | `src/calc/*.ts` | a diás teszt |
| A „Kell hozzá” kapcsolatok, ha a képlettár szövegéből nem derülnek ki | `src/content/fuggosegek.ts` | `content.test.ts` (csak létező képletre mutathat) |
| A felismerő tábla sorainak száma | `src/content/content.test.ts` (most 22) | a teszt maga |
| Új felismerő sornál a „kérdezett mennyiség” szavai (hogy a feladat szövege ne árulja el) | `src/gyakorlas/__tests__/felismeres.test.ts`, `KERDEZETT` | a felismerő-teszt |

## 3. Gyakorló feladat (sablon, kód)

Egy új feladattípus egy `Sablon` a `src/gyakorlas/sablonok/` mappában. A meglévők (pl. `wacc.ts`) a minta. Kell hozzá:

1. **`general`**: véletlen, de kézzel számolható adatok; az **`ervenyes`** szűri ki a határeseteket (pl. β = 1, ahol a tipikus hibák egybeesnének a helyessel).
2. **`szoveg`**: legalább **4 szövegváltozat** (`valtozat: 'k0' … 'k3'`), eltérő szereplővel, mondatsorrenddel, és a 4.-ben zavaró adattal. A `keretbe()` segít (`kozos.ts`). A szöveg ne nevezze meg a kérdezett mennyiséget a kérdéseken kívül.
3. **`felismeresek`**: a helyes felismerő sor és 3 zavaró sor.
4. **`lepesek`**: lépésenként egy képlet (`formulaId`), a `src/calc` függvényeivel számolva.
   - A ZH-ban kérdezett számszerű lépéshez legalább **3 `tipikusHibak`** kell (valódi rossz gondolatmenet, célzott üzenettel). Lehetőleg legyen a helyesnél kisebb és nagyobb is.
   - Nyitott diahibánál a `nyitott` mezőben jöhet a szintén elfogadott érték.
5. **`zh`**: mely lépések a kérdezett végeredmények. Ha nincs megadva, a sablon nem kerül a ZH-ba. A kézzel nem számolható változatot (pl. iterációs YTM) a **`halado`** jelöli; az a ZH-ban nem jön.
6. **`diasPeldak`**: a dia példái a dián szereplő eredménnyel (a teszt ellenőrzi).
7. Regisztrálás: `src/gyakorlas/sablonok/index.ts` → `SABLONOK`. Új témakörnél még a `Csalad` típus (`tipusok.ts`) és a `CSALADOK` lista (`index.ts`); ez az egyetlen kódmódosítás, ami nem adat.

Utána a meglévő tesztek automatikusan lefutnak az új sablonra is:
- diás példák;
- tipikus hibák;
- 4 szövegváltozat;
- a felismerés nem árulja el a láncot;
- a ZH-opciók helye kiegyenlített.

## 4. Igaz-hamis és elméleti kérdések (adat)

- **Igaz-hamis a képlettárból:** `src/zh/allitasok.ts`. Az `igaz` alak a képlettár mondata, a `hamis` egyetlen pontos csere, amely valódi tévedést fog meg. A `kulcs` a képlettár szó szerinti részlete (a teszt ellenőrzi), a `forras` a képletszám.
- **Saját igaz-hamis a jegyzeteidből:** `src/zh/sajat-allitasok.ts`. Ugyanaz a formátum, `kulcs` nélkül; az egy-csere szabályt ugyanúgy ellenőrzi a teszt.
- **Elméleti feleletválasztós:** `src/zh/elmeleti.ts`. A jó válasz a `kulcs` szerint a képlettárból jön. A rossz opciók hossza igazodjon a jóéhoz: a teszt szerint a jó válasz legfeljebb az esetek negyedében lehet a leghosszabb, és sehol sem lehet 1,5-szer olyan hosszú, mint a legrövidebb rossz.

## 5. Valódi ZH-minták

Régi ZH-t a `forras/zh-minta/` mappába tehetsz, a mappa `README.md`-jében leírt formátumban (sablon: `_sablon.md`). A címkék (`{fejezet: 8.1}`) alapján lehet majd összevetni a valódi és a generált ZH-k fejezet- és típuseloszlását.

## 6. Ellenőrzés

```bash
npm test
npm run build
```

Ha minden zöld, az új fejezet használható. Ha egy teszt elbukik, a hibaüzenet megnevezi a hiányzó darabot (pl. melyik jeltáblasornak nincs mintája, melyik diás példának nincs tesztje).
