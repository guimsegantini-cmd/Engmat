
import React, { useState, useEffect } from 'react';
import { 
  Bell,
  Menu,
  Loader2,
  AlertTriangle,
  CloudUpload,
  RefreshCw,
  CheckCircle2,
  WifiOff,
  CloudOff
} from 'lucide-react';
import { auth, db, isFirebaseConfigured } from './firebase';
import { onAuthStateChanged } from "firebase/auth";
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc
} from "firebase/firestore";

import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ProspectingKanban from './components/ProspectingKanban';
import OrdersKanban from './components/OrdersKanban';
import TaskManager from './components/TaskManager';
import PublicTracking from './components/PublicTracking';
import Login from './components/Login';
import ConfigPanel from './components/ConfigPanel';
import { Order, Prospect, AppConfig, Task, TaskStatus } from './types';

type View = 'dashboard' | 'prospecting' | 'orders' | 'tasks' | 'settings' | 'tracking' | 'login';

const INITIAL_CONFIG: AppConfig = {
  prospectStages: ['Lead', 'Contato', 'Visita', 'Proposta', 'Fechamento'],
  orderStages: ['Orcamento', 'Aprovado', 'Producao', 'Faturado', 'Entregue'],
  representadas: ['Cimento Plus', 'Aço Estrutura', 'Telhas Lux', 'Geral Eng.'],
  representadaAttachments: {},
  automationMessages: {
    'Aprovado': 'Seu pedido foi aprovado!',
    'Faturado': 'Seu pedido foi faturado!',
    'Entregue': 'Seu material chegou na obra!'
  },
  trackingMessage: 'Acompanhe seu fornecimento com a ENGMAT.',
  googleCalendarConnected: false
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('login');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [config, setConfig] = useState<AppConfig>(INITIAL_CONFIG);
  const [dbError, setDbError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'syncing' | 'synced' | 'error' | 'offline'>('syncing');
  
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  
  const [notifications, setNotifications] = useState<{id: string, text: string, type: 'task' | 'alert'}[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const [taskModalTrigger, setTaskModalTrigger] = useState(false);
  const [preselectedCardId, setPreselectedCardId] = useState<string | undefined>();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
      if (firebaseUser) {
        if (currentView === 'login') setCurrentView('dashboard');
      } else {
        if (currentView !== 'tracking') setCurrentView('login');
      }
    });
    return () => unsubscribe();
  }, [currentView]);

  useEffect(() => {
    if (!user || !isFirebaseConfigured()) return;

    const handleFirestoreError = (error: any) => {
      console.error("Firestore Error:", error);
      if (error.code === 'not-found' || error.message.includes('not exist')) {
        setDbError("ERRO CRÍTICO: O banco de dados não foi encontrado. Você PRECISA criar o Firestore Database no Console do Firebase para salvar seus dados.");
        setSyncStatus('error');
      } else if (error.code === 'permission-denied') {
        setDbError("ACESSO NEGADO: Verifique as Regras de Segurança (Rules) do seu Firestore no Console.");
        setSyncStatus('error');
      } else {
        setSyncStatus('offline');
      }
    };

    setSyncStatus('syncing');

    // Listener de Prospecções
    const unsubProspects = onSnapshot(collection(db, "prospects"), (snapshot) => {
      setSyncStatus('synced');
      setDbError(null);
      const data = snapshot.docs.map(doc => ({
        id: doc.id, 
        ...doc.data(),
        history: Array.isArray(doc.data().history) ? doc.data().history : [],
        contacts: Array.isArray(doc.data().contacts) ? doc.data().contacts : []
      } as Prospect));
      setProspects(data);
    }, handleFirestoreError);

    // Listener de Pedidos
    const unsubOrders = onSnapshot(collection(db, "orders"), (snapshot) => {
      setSyncStatus('synced');
      const data = snapshot.docs.map(doc => ({
        id: doc.id, 
        ...doc.data(),
        history: Array.isArray(doc.data().history) ? doc.data().history : [],
        contacts: Array.isArray(doc.data().contacts) ? doc.data().contacts : []
      } as Order));
      setOrders(data);
    }, handleFirestoreError);

    // Listener de Tarefas
    const unsubTasks = onSnapshot(collection(db, "tasks"), (snapshot) => {
      setSyncStatus('synced');
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
      setTasks(data);
    }, handleFirestoreError);

    // Listener de Configurações
    const unsubConfig = onSnapshot(doc(db, "config", "system"), async (snapshot) => {
      if (snapshot.exists()) {
        setConfig(snapshot.data() as AppConfig);
      } else {
        try { await setDoc(doc(db, "config", "system"), INITIAL_CONFIG); } catch (e) {}
      }
    }, handleFirestoreError);

    return () => {
      unsubProspects();
      unsubOrders();
      unsubTasks();
      unsubConfig();
    };
  }, [user]);

  const handleLogout = async () => {
    try { await auth.signOut(); setCurrentView('login'); } catch (e) { console.error(e); }
  };

  const openTaskModalFromCard = (cardId: string) => { 
    setPreselectedCardId(cardId); 
    setTaskModalTrigger(true); 
    setCurrentView('tasks'); 
  };

  if (loading) {
    return (
      <div className="h-screen w-screen bg-brand-dark flex flex-col items-center justify-center gap-4 text-brand-orange">
        <Loader2 size={48} className="animate-spin" />
        <p className="font-black text-[10px] uppercase tracking-widest text-center tracking-tighter">Autenticando...</p>
      </div>
    );
  }

  if (dbError) {
    return (
      <div className="h-screen w-screen bg-brand-dark flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 bg-red-500/10 rounded-[32px] flex items-center justify-center text-red-500 mb-8 border border-red-500/20">
          <AlertTriangle size={48} />
        </div>
        <h2 className="text-3xl font-black text-white uppercase mb-4 tracking-tighter">Erro de Banco de Dados</h2>
        <p className="text-gray-400 max-w-md mb-10 leading-relaxed font-medium">{dbError}</p>
        <button onClick={() => window.location.reload()} className="bg-brand-orange text-black py-4 px-10 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center gap-2">
          <RefreshCw size={16} /> Recarregar Sistema
        </button>
      </div>
    );
  }

  if (currentView === 'login' && !user) {
    return <Login onLogin={() => setCurrentView('dashboard')} onTrack={() => setCurrentView('tracking')} />;
  }

  if (currentView === 'tracking') {
    return <PublicTracking onBack={() => setCurrentView('login')} config={config} orders={orders} />;
  }

  return (
    <div className="flex h-screen bg-brand-dark overflow-hidden font-sans">
      <div className={`${isSidebarOpen ? 'w-64' : 'w-20'} hidden md:block transition-all duration-300`}>
        <Sidebar activeView={currentView} setView={setCurrentView} isOpen={isSidebarOpen} toggleOpen={() => setIsSidebarOpen(!isSidebarOpen)} onLogout={handleLogout} />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b border-brand-border flex items-center justify-between px-6 bg-brand-card">
          <div className="flex items-center gap-4">
            <button className="md:hidden p-2 text-gray-400" onClick={() => setIsSidebarOpen(!isSidebarOpen)}><Menu size={24} /></button>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-black uppercase tracking-tighter">
                {currentView === 'prospecting' ? 'Prospecção' : currentView === 'orders' ? 'Faturamento' : currentView === 'tasks' ? 'Tarefas' : currentView === 'settings' ? 'Configurações' : 'Dashboard'}
              </h1>
              
              <div className="flex items-center gap-2 px-3 py-1 bg-brand-dark rounded-full border border-brand-border">
                {syncStatus === 'syncing' && (
                  <><Loader2 size={12} className="text-brand-orange animate-spin" /><span className="text-[8px] font-black text-brand-orange uppercase">Sincronizando...</span></>
                )}
                {syncStatus === 'synced' && (
                  <><CheckCircle2 size={12} className="text-green-500" /><span className="text-[8px] font-black text-green-500 uppercase">Sincronizado na Nuvem</span></>
                )}
                {syncStatus === 'offline' && (
                  <><CloudOff size={12} className="text-yellow-500" /><span className="text-[8px] font-black text-yellow-500 uppercase">Somente Local (Offline)</span></>
                )}
                {syncStatus === 'error' && (
                  <><AlertTriangle size={12} className="text-red-500" /><span className="text-[8px] font-black text-red-500 uppercase">Erro de Banco</span></>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setShowNotifications(!showNotifications)} className="p-2 text-gray-400 hover:text-white relative"><Bell size={20} />{notifications.length > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-brand-orange rounded-full"></span>}</button>
            <div className="h-8 w-px bg-brand-border mx-2"></div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black text-white hidden sm:block">{user?.email}</span>
              <div className="w-8 h-8 rounded-full bg-brand-orange flex items-center justify-center text-black font-black text-xs uppercase">{user?.email?.[0] || 'A'}</div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-brand-dark custom-scrollbar">
          {currentView === 'dashboard' && <Dashboard prospects={prospects} orders={orders} tasks={tasks} config={config} />}
          {currentView === 'prospecting' && <ProspectingKanban stages={config.prospectStages} prospects={prospects} setProspects={setProspects} tasks={tasks} setTasks={setTasks} onAddTask={openTaskModalFromCard} currentUser={user} />}
          {currentView === 'orders' && <OrdersKanban stages={config.orderStages} orders={orders} setOrders={setOrders} config={config} tasks={tasks} setTasks={setTasks} prospects={prospects} onAddTask={openTaskModalFromCard} currentUser={user} />}
          {currentView === 'tasks' && <TaskManager tasks={tasks} setTasks={setTasks} prospects={prospects} orders={orders} externalOpenModal={taskModalTrigger} onCloseExternalModal={() => setTaskModalTrigger(false)} preselectedCardId={preselectedCardId} />}
          {currentView === 'settings' && <ConfigPanel config={config} setConfig={setConfig} />}
        </main>
      </div>
    </div>
  );
};

export default App;
