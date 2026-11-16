# TP1 – Azure Functions (Node.js)

Application serverless Azure Functions en JavaScript (**modèle de programmation v4**, package `@azure/functions`), exécutée en local avec Azure Functions Core Tools et l'émulateur de stockage Azurite.

## Architecture

```
            POST /api/httpTrigger
 Client ─────────────────────────▶ ┌──────────────┐  output binding   ┌──────────────────┐
        ◀───────── 202 { id } ──── │ httpTrigger  │ ────────────────▶ │ Queue "messages" │
                                   └──────────────┘  (storageQueue)   └────────┬─────────┘
                                                                               │ trigger
                                                                               ▼
                                   ┌──────────────────┐  output binding  ┌──────────────┐
                                   │ Table "messages" │ ◀─────────────── │ queueTrigger │
                                   └──────────────────┘     (table)      └──────────────┘
```

Les deux fonctions ne se connaissent pas : leur seul lien est la queue `messages`. Tous les accès au stockage passent par des **bindings** déclarés dans le code, sans SDK de stockage.

| Fonction | Fichier | Trigger | Sortie |
|---|---|---|---|
| `httpTrigger` | `src/functions/httpTrigger.js` | HTTP `POST /api/httpTrigger` (anonymous) | Queue Storage `messages` |
| `queueTrigger` | `src/functions/queueTrigger.js` | Nouveau message dans la queue `messages` | Table Storage `messages` |

### Rôle de chaque fonction

- **`httpTrigger`** est la porte d'entrée. Elle reçoit un body JSON (ex. `{ "name": "Alice", "message": "Hello" }`) et renvoie **400** si le body est vide ou invalide. Sinon, elle ajoute un `id` (UUID) et un `timestamp` ISO, publie le message dans la queue `messages`, puis répond **202 Accepted** avec `{ "id": "<uuid>" }`.
- **`queueTrigger`** se déclenche automatiquement à chaque message de la queue `messages`. Elle écrit une entité dans la table `messages` avec `PartitionKey = "messages"`, `RowKey = id`, `name`, `message` et `timestamp`. En cas d'échec répété (5 tentatives), le message est déplacé dans la queue `messages-poison`.

## Structure du projet

Le projet Azure Functions est à la racine du dépôt : toutes les commandes ci-dessous sont à lancer **depuis la racine** (là où se trouve `host.json`).

```
TP_cloud_computing_server_less/
├── src/functions/
│   ├── httpTrigger.js           # HTTP → Queue
│   └── queueTrigger.js          # Queue → Table
├── .vscode/extensions.json      # Extension VS Code recommandée
├── .funcignore                  # Fichiers exclus lors d'un déploiement Azure
├── .gitignore
├── host.json                    # Configuration de l'hôte (extensionBundle [4.*, 5.0.0))
├── local.settings.example.json  # Modèle de configuration locale (à copier)
├── package.json
├── package-lock.json
└── README.md
```

Ne sont **pas** versionnés (voir `.gitignore`) : `local.settings.json`, `node_modules/` et les données locales d'Azurite (`.azurite/`, `__azurite_db_*__.json`, `__blobstorage__/`, `__queuestorage__/`…). Ils sont recréés à l'installation ou au lancement.

## Prérequis

| Outil | Version | Installation |
|---|---|---|
| [Node.js](https://nodejs.org/) | 20.x ou 22.x (requis par `@azure/functions` 4.x) | vérifier avec `node -v` |
| [Azure Functions Core Tools](https://learn.microsoft.com/azure/azure-functions/functions-run-local) | v4 | `npm install -g azure-functions-core-tools@4` (ou `winget install Microsoft.Azure.FunctionsCoreTools`), vérifier avec `func --version` |
| [Azurite](https://learn.microsoft.com/azure/storage/common/storage-use-azurite) | — | `npm install -g azurite`, ou extension VS Code « Azurite » |
| [Azure Storage Explorer](https://azure.microsoft.com/products/storage/storage-explorer/) | — | pour visualiser la queue et la table |

## Installation

```powershell
git clone https://github.com/Cha673/TP_cloud_computing_server_less.git
cd TP_cloud_computing_server_less
npm install
Copy-Item local.settings.example.json local.settings.json
```

`local.settings.json` contient alors :

```json
{
  "IsEncrypted": false,
  "Values": {
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "AzureWebJobsStorage": "UseDevelopmentStorage=true"
  }
}
```

`UseDevelopmentStorage=true` fait pointer les bindings vers Azurite.

## Lancement en local

1. **Démarrer Azurite** dans un premier terminal, depuis la racine du dépôt (il doit rester ouvert) :
   ```powershell
   azurite --silent --location .azurite
   ```
   Les données de l'émulateur sont alors stockées dans `.azurite/` (ignoré par git). Ou dans VS Code : `F1` → *Azurite: Start*.

2. **Démarrer les fonctions** dans un second terminal, depuis la racine du dépôt (là où se trouve `host.json`) :
   ```powershell
   npm start
   ```
   La console doit lister les deux fonctions :
   ```
   Functions:
           httpTrigger: [POST] http://localhost:7071/api/httpTrigger
           queueTrigger: queueTrigger
   ```

La queue `messages` et la table `messages` sont créées automatiquement par les bindings : aucune préparation n'est nécessaire.

## Tests

**Cas nominal** : on attend un 202 avec un id.

```powershell
Invoke-RestMethod -Method Post -Uri "http://localhost:7071/api/httpTrigger" `
  -ContentType "application/json" -Body '{ "name": "Alice", "message": "Hello" }'
```

```
id
--
c7bdb344-4dbe-4866-b7a6-e082f63961ae
```

**Cas d'erreur** : un body vide doit renvoyer un 400.

```powershell
try {
  Invoke-RestMethod -Method Post -Uri "http://localhost:7071/api/httpTrigger" -ContentType "application/json" -Body '{}'
} catch {
  $_.Exception.Response.StatusCode.value__   # 400
  $_.ErrorDetails.Message                    # {"error":"Le body JSON ne doit pas être vide."}
}
```

## Vérification de la chaîne HTTP → Queue → Table

**Dans les logs de `npm start`**, les deux fonctions s'exécutent l'une après l'autre avec le même id :

```
Executing 'Functions.httpTrigger' ...
Message <id> publié dans la queue "messages"
Executed 'Functions.httpTrigger' (Succeeded, ...)
Executing 'Functions.queueTrigger' (Reason='New queue message detected on 'messages'.', ...)
Message reçu depuis la queue : { ... id: '<id>' ... }
Entité écrite dans la table "messages" : { PartitionKey: 'messages', RowKey: '<id>', ... }
Executed 'Functions.queueTrigger' (Succeeded, ...)
```

**Dans Azure Storage Explorer**, sous *Emulator & Attached* → *Storage Accounts* → *(Emulator - Default Ports) (Key)* :

- **Queues → `messages`** : vide, car les messages ont été consommés par `queueTrigger`.
- **Tables → `messages`** : une ligne par message, avec `PartitionKey = messages` et `RowKey` égal à l'id renvoyé par le POST.
- **Queues → `messages-poison`** : ne doit pas exister. Si elle existe, un message a échoué 5 fois ; consulter les erreurs dans les logs.

## Validation

La chaîne complète a été testée en local (Windows 11, Node.js 22, Azure Functions Core Tools v4, Azurite). Un `POST` sur `/api/httpTrigger` renvoie bien un **202** avec l'id du message, et un body vide renvoie un **400**. Dans les logs, `httpTrigger` puis `queueTrigger` s'exécutent avec succès pour le même id. Dans Azure Storage Explorer, la queue `messages` est vidée et l'entité correspondante apparaît dans la table `messages`, avec ce même id comme `RowKey`. L'architecture HTTP → Queue → Table fonctionne donc de bout en bout, uniquement avec des triggers et des bindings.
