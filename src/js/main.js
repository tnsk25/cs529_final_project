var color_scale = d3.scale.linear().domain([-50,50]).range(["red","blue"]);

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


var coord_details = svg.append( "g" );

d3.json("./data/test.geojson",function(error,citydata) {
  if (error) return console.log(error); //unknown error, check the console

  //Create a path for each map feature in the data
  coord_details.selectAll("circle")
    .data(citydata.features)
    .enter()
    .append("circle")
    .attr("class", "circle")
    .attr("transform", function(d) { return "translate(" + path.centroid(d) + ")"; })
    .attr('r',1)
    .attr("fill", function(d) {
      return color_scale(d['properties']['Values']);
    })
    .on("mouseover",showTooltipcoord)
    .on("mousemove",moveTooltipcoord)
    .on("mouseout",hideTooltipcoord)
    .on("click",clickedcoord);

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

function stopPropagation(evt) {
  if (evt.stopPropagation !== undefined) {
    evt.stopPropagation();
  } else {
    evt.cancelBubble = true;
  }
}

var slider = document.getElementById("myRange");
var output = document.getElementById("demo");
output.innerHTML = slider.value; // Display the default slider value

// Update the current slider value (each time you drag the slider handle)
slider.oninput = function() {
  output.innerHTML = this.value;
}

