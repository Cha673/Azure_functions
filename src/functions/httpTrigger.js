const { app, output } = require('@azure/functions');
const crypto = require('crypto');

// Output binding : tout ce qui est écrit dedans est publié dans la queue "messages"
const queueOutput = output.storageQueue({
    queueName: 'messages',
    connection: 'AzureWebJobsStorage',
});

app.http('httpTrigger', {
    methods: ['POST'],
    authLevel: 'anonymous',
    extraOutputs: [queueOutput],
    handler: async (request, context) => {
        context.log(`Requête HTTP reçue : ${request.method} ${request.url}`);

        // Lecture du body JSON (un body absent ou mal formé lève une erreur)
        let body;
        try {
            body = await request.json();
        } catch {
            body = null;
        }

        // Validation minimale : le body doit être un objet non vide
        if (!body || typeof body !== 'object' || Object.keys(body).length === 0) {
            context.log('Body vide ou invalide, requête rejetée');
            return {
                status: 400,
                jsonBody: { error: 'Le body JSON ne doit pas être vide.' },
            };
        }

        // Construction du message à publier (id et timestamp placés après le body pour ne pas être écrasés)
        const message = {
            ...body,
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
        };

        // Envoi dans la queue via l'output binding (pas de SDK)
        context.extraOutputs.set(queueOutput, message);
        context.log(`Message ${message.id} publié dans la queue "messages"`);

        return {
            status: 202,
            jsonBody: { id: message.id },
        };
    },
});
