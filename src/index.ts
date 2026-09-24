import express from "express";
import cors from "cors";
import dotenv from "dotenv";
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const uri = process.env.MONGODB_URI as string;
app.use(cors());
app.use(express.json());

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const sendDiscordMessage = async (message: string) => {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

  if (!webhookUrl) {
    throw new Error("DISCORD_WEBHOOK_URL is not configured");
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: message }),
  });

  if (!response.ok) {
    throw new Error(`Discord webhook failed with status ${response.status}`);
  }
};

async function run() {
  try {
    // await client.connect();
    const db = client.db("technova");
    const productCollection = db.collection("allProdect");
    const orderPordect = db.collection('order');
    app.get("/", (req, res) => {
      res.send("TechNova Server is Running 🚀");
    });
    app.post("/sendDiscordMessage", async (req, res) => {
      const { message } = req.body;

      if (typeof message !== "string" || !message.trim()) {
        res.status(400).json({ error: "message is required" });
        return;
      }

      try {
        await sendDiscordMessage(message);
        res.status(204).send();
      } catch (error) {
        console.error("Discord message error:", error);
        res.status(502).json({ error: "Failed to send Discord message" });
      }
    });
    app.post('/order', async (req, res)=>{
      const order = req.body;
      const result = await orderPordect.insertOne(order);

      const orderMessage = [
        "New order received",
        `Order ID: ${result.insertedId}`,
        JSON.stringify(order, null, 2),
      ].join("\n").slice(0, 2000);

      try {
        await sendDiscordMessage(orderMessage);
      } catch (error) {
        console.error("Order Discord notification error:", error);
      }

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