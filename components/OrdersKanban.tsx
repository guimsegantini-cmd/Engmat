
import React, { useState, useMemo } from 'react';
import { 
  Plus, X, Search, Edit3, MapPin, Package, Building2, Calendar, Phone, Mail, Navigation, Trash2, Check, RotateCcw, Edit2, FileText, DollarSign, ArrowRight, History, Loader2, UserPlus
} from 'lucide-react';
import { Order, AppConfig, Task, Prospect, Contact, TaskStatus, TaskType, Priority, HistoryEntry } from '../types';
import { db } from '../firebase';
import { collection, addDoc, updateDoc, doc, deleteDoc, arrayUnion } from "firebase/firestore";

interface OrdersKanbanProps {
  stages: string[];
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  config: AppConfig;
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  prospects: Prospect[];
  onAddTask?: (cardId: string) => void;
  currentUser: any;
}

const OrdersKanban: React.FC<OrdersKanbanProps> = ({ stages, orders, setOrders, config, tasks, setTasks, prospects, onAddTask, currentUser }) => {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isEditingOrder, setIsEditingOrder] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRep, setSelectedRep] = useState<string>('Todas');
  
  const [formContacts, setFormContacts] = useState<Contact[]>([{ name: '', phone: '', email: '' }]);

  const moveOrder = async (id: string, newStage: string) => {
    if (isSaving) return;
    setIsSaving(true);
    const historyEntry: HistoryEntry = {
      status: `Etapa alterada para ${newStage}`,
      date: new Date().toLocaleString('pt-BR'),
      user: currentUser?.email || 'Desconhecido'
    };

    try {
      await updateDoc(doc(db, "orders", id), { 
        status: newStage,
        history: arrayUnion(historyEntry)
      });
    } catch (e) {
      console.error("Erro ao mover pedido:", e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditOrder = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedOrder || isSaving) return;
    setIsSaving(true);
    const formData = new FormData(e.currentTarget);
    const updated = {
      clientName: formData.get('client') as string,
      billingCnpj: formData.get('cnpj') as string,
      obraName: formData.get('obra') as string,
      value: Number(formData.get('value')),
      representada: formData.get('representada') as string,
      expectedBillingDate: formData.get('expectedBillingDate') as string,
      address: formData.get('address') as string,
      cep: formData.get('cep') as string,
      streetNumber: formData.get('streetNumber') as string,
      complement: formData.get('complement') as string,
      contacts: formContacts.filter(c => c.name || c.phone || c.email)
    };

    try {
      await updateDoc(doc(db, "orders", selectedOrder.id), updated);
      setIsEditingOrder(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddOrder = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    const formData = new FormData(e.currentTarget);
    const initialStage = stages[0] || 'Novo';
    
    const newO = {
      orderNumber: `#FAT-${Math.floor(10000 + Math.random() * 90000)}`,
      clientName: formData.get('client') as string,
      billingCnpj: formData.get('cnpj') as string,
      obraName: formData.get('obra') as string,
      value: Number(formData.get('value')),
      representada: formData.get('representada') as string,
      expectedBillingDate: formData.get('expectedBillingDate') as string,
      suggestedRepresentadas: [],
      contacts: formContacts.filter(c => c.name || c.phone || c.email),
      status: initialStage,
      date: new Date().toISOString(),
      history: [{ 
        status: `Faturamento lançado em ${initialStage}`, 
        date: new Date().toLocaleString('pt-BR'), 
        user: currentUser?.email || 'Sistema' 
      }],
      address: formData.get('address') as string,
      cep: formData.get('cep') as string,
      streetNumber: formData.get('streetNumber') as string,
      complement: formData.get('complement') as string
    };
    
    try {
      await addDoc(collection(db, "orders"), newO);
      setIsAdding(false);
      setFormContacts([{ name: '', phone: '', email: '' }]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteOrder = async (id: string) => {
    if (!confirm('Deseja excluir este faturamento permanentemente?')) return;
    if (isSaving) return;
    setIsSaving(true);
    try {
      await deleteDoc(doc(db, "orders", id));
      setSelectedOrder(null);
      setIsEditingOrder(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const repMatch = selectedRep === 'Todas' || o.representada === selectedRep;
      const term = searchTerm.toLowerCase();
      const searchMatch = o.orderNumber.toLowerCase().includes(term) || 
                          o.obraName.toLowerCase().includes(term) || 
                          o.clientName.toLowerCase().includes(term);
      return repMatch && searchMatch;
    });
  }, [orders, selectedRep, searchTerm]);

  const existingClients = useMemo(() => {
    const fromOrders = orders.map(o => o.clientName);
    const fromProspects = prospects.map(p => p.construtora);
    return Array.from(new Set([...fromOrders, ...fromProspects]));
  }, [orders, prospects]);

  const handleCepSearch = async (cep: string, setFieldValue: (field: string, value: string) => void) => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setFieldValue('address', `${data.logradouro}, ${data.bairro} - ${data.localidade}/${data.uf}`);
        }
      } catch (error) { console.error(error); }
    }
  };

  const updateContact = (index: number, field: keyof Contact, value: string) => {
    const updated = [...formContacts];
    updated[index][field] = value;
    setFormContacts(updated);
  };

  const addContactField = () => setFormContacts([...formContacts, { name: '', phone: '', email: '' }]);
  const removeContactField = (idx: number) => setFormContacts(formContacts.filter((_, i) => i !== idx));

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Autocomplete para Clientes */}
      <datalist id="clients-list">
        {existingClients.map(c => <option key={c} value={c} />)}
      </datalist>

      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
        <div className="flex flex-wrap gap-3">
          <select value={selectedRep} onChange={e => setSelectedRep(e.target.value)} className="bg-brand-dark border border-brand-border rounded-xl p-2 text-[10px] font-black uppercase text-white outline-none">
            <option value="Todas">Todas Indústrias</option>
            {config.representadas.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <div className="relative group">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input type="text" placeholder="Buscar faturamento..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-brand-dark border border-brand-border rounded-xl pl-9 pr-4 py-2 text-[10px] font-black uppercase text-white outline-none w-64" />
          </div>
        </div>
        <button onClick={() => { setIsAdding(true); setFormContacts([{ name: '', phone: '', email: '' }]); }} className="flex items-center gap-2 px-6 py-3 bg-brand-orange text-black rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:scale-105 transition-all"><Plus size={18} /> Novo Faturamento</button>
      </div>

      <div className="flex-1 overflow-x-auto pb-4 custom-scrollbar">
        <div className="flex gap-4 min-w-max h-full">
          {stages.map((stage) => {
            const stageOrders = filteredOrders.filter(o => o.status === stage);
            const total = stageOrders.reduce((acc, curr) => acc + (curr.value || 0), 0);
            return (
              <div key={stage} className="w-80 flex flex-col bg-brand-card/20 rounded-2xl border border-brand-border/30 shadow-inner">
                <div className="p-4 bg-brand-card rounded-t-2xl border-b border-brand-border">
                  <div className="flex items-center justify-between">
                    <h3 className="font-black text-xs uppercase tracking-widest text-gray-400">{stage}</h3>
                    <span className="text-[10px] text-brand-orange font-black">R$ {total.toLocaleString('pt-BR')}</span>
                  </div>
                </div>
                <div className="flex-1 p-3 space-y-3 overflow-y-auto custom-scrollbar">
                  {stageOrders.map((order) => (
                    <div key={order.id} onClick={() => { setSelectedOrder(order); setIsEditingOrder(false); setFormContacts(order.contacts?.length ? order.contacts : [{name:'', phone:'', email:''}]); }} className="bg-brand-card p-4 rounded-xl border border-brand-border hover:border-brand-orange cursor-pointer transition-all transform hover:-translate-y-1">
                      <span className="text-[9px] font-black text-brand-orange">{order.orderNumber}</span>
                      <h4 className="font-bold text-sm text-white mt-1 truncate">{order.obraName}</h4>
                      <p className="text-[10px] text-gray-500 uppercase font-bold truncate">{order.clientName}</p>
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-brand-border/30">
                        <span className="text-xs font-black text-white">R$ {order.value.toLocaleString('pt-BR')}</span>
                        <span className="text-[8px] text-gray-500 font-black uppercase">{order.representada}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedOrder && !isEditingOrder && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-brand-card w-full max-w-6xl rounded-[40px] border border-brand-border shadow-2xl flex flex-col md:flex-row overflow-hidden max-h-[90vh]">
            <div className="flex-1 flex flex-col border-r border-brand-border overflow-hidden">
              <div className="p-8 bg-brand-dark/50 border-b border-brand-border flex items-center justify-between text-white">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-brand-orange rounded-[20px] flex items-center justify-center text-black shadow-lg"><Package size={32} /></div>
                  <div>
                    <h3 className="font-black text-2xl uppercase tracking-tighter">{selectedOrder.orderNumber}</h3>
                    <p className="text-sm text-gray-500 font-bold uppercase tracking-widest">{selectedOrder.obraName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => setIsEditingOrder(true)} className="p-3 bg-brand-card border border-brand-border text-gray-400 hover:text-brand-orange rounded-xl transition-all"><Edit3 size={20}/></button>
                  <button onClick={() => setSelectedOrder(null)} className="p-3 bg-brand-card border border-brand-border text-gray-500 hover:text-white rounded-xl transition-all"><X size={24}/></button>
                </div>
              </div>

              <div className="p-8 space-y-8 text-white overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-brand-dark/50 p-6 rounded-3xl border border-brand-border shadow-xl">
                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em]">Faturamento Líquido</p>
                    <h4 className="text-2xl font-black text-brand-orange mt-2">R$ {selectedOrder.value.toLocaleString('pt-BR')}</h4>
                  </div>
                  <div className="bg-brand-dark/50 p-6 rounded-3xl border border-brand-border shadow-xl">
                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em]">Indústria Fornecedora</p>
                    <h4 className="text-xl font-black text-white mt-2 truncate uppercase">{selectedOrder.representada}</h4>
                  </div>
                  <div className="bg-brand-dark/50 p-6 rounded-3xl border border-brand-border shadow-xl">
                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em]">Data de Faturamento</p>
                    <h4 className="text-xl font-black text-white mt-2 flex items-center gap-2"><Calendar size={20} className="text-brand-orange" /> {selectedOrder.expectedBillingDate ? new Date(selectedOrder.expectedBillingDate).toLocaleDateString() : 'A definir'}</h4>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-brand-dark/40 p-8 rounded-[32px] border border-brand-border space-y-6 shadow-xl">
                    <h4 className="text-[10px] font-black text-brand-orange uppercase flex items-center gap-2 tracking-[0.2em]"><FileText size={16}/> Informações de Entrega</h4>
                    <div className="space-y-4">
                      <p className="text-sm text-gray-400 font-black uppercase">Cliente: <span className="text-white ml-2">{selectedOrder.clientName}</span></p>
                      <p className="text-sm font-bold text-gray-300 flex items-start gap-3 pt-4 border-t border-brand-border/30">
                        <MapPin size={18} className="text-brand-orange shrink-0 mt-0.5" />
                        {selectedOrder.address}, {selectedOrder.streetNumber} {selectedOrder.complement}
                      </p>
                      <button onClick={() => window.open(`https://waze.com/ul?q=${encodeURIComponent(selectedOrder.address || '')}`, '_blank')} className="w-full py-4 bg-brand-card rounded-2xl border border-brand-border text-[10px] font-black uppercase tracking-widest hover:text-brand-orange transition-all flex items-center justify-center gap-2">
                         <Navigation size={14}/> Traçar Rota de Entrega
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                     <h4 className="text-[10px] font-black text-brand-orange uppercase tracking-widest ml-2 flex items-center gap-2"><History size={16}/> Histórico de Movimentações</h4>
                     <div className="bg-brand-dark rounded-[32px] border border-brand-border max-h-48 overflow-y-auto custom-scrollbar p-6 space-y-4 shadow-xl">
                       {(selectedOrder.history || []).slice().reverse().map((h, i) => (
                         <div key={i} className="border-l-2 border-brand-orange pl-4 py-1 relative">
                           <div className="absolute -left-1.5 top-2 w-2.5 h-2.5 bg-brand-orange rounded-full"></div>
                           <p className="text-[10px] font-black uppercase text-white">{h.status}</p>
                           <p className="text-[9px] text-gray-500 font-bold">{h.date} • {h.user}</p>
                         </div>
                       ))}
                     </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-brand-orange uppercase tracking-widest ml-2">Pessoas de Contato</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {selectedOrder.contacts?.map((c, i) => (
                      <div key={i} className="p-5 bg-brand-dark border border-brand-border rounded-[24px] flex justify-between items-center group hover:border-brand-orange transition-all shadow-lg">
                        <div>
                          <p className="text-sm font-black text-white">{c.name}</p>
                          <p className="text-[11px] text-gray-500 font-bold uppercase mt-1">{c.phone}</p>
                        </div>
                        <div className="flex gap-2">
                          {c.phone && <a href={`https://wa.me/${c.phone.replace(/\D/g, '')}`} target="_blank" className="p-3 bg-brand-card text-green-500 rounded-xl hover:scale-110 transition-transform"><Phone size={18}/></a>}
                          {c.email && <a href={`mailto:${c.email}`} className="p-3 bg-brand-card text-brand-orange rounded-xl hover:scale-110 transition-transform"><Mail size={18}/></a>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                   <h4 className="text-[10px] font-black text-brand-orange uppercase tracking-widest">Atualizar Estágio do Pedido</h4>
                   <div className="flex flex-wrap gap-2">
                     {stages.map(s => (
                       <button key={s} onClick={() => moveOrder(selectedOrder.id, s)} disabled={isSaving} className={`px-5 py-3 rounded-xl text-[10px] font-black uppercase border transition-all ${selectedOrder.status === s ? 'bg-brand-orange text-black border-brand-orange shadow-xl shadow-brand-orange/20' : 'bg-brand-dark text-gray-500 border-brand-border hover:text-white disabled:opacity-50'}`}>{s}</button>
                     ))}
                   </div>
                </div>
              </div>
            </div>

            <div className="w-full md:w-80 bg-brand-dark/30 flex flex-col border-l border-brand-border overflow-hidden">
              <div className="p-8 border-b border-brand-border bg-brand-dark/50 flex items-center justify-between text-white">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Acompanhamento</h4>
                <button onClick={() => onAddTask && onAddTask(selectedOrder.id)} className="p-2 bg-brand-orange/10 text-brand-orange rounded-xl hover:bg-brand-orange hover:text-black transition-all">
                  <Plus size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                {tasks.filter(t => t.cardId === selectedOrder.id).map(t => (
                  <div key={t.id} className="p-5 bg-brand-card border border-brand-border rounded-[24px] space-y-2 shadow-xl">
                    <p className="text-xs font-bold text-white leading-relaxed">{t.title}</p>
                    <div className="flex items-center gap-2 text-[9px] text-gray-500 font-black uppercase">
                       <Calendar size={10} /> {t.date} • {t.time}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL LANÇAR / EDITAR COM CONTATOS */}
      {(isAdding || isEditingOrder) && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <form onSubmit={isAdding ? handleAddOrder : handleEditOrder} className="bg-brand-card w-full max-w-3xl rounded-[40px] border border-brand-border shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-brand-border bg-brand-dark/50 flex items-center justify-between text-white">
              <h3 className="text-xl font-black uppercase tracking-tight">{isAdding ? 'Novo Lançamento' : `Editar Pedido ${selectedOrder?.orderNumber}`}</h3>
              <button type="button" onClick={() => { setIsAdding(false); setIsEditingOrder(false); }} className="p-2 text-gray-500 hover:text-white"><X size={24} /></button>
            </div>
            
            <div className="p-10 space-y-8 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase ml-2 tracking-widest">Cliente / Construtora</label>
                  <input name="client" required list="clients-list" defaultValue={selectedOrder?.clientName} className="w-full bg-brand-dark border border-brand-border rounded-2xl py-4 px-6 text-white outline-none focus:border-brand-orange transition-all font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase ml-2 tracking-widest">Obra / Local Entrega</label>
                  <input name="obra" required defaultValue={selectedOrder?.obraName} className="w-full bg-brand-dark border border-brand-border rounded-2xl py-4 px-6 text-white outline-none focus:border-brand-orange transition-all font-bold" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase ml-2 tracking-widest">Valor do Pedido (R$)</label>
                  <input name="value" type="number" step="0.01" required defaultValue={selectedOrder?.value} className="w-full bg-brand-dark border border-brand-border rounded-2xl py-4 px-6 text-white outline-none focus:border-brand-orange font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase ml-2 tracking-widest">Representada</label>
                  <select name="representada" required defaultValue={selectedOrder?.representada} className="w-full bg-brand-dark border border-brand-border rounded-2xl py-4 px-4 text-white outline-none font-black uppercase text-[11px]">
                    <option value="">Selecione...</option>
                    {config.representadas.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-brand-border/30">
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase ml-2">CEP</label>
                    <input name="cep" defaultValue={selectedOrder?.cep} maxLength={8} onChange={(e) => e.target.value.length === 8 && handleCepSearch(e.target.value, (f, v) => (document.getElementsByName(f)[0] as any).value = v)} className="w-full bg-brand-dark border border-brand-border rounded-2xl py-4 px-4 text-white outline-none font-bold" />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase ml-2">Rua / Logradouro</label>
                    <input name="address" required defaultValue={selectedOrder?.address} className="w-full bg-brand-dark border border-brand-border rounded-2xl py-4 px-6 text-white outline-none font-bold" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                   <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase ml-2">Nº Entrega</label>
                    <input name="streetNumber" defaultValue={selectedOrder?.streetNumber} className="w-full bg-brand-dark border border-brand-border rounded-2xl py-4 px-6 text-white outline-none font-bold" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase ml-2">Data Fatur.</label>
                    <input name="expectedBillingDate" type="date" defaultValue={selectedOrder?.expectedBillingDate} className="w-full bg-brand-dark border border-brand-border rounded-2xl py-4 px-4 text-white outline-none font-bold" />
                  </div>
                </div>
              </div>

              {/* GESTÃO DE CONTATOS NO PEDIDO */}
              <div className="space-y-4 pt-6 border-t border-brand-border">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black text-brand-orange uppercase tracking-widest flex items-center gap-2"><UserPlus size={14}/> Contatos Logística / Recebimento</h4>
                  <button type="button" onClick={addContactField} className="text-[9px] font-black uppercase text-brand-orange hover:text-white transition-colors bg-brand-orange/10 px-4 py-2 rounded-xl border border-brand-orange/20 shadow-lg">+ Novo Contato</button>
                </div>
                {formContacts.map((contact, idx) => (
                  <div key={idx} className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-5 bg-brand-dark rounded-3xl border border-brand-border relative group/row animate-in slide-in-from-left-2">
                    <input placeholder="Responsável" value={contact.name} onChange={e => updateContact(idx, 'name', e.target.value)} className="bg-brand-card border border-brand-border rounded-xl px-4 py-3 text-xs text-white font-bold outline-none focus:border-brand-orange" />
                    <input placeholder="WhatsApp" value={contact.phone} onChange={e => updateContact(idx, 'phone', e.target.value)} className="bg-brand-card border border-brand-border rounded-xl px-4 py-3 text-xs text-white font-bold outline-none focus:border-brand-orange" />
                    <div className="flex gap-2">
                       <input placeholder="E-mail" value={contact.email} onChange={e => updateContact(idx, 'email', e.target.value)} className="flex-1 bg-brand-card border border-brand-border rounded-xl px-4 py-3 text-xs text-white font-bold outline-none focus:border-brand-orange" />
                       {formContacts.length > 1 && (
                         <button type="button" onClick={() => removeContactField(idx)} className="p-2.5 text-gray-600 hover:text-red-500 transition-colors"><Trash2 size={20}/></button>
                       )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-8 border-t border-brand-border bg-brand-dark/50 flex justify-end gap-4">
              {isEditingOrder && <button type="button" onClick={() => handleDeleteOrder(selectedOrder!.id)} className="text-red-500 font-black text-[10px] uppercase mr-auto tracking-widest border border-red-500/10 px-8 rounded-2xl hover:bg-red-500 hover:text-white transition-all">Cancelar Pedido</button>}
              <button type="submit" disabled={isSaving} className="px-14 py-5 bg-brand-orange text-black rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl shadow-brand-orange/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3">
                {isSaving ? <Loader2 size={18} className="animate-spin" /> : 'Confirmar e Salvar'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default OrdersKanban;
