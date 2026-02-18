
import React, { useState } from 'react';
import { Settings, Save, Plus, Trash2, ListTree, Building, Paperclip, FileText, Check, Loader2, X } from 'lucide-react';
import { AppConfig } from '../types';
import { db } from '../firebase';
import { doc, setDoc } from "firebase/firestore";

interface ConfigPanelProps {
  config: AppConfig;
  setConfig: (config: AppConfig) => void;
  isDemo?: boolean;
}

const ConfigPanel: React.FC<ConfigPanelProps> = ({ config, setConfig, isDemo }) => {
  const [localConfig, setLocalConfig] = useState<AppConfig>(config);
  const [loading, setLoading] = useState(false);
  const [newItemText, setNewItemText] = useState({ prospect: '', order: '', rep: '' });

  const handleSave = async () => {
    setLoading(true);
    try {
      if (!isDemo) {
        await setDoc(doc(db, "config", "system"), localConfig);
      }
      setConfig(localConfig);
      alert('Configurações aplicadas com sucesso em todo o sistema!');
    } catch (e) {
      alert('Erro ao salvar no banco de dados. Verifique sua conexão.');
    }
    setLoading(false);
  };

  const handleAddItem = (field: 'prospectStages' | 'orderStages' | 'representadas', key: 'prospect' | 'order' | 'rep') => {
    const value = newItemText[key].trim();
    if (!value) return;
    
    setLocalConfig(prev => ({
      ...prev,
      [field]: [...prev[field], value]
    }));
    setNewItemText(prev => ({ ...prev, [key]: '' }));
  };

  const removeItem = (field: 'prospectStages' | 'orderStages' | 'representadas', index: number) => {
    const itemToRemove = localConfig[field][index];
    const updated = [...localConfig[field]];
    updated.splice(index, 1);
    
    const updatedAttachments = { ...localConfig.representadaAttachments };
    if (field === 'representadas') {
      delete updatedAttachments[itemToRemove];
    }

    setLocalConfig(prev => ({ 
      ...prev, 
      [field]: updated,
      representadaAttachments: updatedAttachments
    }));
  };

  const handleFileUpload = (repName: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLocalConfig(prev => ({
          ...prev,
          representadaAttachments: {
            ...prev.representadaAttachments,
            [repName]: reader.result as string
          }
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12 animate-in fade-in duration-500">
      {/* Header Sticky ou Fixo para facilitar o salvamento */}
      <div className="flex items-center justify-between bg-brand-card p-6 rounded-3xl border border-brand-border shadow-2xl sticky top-0 z-20 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-brand-orange/10 rounded-2xl">
            <Settings size={28} className="text-brand-orange" />
          </div>
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight text-white">Configurações do Ecossistema</h2>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Gerencie pipelines e indústrias parceiras</p>
          </div>
        </div>
        <button 
          onClick={handleSave} disabled={loading}
          className="px-8 py-4 bg-brand-orange text-black font-black uppercase text-[11px] tracking-widest rounded-2xl shadow-xl shadow-brand-orange/20 hover:bg-orange-600 transition-all flex items-center gap-2 disabled:opacity-50 active:scale-95"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={18} />}
          {loading ? 'Salvando...' : 'Salvar e Sincronizar'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Gestão de Pipeline de Prospecção */}
        <div className="bg-brand-card p-8 rounded-[40px] border border-brand-border space-y-6 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="font-black uppercase text-xs text-brand-orange tracking-widest flex items-center gap-2"><ListTree size={16}/> Pipeline Prospecção</h3>
          </div>
          
          <div className="space-y-3">
            <div className="flex gap-2">
              <input 
                type="text" 
                value={newItemText.prospect}
                onChange={e => setNewItemText({...newItemText, prospect: e.target.value})}
                placeholder="Nome da nova etapa..."
                className="flex-1 bg-brand-dark border border-brand-border rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-brand-orange transition-all"
                onKeyPress={e => e.key === 'Enter' && handleAddItem('prospectStages', 'prospect')}
              />
              <button 
                onClick={() => handleAddItem('prospectStages', 'prospect')}
                className="p-3 bg-brand-orange/10 text-brand-orange rounded-xl border border-brand-orange/20 hover:bg-brand-orange hover:text-black transition-all"
              >
                <Plus size={20} />
              </button>
            </div>
            
            <div className="flex flex-wrap gap-2 pt-2">
              {localConfig.prospectStages.map((s, i) => (
                <div key={i} className="flex items-center gap-3 bg-brand-dark px-4 py-2 rounded-xl border border-brand-border text-white group hover:border-brand-orange transition-all">
                  <span className="text-[10px] font-black uppercase tracking-widest">{s}</span>
                  <button onClick={() => removeItem('prospectStages', i)} className="text-gray-600 hover:text-red-500 transition-colors"><X size={14} /></button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Gestão de Pipeline de Pedidos */}
        <div className="bg-brand-card p-8 rounded-[40px] border border-brand-border space-y-6 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="font-black uppercase text-xs text-brand-orange tracking-widest flex items-center gap-2"><ListTree size={16}/> Pipeline Pedidos</h3>
          </div>

          <div className="space-y-3">
            <div className="flex gap-2">
              <input 
                type="text" 
                value={newItemText.order}
                onChange={e => setNewItemText({...newItemText, order: e.target.value})}
                placeholder="Nome da nova etapa..."
                className="flex-1 bg-brand-dark border border-brand-border rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-brand-orange transition-all"
                onKeyPress={e => e.key === 'Enter' && handleAddItem('orderStages', 'order')}
              />
              <button 
                onClick={() => handleAddItem('orderStages', 'order')}
                className="p-3 bg-brand-orange/10 text-brand-orange rounded-xl border border-brand-orange/20 hover:bg-brand-orange hover:text-black transition-all"
              >
                <Plus size={20} />
              </button>
            </div>
            
            <div className="flex flex-wrap gap-2 pt-2">
              {localConfig.orderStages.map((s, i) => (
                <div key={i} className="flex items-center gap-3 bg-brand-dark px-4 py-2 rounded-xl border border-brand-border text-white group hover:border-brand-orange transition-all">
                  <span className="text-[10px] font-black uppercase tracking-widest">{s}</span>
                  <button onClick={() => removeItem('orderStages', i)} className="text-gray-600 hover:text-red-500 transition-colors"><X size={14} /></button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Indústrias Parceiras */}
        <div className="bg-brand-card p-8 rounded-[40px] border border-brand-border space-y-6 shadow-xl md:col-span-2">
          <div className="flex items-center justify-between border-b border-brand-border pb-6">
            <h3 className="font-black uppercase text-xs text-brand-orange tracking-widest flex items-center gap-2"><Building size={16}/> Gestão de Indústrias Parceiras</h3>
            <div className="flex gap-2 w-full max-w-sm">
              <input 
                type="text" 
                value={newItemText.rep}
                onChange={e => setNewItemText({...newItemText, rep: e.target.value})}
                placeholder="Nome da Indústria/Representada..."
                className="flex-1 bg-brand-dark border border-brand-border rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-brand-orange transition-all"
                onKeyPress={e => e.key === 'Enter' && handleAddItem('representadas', 'rep')}
              />
              <button 
                onClick={() => handleAddItem('representadas', 'rep')}
                className="px-6 bg-brand-orange text-black rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-orange-600 transition-all active:scale-95 flex items-center gap-2"
              >
                <Plus size={18} /> Adicionar
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
            {localConfig.representadas.map((r, i) => (
              <div key={i} className="flex flex-col p-6 bg-brand-dark rounded-3xl border border-brand-border transition-all hover:border-brand-orange group relative overflow-hidden shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-brand-card flex items-center justify-center text-gray-600 group-hover:text-brand-orange transition-colors">
                      <Building size={24}/>
                    </div>
                    <div>
                      <span className="text-sm font-black text-white uppercase tracking-tight block">{r}</span>
                      <span className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">ID Parceiro: 00{i+1}</span>
                    </div>
                  </div>
                  <button onClick={() => removeItem('representadas', i)} className="text-gray-700 hover:text-red-500 transition-colors p-2 bg-brand-dark rounded-xl border border-brand-border hover:border-red-500/30">
                    <Trash2 size={18} />
                  </button>
                </div>

                <div className="mt-auto pt-6 border-t border-brand-border/50 space-y-3">
                  <label className="cursor-pointer group/btn flex items-center justify-between w-full p-4 rounded-2xl bg-brand-card border border-brand-border hover:border-brand-orange transition-all active:scale-[0.98]">
                    <input type="file" className="hidden" accept=".pdf,image/*" onChange={(e) => handleFileUpload(r, e)} />
                    <span className="text-[10px] font-black uppercase text-gray-500 group-hover/btn:text-brand-orange flex items-center gap-2">
                      <Paperclip size={14} /> {localConfig.representadaAttachments[r] ? 'Atualizar Catálogo' : 'Anexar Catálogo'}
                    </span>
                    {localConfig.representadaAttachments[r] ? <Check size={16} className="text-green-500" /> : <FileText size={16} className="text-gray-700" />}
                  </label>
                  
                  {localConfig.representadaAttachments[r] && (
                    <button 
                      onClick={() => {
                        const win = window.open();
                        win?.document.write(`
                          <body style="margin:0; background:#121212; display:flex; align-items:center; justify-center;">
                            <embed width="100%" height="100%" src="${localConfig.representadaAttachments[r]}" type="application/pdf" />
                          </body>
                        `);
                      }}
                      className="w-full py-2 text-[10px] font-black uppercase text-brand-orange hover:text-white transition-colors underline tracking-widest"
                    >
                      Visualizar Catálogo Ativo
                    </button>
                  )}
                </div>
              </div>
            ))}
            
            {localConfig.representadas.length === 0 && (
              <div className="col-span-full py-20 text-center bg-brand-dark/30 rounded-[40px] border-2 border-dashed border-brand-border">
                <p className="text-gray-600 font-black uppercase tracking-widest text-xs italic">Nenhuma indústria parceira cadastrada. Utilize o campo acima para começar.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigPanel;
