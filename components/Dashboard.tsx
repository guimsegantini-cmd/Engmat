import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Cell, PieChart, Pie, Legend
} from 'recharts';
import { Filter, DollarSign, Home, Calendar, Building2, TrendingUp, CalendarDays } from 'lucide-react';
import { Prospect, Order, Task, PeriodFilter, DateRange, AppConfig } from '../types';

interface DashboardProps {
  prospects: Prospect[];
  orders: Order[];
  tasks: Task[];
  config: AppConfig;
}

const Dashboard: React.FC<DashboardProps> = ({ prospects, orders, tasks, config }) => {
  const [filterPeriod, setFilterPeriod] = useState<PeriodFilter>('Este Mês');
  const [customRange, setCustomRange] = useState<DateRange>({ start: '', end: '' });
  const [selectedRep, setSelectedRep] = useState<string>('Todas');

  const filterByDate = (dateStr: string) => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    const now = new Date();
    
    if (filterPeriod === 'Todas') return true;
    if (filterPeriod === 'Hoje') return date.toDateString() === now.toDateString();
    if (filterPeriod === 'Este Ano') return date.getFullYear() === now.getFullYear();
    if (filterPeriod === 'Este Mês') return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    
    if (filterPeriod === 'Esta Semana') {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0,0,0,0);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23,59,59,999);
      return date >= startOfWeek && date <= endOfWeek;
    }

    if (filterPeriod === 'Personalizado' && customRange.start && customRange.end) {
      const start = new Date(customRange.start);
      start.setHours(0,0,0,0);
      const end = new Date(customRange.end);
      end.setHours(23,59,59,999);
      return date >= start && date <= end;
    }
    
    return true;
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(o => filterByDate(o.date) && (selectedRep === 'Todas' || o.representada === selectedRep));
  }, [orders, filterPeriod, customRange, selectedRep]);

  const filteredProspects = useMemo(() => {
    return prospects.filter(p => filterByDate(p.createdAt));
  }, [prospects, filterPeriod, customRange]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => filterByDate(t.date));
  }, [tasks, filterPeriod, customRange]);

  const totalSales = filteredOrders.reduce((acc, curr) => acc + (curr.value || 0), 0);
  
  const salesByRep = useMemo(() => {
    const dataMap: { [key: string]: number } = {};
    config.representadas.forEach(r => dataMap[r] = 0);
    filteredOrders.forEach(o => {
      dataMap[o.representada] = (dataMap[o.representada] || 0) + o.value;
    });
    return Object.entries(dataMap).map(([name, value]) => ({ name, value }));
  }, [filteredOrders, config.representadas]);

  const salesTrend = useMemo(() => {
    const days: { [key: string]: number } = {};
    filteredOrders.forEach(o => {
      const d = o.date.split('T')[0];
      days[d] = (days[d] || 0) + o.value;
    });
    return Object.entries(days)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, value]) => ({ date, value }));
  }, [filteredOrders]);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      <div className="bg-brand-card p-4 rounded-3xl border border-brand-border flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-brand-orange" />
            <h2 className="text-[10px] font-black uppercase tracking-widest text-gray-500">Inteligência Comercial</h2>
          </div>
          
          <div className="flex items-center gap-2 bg-brand-dark p-1 rounded-xl border border-brand-border">
            {['Hoje', 'Esta Semana', 'Este Mês', 'Este Ano', 'Personalizado', 'Todas'].map(p => (
              <button key={p} onClick={() => setFilterPeriod(p as any)}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                  filterPeriod === p ? 'bg-brand-orange text-black' : 'text-gray-500 hover:text-white'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
           <div className="flex items-center gap-2">
            <Building2 size={16} className="text-gray-500" />
            <select 
              value={selectedRep} 
              onChange={(e) => setSelectedRep(e.target.value)}
              className="bg-brand-dark border border-brand-border rounded-xl px-3 py-2 text-[10px] font-black uppercase text-white outline-none focus:border-brand-orange"
            >
              <option value="Todas">Todas Indústrias</option>
              {config.representadas.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>
      </div>

      {filterPeriod === 'Personalizado' && (
        <div className="bg-brand-card p-6 rounded-3xl border border-brand-border flex items-center gap-6 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <CalendarDays size={18} className="text-brand-orange" />
            <span className="text-[10px] font-black uppercase text-gray-400">Intervalo Customizado:</span>
          </div>
          <input type="date" value={customRange.start} onChange={e => setCustomRange({...customRange, start: e.target.value})} className="bg-brand-dark border border-brand-border rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-brand-orange" />
          <span className="text-gray-600 font-bold text-xs">ATÉ</span>
          <input type="date" value={customRange.end} onChange={e => setCustomRange({...customRange, end: e.target.value})} className="bg-brand-dark border border-brand-border rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-brand-orange" />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total em Vendas" value={`R$ ${totalSales.toLocaleString('pt-BR')}`} sub={`${filteredOrders.length} faturamentos`} icon={<DollarSign size={20} />} color="orange" />
        <StatCard label="Pipeline de Obras" value={filteredProspects.length.toString()} sub="Prospecções ativas" icon={<Home size={20} fill="currentColor" />} color="blue" />
        <StatCard label="Tarefas Concluídas" value={`${filteredTasks.filter(t => t.status === 'Concluída').length}/${filteredTasks.length}`} sub="Atividades no período" icon={<Calendar size={20} />} color="green" />
        <StatCard label="Parceiros Ativos" value={config.representadas.length.toString()} sub="Indústrias cadastradas" icon={<Building2 size={20} />} color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-brand-card p-8 rounded-[40px] border border-brand-border shadow-xl">
          <h3 className="font-black text-xs uppercase tracking-[0.2em] text-gray-500 mb-8 flex items-center gap-2">
            <TrendingUp size={16} className="text-brand-orange"/> Histórico de Faturamento
          </h3>
          <div className="h-80">
            {salesTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesTrend}>
                  <defs>
                    <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F57C00" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#F57C00" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                  <XAxis dataKey="date" stroke="#444" fontSize={10} axisLine={false} tickLine={false} />
                  <YAxis stroke="#444" fontSize={10} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#121212', border: '1px solid #333', borderRadius: '16px', fontSize: '10px' }} />
                  <Area type="monotone" dataKey="value" stroke="#F57C00" strokeWidth={3} fillOpacity={1} fill="url(#salesGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-600 font-black uppercase text-[10px]">Sem faturamentos registrados no período</div>
            )}
          </div>
        </div>

        <div className="bg-brand-card p-8 rounded-[40px] border border-brand-border shadow-xl">
          <h3 className="font-black text-xs uppercase tracking-[0.2em] text-gray-500 mb-8 flex items-center gap-2">
            <Building2 size={16} className="text-brand-orange"/> Faturamento por Indústria
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesByRep} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#222" horizontal={false} />
                <XAxis type="number" stroke="#444" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" stroke="#fff" fontSize={10} width={100} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#121212', border: '1px solid #333', borderRadius: '16px', fontSize: '10px' }} />
                <Bar dataKey="value" fill="#F57C00" radius={[0, 10, 10, 0]} barSize={20}>
                  {salesByRep.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.value > 0 ? '#F57C00' : '#222'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<any> = ({ label, value, sub, icon, color }) => {
  const colors: any = {
    orange: 'bg-brand-orange/10 text-brand-orange border-brand-orange/20',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    green: 'bg-green-500/10 text-green-400 border-green-500/20',
    red: 'bg-red-500/10 text-red-400 border-red-500/20',
  };
  return (
    <div className="bg-brand-card p-6 rounded-3xl border border-brand-border hover:border-brand-orange transition-all shadow-xl group">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 border ${colors[color]} group-hover:scale-110 transition-transform`}>{icon}</div>
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">{label}</p>
      <h2 className="text-2xl font-black text-white mt-1">{value}</h2>
      <p className="text-[10px] font-bold text-gray-600 mt-1 uppercase">{sub}</p>
    </div>
  );
};

export default Dashboard;