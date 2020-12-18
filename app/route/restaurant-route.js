const express = require('express');
const restaurantRouter = express.Router();
const AWS = require('aws-sdk');
const config = require('../../config/config.js');
var isDev = config.envConfig;

/* if (process.env.NODE_ENV.includes("production")) {
  isDev = false;
} */
if (process.env.NODE_ENV == "production") {
  isDev = false;
}
if (isDev) {
  console.log('isDev');
  AWS.config.update(config.aws_local_config);
} else {
  console.log('isProd');
  AWS.config.update(config.aws_remote_config);
}

//  restaurant Gets his orders
restaurantRouter.get('/order/:id', (req, res, next) => {
  
    const restaurantId = req.params.id;
    const docClient = new AWS.DynamoDB.DocumentClient();
    console.log(typeof(restaurantId))
    const params = {
      TableName: config.aws_table_name,
      /* KeyConditionExpression: 'paymentState = :v_payment AND etat = :v_etat', */
      IndexName: "etat-index",
      KeyConditionExpression: 'etat = :v_etat',
      FilterExpression: 'restoId = :v_resto',
      ExpressionAttributeValues: {
        ":v_etat": "waiting",
        ":v_resto": restaurantId
      }
    };
    docClient.query(params, function(err, data) {
      if (err) {
        res.send({
          success: false,
          message: 'Error: Server error',
          error: err
        });
      } else {
        const { Items } = data;
        res.send({
          success: true,
          message: 'Loaded orders',
          orders: Items
        });
      }
    });
  }); // end of router.get(/orders)  
module.exports = restaurantRouter;