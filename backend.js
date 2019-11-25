var express = require('express');
var app = express();

var bodyParser = require('body-parser');
app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: true })); 


var port = process.env.PORT || 3000;

const client = require('mongodb').MongoClient;
var dbo;

client.connect("mongodb://localhost:27017/CRU", function(err, db) {
  if (err)
  {
    client.close();
  }
  else
  {
   console.log('Connected to DB!');
   dbo = db.db("CRU");
	}	

});

app.get('/api/getData', function(req, res) {

  	res.header("Access-Control-Allow-Origin", "*");
    var Year_Start = req.query.year_from;
  	var Year_End = req.query.year_to;
  	var Loc_Lat = req.query.lat;
  	var Loc_Long = req.query.long;
  	var climate_var = req.query.climate_variable;
    var send_data = {};

    // console.log(req.body);
    // console.log(req.query);
    // console.log(Year_Start);
    // console.log(Year_End);

    // console.log(climate_var);


  	// var collection_name = concat('"',climate_variable,'"') 

    dbo.collection(climate_var).findOne({'Lat': parseFloat(Loc_Lat), 'Long': parseFloat(Loc_Long)}, function(err, result){
   	
    console.log(result);
   	for (i = Year_Start; i<= Year_End; i++)
   	{
      console.log(i);
   		send_data[i] = result[i];
   	}
   	
   	res.send(send_data);
   	
   	})

});

// // start the server
app.listen(port);
console.log('Server started! At http://localhost:' + port);