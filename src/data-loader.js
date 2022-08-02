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
let fileLoadedFlag = false;

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
const loading = document.getElementById('loading')

filepicker.addEventListener("change", handleFiles);
filepicker.addEventListener("click", () => {
});
visTrigger.addEventListener("click", () => {
	if (fileLoadedFlag){
		visualize()
	}
	else {
		alertFile.innerHTML = "Select a file first!";
	}
})

function handleFiles(event) {
	d3.select("#loading").style("display", "inline-block")

	const files = event.target.files;
	const file = files[0];
	const signature = file.type;
	let rawDataForRender, type;

	alertFile.textContent = '';
	alertFile.textContent += `File name: ${file.name} | size: ${updateSize(files) || 'unknown'}\n`;

	d3.select("#jsonTable").remove();

	// ---------
	var reader = new FileReader();

	reader.onload = function (e) {
		// *store* raw user input in `data`
		const rawData = e.target.result;
		console.log(rawData);
		fileLoadedFlag = true;

		// *read it*
		// find file type based on signature
		let typeIndex = Object.keys(fileSignature).indexOf(signature);

		if (typeIndex >= 0){
			type = fileSignature[signature];
			rawDataForRender = window[type + 'Read'](rawData, true);
		}
		else {
			console.log("Wrong input type!")
		}

		// render preview
		createTable(rawDataForRender);
		console.log(rawDataForRender);

		// ask user whether want to use this parsing of data or other specification
	};
	reader.readAsText(file);

}

// Read input file using different parsers. List functions here.

function csvRead(rawData, raw){
	return d3.csvParse(rawData).map(d => {
		if (raw){
			return d;
		}
		return {
			Time: d['Time'],
			Text: d['Text'],
		}
	});
}
function tsvRead(rawData, raw){
	return d3.tsvParse(rawData).map(d => {
		if (raw){
			return d;
		}
		return {
			Time: d['Time'],
			Text: d['Text'],
		}
	});
}

function updateSize(files) {
	let nBytes = 0,
		oFiles = files,
		nFiles = oFiles.length;
	for (let nFileId = 0; nFileId < nFiles; nFileId++) {
		nBytes += oFiles[nFileId].size;
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

function renderTabularData(){

}

function visualize(){

}

function createTable(object){
	d3.select("#loading").style("display", "none")
	
	$('#preview-data').append('<table id="jsonTable" class="table"><thead><tr></tr></thead><tbody></tbody></table>');

	$.each(Object.keys(object[0]), function(index, key){
		$('#jsonTable thead tr').append('<th>' + key + '</th>');
	});
	$.each(object, function(index, jsonObject){
		if(Object.keys(jsonObject).length > 0){
			var tableRow = '<tr>';
			$.each(Object.keys(jsonObject), function(i, key){
				tableRow += '<td>' + jsonObject[key] + '</td>';
			});
			tableRow += "</tr>";
			$('#jsonTable tbody').append(tableRow);
		}
	});
}
