const inputElement = document.getElementById('uploadInput');
inputElement.addEventListener("change", handleFiles, false);

// TODO: reformat output to look like a table
const output = document.getElementById('output');

function handleFiles() {
	const fileList = this.files; /* now you can work with the file list */
	const file = fileList[0];
	const type = file.type;


	const reader = new FileReader();

	if (type.includes('xls')){
		// read xls/xlsx files
	}
	else {
		reader.addEventListener("load", () => {
			// this will then display a text file
			output.innerText = reader.result; // this is the data
		}, false);

		// if (file) {
		// 	reader.readAsText(file);
		// }
	}

}



document.getElementById("uploadInput").addEventListener("change", updateSize, false);
