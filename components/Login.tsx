
import React, { useState } from 'react';
import { Home, Lock, Mail, Truck, UserPlus, LogIn, Loader2, AlertCircle } from 'lucide-react';
import { auth, db, isFirebaseConfigured } from '../firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

interface LoginProps {
  onLogin: () => void;
  onTrack: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onTrack }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!isFirebaseConfigured()) {
      setError('Firebase não configurado. Insira suas chaves no arquivo firebase.ts para continuar.');
      return;
    }

    setLoading(true);
    try {
      if (isRegistering) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, "users", userCredential.user.uid), {
          email: userCredential.user.email,
          createdAt: new Date().toISOString(),
          role: 'representative'
        });
        alert('Conta criada com sucesso! Redirecionando...');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onLogin();
    } catch (err: any) {
      console.error(err);
      let errorMessage = 'Ocorreu um erro na autenticação.';
      if (err.code === 'auth/email-already-in-use') errorMessage = 'Este e-mail já está em uso.';
      if (err.code === 'auth/weak-password') errorMessage = 'A senha deve ter pelo menos 6 caracteres.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') errorMessage = 'E-mail ou senha incorretos.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-brand-dark overflow-hidden">
      <div className="hidden lg:flex flex-col justify-center p-16 relative bg-[#0a0a0a] overflow-hidden border-r border-brand-border">
        <div className="absolute top-0 right-0 w-full h-full opacity-5 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-brand-orange/20 rounded-full blur-[150px]"></div>
          <Home size={600} fill="currentColor" className="text-brand-orange/10 absolute -bottom-40 -right-40" />
        </div>
        <div className="relative z-10 space-y-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-brand-orange rounded-3xl flex items-center justify-center text-black shadow-2xl shadow-brand-orange/40 border-4 border-brand-dark transform -rotate-3 transition-transform duration-500">
              <Home size={36} fill="currentColor" />
            </div>
            <span className="font-black text-5xl tracking-tighter text-white uppercase">ENG<span className="text-brand-orange">MAT</span></span>
          </div>
          <div className="space-y-6 max-w-xl">
            <h1 className="text-6xl font-black leading-none text-white tracking-tighter">
              TECNOLOGIA PARA A <br/>
              <span className="text-brand-orange">CONSTRUÇÃO CIVIL.</span>
            </h1>
            <p className="text-gray-400 text-xl leading-relaxed font-medium">
              Simplificamos a jornada entre a indústria e a obra. Gestão total de prospecção e faturamento estratégico.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col justify-center items-center p-6 md:p-16 relative overflow-y-auto">
        <div className="w-full max-w-md space-y-6 py-12">
          <button 
            onClick={onTrack}
            className="w-full group bg-brand-card p-5 rounded-2xl border border-brand-border hover:border-brand-orange transition-all flex items-center justify-between shadow-2xl"
          >
            <div className="flex items-center gap-4">
              <Truck className="text-brand-orange" size={24} />
              <span className="font-black text-xs text-white uppercase tracking-widest">Rastrear Meu Pedido</span>
            </div>
          </button>

          <div className="bg-brand-card p-10 rounded-[40px] border border-brand-border shadow-2xl relative">
            <div className="mb-10 text-center">
              <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-tight">
                {isRegistering ? 'Nova Conta' : 'Portal Master'}
              </h2>
              <p className="text-xs text-gray-500 font-black uppercase tracking-[0.2em]">Acesso do Representante</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-[11px] rounded-2xl font-bold flex items-center gap-3 animate-in fade-in">
                <AlertCircle size={18} />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase ml-2 tracking-widest">E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600" size={20} />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="exemplo@engmat.com.br"
                    className="w-full bg-brand-dark border border-brand-border rounded-2xl py-5 pl-14 pr-6 text-white focus:border-brand-orange outline-none transition-all font-bold"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase ml-2 tracking-widest">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600" size={20} />
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full bg-brand-dark border border-brand-border rounded-2xl py-5 pl-14 pr-6 text-white focus:border-brand-orange outline-none transition-all font-bold"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-brand-orange text-black py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-orange-600 transition-all shadow-xl shadow-brand-orange/20 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : isRegistering ? <UserPlus size={20} /> : <LogIn size={20} />}
                {loading ? 'Processando...' : isRegistering ? 'Criar minha conta' : 'Acessar CRM'}
              </button>

              <div className="text-center pt-4">
                <button 
                  type="button" 
                  onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
                  className="text-[11px] font-black text-gray-600 hover:text-brand-orange transition-colors uppercase tracking-[0.1em]"
                >
                  {isRegistering ? '← Já possuo uma conta registrada' : 'Solicitar acesso / Novo cadastro →'}
                </button>
              </div>
            </form>
          </div>
          
          <p className="text-center text-[10px] text-gray-700 font-bold uppercase tracking-widest">
            ENGMAT Master Core v2.5
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
