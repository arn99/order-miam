const express = require('express');
const router = express.Router();
const AWS = require('aws-sdk');
const axios = require('axios')
const config = require('../../config/config.js');
var isDev = config.envConfig;
var queueUrl = "https://sqs.us-east-1.amazonaws.com/073844720199/notify-order";

/* if (process.env.NODE_ENV.includes("production")) {
  isDev = false;
} */
AWS.config.update(config.aws_remote_config);
if (process.env.NODE_ENV == "production") {
  isDev = false;
}
if (isDev) {
  console.log('dev')
  AWS.config.update(config.aws_local_config);
} else {
  AWS.config.update(config.aws_remote_config);
  console.log('prod')
}
var sqs = new AWS.SQS({apiVersion: '2012-11-05'});





// Get a single fruit by id
router.get('/order/:id', (req, res, next) => {
  console.log(process.env.NODE_ENV)

    const id = req.params.id;
    const docClient = new AWS.DynamoDB.DocumentClient();
    const params = {
        TableName: config.aws_table_name,
        KeyConditionExpression: 'id = :i',
        ExpressionAttributeValues: {
            ':i': id
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
            console.log('data', data);
            const { Items } = data;
            res.send({
                success: true,
                message: 'Loaded orders',
                orders: Items
            });
        }
    });
});
// Gets all orders
router.get('/order', (req, res, next) => {
  
  const docClient = new AWS.DynamoDB.DocumentClient();
  const params = {
    TableName: config.aws_table_name
  };
  docClient.scan(params, function(err, data) {
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

// Add a fruit
router.post('/order', (req, res, next) => {
    const order = req.body;
    // Not actually unique and can create problems.
    //const id = uuidv4();
    const docClient = new AWS.DynamoDB.DocumentClient();
    if(order.paymentState == "initiated") {
      order.invoice = {"total_amount": order.total, "description": "Paiement de Miam"};
      order.store =  {"name": "E-restaurant Miam"};
      /**payment methode */
      
      payment(order).then(reponse => {
        if(reponse.data.response_code == "00") {
          order.paymentState = "accept";
          order.response_text = reponse.data.response_text;
        } else {
          /** payment not accept */
          console.log("yoo");
        }
        console.log(order);
      })
      .catch(error => {
        console.log(error)
        return res.send({
          success: false,
          reponse:error
        })
      });
    }
    const params = {
      TableName: config.aws_table_name,
      Item: order
    };
    docClient.put(params, function(err, data) {
      if (err) {
        res.send({
          success: false,
          message: 'Error: Server error'
        });
      } else {
        const { Items } = data;
        res.send({
          success: true,
          message: 'Added fruit',
          order: Items
        });
        console.log("test")
        console.log(params.Item)
        /**message par sqs */
        meessage = {
          body: 'Connectez vous pour voir votre nouvelle commande',
          token: params.Item.restaurant.token
        }
        sendSQS(message,res).then(message=> {
          console.log(message);
        }).catch(err=> {
          console.log(err);
        })
      }
    });

  });
  // UPDATE a fruit
router.put('/order/:id', (req, res, next) => {
    const state = req.body.etat;
    const key = req.params.id;

    // updating order from dynamodb
    const docClient = new AWS.DynamoDB.DocumentClient();
    const params = {
      TableName: config.aws_table_name,
      Key: {"id": key.toString()},
      UpdateExpression: "set etat = :s",
      ExpressionAttributeValues:{
        ":s":state.toString(),
      },
      
    ReturnValues:"UPDATED_NEW"
    };
    docClient.update(params, function(err, data) {
      if (err) {
        res.send({
          success: false,
          message: 'Error: Server error'
        });
        console.log(err)
      } else {
        console.log('data', data);
        const { Items } = data;
        res.send({
          success: true,
          message: 'UpdateItem succeeded',
          orders: Items
        });
      }
    });
  });

  // send sqs message
  async function sendSQS(message,res) {
    var params = {
      MessageBody: JSON.stringify(message),
      QueueUrl: queueUrl,
      DelaySeconds: 0
    };

    sqs.sendMessage(params, function(err, data) {
        if(err) {
            return err;
        }
        else {
          console.log(data);
           return data;
        }
    });
  }

  /** payment function */
  function payment (order){
    try {
      var data = {
            "invoice": {"total_amount": 5000, "description": "Chaussure VANS dernier modèle"},
            "store": {"name": "Magasin le Choco"}
      };
      var headerData = {"Content-Type": "application/json",
      "PAYDUNYA-PRIVATE-KEY": "test_private_jmJSvn0bBxs67nZmwAM3AoNWRnq",
      "PAYDUNYA-TOKEN": "yKodgSgl2PRy7Tx8EWts",
      "PAYDUNYA-MASTER-KEY": "ejvepUa0-XEWm-tomu-tyEE-4qGWgkf7x6pf"};
      //Map header = json.decode(headerData);
      return axios.post('https://app.paydunya.com/sandbox-api/v1/checkout-invoice/create', 
        data,
        {headers: headerData })
    } catch (error) {
      console.log(error);
      return null;
    }
  }
  module.exports = router;