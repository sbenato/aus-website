# Fondo de Récords Nacionales — AUS

Especificación del sistema. Escrita para que Claude Code la implemente.

---

## 1. Qué es

La Asociación Uruguaya de Speedcubing (AUS) quiere premiar a quien rompa un récord
nacional uruguayo de la WCA.

Cada récord tiene su **propio fondo acumulado**. Cuando la AUS aporta plata nueva, esa
plata **no se reparte en partes iguales**: se reparte según qué tan "merecido" está cada
récord. Cuando alguien rompe un récord, cobra **una fracción** de ese fondo, no todo.

Dos operaciones, y conviene mantenerlas separadas en el código:

| Operación | Cuándo ocurre | Qué hace |
|---|---|---|
| **Reparto** | La AUS mete plata (monto `X`) | Distribuye `X` entre los 33 fondos |
| **Pago** | Alguien rompe un récord | Paga una fracción del fondo de ESE récord |

---

## 2. Unidad de cuenta: 33 fondos

Un fondo por **récord**, no por evento. Single y media son fondos independientes.

- 17 eventos WCA × 2 (single + media) = 34
- **Menos 1**: 3x3 Multi-Blind no tiene media
- **Total: 33 fondos**

Clave sugerida: `{event_id}-{single|average}` → `clock-average`, `333-single`.

---

## 3. Reparto

Cada récord recibe un puntaje. La plata se reparte proporcional al puntaje, así que
siempre se distribuye el 100% del aporte.

```
puntaje = α · dificultad + β · antigüedad + γ · participación

% del récord   = puntaje / Σ puntajes
plata que suma = % × X
```

Los tres factores se normalizan a [0, 1] para que sean comparables.

### 3.1 Dificultad

```
dif = WR / NR          (eventos donde menos es mejor: casi todos)
dif = NR / WR          (3x3 Multi-Blind, donde más puntos es mejor)
```

Cerca de 1 = el récord uruguayo ya está a nivel mundial, romperlo es una hazaña.
Comparar single con single y media con media. Truncar a 1 por seguridad.

**MBLD**: convertir el resultado `X/Y tiempo` a puntos = `resueltos − fallados`.
Ej: `14/15` → 13 puntos. `63/65` → 61 puntos. `dif = 13/61`.

**Menos movimientos (FMC)**: son movimientos, no segundos. La razón funciona igual.
La media de FMC en la base viene ×100.

### 3.2 Antigüedad

```
t = 1 − e^(−días / τ)          τ por defecto = 365 días
```

Crece con los días sin caer, pero **satura**: un récord de 6 años no se come todo el
fondo. `τ` debe ser configurable.

### 3.3 Participación

```
n = √(personas) / max(√personas)        normalizado a [0,1]
```

La raíz comprime, así 3x3 con 80 competidores no aplasta a megaminx con 15.

**Decisión de política, expuesta como toggle:** ¿más gente debe pagar *más* (premiar el
récord más disputado) o *menos* (usar `1 − n`, para incentivar categorías nicho)?
No hay respuesta correcta. Que lo elija la AUS.

### 3.4 Pesos

`α`, `β`, `γ` son la política de la AUS. Configurables, y se **normalizan solos** a
suma 1 (así los sliders son independientes entre sí).

Valores de arranque: `α = 0.45`, `β = 0.35`, `γ = 0.20`.

---

## 4. Pago

Al romper un récord **no se vacía el fondo**. Se paga una fracción `f` y el resto queda
de semilla.

### 4.1 Por qué parcial

Contra la intuición, `f` **no cambia cuánto gana la gente en promedio**. En equilibrio,
si entre récord y récord entra una plata `C`:

```
Fondo de equilibrio = C / f
Premio              = f × (C/f) = C        ← independiente de f
```

Con `f = 100%` el fondo vale `C` y pagás `C`. Con `f = 60%` el fondo se estabiliza en
`1.67·C` y pagás `C` igual. Lo único que cambia `f` es **cuánta plata queda visible en
la vitrina**.

Lo que se compra bajando `f`:

- **Doble premio gratis**: si dos están en disputa y el segundo rompe poco después,
  todavía encuentra una bolsa grande. Sin contabilidad extra.
- **Ninguna categoría queda en cero** — una categoría recién vaciada deja de ser
  atractiva justo cuando querés que alguien la mire.
- **Amortigua el azar**: con `f = 100%`, quien rompe justo después de un aporte se lleva
  un premio enorme y el siguiente casi nada. Eso es ruido, no mérito.

Costo: capital inmovilizado `C·(1−f)/f` por fondo, ×33 fondos.

### 4.2 `f` variable según el margen de mejora

En vez de un umbral binario (cobra / no cobra), el margen **modula** cuánto cobra:

```
m    = (récord anterior − récord nuevo) / récord anterior
f(m) = f_min + (f_max − f_min) · (1 − e^(−m / m₀))
```

Misma curva saturada que la antigüedad, así el sistema no gana conceptos nuevos.

- `f_min = 0.25` — romper un récord nacional siempre vale algo. **Nunca 0**: con muchas
  mejoras chicas seguidas la plata se acumularía y no saldría nunca.
- `f_max = 0.80`
- `m₀` = **por evento**, no global.

**Por qué `m₀` va por evento (importante):** un margen grande es fácil cuando el récord
está blando y casi imposible cuando está cerca del mundial. Bajar 5x5 de 60s a 55s son
8% y no es una hazaña; bajar pyraminx de 3.20 a 3.10 son 3% y puede ser un año de
trabajo. Con un `m₀` global le pagarías **menos** justo a los récords de élite —
exactamente contra lo que hace el factor dificultad. El sistema se contradiría.

`m₀` sale de los datos: **mediana histórica de las mejoras del récord uruguayo en ese
evento**. Queda data-driven y defendible en asamblea: "pagamos completo cuando la mejora
supera lo que históricamente fue una mejora normal en esta categoría".

Fallback si no hay histórico suficiente (< 3 roturas): `m₀ = 0.03`.

**No hay riesgo de especulación**: los récords WCA se marcan solos al competir, nadie va
a ir más lento a propósito para guardarse el margen.

### 4.3 Bonus continental

Si el nuevo récord nacional **además trae el récord sudamericano a Uruguay**, se paga
`f = 0.85` en vez de la `f` por margen.

**Condición exacta — leer con cuidado, acá hubo dos bugs:**

> El bonus se paga cuando el récord continental **pasa de otro país a Uruguay**,
> y **una sola vez por persona por evento**.

- ❌ **Bug 1 — premiar tenerlo:** si Santiago ya tiene el sudamericano de Clock, cada
  vez que baja su propio NR "también rompe el SAR" por default y cobraría el bonus
  infinitas veces. Simulado: el fondo queda en **$62** después de 3 roturas.
- ❌ **Bug 2 — solo mirar que cambie el nombre:** si Santiago y Bruno se pasan el
  sudamericano entre ellos, el nombre cambia cada vez y **ambos** cobran bonus una y
  otra vez. Mismo bug con dos personas.
- ✅ **Correcto:** cambio de país (otro → Uruguay) **+** tope de una vez por persona por
  evento. Santiago cobra el bonus de Clock una vez en su vida; si después Bruno se lo
  arrebata, Bruno cobra el suyo (una vez). Rivalidad genuina premiada, ping-pong
  infinito bloqueado.

Aplica igual a singles y a medias.

Guardar por fondo: `bonus_cobrado_por: [wca_id, ...]`.

### 4.4 Por qué NO hace falta una regla anti-abuso

Caso real: Santiago Cabral rompió el sudamericano 3 veces seguidas.

**El sistema ya se autorregula.** El pago siempre equivale a lo acumulado desde la
rotura anterior:

| Rompe cada… | Cobra (fondo con ~$291/mes de entrada) |
|---|---|
| 1 mes | $291 |
| 6 meses | $1.746 |
| 24 meses | $6.984 |

Romper seguido **no es rentable**: se autolimita por pura aritmética del fondo.
Simulación de las 3 roturas de Santiago (2.20 → 2.15 → 2.12 → 2.10):

| Regla | Cobra total | Queda en el fondo |
|---|---|---|
| Bonus cada vez (bug) | $4.012 | $62 ☠️ |
| `f` fija 60% | $3.688 | $386 |
| `f` variable por margen | $3.279 | **$795** |

Los pagos caen de $1.893 → $859 → $527 **sin ninguna regla anti-abuso**.

**Opcional, NO implementar salvo que la AUS lo pida** — enfriamiento por persona: si el
mismo competidor vuelve a romper su propio récord antes de X meses, su `f` se reduce a
la mitad y el resto queda en el fondo. Una regla menos es una discusión menos en
asamblea.

---

## 5. Lo que se descartó (y por qué)

### Récord continental como cuarto factor del reparto

**Descartado.** La correlación entre `WR/NR` y `SAR/NR` es **0.954** — ambos tienen el
NR en el denominador, así que se mide casi lo mismo dos veces y solo se duplica el peso
de "qué tan bueno es nuestro récord". Mezclarlo 50/50 mueve como máximo $75 sobre
$10.000. Ruido.

Lo continental entra por el **bonus en el pago** (§4.3), donde no hay doble conteo.

*(Dato aparte: `SAR/WR` sí es información nueva — mide qué tan fuerte es Sudamérica en
ese evento. Square-1 0.68 = región floja, hay chance real de arrebatarlo; megaminx 0.92
= continental casi al nivel mundial, inalcanzable. No está en la fórmula, pero es un
buen insumo si algún día se quiere priorizar objetivos.)*

### Umbral mínimo de mejora binario

**Reemplazado** por la `f` variable (§4.2): una sola regla en vez de dos, sin
injusticias de borde.

---

## 6. Datos

Ya existe `wca_datos.py`. Lee el export oficial de la WCA y escribe `datos-wca.json`
con, por evento: `wr`, `nr`, `wrAvg`, `nrAvg`, `nrDate`, `days`, `ppl`, `pplAllTime`.

- ~~La API oficial de la WCA es solo OAuth y **no tiene endpoint de récords**.~~
  **Corregido (agosto 2026):** `GET /api/v0/records` existe, es público y devuelve
  récords mundiales, continentales y nacionales de todos los países en una llamada
  (~96 KB). La web lo usa para WR/SAR/NR y refresca al repartir. Lo que sigue
  necesitando el export es **participantes por evento** y **`m₀` por evento**.
- Las APIs no oficiales dan récords pero **no dan participantes por evento**, que solo
  sale de la tabla completa de resultados.
- La página `/results/records` **bloquea acceso automatizado** (robots).
- → El export oficial (~350 MB) es el único camino confiable. Se actualiza después de
  cada fin de semana de competencia.
- El script lee los encabezados **por nombre**, así sobrevive al cambio de esquema
  v1 → v2 (camelCase → snake_case) que la WCA hizo hace poco. Probado contra ambos.

**Los montos los carga la AUS a mano. El script nunca toca plata.**

Falta agregarle: `m₀` por evento (mediana histórica de mejoras) y el histórico de
récords continentales para detectar el cambio de país.

---

## 7. Estado actual (datos reales, julio 2026)

Calculado **solo con el factor dificultad** — faltan fechas de los NR y participantes
por evento. Reparto de $10.000 entre los 33 fondos:

| Evento | dif S | Single | dif M | Media |
|---|---|---|---|---|
| Clock | 0.695 | $446 | 0.723 | **$463** |
| Menos movimientos | 0.696 | $446 | 0.671 | $430 |
| 4x4x4 | 0.600 | $385 | 0.612 | $392 |
| Megaminx | 0.567 | $363 | 0.601 | $385 |
| Pyraminx | 0.593 | $380 | 0.514 | $329 |
| A una mano | 0.550 | $352 | 0.541 | $347 |
| 7x7x7 | 0.531 | $340 | 0.534 | $342 |
| 6x6x6 | 0.515 | $330 | 0.542 | $348 |
| 5x5x5 | 0.525 | $337 | 0.541 | $347 |
| Skewb | 0.465 | $298 | 0.500 | $320 |
| Square-1 | 0.465 | $298 | 0.408 | $261 |
| 3x3x3 | 0.460 | $295 | 0.430 | $275 |
| 2x2x2 | 0.429 | $275 | 0.382 | $245 |
| 3x3 a ciegas | 0.313 | $200 | 0.289 | $185 |
| Multi a ciegas | 0.213 | $137 | — | — |
| 4x4 a ciegas | 0.179 | $114 | 0.177 | $113 |
| 5x5 a ciegas | 0.168 | $107 | 0.180 | $116 |

Observaciones útiles para validar la implementación:

- El récord más duro de Uruguay es **la media de Clock** (0.723), no un single.
- En la mayoría de los eventos **la media es más difícil que el single** (4x4, megaminx,
  skewb, 6x6, 5x5, 5BLD): un single bueno sale de suerte, la media exige consistencia.
  Excepciones: pyraminx y Square-1.
- El **2x2 single está empatado** (0.91) entre Bruno Lezama y Santiago Cabral — el caso
  de disputa que motivó la `f` parcial.
- El **NR de Clock ES el sudamericano** (2.20, Santiago Cabral). El próximo que lo baje
  dispara el bonus continental automáticamente.
- Los blind quedan muy abajo porque los récords están lejos del mundial. Cuando entre el
  factor participación con el toggle en "menos gente = más premio", se corrige bastante.

---

## 8. Decisiones abiertas para la AUS

1. **Dirección del factor participación**: ¿más gente = más premio, o menos?
2. **Valor de `f_min` / `f_max`**: sugerido 0.25 / 0.80. Por debajo de 0.40 de fracción
   efectiva hay mucha plata dormida.
3. **`τ`**: 365 días por defecto.
4. **Ventana de participación**: 24 meses por defecto (flag `--months`), o histórico.
5. **`m₀`**: ¿sale del histórico o lo fija la AUS a mano por evento?
6. **Enfriamiento por persona**: implementar o no (§4.4).

---

## 9. Notas de implementación

- **Curva vs. tabla de tramos**: usar la curva internamente (no tiene saltos
  arbitrarios) pero **publicar una tabla de ejemplos** para que la comunidad vea qué
  cobraría en casos concretos. Los tramos se entienden más rápido pero generan
  injusticias de borde: quedar 0.01% abajo de un corte y cobrar bastante menos se siente
  arbitrario.
- **El reparto siempre suma 100%** — es un buen test de regresión.
- **Redondeo**: repartir centavos sobrantes al fondo más grande para que el total cierre
  exacto.
- **Trazabilidad**: guardar por cada pago el `m` calculado, la `f` aplicada, el fondo
  antes y después, y si hubo bonus. Esto se va a auditar.
- FMC y MBLD necesitan tratamiento especial en dificultad (§3.1) — marcarlos en la UI
  para revisión manual.
