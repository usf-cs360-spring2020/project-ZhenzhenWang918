// The svg
var svg = d3.select("svg"),
    width = +svg.attr("width"),
    height = +svg.attr("height");

var topo;
var countries;
var linedata = { "Cases": {}, "Deaths": {} };
var selectedCountry = '';
var hoveredCountry = '';
var date = 0;

const tip = d3.select("body").append("div").attr("id", "tooltip")
    .style("padding", "9px")
    .style("background", "#fff")
    .style("border", "3px solid #999")
    .style("border-radius", "10px")
    .style("visibility", "hidden")
    .style("position", "absolute");

var dateText = svg.append("text")
    .attr("dx", width/2)
    // .attr("dx", 390)
    .attr("dy", 540)
    .attr("font-size", 30)
    .attr("text-anchor", "middle");


// Timegraph
// set the ranges
var x = d3.scaleTime().range([100, width - 100]);

// x.domain(d3.extent(lineData, function (d) { return d.date; }));
x.domain([0, 124]);
var y = d3.scaleLog().range([height - 20, height - 300]);
y.domain([1, 1000000]);

// y.domain([d3.min(lineData, function (d) { return d.nps; }) - 5, 100]);
var valueline = d3.line()
    // .defined(d => !isNaN(d.date) && !isNaN(d.value))
    .x(function (d) { return x(d.date); })
    .y(function (d) { return y(d.value); })
    .curve(d3.curveLinear);
// .curve(d3.curveMonotoneX);

// Data and color scale
var colorScheme = d3.schemeReds[6];
colorScheme.unshift("#eee")
var colorScale = d3.scaleLog()
    .domain([1, 10, 100, 1000, 10000, 100000, 1000000])
    .range(colorScheme);

// Background handlers
svg.on("click", function (d) {
    selectedCountry = '';
    refreshmap();
    refreshtimegraph();
});

var lastMouseMove = 0;
svg.on("mousemove", function (d) {
    if (Date.now() - lastMouseMove > 45) {
        localCoord = d3.mouse(this);
        if (localCoord[1] > 500) {
            date = Math.max(0, Math.min(123, Math.round(x.invert(localCoord[0]))));
            refreshmap();
            refreshtimegraph();
        }
        // Do stuff
        lastMouseMove = Date.now();
    }
});

d3.json("worldmap2.geojson").then(function (t) {
    d3.json("wrangled.json").then(function (c) {
        topo = t;
        countries = c;

        drawmap();
        drawtimegraph();
    });
});

function drawmap() {
    // Map and Projection
    var projection = d3.geoNaturalEarth()
        // // .scale(200)
        // .translate([390, 280])
        // .translate([626, 280])
        .scale(240)
        .translate([600, 320])
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
        console.log('mouseenter')
        d3.select(this).raise();

        hoveredCountry = d.id;

        bars.filter(e => (d.id === e.id))
            .style("stroke", "#6e4")
            .style("stroke-width", "3px");
        refreshtimegraph();

        if (!(d.id in countries))
            return;
        c = countries[d.id];
        cases = c["Cases"][date];
        deaths = c["Deaths"][date];

        tip.style("visibility", "visible")
            .style("left", (d3.event.pageX + 50) + "px")
            .style("top", (d3.event.pageY - 10) + "px")
            .html("<b>" + c.name + "</b><br />"
                + cases + " cases<br />"
                + deaths + " deaths<br />"
                // + "##.### per million"
            );
    });
    bars.on("mouseout", function (d) {
        console.log('mouseout')
        hoveredCountry = '';
        tip.style("visibility", "hidden");
        // refreshmap();
        bars.filter(e => (d.id === e.id))
            .style("stroke", d => d.id == hoveredCountry
                ? "#6e4"
                : d.id == selectedCountry
                    ? "#fff"
                    : "#fff")
            .style("stroke-width", d => selectedCountry == d.id ? "1px" : "1px");
        refreshtimegraph();
    });
    bars.on("click", function (d) {
        console.log('c')
        d3.select(this).raise();
        selectedCountry = d.id;
        d3.event.stopPropagation();

        refreshmap();
        refreshtimegraph();
    });

    refreshmap();
}

function refreshmap() {
    var bars = svg.selectAll("g.countries").selectAll("path");

    bars.attr("fill", function (d) {
        // Pull data for this country
        d.total = 1 + (d.id in countries ? countries[d.id]["Cases"][date] : 0);
        // Set the color
        return colorScale(d.total);
    }).style("fill-opacity", d => selectedCountry == d.id || selectedCountry == '' ? 1.0 : 0.4)
        .style("stroke", d => d.id == hoveredCountry
            ? "#6e4"
            : d.id == selectedCountry
                ? "#fff"
                : "#fff")
    // .style("stroke-width", d => selectedCountry == d.id ? "1px" : "1px");

    var dt = new Date(2020, 0, 6);
    dt.setDate(dt.getDate() + date);
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    dateText.text(months[dt.getMonth()] + ' ' + dt.getDate());
}


function drawtimegraph() {

    ['New Cases'].forEach(stat => {
        var graph = svg.append("g")
            .attr("class", "timegraph")
            .attr("id", stat)

        Object.keys(countries).forEach(countryid => {
            c = countries[countryid];

            lineData = []
            c[stat].forEach((x, i) => {
                lineData.push({ date: i, value: 1 + x });
            });

            graph.append("path")
                .data([{ id: countryid }])
                .attr("class", "line")
                .attr("d", valueline(lineData));
        });
    });

    svg.append("path")
        .data([[]])
        .attr("class", "timeindicator")
        .attr("stroke", "#ace")
        .attr("stroke-width", "3px")
        .attr("d", valueline);

    //  var xAxis_woy = d3.axisBottom(x).tickFormat(d3.timeFormat("Week %V"));
    var xAxis_woy = d3.axisBottom(x).ticks(11).tickFormat(d3.timeFormat("%y-%b-%d")).tickValues(lineData.map(d => d.date));

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis_woy);

    svg.append("g").call(d3.axisLeft(y));


    refreshtimegraph();
}

function palette(id) {
    def = d3.hsl(d3.rgb(...countries[id].palette))
    if (id == hoveredCountry)
        return def;

    // console.log(id)
    // console.log(countries)

    if (id != selectedCountry) {
        def.s *= .5;
        def.l = def.l * .4 + .6;
    }

    return def;
}

function refreshtimegraph() {
    var curves = svg.selectAll("g.timegraph").selectAll("path");
    curves.style("stroke", d => palette(d.id))
        .style("stroke-width", d => (d.id == selectedCountry
            ? "3px"
            : d.id == hoveredCountry
                ? "3px"
                : "1px"));
    curves.filter(d => (d.id === selectedCountry || d.id === hoveredCountry)).raise();

    svg.selectAll("path.timeindicator")
        .data([[{ date: date, value: 1 }, { date: date, value: 100000 }]])
        .attr("d", valueline);
}
