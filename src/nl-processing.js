//get the wikipedia plaintext with wtf_wikipedia
let text = "Netflix, Inc. is an American subscription streaming service and production company based in Los Gatos," +
	" California. Launched on August 29, 1997, it offers a film and television series and libraries through" +
	" distribution" +
	" deals as well as its own productions and library, known as Netflix Originals."
//get all the nouns from the text
let nouns = nlp(text).normalize({plurals:false, parentheses:true, possessives:true, honorifics:true}).nouns()
//sort them by frequency
console.log(nouns.out('topk'))

d3.tsv("data/maker_Cards_Fries_Text.tsv", function (err, dataForVis){
// d3.csv("data/maker_init-journal-data.csv", function (err, dataForVis){
	console.log(dataForVis)

	// group by time
	let dataGroupedByTime = d3.nest().key(d => d.Time)
		.entries(dataForVis)
		.map(d => {return {time: d.key, text_concated: d.values.map(d => d.Text).join(" ")}})

	dataGroupedByTime.forEach(row => {
		let text = row.Text;
		// debugger
	})
})

function extractWords(){

}

function visualize(dataForVis){
	console.log(dataForVis)
}

function POS_tag(){

}

/*
* nlp(text).out('tags') // output of part-of-speech tags for each term
* nlp(text).match('#Adjective').out('tags')
*
* doc = nlp(text)
* doc.json() --- split by sentences
*
* doc.compute('root') //compute all roots
* doc.json()[0].terms.map(t=>t.root || t.normal) --- lemma stuff [!!!]
*
* doc.nouns().json() // all noun chunks, terms tagged as a Noun
*
* doc.verbs().json() // all terms tagged as a Verb
*
* doc.normalize()   // remove comma etc. DON"T
*
* doc.places().normalize().text() // remove punctuation
*
* doc.topics().normalize().json()
*
* */
