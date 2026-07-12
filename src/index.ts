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
async function run() {
  try {
    await client.connect();
    const db = client.db("technova");
    const productCollection = db.collection("allProdect");
    app.get("/", (req, res) => {
      res.send("TechNova Server is Running 🚀");
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
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    
  }
}
run()

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});