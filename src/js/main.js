var cli_variable="tmp",year=1901;
var lat = 43.25;
var long = -88.25;
var startYear = 1901;
var endYear = 2018;
var aggregation_Type="Annual";


var output = document.getElementById("demo");
//Map dimensions (in pixels)
var width = 1000, height = 600;
//Map projection
var projection = d3.geo.robinson()
    .scale(183.56015491730435)
    .center([-0.0018057527730361458,11.258678472759552]) //projection center
    .translate([width/2,height/2]) //translate to center the map in view
//Generate paths based on projection
var path = d3.geo.path()
    .projection(projection);
//Create an SVG
var svg = d3.select("body .map-div").append("svg")
    .attr("width", width)
    .attr("height", height);
//Group for the map features
var features = svg.append("g")
    .attr("class","features");
//Create zoom/pan listener
//Change [1,Infinity] to adjust the min/max zoom scale
var zoom = d3.behavior.zoom()
    .scaleExtent([1, Infinity])
    .on("zoom",zoomed);

svg.call(zoom);
//Create a tooltip, hidden at the start
var tooltip = d3.select("body").append("div").attr("class","tooltip");
var coord_details = svg.append( "g" ).attr("class","points");
//Position of the tooltip relative to the cursor
var tooltipOffset = {x: 5, y: -25};
var leftSideBarShown = true;
var rightSideBarShown = false;
//Time Series Variables
var dataset = [];
var dataXrange;
var dataYrange;
var mindate;
var maxdate;
var DateFormat;
var dynamicDateFormat;
var x;
var y;
var xAxis;
var yAxis;
var x2;
var y2;
var xAxis_context;
var line;
var line_context;
var brush;
var zoomTS;
var vis;
var context;
var focus;
var rect;
var display_range_group;
var expl_text;
var dateRange;
var button;
var brushg;

document.getElementById('lat').value = lat;
document.getElementById('long').value = long;
document.getElementById('from_year').value = startYear;
document.getElementById('to_year').value = endYear;

//load the country shape file
d3.json("./data/countries.geojson",function(error,geodata) {
  if (error) return console.log(error); //unknown error, check the console

  //Create a path for each map feature in the data
  features.selectAll("path")
    .data(geodata.features)
    .enter()
    .append("path")
    .attr("d",path);
});


//Update map on zoom/pan
function zoomed() {
  features.attr("transform", "translate(" + zoom.translate() + ")scale(" + zoom.scale() + ")")
      .selectAll("path").style("stroke-width", 1 / zoom.scale() + "px" );

  coord_details.attr("transform", "translate(" + zoom.translate() + ")scale(" + zoom.scale() + ")")
          .selectAll("path").style("stroke-width", 1 / zoom.scale() + "px" );
}

function CreateTimeSeries() {
  let lat = $("#lat").val();
  let long = $("#long").val();
  let startYear = $("#from_year").val();
  let endYear = $("#to_year").val();
  initTimeSeries(lat, long, cli_variable, startYear, endYear, aggregation_Type);
}

function initTimeSeries(lat, long, cli_variable, startYear, endYear, aggregation_Type) {

  dataset = [];

  var params = {
    'year_from' : startYear,
    'year_to': endYear,
    'lat': lat,
    'long': long,
    'climate_variable': cli_variable,
    'timeseries_type': aggregation_Type,
  };

  $.ajax({
          url: 'http://localhost:3000/api/getData',
          dataType: 'json',
          type: 'get',
          crossDomain: true,
          data: params,
          success: function(data){
              console.log(data);

              if (aggregation_Type == 'Annual'){
                Object.entries(data).forEach(([key,value])=>{
                  var obj = { date: key, values: value};
                  dataset.push(obj);
                });
                console.log(dataset);
                // format month as a date
                dataset.forEach(function(d, i) {
                  var startDate = 1901;
                  d.date = startDate+i;
                });
              }
              else {
                $.each(data, function(sel_year, item) {
                    // console.log(sel_year);
                    $.each(item, function(j,value) {

                      var formatDate = sel_year + "-"+ (j+1);
                      var obj = { date: formatDate, values: value};
                      dataset.push(obj);
                    });
                });
                // format month as a date
                dataset.forEach(function(d) {
                    d.date = d3.time.format("%Y-%m").parse(d.date);
                });
              }

              console.log(dataset);
              //drawChart(dataset);
              drawBrushedChart(dataset);
            },
            error: function(){
                alert("Error while fetching data");

            }
  });

}

function drawBrushedChart(dataset) {

  $(".metric-chart").remove();

  var optwidth        = 600;
  var optheight       = 600;

  var margin  = {top: 20, right: 30, bottom: 100, left: 20},
      width = optwidth - margin.left - margin.right,
      height  = optheight - margin.top - margin.bottom;


  var margin_context = {top: 550, right: 30, bottom: 20, left: 20},
      height_context = optheight - margin_context.top - margin_context.bottom;

  dataXrange = d3.extent(dataset, function(d) { return d.date; });
  dataYrange = [d3.min(dataset, function(v) { return v.values; }), d3.max(dataset, function(d) { return d.values; })];

  mindate = dataXrange[0],  // use the range of the data
  maxdate = dataXrange[1];

  DateFormat    =  d3.time.format("%b %Y");

  dynamicDateFormat = timeFormat([
      [d3.time.format("%Y"), function() { return true; }],// <-- how to display when Jan 1 YYYY
      [d3.time.format("%b %Y"), function(d) { return d.getMonth(); }],
      [function(){return "";}, function(d) { return d.getDate() != 1; }]
  ]);

  x = d3.time.scale()
    .range([0, (width)])
      .domain(dataXrange);


  y = d3.scale.linear()
    .range([height, 0])
      .domain(dataYrange);


  xAxis = d3.svg.axis()
    .scale(x)
      .orient("bottom")
      .tickSize(-(height))
      .ticks(customTickFunction)
      .tickFormat(dynamicDateFormat);

  yAxis = d3.svg.axis()
    .scale(y)
    .orient("right");


  x2 = d3.time.scale()
      .range([0, width])
      .domain([mindate, maxdate]);

  y2 = d3.scale.linear()
    .range([height_context, 0])
      .domain(y.domain());

  xAxis_context = d3.svg.axis()
      .scale(x2)
      .orient("bottom")
      .ticks(customTickFunction)
      .tickFormat(dynamicDateFormat);

  line = d3.svg.line()
    .x(function(d) { return x(d.date); })
    .y(function(d) { return y(d.values); });

  line_context = d3.svg.line()
      .x(function(d) { return x2(d.date); })
      .y(function(d) { return y2(d.values); });

  brush = d3.svg.brush()
      .x(x2)
      .on("brush", brushed)
      .on("brushend", brushend);

  zoomTS = d3.behavior.zoom()
      .on("zoom", draw)
      .on("zoomend", brushend);

  vis = d3.select(".map-div").append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .attr("class", "metric-chart"); // CB -- "line-chart" -- CB //

  vis.append("defs").append("clipPath")
      .attr("id", "clip")
      .append("rect")
      .attr("width", width)
      .attr("height", height);
      // clipPath is used to keep line and area from moving outside of plot area when user zooms/scrolls/brushes

  context = vis.append("g")
      .attr("class", "context")
      .attr("transform", "translate(" + margin_context.left + "," + margin_context.top + ")");

  focus = vis.append("g")
      .attr("class", "focus")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  rect = vis.append("svg:rect")
      .attr("class", "pane")
      .attr("width", width)
      .attr("height", height)
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
      .call(zoomTS)
      .call(draw);

  // === current date range text & zoom buttons === //

  display_range_group = vis.append("g")
      .attr("id", "buttons_group")
      .attr("transform", "translate(" + 0 + ","+ 0 +")");

  expl_text = display_range_group.append("text")
      .text("Showing data from: ")
      .style("text-anchor", "start")
      .attr("transform", "translate(" + 0 + ","+ 10 +")");

  display_range_group.append("text")
      .attr("id", "displayDates")
      .text(DateFormat(dataXrange[0]) + " - " + DateFormat(dataXrange[1]))
      .style("text-anchor", "start")
      .attr("transform", "translate(" + 82 + ","+ 10 +")");

  expl_text = display_range_group.append("text")
      .text("Zoom to: ")
      .style("text-anchor", "start")
      .attr("transform", "translate(" + 180 + ","+ 10 +")");

  // === the zooming/scaling buttons === //

  var button_width = 40;
  var button_height = 14;
  var button_data =["data"];

  button = display_range_group.selectAll("g")
      .data(button_data)
      .enter().append("g")
      .attr("class", "scale_button")
      .attr("transform", function(d, i) { return "translate(" + (220 + i*button_width + i*10) + ",0)"; })
      .on("click", scaleDate);

  button.append("rect")
      .attr("width", button_width)
      .attr("height", button_height)
      .attr("rx", 1)
      .attr("ry", 1);

  button.append("text")
      .attr("dy", (button_height/2 + 3))
      .attr("dx", button_width/2)
      .style("text-anchor", "middle")
      .text(function(d) { return d; });

  /* === focus chart === */

  focus.append("g")
      .attr("class", "y axis")
      .call(yAxis)
      .attr("transform", "translate(" + (width) + ", 0)");

  focus.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

  focus.append("path")
      .datum(dataset)
      .attr("class", "line")
      .attr("d", line);

  /* === context chart === */

  context.append("path")
      .datum(dataset)
      .attr("class", "line")
      .attr("d", line_context);

  context.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height_context + ")")
      .call(xAxis_context);

  /* === brush (part of context chart)  === */

  brushg = context.append("g")
      .attr("class", "x brush")
      .call(brush);

  brushg.selectAll(".extent")
     .attr("y", -6)
     .attr("height", height_context + 8);
     // .extent is the actual window/rectangle showing what's in focus

  brushg.selectAll(".resize")
      .append("rect")
      .attr("class", "handle")
      .attr("transform", "translate(0," +  -3 + ")")
      .attr('rx', 2)
    .attr('ry', 2)
      .attr("height", height_context + 6)
      .attr("width", 3);

  brushg.selectAll(".resize")
      .append("rect")
      .attr("class", "handle-mini")
      .attr("transform", "translate(-2,8)")
      .attr('rx', 3)
      .attr('ry', 3)
      .attr("height", (height_context/2))
      .attr("width", 7);
      // .resize are the handles on either size
      // of the 'window' (each is made of a set of rectangles)

  /* === y axis title === */

  vis.append("text")
      .attr("class", "y axis title")
      .text($("#variable").find("option:selected").text())
      .attr("x", (-(height/2)))
      .attr("y", 0)
      .attr("dy", "1em")
      .attr("transform", "rotate(-90)")
      .style("text-anchor", "middle");

  // allows zooming before any brush action
  zoomTS.x(x);
}

function timeFormat(formats) {
  return function(date) {
    var i = formats.length - 1, f = formats[i];
    while (!f[1](date)) f = formats[--i];
    return f[0](date);
  };
};

function customTickFunction(t0, t1, dt)  {
  var labelSize = 42; //
  var maxTotalLabels = Math.floor(width / labelSize);

  function step(date, offset)
  {
    date.setMonth(date.getMonth() + offset);
  }

  var time = d3.time.month.ceil(t0), times = [], monthFactors = [1,3,4,12];

  while (time < t1) times.push(new Date(+time)), step(time, 1);
  var timesCopy = times;
  var i;
  for(i=0 ; times.length > maxTotalLabels ; i++)
    times = _.filter(timesCopy, function(d){
        return (d.getMonth()) % monthFactors[i] == 0;
    });

  return times;
};

// === brush and zoom functions ===

function brushed() {

  x.domain(brush.empty() ? x2.domain() : brush.extent());
  focus.select(".line").attr("d", line);
  focus.select(".x.axis").call(xAxis);
  // Reset zoom scale's domain
  zoomTS.x(x);
  updateDisplayDates();
  setYdomain();

};

function draw() {
  setYdomain();
  focus.select(".line").attr("d", line);
  focus.select(".x.axis").call(xAxis);
  //focus.select(".y.axis").call(yAxis);
  // Force changing brush range
  brush.extent(x.domain());
  vis.select(".brush").call(brush);
  // and update the text showing range of dates.
  updateDisplayDates();
};

function brushend() {
// when brush stops moving:

  // check whether chart was scrolled out of bounds and fix,
  var b = brush.extent();
  var out_of_bounds = brush.extent().some(function(e) { return e < mindate | e > maxdate; });
  if (out_of_bounds){ b = moveInBounds(b) };

};

function updateDisplayDates() {

  var b = brush.extent();
  // update the text that shows the range of displayed dates
  var localBrushDateStart = (brush.empty()) ? DateFormat(dataXrange[0]) : DateFormat(b[0]),
      localBrushDateEnd   = (brush.empty()) ? DateFormat(dataXrange[1]) : DateFormat(b[1]);

  // Update start and end dates in upper right-hand corner
  d3.select("#displayDates")
      .text(localBrushDateStart == localBrushDateEnd ? localBrushDateStart : localBrushDateStart + " - " + localBrushDateEnd);
};

function moveInBounds(b) {
// move back to boundaries if user pans outside min and max date.

  var ms_in_year = 31536000000,
      brush_start_new,
      brush_end_new;

  if       (b[0] < mindate)   { brush_start_new = mindate; }
  else if  (b[0] > maxdate)   { brush_start_new = new Date(maxdate.getTime() - ms_in_year); }
  else                        { brush_start_new = b[0]; };

  if       (b[1] > maxdate)   { brush_end_new = maxdate; }
  else if  (b[1] < mindate)   { brush_end_new = new Date(mindate.getTime() + ms_in_year); }
  else                        { brush_end_new = b[1]; };

  brush.extent([brush_start_new, brush_end_new]);

  brush(d3.select(".brush").transition());
  brushed();
  draw();

  return(brush.extent())
};

function setYdomain(){
// this function dynamically changes the y-axis to fit the data in focus

  // get the min and max date in focus
  var xleft = new Date(x.domain()[0]);
  var xright = new Date(x.domain()[1]);

  // a function that finds the nearest point to the right of a point
  var bisectDate = d3.bisector(function(d) { return d.date; }).right;

  // get the y value of the line at the left edge of view port:
  var iL = bisectDate(dataset, xleft);

  if (dataset[iL] !== undefined && dataset[iL-1] !== undefined) {

      var left_dateBefore = dataset[iL-1].date,
          left_dateAfter = dataset[iL].date;

      var intfun = d3.interpolateNumber(dataset[iL-1].values, dataset[iL].values);
      var yleft = intfun((xleft-left_dateBefore)/(left_dateAfter-left_dateBefore));
  } else {
      var yleft = 0;
  }

  // get the x value of the line at the right edge of view port:
  var iR = bisectDate(dataset, xright);

  if (dataset[iR] !== undefined && dataset[iR-1] !== undefined) {

      var right_dateBefore = dataset[iR-1].date,
          right_dateAfter = dataset[iR].date;

      var intfun = d3.interpolateNumber(dataset[iR-1].values, dataset[iR].values);
      var yright = intfun((xright-right_dateBefore)/(right_dateAfter-right_dateBefore));
  } else {
      var yright = 0;
  }

  // get the y values of all the actual data points that are in view
  var dataSubset = dataset.filter(function(d){ return d.date >= xleft && d.date <= xright; });
  var countSubset = [];
  dataSubset.map(function(d) {countSubset.push(d.values);});

  // add the edge values of the line to the array of counts in view, get the max y;
  countSubset.push(yleft);
  countSubset.push(yright);
  var ymax_new = d3.max(countSubset);
  var ymin_new = d3.min(countSubset);

  if(ymax_new == 0){
      ymax_new = dataYrange[1];
  }

  // reset and redraw the yaxis
  y.domain([ymin_new*1.05, ymax_new*1.05]);
  focus.select(".y.axis").call(yAxis);

};

function scaleDate(d,i) {
// action for buttons that scale focus to certain time interval
  var b = brush.extent(),
      interval_ms,
      brush_end_new,
      brush_start_new;

  if ( d == "data" )  {
    brush_start_new = dataXrange[0];
    brush_end_new = dataXrange[1]
  } else {
    brush_start_new = b[0];
    brush_end_new = b[1];
  };

  brush.extent([brush_start_new, brush_end_new]);

  // now draw the brush to match our extent
  brush(d3.select(".brush").transition());
  // now fire the brushstart, brushmove, and brushend events
  brush.event(d3.select(".brush").transition());
};

function drawChart(data) {
  console.log(data);
  var margin = {top: 20, right: 80, bottom: 30, left: 50},
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

  var parseDate = d3.time.format("%Y").parse;

  var x = d3.time.scale()
      .range([0, width]);

  var y = d3.scale.linear()
      .range([height, 0]);

  var color = d3.scale.category10();

  var xAxis = d3.svg.axis()
      .scale(x)
      .orient("bottom");

  var yAxis = d3.svg.axis()
      .scale(y)
      .orient("left");

  var line = d3.svg.line()
      .interpolate("basis")
      .x(function(d) {
        console.log(d);
        return x(d.date);
      })
      .y(function(d) {
        console.log(d);
        return y(d.values);
      });

  var svg = d3.select("#chart").append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  x.domain(d3.extent(data, function(d) { return d.date; }));

  y.domain([
    d3.min(data, function(v) { return v.values; }),
    d3.max(data, function(v) { return v.values;})
  ]);
  console.log(y);

  svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

  svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)
    .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", ".71em")
      .style("text-anchor", "end")

  svg.append("path")
      .datum(data)
      .attr("class", "line")
      .attr("d", line);
}

loadCoordinates(cli_variable,year);
initTimeSeries(lat, long, cli_variable, startYear, endYear, aggregation_Type);


function loadCoordinates(cli_variable,year)
{

  var color_scale;

  svg.selectAll(".points circle").remove();
  svg.selectAll(".legend").remove();

  $(".loading").css("opacity","1");

  var datafile = "./data/"+cli_variable+"/"+year+".geojson";

  //load the coordinates
  d3.json(datafile,function(error,geodata) {
    if (error) return console.log(error); //unknown error, check the console

    var minVal = d3.min(geodata.features, function(d) { return parseInt(d['properties']['Value']); })
    var maxVal = d3.max(geodata.features, function(d) { return parseInt(d['properties']['Value']); })

    if(cli_variable=="tmp" || cli_variable=="tmn" || cli_variable=="tmx" || cli_variable=="dtr")
      color_scale = d3.scale.quantize().domain([ maxVal, minVal ]).range(colorbrewer.RdYlBu[11]);
    else
      color_scale = d3.scale.quantize().domain([ minVal, maxVal ]).range(colorbrewer.YlGnBu[9]);

    //Heat map legend
    var colorLegend = d3.legend.color()
        .labelFormat(d3.format(".0f"))
        .scale(color_scale)
        .shapePadding(5)
        .shapeWidth(25)
        .shapeHeight(15)
        .labelOffset(12);

    svg.append("g")
    .attr("transform", "translate(1100, 580)")
    .attr("class","legend")
    .call(colorLegend);


    //Create a path for each map feature in the data
    coord_details.selectAll("circle")
      .data(geodata.features)
      .enter()
      .append("circle")
      .attr("class", "circle")
      .attr("transform", function(d) { return "translate(" + path.centroid(d) + ")"; })
      .attr('r',1)
      .attr("fill", function(d) {
        return color_scale(d['properties']['Value']);
      })
      .on("mouseover",showTooltip)
      .on("mousemove",moveTooltip)
      .on("mouseout",hideTooltip)
      .on("click",clicked);

      $(".loading").css("opacity","0");
  });

}


//Create a tooltip, hidden at the start
function showTooltip(d) {
  moveTooltip();
  var value = parseInt(d['properties']['Value']);
  tooltip.style("display","block")
      .html("Latitude: "+d['geometry']['coordinates'][1]+"<br>Longitude: "+d['geometry']['coordinates'][0]+"<br>Value: "+value.toFixed(2));
}

//Move the tooltip to track the mouse
function moveTooltip() {
  tooltip.style("top",(d3.event.pageY+tooltipOffset.y)+"px")
      .style("left",(d3.event.pageX+tooltipOffset.x)+"px");
}

//Create a tooltip, hidden at the start
function hideTooltip() {
  tooltip.style("display","none");
}

// Add optional onClick events for features here
// d.properties contains the attributes (e.g. d.properties.name, d.properties.population)
function clicked(d,i) {

  $("#lat").val(d['geometry']['coordinates'][1]);
  $("#long").val(d['geometry']['coordinates'][0]);

}

$(document).ready(function() {

  for(var i =1901; i<=2018; i++)
  {
    $("#year").append("<option value='"+i+"'>"+i+"</option>");
    $("#from_year").append("<option value='"+i+"'>"+i+"</option>");
    $("#to_year").append("<option value='"+i+"'>"+i+"</option>");
  }


});

//Heatmap Climate variable change event
$("#variable").change(function(event) {
  cli_variable = $(this).val();
  loadCoordinates(cli_variable,year);

  if(($("#lat").val()!="") && ($("#long").val()!=""))
  {
    CreateTimeSeries();
  }

});

//Heatmap Year change event
$("#year").change(function(event) {
  year = $(this).val();
  loadCoordinates(cli_variable,year);
});



