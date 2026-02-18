
import React, { useState } from 'react';
import { Package, Search, ChevronLeft, Check, Clock, Truck, ShieldCheck, ShoppingBag, ArrowRight, Building2, ExternalLink, MapPin, X, FileText, Calendar } from 'lucide-react';
import { AppConfig, Order } from '../types';

interface PublicTrackingProps {
  onBack: () => void;
  config: AppConfig;
  orders: Order[];
}

const PublicTracking: React.FC<PublicTrackingProps> = ({ onBack, config, orders }) => {
  const [orderNumber, setOrderNumber] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedAttachment, setSelectedAttachment] = useState<{ name: string, url: string } | null>(null);

  const handleSearch = () => {
    setError('');
    if (!orderNumber) return;
    setLoading(true);

    setTimeout(() => {
      const found = orders.find(o => o.orderNumber.toLowerCase() === orderNumber.toLowerCase().trim());
      
      if (found) {
        const stages = config.orderStages;
        const currentIndex = stages.indexOf(found.status);
        
        const timeline = stages.map((s, idx) => ({
          status: s,
          date: idx <= currentIndex ? found.date : `Previsto para etapa ${idx + 1}`,
          done: idx <= currentIndex,
          current: idx === currentIndex
        }));

        setResult({
          number: found.orderNumber,
          status: found.status,
          obraName: found.obraName,
          address: `${found.address}, ${found.streetNumber} ${found.complement ? `(${found.complement})` : ''}`,
          cep: found.cep,
          expectedBillingDate: found.expectedBillingDate,
          lastUpdate: 'Logística ENGMAT',
          representada: found.representada,
          suggestedNext: found.suggestedRepresentadas || [],
          timeline: timeline
        });
      } else {
        setError('Pedido não encontrado. Verifique o número digitado.');
        setResult(null);
      }
      setLoading(false);
    }, 800);
  };

  const handleOpenRepAttachment = (rep: string) => {
    const attachmentUrl = config.representadaAttachments[rep];
    if (attachmentUrl) {
      setSelectedAttachment({ name: rep, url: attachmentUrl });
    } else {
      alert(`O catálogo para ${rep} não está disponível no momento.`);
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-white mb-8 transition-colors group">
          <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> Voltar para o Portal
        </button>

        <div className="bg-brand-card p-8 md:p-12 rounded-[40px] border border-brand-border shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5"><Package size={150} /></div>
          <div className="relative z-10">
            <h1 className="text-4xl font-black mb-2 uppercase tracking-tight text-white">Rastreio <span className="text-brand-orange">ENGMAT</span></h1>
            <p className="text-gray-400 mb-10 font-medium italic">Transparência em cada etapa do seu fornecimento.</p>

            <div className="flex gap-3 mb-4">
              <input type="text" value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="Nº do Pedido (Ex: #CT-9981)" 
                className="flex-1 bg-brand-dark border border-brand-border rounded-2xl py-5 px-8 text-white focus:border-brand-orange outline-none shadow-inner font-bold text-lg"
              />
              <button onClick={handleSearch} className="bg-brand-orange text-black px-10 rounded-2xl font-black uppercase text-sm tracking-widest hover:bg-orange-600 transition-all active:scale-95 disabled:opacity-50">
                {loading ? 'Consultando...' : 'Buscar'}
              </button>
            </div>
            
            {error && <p className="text-red-500 text-xs font-bold mb-8 uppercase tracking-widest">{error}</p>}

            {result && (
              <div className="space-y-12 animate-in slide-in-from-bottom-6 duration-700">
                <div className="bg-brand-orange/5 p-8 rounded-3xl border border-brand-orange/20 text-brand-orange text-sm font-bold leading-relaxed text-center italic">
                  "{config.trackingMessage}"
                </div>

                <div className="bg-brand-dark/40 p-8 rounded-[30px] border border-brand-border space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-brand-orange/10 p-3 rounded-2xl border border-brand-orange/20 text-brand-orange"><Building2 size={24}/></div>
                    <div>
                      <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Obra / Destinatário</p>
                      <h3 className="text-xl font-black text-white uppercase">{result.obraName}</h3>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="bg-brand-orange/10 p-3 rounded-2xl border border-brand-orange/20 text-brand-orange"><MapPin size={24}/></div>
                    <div>
                      <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Endereço de Entrega</p>
                      <h3 className="text-sm font-bold text-gray-300">{result.address}</h3>
                      <p className="text-xs text-gray-500 font-medium">CEP: {result.cep}</p>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-brand-dark/50 p-6 rounded-2xl border border-brand-border">
                    <p className="text-[10px] text-gray-500 font-black uppercase mb-1">Status Logístico</p>
                    <h3 className="font-black text-brand-orange uppercase tracking-tight text-lg">{result.status}</h3>
                  </div>
                  <div className="bg-brand-dark/50 p-6 rounded-2xl border border-brand-border">
                    <p className="text-[10px] text-gray-500 font-black uppercase mb-1">Material Originário de</p>
                    <h3 className="font-black text-white uppercase tracking-tight text-lg">{result.representada}</h3>
                  </div>
                  <div className="bg-brand-dark/50 p-6 rounded-2xl border border-brand-border flex flex-col justify-center">
                    <p className="text-[10px] text-gray-500 font-black uppercase mb-1">Previsão de Faturamento</p>
                    <h3 className="font-black text-white uppercase tracking-tight text-lg flex items-center gap-2">
                      <Calendar size={18} className="text-brand-orange" />
                      {result.expectedBillingDate ? new Date(result.expectedBillingDate).toLocaleDateString() : 'A definir'}
                    </h3>
                  </div>
                </div>

                <div className="relative pl-10 space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-brand-border">
                  {result.timeline.map((step: any, idx: number) => (
                    <div key={idx} className="relative">
                      <div className={`absolute -left-[32px] top-1 w-7 h-7 rounded-full border-4 border-brand-dark flex items-center justify-center z-10 transition-colors ${step.done ? 'bg-brand-orange shadow-[0_0_10px_rgba(245,124,0,0.5)]' : 'bg-brand-border'}`}>
                        {step.done ? <Check size={12} className="text-black" /> : null}
                      </div>
                      <h4 className={`font-black text-base uppercase tracking-tight ${step.current ? 'text-brand-orange animate-pulse' : step.done ? 'text-white' : 'text-gray-600'}`}>{step.status}</h4>
                      <p className="text-xs font-bold text-gray-500 mt-1">{step.date}</p>
                    </div>
                  ))}
                </div>

                {result.suggestedNext.length > 0 && (
                  <div className="pt-12 border-t border-brand-border space-y-6">
                    <div className="flex items-center gap-2">
                      <ShoppingBag size={20} className="text-brand-orange" />
                      <h3 className="font-black text-sm uppercase tracking-widest text-white">Também Trabalhamos com:</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {result.suggestedNext.map((rep: string) => (
                        <div 
                          key={rep} 
                          onClick={() => handleOpenRepAttachment(rep)}
                          className="p-6 bg-brand-dark rounded-3xl border border-brand-border flex items-center justify-between group hover:border-brand-orange transition-all cursor-pointer"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-brand-card rounded-2xl flex items-center justify-center text-gray-500 group-hover:text-brand-orange transition-colors"><Building2 size={24}/></div>
                            <div className="flex flex-col">
                              <span className="font-black text-sm uppercase text-gray-400 group-hover:text-white transition-colors">{rep}</span>
                              <span className="text-[9px] font-bold text-brand-orange opacity-0 group-hover:opacity-100 transition-opacity">Ver Catálogo</span>
                            </div>
                          </div>
                          <ArrowRight size={20} className="text-gray-700 group-hover:text-brand-orange transform group-hover:translate-x-1 transition-all" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedAttachment && (
        <div className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-4">
          <div className="bg-brand-card w-full max-w-4xl rounded-[40px] border border-brand-border shadow-2xl flex flex-col h-[90vh] overflow-hidden">
            <div className="p-8 bg-brand-dark flex items-center justify-between border-b border-brand-border">
              <div className="flex items-center gap-4">
                <FileText className="text-brand-orange" size={24}/>
                <h3 className="text-xl font-black text-white uppercase tracking-tight">Catálogo {selectedAttachment.name}</h3>
              </div>
              <button onClick={() => setSelectedAttachment(null)} className="p-2 text-gray-500 hover:text-white transition-all"><X size={28}/></button>
            </div>
            <div className="flex-1 bg-brand-dark/50 flex items-center justify-center relative">
              <div className="text-center space-y-6">
                <div className="w-32 h-32 bg-brand-orange/10 rounded-full flex items-center justify-center text-brand-orange mx-auto">
                  <Building2 size={64}/>
                </div>
                <h2 className="text-2xl font-black text-white uppercase">Abrindo Catálogo Oficial</h2>
                <p className="text-gray-500 max-w-xs mx-auto">Você será redirecionado para o arquivo de especificações técnicas da indústria.</p>
                <a 
                  href={selectedAttachment.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 px-12 py-5 bg-brand-orange text-black rounded-3xl font-black uppercase tracking-widest hover:bg-orange-600 transition-all shadow-xl shadow-brand-orange/20"
                >
                  <ExternalLink size={20}/> Abrir Documento
                </a>
              </div>
            </div>
            <div className="p-6 text-center bg-brand-dark border-t border-brand-border">
              <span className="text-[10px] text-gray-600 font-black uppercase tracking-[0.3em]">ENGMAT Fornecimento & Logística</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicTracking;
