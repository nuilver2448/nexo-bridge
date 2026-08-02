const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const express = require("express");
const app = express();
const port = process.env.PORT || 3000;

// Configuración desde variables de entorno (Render)
const apiId = parseInt(process.env.API_ID);
const apiHash = process.env.API_HASH;
const stringSession = new StringSession(process.env.SESSION_STRING || ""); 

app.get("/", (req, res) => {
    res.send("NexoBridge está funcionando 🚀");
});

// Ruta para obtener el video
// Uso: https://tu-app.onrender.com/stream/ID_DEL_CANAL/ID_DEL_MENSAJE
app.get("/stream/:channelId/:messageId", async (req, res) => {
    const client = new TelegramClient(stringSession, apiId, apiHash, {
        connectionRetries: 5,
    });

    try {
        await client.connect();
        const channelId = req.params.channelId;
        const messageId = parseInt(req.params.messageId);

        const messages = await client.getMessages(channelId, { ids: [messageId] });
        if (!messages || messages.length === 0) return res.status(404).send("Video no encontrado");

        const media = messages[0].media;
        
        // Configurar cabeceras para video
        res.setHeader('Content-Type', 'video/mp4');
        
        // Descargar y enviar el stream
        const buffer = await client.downloadMedia(media, {
            workers: 4,
        });
        
        res.send(buffer);
    } catch (e) {
        res.status(500).send(e.toString());
    } finally {
        await client.disconnect();
    }
});

app.listen(port, () => {
    console.log(`Servidor escuchando en puerto ${port}`);
});
