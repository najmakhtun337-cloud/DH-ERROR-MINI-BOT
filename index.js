import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason
} from "@whiskeysockets/baileys";
import express from "express";
import fs from "fs";

const app = express();
app.use(express.json());
app.use(express.static("public"));

let sock;

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("session");

  sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    browser: ["DH ERROR", "Chrome", "1.0"]
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === "open") {
      console.log("✅ DH ERROR BOT CONNECTED");
    }

    if (connection === "close") {
      if (
        lastDisconnect?.error?.output?.statusCode !==
        DisconnectReason.loggedOut
      ) {
        startBot();
      }
    }
  });

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const m = messages[0];
    if (!m.message || m.key.fromMe) return;

    const text = m.message.conversation || "";
    const from = m.key.remoteJid;

    if (text === ".menu") {
      await sock.sendMessage(from, {
        text:
`🤖 *DH ERROR MINI BOT*

.commands:
.menu
.ping
.owner
.group
.channel
`
      });
    }

    if (text === ".ping") {
      await sock.sendMessage(from, { text: "🏓 Pong!" });
    }

    if (text === ".owner") {
      await sock.sendMessage(from, { text: "👑 Owner: DH ERROR" });
    }

    if (text === ".group") {
      await sock.sendMessage(from, {
        text: "🔗 Group:\nhttps://chat.whatsapp.com/Hw0JIQgGHco8BL6699CDN"
      });
    }

    if (text === ".channel") {
      await sock.sendMessage(from, {
        text: "📢 Channel:\nhttps://whatsapp.com/channel/0029VbBQQ6v4Y9lenR8ROD3O"
      });
    }
  });
}

app.post("/pair", async (req, res) => {
  try {
    const { number } = req.body;
    const code = await sock.requestPairingCode(number);
    res.json({ code });
  } catch (e) {
    res.json({ error: "Failed to generate code" });
  }
});

app.listen(3000, () => {
  console.log("🌐 Server running on port 3000");
  startBot();
});
