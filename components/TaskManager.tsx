
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Calendar, List, Plus, CheckCircle2, Clock, Edit2, ChevronLeft, ChevronRight, X, Trash2, Filter, Construction, CalendarDays, RotateCcw, Check
} from 'lucide-react';
import { Task, TaskStatus, TaskType, Priority, Prospect, Order, PeriodFilter, DateRange } from '../types';
import { db, isFirebaseConfigured } from '../firebase';
import { collection, addDoc, updateDoc, doc, deleteDoc } from "firebase/firestore";

interface TaskManagerProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  prospects: Prospect[];
  orders: Order[];
  isDemo?: boolean;
  externalOpenModal?: boolean;
  onCloseExternalModal?: () => void;
  preselectedCardId?: string;
}

const TaskManager: React.FC<TaskManagerProps> = ({ 
  tasks, 
  setTasks, 
  prospects, 
  orders, 
  isDemo, 
  externalOpenModal, 
  onCloseExternalModal,
  preselectedCardId 
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [filterPeriod, setFilterPeriod] = useState<PeriodFilter>('Hoje');
  const [customRange, setCustomRange] = useState<DateRange>({ start: '', end: '' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const formatDisplayDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('pt-BR');
  };

  const filterByDate = (dateStr: string) => {
    if (!dateStr) return false;
    const taskDate = new Date(dateStr + 'T12:00:00');
    taskDate.setHours(0,0,0,0);
    const now = new Date();
    now.setHours(0,0,0,0);
    
    if (filterPeriod === 'Todas') return true;
    if (filterPeriod === 'Hoje') return taskDate.getTime() === now.getTime();
    if (filterPeriod === 'Este Mês') return taskDate.getMonth() === now.getMonth() && taskDate.getFullYear() === now.getFullYear();
    
    if (filterPeriod === 'Esta Semana') {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      return taskDate >= startOfWeek && taskDate <= endOfWeek;
    }

    if (filterPeriod === 'Personalizado' && customRange.start && customRange.end) {
      const start = new Date(customRange.start + 'T00:00:00');
      const end = new Date(customRange.end + 'T23:59:59');
      return taskDate >= start && taskDate <= end;
    }
    return true;
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => filterByDate(t.date)).sort((a,b) => b.date.localeCompare(a.date));
  }, [tasks, filterPeriod, customRange]);

  useEffect(() => {
    if (externalOpenModal) {
      setIsModalOpen(true);
      setEditingTask(null);
    }
  }, [externalOpenModal]);

  const handleTaskSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const cardId = formData.get('cardId') as string;
    
    const foundCard = [...prospects, ...orders].find(c => c.id === cardId);
    const cardName = foundCard ? ('obra' in foundCard ? foundCard.obra : (foundCard as any).orderNumber || (foundCard as any).obraName) : 'Geral';

    const taskData = {
      title: formData.get('title') as string,
      date: formData.get('date') as string,
      time: formData.get('time') as string,
      type: formData.get('type') as TaskType,
      priority: formData.get('priority') as Priority,
      cardId,
      cardName,
      construtoraName: foundCard && 'construtora' in foundCard ? foundCard.construtora : (foundCard && 'clientName' in foundCard ? (foundCard as any).clientName : ''),
      representada: foundCard && 'representada' in foundCard ? (foundCard as any).representada : ''
    };

    if (editingTask) {
      if (isDemo || !isFirebaseConfigured()) {
        setTasks(tasks.map(t => t.id === editingTask.id ? { ...t, ...taskData } : t));
      } else {
        await updateDoc(doc(db, "tasks", editingTask.id), taskData);
      }
    } else {
      const newTask: Task = {
        id: Math.random().toString(36).substr(2, 9),
        ...taskData,
        status: TaskStatus.OPEN
      };
      if (isDemo || !isFirebaseConfigured()) {
        setTasks([newTask, ...tasks]);
      } else {
        await addDoc(collection(db, "tasks"), newTask);
      }
    }
    handleCloseModal();
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTask(null);
    if (onCloseExternalModal) onCloseExternalModal();
  };

  const toggleStatus = async (task: Task) => {
    const newStatus = task.status === TaskStatus.COMPLETED ? TaskStatus.OPEN : TaskStatus.COMPLETED;
    if (isDemo || !isFirebaseConfigured()) {
      setTasks(tasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
    } else {
      await updateDoc(doc(db, "tasks", task.id), { status: newStatus });
    }
  };

  const deleteTask = async (id: string) => {
    if (!confirm('Deseja excluir esta tarefa permanentemente?')) return;
    if (isDemo || !isFirebaseConfigured()) {
      setTasks(tasks.filter(t => t.id !== id));
    } else {
      await deleteDoc(doc(db, "tasks", id));
    }
  };

  return (
    <div className="h-full flex flex-col gap-6 pb-12">
      <div className="bg-brand-card p-5 rounded-3xl border border-brand-border flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-xl">
        <div className="flex flex-wrap items-center gap-3">
          {viewMode === 'list' ? (
            <>
              {['Hoje', 'Esta Semana', 'Este Mês', 'Personalizado', 'Todas'].map(p => (
                <button key={p} onClick={() => setFilterPeriod(p as any)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                    filterPeriod === p ? 'bg-brand-orange text-black border-brand-orange' : 'bg-brand-dark text-gray-500 border-brand-border'
                  }`}
                >
                  {p}
                </button>
              ))}
            </>
          ) : (
            <div className="flex items-center gap-4">
              <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))} className="p-2 text-gray-400 hover:text-white transition-all"><ChevronLeft/></button>
              <h3 className="font-black text-xs uppercase text-white min-w-[150px] text-center">{currentMonth.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}</h3>
              <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))} className="p-2 text-gray-400 hover:text-white transition-all"><ChevronRight/></button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-brand-dark border border-brand-border rounded-xl p-1">
            <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'text-brand-orange bg-brand-card shadow-lg' : 'text-gray-500'}`}><List size={20} /></button>
            <button onClick={() => setViewMode('calendar')} className={`p-2 rounded-lg transition-all ${viewMode === 'calendar' ? 'text-brand-orange bg-brand-card shadow-lg' : 'text-gray-500'}`}><CalendarDays size={20} /></button>
          </div>
          <button onClick={() => { setEditingTask(null); setIsModalOpen(true); }} className="px-6 py-3 bg-brand-orange text-black rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-orange-600 transition-all">
            <Plus size={18} /> Nova Tarefa
          </button>
        </div>
      </div>

      <div className="flex-1 bg-brand-card rounded-3xl border border-brand-border shadow-2xl overflow-hidden overflow-y-auto custom-scrollbar">
        {viewMode === 'list' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-brand-dark/50 text-[10px] font-black uppercase tracking-widest text-gray-500 border-b border-brand-border">
                <tr>
                  <th className="px-8 py-5 w-32 text-center">Ações</th>
                  <th className="px-8 py-5">Atividade</th>
                  <th className="px-8 py-5">Projeto</th>
                  <th className="px-8 py-5">Data / Hora</th>
                  <th className="px-8 py-5 w-24 text-center">Prioridade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {filteredTasks.map(t => (
                  <tr key={t.id} className="hover:bg-white/5 group transition-colors">
                    <td className="px-8 py-5">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => toggleStatus(t)} className={`p-2 rounded-lg border transition-all ${t.status === TaskStatus.COMPLETED ? 'text-blue-500 border-blue-500/20' : 'text-green-500 border-green-500/20 hover:bg-green-500/10'}`}>
                           {t.status === TaskStatus.COMPLETED ? <RotateCcw size={16}/> : <Check size={16} />}
                        </button>
                        <button onClick={() => { setEditingTask(t); setIsModalOpen(true); }} className="p-2 rounded-lg border border-brand-border text-gray-500 hover:text-white transition-all">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => deleteTask(t.id)} className="p-2 rounded-lg border border-brand-border text-gray-500 hover:text-red-500 transition-all">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <p className={`text-sm font-bold ${t.status === TaskStatus.COMPLETED ? 'line-through text-gray-600' : 'text-white'}`}>{t.title}</p>
                      <span className="text-[10px] text-brand-orange font-black uppercase tracking-widest">{t.type}</span>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-xs font-black uppercase text-gray-300">{t.cardName}</span>
                    </td>
                    <td className="px-8 py-5 text-xs font-bold text-gray-400">
                      <div className="flex items-center gap-2"><Calendar size={12}/> {formatDisplayDate(t.date)}</div>
                      <div className="flex items-center gap-2 mt-1 opacity-60"><Clock size={12}/> {t.time}</div>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-lg border ${t.priority === Priority.HIGH ? 'text-red-500 border-red-500/30 bg-red-500/10' : t.priority === Priority.MEDIUM ? 'text-yellow-500 border-yellow-500/30 bg-yellow-500/10' : 'text-blue-500 border-blue-500/30 bg-blue-500/10'}`}>
                        {t.priority}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredTasks.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center text-gray-600 font-black uppercase text-[10px] tracking-[0.3em]">Nenhuma atividade encontrada para este período.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6">
            <CalendarGrid currentMonth={currentMonth} tasks={tasks} />
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <form onSubmit={handleTaskSubmit} className="bg-brand-card w-full max-w-lg rounded-[40px] border border-brand-border shadow-2xl overflow-hidden animate-in zoom-in-95">
             <div className="p-8 border-b border-brand-border bg-brand-dark/50 flex items-center justify-between">
              <h3 className="text-xl font-black text-white uppercase tracking-tight">{editingTask ? 'Editar Atividade' : 'Agendar Nova Atividade'}</h3>
              <button type="button" onClick={handleCloseModal} className="p-2 text-gray-500 hover:text-white transition-all"><X size={24} /></button>
            </div>
            <div className="p-10 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Vincular a Card</label>
                <select name="cardId" required defaultValue={editingTask?.cardId || preselectedCardId || ""} className="w-full bg-brand-dark border border-brand-border rounded-2xl py-4 px-6 text-white outline-none focus:border-brand-orange">
                  <option value="">-- Selecione o Projeto --</option>
                  <optgroup label="Em Prospecção">
                    {prospects.map(p => <option key={p.id} value={p.id}>{p.obra} ({p.construtora})</option>)}
                  </optgroup>
                  <optgroup label="Faturamentos Ativos">
                    {orders.map(o => <option key={o.id} value={o.id}>{o.orderNumber} - {o.obraName}</option>)}
                  </optgroup>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">O que deve ser feito?</label>
                <input name="title" required defaultValue={editingTask?.title} placeholder="Descrição da tarefa..." className="w-full bg-brand-dark border border-brand-border rounded-2xl py-4 px-6 text-white outline-none focus:border-brand-orange" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Data</label>
                  <input name="date" type="date" required defaultValue={editingTask?.date} className="w-full bg-brand-dark border border-brand-border rounded-2xl py-4 px-6 text-white outline-none focus:border-brand-orange" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Horário</label>
                  <input name="time" type="time" required defaultValue={editingTask?.time} className="w-full bg-brand-dark border border-brand-border rounded-2xl py-4 px-6 text-white outline-none focus:border-brand-orange" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Tipo de Atividade</label>
                  <select name="type" defaultValue={editingTask?.type} className="w-full bg-brand-dark border border-brand-border rounded-2xl py-4 px-6 text-white outline-none focus:border-brand-orange">
                    {Object.values(TaskType).map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Prioridade</label>
                  <select name="priority" defaultValue={editingTask?.priority} className="w-full bg-brand-dark border border-brand-border rounded-2xl py-4 px-6 text-white outline-none focus:border-brand-orange">
                    {Object.values(Priority).map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="p-8 border-t border-brand-border bg-brand-dark/50 flex justify-end gap-4">
              <button type="submit" className="px-12 py-4 bg-brand-orange text-black rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl shadow-brand-orange/20 hover:bg-orange-600 transition-all">
                {editingTask ? 'Salvar Alterações' : 'Confirmar Agendamento'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

const CalendarGrid: React.FC<{ currentMonth: Date, tasks: Task[] }> = ({ currentMonth, tasks }) => {
  const days = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const arr = [];
    for (let i = 0; i < firstDay; i++) arr.push(null);
    for (let i = 1; i <= totalDays; i++) arr.push(new Date(year, month, i));
    return arr;
  }, [currentMonth]);

  return (
    <div className="grid grid-cols-7 gap-px bg-brand-border rounded-xl overflow-hidden border border-brand-border shadow-2xl">
      {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
        <div key={day} className="bg-brand-dark p-4 text-center text-[10px] font-black uppercase tracking-widest text-gray-500">{day}</div>
      ))}
      {days.map((day, idx) => {
        const dayStr = day ? day.toISOString().split('T')[0] : '';
        const dayTasks = tasks.filter(t => t.date === dayStr);
        return (
          <div key={idx} className={`bg-brand-card min-h-[120px] p-2 flex flex-col gap-1 border-r border-b border-brand-border transition-colors hover:bg-white/5 ${!day ? 'bg-brand-dark/30' : ''}`}>
            {day && (
              <>
                <span className={`text-[10px] font-black p-1 w-7 h-7 flex items-center justify-center rounded-lg mb-1 ${day.toDateString() === new Date().toDateString() ? 'bg-brand-orange text-black shadow-lg' : 'text-gray-500'}`}>
                  {day.getDate()}
                </span>
                <div className="space-y-1 overflow-y-auto max-h-[80px] custom-scrollbar">
                  {dayTasks.map(t => (
                    <div key={t.id} className={`text-[8px] p-1.5 rounded-lg border font-bold text-white truncate shadow-sm ${t.status === TaskStatus.COMPLETED ? 'bg-green-500/10 border-green-500/20 text-green-500 line-through' : 'bg-brand-dark border-brand-border'}`}>
                      {t.title}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default TaskManager;
