const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');
const cors = require('cors');
const port = process.env.PORT || 5000;
require('dotenv').config();

app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ej6qyrh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect to MongoDB once on startup
    await client.connect();
    console.log("Connected to MongoDB!");

    const bikeCollection = client.db('bike-boulevard').collection('bikes');
    const accessoriesCollection = client.db('bike-boulevard').collection('accessories');
    const reviewsCollection = client.db('bike-boulevard').collection('reviews');
    const userCollection = client.db('bike-boulevard').collection('users');
    const cartCollection = client.db('bike-boulevard').collection('carts');

    app.post('/carts', async (req, res) => {
      try {
        const cartItem = req.body;
        const result = await cartCollection.insertOne(cartItem);
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: 'Internal Server Error' });
      }
    });

    app.delete('/carts/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await cartCollection.deleteOne(query);
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: 'Internal Server Error' });
      }
    });

    app.get('/carts', async (req, res) => {
      try {
        const email = req.query.email;
        const query = { email: email };
        const result = await cartCollection.find(query).toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: 'Internal Server Error' });
      }
    });

    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      try {
        const query = { email: email };
        const user = await userCollection.findOne(query);
        if (user?.role !== 'admin') {
          return res.status(403).send({ message: 'Forbidden access' });
        }
        next();
      } catch (error) {
        console.error("Error verifying admin:", error);
        res.status(500).send({ message: 'Internal Server Error' });
      }
    };



    app.post('/jwt', async (req, res) => {
      const user = req.body;
      try {
        if (!process.env.ACCESS_TOKEN_SECRET) {
          throw new Error('ACCESS_TOKEN_SECRET not defined');
        }
        const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
        res.send({ token });
      } catch (error) {
        console.error("JWT creation error:", error);
        res.status(500).send({ message: 'Failed to create JWT' });
      }
    });


    const verifyToken = (req, res, next) => {
      const authorizationHeader = req.headers.authorization;
      if (!authorizationHeader) {
        return res.status(401).send({ message: 'Unauthorized access: No token provided' });
      }
      const token = authorizationHeader.split(' ')[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          console.error("Token verification error:", err);
          return res.status(401).send({ message: 'Unauthorized access: Invalid token' });
        }
        req.decoded = decoded;
        next();
      });
    };

    app.get('/users', verifyToken, verifyAdmin, async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });

    app.get('/users/admin/:email', verifyToken, async (req, res) => {
      const email = req.params.email;
      if (email !== req.decoded.email) {
        return res.status(403).send({ message: 'Forbidden access' });
      }
      const query = { email: email };
      const user = await userCollection.findOne(query);
      res.send({ admin: user?.role === 'admin' });
    });

    app.post('/users', async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: 'User already exists', insertedId: null });
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    app.get('/bikes', async (req, res) => {
      try {
        const result = await bikeCollection.find().toArray();
        res.send(result);
      } catch (error) {
        console.error("Bikes retrieval error:", error);
        res.status(500).send({ message: 'Internal Server Error' });
      }
    });

    const { ObjectId } = require('mongodb');

    app.get('/bikes/:id', async (req, res) => {
      const id = req.params.id;

      // Validate if the id is a valid ObjectId
      if (!ObjectId.isValid(id)) {
        return res.status(400).send('Invalid bike ID');
      }

      try {
        const query = { _id: new ObjectId(id) };
        const bike = await bikeCollection.findOne(query);

        if (!bike) {
          return res.status(404).send('Bike not found');
        }

        res.send(bike);
      } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Internal Server Error");
      }
    });


    app.get('/accessories', async (req, res) => {
      try {
        const result = await accessoriesCollection.find().toArray();
        res.send(result);
      } catch (error) {
        console.error("Accessories retrieval error:", error);
        res.status(500).send({ message: 'Internal Server Error' });
      }
    });

    app.get('/reviews', async (req, res) => {
      try {
        const result = await reviewsCollection.find().toArray();
        res.send(result);
      } catch (error) {
        console.error("Reviews retrieval error:", error);
        res.status(500).send({ message: 'Internal Server Error' });
      }
    });

    // No need to ping every request, only once after connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
  }
}

// Run the server
run().catch(console.dir);

// Handle shutdown gracefully
process.on('SIGINT', async () => {
  await client.close();
  console.log("MongoDB client disconnected");
  process.exit(0);
});

app.get('/', (req, res) => {
  res.send('Bike Boulevard is running');
});

app.listen(port, () => {
  console.log(`Bike Boulevard is running on port ${port}`);
});
