const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');

const client = new Client({
    authStrategy: new LocalAuth()
});

let warnedUsers = {};

const badWords = ['idiot', 'hurensohn', 'fuck', 'bastard'];
const groupLinkRegex = /chat\.whatsapp\.com\/[A-Za-z0-9]+/;

client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('✅ Freddy ist aktiv!');
});

client.on('message_create', async msg => {
    if (!msg.fromMe && msg.type === 'chat') {
        const chat = await msg.getChat();
        if (!chat.isGroup) return;

        const user = msg.author || msg.from;
        const content = msg.body.toLowerCase();
        const mentions = [await msg.getContact()];

        // Fremde WhatsApp-Gruppenlinks
        if (/chat\.whatsapp\.com\/[A-Za-z0-9]+/.test(content)) {
            await msg.delete(true);
            await chat.removeParticipants([user]);
            await chat.sendMessage(`🚫 @${user.split('@')[0]} wurde wegen Fremdwerbung entfernt.`, { mentions });
            return;

            client.initialize();
        }

        // Doppelte Nachricht
        const messages = await chat.fetchMessages({ limit: 5 });
        const same = messages.filter(m => m.body === msg.body && m.from === msg.from);
        if (same.length > 1) {
            if (!warnedUsers[user]) {
                warnedUsers[user] = true;
                await chat.sendMessage(`⚠️ @${user.split('@')[0]}, bitte keine doppelten Nachrichten.`, { mentions });
            } else {
                await msg.delete(true);
                await chat.removeParticipants([user]);
                await chat.sendMessage(`🚫 @${user.split('@')[0]} wurde wegen Spam entfernt.`, { mentions });
            }
            return;
        }

        // Beleidigungen
        const badWords = ['idiot', 'hurensohn', 'fuck', 'bastard'];
        if (badWords.some(w => content.includes(w))) {
            await msg.delete(true);
            await chat.removeParticipants([user]);
            await chat.sendMessage(`🚫 @${user.split('@')[0]} wurde wegen Beleidigung entfernt.`, { mentions });
        }
    }
});

client.initialize();
