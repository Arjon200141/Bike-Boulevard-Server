const express = require('express');
const app = express();
// const jwt = require('jsonwebtoken');
const cors = require('cors');
const port = process.env.PORT || 5000;
require('dotenv').config();

app.use(cors());
app.use(express.json());


const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ej6qyrh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const bikeCollection = client.db('bike-boulevard').collection('bikes');
    const accessoriesCollection = client.db('bike-boulevard').collection('accessories');
    const reviewsCollection = client.db('bike-boulevard').collection('reviews');

    app.get('/bikes', async (req, res) => {
        try {
          const result = await bikeCollection.find().toArray();
          res.send(result);
        } catch (error) {
          res.status(500).send({ message: 'Internal Server Error' });
        }
      });
    app.get('/accessories', async (req, res) => {
        try {
          const result = await accessoriesCollection.find().toArray();
          res.send(result);
        } catch (error) {
          res.status(500).send({ message: 'Internal Server Error' });
        }
      });
    app.get('/reviews', async (req, res) => {
        try {
          const result = await reviewsCollection.find().toArray();
          res.send(result);
        } catch (error) {
          res.status(500).send({ message: 'Internal Server Error' });
        }
      });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Bike Boulevard is running');
  });
  
  app.listen(port, () => {
    console.log(`Bike Boulevard is running on port ${port}`);
  });