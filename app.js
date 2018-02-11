var express = require('express')
var bodyParser = require('body-parser')
const mongodb = require('mongodb');
const nconf = require('nconf');
const http = require('http');

var app = express();
app.use(bodyParser.json());
nconf.argv().env().file('keys.json');

const user = nconf.get('mongoUser');
const pass = nconf.get('mongoPass');
const host = nconf.get('mongoHost');
const port = nconf.get('mongoPort');
const dbName = nconf.get('mongoDatabase');
const serverHost = "maker-lab-lamba.herokuapp.com";

let userSchema = {
    "_id": "",
    "first_name": "",
    "last_name": "",
    "password": "",
    "role": {
        "customer": false
    },
    "cart": [],
    "buy_history_product": [],
    "buckets_created": {},
    "address": {},
    "products_id_search_history": []
};

let uri = `mongodb://${user}:${pass}@${host}:${port}`;
if (nconf.get('mongoDatabase')) {
  uri = `${uri}/${nconf.get('mongoDatabase')}`;
}
console.log("mongo url", uri);

// This responds with "Hello" on the homepage
app.get('/', function (req, res) {
   console.log("Got a GET request for the homepage");
   res.end('Hello from Home Page');
});
// This responds a GET request for the /list_products page.
// app.get('/list_products', function (req, res) {
//    console.log("Got a GET request for the /list_products");
//    mongodb.MongoClient.connect(uri, (err, mongoclient) => {
//      if (err) {
//        throw err;
//      }
//      var db = mongoclient.db(dbName);
//      let products = [];
//      db.collection('products').find().toArray(function(err, items) {
//         products = [...items]
//         console.log("products from /productsList",products)
//         mongoclient.close();
//         res.json(products);
//         res.end();
//      });
//     });
// })
//
// // This responds a GET request for the /list_user page.
// app.get('/list_users', function (req, res) {
//    console.log("Got a GET request for the /list_users");
//    mongodb.MongoClient.connect(uri, (err, mongoclient) => {
//      if (err) {
//        throw err;
//      }
//      var db = mongoclient.db(dbName);
//      let users = [];
//      db.collection('users').find().toArray(function(err, items) {
//         users = [...items]
//         console.log("users from /list_user",users)
//         mongoclient.close();
//         res.json(users);
//         res.end();
//      });
//     });
// })
//
// app.get('/create_user', function (req, res) {
//    console.log("Got a GET request for the /create_user");
//    mongodb.MongoClient.connect(uri, (err, mongoclient) => {
//      if (err) {
//        throw err;
//      }
//      var db = mongoclient.db(dbName);
//      let create_user = {name: "sachin", mobile: 9999278030};
//      db.collection('users').insert(create_user, {w: 1}, function(err, user){
//        console.log("user added", create_user, user)
//      })
//     });
// })
//
// app.post('/create_user1', function (req, res) {
//    console.log("Got a POST request for the /create_user");
//    mongodb.MongoClient.connect(uri, (err, mongoclient) => {
//      if (err) {
//        throw err;
//      }
//      var db = mongoclient.db(dbName);
//      console.log("create_user1",JSON.stringify(req.body));
//      let create_user = userSchema;
//
//      // db.collection('users').insert(create_user, {w: 1}, function(err, user){
//      //   console.log("user added", create_user, user)
//      // })
//     });
// })

app.post('/create_user', function(req, res){
   console.log("Got a POST request for the /create_user");
   mongodb.MongoClient.connect(uri, (err, mongoclient) => {
     if (err) {
       throw err;
     }
     let a = {
    "data":{
        "google":{
            "expectUserResponse":true,
            "noInputPrompts":[

            ],
            "richResponse":{
                "items":[
                    {
                        "simpleResponse":{
                            "textToSpeech":"Welcome to this Basic Card",
                            "displayText":"Welcome to this Basic Card"
                        }
                    },
                    {
                        "basicCard":{
                            "buttons":[
                                {
                                    "title":"Button Title",
                                    "openUrlAction":{
                                        "url":"https://some.url"
                                    }
                                }
                            ],
                            "formattedText":"Some text",
                            "image":{
                                "url":"http://some_image.jpg",
                                "accessibilityText":"Accessibility text describing the image"
                            },
                            "title":"Card Title"
                        }
                    }
                ],
                "suggestions":[
                    {
                        "title":"Aléatoire"
                    },
                    {
                        "title":"Top"
                    }
                ]
            }
        }
    }
}
res.json(a);
        res.end();
   })
})

var server = app.listen(process.env.PORT || 3000, function() {
console.log('API server listening on port: 3000 or ', process.env.PORT)
})

app.post('/makerLab', function (req, res){
  // let city = req.body.result.parameters['geo-city']; // city is a required param
  console.log("Intent Name -> ", req.body.result.metadata['intentName']);
  let list_type = req.body.result.parameters['list']; // city is a required param
  // if(list_type == "products"){
  //     callProducts().then((output) => {
  //       // Return the results of the weather API to Dialogflow
  //       res.setHeader('Content-Type', 'application/json');
  //       res.send(JSON.stringify({ 'speech': output, 'displayText': output }));
  //     }).catch((error) => {
  //       // If there is an error let the user know
  //       res.setHeader('Content-Type', 'application/json');
  //       res.send(JSON.stringify({ 'speech': error, 'displayText': error }));
  //     });
  // }else{
    callUsers().then((output) => {
      // Return the results of the weather API to Dialogflow
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify({ 'speech': output, 'displayText': output }));
    }).catch((error) => {
      // If there is an error let the user know
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify({ 'speech': error, 'displayText': error }));
    });
  // }
})

function callProducts () {
  return new Promise((resolve, reject) => {
    let path = '/list_products';
    http.get({host: serverHost, path: path}, (res) => {
      let body = ''; // var to store the response chunks
      res.on('data', (d) => { body += d; }); // store each response chunk
      res.on('end', () => {
        // After all the data has been received parse the JSON for desired data
        let response = JSON.parse(body);
        // Create response
        let a = JSON.stringify(response)
        let output = `Product list in MongoDB mLab ${a}`;
        // response.forEach(function (product, i) {
        //   output += i + " " product.name + " \n"
        // })
        // Resolve the promise with the output text
        console.log(output);
        resolve(output);
      });
      res.on('error', (error) => {
        reject(error);
      });
    });
  });
}
function callUsers () {
  return new Promise((resolve, reject) => {
    let path = '/create_user1';
    http.get({host: serverHost, path: path}, (res) => {
      let body = ''; // var to store the response chunks
      res.on('data', (d) => { body += d; }); // store each response chunk
      res.on('end', () => {
        // After all the data has been received parse the JSON for desired data
        let response = JSON.parse(body);
        // Create response
        let a = JSON.stringify(response)
        let output = `Users list in MongoDB mLab ${a}`;
        console.log(output);
        resolve(output);
      });
      res.on('error', (error) => {
        reject(error);
      });
    });
  });
}
