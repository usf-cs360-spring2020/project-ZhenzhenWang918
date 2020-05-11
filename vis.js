// The svg
var svg = d3.select("svg"),
    width = +svg.attr("width"),
    height = +svg.attr("height");

var topo;
var countries;
var selectedCountry;
var date = 0;

const tip = d3.select("body").append("div").attr("id", "tooltip")
    .style("padding", "9px")
    .style("background", "#fff")
    .style("border", "3px solid #999")
    .style("border-radius", "10px")
    .style("visibility", "hidden")
    .style("position", "absolute");

var dateText = svg.append("text")
    .attr("dx", 20)
    .attr("dy", 460)
    .attr("font-size", 40);

// Data and color scale
var colorScheme = d3.schemeReds[6];
colorScheme.unshift("#eee")
var colorScale = d3.scaleThreshold()
    .domain([1, 6, 11, 26, 101, 1001])
    .range(colorScheme);

function bringToTopofSVG(targetElement) {
    let parent = targetElement.ownerSVGElement;
    parent.appendChild(targetElement);
}

d3.json("worldmap2.geojson").then(function (t) {
    d3.json("wrangled.json").then(function (c) {

        console.log(1)
        topo = t;
        countries = c;

        // Map and Projection
        var projection = d3.geoNaturalEarth()
            .scale(200)
            .translate([390, 280])
        // .translate([626, 280])
        var path = d3.geoPath()
            .projection(projection);
        svg.append("g")
            .attr("class", "countries")
            .selectAll("path")
            .data(topo.features)
            .enter().append("path")
            .attr("d", path);

        var bars = svg.selectAll("g").selectAll("path");

        // Country handlers
        bars.on("mouseenter", function (d) {
            tip.style("visibility", "hidden");
            bars.filter(e => (d.id === e.id))
                .style("stroke", "green")
                .style("stroke-width", "3px");
        });
        bars.on("mouseout", function (d) {
            tip.style("visibility", "hidden");
            bars.filter(e => (d.id === e.id))
                .style("stroke", d => selectedCountry == d.id ? "#000" : "#fff")
                .style("stroke-width", d => selectedCountry == d.id ? "2px" : "1px");
        });
        bars.on("mousemove", function (d) {
            c = countries[d.id];
            cases = countries[d.id]["Cases"][date];
            deaths = countries[d.id]["Deaths"][date];

            tip.style("visibility", "visible")
                .style("left", (d3.event.pageX + 20) + "px")
                .style("top", (d3.event.pageY - 10) + "px")
            tip.html("<b>" + c.name + "</b><br />" + cases + " cases<br />" + deaths + " deaths<!--<br />##.### per million-->");
        });
        bars.on("click", function (d) {
            selectedCountry = d.id;
            d3.event.stopPropagation();

            refreshmap();
        });

        // Background handlers
        svg.on("click", function (d) {
            if (d3.event.pageY > 800) {
                date = Math.max(0, Math.min(123, Math.floor((d3.event.pageX - 300) / 7)));
                var dt = new Date(2020, 0, 6);
                dt.setDate(dt.getDate() + date);
                const months = ["January","February","March","April","May","June","July",
                "August","September","October","November","December"];
                dateText.text(months[dt.getMonth()]);
                refreshmap();
            }
        });

        refreshmap();

    });
});


function refreshmap() {
    var bars = svg.selectAll("g").selectAll("path");

    bars.attr("fill", function (d) {
        // Pull data for this country
        d.total = d.id in countries ? Math.sqrt(countries[d.id]["Cases"][date]) : 0;
        // Set the color
        return colorScale(d.total);
    }).style("fill-opacity", d => selectedCountry == d.id || selectedCountry == '' ? 1.0 : 0.4)
        .style("stroke", d => selectedCountry == d.id ? "#000" : "#fff")
        .style("stroke-width", d => selectedCountry == d.id ? "2px" : "1px");
}

function drawtimeseries() {

}
