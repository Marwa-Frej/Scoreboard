# 🚀 Scoreboard Pro - Guide de Démarrage

## 📋 Prérequis

- Node.js 18+ 
- pnpm (recommandé) ou npm

## 🛠️ Installation

```bash
# Cloner le projet
git clone <votre-repo>
cd Scoreboard

# Installer les dépendances
pnpm install
# ou
npm install
```

## 🎮 Lancement de l'Application

### Option 1 : Toutes les applications (recommandé)
```bash
pnpm run dev:all
# ou
npm run dev:all
```

### Option 2 : Applications individuelles
```bash
# Console Operator (port 5173)
pnpm run dev:operator

# Affichage Display (port 5174) 
pnpm run dev:display

# Page d'accueil (port 3000)
pnpm run dev
```

## 🌐 URLs d'Accès

- **🎮 Console Operator :** http://localhost:5173
- **📺 Affichage Display :** http://localhost:5174

## 🔧 Construction pour Production

```bash
# Construire toutes les applications
pnpm run build:all
# ou
npm run build:all
```

## 🚀 Déploiement

Voir le fichier `scoreboard-deploy/README-DEPLOYMENT.md` pour les instructions de déploiement.

## 🆘 Dépannage

Si vous rencontrez des erreurs de dépendances :

```bash
# Nettoyer et réinstaller
rm -rf node_modules
rm pnpm-lock.yaml
pnpm install
```

## 📱 Utilisation

1. **Lancez** `pnpm run dev:all`
2. **Ouvrez** http://localhost:5173 pour la console operator
3. **Ouvrez** http://localhost:5174 pour l'affichage public
4. **Créez un match** dans l'operator
5. **Démarrez le match** - l'affichage se synchronise automatiquement
