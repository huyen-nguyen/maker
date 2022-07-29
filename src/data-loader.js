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
const fileType = ['csv', 'tsv', 'txt', 'xls', 'xlsx']	// file types
const delimiter = [] // (for txt file)

// load local file
const filepicker = document.getElementById("filepicker");
const output = document.getElementById('output');
filepicker.addEventListener("change", handleFiles);

function handleFiles(event) {
	const files = event.target.files;
	output.textContent = '';

	for (const file of files) {
		output.textContent += `${file.name}: ${file.type || 'unknown'}\n`;
		// TODO: (2a): detect file type, assume the extension is correct.
		//  if not corerct, then try to use all other different parsers.

	}
	// ---------

	const fileList = this.files; /* now you can work with the file list */
	var file = fileList[0];
	var reader = new FileReader();

	// TODO: (1) store raw user input in `data`
	reader.onload = function (e) {
		let loading = d3.select('body').append('div').attr('id', 'loading');
		// loading.append('img')
		// 	.attr('id', 'loading-image')
		// 	.attr('src', 'images/squareloader2.gif')
		// 	.attr("height", "200")
		// 	.attr("height", "200");

		console.log(e.target.result);
		// debugger

		// TODO: (2b-1) reading it
		let data = d3.csvParse(e.target.result).map(d => d);

		console.log(data)
	};
	reader.readAsText(file);

	console.log(reader);
	console.log(file);

	// TODO: (2b) Try to read input file using different parsers. List functions here.
	
	function csvRead(e){
		return d3.csvParse(e.target.result).map(d => d);
	}
}
