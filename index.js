const express = require('express');
const app = express();
// const jwt = require('jsonwebtoken');
const cors = require('cors');
const port = process.env.PORT || 5000;
require('dotenv').config();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Bike Boulevard is running');
  });
  
  app.listen(port, () => {
    console.log(`Bike Boulevard is running on port ${port}`);
  });