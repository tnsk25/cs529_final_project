var color_scale_temp = d3.scale.quantize().domain([ 30, -30 ]).range(colorbrewer.RdYlBu[11]);
var color_scale_pre = d3.scale.quantize().domain([ 0, 400 ]).range(colorbrewer.YlGnBu[9]);
var colorLegend;

var cli_variable="tmp",year=1901;

var output = document.getElementById("demo");
//Map dimensions (in pixels)
var width = 1200,
    height = 800;

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

//Heat map legend
colorLegend = d3.legend.color()
    .labelFormat(d3.format(".0f"))
    .scale(color_scale_temp)
    .shapePadding(5)
    .shapeWidth(25)
    .shapeHeight(15)
    .labelOffset(12);

svg.append("g")
  .attr("transform", "translate(1100, 600)")
  .attr("class","temp-legend")
  .call(colorLegend);

//load the country shape file
d3.json("./data/countries.geojson",function(error,geodata) {
  if (error) return console.log(error); //unknown error, check the console

  //Create a path for each map feature in the data
  features.selectAll("path")
    .data(geodata.features)
    .enter()
    .append("path")
    .attr("d",path)
    .on("mouseover",showTooltip)
    .on("mousemove",moveTooltip)
    .on("mouseout",hideTooltip)
    .on("click",clicked);

});

var coord_details = svg.append( "g" ).attr("class","points");
var datafile = "./data/"+cli_variable+"/"+year+".geojson";

//load the coordinates
d3.json(datafile,function(error,geodata) {
  if (error) return console.log(error); //unknown error, check the console

  //Create a path for each map feature in the data
  coord_details.selectAll("circle")
    .data(geodata.features)
    .enter()
    .append("circle")
    .attr("class", "circle")
    .attr("transform", function(d) { return "translate(" + path.centroid(d) + ")"; })
    .attr('r',1)
    .attr("fill", function(d) {
      return color_scale_temp(d['properties']['Value']);
    })
    //.on("mouseover",showTooltipcoord)
    //.on("mousemove",moveTooltipcoord)
    //.on("mouseout",hideTooltipcoord)
    //.on("click",clickedcoord);
    $(".loading").css("opacity","0");
});


// Add optional onClick events for features here
// d.properties contains the attributes (e.g. d.properties.name, d.properties.population)
function clicked(d,i) {

}

//Update map on zoom/pan
function zoomed() {
  features.attr("transform", "translate(" + zoom.translate() + ")scale(" + zoom.scale() + ")")
      .selectAll("path").style("stroke-width", 1 / zoom.scale() + "px" );

  coord_details.attr("transform", "translate(" + zoom.translate() + ")scale(" + zoom.scale() + ")")
          .selectAll("path").style("stroke-width", 1 / zoom.scale() + "px" );
}

//Position of the tooltip relative to the cursor
var tooltipOffset = {x: 5, y: -25};

//Create a tooltip, hidden at the start
function showTooltip(d) {
  moveTooltip();

  tooltip.style("display","block")
      .text(d.properties.name);
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

let leftSideBarShown = true;
let rightSideBarShown = false;

function toggleLeftSideBar(e) {
  if (e) {
    stopPropagation(e);
    e.preventDefault();
  }
  const left = document.getElementById('left');
  if (leftSideBarShown) {
    left.classList.add("minimized");
    left.addEventListener("click", toggleLeftSideBar);
  } else {
    left.classList.remove("minimized");
    left.removeEventListener("click", toggleLeftSideBar);
  }
  leftSideBarShown = !leftSideBarShown;
}

function CreateTimeSeries(coords) {
  let lat = $("#lat").val();
  let long = $("#long").val();
  initTimeSeries(lat, long, cli_variable);
  if (!rightSideBarShown) {
    toggleRightSideBar();
  }
}

function initTimeSeries(lat, long, cli_variable) {
  d3.json('./data/sample.json',function(error,data) {
    if (error) return console.log(error); //unknown error, check the console
    console.log(data);
  });
}

function toggleRightSideBar(e) {
  if (e) {
    stopPropagation(e);
    e.preventDefault();
  }
  const rightSideBar = document.getElementById('right');
  if (rightSideBarShown) {
    rightSideBar.classList.add("minimized");
    rightSideBar.addEventListener("click", toggleRightSideBar);
  } else {
    rightSideBar.classList.remove("minimized");
    rightSideBar.removeEventListener("click", toggleRightSideBar);
  }
  rightSideBarShown = !rightSideBarShown;
}

function stopPropagation(evt) {
  if (evt.stopPropagation !== undefined) {
    evt.stopPropagation();
  } else {
    evt.cancelBubble = true;
  }
}

//Year slider events
$( "#slider" ).slider({
      range:"min",
      min: 1901,
      max: 2018,
      value:1901,
      step:1,
      create: function() {
        output.innerHTML = $( this ).slider( "value" );
      },
      slide: function( event, ui ) {
        output.innerHTML = ui.value;
        year = ui.value;
      },
      stop: function( event, ui ) {

        $(".loading").css("opacity","1");
        svg.selectAll(".points circle").remove();

        if(cli_variable=="tmp")
        {
          svg.selectAll(".pre-legend").remove();
          colorLegend = d3.legend.color()
          .labelFormat(d3.format(".0f"))
          .scale(color_scale_temp)
          .shapePadding(5)
          .shapeWidth(25)
          .shapeHeight(15)
          .labelOffset(12);

          svg.append("g")
            .attr("transform", "translate(1100, 600)")
            .attr("class","temp-legend")
            .call(colorLegend);

        }  
        else
        {
          svg.selectAll(".temp-legend").remove();
          colorLegend = d3.legend.color()
          .labelFormat(d3.format(".0f"))
          .scale(color_scale_pre)
          .shapePadding(5)
          .shapeWidth(25)
          .shapeHeight(15)
          .labelOffset(12);

          svg.append("g")
            .attr("transform", "translate(1100, 600)")
            .attr("class","pre-legend")
            .call(colorLegend);

        } 


        var updated_datafile = "./data/"+cli_variable+"/"+year+".geojson";

        d3.json(updated_datafile,function(error,geodata) {
          if (error) return console.log(error); //unknown error, check the console

          //Create a path for each map feature in the data
          coord_details.selectAll("circle")
            .data(geodata.features)
            .enter()
            .append("circle")
            .attr("class", "circle")
            .attr("transform", function(d) { return "translate(" + path.centroid(d) + ")"; })
            .attr('r',1)
            .attr("fill", function(d) {
              if(cli_variable=="tmp")
                return color_scale_temp(d['properties']['Value']);
              else
                return color_scale_pre(d['properties']['Value']);
            })
            //.on("mouseover",showTooltipcoord)
            //.on("mousemove",moveTooltipcoord)
            //.on("mouseout",hideTooltipcoord)
            //.on("click",clickedcoord);
            $(".loading").css("opacity","0");
        });
        
    }
});

//Climate variable on change event
$("#sel1").change(function(event) {

  cli_variable = $(this).val();

  $(".loading").css("opacity","1");
  svg.selectAll(".points circle").remove();

  if(cli_variable=="tmp")
  {
    svg.selectAll(".pre-legend").remove();
    colorLegend = d3.legend.color()
    .labelFormat(d3.format(".0f"))
    .scale(color_scale_temp)
    .shapePadding(5)
    .shapeWidth(25)
    .shapeHeight(15)
    .labelOffset(12);

    svg.append("g")
      .attr("transform", "translate(1100, 600)")
      .attr("class","temp-legend")
      .call(colorLegend);

  }  
  else
  {
    svg.selectAll(".temp-legend").remove();
    colorLegend = d3.legend.color()
    .labelFormat(d3.format(".0f"))
    .scale(color_scale_pre)
    .shapePadding(5)
    .shapeWidth(25)
    .shapeHeight(15)
    .labelOffset(12);

    svg.append("g")
      .attr("transform", "translate(1100, 600)")
      .attr("class","pre-legend")
      .call(colorLegend);

  }  

  var updated_datafile = "./data/"+cli_variable+"/"+year+".geojson";

  d3.json(updated_datafile,function(error,geodata) {
    if (error) return console.log(error); //unknown error, check the console

    //Create a path for each map feature in the data
    coord_details.selectAll("circle")
      .data(geodata.features)
      .enter()
      .append("circle")
      .attr("class", "circle")
      .attr("transform", function(d) { return "translate(" + path.centroid(d) + ")"; })
      .attr('r',1)
      .attr("fill", function(d) {
        if(cli_variable=="tmp")
          return color_scale_temp(d['properties']['Value']);
        else
          return color_scale_pre(d['properties']['Value']);
      })
      //.on("mouseover",showTooltipcoord)
      //.on("mousemove",moveTooltipcoord)
      //.on("mouseout",hideTooltipcoord)
      //.on("click",clickedcoord);
      $(".loading").css("opacity","0");
  });

});


