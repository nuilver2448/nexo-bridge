const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const express = require("express");
const app = express();
const port = process.env.PORT || 3000;

const apiId = 38257954;
const apiHash = "8d3302fb6098ff93ecb22ef4679a24b6";
const stringSession = new StringSession(process.env.SESSION_STRING || ""); 

app.get("/", (req, res) => res.send("NexoBridge Online ✅"));

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
        const fileSize = media.document ? media.document.size : media.video.size;

        console.log(`Transmitiendo video de ${fileSize} bytes...`);

        res.writeHead(200, {
            'Content-Type': 'video/mp4',
            'Content-Length': fileSize,
            'Accept-Ranges': 'bytes',
        });

        // Usamos un generador para descargar el video por partes ínfimas
        // Esto evita que la RAM del servidor se llene
        const iter = client.iterDownload({
            file: media,
            requestSize: 1024 * 256, // Trozos pequeños de 256KB
        });

        for await (const chunk of iter) {
            res.write(chunk);
        }
        res.end();

    } catch (e) {
        console.error("Error en streaming:", e);
        if (!res.headersSent) res.status(500).send("Error: " + e.message);
    } finally {
        // No desconectamos inmediatamente para permitir que el buffer termine
        setTimeout(() => client.disconnect(), 5000);
    }
});

app.listen(port, () => console.log("Servidor optimizado para poca RAM listo"));
