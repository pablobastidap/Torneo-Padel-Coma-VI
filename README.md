# VI Edición Torneo Pádel - v7

Versión reorganizada y más fácil de modificar.

## Ejecutar

```bash
npm install
npm run dev
```

## Supabase

1. Crea `.env.local` copiando `.env.example`.
2. Pega tu `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Ejecuta `supabase.sql` en Supabase SQL Editor.
4. Entra en `/admin` con contraseña `636011`.
5. Pulsa **Restaurar horarios base** una vez para cargar los partidos.

## Qué se ha mejorado

- Horarios con columnas correctas: Inicio, Final, Pista 1, Pista 2.
- Fase de grupos separada por categoría y por grupo.
- DJ = diferencia de juegos.
- Estadísticas públicas generales: pareja con más juegos, mejor DJ, más victorias y ranking general.
- Admin más configurable:
  - editar/eliminar parejas
  - asignar A1, A2, B1...
  - editar horarios, pistas y parejas de cada partido
  - guardar resultados
  - elegir ganador
  - pasar ganador a otro partido sin ver IDs raros
  - abrir WhatsApp de cada pareja
- Código dividido en carpetas:
  - `components/schedule`
  - `components/standings`
  - `components/stats`
  - `lib/fixtures.ts`

## Para cambiar cosas tú

- Horarios base y cruces: `lib/fixtures.ts`
- Diseño: `app/globals.css`
- Web pública: `app/page.tsx`
- Panel admin: `app/admin/page.tsx`
- Tabla de horarios: `components/schedule/ScheduleTable.tsx`
- Clasificaciones: `components/standings/Standings.tsx`
- Estadísticas públicas: `components/stats/PublicStats.tsx`

## Cambio v8: filtro de partidos en admin

En `Panel admin > Horarios` y `Panel admin > Resultados` ahora hay tres filtros:

- **Pendientes**: solo muestra partidos sin resultado ni ganador. Es el modo por defecto para trabajar rápido durante el torneo.
- **Completados**: muestra los partidos que ya tienen resultado o ganador.
- **Todos**: muestra todos los partidos.

Un partido se considera completado cuando tiene guardado un resultado en `score` o un ganador en `winner`.
