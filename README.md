# TP Cloud Computing & Serverless – Master 2

Travaux pratiques du module **Cloud computing et serverless** (Master 2). Chaque TP est rangé dans son propre dossier, autonome, avec son code, sa configuration et son README.

## Sommaire des TP

| TP | Dossier | Sujet | Technologies |
|---|---|---|---|
| TP1 | [`tp1_Azure_functions/`](tp1_Azure_functions/README.md) | Chaîne serverless **HTTP → Queue → Table** à base de triggers et de bindings | Azure Functions (Node.js, modèle v4), Azure Storage (Queue, Table), Azurite |

## Structure du dépôt

```
.
├── .gitignore               # Règles communes à tous les TP (node_modules, local.settings.json, Azurite…)
├── README.md                # Ce fichier
└── tp1_Azure_functions/     # TP1 – Azure Functions
    ├── src/functions/
    ├── host.json
    ├── package.json
    └── README.md            # Instructions détaillées du TP1
```

## Démarrage rapide

```powershell
git clone https://github.com/Cha673/TP_cloud_computing_server_less.git
cd TP_cloud_computing_server_less
```

Ensuite, se placer dans le dossier du TP voulu et suivre son README. Par exemple pour le TP1 :

```powershell
cd tp1_Azure_functions
npm install
Copy-Item local.settings.example.json local.settings.json
npm start
```

Les prérequis (Node.js, Azure Functions Core Tools, Azurite…) sont détaillés dans le README de chaque TP.

## Conventions

- Un dossier par TP, nommé `tpN_<sujet>`.
- Les fichiers contenant des secrets ou propres à la machine (`local.settings.json`, `.env`) ne sont **jamais** versionnés ; un modèle `*.example.*` est fourni à la place.
- Les dépendances (`node_modules/`) et les données des émulateurs locaux (`.azurite/`, `__azurite_db*__.json`…) sont ignorées par le `.gitignore` racine.
