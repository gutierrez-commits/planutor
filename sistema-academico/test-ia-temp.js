require('dotenv').config({ path: __dirname + '/.env' });
const express = require('express');
const app = express();
app.use(express.json());
app.use('/ia', require('./routes/iaRoutes'));
app.listen(3999, () => console.log('test en 3999'));
