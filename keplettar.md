# Vállalati pénzügyek II – ZH képlettár

Oct 10, 2026 · @Gabi

Az 1. ZH (1–5. előadás, videós összefoglaló) és a 2. ZH (eddig: tőkeszerkezet) összes képlete egy helyen: mit jelent minden jel, mikor kell használni, milyen korábbi eredmény kell hozzá, és egy diáról vett példa. A példák eredményeit újraszámoltam; ahol a dia hibás, a végén jelzem.

## A képletek térképe

```text
Hozam, E(r), σ (1–2.)
   └─> Kovariancia, korreláció (3.2–3.3)
          ├─> Portfólió E(rP), σ(rP) (3.1, 3.4, 3.5)
          └─> Béta β, βP (4.2 / 4.4)
                 └─(+ rf és E(rM) vagy MRP)─> CAPM elvárt hozam (5.1–5.4)
                        └─> Saját tőke költsége rE (7.2)  <── Osztalékmodell: D0, P0, g (7.1)
                               └─> WACC (7.4)  <── rD × (1 − Tc) (7.3: YTM, adókulcs)
                                      │        <── Súlyok E/V, D/V (piaci értékből)
                                      └─> NPV, IRR (6.1–6.2), diszkontráta = WACC
                                          (eltérő kockázatú projektnél: CAPM a projekt β-jával, 7.5)
```

A bal oldali oszlop a kockázat-hozam alapok (1–3. fejezet), a középső a CAPM-től az NPV-ig tartó fő lánc, a jobb oldali a WACC további bemenetei. Ha a projekt kockázata eltér a cégétől, az NPV diszkontrátája nem a WACC, hanem a projekt bétájával számolt CAPM (7.5).

A 2. ZH anyaga (8. fejezet):

```text
Súlyok, rD, rE (7.4 piaci értékekkel)
   └─> Tőkeköltség tökéletes piacon rA (8.1, MM I.) ──> Eszközök bétája βA (8.2)
          └─> Saját tőke hozama rE (8.3, MM II.)
Adó (TC):
   Adómegtakarítás (8.4 örökjáradék, 8.5 véges) ──> Vállalatérték VL (8.6)
          └─(− pénzügyi nehézségek)─> Választásos elmélet (8.10)
   rE adóval (8.7) ──> Módosított WACC* (8.8)
```

A tökéletes piacon (8.1–8.3) a tőkeszerkezet nem hat az értékre; az adó (8.4–8.9) és a pénzügyi nehézségek (8.10) miatt igen.

# 1. ZH anyaga

## 1. Hozamszámítás és átlagok

A hozam két részből áll: a kapott pénzből (osztalék) és az árfolyam változásából. Több év hozamát háromféleképpen lehet átlagolni, és ezek nem ugyanazt mutatják.

### 1.1 Teljes (százalékos) hozam

```latex
r = \frac{D_{t+1}}{P_t} + \frac{P_{t+1} - P_t}{P_t} = \frac{P_{t+1} + D_{t+1}}{P_t} - 1
```

**Magyarul:** a hozam egyenlő az osztalékhozam és az árfolyamváltozás hozamának összegével; vagyis a záró árfolyam plusz az osztalék, osztva a kezdő árfolyammal, mínusz egy.

| Jel | Jelentés |
| --- | --- |
| `P_t` | árfolyam az időszak elején |
| `P_t+1` | árfolyam az időszak végén |
| `D_t+1` | az időszak alatt kapott osztalék |
| `D_t+1 / P_t` | osztalékhozam |
| `(P_t+1 − P_t) / P_t` | árfolyamváltozás hozama |
| `r` | az időszak teljes hozama |

- **Mikor:** egyetlen időszak tényleges hozamát kérdezik, és adott a kezdő és záró árfolyam (esetleg osztalék)
- **Példa (1. ea):** kezdő árfolyam 50 USD, osztalék 2 USD, záró árfolyam 53 USD → osztalékhozam 4%, árfolyamhozam 6%, teljes hozam 10%

### 1.2 Számtani átlaghozam

```latex
\bar{r}_{a} = \frac{r_1 + r_2 + \dots + r_n}{n}
```

**Magyarul:** az évek hozamait összeadjuk, és elosztjuk az évek számával.

| Jel | Jelentés |
| --- | --- |
| `r̄_a` | számtani átlaghozam |
| `r_1 … r_n` | az egyes évek hozamai (1.1-ből) |
| `n` | az évek (hozamok) száma |

- **Mit mutat:** mennyi volt a hozam egy átlagos évben; előrejelzéshez ezt használjuk, ha ismert
- **Kell hozzá:** az egyes évek hozamai (1.1-ből, ha csak árfolyamok adottak)

### 1.3 Mértani (geometriai) átlaghozam

```latex
\bar{r}_{g} = \sqrt[n]{(1 + r_1)(1 + r_2)\cdots(1 + r_n)} - 1
```

**Magyarul:** az „egy plusz hozam” szorzókat összeszorozzuk, vesszük az n-edik gyökét, majd kivonunk egyet.

| Jel | Jelentés |
| --- | --- |
| `r̄_g` | mértani (geometriai) átlaghozam |
| `r_1 … r_n` | az egyes évek hozamai (1.1-ből) |
| `n` | az évek (hozamok) száma, a gyök kitevője |

- **Mit mutat:** az átlagos, kamatos kamatozással számolt éves hozamot az adott időszakban
- **Szabály:** hosszú távon a számtani átlag kicsit felülbecsül, rövid távon a mértani kicsit alulbecsül
- **Példa (1. ea):** 100 → 200 → 100 USD: r1 = 100%, r2 = −50%, számtani átlag 25%, mértani átlag 0%. A mértani mutatja helyesen, hogy semmit nem kerestünk

### 1.4 Folytonos (logaritmikus) hozam

```latex
P_T = P_0 \, e^{r_c T} \quad\Rightarrow\quad r_c = \frac{1}{T}\ln\frac{P_T}{P_0}
```

**Magyarul:** a folytonos hozam a záró és kezdő árfolyam hányadosának természetes logaritmusa, osztva az évek számával.

| Jel | Jelentés |
| --- | --- |
| `P_0`, `P_T` | kezdő és záró árfolyam |
| `T` | eltelt idő (év) |
| `r_c` | folytonos hozam |
| `e` | Euler-szám (≈ 2,71828), a kamatozás határértéke, ha a tőkésítés gyakorisága végtelen |

- **Fontos tulajdonság:** a folytonos hozamok összeadhatók, ezért az átlaguk csak a kezdő és záró árfolyamtól függ: (1/T) × ln(P\_T / P\_0)
- **Példa (2. ea):** 100 → 110 → 105: r\_c1 = ln(110/100) = 9,53%, r\_c2 = ln(105/110) = −4,65%, átlaguk 2,44%. Ugyanitt a diszkrét számtani átlag 2,73%, a mértani 2,47%
- **Példa (2. ea):** 100 → 50 → 75 → 37,5 → 56,25: diszkrét számtani átlag 0, mértani −13,4%, folytonos átlag (1/4) × ln(56,25/100) = −14,4%

## 2. Várható hozam és szórás

Két helyzet van, és a feladat szövege eldönti, melyik: **jövőbeli állapotok valószínűségekkel** (fellendülés/recesszió táblázat) vagy **múltbeli hozamsor** („az elmúlt 4 évben”). A képlet nevezője más a két esetben.

### 2.1 Várható hozam (állapotokból)

```latex
E(r) = p_1 r_1 + p_2 r_2 + \dots + p_n r_n = \sum_{i} p_i r_i
```

**Magyarul:** minden gazdasági állapot hozamát megszorozzuk az állapot valószínűségével, és ezeket összeadjuk.

| Jel | Jelentés |
| --- | --- |
| `p_i` | az i-edik állapot valószínűsége (összegük 1) |
| `r_i` | a hozam abban az állapotban |
| `E(r)` | várható hozam |

- **Kockázati prémium:** E(r) − r\_f, vagyis a várható hozam mínusz a kockázatmentes hozam
- **Példa (2. ea):** 50% / 50% valószínűség, A: 10% / 30%, B: 70% / −20% → E(rA) = 20%, E(rB) = 25%. r\_f = 8% mellett a prémium 12% és 17%

### 2.2 Variancia és szórás (állapotokból)

```latex
\sigma^2(r) = \sum_{i} p_i \,\big(r_i - E(r)\big)^2 \qquad \sigma(r) = \sqrt{\sigma^2(r)}
```

**Magyarul:** minden állapotban kiszámoljuk, mennyivel tér el a hozam a várhatótól, ezt négyzetre emeljük, megszorozzuk a valószínűséggel és összeadjuk; a szórás ennek négyzetgyöke.

| Jel | Jelentés |
| --- | --- |
| `σ²(r)` | variancia |
| `σ(r)` | szórás, a variancia négyzetgyöke |
| `p_i` | az i-edik állapot valószínűsége |
| `r_i` | a hozam abban az állapotban |
| `E(r)` | várható hozam (2.1) |

- **Kell hozzá:** E(r) a 2.1-ből. A sorrend mindig: várható hozam → eltérések → négyzetek × valószínűség → összeg → gyök
- **Mit mér:** a kockázatot (volatilitást): egy átlagos évben mennyivel tér el a tényleges hozam az átlagtól
- **Példa (2. ea):** 20% / 80% valószínűség, A: 10% / 30% → E(rA) = 26%, σ² = 0,2 × (−0,16)² + 0,8 × 0,04² = 0,0064, σ = 8%

A dia a kidolgozást táblázatban végzi, érdemes a ZH-n is így:

| valósz. (1) | r (2) | r − E(r) (3) | (r − E(r))² (4) | (1) × (4) |
| --- | --- | --- | --- | --- |
| 20% | 10% | −16% | 0,0256 | 0,00512 |
| 80% | 30% | 4% | 0,0016 | 0,00128 |
|  |  |  | **σ² =** | **0,0064** |

### 2.3 Historikus (múltbeli) szórás

```latex
\sigma^2(r) = \frac{(r_1 - \bar{r})^2 + (r_2 - \bar{r})^2 + \dots + (r_N - \bar{r})^2}{N - 1}
```

**Magyarul:** a múltbeli hozamok átlagtól vett eltérésének négyzeteit összeadjuk, és a megfigyelések számánál eggyel kisebb számmal osztjuk.

| Jel | Jelentés |
| --- | --- |
| `σ²(r)` | a múltbeli hozamok varianciája |
| `r_1 … r_N` | a múltbeli (évenkénti) hozamok |
| `r̄` | átlaghozam (1.2) |
| `N` | a megfigyelések (évek) száma |

- **Csapda:** itt N − 1-gyel osztunk, nem N-nel és nem valószínűséggel szorzunk
- **Kell hozzá:** az átlaghozam (1.2)
- **Példa (1. ea):** 10%, 12%, 3%, −9% → átlag 4%, négyzetes eltérések összege 0,027, σ² = 0,027 / 3 = 0,009, σ = 9,49%

### 2.4 Szigma-szabályok (normális eloszlás)

| Jel | Jelentés |
| --- | --- |
| `E(r)` | várható hozam (a normális eloszlás közepe) |
| `σ` | a hozam szórása, a sávok szélessége |

- A hozamok kb. 68%-a esik a várható érték ± 1σ sávjába, 95%-a a ± 2σ, 99%-a a ± 3σ sávba
- **Példa (jegyzet, Ross 12.11):** nagyvállalati részvények 12,0% átlag, 19,8% szórás → 68%-os sáv −7,8% … 31,8%, 95%-os sáv −27,6% … 51,6%

## 3. Portfólió: hozam, kovariancia, korreláció, szórás

A portfólió várható hozama egyszerű súlyozott átlag, a szórása viszont nem: függ attól, mennyire mozognak együtt az elemek. Ez a diverzifikáció lényege.

### 3.1 Portfólió várható hozama

```latex
E(r_P) = a_1 E(r_1) + a_2 E(r_2) + \dots + a_n E(r_n), \qquad \sum_i a_i = 1
```

**Magyarul:** a portfólió várható hozama az elemek várható hozamának a befektetett arányokkal súlyozott átlaga.

| Jel | Jelentés |
| --- | --- |
| `a_i` | az i-edik eszköz súlya (a pénz hányad része került bele) |
| `E(r_i)` | az i-edik eszköz várható hozama (2.1) |
| `E(r_P)` | a portfólió várható hozama |

- **Két út ugyanarra:** vagy állapotonként kiszámolod a portfólió hozamát, és abból várható értéket veszel, vagy az elemek várható hozamát súlyozod. Az eredmény azonos
- **Negatív súly:** hitelfelvétel vagy short. 100 USD saját pénz + 50 USD hitel → részvény súlya 1,5, kockázatmentes súly −0,5
- **Példa (2. ea):** 60% A (15%) + 40% B (10%) → E(rP) = 13%

### 3.2 Kovariancia

```latex
\mathrm{cov}(r_1, r_2) = E\Big[\big(r_1 - E(r_1)\big)\big(r_2 - E(r_2)\big)\Big] = \sum_i p_i \big(r_{1,i} - E(r_1)\big)\big(r_{2,i} - E(r_2)\big)
```

**Magyarul:** minden állapotban összeszorozzuk a két eszköz eltérését a saját várható hozamától, megszorozzuk a valószínűséggel, és összeadjuk.

| Jel | Jelentés |
| --- | --- |
| `cov(r_1, r_2)` | a két eszköz hozamának kovarianciája |
| `p_i` | az i-edik állapot valószínűsége |
| `r_1,i, r_2,i` | a két eszköz hozama az i-edik állapotban |
| `E(r_1), E(r_2)` | a két eszköz várható hozama (2.1) |

- **Mit mutat:** előjelével az együttmozgás irányát (pozitív: egy irányba, negatív: ellentétesen)
- **Kell hozzá:** mindkét eszköz várható hozama (2.1) és állapotonkénti eltérései (2.2 3. oszlopa)

### 3.3 Korreláció

```latex
k_{1,2} = \frac{\mathrm{cov}(r_1, r_2)}{\sigma(r_1)\,\sigma(r_2)}, \qquad -1 \le k_{1,2} \le 1
```

**Magyarul:** a korreláció a kovariancia osztva a két szórás szorzatával; így egy −1 és +1 közé eső, mértékegység nélküli szám lesz.

| Jel | Jelentés |
| --- | --- |
| `k_1,2` | a két hozam korrelációja |
| `cov(r_1, r_2)` | kovariancia (3.2) |
| `σ(r_1), σ(r_2)` | a két eszköz szórása (2.2) |

- **Kell hozzá:** kovariancia (3.2) + mindkét szórás (2.2)
- **Példa (2. ea):** cov(rA, rB) = −0,045, σA = 10%, σB = 45% → k = −0,045 / (0,1 × 0,45) = −1 (tökéletesen ellentétes mozgás)

### 3.4 Kételemű portfólió varianciája és szórása

```latex
\sigma^2(r_P) = a_1^2\sigma^2(r_1) + a_2^2\sigma^2(r_2) + 2a_1a_2\,\mathrm{cov}(r_1, r_2)
```

```latex
\sigma^2(r_P) = a_1^2\sigma^2(r_1) + a_2^2\sigma^2(r_2) + 2a_1a_2\,k_{1,2}\,\sigma(r_1)\,\sigma(r_2)
```

**Magyarul:** a portfólió varianciája az első eszköz súlyának négyzete szor a varianciája, plusz a másodiké ugyanígy, plusz kétszer a két súly szorozva a kovarianciával (vagy a korreláció és a két szórás szorzatával). A szórás ennek gyöke.

| Jel | Jelentés |
| --- | --- |
| `σ²(r_P)` | a portfólió varianciája (a szórás ennek gyöke) |
| `a_1, a_2` | a két eszköz súlya (összegük 1) |
| `σ²(r_1), σ²(r_2)` | a két eszköz varianciája |
| `σ(r_1), σ(r_2)` | a két eszköz szórása (2.2) |
| `cov(r_1, r_2)` | kovariancia (3.2) |
| `k_1,2` | korreláció (3.3) |

- **Melyik alakot:** ha a feladat kovarianciát ad, az elsőt; ha korrelációt, a másodikat (a kettő ugyanaz, mert cov = k × σ₁ × σ₂)
- **Csapda:** a súlyok és a szórások négyzetre emelve szerepelnek, a keresztszorzatban viszont nem
- **Példa (2. ea):** 50% / 50%, σ = 35% és 50%, k = 0,6 → σ² = 0,25 × 0,1225 + 0,25 × 0,25 + 2 × 0,25 × 0,6 × 0,35 × 0,5 = 0,145625, σ = 38,2%
- **Példa (2. ea):** 60% / 40%, σ² = 0,0585 és 0,011, cov = −0,001 → σ² = 0,02234, σ = 14,9%
- **Kockázatmentes portfólió:** k = −1 esetén van olyan súly, amelynél σ = 0 (a dián 81,8% A + 18,2% B → minden állapotban 20,9%)

### 3.5 n elemű portfólió és diverzifikáció

```latex
\sigma^2(r_P) = \sum_i a_i^2\sigma^2(r_i) + \sum_{i \ne j} a_i a_j\, k_{i,j}\,\sigma(r_i)\,\sigma(r_j)
```

**Magyarul:** minden elem saját kockázata a súly négyzetével súlyozva, plusz minden pár együttmozgása.

| Jel | Jelentés |
| --- | --- |
| `σ²(r_P)` | az n elemű portfólió varianciája |
| `a_i, a_j` | az i-edik és a j-edik elem súlya |
| `σ²(r_i)` | az i-edik elem varianciája |
| `σ(r_i), σ(r_j)` | az i-edik és a j-edik elem szórása |
| `k_i,j` | az i-edik és a j-edik elem korrelációja |

- **Diverzifikáció:** az elemszám növelésével az egyedi (diverzifikálható) kockázat eltűnik, a piaci (szisztematikus) kockázat megmarad
- **Példa (3. ea):** Ross 13.7 táblázata (9–10. dia): egy részvény átlagos szórása 49,24%, a 10 részvényből álló portfólióé 23,93%, az 1000 részvényből állóé 19,21%; a görbe kb. 19,2%-nál ellaposodik, ez a nem diverzifikálható kockázat
- **Hatékony portfólió:** adott szórás mellett a legnagyobb várható hozamú (a hatékony határgörbe pontjai)
- **Tőkeallokációs egyenes (CAL):** r\_f-ből egy kockázatos portfólión át húzott egyenes = a kettő összes keveréke
- **Tőkepiaci egyenes (CML):** az r\_f-ből a hatékony görbéhez húzott érintő; az érintési pont a piaci portfólió (E(rM), σ(rM))

## 4. Béta és a kockázat felbontása

A béta azt méri, mennyire érzékeny egy eszköz hozama a piac mozgására. Ez az egyetlen kockázat, amit a piac megfizet, mert a többit diverzifikációval el lehet tüntetni.

### 4.1 Karakterisztikus egyenes (piaci modell)

```latex
r_i = \beta_i\, r_M + \varepsilon_i
```

**Magyarul:** egy részvény hozama a piaci hozam bétaszorosa plusz egy egyedi, a piactól független tag.

| Jel | Jelentés |
| --- | --- |
| `r_i` | az i-edik részvény hozama |
| `r_M` | a piaci portfólió hozama |
| `β_i` | béta: az egyenes meredeksége |
| `ε_i` | egyedi (nem a piacból eredő) hozamrész; nem korrelál a piaccal |

### 4.2 A béta kiszámítása

```latex
\beta_i = \frac{\mathrm{cov}(r_i, r_M)}{\sigma^2(r_M)} = k_{i,M}\,\frac{\sigma(r_i)}{\sigma(r_M)}
```

**Magyarul:** a béta a részvény és a piac kovarianciája osztva a piac varianciájával; ugyanez a piaccal vett korreláció szorozva a részvény és a piac szórásának hányadosával.

| Jel | Jelentés |
| --- | --- |
| `β_i` | az i-edik részvény bétája |
| `cov(r_i, r_M)` | a részvény és a piac kovarianciája (3.2) |
| `σ²(r_M)` | a piac varianciája |
| `k_i,M` | a részvény korrelációja a piaccal (3.3) |
| `σ(r_i), σ(r_M)` | a részvény és a piac szórása |

- **Értékek:** β = 1 a piac maga; β > 1 a piacnál jobban leng; β < 1 kevésbé; a kockázatmentes eszköz bétája 0
- **Kell hozzá:** kovariancia a piaccal (3.2) és a piac varianciája, vagy korreláció (3.3) és a két szórás

### 4.3 Teljes kockázat = piaci + egyedi

```latex
\sigma^2(r_i) = \beta_i^2\,\sigma^2(r_M) + \sigma^2(\varepsilon_i)
```

**Magyarul:** egy részvény teljes varianciája a béta négyzete szor a piac varianciája (piaci rész), plusz az egyedi tag varianciája.

| Jel | Jelentés |
| --- | --- |
| `σ²(r_i)` | a részvény teljes varianciája |
| `β_i` | béta (4.2) |
| `σ²(r_M)` | a piac varianciája |
| `σ²(ε_i)` | az egyedi tag varianciája |

| Tag | Más nevei | Diverzifikálható? | Megfizeti a piac? |
| --- | --- | --- | --- |
| β²σ²(rM) | piaci, szisztematikus, nem diverzifikálható, releváns kockázat | nem | igen |
| σ²(ε) | egyedi, nem szisztematikus, diverzifikálható kockázat | igen | nem |

- **Végtelen elemszámú portfólió:** σ(rP) = σ(rM) × (a₁β₁ + a₂β₂ + …) = σ(rM) × β átlag; csak a piaci kockázat marad

### 4.4 Portfólió bétája

```latex
\beta_P = a_1\beta_1 + a_2\beta_2 + \dots + a_n\beta_n
```

**Magyarul:** a portfólió bétája az elemek bétáinak súlyozott átlaga (a kockázatmentes elem bétája 0).

| Jel | Jelentés |
| --- | --- |
| `β_P` | a portfólió bétája |
| `a_1 … a_n` | az elemek súlya (összegük 1) |
| `β_1 … β_n` | az elemek bétája (a kockázatmentes elemé 0) |

- **Példa (3. ea):** 40% × 0,8 + 60% × 1,4 = 1,16
- **Példa (5. ea):** 15% × 0,8 + 20% × 1,2 + 30% × 1,05 + 35% × 1,35 = 1,1475
- **Visszafejtés (5. ea):** egyenlő súly két részvényben és kockázatmentesben, a portfólió olyan kockázatos, mint a piac: 1 = ⅓ × 1,2 + ⅓ × βB + ⅓ × 0 → βB = 1,8
- **Súly visszafejtése (5. ea):** D részvény (β = 1,2) + kockázatmentes, cél βP = 0,9 → wD = 0,9 / 1,2 = 75%, wf = 25%. Cél βP = 2,4 → wD = 200%, wf = −100% (hitelfelvétel)

## 5. CAPM és az értékpapírpiaci egyenes (SML)

A ZH-k legtöbb feladata erre az egy egyenletre épül. Négy mennyiség van benne (E(r), r\_f, β, E(rM)); ha hármat megadnak, a negyedik kiszámolható.

### 5.1 A CAPM-egyenlet

```latex
E(r_i) = r_f + \beta_i\,\big(E(r_M) - r_f\big)
```

**Magyarul:** egy eszköz elvárt hozama a kockázatmentes hozam, plusz a bétája szorozva a piaci kockázati prémiummal.

| Jel | Jelentés | Honnan jön |
| --- | --- | --- |
| `E(r_i)` | elvárt (várható) hozam | ezt keressük, vagy megadják és mást keresünk |
| `r_f` | kockázatmentes hozam: az időért járó jutalom | államkötvény / kincstárjegy hozama |
| `β_i` | szisztematikus kockázat | megadják, vagy 4.2 / 4.4 |
| `E(r_M)` | a piaci portfólió várható hozama | megadják |
| `E(r_M) − r_f` | piaci kockázati prémium (MRP) | megadják, vagy E(rM)-ből |

- **Csapda:** figyeld, hogy a feladat **E(rM)-et** (a piac hozamát) vagy **MRP-t** (a prémiumot) ad. Az 5. ea két példája pont ebben különbözik: ugyanazokkal a számokkal r\_f = 2%, illetve r\_f = 0,3% jön ki
- **Példa (5. ea):** r\_f = 3%, E(rM) = 12%, β = 0,7 → E(r) = 0,03 + 0,7 × 0,09 = 9,3%
- **Visszafejtés β-ra (5. ea):** E(r) = 18,3% → 0,183 = 0,03 + β × 0,09 → β = 1,7
- **Visszafejtés r\_f-re (5. ea):** E(r) = 10,5%, β = 0,85, E(rM) = 12% → 0,105 = r\_f + 0,85 × (0,12 − r\_f) → r\_f = 2%
- **Visszafejtés MRP-re (5. ea):** E(rC) = 14%, β = 1,5, r\_f = 2% → MRP = 8%

### 5.2 Az SML meredeksége (Treynor-arány)

```latex
\text{meredekség}_i = \frac{E(r_i) - r_f}{\beta_i}, \qquad \text{meredekség}_{SML} = \frac{E(r_M) - r_f}{1} = E(r_M) - r_f
```

**Magyarul:** egy eszköz meredeksége a kockázati prémiuma osztva a bétájával, vagyis egységnyi szisztematikus kockázatra jutó többlethozam.

| Jel | Jelentés |
| --- | --- |
| `meredekség_i` | az eszköz meredeksége: egységnyi bétára jutó kockázati prémium |
| `E(r_i)` | az eszköz várható hozama |
| `r_f` | kockázatmentes hozam |
| `β_i` | az eszköz bétája |
| `meredekség_SML, E(r_M) − r_f` | az SML meredeksége = piaci kockázati prémium (MRP) |

- **Egyensúlyban** minden helyesen árazott eszköz meredeksége azonos, és egyenlő az MRP-vel
- **Alá/fölé árazott:** ha egy eszköz várható hozama a CAPM szerinti fölött van (meredeksége nagyobb), alulárazott: venni fogják, ára nő, hozama csökken a vonalig. Ha alatta, túlárazott
- **Példa (5. ea):** r\_f = 2%, E(rM) = 8,5% → SML meredekség 6,5%. G: 12%, β 1,6 → CAPM szerint 12,4%, meredekség 6,25% → túlárazott. H: 9%, β 0,8 → CAPM szerint 7,2%, meredekség 8,75% → alulárazott

### 5.3 Két helyesen árazott eszközből r\_f és E(rM)

```latex
\frac{E(r_A) - r_f}{\beta_A} = \frac{E(r_B) - r_f}{\beta_B}
```

**Magyarul:** ha két eszköz is az SML-en van, a meredekségük egyenlő; ebből az egy ismeretlen r\_f kiszámolható, utána bármelyik CAPM-egyenletből E(rM).

| Jel | Jelentés |
| --- | --- |
| `E(r_A), E(r_B)` | a két helyesen árazott eszköz várható hozama |
| `β_A, β_B` | a két eszköz bétája |
| `r_f` | kockázatmentes hozam (az ismeretlen) |

- **Példa (5. ea):** E: 18%, β 1,5; F: 8%, β 0,5 → (0,18 − r\_f)/1,5 = (0,08 − r\_f)/0,5 → r\_f = 3% → 0,08 = 0,03 + 0,5 × (E(rM) − 0,03) → E(rM) = 13%
- **Rokon típus (5. ea):** βJ = βK + 0,3, E(rJ) = 12,75%, E(rK) = 10,65% → a két CAPM-egyenletet kivonva 0,3 × MRP = 0,021 → MRP = 7%

### 5.4 Kockázatos + kockázatmentes portfólió

```latex
E(r_P) = w\,E(r_A) + (1 - w)\,r_f, \qquad \beta_P = w\,\beta_A
```

**Magyarul:** a portfólió hozama a két elem hozamának súlyozott átlaga, a bétája csak a kockázatos rész súlya szor annak bétája.

| Jel | Jelentés |
| --- | --- |
| `E(r_P)` | a portfólió várható hozama |
| `w` | a kockázatos eszköz súlya (1-nél nagyobb: hitelből vásárolt) |
| `1 − w` | a kockázatmentes eszköz súlya (negatív: hitelfelvétel) |
| `E(r_A)` | a kockázatos eszköz várható hozama |
| `r_f` | kockázatmentes hozam |
| `β_P, β_A` | a portfólió és a kockázatos eszköz bétája |

- **Példa (3. ea):** E(rA) = 20%, β = 1,6, r\_f = 8%. 25% A → E(rP) = 11%, βP = 0,4. 150% A (50% hitellel) → E(rP) = 26%, βP = 2,4
- **Példa (5. ea):** D: 12%, β 1,2, r\_f 4%. Cél E(rP) = 9% → w = 0,625 → βP = 0,75

## 6. NPV és IRR

Az NPV megmondja, mennyi értéket teremt egy projekt ma; a diszkontráta hozzá a 5. vagy a 7. fejezetből jön (CAPM vagy WACC).

### 6.1 Nettó jelenérték

```latex
NPV = CF_0 + \frac{CF_1}{1+r} + \frac{CF_2}{(1+r)^2} + \dots = \sum_{n=0}^{\infty}\frac{CF_n}{(1+r)^n}
```

**Magyarul:** minden jövőbeli pénzáramlást visszadiszkontálunk a mai napra az elvárt hozammal, és összeadjuk őket a (negatív) kezdő befektetéssel.

| Jel | Jelentés |
| --- | --- |
| `CF_0` | kezdő pénzáramlás, jellemzően negatív (a beruházás) |
| `CF_n` | az n-edik év pénzáramlása |
| `r` | diszkontráta = elvárt hozam = tőkeköltség (a három ugyanaz) |
| `NPV` | nettó jelenérték |

- **Döntés:** NPV > 0 → elfogadjuk, NPV < 0 → elutasítjuk
- **Mi legyen r:** a projekt kockázatához illő hozam: CAPM a projekt bétájával (5.1), vagy a WACC, ha a projekt kockázata és tőkeszerkezete a vállalatéval egyezik (7.4)
- **Példa (4. ea):** CF0 = −165 000, CF1 = 63 120, CF2 = 70 800, CF3 = 91 080, r = 12% → NPV = 12 627,41 → elfogadjuk

### 6.2 Belső megtérülési ráta

```latex
0 = \sum_{n=0}^{\infty}\frac{CF_n}{(1+IRR)^n}
```

**Magyarul:** az IRR az a diszkontráta, amelynél a projekt NPV-je pontosan nulla.

| Jel | Jelentés |
| --- | --- |
| `IRR` | belső megtérülési ráta |
| `CF_n` | az n-edik év pénzáramlása (CF_0 a kezdő, jellemzően negatív) |

- **Döntés:** IRR > elvárt hozam → elfogadjuk (ekkor NPV > 0); IRR < elvárt hozam → elutasítjuk
- **Számolás:** iterációval (próbálgatás, vagy pénzügyi számológép); döntési kritériumként nem jobb, mint az NPV
- **Példa (4. ea):** ugyanez a projekt → IRR = 16,13% > 12% → elfogadjuk

## 7. Tőkeköltség és WACC

A tőkeköltséget a beruházás kockázata határozza meg, nem az, honnan jön a pénz. A vállalat két forrásból dolgozik (saját tőke és hitel), és a kettő költségét piaci értékkel súlyozzuk.

### 7.1 Saját tőke költsége – osztaléknövekedési (Gordon-) modell

```latex
P_0 = \frac{D_0(1+g)}{r_E - g} = \frac{D_1}{r_E - g} \quad\Rightarrow\quad r_E = \frac{D_1}{P_0} + g
```

**Magyarul:** a saját tőke költsége a következő évi osztalék osztva a mai árfolyammal (osztalékhozam), plusz az osztalék növekedési üteme.

| Jel | Jelentés |
| --- | --- |
| `D_0` | a legutóbb (tavaly) kifizetett osztalék |
| `D_1` | a következő évi osztalék = D\_0 × (1 + g) |
| `P_0` | mai részvényárfolyam |
| `g` | az osztalék állandó növekedési üteme (becsülni kell) |
| `r_E` | saját tőke költsége (a tulajdonosok elvárt hozama) |

- **Csapda:** „tavaly fizetett” / „utoljára fizetett” = D\_0, ezt előbb fel kell szorozni (1 + g)-vel. Ha a feladat a jövő évi osztalékot adja, az már D\_1
- **Korlátai:** csak állandó ütemben növő osztalékot fizető cégre; nagyon érzékeny g-re; a kockázatot közvetlenül nem veszi figyelembe
- **Példa (4. ea):** D\_0 = 4 USD, P\_0 = 60 USD, g = 6% → D\_1 = 4,24 → r\_E = 4,24/60 + 0,06 = 13,07%
- **Példa (videó):** D\_0 = 5 USD, P\_0 = 70 USD, g = 4% → D\_1 = 5,2 → r\_E = 11,43%

### 7.2 Saját tőke költsége – CAPM (SML) alapon

```latex
r_E = r_f + \beta_E\,\big(E(r_M) - r_f\big)
```

**Magyarul:** a saját tőke költsége a kockázatmentes hozam plusz a részvény bétája szor a piaci kockázati prémium (ugyanaz, mint 5.1).

| Jel | Jelentés |
| --- | --- |
| `r_E` | saját tőke költsége |
| `r_f` | kockázatmentes hozam |
| `β_E` | a részvények bétája |
| `E(r_M)` | a piaci portfólió várható hozama |
| `E(r_M) − r_f` | piaci kockázati prémium (MRP) |

- **Előnye:** figyelembe veszi a kockázatot, és nem kell hozzá állandó osztaléknövekedés. **Hátránya:** két becsült paraméter (β, MRP), és múltból becsüli a jövőt
- **Ha mindkét módszer adatai adottak (4. ea):** átlagoljuk őket. β = 1,2, MRP = 7%, r\_f = 6% → 14,4%; D\_0 = 2, g = 8%, P\_0 = 30 → 15,2%; r\_E = 14,8%

### 7.3 Hitel költsége (adózás előtt és után)

```latex
r_D^{\text{adózás után}} = r_D\,(1 - T_C)
```

**Magyarul:** az adózás utáni hitelköltség az adózás előtti hitelköltség szorozva egy mínusz a társasági adókulccsal, mert a kamat csökkenti az adóalapot (az osztalék nem).

| Jel | Jelentés |
| --- | --- |
| `r_D` | adózás előtti hitelköltség: az **új** hitel kamata, a kötvény lejáratig számított hozama (YTM), vagy hasonló minősítésű kötvények kamata |
| `T_C` | társasági adókulcs |
| `r_D adózás után` | adózás utáni hitelköltség |
| `P_0` | a kötvény mai árfolyama (YTM számításánál) |
| `C` | évente fizetett kupon |
| `N` | névérték (feltevés: 1000 USD) |
| `n` | a lejáratig hátralévő évek száma |
| `YTM` | lejáratig számított hozam: ezzel diszkontálva éppen P_0 jön ki |

- **Csapda:** a kötvény eredeti (kupon)kamata nem releváns, csak a mai hozam (YTM). A 4. ea példája: 7%-os kupon, 960 USD ár, 22 év hátra → YTM = 7,37% (diszkonttal forog, ezért a hozam a kupon fölött van)
- **Példa (5. ea):** 9% kamat, 21% adó → 0,09 × 0,79 = 7,11%
- **YTM kiszámítása (kiegészítés):** ha a feladat nem adja meg, a YTM az a diszkontráta, amellyel a kötvény hátralévő pénzáramlásait (évente a C kupon, a végén az N névérték) diszkontálva éppen a mai P\_0 árfolyamot kapjuk; vagyis a kötvény pénzáramlásainak IRR-je (6.2), iterációval számolva. Feltevés: N = 1000 USD, éves kuponfizetés. A 4. ea példája ezzel: C = 70, P\_0 = 960, n = 22 → YTM = 7,37%

```latex
P_0 = \sum_{t=1}^{n}\frac{C}{(1+YTM)^t} + \frac{N}{(1+YTM)^n}
```

### 7.4 Súlyozott átlagos tőkeköltség (WACC)

```latex
WACC = \frac{E}{V}\,r_E + \frac{D}{V}\,r_D\,(1 - T_C), \qquad V = E + D
```

**Magyarul:** a WACC a saját tőke költségének és az adózás utáni hitelköltségnek a piaci értékük arányában súlyozott átlaga.

| Jel | Jelentés | Honnan jön |
| --- | --- | --- |
| `E` | a saját tőke **piaci** értéke | részvények száma × árfolyam |
| `D` | az adósság **piaci** értéke | névérték × jegyzési arány (pl. 93%) |
| `V` | a vállalat teljes értéke | E + D |
| `r_E` | saját tőke költsége | 7.1 vagy 7.2 |
| `r_D` | adózás előtti hitelköltség | 7.3 (YTM) |
| `T_C` | társasági adókulcs | megadják |
| `WACC` | súlyozott átlagos tőkeköltség | ez a képlet |

- **Súlyok D/E arányból:** E/V = 1 / (1 + D/E), D/V = 1 / (1 + E/D)
- **Mikor használható diszkontrátaként:** csak ha a projekt kockázata és tőkeszerkezete megegyezik a vállalatéval. Ha nem, a projekt saját bétájával CAPM-et számolunk
- **Példa (5. ea), teljes lánc:** 1,4 M részvény × 20 USD, β = 0,74; adósság 5 M névérték 93%-on, YTM 11%; r\_f = 8%, MRP = 7%, T\_C = 21%
  1. r\_E = 8% + 0,74 × 7% = 13,18%
  2. r\_D adózás után = 11% × 0,79 = 8,69%
  3. E = 28 M, D = 4,65 M, V = 32,65 M → E/V = 0,8576, D/V = 0,1424
  4. WACC = 0,8576 × 13,18% + 0,1424 × 8,69% = 12,54%
- **Példa (videó):** 2 M × 10 USD, β = 1,2; 6 M névérték 90%-on, YTM 8%; r\_f = 4%, MRP = 7%, T\_C = 20% → r\_E = 12,4%, E/V = 0,7874 → WACC = 11,1%

### 7.5 WACC vagy CAPM a projektértékelésben

| Jel | Jelentés |
| --- | --- |
| `E(r)` | a projekt várható hozama |
| `β` | a projekt bétája |
| `WACC` | a vállalat súlyozott átlagos tőkeköltsége (7.4) |

Az 5. ea példája: tisztán saját tőkés cég, β = 1, r\_f = 7%, MRP = 8% → WACC = 15%.

| Projekt | Várható hozam | β | CAPM szerinti elvárt | WACC szerint | Helyes döntés |
| --- | --- | --- | --- | --- | --- |
| A | 14% | 0,6 | 11,8% | elutasítaná (14% < 15%) | elfogadni (14% > 11,8%) |
| B | 16% | 1,2 | 16,6% | elfogadná (16% > 15%) | elutasítani (16% < 16,6%) |

A táblázat azt mutatja, miért hibás minden projektet a céges WACC-cal mérni: az alacsony kockázatú jó projektet elvetné, a magas kockázatú rosszat elfogadná.

# 2. ZH anyaga

## 8. Tőkeszerkezet

Az alapkérdés: teremt-e többletértéket a forrásoldal megváltoztatása, a tőkeszerkezet kialakítása? Forrás: a Tőkeszerkezeti politika diasor (Dr. Walter György, `forras/zh2/`) és a hozzá tartozó szemináriumi példák megoldásokkal. A „dia” a diasor oldalszáma, a „szem. N” a tökéletes piaci, a „szem. adó N” az adós példák sorszáma.

- **Alapkérdés (6. dia):** az alapértelmezés a 100% saját tőke; a hozzáadott érték a meglévő saját tőke növekedése; a kérdés, hogy az ettől eltérő finanszírozási helyzet növeli-e a részvényesek vagyonát: PV(finanszírozás) = NPV(finanszírozás megváltoztatása)
- **Hagyományos nézet (7. dia):** a vállalkozás értéke a jövőbeni szabad cash flow-inak jelenértéke, a diszkontráta az eszközök várható hozama; eszerint a WACC csökkentésével növelhető a vállalati érték
- **Tökéletes piac (8. dia):** nincsenek adók és tranzakciós költségek, nincsenek intézményi korlátok, nyilvános a kereskedés; az értékpapírok korlátlanul oszthatók és korlátozott felelősséget testesítenek meg; sok, de véges számú racionális befektető van, mindenki árelfogadó és egyformán informált
- **Miért hasznos (9. dia):** a tökéletes piac hatékony; a valóságban majdnem hatékony piac van, tökéletes csak elméletben. Mégis kiindulási alap sok elmélethez: a tökéletlenségeket egyenként vesszük be a modellbe és számszerűsítjük, és sokszor az elméleti modell mégis jól működik (CAPM)
- **Tökéletlenségek (21. dia):** adó, tranzakciós költségek (kibocsátás, szervezés, egyéb költségek), információs aszimmetria, moral hazard, ügynök problémák, illikviditás, hozzáférhetőség
- **Pénzügyi nehézségek (26. dia):** a csődköltségek a pénzügyi nemteljesítés előtt felmerülő közvetlen és közvetett költségek; ide tartoznak a részvényesek és a hitelezők közötti játszmák is. Az adómegtakarítások különböznek egymástól, ha a CF volatilis. Részletesebben későbbi kurzusokban (Befektetés és Finanszírozás)
- **A tőkeáttétel hatása a mutatókra (17. dia):** az EPS, P (árfolyam), P/E, EBIT és ROE mutatókra gyakorolt hatás későbbi kurzusok témája (Befektetés és Finanszírozás)
- **Hierarchia-elmélet, pecking order (32. dia):** a részvénykibocsátás bejelentése lehúzza a részvényárfolyamot, mert a befektetők úgy vélik, hogy a menedzserek nagyobb valószínűséggel bocsátanak ki részvényeket, ha a részvények túlárazottak. Ezért a vállalkozások a belső finanszírozást részesítik előnyben
- **A finanszírozás sorrendje (32. dia):** belső forrás, utána kötvény- és adósságkibocsátás, végső megoldásként részvénykibocsátás
- **Hierarchia és nyereségesség (32. dia):** a legjövedelmezőbb cégek nem azért vesznek fel kevesebb hitelt, mert alacsonyabb az optimális adósságszintjük, hanem azért, mert nem akarnak külső finanszírozást és nincs rá szükségük
- **Apple, 2013 (18. és 29. dia):** 145 milliárd dollár likvid eszköz mellett 17 milliárd dollár kötvényt bocsátott ki: a pénz jelentős része külföldön volt, a hazautalás adóterhe magas, a hitelkamat kedvező, és ott a kamatadó-pajzs
- **Boeing, 2024 (18. és 29. dia):** mintegy 21 milliárd dollár részvényt és átváltható értékpapírt bocsátott ki: likviditási nyomás, a hitelminősítés védelme és a túlzott eladósodás kockázata miatt
- **A két eset tanulsága (29. dia):** tökéletes piacon a tőkeszerkezet irreleváns, a valóságban az adók és a pénzügyi nehézségek költségei számítanak

### 8.1 Tőkeköltség tökéletes piacon (MM I. tétel)

```latex
r_A = r_V = WACC = \frac{E}{V}\,r_E + \frac{D}{V}\,r_D, \qquad V = E + D
```

**Magyarul:** tökéletes piacon a vállalat tőkeköltsége (az eszközök várható hozama) a saját tőke és a hitel hozamának piaci értékkel súlyozott átlaga, és ez a tőkeszerkezettől nem függ.

| Jel | Jelentés |
| --- | --- |
| `r_A` | az eszközök várható hozama |
| `r_V` | a vállalat várható hozama (ugyanaz, mint r\_A) |
| `WACC` | súlyozott átlagos tőkeköltség, itt adó nélkül |
| `E` | a saját tőke piaci értéke |
| `D` | az adósság piaci értéke |
| `V` | a vállalat értéke, a diákon A (eszközök) |
| `r_E` | a saját tőke várható hozama |
| `r_D` | a hitel várható hozama |

- **MM I. tétel (10. dia):** adott beruházási politika mellett, tökéletes tőkepiacokon a tőkeszerkezet megválasztása nem hat a vállalat értékére: PV(finanszírozás) = 0, minden az eszközoldaltól függ, a tőkeszerkezet irreleváns
- **Mi nem változik (11. dia):** a WACC nem változik, ha D/V változik. A saját tőke hozama viszont igen, lásd 8.3
- **Több forrásnál:** minden forrás súlya szor a hozama, összeadva. A törzsrészvények pénzáramlását viszont a törzsrészvény hozamával diszkontáljuk, nem a tőkeköltséggel
- **Forrás:** Tőkeszerkezet, 4., 10. és 11. dia
- **Csapda:** itt nincs (1 − T\_C) tag, mert tökéletes piacon nincs adó. Az adós változat a 8.8
- **Példa (szem. 1):** D/V = 0,6, r\_D = 7%, r\_E = 20% → r\_A = 0,6 × 7% + 0,4 × 20% = 12,2%
- **Példa (szem. 4):** 20% banki hitel 5%-on, 15% kötvény 6%-on, 25% elsőbbségi részvény 15%-on, 40% törzsrészvény 20%-on → r\_A = 13,65%; a törzsrészvények pénzáramlását 20%-kal diszkontáljuk
- **Példa (szem. 5):** E = 1600 M Ft, D = 400 M Ft, r\_D = 7%, r\_E = 17% → r\_A = 15%; ha további 200 M Ft hitelből részvényt vásárol vissza, a tőkeköltség nem változik, csak r\_E emelkedik

### 8.2 Eszközök bétája

```latex
\beta_A = \beta_V = \frac{E}{V}\,\beta_E + \frac{D}{V}\,\beta_D
```

**Magyarul:** az eszközök bétája a saját tőke és a hitel bétájának piaci értékkel súlyozott átlaga; az eszközök kockázata nem változik, ha a tőkeszerkezet változik.

| Jel | Jelentés |
| --- | --- |
| `β_A` | az eszközök bétája |
| `β_V` | a vállalat bétája (ugyanaz, mint β\_A) |
| `E/V` | a saját tőke piaci értékű súlya |
| `D/V` | az adósság piaci értékű súlya |
| `β_E` | a saját tőke (a részvények) bétája |
| `β_D` | a hitel bétája |

- **A kockázat sorrendje (11. dia):** D < A = V < E
- **A várható hozamok sorrendje (11. dia):** r\_D < r\_A = r\_V < r\_E
- **A hitel bétája:** a CAPM-ből: r\_D = r\_f + β\_D × (E(r\_M) − r\_f); kockázatmentes hitelnél β\_D = 0
- **Forrás:** Tőkeszerkezet, 11. dia
- **Példa (szem. 3):** D/V = 0,4, r\_D = r\_f = 5%, r\_M = 15%, β\_E = 0,7 → r\_E = 12%, r\_A = 9,2%, β\_A = 0,42
- **Példa (szem. 6):** E = 1600, D = 400, r\_D = 7%, r\_f = 5%, β\_E = 1,5, MRP = 8% → r\_E = 17%, r\_A = 15%, β\_D = 0,25, β\_A = 1,25

### 8.3 Saját tőke hozama (MM II. tétel)

```latex
r_E = r_A + \frac{D}{E}\,(r_A - r_D)
```

**Magyarul:** a saját tőke várható hozama az eszközök hozama, plusz a D/E arány szorozva az eszközök és a hitel hozamának különbségével, ezért a tőkeáttétellel együtt nő.

| Jel | Jelentés |
| --- | --- |
| `r_E` | a saját tőke (a részvények) várható hozama |
| `r_A` | az eszközök várható hozama, tökéletes piacon a WACC |
| `D/E` | adósság / saját tőke, piaci értéken |
| `r_D` | a hitel várható hozama |

- **MM II. tétel (12. dia):** a saját tőke (részvények) várható hozama az eladósodottsággal párhuzamosan (monoton) nő
- **Ha a hitel kockázatossá válik (13–16. dia):** a hitel egy ideig kockázatmentes, ekkor r\_E monoton nő. Egy szint, a (D/E)* tőkeáttétel felett D növekedésével r\_D is emelkedik, és r\_E növekedése r\_D növekedésétől függ. Magas eladósodottság felett nem-normális helyzet alakul ki. 100%-os eladósodottságnál r\_D az r\_A-hoz tart
- **Másik út:** ugyanez jön ki, ha a 8.1-et rendezed r\_E-re: r\_E = (r\_A − D/V × r\_D) / (E/V)
- **Forrás:** Tőkeszerkezet, 12–16. dia
- **Csapda:** a képletben D/E áll, nem D/V: 20% hitelnél D/E = 0,25
- **Csapda:** ha a hitel drágább, ugyanekkora tőkeáttételnél r\_E kisebb, mert a hitelezők nagyobb kockázatot vesznek át a részvényesektől
- **Példa (szem. 2):** WACC = 12%, r\_D = 8%; D/V = 0,2 → r\_E = 13%; D/V = 0,5 → r\_E = 16%
- **Példa (szem. 7):** r\_A = 20%, a részvények 25%-a helyett 5%-os kockázatmentes kötvény → r\_E = 25%
- **Példa (szem. 8):** r\_A = 15%, D/V = 50%; r\_D = 6% → r\_E = 24%; r\_D = 8% → r\_E = 22%
- **Példa (szem. 9):** D/V = 40%, r\_D = 8%, r\_E = 20% → r\_A = 15,2%; minden hitelt visszafizetve 100% saját tőke marad, ezért r\_E = r\_A = 15,2%

### 8.4 Adómegtakarítás (tax shield)

```latex
TS_{\text{éves}} = T_C \cdot D \cdot r_D
```

```latex
PV(TS) = \frac{T_C \cdot D \cdot r_D}{r_D} = T_C \cdot D
```

**Magyarul:** az adósság kamata csökkenti az adóalapot, ezért évente T\_C × D × r\_D adót takarítunk meg; ennek jelenértéke örökjáradékként, r\_D-vel diszkontálva T\_C × D.

| Jel | Jelentés |
| --- | --- |
| `TS éves` | az adómegtakarítás éves összege |
| `PV(TS)` | az adómegtakarítások összesített jelenértéke |
| `T_C` | társasági adókulcs |
| `D` | az állandó nagyságú, kockázatmentes adósság |
| `r_D` | a hitel kamata, itt a diszkontráta is |

- **Miért (22. dia):** az adósság kamatát levonják az adózás előtti jövedelemből, ezért az adósságot az adózás részesíti előnyben, az adómegtakarítások felhalmozódnak
- **Feltétel (22. dia):** csak akkor, ha a vállalkozás elegendő EBIT-tel rendelkezik
- **Forrás:** Tőkeszerkezet, 22. dia
- **Csapda:** a T\_C × D már a jelenérték; az éves összegben még ott van r\_D is
- **Példa (szem. adó 1):** D = 80 M USD, T\_C = 40% → PV(TS) = 32 M USD; további 40 M USD kockázatmentes hitelből részvényt visszavásárolva a részvényesek 16 M USD-vel járnak jobban

### 8.5 Adómegtakarítás véges futamidőre

```latex
PV(TS) = \sum_{t=1}^{n} \frac{T_C \cdot K_t}{(1 + r_D)^t}
```

**Magyarul:** ha a kamat csak véges ideig vonható le, minden év kamatának adómegtakarítását külön diszkontáljuk.

| Jel | Jelentés |
| --- | --- |
| `PV(TS)` | az adómegtakarítások jelenértéke |
| `T_C` | társasági adókulcs |
| `K_t` | a t. évben fizetett kamat |
| `r_D` | a hitel kamata, itt a diszkontráta is |
| `t` | az év sorszáma |
| `n` | az évek száma |

- **Állandó kamatnál:** az évi T\_C × K szorozva az n évre szóló annuitásfaktorral
- **Törlesztő hitelnél:** a kamat az év eleji tartozás után jár, ezért évről évre csökken
- **A diszkontráta kérdése:** vitatott, hogy valóban a hitel kamatával kell-e diszkontálni (szem. adó 3, lásd Capital CF)
- **Forrás:** szem. adó 1 és szem. adó 3 (a diasor csak az örökjáradékos esetet adja, 22. dia)
- **Csapda:** a T\_C × D itt nem jó: az örökké fennálló adósságra érvényes
- **Példa (szem. adó 1):** D = 80 M USD, 8% kamat, 40% adó, 5 év: K = 6,4, évi 2,56, AF(5 év, 8%) = 3,993 → PV(TS) = 10,222 M USD (a kerekítetlen faktorral 10,221)
- **Példa (szem. adó 3):** 30 M USD, 3 év alatt egyenlő éves részletben, 5% kamat, 20% adó: kamatok 1,5, 1 és 0,5 → PV(TS) = 0,55 M USD

### 8.6 Vállalatérték adóval

```latex
V_L = V_U + T_C \cdot D
```

**Magyarul:** a tőkeáttételes vállalat értéke a csak saját tőkéből finanszírozott vállalat értéke, plusz az adómegtakarítás jelenértéke.

| Jel | Jelentés |
| --- | --- |
| `V_L` | a vállalat értéke tőkeáttétellel (leveraged) |
| `V_U` | a vállalat értéke tőkeáttétel nélkül (unleveraged) |
| `T_C` | társasági adókulcs |
| `D` | az adósság |

- **Általánosan:** V\_U + a hitel adóhatása; ha az adómegtakarítás nem örökjáradék, a T\_C × D helyére a 8.5 jelenértéke kerül
- **Három értékelési megközelítés (23. dia):** Equity érték (FCFE, r\_E-vel diszkontálva); a saját tőkés finanszírozású vállalatérték plusz az idegen forrás finanszírozási hatása (Capital CF, APV), ez a 8.6; Free CF (FCFF) a módosított WACC*-gal diszkontálva, ez a 8.8. Részletesen későbbi kurzusokban és a mesterképzésen
- **Forrás:** Tőkeszerkezet, 23. és 28. dia
- **Csapda:** a 8.6 csak az adó hatását tartalmazza, a pénzügyi nehézségek költségét nem: az a 8.10
- **Példa (szem. adó 1):** V = 320, D = 80, T\_C = 40% → V\_U = 320 − 32 = 288; ha a kamat csak 5 évig vonható le, az érték 288 + 10,222 = 298,222 M USD

### 8.7 Saját tőke hozama adóval

```latex
r_E = r_U + \frac{D}{E}\,(r_U - r_D)\,(1 - T_C)
```

**Magyarul:** adóval a saját tőke hozama lassabban nő a tőkeáttétellel: a kockázati felár az (1 − T\_C) tényezővel kisebb.

| Jel | Jelentés |
| --- | --- |
| `r_E` | a saját tőke várható hozama tőkeáttétellel |
| `r_U` | tőkeáttétel nélküli hozam, adó nélkül ez az r\_A |
| `D/E` | adósság / saját tőke, piaci értéken |
| `r_D` | a hitel kamata |
| `T_C` | társasági adókulcs |

- **Forrás:** Tőkeszerkezet, 23. dia
- **Csapda:** az adó nélküli 8.3-tól csak az (1 − T\_C) szorzó különbözteti meg
- **Példa (szem. adó 4):** r\_U = 12%, r\_D = 8%, T\_C = 35%; 80% saját tőke → r\_E = 12,65% (a megoldásban kerekítve 12,7%); 50% saját tőke → r\_E = 14,6%

### 8.8 Módosított WACC

```latex
WACC^{*} = \frac{E}{V}\,r_E + \frac{D}{V}\,r_D\,(1 - T_C)
```

**Magyarul:** adóval a tőkeköltségben a hitel adózás utáni költsége szerepel; ezzel diszkontáljuk a vállalat szabad pénzáramlását.

| Jel | Jelentés |
| --- | --- |
| `WACC*` | adóval módosított tőkeköltség |
| `E/V` | a saját tőke piaci értékű súlya |
| `r_E` | a saját tőke hozama |
| `D/V` | az adósság piaci értékű súlya |
| `r_D` | a hitel kamata, adózás előtt |
| `T_C` | társasági adókulcs |

- **Kapcsolat:** ugyanaz, mint a 7.4; itt a jele WACC*, mert a tökéletes piaci WACC-tól (8.1) az adó különbözteti meg
- **Mit diszkontálunk vele (23. dia):** a Free CF-et (FCFF)
- **A tőkeáttétel hatása:** a WACC* folyamatosan csökken, ahogy a tőkeáttétel nő (szem. adó 4)
- **Forrás:** Tőkeszerkezet, 23. dia
- **Csapda:** a súlyok piaci értékből jönnek, nem a könyv szerinti mérlegből
- **Példa (szem. adó 2):** D = 80, E = 240, r\_D = 5%, r\_E = 25%, T\_C = 30% → WACC* = 19,625%
- **Példa (szem. adó 4):** r\_E = 12,65%, 80% saját tőke → WACC* = 11,16% (a megoldásban kerekítve 11,2%); r\_E = 14,6%, 50% saját tőke → WACC* = 9,9%

### 8.9 Relatív adóelőny

```latex
T^{*} = 1 - (1 - T_C) = T_C
```

**Magyarul:** azt mutatja, mennyivel jár jobban a tulajdonos, ha egy egységnyi EBIT-et kamatként fizetnek ki, nem saját tőke jövedelemként.

| Jel | Jelentés |
| --- | --- |
| `T*` | a relatív adóelőny |
| `T_C` | társasági adókulcs |

- **Csak társasági adóval (25. dia):** kamatként kifizetve 1 marad, saját tőke jövedelemként 1 − T\_C
- **Személyi jövedelemadóval (24. dia):** kamatként 1 − T\_p marad, saját tőke jövedelemként (1 − T\_pE) × (1 − T\_C). A dia kérdése: mindenki ugyanúgy adózik?
- **Forrás:** Tőkeszerkezet, 24–25. dia

### 8.10 Választásos elmélet (trade-off)

```latex
V = V_U + PV(\text{adómegtakarítás}) - PV(\text{pénzügyi nehézségek})
```

**Magyarul:** a vállalat értéke a csak saját tőkés érték, plusz az adómegtakarítás jelenértéke, mínusz a pénzügyi nehézségek költségének jelenértéke.

| Jel | Jelentés |
| --- | --- |
| `V` | a vállalat piaci értéke |
| `V_U` | a vállalat értéke, ha az összes tőke saját tőke |
| `PV(adómegtakarítás)` | az adómegtakarítás jelenértéke |
| `PV(pénzügyi nehézségek)` | a tranzakciós költségek és a pénzügyi nehézségek költségének jelenértéke |

- **Helyettesítő hatás (27. dia):** az adómegtakarítás és a pénzügyi nehézségek megnövekedett költsége ellentétesen hat az értékre és a WACC-ra
- **Optimális tőkeszerkezet (28. dia):** az adósság növelésével az érték eleinte nő, a D* optimális adósságnál eléri a maximumát, utána csökken
- **Ágazatok (30. dia):** az optimális tőkeszerkezet azért különbözik az ágazatok között, mert mindegyiknek más az adómegtakarítási potenciálja és más a pénzügyi nehézségei
- **Ágazati D/(D+E) arányok (31. dia):** lásd a táblázatot lent
- **Forrás:** Tőkeszerkezet, 27., 28., 30. és 31. dia
- **Csapda:** a 30. dia pluszjellel írja, de ott a pénzügyi nehézségek költsége negatív érték; a 27. dia mínusszal írja ugyanezt
- **Csapda:** az olcsóbb hitelkamat önmagában nem növeli a vállalatértéket: tökéletes piacon a WACC nem változik, a valóságban az adók és a pénzügyi nehézségek költségei döntenek (29. dia)

Ágazati eladósodottság (31. dia, forrása: pages.stern.nyu.edu/~adamodar/):

| Ágazat | D/(D+E) |
| --- | --- |
| Food Wholesalers | 79,51% |
| Hospitals/Healthcare Facilities | 72,77% |
| Trucking | 65,48% |
| Telecom (Wireless) | 64,75% |
| Real Estate (General/Diversified) | 63,30% |
| Real Estate (Operations & Services) | 58,14% |
| Retail (General) | 57,75% |
| Utility (General) | 57,06% |
| Telecom. Services | 55,68% |
| Auto & Truck | 55,39% |
| Air Transport | 52,98% |
| Utility (Water) | 50,72% |
| Electronics (General) | 12,52% |
| Drugs (Biotechnology) | 11,94% |
| Heathcare Information and Technology | 11,73% |
| Computer Services | 10,43% |
| Software (System & Application) | 10,01% |
| Software (Entertainment) | 9,58% |
| Electronics (Consumer & Office) | 8,39% |
| Semiconductor Equip | 2,22% |

## Feladattípus-felismerő

A feladat elolvasása után először azt döntsd el, melyik sorba tartozik: a megadott adatok és a kérdés együtt meghatározzák a láncot.

| Ha a feladat ezt adja… | …és ezt kérdezi | Lánc (fejezetek) |
| --- | --- | --- |
| árfolyamok évről évre (± osztalék) | hozam, átlaghozam | 1.1 → 1.2 / 1.3 / 1.4 |
| múltbeli hozamsor | szórás | 1.2 → 2.3 (N − 1-gyel osztva) |
| állapotok + valószínűségek + hozamok | várható hozam, szórás, kockázati prémium | 2.1 → 2.2 (→ E(r) − r\_f) |
| ugyanez két részvényre | kovariancia, korreláció | 2.1 → 2.2 → 3.2 → 3.3 |
| két részvény + súlyok (+ cov vagy k) | portfólió hozama, szórása | 3.1 + 3.4 |
| béták + súlyok | portfólió bétája, vagy egy hiányzó béta / súly | 4.4 (egyenletként rendezve) |
| r\_f, β, E(rM) vagy MRP | elvárt hozam | 5.1 |
| három a négy CAPM-mennyiségből | a negyedik (β, r\_f, MRP) | 5.1 átrendezve |
| részvény várható hozama + β + piaci adatok | jól árazott-e? | 5.1 vagy 5.2 (meredekségek) |
| két „helyesen árazott” részvény | r\_f és E(rM) | 5.3 → 5.1 |
| pénzáramlások + elvárt hozam | elfogadjuk-e a projektet? | 6.1 (IRR esetén 6.2) |
| osztalék, árfolyam, növekedés | saját tőke költsége | 7.1 (előbb D\_1 = D\_0 × (1 + g)) |
| részvényszám, árfolyam, β, adósság névértéke + jegyzés, YTM, adókulcs | WACC | 5.1 / 7.2 → 7.3 → piaci értékek → 7.4 |
| projektek várható hozama + bétája + céges WACC | melyik projektet fogadjuk el? | 5.1 projektenként, nem a WACC (7.5) |
| forrásonként a súly és a hozam, tökéletes piac | az eszközök várható hozama, tőkeköltség | 8.1 |
| eszközök hozama vagy WACC, hitel hozama, tőkeszerkezet | a részvények várható hozama | 8.3 |
| a részvények és a hitel mai hozama, régi és új tőkeszerkezet | a részvények várható hozama az átalakítás után | 8.1 → 8.3 |
| r\_f, β\_E, piaci adatok, hitel hozama, súlyok | az eszközök bétája | 5.1 → 8.1 → 8.2 |
| állandó, örökké fennálló adósság, adókulcs, piaci mérleg | adómegtakarítás jelenértéke, vállalatérték | 8.4 → 8.6 |
| hitel véges futamidővel, kamatláb, adókulcs | adómegtakarítás jelenértéke | 8.5 |
| tőkeáttétel nélküli hozam, r\_D, súlyok, adókulcs | tőkeköltség adóval | 8.7 → 8.8 |
| piaci mérleg, r\_E, r\_D, adókulcs | tőkeköltség adóval | 8.8 |

**A leghosszabb lánc:** β → CAPM → r\_E → (+ YTM → adózás utáni r\_D) → piaci értékű súlyok → WACC → NPV diszkontrátája. Ha egy feladat ennek csak egy darabját kérdezi, a többi adat zavaró is lehet.

## Hibák a diákon

A diák minden kidolgozott példáját újraszámoltam. Az NPV (12 627,41), az IRR (16,13%), a YTM (7,37%) és mindkét WACC (12,54% és 11,1%) stimmel. Ezeknél viszont a dia elírt valamit:

| Hol | A dián | Helyesen | Státusz | ZH |
| --- | --- | --- | --- | --- |
| 4. ea, 29. dia (CAPM saját tőke) | r\_f = 3% a szövegben, de a számítás 0,04-gyel megy: 11,8% | 0,03 + 1,3 × 0,06 = **10,8%** (ha r\_f tényleg 3%); 0,04 + 1,3 × 0,06 = 11,8% (ha a számítás a jó) | nyitott – kérdezd meg az oktatót | 1 |
| 4. ea, Gordon-példa (7.1) | r_E = 4,24/60 + 0,06 = 13,27% | 0,0707 + 0,06 = **13,07%** | számítással igazolva: 4,24 / 60 = 0,0707, + 0,06 = 13,07% | 1 |
| 2. ea, 10. dia | σ(rA) = √0,064 | √0,0064 = 0,08 (az eredmény jó) | számítással igazolva: √0,0064 = 0,08 = a dia eredménye | 1 |
| 2. ea, 19. dia | σ²(rA) = 0,001 | 0,01 (σ = 10%) | számítással igazolva: 0,1² = 0,01 | 1 |
| 2. ea, 14. dia | a táblázatban 0,30625 | 0,030625 (a szöveg jó) | számítással igazolva: a szöveg értéke 0,030625 | 1 |
| 4. ea, 14. dia | „E(rB) = 16%, βA = 1,2” | βB = 1,2 | számítással igazolva: a dia képlete (0,16 − 0,08) / 1,2 = 0,0667, vagyis a B bétájával számol | 1 |
| 2–3. ea, n elemű szórásképlet | a keresztszorzatban kétszer σ(r\_i) | a második tényező σ(r\_j) (lásd 3.5) | számítással igazolva: n = 2 esetén csak σ(r\_j)-vel adja vissza a 3.4-et | 1 |
| Szeminárium, adós 4. példa (8.7, 8.8) | r\_E = 12,7%, WACC* = 11,2% | **12,65%** és **11,16%** (a megoldás kerekít) | számítással igazolva: 12% + 4% × 0,25 × 0,65 = 12,65%; 0,2 × 5,2% + 0,8 × 12,65% = 11,16% | 2 |
| Szeminárium, 6. példa | az a) kérdés megoldása „b)” jelöléssel kezdődik | a) | számítással igazolva: az eredmény (r\_A = 15%) az a) kérdésre felel, a végeredményt nem érinti | 2 |
| Tőkeszerkezet, 30. dia | „mindegyik ágazatnak már az adómegtakarítási potenciálja” | „más” | számítással igazolva: elírás, a mondat értelme csak így kerek | 2 |

Az első két sor számítási különbség; a többi elírás, a végeredményt nem változtatja. A nyitott tételnél a gyakorlásban és a ZH-szimulációban mindkét értéket elfogadjuk, és a kiértékelés jelzi, hogy a dia mást mutat.
