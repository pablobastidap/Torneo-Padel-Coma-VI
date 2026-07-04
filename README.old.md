# VI Edición Torneo Pádel - versión configurable

## Arrancar
```powershell
npm install
npm run dev
```

## Supabase
1. Copia `.env.example` a `.env.local`.
2. Rellena URL y ANON KEY.
3. En Supabase > SQL Editor ejecuta `supabase.sql`.
4. En `/admin` entra con `636011`.
5. Pulsa **Crear/reset horarios base** una vez.

## Nuevo
- Horarios respetando partidos simultáneos: día 1 Plata en pista 1 y Oro en pista 2; día 2 eliminatorias, niños y finales.
- Asignación manual de A1, A2, B1... desde admin.
- Al asignar slots, los horarios muestran nombres reales automáticamente.
- Edición/eliminación de parejas y enlace directo a WhatsApp.
- Edición de horarios, pistas, resultados, ganadores y cruces.
- Estadísticas por categoría con puntos, PJ, PG, PP, juegos a favor/en contra y diferencia.
- Contraseña admin: 636011.
