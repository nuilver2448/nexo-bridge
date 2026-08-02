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
        connectionRetries: 5 
    });

    try {
        await client.connect();
        const { channelId, messageId } = req.params;

        const messages = await client.getMessages(channelId, { ids: [parseInt(messageId)] });
        if (!messages || messages.length === 0 || !messages[0].media) {
            return res.status(404).send("Video no encontrado");
        }

        const media = messages[0].media;
        const fileSize = media.document ? media.document.size : (media.video ? media.video.size : 0);

        res.writeHead(200, {
            'Content-Type': 'video/mp4',
            'Content-Length': fileSize,
            'Accept-Ranges': 'bytes',
        });

        // Usamos la descarga por bloques directamente a la respuesta (res)
        // Esto es lo que permite que el video cargue mientras se descarga
        const buffer = await client.downloadMedia(media, {
            workers: 1, // Bajamos a 1 para no saturar la CPU de Render
            outputChunkSize: 64 * 1024, // Bloques pequeños de 64KB para streaming fluido
        });

        res.end(buffer);

    } catch (e) {
        console.error(e);
        if (!res.headersSent) res.status(500).send("Error");
    } finally {
        // No desconectamos inmediatamente, esperamos un poco
        setTimeout(() => client.disconnect().catch(() => {}), 5000);
    }
});

app.listen(port, () => console.log("Bridge listo"));
