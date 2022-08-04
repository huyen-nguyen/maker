function visualize(dataForVis){
	// example use
	d3.select("#canvas").selectAll("*").remove()
	let svg = d3.select("#canvas").append('svg')
		.attr("width", 2200)
		.attr("height", 600);

	let config = {
		topWord: 10,
		minFont: 10,
		maxFont: 20,
		tickFont: 12,
		legendFont: 12,
		curve: d3.curveMonotoneX
	};
	// console.log(JSON.parse(JSON.stringify(dataForVis)))

	// d3.json("data/data.json", function (error, data) {
	// 	console.log(JSON.parse(JSON.stringify(data)))
	// 	wordstream(svg, data, config)
	// });
		console.log(JSON.parse(JSON.stringify(dataForVis)))

	wordstream(svg, dataForVis, config)
}
