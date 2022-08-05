const config = {
	topWord: 40,
	minFont: 12,
	maxFont: 25,
	tickFont: 12,
	legendFont: 12,
	curve: d3.curveMonotoneX
};

let firstTimeFlag = false;
let widthUpdateFlag = false, heightUpdateFlag = false;
let svg = d3.select("#canvas").append('svg').attr("id", "mainSVG")
d3.select("#canvas").style("max-width", window.innerWidth + "px")

function visualize(dataForVis){
	// example use
	d3.select("#mainSVG").selectAll("*").remove()

	if (!widthUpdateFlag){
		svg.attr("width", Math.max(150*dataForVis.length, 1200))}

	if (!heightUpdateFlag){
			svg.attr("height", 200* Object.keys(dataForVis[0].words).length);}

	wordstream(svg, dataForVis, config)

	if (!firstTimeFlag){
		firstTimeFlag = true;
		panelForUpdate()
	}
}

function panelForUpdate(){
	// need to create a grid here
	const panel1 = d3.select("#panel-1")
	const div1 = panel1.append("div").attr("class", "my-3"), div2 = panel1.append("div").attr("class", "my-3"),div3 = panel1.append("div").attr("class", "my-3")
	div1.append("text")
		.html("Minimum font-size: ");

	div1
		.append("input")
		.style("width", "50px")
		.attr("id", "minFontValue")
		.attr("type", "number")
		.attr("value", config.minFont)
		.attr("step", "1")
		.on("change", function () {
			config.minFont = this.value;
			visualize(dataForVis)
		});

	div2.append("text")
		.html("Maximum font-size: ");

	div2
		.append("input")
		.style("width", "50px")
		.attr("id", "maxFontValue")
		.attr("type", "number")
		.attr("value", config.maxFont)
		.attr("step", "1")
		.on("change", function () {
			config.maxFont = this.value;
			visualize(dataForVis)
		});

	div3.append("text")
		.html("Top # words: ");

	div3
		.append("input")
		.style("width", "50px")
		.attr("id", "topWordValue")
		.attr("type", "number")
		.attr("value", config.topWord)
		.attr("step", "1")
		.on("change", function () {
			config.topWord = this.value;
			visualize(dataForVis)
		});

	// middle
	const panel3 = d3.select("#panel-3")
	const div4 = panel3.append("div").attr("class", "my-3"), div5 = panel3.append("div").attr("class", "my-3")

	div4.append("text")
		.html("Canvas width: ");

	div4
		.append("input")
		.style("width", "80px")
		.attr("id", "widthValue")
		.attr("type", "number")
		.attr("value", +svg.attr("width"))
		.attr("step", "50")
		.on("change", function () {
			svg.attr("width", this.value)
			widthUpdateFlag = true;
			visualize(dataForVis)
		});

	div5.append("text")
		.html("Canvas height: ");

	div5
		.append("input")
		.style("width", "80px")
		.attr("id", "heightValue")
		.attr("type", "number")
		.attr("value", +svg.attr("height"))
		.attr("step", "50")
		.on("change", function () {
			svg.attr("height", this.value)
			heightUpdateFlag = true;
			visualize(dataForVis)
		});

}
