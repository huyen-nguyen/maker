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

// button to choose file
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
// const outputTextContent = document.getElementById('fileContent');
filepicker.addEventListener("change", handleFiles);

function handleFiles(event) {
	const files = event.target.files;

	const file = files[0];
	const signature = file.type;
	let data, type;

	output.textContent = '';
	// output.textContent += `File name: ${file.name}: ${file.type || 'unknown'}\n`;
	output.textContent += `File name: ${file.name}, size: ${updateSize(files) || 'unknown'}\n`;

	// ---------
	var reader = new FileReader();

	reader.onload = function (e) {
		// TODO: (1) store raw user input in `data`
		const rawData = e.target.result;
		console.log(rawData);

		// TODO: (2b-1) reading it
		// find file type based on signature
		let typeIndex = Object.keys(fileSignature).indexOf(signature);

		if (typeIndex >= 0){
			type = fileSignature[signature];
			console.log(type)
			data = window[type + 'Read'](rawData);
			console.log(data);
		}
		else {
			console.log("Wrong input type!")
		}

		// show data on screen



		// ask user whether want to use this parsing of data or other specification
	};
	reader.readAsText(file);

}

// TODO: (2b) Try to read input file using different parsers. List functions here.

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
