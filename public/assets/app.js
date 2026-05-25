const API = '';

const MOCK_RESUMO = [
  { campanha_nome:'Google Ads',    orcamento:5000, total_impressoes:85420, total_cliques:4271, total_conversoes:342, ctr:5.00, cpa:14.62, taxa_conversao:8.01, roas:684.00, roi:584.00 },
  { campanha_nome:'Facebook Ads',  orcamento:3000, total_impressoes:61800, total_cliques:2472, total_conversoes:197, ctr:4.00, cpa:15.23, taxa_conversao:7.97, roas:656.67, roi:556.67 },
  { campanha_nome:'Instagram Ads', orcamento:4000, total_impressoes:74100, total_cliques:3705, total_conversoes:296, ctr:5.00, cpa:13.51, taxa_conversao:7.99, roas:740.00, roi:640.00 },
];

const MOCK_PREV = [
  { campanha_nome:'Google Ads',    conversoes_previstas:376, r2_score:0.89, cliques_futuros:4698, amostras:5 },
  { campanha_nome:'Facebook Ads',  conversoes_previstas:217, r2_score:0.87, cliques_futuros:2719, amostras:5 },
  { campanha_nome:'Instagram Ads', conversoes_previstas:325, r2_score:0.91, cliques_futuros:4076, amostras:5 },
];

const $ = id => document.getElementById(id);
const fmt    = n => Number(n).toLocaleString('pt-BR');
const fmtR$  = n => `R$ ${Number(n).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})}`;
const fmtPct = n => `${Number(n).toFixed(2)}%`;
const COLORS = ['#7c3aed','#0ea5e9','#f59e0b'];
const ALPHAC = ['rgba(124,58,237,.65)','rgba(14,165,233,.65)','rgba(245,158,11,.65)'];
const CLS    = ['cp','cb','ca'];

const CHART_OPTS = {
    responsive:true, 
    maintainAspectRatio:false,
    plugins:{
        legend:{ 
            display: false 
        },
        tooltip:{ 
            backgroundColor:'#1a1a3a', 
            titleColor:'#e2e8f0', 
            bodyColor:'#94a3b8', 
            padding:10 
        }
    },
    scales:{
        x:{ 
            grid:{ 
                color:'rgba(255,255,255,.04)' 
            }, 
            ticks:{ 
                color:'#94a3b8', 
                font:{ 
                    size:11
                } 
            }
        },
        y:{ 
            grid:{ 
                color:'rgba(255,255,255,.04)' 
            }, 
            ticks:{ 
                color:'#94a3b8', 
                font:{
                    size:11
                } 
            } 
        }
    }
};

async function get(url) {
    try {

        const r = await fetch(url, { 
            signal: AbortSignal.timeout(4000) 
        });

        if (!r.ok) throw new Error(r.status);
        return r.json();
    } catch { 
        return null; 
    }
}

async function post(url, body) {
    try {
        const r = await fetch(url, {
            method:'POST', 
            headers:{
                'Content-Type':'application/json'
            }, 
            body:JSON.stringify(body), 
            signal:AbortSignal.timeout(5000) 
        });
        return r.json();
    } catch { 
        return null; 
    }
}

function barChart(id, labels, data, label) {
    new Chart($(id), {
        type:'bar',
        data:{ 
            labels, 
            datasets:[{ 
                label, 
                data, 
                backgroundColor:ALPHAC, 
                borderColor:COLORS, 
                borderWidth:2, 
                borderRadius:7 
            }]
        },
        options: CHART_OPTS,
    });
}

function groupedChart(id, labels, d1, d2) {
    new Chart($(id), {
        type:'bar',
        data:{ 
            labels, 
            datasets:[
                { 
                    label: 'Atual', 
                    data:d1, 
                    backgroundColor: 'rgba(124,58,237,.6)', 
                    borderColor:'#7c3aed', 
                    borderWidth:2, 
                    borderRadius:6 
                },
                { 
                    label:'Previsto (+10%)',
                    data:d2, 
                    backgroundColor:'rgba(16,185,129,.6)',  
                    borderColor:'#10b981', 
                    borderWidth:2, 
                    borderRadius:6 
                },
            ]
        },
        options:{ 
            ...CHART_OPTS, 
            plugins:{ 
                ...CHART_OPTS.plugins, 
                legend:{ 
                    display:true, 
                    labels:{ 
                        color:'#94a3b8', 
                        font:{size:11}, 
                        boxWidth:12 
                    } 
                } 
            } 
        }
    });
}

function renderSQLTable(resumo) {
    const sorted = [...resumo].sort((a,b) => (b.roi||0)-(a.roi||0));
    $('sql-body').innerHTML = resumo.map((r,i) => {
    const roi  = r.roi ?? ((r.total_conversoes*100-r.orcamento)/r.orcamento*100);
    const rank = sorted.findIndex(s=>s.campanha_nome===r.campanha_nome)+1;
    return `<tr${rank===1?' class="hi"':''}>
      <td><span class="chip ${CLS[i]}">●</span> ${r.campanha_nome}</td>
      <td>${fmtR$(r.orcamento)}</td>
      <td>${fmt(r.total_impressoes)}</td>
      <td>${fmt(r.total_cliques)}</td>
      <td>${fmt(r.total_conversoes)}</td>
      <td><strong>${fmtPct(r.ctr)}</strong></td>
      <td>${fmtR$(r.cpa)}</td>
      <td style="color:var(--green);font-weight:700">${fmtPct(roi)}</td>
      <td>${rank===1?'<span class="badge-win">🏆 Melhor ROI</span>':`#${rank}`}</td>
    </tr>`;
  }).join('');
}

function renderDadosTable(resumo) {
    $('dados-body').innerHTML = resumo.map((r,i) => `<tr>
        <td><span class="chip ${CLS[i]}">●</span> ${r.campanha_nome}</td>
        <td>${fmtR$(r.orcamento)}</td>
        <td>${fmt(r.total_impressoes)}</td>
        <td>${fmt(r.total_cliques)}</td>
        <td>${fmt(r.total_conversoes)}</td>
        <td><strong>${fmtPct(r.taxa_conversao)}</strong></td>
        <td style="color:var(--blue);font-weight:700">${fmtPct(r.roas)}</td>
        <td style="color:var(--green);font-weight:700">${fmtPct(r.roi)}</td>
    </tr>`).join('');
}

function renderCharts(resumo) {
    const labels = resumo.map(r=>r.campanha_nome);
    barChart('ch-ctr',  labels, resumo.map(r=>r.ctr),           'CTR (%)');
    barChart('ch-taxa', labels, resumo.map(r=>r.taxa_conversao), 'Taxa Conv. (%)');
    barChart('ch-roas', labels, resumo.map(r=>r.roas),           'ROAS (%)');
}

function renderPrevisao(prevs, resumo) {
    const labels = prevs.map(p => p.campanha_nome);
    groupedChart('ch-prev', labels, prevs.map(p => {
        const r = resumo?.find(r=>r.campanha_nome === p.campanha_nome);
        return r ? r.total_conversoes : 0;
    }), 
    prevs.map( p=> p.conversoes_previstas));

  $('prev-body').innerHTML = prevs.map((p,i) => `
    <div style="padding:13px 0;${i<prevs.length-1?'border-bottom:1px solid var(--border)':''}">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">
        <div>
          <span class="chip ${CLS[i]}">●</span>
          <strong style="margin-left:6px">${p.campanha_nome}</strong>
          <span style="font-size:11px;color:var(--muted);margin-left:6px">${p.amostras} amostras</span>
        </div>
        <div style="text-align:right">
          <div style="font-size:11px;color:var(--muted)">conversões previstas</div>
          <div style="font-size:22px;font-weight:800;color:var(--green)">${Math.round(p.conversoes_previstas)}</div>
        </div>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:5px">
        <span style="font-size:12px;color:var(--muted)">R² Score: <strong style="color:var(--text)">${p.r2_score}</strong></span>
        <span style="font-size:12px;color:var(--muted)">${Math.round(p.r2_score*100)}% precisão</span>
      </div>
      <div class="bar-track"><div class="bar-fill" style="width:${p.r2_score*100}%"></div></div>
    </div>
  `).join('');
}

$('form-hook').addEventListener('submit', async e => {
    e.preventDefault();
    const box = $('res-hook');
    box.textContent='Enviando...'; 
    box.className='res show';
    const body = Object.fromEntries([...(new FormData(e.target)).entries()].map(([k,v])=>[k,Number(v)]));
    const r = await post(`${API}/webhook`, body);
    if (r) { 
        box.className='res show'; 
        box.textContent = JSON.stringify(r,null,2); 
    }else{ 
        box.className = 'res err show'; 
        box.textContent = '⚠ API offline.\nInicie com: npm start'; 
    }
});

$('btn-met').addEventListener('click', async () => {
  const id = $('sel-camp').value;
  const box = $('res-met');
  box.textContent='Buscando...'; box.className='res show';
  try {
    const r = await fetch(`${API}/campanhas/${id}/metricas`, { signal: AbortSignal.timeout(4000) });
    if (r.status === 404) {
      box.className = 'res show';
      box.textContent = 'Nenhuma métrica encontrada para esta campanha.\nExecute: npm run seed';
    } else if (!r.ok) {
      box.className = 'res err show';
      box.textContent = `⚠ Erro ${r.status} ao consultar métricas.`;
    } else {
      box.className = 'res show';
      box.textContent = JSON.stringify(await r.json(), null, 2);
    }
  } catch {
    box.className = 'res err show';
    box.textContent = '⚠ API offline.\nInicie com: npm start';
  }
});

$('btn-ext').addEventListener('click', async () => {
    const id = $('sel-camp').value;
    const box = $('res-ext');
    box.textContent='Buscando dados externos...'; box.className='res show';
    const r = await get(`${API}/campanhas/${id}/externos`);
    if (r) { 
        box.className='res show'; 
        box.textContent=JSON.stringify(r,null,2); 
    }else{ 
        box.className = 'res err show'; 
        box.textContent='⚠ API offline.\nInicie com: npm start'; 
    }
});

async function init() {
    const dot = $('dot'), txt = $('status-txt');
    const test = await get(`${API}/campanhas`);

    if (test) { 
        dot.className='dot online'; txt.textContent='API online'; 
    }else{ 
        dot.className='dot offline'; txt.textContent='API offline — dados de demonstração'; 
    }

    let resumoBD = null;
    let resumoFaker = null;

    if (test) {
        const [[m1,m2,m3], rel] = await Promise.all([
            Promise.all([
                get(`${API}/campanhas/1/metricas`),
                get(`${API}/campanhas/2/metricas`),
                get(`${API}/campanhas/3/metricas`),
            ]),
            get(`${API}/relatorio`),
        ]);

        if (m1 && m2 && m3) {
            resumoBD = [m1,m2,m3].map((m,i) => {
                const orc = [5000,3000,4000][i];
                const conv = Number(m.conversoes), rec = conv*100;
                const cli  = Number(m.cliques);
                return {
                    campanha_nome: m.nome, orcamento: orc,
                    total_impressoes: Number(m.impressoes),
                    total_cliques: cli, total_conversoes: conv,
                    ctr: Number(m.ctr), cpa: Number(m.cpa),
                    taxa_conversao: parseFloat((conv/cli*100).toFixed(2)),
                    roas: parseFloat((rec/orc*100).toFixed(2)),
                    roi:  parseFloat(((rec-orc)/orc*100).toFixed(2)),
                };
            });
        }

        if (rel?.resumo) resumoFaker = rel.resumo;
    }

    let prevs = null;
    if (test) {
        const p = await get(`${API}/previsao`);
        if (p?.previsoes) prevs = p.previsoes;
    }

    if (resumoBD) {
        renderSQLTable(resumoBD);
    } else {
        $('sql-body').innerHTML = '<tr><td colspan="9" style="text-align:center;color:var(--muted);padding:28px">Sem dados no banco. Execute: <code>npm run seed</code></td></tr>';
    }

    if (resumoFaker) {
        renderDadosTable(resumoFaker);
        renderCharts(resumoFaker);
    } else {
        $('dados-body').innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--muted);padding:28px">Relatório não encontrado. Execute: <code>npm run generate</code></td></tr>';
    }

    if (prevs) {
        renderPrevisao(prevs, resumoFaker);
    } else {
        $('prev-body').innerHTML = '<div style="text-align:center;color:var(--muted);padding:28px">Previsão não encontrada. Execute: <code>python scripts/predict.py</code></div>';
    }
}

init();