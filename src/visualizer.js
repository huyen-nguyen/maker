function visualize(dataForVis){
	// example use
	d3.select("#canvas").selectAll("*").remove()
	let svg = d3.select("#canvas").append('svg')
		.attr("width", 2200)
		.attr("height", 800);

	let config = {
		topWord: 10,
		minFont: 10,
		maxFont: 20,
		tickFont: 12,
		legendFont: 12,
		curve: d3.curveMonotoneX
	};
	// console.log(JSON.parse(JSON.stringify(dataForVis)))

	wordstream(svg, dataForVis, config)
}
