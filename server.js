const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const express = require("express");
const app = express();
const port = process.env.PORT || 3000;

const apiId = 38257954;
const apiHash = "8d3302fb6098ff93ecb22ef4679a24b6";
const stringSession = new StringSession(process.env.SESSION_STRING || ""); 

app.get("/", (req, res) => res.send("Servidor NexoBridge en línea ✅"));

app.get("/stream/:channelId/:messageId", async (req, res) => {
    const client = new TelegramClient(stringSession, apiId, apiHash, { 
        connectionRetries: 5,
        autoReconnect: true
    });
    
    try {
        await client.connect();
        const { channelId, messageId } = req.params;
        
        const messages = await client.getMessages(channelId, { ids: [parseInt(messageId)] });
        if (!messages || messages.length === 0 || !messages[0].media) {
            return res.status(404).send("Video no encontrado");
        }

        const media = messages[0].media;
        // Detectar si es video o documento (película)
        const document = media.document || media.video;
        const fileSize = document.size;

        console.log(`Iniciando flujo de video: ${fileSize} bytes`);

        // Cabeceras cruciales para que el reproductor no se quede cargando
        res.writeHead(200, {
            'Content-Type': 'video/mp4',
            'Content-Length': fileSize,
            'Accept-Ranges': 'bytes',
            'Content-Disposition': 'inline',
            'Connection': 'keep-alive'
        });

        // La forma más rápida: Descarga directa al 'res' (respuesta del navegador)
        await client.downloadMedia(media, {
            workers: 8,
            outputChunkSize: 1024 * 256, // 256kb para fluidez
        }).then((buffer) => {
            res.end(buffer);
        });

    } catch (e) {
        console.error("Error:", e);
        if (!res.headersSent) res.status(500).send("Error de servidor");
    } finally {
        // Mantenemos la conexión un poco antes de cerrar
        setTimeout(() => client.disconnect(), 2000);
    }
});

app.listen(port, () => console.log("Servidor Nexo Bridge Listo"));
