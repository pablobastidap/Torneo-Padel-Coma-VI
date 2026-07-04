'use client'

import {useEffect,useMemo,useState} from 'react'
import Link from 'next/link'
import {supabase} from '@/lib/supabase'
import {
  Category,
  Match,
  Registration,
  adminPin,
  cats,
  defaultMatches,
  displayTeam,
  matchLabel,
  nextTargets,
  pairName,
  parseScore,
  slotOptions,
  targetLabel,
  whatsapp,
} from '@/lib/fixtures'
import {PublicStats} from '@/components/stats/PublicStats'

type MatchFilter = 'pendientes' | 'completados' | 'todos'

function isCompleted(m: Match) {
  return Boolean(m.score?.trim() || m.winner?.trim())
}

function filterMatches(matches: Match[], filter: MatchFilter) {
  if (filter === 'todos') return matches
  if (filter === 'completados') return matches.filter(isCompleted)
  return matches.filter(m => !isCompleted(m))
}

export default function Admin() {
  const [ok, setOk] = useState(false)
  const [pin, setPin] = useState('')
  const [msg, setMsg] = useState('')
  const [regs, setRegs] = useState<Registration[]>([])
  const [matches, setMatches] = useState<Match[]>(defaultMatches())
  const [section, setSection] = useState('parejas')
  const [matchFilter, setMatchFilter] = useState<MatchFilter>('pendientes')
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)
  const [selectedMode, setSelectedMode] = useState<'horario' | 'resultado'>('resultado')
  const [settings, setSettings] = useState<Record<string, string>>({})

  useEffect(() => {
    if (ok) load()
  }, [ok])

  async function load() {
    if (!supabase) return setMsg('Falta Supabase en .env.local.')
    const [{data: r}, {data: m}, {data: s}] = await Promise.all([
  supabase.from('registrations').select('*').order('category').order('slot'),
  supabase.from('matches').select('*').order('day').order('start_time'),
  supabase.from('settings').select('*'),
])
    if (r) setRegs(r as any)
      if (s) setSettings(Object.fromEntries(s.map((x: any) => [x.key, x.value])))
if (m && m.length) {
  setMatches(m as any)
} else {
  setMatches(defaultMatches())
}
  }

  async function seed() {
    if (!supabase) return
    const {error} = await supabase.from('matches').upsert(defaultMatches(), {onConflict: 'fixture_id'})
    setMsg(error ? 'Error creando horarios' : 'Horarios base creados / restaurados.')
    await load()
  }

  async function saveReg(r: Registration) {
    if (!supabase) return
    const {error} = await supabase.from('registrations').update(r).eq('id', r.id)
    setMsg(error ? 'Error guardando pareja' : 'Pareja guardada.')
    load()
  }

  async function delReg(id?: string) {
    if (!id || !supabase) return
    if (!confirm('¿Eliminar pareja?')) return
    await supabase.from('registrations').delete().eq('id', id)
    load()
  }

  async function saveSetting(key: string, value: string) {
  if (!supabase) return

  const { error } = await supabase
    .from('settings')
    .upsert({ key, value }, { onConflict: 'key' })

  setMsg(error ? `Error guardando texto: ${error.message}` : 'Texto guardado.')
  await load()
}

  async function saveMatch(m: Match) {
setMsg('Guardando partido...')

if (!supabase) {
  setMsg('Supabase no está conectado. Revisa .env.local')
  return
}

const score = parseScore(m.score || '')

const winner =
  score?.winner === 'team1'
    ? m.team1
    : score?.winner === 'team2'
      ? m.team2
      : m.winner || ''

const payload = {
  fixture_id: m.fixture_id,
  day: m.day,
  start_time: m.start_time,
  end_time: m.end_time,
  court: m.court,
  stage: m.stage,
  category: m.category,
  group_name: m.group_name || null,
  team1: m.team1 || '',
  team2: m.team2 || '',
  score: m.score || '',
  winner,
  next_match_id: m.next_match_id || null,
  next_slot: m.next_slot || null,
}

const { error } = await supabase
  .from('matches')
  .update(payload)
  .eq('fixture_id', m.fixture_id)

if (error) {
  console.error(error)
  setMsg(`Error guardando partido: ${error.message}`)
  return
}

if (winner && m.next_match_id && m.next_slot) {
  const next = matches.find(x => x.fixture_id === m.next_match_id)
  if (next) {
    const { error: nextError } = await supabase
      .from('matches')
      .update({ [m.next_slot]: winner })
      .eq('fixture_id', next.fixture_id)

    if (nextError) {
      console.error(nextError)
      setMsg(`Partido guardado, pero error pasando ganador: ${nextError.message}`)
      await load()
      return
    }
  }
}

setMsg('✅ Partido guardado correctamente.')
await load()

}

function exportMatchesCSV() {
  const headers = ['Día','Inicio','Final','Pista','Categoría','Fase','Pareja 1','Pareja 2','Resultado','Ganador']

  const rows = matches.map(m => [
    m.day,
    m.start_time,
    m.end_time,
    m.court,
    m.category,
    m.stage,
    displayTeam(m.team1, regs),
    displayTeam(m.team2, regs),
    m.score || '',
    displayTeam(m.winner || '', regs),
  ])

  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replaceAll('"', '""')}"`).join(','))
    .join('\n')

  const blob = new Blob([csv], {type: 'text/csv;charset=utf-8;'})
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'resultados-torneo-padel.csv'
  a.click()
  URL.revokeObjectURL(url)
}

  if (!ok) {
    return (
      <main className="login">
        <form onSubmit={e => { e.preventDefault(); pin === adminPin ? setOk(true) : setMsg('Contraseña incorrecta') }}>
          <h1>Panel privado</h1>
          <input type="password" value={pin} onChange={e => setPin(e.target.value)} placeholder="Contraseña" />
          <button>Entrar</button>
          {msg && <p className="notice">{msg}</p>}
          <Link href="/">Volver a la web</Link>
        </form>
      </main>
    )
  }

  const targetOptions = nextTargets(matches)
  const visibleMatches = filterMatches(matches, matchFilter)
  const pendingCount = matches.filter(m => !isCompleted(m)).length
  const completedCount = matches.filter(isCompleted).length

  return (
    <main className="admin">
      <header>
        <div>
          <h1>Panel admin</h1>
          <p>Todo está dividido para que puedas cambiar cosas sin tocar código: parejas, horarios, resultados, cruces, WhatsApp y estadísticas.</p>
        </div>
        <div className="adminActions">
          <button onClick={seed}>Restaurar horarios base</button>
<button onClick={exportMatchesCSV}>Exportar CSV</button>
<Link href="/">Ver web</Link>
        </div>
      </header>

      {msg && <p className="notice">{msg}</p>}

      <nav className="adminTabs">
        {['parejas', 'horarios', 'resultados', 'whatsapp', 'estadisticas', 'textos', 'ayuda'].map(x => (
          <button key={x} onClick={() => setSection(x)} className={section === x ? 'on' : ''}>{x}</button>
        ))}
      </nav>

      {section === 'parejas' && (
        <section className="adminGrid">
          {cats.map(c => (
            <div className="card" key={c}>
              <h2>{c}</h2>
              <p className="muted">Asigna A1, B2, etc. Al guardar, los horarios públicos cambian automáticamente.</p>
              {regs.filter(r => r.category === c).map(r => (
                <RegEditor key={r.id || pairName(r)} r={r} onSave={saveReg} onDelete={delReg} />
              ))}
            </div>
          ))}
        </section>
      )}

      {section === 'horarios' && (
        <section className="card">
          <AdminMatchHeader
            title="Horarios"
            description="Por defecto solo ves partidos pendientes. Los completados se esconden para que el panel sea más fácil durante el torneo. Puedes cambiar a Completados o Todos cuando quieras."
            filter={matchFilter}
            setFilter={setMatchFilter}
            pendingCount={pendingCount}
            completedCount={completedCount}
          />
          <div className="editorList">
            {visibleMatches.length === 0 && <p className="notice">No hay partidos en este filtro.</p>}
            {visibleMatches.map((m, i) => (
              <button
  key={`${m.fixture_id}-${m.day}-${m.start_time}-${m.court}-${i}`}
  className={`matchOpenCard ${isCompleted(m) ? 'completed' : ''}`}
  onClick={() => {
    setSelectedMatch(m)
    setSelectedMode('horario')
  }}
>
  <b>{matchLabel(m)}</b>
  <span>{displayTeam(m.team1, regs)} vs {displayTeam(m.team2, regs)}</span>
  <em>{isCompleted(m) ? 'Completado' : 'Pendiente'}</em>
</button>
            ))}
          </div>
        </section>
      )}

      {section === 'resultados' && (
        <section className="card">
          <AdminMatchHeader
            title="Resultados y cruces"
            description="Introduce el resultado, elige ganador y decide a qué partido pasa. Por defecto se muestran solo los pendientes."
            filter={matchFilter}
            setFilter={setMatchFilter}
            pendingCount={pendingCount}
            completedCount={completedCount}
          />
          <div className="editorList">
            {visibleMatches.filter(m => m.category !== 'Libre').length === 0 && <p className="notice">No hay partidos en este filtro.</p>}
            {visibleMatches.filter(m => m.category !== 'Libre').map((m, i) => (
              <button
  key={`res-${m.fixture_id}-${i}`}
  className={`matchOpenCard ${isCompleted(m) ? 'completed' : ''}`}
  onClick={() => {
    setSelectedMatch(m)
    setSelectedMode('resultado')
  }}
>
  <b>{matchLabel(m)}</b>
  <span>{displayTeam(m.team1, regs)} vs {displayTeam(m.team2, regs)}</span>
  <em>{m.score || (isCompleted(m) ? 'Completado' : 'Pendiente')}</em>
</button>
            ))}
          </div>
        </section>
      )}

      {section === 'whatsapp' && (
        <section className="card">
          <h2>WhatsApp</h2>
          <p className="muted">Acceso directo al WhatsApp de cada pareja, si el número está bien escrito.</p>
          <div className="wspGrid">
            {regs.map(r => (
              <div className="wspCard" key={r.id || pairName(r)}>
                <b>{pairName(r)}</b>
                <span>{r.category} · {r.slot || 'Sin slot'}</span>
                <small>{r.phone}</small>
                {whatsapp(r.phone) ? <a className="wsp" href={whatsapp(r.phone)} target="_blank">Abrir WhatsApp</a> : <em>Número no válido</em>}
              </div>
            ))}
          </div>
        </section>
      )}

      {section === 'estadisticas' && <section><PublicStats regs={regs} matches={matches} /></section>}
      {section === 'textos' && (
  <section className="card">
    <h2>Textos de la web</h2>
    <p className="muted">Cambia títulos, subtítulos y normas sin tocar código.</p>

    {[
  ['site_title', 'Título principal'],
  ['site_subtitle', 'Subtítulo'],
  ['hero_text', 'Texto de portada'],
  ['rules_text', 'Normas e inscripción'],
].map(([key, label]) => (
  <div className="textEdit" key={key}>
    <label>{label}</label>
    <textarea
      value={settings[key] || ''}
      onChange={e => setSettings({...settings, [key]: e.target.value})}
    />
    <button onClick={() => saveSetting(key, settings[key] || '')}>
      Guardar
    </button>
  </div>
))}
  </section>
)}
      {section === 'ayuda' && <Help />}
      {selectedMatch && (
  <div className="modalBackdrop" onClick={() => setSelectedMatch(null)}>
    <div className="matchModal" onClick={e => e.stopPropagation()}>
      <button className="modalClose" onClick={() => setSelectedMatch(null)}>×</button>
      <MatchEditor
        mode={selectedMode}
        m={selectedMatch}
        regs={regs}
        matches={matches}
        targets={targetOptions}
        onSave={async m => {
          await saveMatch(m)
          setSelectedMatch(null)
        }}
      />
    </div>
  </div>
)}
    </main>
    
  )
}

function AdminMatchHeader({
  title,
  description,
  filter,
  setFilter,
  pendingCount,
  completedCount,
}: {
  title: string
  description: string
  filter: MatchFilter
  setFilter: (filter: MatchFilter) => void
  pendingCount: number
  completedCount: number
}) {
  return (
    <div className="adminMatchHeader">
      <div>
        <h2>{title}</h2>
        <p className="muted">{description}</p>
      </div>
      <div className="statusFilter">
        <button className={filter === 'pendientes' ? 'on' : ''} onClick={() => setFilter('pendientes')}>Pendientes · {pendingCount}</button>
        <button className={filter === 'completados' ? 'on' : ''} onClick={() => setFilter('completados')}>Completados · {completedCount}</button>
        <button className={filter === 'todos' ? 'on' : ''} onClick={() => setFilter('todos')}>Todos · {pendingCount + completedCount}</button>
      </div>
    </div>
  )
}

function RegEditor({r, onSave, onDelete}: {r: Registration; onSave: (r: Registration) => void; onDelete: (id?: string) => void}) {
  const [x, setX] = useState(r)
  useEffect(() => setX(r), [r])

  return (
    <div className="regEdit">
      <input value={x.player1} onChange={e => setX({...x, player1: e.target.value})} placeholder="Jugador 1" />
      <input value={x.player2} onChange={e => setX({...x, player2: e.target.value})} placeholder="Jugador 2" />
      <input value={x.phone || ''} onChange={e => setX({...x, phone: e.target.value})} placeholder="WhatsApp" />
      <select value={x.category} onChange={e => setX({...x, category: e.target.value as Category, slot: ''})}>{cats.map(c => <option key={c}>{c}</option>)}</select>
      <select value={x.slot || ''} onChange={e => setX({...x, slot: e.target.value})}><option value="">Sin slot</option>{slotOptions(x.category).map(s => <option key={s}>{s}</option>)}</select>
      <label className="check"><input type="checkbox" checked={!!x.paid} onChange={e => setX({...x, paid: e.target.checked})} />Pagado</label>
      <button onClick={() => onSave(x)}>Guardar</button>
      <button className="danger" onClick={() => onDelete(x.id)}>Eliminar</button>
      {whatsapp(x.phone) && <a className="wsp" href={whatsapp(x.phone)} target="_blank">WhatsApp</a>}
    </div>
  )
}

function MatchEditor({m, regs, matches, targets, onSave, mode}: {m: Match; regs: Registration[]; matches: Match[]; targets: {value: string; label: string}[]; onSave: (m: Match) => void; mode: 'horario' | 'resultado'}) {
  const [x, setX] = useState(m)
  useEffect(() => setX(m), [m])

  const currentTarget = x.next_match_id ? `${x.next_match_id}|${x.next_slot || 'team1'}` : ''
  const shownWinner = x.winner || ''
  const completed = isCompleted(x)

  function setTarget(v: string) {
    if (!v) return setX({...x, next_match_id: '', next_slot: undefined})
    const [id, slot] = v.split('|')
    setX({...x, next_match_id: id, next_slot: slot as 'team1' | 'team2'})
  }

  return (
    <div className={`matchEdit ${String(x.category).toLowerCase()} ${completed ? 'completed' : ''}`}>
      <div className="mini">
        <b>{matchLabel(x)}</b>
        <span>{x.category !== 'Libre' ? ` · ${displayTeam(x.team1, regs)} vs ${displayTeam(x.team2, regs)}` : ''}</span>
        <em className={`statusTag ${completed ? 'done' : 'todo'}`}>{completed ? 'Completado' : 'Pendiente'}</em>
      </div>

      {mode === 'horario' && (
        <>
          <label>Inicio<input value={x.start_time} onChange={e => setX({...x, start_time: e.target.value})} /></label>
          <label>Final<input value={x.end_time} onChange={e => setX({...x, end_time: e.target.value})} /></label>
          <label>Pista<select value={x.court} onChange={e => setX({...x, court: e.target.value as any})}><option>Pista 1</option><option>Pista 2</option></select></label>
          <label>Fase<input value={x.stage} onChange={e => setX({...x, stage: e.target.value})} /></label>
          <label>Pareja 1 / slot<input value={x.team1} onChange={e => setX({...x, team1: e.target.value})} /></label>
          <label>Pareja 2 / slot<input value={x.team2} onChange={e => setX({...x, team2: e.target.value})} /></label>
        </>
      )}

      {mode === 'resultado' && (
        <>
          <label>Resultado<input value={x.score || ''} onChange={e => setX({...x, score: e.target.value})} placeholder="Ej: 6-4 6-3" /></label>
          <label>Ganador<select value={shownWinner} onChange={e => setX({...x, winner: e.target.value})}><option value="">Automático por resultado</option><option value={x.team1}>{displayTeam(x.team1, regs)}</option><option value={x.team2}>{displayTeam(x.team2, regs)}</option></select></label>
          <label className="wideLabel">Pasar ganador a<select value={currentTarget} onChange={e => setTarget(e.target.value)}><option value="">No pasa automáticamente</option>{targets.filter(t => t.value !== x.fixture_id).flatMap(t => [<option key={`${t.value}-team1`} value={`${t.value}|team1`}>Equipo 1 de {t.label}</option>, <option key={`${t.value}-team2`} value={`${t.value}|team2`}>Equipo 2 de {t.label}</option>])}</select></label>
          <p className="muted tiny">Ahora: {targetLabel(matches, x.next_match_id, x.next_slot)}</p>
        </>
      )}

      <button onClick={() => onSave(x)}>Guardar</button>
    </div>
  )
}

function Help() {
  return (
    <section className="card">
      <h2>Cómo cambiar cosas sin empezar de cero</h2>
      <div className="helpGrid">
        <p><b>Horarios base:</b> abre <code>lib/fixtures.ts</code>. Ahí están las horas, pistas y cruces iniciales.</p>
        <p><b>Diseño:</b> abre <code>app/globals.css</code>. Cambia colores, tamaños y estilos.</p>
        <p><b>Página pública:</b> abre <code>app/page.tsx</code>. Ahí están los apartados visibles.</p>
        <p><b>Admin:</b> abre <code>app/admin/page.tsx</code>. Ahí están las pestañas privadas.</p>
        <p><b>Componentes:</b> mira <code>components/</code>. Horarios, grupos y estadísticas están separados para tocar solo lo necesario.</p>
        <p><b>Filtro de partidos:</b> en el admin, por defecto se muestran pendientes. Los partidos con resultado o ganador se consideran completados.</p>
      </div>
    </section>
  )
}
