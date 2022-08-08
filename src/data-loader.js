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
let newDataLoadFlag = false; // reset on loading new data
let dataForNLP, dataForVis;
let categoryType = "pos"
let repType = 'frequency'

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
const previewData = document.getElementById('preview-data');
const loading = d3.select("#loading");
const alertField = d3.select("#alert-field");
const sample_fries = d3.select("#pathway")
	.on("click", function () {
		handleSamples("data/maker_Cards_Fries_Text.tsv")
	});
d3.select("#education")
	.on("click", function () {
		handleSamples("data/maker_init-journal-data.csv")
	});

const sample_education = d3.select("#vast")
	.on("click", function () {
		handleSamples("data/evenyint.csv")
	});

filepicker.addEventListener("change", handleFiles, false);

visTrigger.addEventListener("click", () => {
	if (!fileLoadedFlag) {
		alertFile.innerHTML = '<span class="text-warning">Select a file first!<br>&zwnj;</span>';
		visTrigger.setAttribute("href", "#");
		return
	} else if (!fieldFlag) {
		visTrigger.setAttribute("href", "#");
		return
	} else {
		visualize(dataForVis);
		visTrigger.setAttribute("href", "#wordstream");
	}
})

function handleFiles(event) {
	loading.style("display", "inline-block")
	alertField.style("display", "none")

	const file = event.target.files[0];
	const signature = file.type;
	let rawDataForRender, type;

	alertFile.innerHTML = '';
	alertFile.innerHTML += '<span>File name: ' + file.name + '<br/>' + 'Size: ' + (updateSize(file) ? updateSize(file) : 'unknown') + '</span>';

	d3.select("#jsonTable").remove();

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
		checkInputFields(rawDataForRender);

		dataForNLP = window[type + 'Read'](rawData, false);
		dataForVis = textProcessing(dataForNLP);

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

	if (path.toLowerCase().endsWith("csv")) {
		d3.csv(path, function (err, rawDataForRender) {
			alertFile.innerHTML = '';
			alertFile.innerHTML += '<span>File name: maker_init-journal-data.csv' + '<br/>' + 'Size: 192.012 KiB (196620 bytes)</span>';
			doSamples(rawDataForRender)
		})
	} else {
		d3.tsv(path, function (err, rawDataForRender) {
			alertFile.innerHTML = '';
			alertFile.innerHTML += '<span>File name: maker_Cards_Fries_Text.tsv' + '<br/>' + 'Size: 1.434 MiB (1503230 bytes)</span>';
			doSamples(rawDataForRender)
		})
	}

	function doSamples(rawDataForRender) {
		fileLoadedFlag = true;  // load successfully
		// render preview
		createTable(rawDataForRender);
		checkInputFields(rawDataForRender);

		dataForNLP = rawDataForRender.map(d => {
			return {
				Time: d['Time'],
				Text: d['Text'],
			}
		});
		dataForVis = textProcessing(dataForNLP);
	}
}


// Read input file using different parsers. List functions here.

function csvRead(rawData, raw) {
	return d3.csvParse(rawData).map(d => {
		if (raw) {
			return d;
		}
		return {
			Time: d['Time'],
			Text: d['Text'],
		}
	});
}

function tsvRead(rawData, raw) {
	return d3.tsvParse(rawData).map(d => {
		if (raw) {
			return d;
		}
		return {
			Time: d['Time'],
			Text: d['Text'],
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
