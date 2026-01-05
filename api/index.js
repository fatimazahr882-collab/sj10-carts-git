require('dotenv').config();
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const cartRoutes = require('../routes/cartRoutes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(compression());

app.use('/api/cart', cartRoutes);

app.get('/', (req, res) => {
    res.json({ status: "SJ10 Cart Service is Running 🛒" });
});

module.exports = app;
// --- ADD THIS CODE TO RUN LOCALLY ---
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`🛒 Cart Service running locally on http://localhost:${PORT}`);
  });
}