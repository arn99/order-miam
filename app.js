const express = require('express');
const { v4: uuidv4 } = require('uuid');
const bodyParser = require('body-parser');
const port = process.env.port || 4545;
const app = express();
const router = require('./app/route/route');
const adminRouter = require('./app/route/admin-route');
const deliveryRouter = require('./app/route/delivery-route');
const restaurantRouter = require('./app/route/restaurant-route');

app.use(express.json());
app.use('/api', router);
app.use('/api/admin', adminRouter);
app.use('/api/resto', restaurantRouter);
app.use('/api/delivery', deliveryRouter);

  app.listen(port, () => {
    console.log(`Listening on port ${port}`);
})