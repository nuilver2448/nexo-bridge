const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const express = require("express");
const app = express();
const port = process.env.PORT || 3000;

const apiId = 38257954;
const apiHash = "8d3302fb6098ff93ecb22ef4679a24b6";
const stringSession = new StringSession(process.env.SESSION_STRING || ""); 

app.get("/", (req, res) => {
    res.send("Servidor NexoBridge Activo ✅");
});

app.get("/stream/:channelId/:messageId", async (req, res) => {
    const client = new TelegramClient(stringSession, apiId, apiHash, { 
        connectionRetries: 5 
    });

    try {
        await client.connect();
        const channelId = req.params.channelId;
        const messageId = parseInt(req.params.messageId);

        console.log(`Buscando Canal: ${channelId}, Mensaje: ${messageId}`);

        const messages = await client.getMessages(channelId, { ids: [messageId] });
        
        if (!messages || messages.length === 0 || !messages[0].media) {
            return res.status(404).send("Video no encontrado. Verifica IDs.");
        }

        const media = messages[0].media;
        
        // Cabeceras de video
        res.setHeader('Content-Type', 'video/mp4');
        
        // Descarga el video en partes y lo envía al navegador
        const buffer = await client.downloadMedia(media, {
            workers: 4
        });
        
        res.send(buffer);

    } catch (e) {
        console.error("Error en el servidor:", e);
        res.status(500).send("Error: " + e.message);
    } finally {
        await client.disconnect();
    }
});

app.listen(port, () => console.log(`Servidor Nexo iniciado en puerto ${port}`));
