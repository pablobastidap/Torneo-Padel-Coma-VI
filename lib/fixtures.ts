export type Category='Oro'|'Plata'|'Infantil'
export type Court='Pista 1'|'Pista 2'
export type Day='Día 1'|'Día 2'
export type Match={fixture_id:string;day:Day;start_time:string;end_time:string;court:Court;category:Category|'Libre';stage:string;group_name?:string;team1:string;team2:string;score?:string;winner?:string;notes?:string;next_match_id?:string;next_slot?:'team1'|'team2'}
export type Registration={id?:string;created_at?:string;player1:string;player2:string;phone:string;category:Category;slot?:string;paid?:boolean;notes?:string}
export const categoryLimits:Record<Category,number>={Oro:12,Plata:12,Infantil:6}
export const groups:Record<Category,string[]>={Oro:['A','B','C','D'],Plata:['A','B','C','D'],Infantil:['A','B']}
export const cats:Category[]=['Oro','Plata','Infantil']
export const adminPin='636011'
export function pairName(r:Registration){return `${r.player1} / ${r.player2}`}
export function slotOptions(cat:Category){return groups[cat].flatMap(g=>[1,2,3].map(n=>`${g}${n}`))}
export function whatsapp(phone?:string){
  const digits=(phone||'').replace(/\D/g,'')
  if(digits.length<9)return ''

  const n=digits.startsWith('34')?digits:'34'+digits

  const text=encodeURIComponent(
    'Hola! 👋 Te escribo del Torneo de Pádel de La Coma. Revisa la web porque puede haber nuevos horarios, resultados o próximos partidos actualizados: https://torneo-padel-coma.vercel.app'
  )

  return `https://wa.me/${n}?text=${text}`
}
export function displayTeam(code:string,regs:Registration[]){const r=regs.find(x=>x.slot===code);return r?pairName(r):code}
export function matchLabel(m:Match){return `${m.day} · ${m.start_time} · ${m.court} · ${m.stage} · ${m.category}`}
export function targetLabel(ms:Match[],id?:string,slot?:'team1'|'team2'){const m=ms.find(x=>x.fixture_id===id);return m?`${slot==='team2'?'Equipo 2':'Equipo 1'} de ${matchLabel(m)}`:'No pasa automáticamente'}
function clean(s:string){return s.replace(/[^A-Z0-9]+/gi,'-').replace(/^-|-$/g,'').toUpperCase()}
function match(day:Day,start:string,end:string,court:Court,cat:Category|'Libre',stage:string,team1='',team2='',idSuffix='',extra:Partial<Match>={}):Match{
  const fixture_id=clean(`${day}-${start}-${end}-${court}-${cat}-${stage}-${idSuffix}`)
  const group_name=(cat!=='Libre'&&stage.toLowerCase().includes('grupo')&&team1&&/^[A-D][123]$/.test(team1))?team1[0]:undefined
  return {fixture_id,day,start_time:start,end_time:end,court,category:cat,stage,group_name,team1,team2,...extra}
}
const adultTimes=[['09:00','09:40'],['09:45','10:25'],['10:30','11:10'],['11:15','11:55'],['12:00','12:40'],['12:45','13:25'],['13:30','14:10'],['14:15','14:55'],['15:00','15:40'],['15:45','16:25'],['16:30','17:10'],['17:15','17:55'],['18:00','18:40'],['18:45','19:25'],['19:30','20:10'],['20:15','20:55'],['21:00','21:40']]
const adultPairs=[['A1','A2'],['B1','B2'],['C1','C2'],['D1','D2'],['A1','A3'],['B1','B3'],null,['C1','C3'],['D1','D3'],['A2','A3'],['B2','B3'],['C2','C3'],['D2','D3'],null,null,null,null] as const
function adultGroup(day:Day,start:string,end:string,index:number){const pair=adultPairs[index]; if(!pair)return [match(day,start,end,'Pista 1','Libre','Comida / Reserva','','',`D1-P1-${index}`),match(day,start,end,'Pista 2','Libre','Comida / Reserva','','',`D1-P2-${index}`)]; const [a,b]=pair; return [match(day,start,end,'Pista 1','Plata','Fase de grupos',a,b,`PLATA-G-${index+1}`),match(day,start,end,'Pista 2','Oro','Fase de grupos',a,b,`ORO-G-${index+1}`)]}
export function defaultMatches():Match[]{
 const ms:Match[]=[]
 adultTimes.forEach((t,i)=>ms.push(...adultGroup('Día 1',t[0],t[1],i)))
 const qf=(time:string[],court:Court,cat:Category,team1:string,team2:string,id:string,next:string,nextSlot:'team1'|'team2')=>match('Día 2',time[0],time[1],court,cat,'Cuartos de final',team1,team2,id,{next_match_id:next,next_slot:nextSlot})
 const sf=(time:string[],court:Court,cat:Category,team1:string,team2:string,id:string,next:string,nextSlot:'team1'|'team2')=>match('Día 2',time[0],time[1],court,cat,'Semifinales',team1,team2,id,{next_match_id:next,next_slot:nextSlot})
 const final=(time:string[],court:Court,cat:Category,team1:string,team2:string,id:string)=>match('Día 2',time[0],time[1],court,cat,'Finales',team1,team2,id)
 const ids={sp1:'SF-PLATA-1',sp2:'SF-PLATA-2',so1:'SF-ORO-1',so2:'SF-ORO-2',fp:'FINAL-PLATA',fo:'FINAL-ORO',fi:'FINAL-INFANTIL'}
 ms.push(
 qf(['09:00','09:40'],'Pista 1','Plata','1º Plata A','2º Plata B','QF-PLATA-1',ids.sp1,'team1'),
 qf(['09:00','09:40'],'Pista 2','Plata','1º Plata C','2º Plata D','QF-PLATA-2',ids.sp1,'team2'),
 qf(['09:45','10:25'],'Pista 1','Plata','1º Plata B','2º Plata A','QF-PLATA-3',ids.sp2,'team1'),
 qf(['09:45','10:25'],'Pista 2','Plata','1º Plata D','2º Plata C','QF-PLATA-4',ids.sp2,'team2'),
 qf(['10:30','11:10'],'Pista 1','Oro','1º Oro A','2º Oro B','QF-ORO-1',ids.so1,'team1'),
 qf(['10:30','11:10'],'Pista 2','Oro','1º Oro C','2º Oro D','QF-ORO-2',ids.so1,'team2'),
 qf(['11:15','11:55'],'Pista 1','Oro','1º Oro B','2º Oro A','QF-ORO-3',ids.so2,'team1'),
 qf(['11:15','11:55'],'Pista 2','Oro','1º Oro D','2º Oro C','QF-ORO-4',ids.so2,'team2'),
 sf(['12:00','12:40'],'Pista 1','Plata','Ganador QF Plata 1','Ganador QF Plata 2',ids.sp1,ids.fp,'team1'),
 sf(['12:00','12:40'],'Pista 2','Plata','Ganador QF Plata 3','Ganador QF Plata 4',ids.sp2,ids.fp,'team2'),
 sf(['12:45','13:25'],'Pista 1','Oro','Ganador QF Oro 1','Ganador QF Oro 2',ids.so1,ids.fo,'team1'),
 sf(['12:45','13:25'],'Pista 2','Oro','Ganador QF Oro 3','Ganador QF Oro 4',ids.so2,ids.fo,'team2'),
 match('Día 2','13:30','14:10','Pista 1','Libre','Comida','','','COMIDA-P1'),match('Día 2','13:30','14:10','Pista 2','Libre','Comida','','','COMIDA-P2'),
 match('Día 2','14:15','14:55','Pista 1','Infantil','Fase de grupos niños','A1','A2','INF-G-A-1'),match('Día 2','14:15','14:55','Pista 2','Infantil','Fase de grupos niños','B1','B2','INF-G-B-1'),
 match('Día 2','14:55','15:20','Pista 1','Infantil','Fase de grupos niños','A1','A3','INF-G-A-2'),match('Día 2','14:55','15:20','Pista 2','Infantil','Fase de grupos niños','B1','B3','INF-G-B-2'),
 match('Día 2','15:25','15:50','Pista 1','Infantil','Fase de grupos niños','A2','A3','INF-G-A-3'),match('Día 2','15:25','15:50','Pista 2','Infantil','Fase de grupos niños','B2','B3','INF-G-B-3'),
 match('Día 2','15:55','16:20','Pista 1','Libre','Reserva','','','RESERVA-1'),match('Día 2','15:55','16:20','Pista 2','Libre','Reserva','','','RESERVA-2'),
 sf(['16:25','16:50'],'Pista 1','Infantil','1º Infantil A','2º Infantil B','SF-INFANTIL-1',ids.fi,'team1'),
 sf(['16:25','16:50'],'Pista 2','Infantil','1º Infantil B','2º Infantil A','SF-INFANTIL-2',ids.fi,'team2'),
 match('Día 2','17:05','18:05','Pista 1','Libre','Final reserva','','','FINAL-RESERVA-1'),final(['17:05','18:05'],'Pista 2','Infantil','Ganador SF Infantil 1','Ganador SF Infantil 2',ids.fi),
 match('Día 2','18:10','19:10','Pista 1','Libre','Final reserva','','','FINAL-RESERVA-2'),final(['18:10','19:10'],'Pista 2','Plata','Ganador SF Plata 1','Ganador SF Plata 2',ids.fp),
 final(['19:15','20:15'],'Pista 1','Oro','Ganador SF Oro 1','Ganador SF Oro 2',ids.fo),match('Día 2','19:15','20:15','Pista 2','Libre','Final reserva','','','FINAL-RESERVA-3')
 )
 return ms
}
export function parseScore(score?:string){if(!score)return null; const nums=(score.match(/\d+/g)||[]).map(Number); if(nums.length<2)return null; let a=0,b=0; for(let i=0;i<nums.length;i+=2){a+=nums[i]||0;b+=nums[i+1]||0} return {a,b,diff:a-b,winner:a>b?'team1':b>a?'team2':'' as ''|'team1'|'team2'}}
export function allPairStats(regs:Registration[],matches:Match[],onlyGroups=false){return regs.map(r=>{const aliases=[r.slot,pairName(r)].filter(Boolean) as string[]; let pj=0,pg=0,pp=0,jf=0,jc=0; matches.filter(m=>m.category===r.category && (!onlyGroups||m.stage.toLowerCase().includes('grupo'))).forEach(m=>{if(!aliases.includes(m.team1)&&!aliases.includes(m.team2))return; const s=parseScore(m.score); if(!s)return; pj++; const is1=aliases.includes(m.team1); jf+=is1?s.a:s.b; jc+=is1?s.b:s.a; const won=is1?s.winner==='team1':s.winner==='team2'; if(won)pg++; else pp++}); return{slot:r.slot||'',category:r.category,name:pairName(r),pj,pg,pp,jf,jc,dj:jf-jc,pts:pg*3,winRate:pj?Math.round(pg/pj*100):0}})}
export function statsFor(cat:Category,regs:Registration[],matches:Match[]){return slotOptions(cat).map(slot=>{const r=regs.find(x=>x.category===cat&&x.slot===slot); const name=r?pairName(r):slot; const base=allPairStats(r?[r]:[{player1:slot,player2:'',phone:'',category:cat,slot}],matches,true)[0]; return{...base,slot,name,group:slot[0]}}).sort((a,b)=>a.group.localeCompare(b.group)||b.pts-a.pts||b.dj-a.dj||b.jf-a.jf)}
export function groupRows(cat:Category,regs:Registration[],matches:Match[],group:string){return statsFor(cat,regs,matches).filter(r=>r.group===group)}
export function nextTargets(matches:Match[]){return matches.filter(m=>m.category!=='Libre').map(m=>({value:m.fixture_id,label:matchLabel(m)}))}
