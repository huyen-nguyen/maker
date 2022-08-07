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
		svg.attr("width", Math.max(120*dataForVis.length, 1200))

		if (document.getElementById("widthValue")){
			document.getElementById("widthValue").value = +svg.attr("width") // update number on screen
		}
	}

	if (!heightUpdateFlag){
		svg.attr("height", 200* Object.keys(dataForVis[0].words).length);

		if (document.getElementById("heightValue")){
			document.getElementById("heightValue").value = +svg.attr("height") // update number on screen
		}
	}

	wordstream(svg, dataForVis, config)

	if (!firstTimeFlag){
		firstTimeFlag = true;
		panelForUpdate()
	}
}



function panelForUpdate(){
	// need to create a grid here
	d3.select("#panel-1").style("display", "block")
	const panel1 = d3.select("#panel-1")
	const div1 = panel1.append("div").attr("class", "mb-3"), div2 = panel1.append("div").attr("class", "mb-3"),div3 = panel1.append("div").attr("class", "mb-3")
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
		.attr("step", "5")
		.on("change", function () {
			config.topWord = this.value;
			visualize(dataForVis)
		});


	// width and height
	const div4 = panel1.append("div").attr("class", "mb-3"), div5 = panel1.append("div").attr("class", "mb-3")

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

	div4.append("text")
		.html(" px");

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

	div5.append("text")
		.html(" px");

	// NLP stuff

	d3.select("#panel-2").style("display", "block")

	d3.selectAll(("input[name='stack']")).on("change", function(){      // different NLP engine
		categoryType = this.value
		dataForVis = textProcessing(dataForNLP);
		visualize(dataForVis);
	});

	d3.select("#panel-3").style("display", "block")

	d3.selectAll(("input[name='metric']")).on("change", function(){     // different modes of representation
		repType = this.value
		let newData;
		if (repType === 'frequency'){
			newData = textProcessing(dataForNLP);
		}
		else if(repType === 'sudden'){
			newData = getSuddenData(dataForVis)
		}
		else if (repType === 'tfidf'){
			newData = getTFIDFData(dataForVis)
		}

		visualize(newData);
	});
}

function getSuddenData(dataOG){
	let data = JSON.parse(JSON.stringify(dataOG));
	eval(categoryType + "Categories").forEach(c => {
		data[0].words[c].forEach(w => {
			w.frequencyOG = w.frequency
			w.frequency = (w.frequencyOG+1)     // frequency = sudden;
		})

		for (let i = 1; i < data.length; i++){
			data[i].words[c].forEach(w => {
				w.frequencyOG = w.frequency

				// find the prev existent
				let prev = data[i-1].words[c].find(sword => sword.text === w.text);
				if (prev){
					w.frequency = (w.frequencyOG+1)/(prev.frequencyOG+1)
				}
				else{
					w.frequency = (w.frequencyOG+1)
				}
			})
		}
	})
	return data
}

function getTFIDFData(dataOG){
	let data = JSON.parse(JSON.stringify(dataOG));
	eval(categoryType + "Categories").forEach(c => {
		for (let i = 0; i < data.length; i++){
			data[i].words[c].forEach(w => {
				w.frequencyOG = w.frequency
				w.frequency = w.tfidf
			})
		}
	})
	return data
}
