# ⚙️ Configuration - Scoreboard Pro

## 🔧 Configuration Supabase

L'application utilise Supabase pour la synchronisation temps réel. Les clés sont déjà configurées par défaut dans le code.

### 📋 Variables d'environnement (optionnelles)

Si vous voulez utiliser vos propres clés Supabase, créez un fichier `.env` à la racine du projet :

```bash
# .env
VITE_SUPABASE_URL=votre_url_supabase
VITE_SUPABASE_ANON_KEY=votre_cle_anonyme
```

### ✅ Configuration par défaut

L'application fonctionne **sans configuration** avec les clés par défaut intégrées :
- **URL :** `https://opwjfpybcgtgcvldizar.supabase.co`
- **Clé anonyme :** Configurée dans le code

### 🚀 Démarrage rapide

```bash
# Cloner le projet
git clone <votre-repo>
cd Scoreboard

# Installer les dépendances
pnpm install

# Lancer toutes les applications
pnpm run dev:all
```

### 🌐 URLs d'accès

- **🎮 Console Operator :** http://localhost:5173
- **📺 Affichage Display :** http://localhost:5174

### 🔄 Synchronisation

La synchronisation entre l'Operator et le Display se fait automatiquement via Supabase Realtime. Aucune configuration supplémentaire n'est nécessaire.

### 🛠️ Dépannage

Si vous voyez "Configuration Supabase manquante" :
1. Vérifiez que vous utilisez `pnpm run dev:all`
2. Redémarrez l'application
3. Vérifiez la console du navigateur pour plus de détails
