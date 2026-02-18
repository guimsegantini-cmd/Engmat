
import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBWZ_GStGCltn4UcSMHW9h5UfcXm3PZwYk",
  authDomain: "engmat-60511.firebaseapp.com",
  projectId: "engmat-60511",
  storageBucket: "engmat-60511.firebasestorage.app",
  messagingSenderId: "600837368161",
  appId: "1:600837368161:web:5bdc0815b328f8d5557d20",
  measurementId: "G-0DG05VQ18Y"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Exporta as instâncias dos serviços
export const db = getFirestore(app);
export const auth = getAuth(app);

// Ativa persistência offline para evitar perda de dados em refresh
if (typeof window !== "undefined") {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      // Provavelmente múltiplas abas abertas
      console.warn("Persistência do Firestore falhou: Múltiplas abas abertas.");
    } else if (err.code === 'unimplemented') {
      // Navegador não suporta
      console.warn("Persistência do Firestore não suportada neste navegador.");
    }
  });
}

// Helper para verificar se a configuração existe
export const isFirebaseConfigured = () => {
  return !!firebaseConfig.apiKey && firebaseConfig.apiKey !== "";
};
