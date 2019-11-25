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
   // var collection_name = concat('"','Temp_Monthly','"') 
   dbo = db.db("CRU");
	}	

});



  app.get('/api/getData', function(req, res) {

  	var Year_Start = req.body.year_from;
  	var Year_End = req.body.year_to;
  	var Loc_Lat = req.body.lat;
  	var Loc_Long = req.body.long;
  	var climate_var = req.body.climate_variable;

  	// var collection_name = concat('"',climate_variable,'"') 

    dbo.collection(climate_var).findOne({'Lat': loc_Lat, 'Long': loc_long}, function(err, result){
   	
   	for (i = Year_Start; i<= Year_End; i++)
   	{
   		send_data[i] = result[i];
   	}
   	
   	res.send(send_data);
   	
   	})

  });



// // start the server
app.listen(port);
console.log('Server started! At http://localhost:' + port);