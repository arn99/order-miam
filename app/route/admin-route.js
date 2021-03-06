const express = require('express');
const adminRouter = express.Router();
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

//  admin Gets orders
adminRouter.get('/order', (req, res, next) => {
  
    const docClient = new AWS.DynamoDB.DocumentClient();
    const params = {
      TableName: config.aws_table_name,
      KeyConditionExpression: 'etat = :v_etat',
      /* FilterExpression: 'paymentState = :v_payment', */
      IndexName: "etat-index",
      /* KeyConditionExpression: 'etat = :v_etat', */
      ExpressionAttributeValues: {
        ":v_etat": "waiting",
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
module.exports = adminRouter;