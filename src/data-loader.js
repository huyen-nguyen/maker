/**
A. Logic to process input type:

- When user upload data, we (1) store the raw user input at first
- Then we (2) try to read it using different parsers (esp. json and csv)
    - If read successful, we (3) go process text
	- If read unsuccessful, we (4) announce that data type can't be read, and (5) ask user to define separator

 B. Format
 |----------|   Time    |   Text    |----------|

 C. Signatures
 csv: text/csv
 tsv: text/tab-separated-values
 txt: text/plain
 xls: application/vnd.ms-excel
 xlsx: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet

 PIPELINE:
 - Load data
 - Read data
 - Show the data table

 */
// input file specifications
const delimiter = [] // (for txt file)
let fileLoadedFlag = false, fieldFlag = false;
let sampleFlag = false;
let dataForRender, dataForNLP, dataForVis;
let categoryType = "pos"
let repType = 'frequency'
let properties, type;
let timeCol, textCol;

// ------- button to choose file, instead of the default -------
const fileSelect = document.getElementById("fileSelect"),
	fileElem = document.getElementById("fileElem");

fileSelect.addEventListener("click", function (e) {
	if (fileElem) {
		fileElem.click();
	}
}, false);

// load local file
const filepicker = document.getElementById("fileElem");
const output = document.getElementById('output');
const visTrigger = document.getElementById('vis-trigger');
const alertFile = document.getElementById('alert-file');
const firstRow = document.getElementById('first-row'), secondRow = document.getElementById('second-row');
const fileInfo = document.getElementById('file-info');
const previewData = document.getElementById('preview-data');
const loading = d3.select("#loading");
const wsLoading = d3.select("#ws-loading");
const alertField = d3.select("#alert-field");
const sample_fries = d3.select("#pathway")
	.on("click", function () {
		sampleFlag = true;
		handleSamples("data/protein-pathway-data.tsv")
	});
d3.select("#education")
	.on("click", function () {
		sampleFlag = true;
		handleSamples("data/educational-assessment-journal-data.csv")
	});

filepicker.addEventListener("change", handleFiles, false);

d3.select("#vis-trigger")
	.on("click", () => {
		let result = checkInput();
		d3.select("#ws-placeholder-div").remove()
		if (!!result){
			timeCol = result.Time;
			textCol = result.Text;

			if (sampleFlag){
				dataForNLP = dataForRender.map(d => {
					return {
						Time: d[timeCol],
						Text: d[textCol],
					}
				});
			}
			else {
				dataForNLP = window[type + 'Read'](dataForRender, false);  // retrieve time and text columns out of that data
			}
			showLoader()
			const myTimeout = setTimeout(myGreeting, 100);
			visTrigger.setAttribute("href", "#wordstream");
			function myGreeting() {
				dataForVis = textProcessing(dataForNLP);
				visualize(dataForVis);
			}
		}
		else{
			visTrigger.setAttribute("href", "#");
		}
	})

// visTrigger.addEventListener("click", () => {
// 	let result = checkInput();
// 	if (!!result){
// 		timeCol = result.Time;
// 		textCol = result.Text;
//
// 		if (sampleFlag){
// 			dataForNLP = dataForRender.map(d => {
// 				return {
// 					Time: d[timeCol],
// 					Text: d[textCol],
// 				}
// 			});
// 		}
// 		else {
// 			dataForNLP = window[type + 'Read'](dataForRender, false);  // retrieve time and text columns out of that data
// 		}
// 		showVis()
// 		showLoader();console.log(new Date);
// 		visTrigger.setAttribute("href", "#wordstream");
// 		dataForVis = textProcessing(dataForNLP);
// 		visualize(dataForVis);
// 	}
// 	else{
// 		visTrigger.setAttribute("href", "#");
// 	}
// })

d3.select("#textColName").on("change", function () {
	hideVis()
	checkInput();
})

d3.select("#timeColName").on("change", function () {
	hideVis()
	checkInput();
})

function checkInput() {
	if (!fileLoadedFlag) {
		firstRow.innerHTML = 'Select a file first!'
		// visTrigger.setAttribute("href", "#");
		return false;
	} else {
		resetAlertFile()
		let currentTimeCol = document.getElementById('timeColName').value,
			currentTextCol = document.getElementById('textColName').value;

		if (currentTimeCol === '') {
			firstRow.innerHTML = '• Missing <code>time</code> column name.';
		}
		else if (!properties.includes(currentTimeCol)) {
			firstRow.innerHTML += '• No column named <b>' + currentTimeCol + '</b>.';
		}

		if (currentTextCol === '') {
			secondRow.innerHTML = '• Missing <code>text</code> column name.';

		} else if (!properties.includes(currentTextCol)) {
			secondRow.innerHTML += '• No column named <b>' + currentTextCol + '</b>.';
		}

		// if both fields exist
		if (properties.includes(currentTimeCol) && properties.includes(currentTextCol)){
			return {
				Time: currentTimeCol,
				Text: currentTextCol,
			}
		}
		return false;
	}
}

function handleFiles(event) {
	loading.style("display", "inline-block")
	alertField.style("display", "none")

	const file = event.target.files[0];
	const signature = file.type;
	let rawDataForRender;

	fileInfo.innerHTML = '';
	fileInfo.innerHTML += 'File name: ' + file.name + '<br/>' + 'Size: ' + (updateSize(file) ? updateSize(file) : 'unknown');

	d3.select("#jsonTable").remove();
	hideVis();
	resetInputFields()

	// ---------
	var reader = new FileReader();

	reader.onload = function (e) {
		// *store* raw user input in `data`
		const rawData = e.target.result;
		fileLoadedFlag = true;  // load successfully
		widthUpdateFlag = false;
		heightUpdateFlag = false;  // reset flags
		// *read it*
		// find file type based on signature
		let typeIndex = Object.keys(fileSignature).indexOf(signature);

		if (typeIndex >= 0) {
			type = fileSignature[signature];
			rawDataForRender = window[type + 'Read'](rawData, true);
		} else {
			console.log("Wrong input type!")
		}

		// render preview
		createTable(rawDataForRender);
		dataForRender = rawDataForRender
		// TODO: ask user whether want to use this parsing of data or other specification
	};
	reader.readAsText(file);
}

function handleSamples(path) {
	loading.style("display", "inline-block")
	alertField.style("display", "none")
	d3.select("#jsonTable").remove();
	widthUpdateFlag = false;
	heightUpdateFlag = false;  // reset flags
	hideVis()

	if (path.toLowerCase().endsWith("csv")) {
		d3.csv(path, function (err, rawDataForRenderIn) {
			fileInfo.innerHTML = '';
			fileInfo.innerHTML += 'File name: educational-assessment-journal-data.csv' + '<br/>' + 'Size: 192.012 KiB (196620 bytes)';
			resetAlertFile()
			doSamples(rawDataForRenderIn, 'Week', 'Text')
		})
	} else {
		d3.tsv(path, function (err, rawDataForRenderIn) {
			fileInfo.innerHTML = '';
			fileInfo.innerHTML += 'File name: protein-pathway-data.tsv' + '<br/>' + 'Size: 1.434 MiB (1503230 bytes)';
			resetAlertFile()
			doSamples(rawDataForRenderIn, 'Year', 'Title')
		})
	}

	function doSamples(rawDataForRender, timeCol, textCol) {
		fileLoadedFlag = true;  // load successfully
		document.getElementById('timeColName').value = timeCol;     // initial loading
		document.getElementById('textColName').value = textCol;     // initial loading
		// render preview
		createTable(rawDataForRender);
		dataForRender = rawDataForRender;
	}
}

function resetAlertFile(){
	firstRow.innerHTML = '&zwnj;'
	secondRow.innerHTML = '&zwnj;'
}

function resetInputFields(){
	document.getElementById('timeColName').value = '';     // initial loading
	document.getElementById('textColName').value = '';     // initial loading
}

// Read input file using different parsers. List functions here.

function csvRead(rawData, raw) {
	return d3.csvParse(rawData).map(d => {
		if (raw) {
			return d;
		}
		return {
			Time: d[timeCol],
			Text: d[textCol],
		}
	});
}

function tsvRead(rawData, raw) {
	return d3.tsvParse(rawData).map(d => {
		if (raw) {
			return d;
		}
		return {
			Time: d[timeCol],
			Text: d[textCol],
		}
	});
}

function updateSize(file) {
	let nBytes = 0,
		nFiles = 1;
	for (let nFileId = 0; nFileId < nFiles; nFileId++) {
		nBytes += file.size;
	}
	let sOutput = nBytes + " bytes";
	// optional code for multiples approximation
	const aMultiples = ["KiB", "MiB", "GiB", "TiB", "PiB", "EiB", "ZiB", "YiB"];
	for (let nMultiple = 0, nApprox = nBytes / 1024; nApprox > 1; nApprox /= 1024, nMultiple++) {
		sOutput = nApprox.toFixed(3) + " " + aMultiples[nMultiple] + " (" + nBytes + " bytes)";
	}
	// end of optional code
	return sOutput;
}

function createTable(rawDataForRender) {
	loading.style("display", "none")
	properties = Object.keys(rawDataForRender[0])
	$('#preview-data')
		.append('<table id="jsonTable" class="table table-striped"><thead' +
			' class="thead-light"><tr></tr></thead><tbody></tbody></table>');

	$.each(Object.keys(rawDataForRender[0]), function (index, key) {
		$('#jsonTable thead tr').append('<th>' + key + '</th>');
	});
	$.each(rawDataForRender, function (index, jsonObject) {
		if (Object.keys(jsonObject).length > 0) {
			var tableRow = '<tr>';
			$.each(Object.keys(jsonObject), function (i, key) {
				tableRow += '<td>' + jsonObject[key] + '</td>';
			});
			tableRow += "</tr>";
			$('#jsonTable tbody').append(tableRow);
		}
	});

}
// this one is for when the fields are fixed to "Time" and "Text"
function checkInputFields(rawDataForRender) {
	const fields = Object.keys(rawDataForRender[0]);
	// case-sensitive
	if (!fields.includes("Time") || !fields.includes("Text")) {
		fieldFlag = false;
		alertField
			.style("display", "block")
			.html('<span>Missing columns named <code>Time</code> and/or' +
				' <code>Text</code>! (case-sensitive)</span>')
	} else {
		fieldFlag = true;
	}
}
