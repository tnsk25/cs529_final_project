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
    var aggregation_Type = req.query.timeseries_type;
    var Month_Value = req.query.month;
    var Month_Map = {
      "Jan": 0, "Feb": 1, "Mar": 2, "Apr": 3, "May": 4, "Jun": 5, "Jul": 6, "Aug": 7, "Sep": 8, "Oct": 9, "Nov": 10, "Dec": 11 
    };
    var send_data = {};

    dbo.collection(climate_var).findOne({'Lat': parseFloat(Loc_Lat), 'Long': parseFloat(Loc_Long)}, function(err, result){
   	
    if (aggregation_Type == "All_Data"){
     	for (i = Year_Start; i<= Year_End; i++)
     	{
     		send_data[i] = result[i];
     	}
    } else if (aggregation_Type == "Annual"){
      for (i = Year_Start; i<= Year_End; i++)
      {
        var sum = result[i].reduce((previous, current) => current += previous);
        var avg = sum / result[i].length;
        send_data[i] = avg;
      }
    } else {
        for (i = Year_Start; i<= Year_End; i++)
        {
        send_data[i] = result[i][Month_Map[Month_Value]];
        }
    }

   	res.send(send_data);
   	
   	})

});

// // start the server
app.listen(port);
console.log('Server started! At http://localhost:' + port);