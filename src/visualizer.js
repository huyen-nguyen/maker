function visualize(dataForVis){
	console.log(JSON.parse(JSON.stringify(dataForVis)))

	// example use
	d3.select("#canvas").selectAll("*").remove()
	let svg = d3.select("#canvas").append('svg')
		.attr("width", Math.max(150*dataForVis.length, 1200))
		.attr("height", 200* Object.keys(dataForVis[0].words).length);

	let config = {
		topWord: 40,
		minFont: 10,
		maxFont: 20,
		tickFont: 12,
		legendFont: 12,
		curve: d3.curveMonotoneX
	};

	wordstream(svg, dataForVis, config)
	console.log(dataForVis)
}
