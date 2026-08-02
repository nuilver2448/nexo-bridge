const { TelegramClient, Api } = require("telegram");
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
    const client = new TelegramClient(stringSession, apiId, apiHash, { connectionRetries: 5 });
    try {
        await client.connect();
        let channelId = req.params.channelId;
        const messageId = parseInt(req.params.messageId);

        // Intentar obtener el video
        const messages = await client.getMessages(channelId, { ids: [messageId] });
        
        if (!messages || messages.length === 0 || 
