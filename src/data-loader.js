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
let dataForNLP, dataForVis;
let categoryType = "pos"
let repType = 'frequency'
let properties, type;

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
const fileInfo = document.getElementById('file-info');
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

filepicker.addEventListener("change", handleFiles, false);

visTrigger.addEventListener("click", () => {
	checkInput();

	// else if (!fieldFlag) {
	// 	visTrigger.setAttribute("href", "#");
	// 	return
	//  else {
	// 	visualize(dataForVis);
	// 	visTrigger.setAttribute("href", "#wordstream");
	// }
})

d3.select("#textColName").on("change", function () {
	console.log(this.value)
	checkInput();
})

d3.select("#timeColName").on("change", function () {
	console.log(this.value)
	checkInput();
})

function checkInput() {
	if (!fileLoadedFlag) {
		alertFile.innerHTML = '<span class="text-warning">Select a file first!<br>&zwnj;</span>';
		visTrigger.setAttribute("href", "#");
	} else {
		alertFile.innerHTML = '';
		let currentTimeCol = document.getElementById('timeColName').value,
			currentTextCol = document.getElementById('textColName').value;

		if (currentTimeCol === '') {
			alertFile.innerHTML += '<span class="text-warning">• Missing <code>time</code> column' +
				' name.<br>&zwnj;</span>';
		}
		else if (!properties.includes(currentTimeCol)) {
			alertFile.innerHTML += '<span class="text-warning">• No column named <text class="text-white"><b>' + currentTimeCol + '</b></text>' +
				'. <br></span>';
		}

		if (currentTextCol === '') {
			alertFile.innerHTML += '<span class="text-warning">• Missing <code>text</code> column' +
				' name.<br>&zwnj;</span>';
		} else if (!properties.includes(currentTextCol)) {
			alertFile.innerHTML += '<span class="text-warning">• No column named <text class="text-white"><b>' + currentTextCol + '</b></text>' +
				'. <br></span>';
		}
	}
}

function handleFiles(event) {
	loading.style("display", "inline-block")
	alertField.style("display", "none")

	const file = event.target.files[0];
	const signature = file.type;
	let rawDataForRender, type;

	fileInfo.innerHTML = '';
	fileInfo.innerHTML += 'File name: ' + file.name + '<br/>' + 'Size: ' + (updateSize(file) ? updateSize(file) : 'unknown');

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
		// checkInputFields(rawDataForRender);

		dataForNLP = window[type + 'Read'](rawData, false);  // retrieve time and text columns out of that data
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
		d3.csv(path, function (err, rawDataForRenderIn) {
			fileInfo.innerHTML = '';
			fileInfo.innerHTML += 'File name: maker_init-journal-data.csv' + '<br/>' + 'Size: 192.012 KiB (196620 bytes)';
			alertFile.innerHTML = ''
			doSamples(rawDataForRenderIn, 'Week', 'Text')
		})
	} else {
		d3.tsv(path, function (err, rawDataForRenderIn) {
			fileInfo.innerHTML = '';
			fileInfo.innerHTML += 'File name: maker_Cards_Fries_Text.tsv' + '<br/>' + 'Size: 1.434 MiB (1503230 bytes)';
			alertFile.innerHTML = ''
			doSamples(rawDataForRenderIn, 'Year', 'Title')
		})
	}

	function doSamples(rawDataForRender, timeCol, textCol) {
		fileLoadedFlag = true;  // load successfully
		d3.select("#timeColName").attr("value", timeCol)
		d3.select("#textColName").attr("value", textCol)
		// render preview
		createTable(rawDataForRender);
		// checkInputFields(rawDataForRender);

		dataForNLP = rawDataForRender.map(d => {
			return {
				Time: d[timeCol],
				Text: d[textCol],
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
