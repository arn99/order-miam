const express = require('express');
const { v4: uuidv4 } = require('uuid');
const bodyParser = require('body-parser');
const port = process.env.port || 4545;
const app = express();
const router = require('./app/route/route');

app.use(express.json());
app.use('/api', router);

  app.listen(port, () => {
    console.log(`Listening on port ${port}`);
})