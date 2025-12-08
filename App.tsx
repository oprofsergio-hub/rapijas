
import React, { useState, useEffect, useMemo } from 'react';
import { Layout } from './components/Layout';
import { loadState, saveState, generateUUID, calculateRapi, parseCSV } from './services/logic';
import { AppState, CalendarStatus, Segment } from './types';

// --- Shared Components ---
const Icon = ({ name }: { name: string }) => <i className={`fa-solid ${name}`}></i>;

// --- Sub-Components (Panels) ---

const DashboardPanel = ({ state }: { state: AppState }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
      <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xl">
        <Icon name="fa-chalkboard-user" />
      </div>
      <div>
        <h3 className="text-gray-500 text-sm font-medium">Professores</h3>
        <p className="text-2xl font-bold text-gray-800">{state.teachers.length}</p>
      </div>
    </div>
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
      <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xl">
        <Icon name="fa-users" />
      </div>
      <div>
        <h3 className="text-gray-500 text-sm font-medium">Turmas</h3>
        <p className="text-2xl font-bold text-gray-800">{state.classes.length}</p>
      </div>
    </div>
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
      <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xl">
        <Icon name="fa-layer-group" />
      </div>
      <div>
        <h3 className="text-gray-500 text-sm font-medium">Modalidades</h3>
        <p className="text-2xl font-bold text-gray-800">{state.segments.length}</p>
      </div>
    </div>
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
      <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xl">
        <Icon name="fa-user-xmark" />
      </div>
      <div>
        <h3 className="text-gray-500 text-sm font-medium">Faltas Reg.</h3>
        <p className="text-2xl font-bold text-gray-800">{state.absences.length}</p>
      </div>
    </div>

    <div className="col-span-1 lg:col-span-2 bg-blue-50 p-6 rounded-xl border border-blue-100">
      <h3 className="text-blue-800 font-semibold mb-2">Bem-vindo ao RAPI Escolar Pro</h3>
      <p className="text-blue-700 text-sm">
        Comece configurando as <strong>Modalidades</strong> (Ex: Fundamental I, EJA, Noturno) para definir a quantidade de aulas e calendários distintos.
        Em seguida, cadastre Professores e vincule Turmas às suas respectivas modalidades.
      </p>
    </div>
  </div>
);

const SegmentsPanel = ({ 
  segments, 
  onAdd, 
  onDelete 
}: { 
  segments: Segment[], 
  onAdd: (n: string, p: number) => void, 
  onDelete: (id: string) => void 
}) => {
  const [name, setName] = useState('');
  const [periods, setPeriods] = useState(5);

  return (
    <div className="space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Gerenciar Modalidades / Turnos</h3>
            <div className="flex flex-col md:flex-row gap-4 mb-6 items-end">
                <div className="flex-1 w-full">
                    <label className="text-xs text-gray-500 mb-1 block">Nome (Ex: EJA Noturno)</label>
                    <input 
                      value={name} onChange={e => setName(e.target.value)}
                      placeholder="Nome da Modalidade" 
                      className="w-full border rounded-lg px-4 py-2 outline-none"
                    />
                </div>
                <div className="w-full md:w-32">
                    <label className="text-xs text-gray-500 mb-1 block">Aulas/Dia</label>
                    <input 
                      type="number" min="1" max="10"
                      value={periods} onChange={e => setPeriods(Number(e.target.value))}
                      className="w-full border rounded-lg px-4 py-2 outline-none"
                    />
                </div>
                <button 
                  onClick={() => { if(name) { onAdd(name, periods); setName(''); } }} 
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-colors w-full md:w-auto"
                >
                    Adicionar
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {segments.map(s => (
                    <div key={s.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex justify-between items-center">
                        <div>
                            <h4 className="font-bold text-gray-800">{s.name}</h4>
                            <p className="text-xs text-gray-500">{s.dailyPeriods} aulas diárias</p>
                        </div>
                        <button onClick={() => onDelete(s.id)} className="text-red-400 hover:text-red-600 p-2">
                            <Icon name="fa-trash" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
};

const TeachersPanel = ({ 
  state, 
  onAdd, 
  onDelete, 
  onImport 
}: { 
  state: AppState, 
  onAdd: (n: string) => void, 
  onDelete: (id: string) => void,
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void
}) => {
  const [name, setName] = useState('');

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-4">
             <h3 className="text-lg font-semibold text-gray-800">Gerenciar Professores</h3>
             <span className="text-xs text-gray-400">Total: {state.teachers.length}</span>
        </div>
        
        <div className="flex gap-4 mb-6">
          <input 
            value={name} onChange={e => setName(e.target.value)}
            placeholder="Nome do Professor" 
            className="flex-1 border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            onKeyDown={e => e.key === 'Enter' && (onAdd(name), setName(''))}
          />
          <button onClick={() => { if(name) { onAdd(name); setName(''); } }} className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
            Adicionar
          </button>
        </div>
        
        <div className="flex gap-2 mb-4 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-200">
           <span className="font-semibold">Importar CSV:</span> 
           <input type="file" accept=".csv" onChange={onImport} className="text-xs" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 text-sm">
                <th className="py-3 px-2">Nome</th>
                <th className="py-3 px-2">Turmas Atribuídas</th>
                <th className="py-3 px-2 w-24">Ações</th>
              </tr>
            </thead>
            <tbody>
              {state.teachers.map(t => {
                 // Count classes this teacher is in
                 const classCount = new Set();
                 Object.entries(state.schedule).forEach(([cId, days]) => {
                     Object.values(days).forEach(periods => {
                         Object.values(periods).forEach(slot => {
                             if (slot.teacherId === t.id) classCount.add(cId);
                         });
                     });
                 });

                 return (
                    <tr key={t.id} className="border-b border-gray-100 hover:bg-gray-50 group">
                      <td className="py-3 px-2">{t.name}</td>
                      <td className="py-3 px-2">
                         {classCount.size > 0 
                           ? <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">{classCount.size} turmas</span> 
                           : <span className="text-gray-400 text-xs">-</span>
                         }
                      </td>
                      <td className="py-3 px-2">
                        <button onClick={() => onDelete(t.id)} className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Icon name="fa-trash" />
                        </button>
                      </td>
                    </tr>
                 );
              })}
              {state.teachers.length === 0 && (
                <tr><td colSpan={3} className="text-center py-8 text-gray-400">Nenhum professor cadastrado</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const ClassesPanel = ({
    classes,
    segments,
    onAdd,
    onDelete,
    onImport
}: {
    classes: AppState['classes'],
    segments: Segment[],
    onAdd: (n: string, sId: string) => void,
    onDelete: (id: string) => void,
    onImport: (e: React.ChangeEvent<HTMLInputElement>) => void
}) => {
  const [name, setName] = useState('');
  const [segId, setSegId] = useState(segments[0]?.id || '');

  useEffect(() => {
      if (!segId && segments.length > 0) setSegId(segments[0].id);
  }, [segments, segId]);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Gerenciar Turmas</h3>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
              <input 
                value={name} onChange={e => setName(e.target.value)}
                placeholder="Nome da Turma (Ex: 6º A)" 
                className="w-full border rounded-lg px-4 py-2 outline-none"
              />
          </div>
          <div className="md:w-1/3">
              <select value={segId} onChange={e => setSegId(e.target.value)} className="w-full border rounded-lg px-4 py-2 bg-white">
                  {segments.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
          </div>
          <button onClick={() => { if(name && segId) { onAdd(name, segId); setName(''); } }} className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
            Adicionar
          </button>
        </div>

        <div className="flex gap-2 mb-4 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-200">
           <span className="font-semibold">Importar CSV:</span> 
           <input type="file" accept=".csv" onChange={onImport} className="text-xs" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {classes.map(c => {
             const segmentName = segments.find(s => s.id === c.segmentId)?.name || 'Desconhecido';
             return (
                <div key={c.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex flex-col justify-between group">
                  <div className="flex justify-between items-start mb-2">
                      <span className="font-semibold text-gray-700 text-lg">{c.name}</span>
                      <button onClick={() => onDelete(c.id)} className="text-red-400 hover:text-red-600">
                        <Icon name="fa-trash" />
                      </button>
                  </div>
                  <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded w-fit">{segmentName}</span>
                </div>
             );
          })}
          {classes.length === 0 && (
              <div className="col-span-full text-center py-8 text-gray-400">Nenhuma turma cadastrada</div>
          )}
        </div>
      </div>
    </div>
  );
};

const CalendarPanel = ({
    calendars,
    segments,
    onUpdate,
    onImport
}: {
    calendars: AppState['calendars'],
    segments: Segment[],
    onUpdate: (sId: string, d: string, status: CalendarStatus) => void,
    onImport: (e: React.ChangeEvent<HTMLInputElement>, sId: string) => void
}) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7));
  const [selectedSegId, setSelectedSegId] = useState(segments[0]?.id || '');

  useEffect(() => {
    if (!selectedSegId && segments.length > 0) setSelectedSegId(segments[0].id);
  }, [segments, selectedSegId]);

  // Generate days for selected month
  const [year, month] = selectedMonth.split('-').map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const dates = Array.from({length: daysInMonth}, (_, i) => {
    const d = i + 1;
    return `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h3 className="text-lg font-semibold text-gray-800">Calendário Escolar</h3>
            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
              <select 
                 value={selectedSegId}
                 onChange={e => setSelectedSegId(e.target.value)}
                 className="border rounded-lg px-3 py-2 text-sm bg-purple-50 border-purple-200 text-purple-900 font-medium"
              >
                  {segments.map(s => <option key={s.id} value={s.id}>Modalidade: {s.name}</option>)}
              </select>
              <input 
                type="month" 
                value={selectedMonth} 
                onChange={e => setSelectedMonth(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm"
              />
            </div>
         </div>

         <div className="flex gap-2 mb-4 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-200 justify-between items-center">
           <div>
               <span className="font-semibold mr-2">Importar Calendário (CSV):</span> 
               <input type="file" accept=".csv" onChange={(e) => onImport(e, selectedSegId)} className="text-xs" />
           </div>
           <a href="#" onClick={e => { e.preventDefault(); alert("Formato CSV:\n2024-02-01,letivo\n2024-02-02,feriado\n..."); }} className="text-blue-500 text-xs underline">Ver formato</a>
         </div>

         <div className="border rounded-xl overflow-hidden max-h-[600px] overflow-y-auto custom-scroll">
           <table className="w-full text-left">
             <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold sticky top-0 z-10">
               <tr>
                 <th className="px-4 py-3 bg-gray-50">Data</th>
                 <th className="px-4 py-3 bg-gray-50">Dia Semana</th>
                 <th className="px-4 py-3 bg-gray-50">Status</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-gray-100">
               {dates.map(date => {
                 const jsDate = new Date(date + 'T12:00:00Z');
                 const dayName = jsDate.toLocaleDateString('pt-BR', { weekday: 'long', timeZone: 'UTC' });
                 const isWeekend = jsDate.getUTCDay() === 0 || jsDate.getUTCDay() === 6;
                 
                 const currentCal = calendars[selectedSegId] || {};
                 const monthData = currentCal[selectedMonth] || {};
                 const status = monthData[date] || (isWeekend ? 'nao_letivo' : 'letivo');
                 
                 return (
                   <tr key={date} className="hover:bg-blue-50">
                     <td className="px-4 py-2 font-mono text-sm">{date.split('-')[2]}</td>
                     <td className="px-4 py-2 capitalize text-sm">{dayName}</td>
                     <td className="px-4 py-2">
                       <select 
                          value={status} 
                          onChange={(e) => onUpdate(selectedSegId, date, e.target.value as CalendarStatus)}
                          className={`text-sm rounded px-2 py-1 border-0 ring-1 ring-inset w-full md:w-auto ${
                              status === 'letivo' ? 'bg-green-50 text-green-700 ring-green-600/20' :
                              status === 'feriado' ? 'bg-red-50 text-red-700 ring-red-600/20' :
                              status === 'sabado_letivo' ? 'bg-blue-50 text-blue-700 ring-blue-600/20' :
                              'bg-gray-50 text-gray-600 ring-gray-500/10'
                          }`}
                        >
                         <option value="letivo">Letivo</option>
                         <option value="nao_letivo">Não Letivo</option>
                         <option value="feriado">Feriado</option>
                         <option value="sabado_letivo">Sábado Letivo</option>
                       </select>
                     </td>
                   </tr>
                 );
               })}
             </tbody>
           </table>
         </div>
         
         <div className="mt-4 p-4 bg-yellow-50 text-yellow-800 text-sm rounded-lg border border-yellow-200">
           <i className="fa-solid fa-triangle-exclamation mr-2"></i>
           <strong>Atenção:</strong> As alterações são salvas automaticamente. Este calendário está vinculado à modalidade <strong>{segments.find(s => s.id === selectedSegId)?.name}</strong>.
         </div>
      </div>
    </div>
  );
};

const SchedulePanel = ({ state, onUpdate }: { state: AppState, onUpdate: any }) => {
  const [selectedClass, setSelectedClass] = useState(state.classes[0]?.id || '');
  
  useEffect(() => {
      if (!selectedClass && state.classes.length > 0) setSelectedClass(state.classes[0].id);
  }, [state.classes, selectedClass]);

  if (!selectedClass) return <div className="text-center p-8 text-gray-500">Cadastre uma turma primeiro.</div>;

  const classObj = state.classes.find(c => c.id === selectedClass);
  const segmentObj = state.segments.find(s => s.id === classObj?.segmentId) || state.segments[0];
  const periodsCount = segmentObj?.dailyPeriods || 5;

  const days = [1, 2, 3, 4, 5]; // Mon-Fri
  const periods = Array.from({length: periodsCount}, (_, i) => i);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
        <div className="flex flex-col md:flex-row gap-4 mb-6 items-center justify-between">
           <div className="flex items-center gap-4 w-full md:w-auto">
              <label className="font-semibold text-gray-700">Turma:</label>
              <select 
                  value={selectedClass} 
                  onChange={e => setSelectedClass(e.target.value)}
                  className="border rounded-lg px-4 py-2 bg-white"
              >
                  {state.classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
           </div>
           <span className="text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-medium">
               {segmentObj.name} ({periodsCount} períodos)
           </span>
        </div>

        <table className="min-w-full border-collapse">
          <thead>
            <tr>
              <th className="border p-2 bg-gray-50 text-xs text-gray-500">Período</th>
              {days.map(d => (
                 <th key={d} className="border p-2 bg-gray-50 text-sm font-semibold text-gray-700 w-1/5">
                   {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'][d-1]}
                 </th>
              ))}
            </tr>
          </thead>
          <tbody>
             {periods.map(p => (
               <tr key={p}>
                 <td className="border p-2 text-center font-bold text-gray-500">{p + 1}º</td>
                 {days.map(d => {
                    const slot = state.schedule[selectedClass]?.[d]?.[p] || { subject: '', teacherId: '' };
                    return (
                      <td key={d} className="border p-2 align-top">
                         <div className="flex flex-col gap-1">
                            <input 
                              placeholder="Disciplina"
                              className="text-xs border rounded px-1 py-1 w-full"
                              value={slot.subject}
                              onChange={e => onUpdate(selectedClass, d, p, e.target.value, slot.teacherId)}
                            />
                            <select 
                              className="text-xs border rounded px-1 py-1 w-full bg-gray-50"
                              value={slot.teacherId}
                              onChange={e => onUpdate(selectedClass, d, p, slot.subject, e.target.value)}
                            >
                              <option value="">- Prof -</option>
                              {state.teachers.map(t => (
                                  <option key={t.id} value={t.id}>{t.name}</option>
                              ))}
                            </select>
                         </div>
                      </td>
                    );
                 })}
               </tr>
             ))}
          </tbody>
        </table>
        
        <div className="mt-4 p-4 bg-blue-50 text-blue-800 text-sm rounded-lg border border-blue-200">
           <strong>Mudança de professor no meio do mês?</strong> 
           <p>Este sistema reflete a grade atual. Para gerar relatórios com professores diferentes no mesmo mês, primeiro gere o relatório das datas antigas, depois altere a grade aqui e gere o relatório das datas novas.</p>
         </div>
      </div>
    </div>
  );
};

const AbsencesPanel = ({ state, onAdd, onDelete }: { state: AppState, onAdd: any, onDelete: any }) => {
    const [date, setDate] = useState('');
    const [tId, setTId] = useState('');
    const [cId, setCId] = useState('');
    const [subj, setSubj] = useState('');
    const [amt, setAmt] = useState(1);

    const availableSubjects = useMemo(() => {
        if (!tId || !cId) return [];
        const subjects = new Set<string>();
        Object.values(state.schedule[cId] || {}).forEach(day => {
            Object.values(day).forEach(slot => {
                if (slot.teacherId === tId && slot.subject) subjects.add(slot.subject);
            });
        });
        return Array.from(subjects);
    }, [tId, cId, state.schedule]);

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Lançar Falta</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                    <div>
                        <label className="text-xs text-gray-500">Data</label>
                        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full border rounded p-2" />
                    </div>
                    <div>
                        <label className="text-xs text-gray-500">Professor</label>
                        <select value={tId} onChange={e => setTId(e.target.value)} className="w-full border rounded p-2">
                            <option value="">Selecione...</option>
                            {state.teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500">Turma</label>
                        <select value={cId} onChange={e => setCId(e.target.value)} className="w-full border rounded p-2">
                            <option value="">Selecione...</option>
                            {state.classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500">Disciplina</label>
                        <select value={subj} onChange={e => setSubj(e.target.value)} className="w-full border rounded p-2">
                            <option value="">{availableSubjects.length ? 'Selecione...' : 'Automático'}</option>
                            {availableSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500">Qtd Aulas</label>
                        <input type="number" min="1" max="10" value={amt} onChange={e => setAmt(Number(e.target.value))} className="w-full border rounded p-2" />
                    </div>
                </div>
                <div className="mt-4">
                     <button 
                        disabled={!date || !tId || !cId || (!subj && availableSubjects.length > 1)}
                        onClick={() => {
                             const finalSubj = subj || (availableSubjects.length === 1 ? availableSubjects[0] : 'Diversos');
                             onAdd(date, tId, cId, finalSubj, amt);
                             setAmt(1);
                        }}
                        className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 disabled:opacity-50 w-full md:w-auto"
                     >
                        Registrar Falta
                     </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-3 text-xs text-gray-500 uppercase">Data</th>
                            <th className="p-3 text-xs text-gray-500 uppercase">Professor</th>
                            <th className="p-3 text-xs text-gray-500 uppercase">Turma / Disc.</th>
                            <th className="p-3 text-xs text-gray-500 uppercase">Qtd</th>
                            <th className="p-3 w-10"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {state.absences.map(a => {
                            const tName = state.teachers.find(t => t.id === a.teacherId)?.name || '?';
                            const cName = state.classes.find(c => c.id === a.classId)?.name || '?';
                            return (
                                <tr key={a.id} className="hover:bg-gray-50">
                                    <td className="p-3 text-sm">{a.date.split('-').reverse().join('/')}</td>
                                    <td className="p-3 text-sm font-medium">{tName}</td>
                                    <td className="p-3 text-sm">{cName} - {a.subject}</td>
                                    <td className="p-3 text-sm">{a.amount}</td>
                                    <td className="p-3">
                                        <button onClick={() => onDelete(a.id)} className="text-red-400 hover:text-red-600">
                                            <Icon name="fa-times" />
                                        </button>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const ReportsPanel = ({ state }: { state: AppState }) => {
  // Set defaults to current month
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(lastDay);
  const [view, setView] = useState<'detailed' | 'teacher_summary' | 'daily_log'>('teacher_summary');
  
  // Filters
  const [fSegment, setFSegment] = useState('');
  const [fClass, setFClass] = useState('');
  const [fTeacher, setFTeacher] = useState('');
  const [reportData, setReportData] = useState<any[]>([]);

  // We only generate when button is clicked to avoid confusion about what data is showing
  const generateReport = () => {
      const data = calculateRapi(state, {
          startDate,
          endDate,
          segmentId: fSegment,
          classId: fClass,
          teacherId: fTeacher
      }, view);
      setReportData(data);
  };

  // Initial load
  useEffect(() => {
     generateReport();
  }, []); // Run once on mount

  const downloadCSV = () => {
     if (view === 'daily_log') {
         const headers = ['Data', 'Professor', 'Turma', 'Disciplina', 'Status'];
         const rows = reportData.map(d => [
             d.date, `"${d.teacherName}"`, `"${d.className}"`, `"${d.subject}"`, d.isAbsenceRecord ? 'Falta' : 'Aula'
         ]);
         const csv = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
         saveBlob(csv, `rapi_diario_${startDate}_${endDate}.csv`);
         return;
     }

     const headers = ['Professor', 'Turma', 'Disciplina', 'Previstas', 'Dadas', 'Faltas', '% Freq'];
     const rows = reportData.map(d => [
         `"${d.teacherName}"`, `"${d.className}"`, `"${d.subject}"`, d.expected, d.given, d.absences, d.percentage.toFixed(1).replace('.', ',') + '%'
     ]);
     const csvContent = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
     saveBlob(csvContent, `rapi_resumo_${startDate}_${endDate}.csv`);
  };

  const saveBlob = (content: string, filename: string) => {
      const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
  };

  const printReport = () => {
      const printWindow = window.open('', '_blank');
      if (!printWindow) return;
      
      const title = `Relatório RAPI - ${startDate.split('-').reverse().join('/')} a ${endDate.split('-').reverse().join('/')}`;
      const html = `
        <html>
        <head>
            <title>${title}</title>
            <style>
                body { font-family: sans-serif; padding: 20px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
                th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
                th { background-color: #eee; }
                h1 { font-size: 18px; margin-bottom: 5px; }
                .meta { font-size: 12px; color: #555; margin-bottom: 20px; }
                .text-right { text-align: right; }
                .footer { margin-top: 30px; font-size: 10px; color: #999; border-top: 1px solid #ddd; padding-top: 10px; }
            </style>
        </head>
        <body>
            <h1>${title}</h1>
            <div class="meta">
                Gerado em: ${new Date().toLocaleString()}<br/>
                Filtros: ${fSegment ? 'Modalidade específica' : 'Todas'} / ${fTeacher ? 'Prof. Específico' : 'Todos'}
            </div>
            <table>
                <thead>
                    <tr>
                        ${view === 'daily_log' 
                          ? '<th>Data</th><th>Professor</th><th>Turma</th><th>Disciplina</th><th>Tipo</th>'
                          : '<th>Professor</th><th>Turma</th><th>Disciplina</th><th class="text-right">Previstas</th><th class="text-right">Faltas</th><th class="text-right">Dadas</th><th class="text-right">%</th>'
                        }
                    </tr>
                </thead>
                <tbody>
                    ${reportData.map(d => view === 'daily_log' ? `
                        <tr>
                            <td>${d.date.split('-').reverse().join('/')}</td>
                            <td>${d.teacherName}</td>
                            <td>${d.className}</td>
                            <td>${d.subject}</td>
                            <td>${d.isAbsenceRecord ? 'FALTA' : 'AULA'}</td>
                        </tr>
                    ` : `
                        <tr>
                            <td>${d.teacherName}</td>
                            <td>${d.className || '-'}</td>
                            <td>${d.subject || '-'}</td>
                            <td class="text-right">${d.expected}</td>
                            <td class="text-right">${d.absences}</td>
                            <td class="text-right">${d.given}</td>
                            <td class="text-right">${d.percentage.toFixed(1)}%</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <div class="footer">Sistema RAPI Escolar Pro</div>
            <script>window.onload = () => window.print();</script>
        </body>
        </html>
      `;
      printWindow.document.write(html);
      printWindow.document.close();
  };

  return (
      <div className="space-y-6">
          {/* Config Panel */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Gerador de Relatórios</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div>
                      <label className="block text-xs text-gray-500 mb-1">Data Início</label>
                      <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="border rounded px-3 py-2 w-full" />
                  </div>
                  <div>
                      <label className="block text-xs text-gray-500 mb-1">Data Fim</label>
                      <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="border rounded px-3 py-2 w-full" />
                  </div>
                  <div className="md:col-span-2">
                       <label className="block text-xs text-gray-500 mb-1">Tipo de Relatório</label>
                       <div className="flex bg-gray-100 p-1 rounded-lg">
                           <button onClick={() => setView('teacher_summary')} className={`flex-1 py-1 px-3 rounded text-sm ${view === 'teacher_summary' ? 'bg-white shadow text-blue-600 font-medium' : 'text-gray-500'}`}>Resumo Prof.</button>
                           <button onClick={() => setView('detailed')} className={`flex-1 py-1 px-3 rounded text-sm ${view === 'detailed' ? 'bg-white shadow text-blue-600 font-medium' : 'text-gray-500'}`}>Detalhado</button>
                           <button onClick={() => setView('daily_log')} className={`flex-1 py-1 px-3 rounded text-sm ${view === 'daily_log' ? 'bg-white shadow text-blue-600 font-medium' : 'text-gray-500'}`}>Diário (Audit)</button>
                       </div>
                  </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 pt-4 border-t border-gray-100">
                   <div>
                       <label className="block text-xs text-gray-500 mb-1">Filtrar Modalidade</label>
                       <select value={fSegment} onChange={e => setFSegment(e.target.value)} className="border rounded px-3 py-2 w-full text-sm">
                           <option value="">Todas</option>
                           {state.segments.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                       </select>
                   </div>
                   <div>
                       <label className="block text-xs text-gray-500 mb-1">Filtrar Turma</label>
                       <select value={fClass} onChange={e => setFClass(e.target.value)} className="border rounded px-3 py-2 w-full text-sm">
                           <option value="">Todas</option>
                           {state.classes.filter(c => !fSegment || c.segmentId === fSegment).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                       </select>
                   </div>
                   <div>
                       <label className="block text-xs text-gray-500 mb-1">Filtrar Professor</label>
                       <select value={fTeacher} onChange={e => setFTeacher(e.target.value)} className="border rounded px-3 py-2 w-full text-sm">
                           <option value="">Todos</option>
                           {state.teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                       </select>
                   </div>
              </div>

              <div className="flex justify-between items-center">
                   <button onClick={generateReport} className="bg-brand-600 text-white px-6 py-2 rounded-lg hover:bg-brand-700 shadow font-semibold">
                       <Icon name="fa-rotate-right" /> Gerar Relatório
                   </button>
                   <div className="flex gap-2">
                       <button onClick={printReport} disabled={reportData.length === 0} className="border border-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-50 disabled:opacity-50">
                           <Icon name="fa-print" /> Imprimir / PDF
                       </button>
                       <button onClick={downloadCSV} disabled={reportData.length === 0} className="border border-gray-300 text-green-700 px-4 py-2 rounded hover:bg-green-50 disabled:opacity-50">
                           <Icon name="fa-file-excel" /> CSV
                       </button>
                   </div>
              </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full text-left">
                  <thead className="bg-brand-50 border-b border-brand-100">
                      <tr>
                          {view === 'daily_log' ? (
                              <>
                                <th className="p-3 text-sm font-semibold text-brand-800">Data</th>
                                <th className="p-3 text-sm font-semibold text-brand-800">Professor</th>
                                <th className="p-3 text-sm font-semibold text-brand-800">Turma</th>
                                <th className="p-3 text-sm font-semibold text-brand-800">Disciplina</th>
                                <th className="p-3 text-sm font-semibold text-brand-800">Status</th>
                              </>
                          ) : (
                              <>
                                <th className="p-3 text-sm font-semibold text-brand-800">Professor</th>
                                <th className="p-3 text-sm font-semibold text-brand-800">Turma</th>
                                <th className="p-3 text-sm font-semibold text-brand-800">Disciplina</th>
                                <th className="p-3 text-sm font-semibold text-brand-800 text-right">Previstas</th>
                                <th className="p-3 text-sm font-semibold text-brand-800 text-right">Faltas</th>
                                <th className="p-3 text-sm font-semibold text-brand-800 text-right">Dadas</th>
                                <th className="p-3 text-sm font-semibold text-brand-800 text-right">% Freq.</th>
                              </>
                          )}
                      </tr>
                  </thead>
                  <tbody className="divide-y">
                      {reportData.map((row, idx) => (
                          <tr key={idx} className={`hover:bg-gray-50 ${row.isAbsenceRecord ? 'bg-red-50' : ''}`}>
                              {view === 'daily_log' ? (
                                  <>
                                    <td className="p-3 text-sm font-mono">{row.date?.split('-').reverse().join('/')}</td>
                                    <td className="p-3 text-sm font-medium">{row.teacherName}</td>
                                    <td className="p-3 text-sm">{row.className}</td>
                                    <td className="p-3 text-sm">{row.subject}</td>
                                    <td className="p-3 text-sm font-bold">
                                        {row.isAbsenceRecord ? <span className="text-red-600">FALTA</span> : <span className="text-green-600">AULA</span>}
                                    </td>
                                  </>
                              ) : (
                                  <>
                                    <td className="p-3 text-sm font-medium">{row.teacherName}</td>
                                    <td className="p-3 text-sm">{row.className || '-'}</td>
                                    <td className="p-3 text-sm">{row.subject || '-'}</td>
                                    <td className="p-3 text-sm text-right">{row.expected}</td>
                                    <td className="p-3 text-sm text-right text-red-600 font-medium">{row.absences}</td>
                                    <td className="p-3 text-sm text-right text-green-600 font-medium">{row.given}</td>
                                    <td className="p-3 text-sm text-right">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                                            row.percentage < 75 ? 'bg-red-100 text-red-700' :
                                            row.percentage < 90 ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-green-100 text-green-700'
                                        }`}>
                                            {row.percentage.toFixed(1)}%
                                        </span>
                                    </td>
                                  </>
                              )}
                          </tr>
                      ))}
                      {reportData.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-gray-500">Nenhum dado encontrado para este período/filtro. Clique em "Gerar Relatório".</td></tr>}
                  </tbody>
              </table>
          </div>
      </div>
  );
};

// --- Main App Component ---

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [state, setState] = useState<AppState>(loadState());

  useEffect(() => {
    saveState(state);
  }, [state]);
  
  // Explicit save function for the header button
  const manualSave = () => {
      saveState(state);
      alert("Dados salvos com sucesso!");
  };

  // --- Actions ---

  const addSegment = (name: string, dailyPeriods: number) => {
    setState(prev => ({
        ...prev,
        segments: [...prev.segments, { id: generateUUID(), name, dailyPeriods }],
        calendars: { ...prev.calendars, [generateUUID()]: {} }
    }));
  };

  const deleteSegment = (id: string) => {
      if (state.classes.some(c => c.segmentId === id)) {
          alert('Não é possível excluir: Existem turmas vinculadas a esta modalidade.');
          return;
      }
      if (!window.confirm('Excluir esta modalidade?')) return;
      setState(prev => ({
          ...prev,
          segments: prev.segments.filter(s => s.id !== id)
      }));
  };

  const addTeacher = (name: string) => {
    setState(prev => ({
      ...prev,
      teachers: [...prev.teachers, { id: generateUUID(), name }]
    }));
  };

  const deleteTeacher = (id: string) => {
    if (!window.confirm('Tem certeza? Isso removerá o professor de todas as grades.')) return;
    setState(prev => ({
      ...prev,
      teachers: prev.teachers.filter(t => t.id !== id),
      schedule: cleanupSchedule(prev.schedule, 'teacher', id)
    }));
  };

  const addClass = (name: string, segmentId: string) => {
    setState(prev => ({
      ...prev,
      classes: [...prev.classes, { id: generateUUID(), name, segmentId }]
    }));
  };

  const deleteClass = (id: string) => {
    if (!window.confirm('Excluir turma e toda sua grade horária?')) return;
    setState(prev => {
      const newSchedule = { ...prev.schedule };
      delete newSchedule[id];
      return {
        ...prev,
        classes: prev.classes.filter(c => c.id !== id),
        schedule: newSchedule
      };
    });
  };

  const updateSchedule = (classId: string, day: number, period: number, subject: string, teacherId: string) => {
    setState(prev => {
      const newSchedule = { ...prev.schedule };
      if (!newSchedule[classId]) newSchedule[classId] = {};
      if (!newSchedule[classId][day]) newSchedule[classId][day] = {};
      
      newSchedule[classId][day][period] = { subject, teacherId };
      return { ...prev, schedule: newSchedule };
    });
  };

  const updateCalendar = (segmentId: string, date: string, status: CalendarStatus) => {
    const ym = date.substring(0, 7);
    setState(prev => {
      const newCals = { ...prev.calendars };
      if (!newCals[segmentId]) newCals[segmentId] = {};
      if (!newCals[segmentId][ym]) newCals[segmentId][ym] = {};
      
      newCals[segmentId][ym][date] = status;
      return { ...prev, calendars: newCals };
    });
  };

  const addAbsence = (date: string, teacherId: string, classId: string, subject: string, amount: number) => {
    setState(prev => ({
      ...prev,
      absences: [...prev.absences, { id: generateUUID(), date, teacherId, classId, subject, amount }]
    }));
  };

  const deleteAbsence = (id: string) => {
    setState(prev => ({ ...prev, absences: prev.absences.filter(a => a.id !== id) }));
  };

  const cleanupSchedule = (schedule: any, type: 'teacher', id: string) => {
    const newSched = JSON.parse(JSON.stringify(schedule));
    Object.keys(newSched).forEach(cId => {
      Object.keys(newSched[cId]).forEach(day => {
        Object.keys(newSched[cId][day]).forEach(period => {
          if (newSched[cId][day][period].teacherId === id) {
            newSched[cId][day][period] = { subject: '', teacherId: '' };
          }
        });
      });
    });
    return newSched;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'teachers' | 'classes' | 'calendar', segmentId?: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const text = await file.text();
    const rows = parseCSV(text);
    
    if (type === 'calendar') {
        if (!segmentId) {
            alert("Modalidade não identificada.");
            return;
        }
        let count = 0;
        const newCals = { ...state.calendars };
        if (!newCals[segmentId]) newCals[segmentId] = {};
        
        rows.forEach(row => {
            const date = row[0];
            const status = row[1]?.toLowerCase() as CalendarStatus;
            if (date && (status === 'letivo' || status === 'feriado' || status === 'nao_letivo' || status === 'sabado_letivo')) {
                const ym = date.substring(0, 7);
                if (!newCals[segmentId][ym]) newCals[segmentId][ym] = {};
                newCals[segmentId][ym][date] = status;
                count++;
            }
        });
        setState(prev => ({ ...prev, calendars: newCals }));
        alert(`Atualizado ${count} datas.`);
        e.target.value = '';
        return;
    }

    const startIndex = rows[0][0].toLowerCase().includes('nome') ? 1 : 0;
    const newItems: any[] = [];
    
    if (type === 'teachers') {
        for(let i = startIndex; i < rows.length; i++) {
            if(rows[i][0]) newItems.push({ id: generateUUID(), name: rows[i][0] });
        }
        setState(prev => ({ ...prev, teachers: [...prev.teachers, ...newItems] }));
    } else if (type === 'classes') {
        const defaultSegId = state.segments[0]?.id;
        for(let i = startIndex; i < rows.length; i++) {
            if(rows[i][0]) newItems.push({ id: generateUUID(), name: rows[i][0], segmentId: defaultSegId });
        }
        setState(prev => ({ ...prev, classes: [...prev.classes, ...newItems] }));
    }
    
    e.target.value = '';
    alert(`${newItems.length} registros importados.`);
  };

  return (
    <div className="relative">
        <Layout activeTab={activeTab} onTabChange={setActiveTab}>
        {activeTab === 'dashboard' && <DashboardPanel state={state} />}
        {activeTab === 'segments' && <SegmentsPanel segments={state.segments} onAdd={addSegment} onDelete={deleteSegment} />}
        {activeTab === 'teachers' && <TeachersPanel state={state} onAdd={addTeacher} onDelete={deleteTeacher} onImport={(e) => handleFileUpload(e, 'teachers')} />}
        {activeTab === 'classes' && <ClassesPanel classes={state.classes} segments={state.segments} onAdd={addClass} onDelete={deleteClass} onImport={(e) => handleFileUpload(e, 'classes')} />}
        {activeTab === 'calendar' && <CalendarPanel calendars={state.calendars} segments={state.segments} onUpdate={updateCalendar} onImport={(e, sId) => handleFileUpload(e, 'calendar', sId)} />}
        {activeTab === 'schedule' && <SchedulePanel state={state} onUpdate={updateSchedule} />}
        {activeTab === 'absences' && <AbsencesPanel state={state} onAdd={addAbsence} onDelete={deleteAbsence} />}
        {activeTab === 'reports' && <ReportsPanel state={state} />}
        </Layout>
        
        {/* Absolute Manual Save Button for Reassurance */}
        <div className="fixed top-4 right-4 z-50">
            <button 
                onClick={manualSave}
                className="bg-brand-800 hover:bg-brand-900 text-white px-4 py-2 rounded shadow-lg text-sm font-bold flex items-center gap-2 border border-brand-500"
            >
                <Icon name="fa-save" /> Salvar Dados
            </button>
        </div>
    </div>
  );
}
