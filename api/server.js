const express = require('express');
const path = require('path');
const campanhasRoutes = require('./routes/campanhas');
const app = express();

app.use((req, res, next) => {
  
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS'){
    return res.sendStatus(200);
  }

  next();
});

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));
app.use('/', campanhasRoutes);
app.listen(3000, () => {
  console.log('Api OK, porta 3000!');
});