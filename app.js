const fmt=n=>n==null||n===''?'—':Number(n).toLocaleString('en-MY');
const money=n=>n==null?'—':`RM ${Number(n).toLocaleString('en-MY')}`;
const safe=v=>v==null||v===''?'Belum tersedia':v;
const palette={red:'#d6282f',orange:'#ee6425',gold:'#f6aa1c',orange2:'#f27a21',ink:'#44342f',muted:'#8c7b72',cream:'#fff8f1'};
let projects=[],summary={},districtStats=[],sources=[];
let waitingChart,districtChart,map;

async function load(){
  try{
    [projects,summary,districtStats,sources]=await Promise.all([
      fetch('projects.json').then(r=>r.json()),fetch('state_summary.json').then(r=>r.json()),fetch('district_stats.json').then(r=>r.json()),fetch('sources.json').then(r=>r.json())
    ]);
    buildFilters(); renderAll(); initMap(); renderSources();
    document.getElementById('coverageBadge').textContent=`${projects.length} source-traceable records • 447 LPHS baseline + 2026 updates`;
  }catch(e){console.error(e);document.getElementById('coverageBadge').textContent='Data load error';}
}
function buildFilters(){
  const values=k=>[...new Set(projects.map(p=>p[k]).filter(Boolean))].sort();
  [['schemeFilter','scheme'],['districtFilter','district'],['statusFilter','status'],['snapshotFilter','snapshot']].forEach(([id,k])=>{
    const s=document.getElementById(id);values(k).forEach(v=>s.add(new Option(v,v)));s.addEventListener('change',renderFiltered);
  });document.getElementById('searchFilter').addEventListener('input',renderFiltered);
}
function kpi(label,value,meta,chip){return `<div class="kpi"><div class="label">${label}</div><div class="value">${value}</div><div class="meta">${meta}</div>${chip?`<div class="chip">${chip}</div>`:''}</div>`}
function renderAll(){
 const r=summary.rsku,i=summary.rumah_idaman,p=summary.ppr,s=summary.smart_sewa;
 document.getElementById('kpiGrid').innerHTML=[
   kpi('RSKU Ditawarkan 2021–2025',fmt(r.offered_2021_2025),`Sasaran ${fmt(r.target_2021_2025)} unit`,`${r.achievement_pct}% sasaran`),
   kpi('RSKU Siap Dibina',fmt(r.completed),'Statewide snapshot 2026',`${fmt(r.unsold)} belum terjual`),
   kpi('Senarai Menunggu RSKU',fmt(r.waiting_list),'Permohonan menunggu','Demand pressure'),
   kpi('Rumah Idaman Siap',fmt(i.completed_units),`${i.completed_projects} projek siap`,'Completed stock'),
   kpi('Rumah Idaman Dibina',fmt(i.under_construction_units),`${i.under_construction_projects} projek dalam pembinaan`,'Active pipeline'),
   kpi('PPR Menunggu',fmt(p.waiting_list),`${fmt(p.occupied)} unit dihuni`,`${fmt(p.available)} tersedia`)
 ].join('');
 document.getElementById('rskuPrice').textContent=`Sehingga ${money(r.price_control_max_rm)}`;
 document.getElementById('rskuOffered').textContent=fmt(r.offered_2021_2025);
 document.getElementById('rskuAchievement').textContent=`${r.achievement_pct}%`;
 document.getElementById('rskuUnsold').textContent=fmt(r.unsold);
 renderWaiting(); renderDistrict(); renderPipeline(); renderBaseline(); renderFiltered();
}
function renderBaseline(){
 const b=summary.lphs_q1_2025||{};
 document.getElementById('baselineStrip').innerHTML=[
  `<div class="baseline-item"><span>LPHS baseline records</span><strong>${fmt(b.records)}</strong><small>Snapshot Q1 2025</small></div>`,
  `<div class="baseline-item"><span>Siap bina</span><strong>${fmt(b.completed_projects)} projek</strong><small>${fmt(b.completed_units)} unit</small></div>`,
  `<div class="baseline-item"><span>Dalam pembinaan</span><strong>${fmt(b.under_construction_projects)} projek</strong><small>${fmt(b.under_construction_units)} unit</small></div>`,
  `<div class="baseline-item"><span>Dalam perancangan</span><strong>${fmt(b.planning_records)} rekod</strong><small>${fmt(b.planning_units_known)} unit diketahui • ${fmt(b.planning_records_without_unit)} tanpa angka unit</small></div>`
 ].join('');
}
function renderWaiting(){
 const c=document.getElementById('waitingChart'); if(waitingChart)waitingChart.destroy();
 waitingChart=new Chart(c,{type:'bar',data:{labels:['RSKU Waiting','PPR Waiting','PPR Occupied','Smart Sewa Occupied'],datasets:[{data:[summary.rsku.waiting_list,summary.ppr.waiting_list,summary.ppr.occupied,summary.smart_sewa.occupied],backgroundColor:[palette.red,palette.gold,palette.orange2,palette.orange],borderRadius:7,maxBarThickness:45}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{grid:{display:false},ticks:{font:{size:9},color:palette.muted}},y:{beginAtZero:true,grid:{color:'#f1e7df'},ticks:{font:{size:9},color:palette.muted}}}}});
}
function renderDistrict(){
 const labels=districtStats.map(x=>x.district),vals=districtStats.map(x=>x.units); const c=document.getElementById('districtChart'); if(districtChart)districtChart.destroy();
 districtChart=new Chart(c,{type:'bar',data:{labels,datasets:[{label:'Unit dalam pembinaan',data:vals,backgroundColor:[palette.red,palette.orange,palette.gold,palette.orange2],borderRadius:7}]},options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{beginAtZero:true,grid:{color:'#f1e7df'},ticks:{font:{size:9},color:palette.muted}},y:{grid:{display:false},ticks:{font:{size:9},color:palette.ink}}}}});
 const total=districtStats.reduce((a,b)=>a+b.units,0),n=districtStats.reduce((a,b)=>a+b.projects,0);
 document.getElementById('pipelineStrip').innerHTML=`<div><span>Total pipeline units</span><strong>${fmt(total)}</strong></div><div><span>Active projects</span><strong>${n}</strong></div>`;
}
function initMap(){
 map=L.map('map',{zoomControl:true}).setView([3.15,101.55],8);L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'&copy; OpenStreetMap contributors'}).addTo(map);
 const max=Math.max(...districtStats.map(d=>d.units));districtStats.forEach((d,i)=>{if(!d.map_point)return;const [lat,lng]=d.map_point;const radius=10+18*(d.units/max);const cols=[palette.red,palette.orange,palette.gold,palette.orange2];L.circleMarker([lat,lng],{radius,color:'#fff',weight:2,fillColor:cols[i%cols.length],fillOpacity:.88}).addTo(map).bindPopup(`<b>${d.district}</b><br><span style="font-size:11px">${fmt(d.units)} unit • ${d.projects} projek</span><br><small>District aggregation</small>`)});
}
function renderPipeline(){
 const ps=projects.filter(p=>p.scheme==='Rumah Idaman Selangor'&&p.status==='Dalam Pembinaan').sort((a,b)=>(a.district||'').localeCompare(b.district||''));
 document.getElementById('pipelineCards').innerHTML=ps.map(p=>`<div class="pipeline-card"><div class="project">${p.project_name}</div><div class="place">${safe(p.district)}${p.pbt?` • ${p.pbt}`:''}</div><div class="units">${fmt(p.units)} <small>UNIT</small></div><div class="complete"><span>Expected completion</span><b>${safe(p.expected_completion)}</b></div></div>`).join('');
}
function filtered(){const scheme=document.getElementById('schemeFilter').value,district=document.getElementById('districtFilter').value,status=document.getElementById('statusFilter').value,snapshot=document.getElementById('snapshotFilter').value,q=document.getElementById('searchFilter').value.trim().toLowerCase();return projects.filter(p=>(!scheme||p.scheme===scheme)&&(!district||p.district===district)&&(!status||p.status===status)&&(!snapshot||p.snapshot===snapshot)&&(!q||((p.display_name||p.project_name||'').toLowerCase().includes(q)||(p.developer||'').toLowerCase().includes(q)||(p.location_text||'').toLowerCase().includes(q))))}
function statusClass(s){if((s||'').includes('Siap'))return 'status-done';if((s||'').includes('Pembinaan'))return 'status-build';return 'status-other'}
function renderFiltered(){const ps=filtered();document.getElementById('recordCount').textContent=`${ps.length} records`;document.getElementById('projectTable').innerHTML=ps.map(p=>`<tr><td><b>${safe(p.display_name||p.project_name)}</b><br><small>${p.project_id}</small></td><td>${safe(p.scheme)}</td><td>${safe(p.district)}</td><td>${safe(p.pbt)}</td><td>${fmt(p.units)}</td><td><span class="status-pill ${statusClass(p.status)}">${safe(p.status)}</span></td><td><span class="snapshot-pill">${safe(p.snapshot)}</span></td><td class="loc-cell"><b>${safe(p.developer)}</b>${p.location_text?`<small>${p.location_text}</small>`:'<small>Lokasi terperinci belum tersedia</small>'}</td><td class="verification">${safe(p.verification)}</td></tr>`).join('')}
function renderSources(){document.getElementById('sourceList').innerHTML=sources.map(s=>`<div class="source-row"><code>${s.source_id}</code><div><b>${s.title}</b><small>${s.type}</small></div><span>${s.usage}</span></div>`).join('')}
document.getElementById('downloadCsv').addEventListener('click',()=>{const a=document.createElement('a');a.href='projects.csv';a.download='Selangor_Affordable_Housing_projects.csv';a.click()});
load();
