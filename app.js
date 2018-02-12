var express = require('express')
var bodyParser = require('body-parser')
const mongodb = require('mongodb');
const nconf = require('nconf');
const http = require('http');
var request = require('request');

var app = express();
app.use(bodyParser.json());
nconf.argv().env().file('keys.json');

const user = nconf.get('mongoUser');
const pass = nconf.get('mongoPass');
const host = nconf.get('mongoHost');
const port = nconf.get('mongoPort');
const dbName = nconf.get('mongoDatabase');
const serverHost = "90670e85.ngrok.io";
// const serverHost = "maker-lab.herokuapp.com";

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
app.get('/list_products', function (req, res) {
   console.log("Got a GET request for the /list_products");
   mongodb.MongoClient.connect(uri, (err, mongoclient) => {
     if (err) {
       throw err;
     }
     var db = mongoclient.db(dbName);
     let products = [];
     db.collection('products').find().toArray(function(err, items) {
        products = [...items]
        console.log("products from /productsList",products)
        mongoclient.close();
        res.json(products);
        res.end();
     });
    });
})

// This responds a GET request for the /list_user page.
app.get('/list_users', function (req, res) {
   console.log("Got a GET request for the /list_users");
   mongodb.MongoClient.connect(uri, (err, mongoclient) => {
     if (err) {
       throw err;
     }
     var db = mongoclient.db(dbName);
     let users = [];
     db.collection('users').find().toArray(function(err, items) {
        users = [...items]
        console.log("users from /list_user",users)
        mongoclient.close();
        res.json(users);
        res.end();
     });
    });
})

app.post('/user_login', function (req, res) {
   console.log("Got a GET request for the /user_login", req.body);
   mongodb.MongoClient.connect(uri, (err, mongoclient) => {
     if (err) {
       throw err;
     }
     var db = mongoclient.db(dbName);
     let users = req.body;
     db.collection('users').find(users).toArray(function(err, items) {
        users = [...items]
        console.log("users from /user_login",users)
        mongoclient.close();
        res.json(users);
        res.end();
     });
    });
})

app.get('/create_user', function (req, res) {
   console.log("Got a GET request for the /create_user");
   mongodb.MongoClient.connect(uri, (err, mongoclient) => {
     if (err) {
       throw err;
     }
     var db = mongoclient.db(dbName);
     let create_user = {name: "sachin", mobile: 9999278030};
     db.collection('users').insert(create_user, {w: 1}, function(err, user){
       console.log("user added", create_user, user)
     })
    });
})

app.post('/create_user', function (req, res) {
   console.log("Got a POST request for the /create_user",JSON.stringify(req.body));
   mongodb.MongoClient.connect(uri, (err, mongoclient) => {
     if (err) {
       throw err;
     }
     console.log("6")
     var db = mongoclient.db(dbName);
     console.log("create_user1",JSON.stringify(req.body));
     let create_user = {
         "first_name": "",
         "last_name": "",
         "password": req.body.password,
         "email_id": req.body.email_id,
         "user_name": "",
         "role": {
             "customer": true
         },
         "cart": [],
         "buy_history_product": [],
         "buckets_created": {},
         "address": {},
         "products_id_search_history": []
     };

     db.collection('users').insert(create_user, {w: 1}, function(err, user){
       console.log("user added - ", create_user)
       console.log("user added details", user)
       mongoclient.close();
       res.json(create_user);
       res.end();
     })
    });
})

var server = app.listen(process.env.PORT || 3000, function() {
console.log('API server listening on port: 3000 or ', process.env.PORT)
})

app.post('/makerLab', function (req, res){
  // let city = req.body.result.parameters['geo-city']; // city is a required param
  let intentName = req.body.result.metadata['intentName']
  const contexts = req.body.result.contexts;
  let contextsObject = {};
  contexts.map(context => {
    return contextsObject[context.name] = context;
  })
  console.log("Intent Name -> ", intentName, "Context -> " , contexts, "contextsObject : " , contextsObject);
  let list_type = req.body.result.parameters['list']; // city is a required param
  if(intentName == "logout user"){
    // Return the results of the weather API to Dialogflow
    console.log("logged-out user details -> ", contextsObject.login)
    let msg = "Plz login to do logout from this app.";

    let contextOut = [];
    if(contextsObject.login && contextsObject.login.parameters && contextsObject.login.parameters.email_id != ""){
      msg = "Logout successfully";
      contextOut = [
                      {
                        "name": "login",
                        "lifespan": 0,
                        "parameters": {
                          "email_id": ""
                        }
                      }
                    ];
    }
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({ 'speech': msg, 'displayText': msg, "contextOut": contextOut,resetContexts : true,
                      data: {
                                "google": {
                                    "expect_user_response": true,
                                    "rich_response": {
                                      "items": [
                                          {
                                            "simpleResponse": {
                                              "textToSpeech": msg,
                                              "displayText": msg
                                            }
                                          }
                                      ],
                                      "suggestions":
                                        [
                                          {"title": "Want to Login Again?"},
                                          {"title": "You can search our Products without login too."}
                                        ]
                                  }
                                }
                            }
                          }));
  }else if(intentName == "login user"){
    let checkUser = {
      email_id: req.body.result.parameters['email_id'],
      password: req.body.result.parameters['password']
    };
    loginUser(checkUser).then((output) => {
      // Return the results of the weather API to Dialogflow
      console.log("logged-in user details -> ", output, typeof output)
      let msg = "";
      output = JSON.parse(output);
      let contextOut = [];
      if(!output.length){
        msg = "Details are not correct. plz say like - login me by *******@gmail.com and *****"
      } else if(output.length > 0 && output[0].role.customer){
        contextOut = [
                        {
                          "name": "login",
                          "lifespan": 50,
                          "parameters": {
                            "email_id": output[0].email_id
                          }
                        }
                      ];
        msg = "You are successfully logged in as Customer"
      }else{
        //TODO: update for vendor n cpg..
        msg = "You are successfully logged in as Vendor"
      }
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify({ 'speech': msg, 'displayText': msg, "contextOut": contextOut,
                        data: {
                                  "google": {
                                      "expect_user_response": true,
                                      "rich_response": {
                                        "items": [
                                            {
                                              "simpleResponse": {
                                                "textToSpeech": msg,
                                                "displayText": msg
                                              }
                                            }
                                        ],
                                        "suggestions":
                                          [
                                            {"title": output.length ? "Create Bucket" : "Not signup till now? Want to SignUp.."},
                                            {"title": output.length ? "Update Profile" : "Try again to login, if registerd already"},
                                            {"title":output.length ? "Search Products" : "You can search our Products without login too."}
                                          ]
                                    }
                                  }
                              }
                            }));
    }).catch((error) => {
      // If there is an error let the user know
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify({ 'speech': error, 'displayText': error }));
    });
  }else if(intentName == "create user"){
    let new_user = {
      email_id: req.body.result.parameters['email_id'],
      password: req.body.result.parameters['password']
    };
    createUser(new_user).then((output) => {
      // Return the results of the weather API to Dialogflow
      console.log("create user -> ", output, typeof output)
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify({ 'speech': output, 'displayText': output }));
    }).catch((error) => {
      // If there is an error let the user know
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify({ 'speech': error, 'displayText': error }));
    });
  }else{
    if(list_type == "products"){
        callProducts().then((output) => {
          // Return the results of the weather API to Dialogflow
          res.setHeader('Content-Type', 'application/json');
          res.send(JSON.stringify({ 'speech': output, 'displayText': output }));
        }).catch((error) => {
          // If there is an error let the user know
          res.setHeader('Content-Type', 'application/json');
          res.send(JSON.stringify({ 'speech': error, 'displayText': error }));
        });
    }else{
      callUsers().then((output) => {
        // Return the results of the weather API to Dialogflow
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify({ 'speech': output, 'displayText': output }));
      }).catch((error) => {
        // If there is an error let the user know
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify({ 'speech': error, 'displayText': error }));
      });
    }
  }
})

function loginUser(userObject) {
  return new Promise((resolve, reject) => {
    let path = '/user_login';
    console.log("2. user_login", typeof request, typeof http.request, "https://" + serverHost + path);
    request({
              url: "https://" + serverHost + path,
              method: "POST",
              json: true,   // <--Very important!!!
              body: userObject
            }, function (error, response, body){
              if (!error && response.statusCode == 200) {
                  console.log("success post request for user login: ",body)
                  resolve(JSON.stringify(body));
              }else{
                console.error("3. user_login",error);
                reject(error)
              }
            }
          );
  });
}

function createUser (userObject) {
  return new Promise((resolve, reject) => {
    let path = '/create_user';
    console.log("sdf", typeof request, typeof http.request, "https://" + serverHost + path);
    let bodyString = JSON.stringify({a:"b"})
    // resolve(bodyString);
    console.log("1");
    request({
              url: "https://" + serverHost + path,
              method: "POST",
              json: true,   // <--Very important!!!
              body: userObject
            }, function (error, response, body){
              if (!error && response.statusCode == 200) {
                  console.log("success post request for insertion: ",body)
                  resolve(JSON.stringify(body));
              }else{
                console.error("dfg",error);
                reject(error)
              }
            }
          );
    // let req =  http.request({host: serverHost, method: "POST",  path: path}, (res) => {
    //   console.log("2")
    //     let body = ''; // var to store the response chunks
    //     res.on('data', (d) => { body += d; }); // store each response chunk
    //     res.on('end', () => {
    //       // After all the data has been received parse the JSON for desired data
    //       let response = JSON.parse(body);
    //       // Create response
    //       let a = JSON.stringify(response)
    //       let output = `Product list in MongoDB mLab ${a}`;
    //       // response.forEach(function (product, i) {
    //       //   output += i + " " product.name + " \n"
    //       // })
    //       // Resolve the promise with the output text
    //       console.log(output);
    //       resolve(output);
    //     });
    //     res.on('error', (error) => {
    //       console.log("3")
    //       reject(error);
    //     });
    //   });
    //   console.log("4")
    // req.write(bodyString);
    // req.end();
  });
}

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
