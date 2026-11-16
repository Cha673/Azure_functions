const { app, output } = require('@azure/functions');

// Output binding : chaque entité écrite dedans est insérée dans la table "messages"
const tableOutput = output.table({
    tableName: 'messages',
    connection: 'AzureWebJobsStorage',
});

app.storageQueue('queueTrigger', {
    queueName: 'messages',
    connection: 'AzureWebJobsStorage',
    extraOutputs: [tableOutput],
    handler: async (queueItem, context) => {
        context.log('Message reçu depuis la queue :', queueItem);

        // Construction de l'entité Table Storage
        const entity = {
            PartitionKey: 'messages',
            RowKey: queueItem.id,
            name: queueItem.name,
            message: queueItem.message,
            timestamp: queueItem.timestamp,
        };

        // Écriture dans la table via l'output binding (pas de SDK)
        context.extraOutputs.set(tableOutput, entity);
        context.log('Entité écrite dans la table "messages" :', entity);
    },
});
