// The svg
var svg = d3.select("svg"),
    width = +svg.attr("width"),
    height = +svg.attr("height");

var topo;
var countries;
var linedata = { "Cases": {}, "Deaths": {} };
var selectedCountry = 'CN';
var date = 0;

const tip = d3.select("body").append("div").attr("id", "tooltip")
    .style("padding", "9px")
    .style("background", "#fff")
    .style("border", "3px solid #999")
    .style("border-radius", "10px")
    .style("visibility", "hidden")
    .style("position", "absolute");

var dateText = svg.append("text")
.attr("dx", 626)
// .attr("dx", 390)
    .attr("dy", 460)
    .attr("font-size", 30);

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


// Background handlers
svg.on("click", function (d) {
    if (d3.event.pageY > 800) {
        date = Math.max(0, Math.min(123, Math.floor((d3.event.pageX - 300) / 8)));
        refreshmap();
    }
});


d3.json("worldmap2.geojson").then(function (t) {
    d3.json("wrangled.json").then(function (c) {
        topo = t;
        countries = c;

        drawmap();
        drawtimegraph();
        refreshmap();
        refreshtimegraph();
    });
});

function drawmap() {
    // Map and Projection
    var projection = d3.geoNaturalEarth()
        .scale(200)
        // .translate([390, 280])
    .translate([626, 280])
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
            .style("stroke", d => selectedCountry == d.id ? "#fff" : "#fff")
            .style("stroke-width", d => selectedCountry == d.id ? "1px" : "1px");
    });
    bars.on("mousemove", function (d) {
        c = countries[d.id];
        cases = d.id in countries ? countries[d.id]["Cases"][date] : 0;
        deaths = d.id in countries ? countries[d.id]["Deaths"][date] : 0;

        tip.style("visibility", "visible")
            .style("left", (d3.event.pageX + 20) + "px")
            .style("top", (d3.event.pageY - 10) + "px")
        tip.html("<b>" + c.name + "</b><br />" + cases + " cases<br />" + deaths + " deaths<!--<br />##.### per million-->");
    });
    bars.on("click", function (d) {
        d3.select(this).raise()
        selectedCountry = d.id;
        d3.event.stopPropagation();

        refreshmap();
        refreshtimegraph();
    });
}

function refreshmap() {
    var bars = svg.selectAll("g.countries").selectAll("path");

    bars.attr("fill", function (d) {
        // Pull data for this country
        d.total = d.id in countries ? Math.sqrt(countries[d.id]["Cases"][date]) : 0;
        // Set the color
        return colorScale(d.total);
    }).style("fill-opacity", d => selectedCountry == d.id || selectedCountry == '' ? 1.0 : 0.4)
        .style("stroke", d => selectedCountry == d.id ? "#fff" : "#fff")
        .style("stroke-width", d => selectedCountry == d.id ? "1px" : "1px");

    var dt = new Date(2020, 0, 6);
    dt.setDate(dt.getDate() + date);
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    dateText.text(months[dt.getMonth()] + ' ' + dt.getDate());
}

function drawtimegraph() {
    // set the ranges
    var x = d3.scaleTime().range([100, width-100]);

    // x.domain(d3.extent(lineData, function (d) { return d.date; }));
    x.domain([0, 124]);
    var y = d3.scaleLog().range([height, height-300]);
    y.domain([1, 1000000]);

    // y.domain([d3.min(lineData, function (d) { return d.nps; }) - 5, 100]);
    var valuelines = {};

    ['New Cases'].forEach(stat => {
        var graph = svg.append("g").attr("id", stat)
        // console.log(item);
        Object.keys(countries).forEach(countryid => {
            c = countries[countryid];

            // linedata[stat][countryid] = []
            lineData = []
            c[stat].forEach((x, i) => {
                lineData.push({ date: i, value: 1+x });
                // linedata[stat][countryid].push({ i, x });
            });

            // console.log(lineData);
            valuelines[countryid] = d3.line()
            // .defined(d => !isNaN(d.date) && !isNaN(d.value))
            .x(function (d) { return x(d.date); })
            .y(function (d) { return y(d.value); })
            .curve(d3.curveMonotoneX);
            console.log(valuelines[countryid]);
            graph.append("path")
                .data([lineData])
                .attr("class", "line")
                .attr("id", 'stat'+countryid)
                .attr("d", valuelines[countryid])
                .style("stroke", "#eee");
        });
    });

    //  var xAxis_woy = d3.axisBottom(x).tickFormat(d3.timeFormat("Week %V"));
    var xAxis_woy = d3.axisBottom(x).ticks(11).tickFormat(d3.timeFormat("%y-%b-%d")).tickValues(lineData.map(d => d.date));

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis_woy);

    svg.append("g").call(d3.axisLeft(y));
}

function refreshtimegraph() {
    // var lines = svg.selectAll("g").selectAll("path");
    // lines.filter(e => (d.id === selectedCountry))
    // .style("stroke", "green")
    // .style("stroke-width", "3px");

    // svg.selectAll("#", d => {console.log(d);return "red";})
    // selectedCountry
    Object.keys(countries).forEach(countryid => {
        d3.select("#" + 'stat' + countryid)
        .style("stroke", countryid == selectedCountry ? "red" : "#eee");
        
    });
    d3.select("#" + 'stat' + selectedCountry).raise();
    // bringToTopofSVG(d3.select("#" + 'stat' + selectedCountry));
}
/*
    // }
    // foreach(country in countries) {
    // foreach(stat in ['Cases', 'Deaths']) {
    // console.log(stat);
    // }
    // linedata[country.id] = {"Cases": }
    // var lineData = {[]};       console.log(stat);

    // for    country["Cases"]
    // lineData = country["Cases"]



    Object.keys(linedata["Cases"]).forEach(function (item) {
    linedata["Cases"].forEach([countryid]) {




    // }
    //  Add the Y Axis
    //
    */