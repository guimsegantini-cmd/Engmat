
import React, { useState, useMemo } from 'react';
import { 
  Plus, X, Search, Edit3, MapPin, Building2, Trash2, Phone, Mail, Navigation, Calendar, Check, RotateCcw, Edit2, Clock, History, Loader2, UserPlus
} from 'lucide-react';
import { Prospect, Task, Contact, TaskStatus, TaskType, Priority, HistoryEntry } from '../types';
import { db } from '../firebase';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc,
  deleteDoc,
  arrayUnion
} from "firebase/firestore";

interface ProspectingKanbanProps {
  stages: string[];
  prospects: Prospect[];
  setProspects: React.Dispatch<React.SetStateAction<Prospect[]>>;
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  onAddTask?: (cardId: string) => void;
  currentUser: any;
}

const ProspectingKanban: React.FC<ProspectingKanbanProps> = ({ stages, prospects, setProspects, tasks, setTasks, onAddTask, currentUser }) => {
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [filterTier, setFilterTier] = useState<'All' | 'Gold' | 'Silver' | 'Bronze'>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formContacts, setFormContacts] = useState<Contact[]>([{ name: '', phone: '', email: '' }]);

  const existingCompanies = useMemo(() => {
    return Array.from(new Set(prospects.map(p => p.construtora))).sort();
  }, [prospects]);

  const filteredProspects = useMemo(() => {
    return prospects.filter(p => {
      const tierMatch = filterTier === 'All' || p.tier === filterTier;
      const term = searchTerm.toLowerCase();
      const searchMatch = p.obra.toLowerCase().includes(term) || 
                          p.construtora.toLowerCase().includes(term);
      return tierMatch && searchMatch;
    });
  }, [prospects, filterTier, searchTerm]);

  const moveProspect = async (id: string, newStage: string) => {
    if (isSaving) return;
    setIsSaving(true);
    const historyEntry: HistoryEntry = {
      status: `Movido para ${newStage}`,
      date: new Date().toLocaleString('pt-BR'),
      user: currentUser?.email || 'Desconhecido'
    };
    try {
      await updateDoc(doc(db, "prospects", id), { 
        stage: newStage,
        history: arrayUnion(historyEntry)
      });
    } catch (e) {
      console.error("Erro ao mover:", e);
      alert('Erro ao atualizar no Firestore. Verifique se o banco está ativo.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddProspect = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    
    const formData = new FormData(e.currentTarget);
    const initialStage = stages[0] || 'Lead';
    
    const newP = {
      obra: formData.get('obra') as string,
      construtora: formData.get('construtora') as string,
      address: formData.get('address') as string,
      cep: formData.get('cep') as string,
      streetNumber: formData.get('streetNumber') as string,
      complement: formData.get('complement') as string,
      tier: formData.get('tier') as any,
      stage: initialStage,
      createdAt: new Date().toISOString(),
      contacts: formContacts.filter(c => c.name || c.phone || c.email),
      history: [{
        status: `Cadastro criado em ${initialStage}`,
        date: new Date().toLocaleString('pt-BR'),
        user: currentUser?.email || 'Desconhecido'
      }]
    };
    
    try {
      await addDoc(collection(db, "prospects"), newP);
      setIsAdding(false);
      setFormContacts([{ name: '', phone: '', email: '' }]);
    } catch (e) {
      console.error("Erro Firestore:", e);
      alert('ERRO CRÍTICO: Não foi possível salvar no Firestore. Verifique se você criou o banco de dados no console do Firebase e se o status é "Ativo".');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditProspect = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedProspect || isSaving) return;
    setIsSaving(true);
    const formData = new FormData(e.currentTarget);
    const updatedData = {
      obra: formData.get('obra') as string,
      construtora: formData.get('construtora') as string,
      address: formData.get('address') as string,
      cep: formData.get('cep') as string,
      streetNumber: formData.get('streetNumber') as string,
      complement: formData.get('complement') as string,
      tier: formData.get('tier') as any,
      contacts: formContacts.filter(c => c.name || c.phone || c.email)
    };

    try {
      await updateDoc(doc(db, "prospects", selectedProspect.id), updatedData);
      setIsEditing(false);
    } catch (e) {
      console.error(e);
      alert('Erro ao salvar edições no Firestore.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProspect = async (id: string) => {
    if (!confirm('Deseja excluir esta prospecção permanentemente?')) return;
    if (isSaving) return;
    setIsSaving(true);
    try {
      await deleteDoc(doc(db, "prospects", id));
      setSelectedProspect(null);
      setIsEditing(false);
    } catch (e) {
      console.error(e);
      alert('Erro ao excluir do banco de dados.');
    } finally {
      setIsSaving(false);
    }
  };

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
      <datalist id="companies-history-list">
        {existingCompanies.map(c => <option key={c} value={c} />)}
      </datalist>

      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex bg-brand-dark p-1 rounded-xl border border-brand-border">
            {['All', 'Gold', 'Silver', 'Bronze'].map(t => (
              <button key={t} onClick={() => setFilterTier(t as any)} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${filterTier === t ? 'bg-brand-orange text-black shadow-lg shadow-brand-orange/20' : 'text-gray-500 hover:text-white'}`}>{t}</button>
            ))}
          </div>
          <div className="relative group">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-brand-orange transition-colors" />
            <input type="text" placeholder="Buscar por obra ou construtora..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-brand-dark border border-brand-border rounded-xl pl-9 pr-4 py-2 text-[10px] font-black uppercase text-white outline-none w-64 focus:border-brand-orange transition-all" />
          </div>
        </div>
        <button onClick={() => { setIsAdding(true); setFormContacts([{ name: '', phone: '', email: '' }]); }} className="px-6 py-3 bg-brand-orange text-black rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-orange-600 active:scale-95 transition-all">
          <Plus size={18} /> Nova Prospecção
        </button>
      </div>

      <div className="flex-1 overflow-x-auto pb-4 custom-scrollbar">
        <div className="flex gap-4 min-w-max h-full">
          {stages.map((stage) => (
            <div key={stage} className="w-80 flex flex-col bg-brand-card/30 rounded-2xl border border-brand-border/50 shadow-inner">
              <div className="p-4 flex items-center justify-between border-b border-brand-border bg-brand-card rounded-t-2xl">
                <h3 className="font-black text-xs uppercase tracking-widest text-gray-400">{stage}</h3>
                <span className="bg-brand-dark px-2 py-0.5 rounded text-[10px] font-black text-brand-orange">{filteredProspects.filter(p => p.stage === stage).length}</span>
              </div>
              <div className="flex-1 p-3 space-y-3 overflow-y-auto custom-scrollbar">
                {filteredProspects.filter(p => p.stage === stage).map((prospect) => (
                  <div key={prospect.id} onClick={() => { setSelectedProspect(prospect); setIsEditing(false); setFormContacts(prospect.contacts?.length ? prospect.contacts : [{name:'', phone:'', email:''}]); }} className="bg-brand-card p-4 rounded-xl border border-brand-border hover:border-brand-orange cursor-pointer shadow-lg transition-all transform hover:-translate-y-1">
                    <h4 className="font-bold text-sm text-white truncate">{prospect.obra}</h4>
                    <p className="text-[10px] text-gray-500 font-black uppercase mt-1 truncate">{prospect.construtora}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className={`text-[8px] font-black px-2 py-0.5 rounded border uppercase ${prospect.tier === 'Gold' ? 'text-yellow-500 border-yellow-500/30 bg-yellow-500/5' : 'text-gray-500 border-gray-500/30'}`}>{prospect.tier}</span>
                      <span className="text-[9px] text-gray-600 font-bold">{new Date(prospect.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedProspect && !isEditing && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-brand-card w-full max-w-6xl rounded-[40px] border border-brand-border shadow-2xl flex flex-col md:flex-row overflow-hidden max-h-[90vh]">
            <div className="flex-1 flex flex-col border-r border-brand-border overflow-hidden">
              <div className="p-8 bg-brand-dark/50 border-b border-brand-border text-white flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-brand-orange rounded-[20px] flex items-center justify-center text-black shadow-lg"><Building2 size={32} /></div>
                  <div>
                    <h3 className="font-black text-2xl uppercase tracking-tighter">{selectedProspect.obra}</h3>
                    <p className="text-sm text-gray-500 font-bold uppercase tracking-widest">{selectedProspect.construtora}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => setIsEditing(true)} className="p-3 bg-brand-card border border-brand-border text-gray-400 hover:text-brand-orange hover:border-brand-orange rounded-xl transition-all"><Edit3 size={20} /></button>
                  <button onClick={() => setSelectedProspect(null)} className="p-3 bg-brand-card border border-brand-border text-gray-500 hover:text-white rounded-xl transition-all"><X size={24} /></button>
                </div>
              </div>
              
              <div className="p-8 flex-1 overflow-y-auto space-y-8 custom-scrollbar text-white">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-brand-dark/50 p-6 rounded-3xl border border-brand-border space-y-4 shadow-xl group hover:border-brand-orange transition-all">
                    <h4 className="text-[10px] font-black text-brand-orange uppercase flex items-center gap-2 tracking-[0.2em]"><MapPin size={14}/> Logística da Obra</h4>
                    <p className="text-sm font-bold text-gray-300">{selectedProspect.address}, Nº {selectedProspect.streetNumber} {selectedProspect.complement && `(${selectedProspect.complement})`}</p>
                    <button onClick={() => window.open(`https://waze.com/ul?q=${encodeURIComponent(selectedProspect.address || '')}`, '_blank')} className="w-full py-4 bg-brand-card rounded-2xl border border-brand-border text-[10px] font-black uppercase tracking-widest hover:text-brand-orange transition-all flex items-center justify-center gap-2">
                       <Navigation size={14}/> Abrir Rota no Waze
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                     <h4 className="text-[10px] font-black text-brand-orange uppercase flex items-center gap-2 tracking-[0.2em] ml-1"><History size={14}/> Linha do Tempo</h4>
                     <div className="bg-brand-dark/50 rounded-3xl border border-brand-border max-h-48 overflow-y-auto p-5 space-y-4 custom-scrollbar">
                       {(selectedProspect.history || []).slice().reverse().map((h, i) => (
                         <div key={i} className="border-l-2 border-brand-orange pl-4 py-1 relative">
                           <div className="absolute -left-1.5 top-2 w-2.5 h-2.5 bg-brand-orange rounded-full shadow-[0_0_10px_rgba(245,124,0,0.5)]"></div>
                           <p className="text-[10px] font-black uppercase text-white leading-tight">{h.status}</p>
                           <p className="text-[9px] text-gray-500 font-bold mt-1">{h.date} • {h.user}</p>
                         </div>
                       ))}
                     </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-brand-orange uppercase tracking-widest ml-1">Equipe de Contato</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {selectedProspect.contacts?.map((c, i) => (
                      <div key={i} className="p-5 bg-brand-dark/50 border border-brand-border rounded-[24px] flex justify-between items-center group hover:border-brand-orange transition-all shadow-lg">
                        <div>
                          <p className="text-sm font-black text-white">{c.name}</p>
                          <p className="text-[11px] text-gray-500 font-bold uppercase mt-0.5">{c.phone}</p>
                        </div>
                        <div className="flex gap-2">
                          {c.phone && <a href={`https://wa.me/${c.phone.replace(/\D/g, '')}`} target="_blank" className="p-2.5 bg-brand-card text-green-500 rounded-xl hover:scale-110 transition-transform shadow-md"><Phone size={16}/></a>}
                          {c.email && <a href={`mailto:${c.email}`} className="p-2.5 bg-brand-card text-brand-orange rounded-xl hover:scale-110 transition-transform shadow-md"><Mail size={16}/></a>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                   <h4 className="text-[10px] font-black text-brand-orange uppercase tracking-widest ml-1">Mover para Próxima Etapa</h4>
                   <div className="flex flex-wrap gap-2">
                     {stages.map(s => (
                       <button key={s} onClick={() => moveProspect(selectedProspect.id, s)} disabled={isSaving} className={`px-5 py-3 rounded-xl text-[10px] font-black uppercase border transition-all ${selectedProspect.stage === s ? 'bg-brand-orange text-black border-brand-orange shadow-xl shadow-brand-orange/20' : 'bg-brand-card text-gray-500 border-brand-border hover:text-white disabled:opacity-50'}`}>{s}</button>
                     ))}
                   </div>
                </div>
              </div>
            </div>
            
            <div className="w-full md:w-80 bg-brand-dark/30 flex flex-col border-l border-brand-border overflow-hidden">
               <div className="p-8 border-b border-brand-border bg-brand-dark/50 flex items-center justify-between text-white">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Cronograma</h4>
                <button onClick={() => onAddTask && onAddTask(selectedProspect.id)} className="p-2 bg-brand-orange/10 text-brand-orange rounded-xl hover:bg-brand-orange hover:text-black transition-all"><Plus size={18} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
                {tasks.filter(t => t.cardId === selectedProspect.id).map(t => (
                  <div key={t.id} className="p-5 bg-brand-card border border-brand-border rounded-[24px] space-y-2 shadow-xl">
                     <p className="text-xs font-bold text-white leading-relaxed">{t.title}</p>
                     <div className="flex items-center gap-2 text-[9px] text-gray-500 font-black uppercase tracking-widest">
                       <Clock size={10} /> {t.date} • {t.time}
                     </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {(isAdding || isEditing) && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <form onSubmit={isAdding ? handleAddProspect : handleEditProspect} className="bg-brand-card w-full max-w-3xl rounded-[40px] border border-brand-border shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-brand-border bg-brand-dark/50 flex items-center justify-between text-white">
              <h3 className="text-xl font-black uppercase tracking-tight">{isAdding ? 'Nova Negociação' : 'Ajustar Cadastro'}</h3>
              <button type="button" onClick={() => { setIsAdding(false); setIsEditing(false); }} className="p-2 text-gray-500 hover:text-white"><X size={24} /></button>
            </div>
            
            <div className="p-10 space-y-8 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase ml-2 tracking-widest">Nome da Obra</label>
                  <input name="obra" defaultValue={selectedProspect?.obra} required placeholder="Ex: Residencial Mirante" className="w-full bg-brand-dark border border-brand-border rounded-2xl py-4 px-6 text-white outline-none focus:border-brand-orange transition-all font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase ml-2 tracking-widest">Construtora</label>
                  <input name="construtora" list="companies-history-list" defaultValue={selectedProspect?.construtora} required placeholder="Buscar ou digitar nova..." className="w-full bg-brand-dark border border-brand-border rounded-2xl py-4 px-6 text-white outline-none focus:border-brand-orange transition-all font-bold" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="grid grid-cols-3 gap-3">
                   <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase ml-2">CEP</label>
                    <input name="cep" defaultValue={selectedProspect?.cep} maxLength={8} onChange={(e) => e.target.value.length === 8 && handleCepSearch(e.target.value, (f, v) => {
                      const input = document.getElementsByName(f)[0] as HTMLInputElement;
                      if (input) input.value = v;
                    })} className="w-full bg-brand-dark border border-brand-border rounded-2xl py-4 px-4 text-white outline-none font-bold" />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase ml-2">Rua / Logradouro</label>
                    <input name="address" defaultValue={selectedProspect?.address} className="w-full bg-brand-dark border border-brand-border rounded-2xl py-4 px-6 text-white outline-none font-bold" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase ml-2">Nº</label>
                    <input name="streetNumber" defaultValue={selectedProspect?.streetNumber} className="w-full bg-brand-dark border border-brand-border rounded-2xl py-4 px-4 text-white outline-none font-bold" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase ml-2">Tier</label>
                    <select name="tier" defaultValue={selectedProspect?.tier} className="w-full bg-brand-dark border border-brand-border rounded-2xl py-4 px-2 text-white outline-none font-black uppercase text-[11px]">
                      <option value="Gold">Gold</option><option value="Silver">Silver</option><option value="Bronze">Bronze</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase ml-2">Compl.</label>
                    <input name="complement" defaultValue={selectedProspect?.complement} className="w-full bg-brand-dark border border-brand-border rounded-2xl py-4 px-4 text-white outline-none font-bold" />
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-6 border-t border-brand-border">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black text-brand-orange uppercase tracking-widest flex items-center gap-2"><UserPlus size={14}/> Gestão de Contatos Principais</h4>
                  <button type="button" onClick={addContactField} className="text-[9px] font-black uppercase text-brand-orange hover:text-white transition-colors bg-brand-orange/10 px-4 py-2 rounded-xl border border-brand-orange/20 shadow-lg shadow-brand-orange/5">+ Novo Contato</button>
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
              {isEditing && <button type="button" onClick={() => handleDeleteProspect(selectedProspect!.id)} className="text-red-500 font-black text-[10px] uppercase mr-auto tracking-widest border border-red-500/10 px-8 rounded-2xl hover:bg-red-500 hover:text-white transition-all">Apagar Registro</button>}
              <button type="submit" disabled={isSaving} className="px-14 py-5 bg-brand-orange text-black rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl shadow-brand-orange/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3">
                {isSaving ? <Loader2 size={18} className="animate-spin" /> : 'Finalizar e Salvar'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ProspectingKanban;
