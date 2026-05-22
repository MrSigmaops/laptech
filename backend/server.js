const path = require('path');
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const routes = require('./routes');

const app = express();
app.use(cors());
app.use(express.json());

connectDB();

app.use('/api', routes);

// Phục vụ file tĩnh frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Nếu không có route nào xử lý, trả về index.html
app.use((req, res) => {
  res.sendFile(path.resolve(__dirname, '../frontend', 'index.html'));
});

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || 'localhost';
app.listen(PORT, () => console.log(`🚀 Server đang mở tại http://${HOST}:${PORT}`));