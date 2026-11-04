# Valódi ZH-minták

Ide másolhatsz be régi ZH-kat, fájlonként egyet (pl. `2025-osz-zh1.md`). Az app minden `.md` fájlt beolvas ebből a mappából. Kivétel ez a leírás és a `_` kezdetű fájlok (pl. `_sablon.md`).

A legegyszerűbb, ha lemásolod a `_sablon.md`-t, átnevezed, és kitöltöd.

## Formátum

```text
---
cim: 2025/26 ősz, 1. ZH (A csoport)
forras: honnan van (pl. saját jegyzet, Teams)
---

## Igaz-hamis

1. [I] Az igaz állítás szövege. {fejezet: 2.1}
2. [H] A hamis állítás szövege. {fejezet: 4.2}

## Feleletválasztós

1. A kérdés szövege? {fejezet: 4.3, tipus: elméleti}
   - [ ] rossz válasz
   - [x] jó válasz
   - [ ] rossz válasz
   - [ ] rossz válasz

## Számítási

1. A példa szövege, a kérdéssel együtt. {fejezet: 7.4}
   - WACC = 12,54%
```

## Szabályok

- A három rész címe pontosan `## Igaz-hamis`, `## Feleletválasztós`, `## Számítási`.
- **Igaz-hamis:** a sor elején `[I]` (igaz) vagy `[H]` (hamis).
- **Feleletválasztós:** az opciók behúzott `- [ ]` sorok. Pontosan egy legyen `- [x]`, ez a jó válasz.
- **Számítási:** a megoldások behúzott `- ` sorok. Több kérdezett érték esetén több sor, `címke = érték` alakban (pl. `- NPV = 12 627,41` és `- döntés = elfogadjuk`).
- **Címkék a sor végén, kapcsos zárójelben** (nem kötelező, de az összevetéshez kellenek):
  - `fejezet`: a képlet száma, pl. `7.4`;
  - `tipus`: a feleletválasztósnál `elméleti` vagy `számítási`.
- Ha a beolvasás hibát talál (pl. nincs jó válasz), a teszt megnevezi a tételt.
