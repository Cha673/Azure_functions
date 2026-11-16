# TP1 – Azure Functions (Node.js)

Projet Azure Functions en JavaScript utilisant le **modèle de programmation v4** (`@azure/functions`).

## Structure du projet

```
.
├── src/
│   └── functions/            # Une fonction par fichier .js (chargés via "main" dans package.json)
├── .vscode/extensions.json   # Extensions VS Code recommandées
├── .funcignore               # Fichiers exclus lors du déploiement sur Azure
├── host.json                 # Configuration globale de l'hôte Functions
├── local.settings.example.json  # Modèle de configuration locale (à copier)
├── package.json
└── package-lock.json
```

> `local.settings.json` et `node_modules/` ne sont **pas** versionnés : ils sont recréés à l'installation.

## Prérequis

| Outil | Version | Installation |
|---|---|---|
| [Node.js](https://nodejs.org/) | 18.x, 20.x ou 22.x (LTS) | `node -v` pour vérifier |
| [Azure Functions Core Tools](https://learn.microsoft.com/azure/azure-functions/functions-run-local) | v4 | `npm install -g azure-functions-core-tools@4 --unsafe-perm true` (ou `winget install Microsoft.Azure.FunctionsCoreTools`) |
| [Azurite](https://learn.microsoft.com/azure/storage/common/storage-use-azurite) *(émulateur de stockage)* | — | `npm install -g azurite` ou extension VS Code « Azurite » |
| [Azure CLI](https://learn.microsoft.com/cli/azure/install-azure-cli) *(déploiement uniquement)* | — | `winget install Microsoft.AzureCLI` |

Optionnel : VS Code avec l'extension **Azure Functions** (`ms-azuretools.vscode-azurefunctions`), proposée automatiquement à l'ouverture du projet.

## Installation

```bash
# 1. Cloner le dépôt
git clone https://github.com/Cha673/Azure_functions.git
cd Azure_functions

# 2. Installer les dépendances
npm install

# 3. Créer la configuration locale à partir du modèle
cp local.settings.example.json local.settings.json        # bash
# Copy-Item local.settings.example.json local.settings.json # PowerShell
```

## Lancer le projet en local

1. Démarrer l'émulateur de stockage (nécessaire car `AzureWebJobsStorage=UseDevelopmentStorage=true`) :
   ```bash
   azurite --silent --location .azurite
   ```
   (ou via VS Code : `F1` → *Azurite: Start*)

2. Dans un autre terminal, démarrer les fonctions :
   ```bash
   npm start
   ```
   Les endpoints HTTP sont listés dans la console, par défaut sur `http://localhost:7071/api/<nom-fonction>`.

## Ajouter une fonction

```bash
func new --template "HTTP trigger" --name MaFonction
```

Le fichier est créé dans `src/functions/MaFonction.js`.

## Déploiement sur Azure

```bash
az login
func azure functionapp publish <NOM_DE_LA_FUNCTION_APP>
```

Les variables définies dans `local.settings.json` ne sont **pas** envoyées : elles doivent être configurées dans les *Paramètres d'application* de la Function App sur le portail Azure (ou via `az functionapp config appsettings set`).
