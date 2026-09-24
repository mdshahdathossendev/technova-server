import express from "express";
import cors from "cors";
import dotenv from "dotenv";
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const uri = process.env.MONGODB_URI as string;
const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
const telegramGroupChatId = process.env.TELEGRAM_GROUP_CHAT_ID;
app.use(cors());
app.use(express.json());

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

function escapeTelegramHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

async function sendOrderNotification(order: unknown, orderId: unknown) {
  if (!telegramBotToken || !telegramGroupChatId) {
    console.warn("Telegram notification skipped: Telegram environment variables are not configured.");
    return;
  }

  const orderDetails = JSON.stringify(order, null, 2);
  const message = [
    "<b>নতুন অর্ডার কনফার্ম হয়েছে</b>",
    `<b>Order ID:</b> <code>${escapeTelegramHtml(String(orderId))}</code>`,
    `<pre>${escapeTelegramHtml(orderDetails).slice(0, 3800)}</pre>`,
  ].join("\n");

  try {
    const response = await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: telegramGroupChatId,
        text: message,
        parse_mode: "HTML",
      }),
    });

    if (!response.ok) {
      console.error("Telegram notification failed:", await response.text());
    }
  } catch (error) {
    console.error("Telegram notification error:", error);
  }
}

async function run() {
  try {
    // await client.connect();
    const db = client.db("technova");
    const productCollection = db.collection("allProdect");
    const orderPordect = db.collection('order');
    app.get("/", (req, res) => {
      res.send("TechNova Server is Running 🚀");
    });
    app.post('/order', async (req, res)=>{
      const order = req.body;
      const result = await orderPordect.insertOne(order);
      await sendOrderNotification(order, result.insertedId);
      res.status(201).send(result);
    });
    app.get('/order', async (req, res) => {
      const result = await orderPordect.find().toArray();
      res.send(result);
    });
    app.get("/product", async (req, res) => {
     const result = await productCollection.find().toArray();
     res.send(result)
    });
    app.post("/product", async (req, res) => {
    const product = req.body;
    const result = await productCollection.insertOne(product);
    res.send(result);
    });
    app.get("/product/:id", async (req, res) => {
  const { id } = req.params;

  const query = { _id: new ObjectId(id) };
  const result = await productCollection.findOne(query);

  res.send(result);
});
app.delete("/product/:id", async (req, res) => {
  const id = req.params.id;

  const query = {
    _id: new ObjectId(id),
  };

  const result = await productCollection.deleteOne(query);

  res.send(result);
});
   
  } finally {
    
  }
}
run()

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});