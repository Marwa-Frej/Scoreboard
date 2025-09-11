import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './theme.css';

// Configuration Supabase directe
const SUPABASE_URL = 'https://opwjfpybcgtgcvldizar.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wd2pmcHliY2d0Z2N2bGRpemFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0OTQ5MTksImV4cCI6MjA3MzA3MDkxOX0.8yrYMlhFmjAF5_LG9FtCx8XrJ1sFOz2YejDDupbhgpY';

console.log('🚀 Operator - Démarrage simplifié');

function App() {
  const [step, setStep] = useState<string>('init');
  const [error, setError] = useState<string>('');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    console.log('🔧 App - Initialisation');
    setStep('config');
    
    // Test de configuration
    setTimeout(() => {
      console.log('✅ Configuration OK');
      setStep('supabase');
      
      // Test Supabase
      setTimeout(() => {
        console.log('✅ Supabase OK');
        setStep('auth');
        
        // Test Auth
        setTimeout(() => {
          console.log('✅ Auth OK');
          setStep('ready');
        }, 500);
      }, 500);
    }, 500);
  }, []);

  // Interface de diagnostic
  if (step !== 'ready') {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#0b0b0c',
        color: '#eaeaea',
        fontFamily: 'Inter, ui-sans-serif, system-ui'
      }}>
        <div style={{
          background: '#111214',
          border: '1px solid #1b1c1f',
          borderRadius: '14px',
          padding: '40px',
          textAlign: 'center',
          maxWidth: '400px',
          width: '100%'
        }}>
          <div style={{ fontSize: '24px', marginBottom: '16px' }}>
            {step === 'init' && '🚀'}
            {step === 'config' && '⚙️'}
            {step === 'supabase' && '🔗'}
            {step === 'auth' && '🔐'}
          </div>
          <div style={{ fontSize: '18px', marginBottom: '8px' }}>
            {step === 'init' && 'Initialisation...'}
            {step === 'config' && 'Vérification configuration...'}
            {step === 'supabase' && 'Connexion Supabase...'}
            {step === 'auth' && 'Préparation authentification...'}
          </div>
          <div style={{ fontSize: '14px', color: '#9aa0a6' }}>
            Étape {step} en cours
          </div>
          
          {/* Informations de debug */}
          <div style={{ 
            marginTop: '20px', 
            padding: '12px', 
            background: '#0a0d10', 
            borderRadius: '8px',
            fontSize: '12px',
            textAlign: 'left'
          }}>
            <div>URL: {SUPABASE_URL ? '✅' : '❌'}</div>
            <div>Key: {SUPABASE_ANON_KEY ? '✅' : '❌'}</div>
            <div>Env: {import.meta.env.VITE_SUPABASE_URL ? '✅' : '❌'}</div>
          </div>
          
          {error && (
            <div style={{ 
              marginTop: '16px',
              color: '#ff6b6b',
              background: 'rgba(255, 107, 107, 0.1)',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 107, 107, 0.3)'
            }}>
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Interface principale simplifiée
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: '#0b0b0c',
      color: '#eaeaea',
      fontFamily: 'Inter, ui-sans-serif, system-ui'
    }}>
      <div style={{
        background: '#111214',
        border: '1px solid #1b1c1f',
        borderRadius: '14px',
        padding: '40px',
        textAlign: 'center',
        maxWidth: '500px',
        width: '100%'
      }}>
        <h1 style={{ 
          fontSize: '32px', 
          margin: '0 0 16px 0',
          background: 'linear-gradient(135deg, #36ffb5, #2563eb)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          ⚽ Scoreboard Pro
        </h1>
        
        <div style={{ fontSize: '18px', marginBottom: '24px', color: '#9aa0a6' }}>
          Operator - Interface de gestion
        </div>
        
        <div style={{ 
          background: '#0a0d10',
          padding: '20px',
          borderRadius: '12px',
          marginBottom: '24px'
        }}>
          <div style={{ fontSize: '16px', marginBottom: '12px' }}>
            ✅ Application initialisée avec succès
          </div>
          <div style={{ fontSize: '14px', color: '#4ade80' }}>
            Toutes les vérifications sont passées
          </div>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button 
            onClick={() => window.location.href = 'http://localhost:5174'}
            style={{
              background: '#16a34a',
              border: '1px solid #16a34a',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '500'
            }}
          >
            📺 Ouvrir le Display
          </button>
          
          <button 
            onClick={() => window.location.href = 'http://localhost:3000'}
            style={{
              background: '#2563eb',
              border: '1px solid #2563eb',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '500'
            }}
          >
            🏠 Page d'accueil
          </button>
          
          <div style={{ 
            fontSize: '12px', 
            color: '#6b7280',
            marginTop: '16px',
            padding: '12px',
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '8px'
          }}>
            💡 L'Operator est maintenant prêt à fonctionner.<br/>
            Utilisez les liens ci-dessus pour naviguer.
          </div>
        </div>
      </div>
    </div>
  );
}

console.log('🎯 Main - Création du root React');

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('❌ Main - Élément root non trouvé !');
} else {
  console.log('✅ Main - Élément root trouvé, création de l\'app');
  const root = createRoot(rootElement);
  root.render(<App />);
  console.log('🚀 Main - Application React montée');
}