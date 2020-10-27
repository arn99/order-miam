const express = require('express');
const router = express.Router();
const AWS = require('aws-sdk');
const config = require('../../config/config.js');
var isDev = true;
if (process.env.NODE_ENV.includes("production")) {
  isDev = false;
}
// Get a single fruit by id
router.get('/post/:id', (req, res, next) => {
  console.log(process.env.NODE_ENV)
  console.log(isDev)
  if (isDev) {
   
    console.log('isDev');
    AWS.config.update(config.aws_local_config);
  } else {
    console.log('isProd');
    AWS.config.update(config.aws_remote_config);
  }
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
                message: 'Loaded posts',
                posts: Items
            });
        }
    });
});
// Gets all posts
router.get('/post', (req, res, next) => {
  if (isDev) {
    console.log('isDev');
    AWS.config.update(config.aws_local_config);
  } else {
    console.log('isProd');
    AWS.config.update(config.aws_remote_config);
  }
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
        message: 'Loaded posts',
        posts: Items
      });
    }
  });
}); // end of router.get(/posts)
// Add a fruit
router.post('/post', (req, res, next) => {
  if (isDev) {
    console.log('isDev');
    AWS.config.update(config.aws_local_config);
  } else {
    console.log('isProd');
    AWS.config.update(config.aws_remote_config);
  }
    const { title, comment } = req.body;
    // Not actually unique and can create problems.
    const id = uuidv4();
    const docClient = new AWS.DynamoDB.DocumentClient();
    const params = {
      TableName: config.aws_table_name,
      Item: {
        id: id,
        title: title,
        comment: comment
      }
    };
    docClient.put(params, function(err, data) {
      if (err) {
        res.send({
          success: false,
          message: 'Error: Server error'
        });
      } else {
        console.log('data', data);
        const { Items } = data;
        res.send({
          success: true,
          message: 'Added fruit',
          post: Items
        });
      }
    });
  });
  module.exports = router;