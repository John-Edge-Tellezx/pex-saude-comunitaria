// app.js — protótipo simples usando armazenamento local.
const STORAGE_KEY = 'health_records_v1';

const defaultData = [
  { id: genId(), name:'João Vitor da Silva Telles', age:25, type:'Triagem', notes:'Pressão alta', date: new Date().toISOString() },
  { id: genId(), name:'Maria Julia Ribeiro', age:24, type:'Orientação', notes:'Dúvidas sobre medicação', date: new Date().toISOString() },
  { id: genId(), name:'Carlos Eduardo de Souza', age:32, type:'Vacinação', notes:'Vacina influenza', date: new Date().toISOString() },
  { id: genId(), name:'Ana Julia Pereira', age:25, type:'Encaminhamento', notes:'Encaminhada ao posto', date: new Date().toISOString() },
  { id: genId(), name:'Maria Lúcia Santos', age:56, type:'Dispensa de Medicamento', notes:'Paracetamol', date: new Date().toISOString() }
];

function genId(){ return 'id-' + Math.random().toString(36).substr(2,9); }

function loadRecords(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if(!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}
function saveRecords(records){ localStorage.setItem(STORAGE_KEY, JSON.stringify(records)); }

function renderList(records){
  const container = document.getElementById('recordsList');
  container.innerHTML = '';
  if(records.length === 0){ container.innerHTML = '<p class="small">Nenhum registro.</p>'; return; }
  records.sort((a,b)=> new Date(b.date) - new Date(a.date));
  records.forEach(r=>{
    const div = document.createElement('div');
    div.className = 'record';
    div.innerHTML = `<strong>${escapeHtml(r.name)}</strong> <span class="small">(${r.age} anos) • ${r.type}</span>
      <div class="small">${new Date(r.date).toLocaleString()}</div>
      <div>${escapeHtml(r.notes || '')}</div>
      <div style="margin-top:6px"><button data-id="${r.id}" class="del">Excluir</button></div>`;
    container.appendChild(div);
  });
  document.querySelectorAll('.del').forEach(b=>{
    b.onclick = e=>{
      const id = e.currentTarget.dataset.id;
      const updated = loadRecords().filter(x=> x.id !== id);
      saveRecords(updated);
      applyFilters();
    };
  });
}

function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c=> ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

function addRecord(obj){
  const records = loadRecords();
  records.push(obj);
  saveRecords(records);
}

function exportCsv(records){
  if(records.length===0) return null;
  const header = ['id','name','age','type','notes','date'];
  const rows = records.map(r => header.map(h => `"${String(r[h]||'').replace(/"/g,'""')}"`).join(','));
  return header.join(',') + '\n' + rows.join('\n');
}

function applyFilters(){
  let records = loadRecords();
  const search = document.getElementById('search').value.trim().toLowerCase();
  const type = document.getElementById('filterType').value;
  if(search) records = records.filter(r => r.name.toLowerCase().includes(search) || (r.notes||'').toLowerCase().includes(search));
  if(type) records = records.filter(r => r.type === type);
  renderList(records);
}

document.addEventListener('DOMContentLoaded', ()=>{
  // initial render
  if(!localStorage.getItem(STORAGE_KEY)){
    saveRecords(defaultData);
  }
  applyFilters();

  // handlers
  document.getElementById('recordForm').onsubmit = e=>{
    e.preventDefault();
    const name = document.getElementById('name').value.trim();
    const age = Number(document.getElementById('age').value);
    const type = document.getElementById('type').value;
    const notes = document.getElementById('notes').value.trim();
    if(!name) return alert('Informe o nome.');
    const record = { id: genId(), name, age, type, notes, date: new Date().toISOString() };
    addRecord(record);
    e.target.reset();
    applyFilters();
  };

  document.getElementById('clearForm').onclick = ()=> document.getElementById('recordForm').reset();
  document.getElementById('search').oninput = applyFilters;
  document.getElementById('filterType').onchange = applyFilters;

  document.getElementById('exportCsv').onclick = ()=>{
    const csv = exportCsv(loadRecords());
    if(!csv) return alert('Nenhum registro para exportar.');
    const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'registros_saude_comunitaria.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  document.getElementById('seedData').onclick = ()=>{
    if(confirm('Substituir registros atuais por dados de exemplo?')) {
      saveRecords(defaultData);
      applyFilters();
    }
  };

  document.getElementById('clearAll').onclick = ()=>{
    if(confirm('Remover todos registros?')) {
      saveRecords([]);
      applyFilters();
    }
  };
});
