//get the wikipedia plaintext with wtf_wikipedia
let text = "Netflix, Inc. is an American subscription streaming service and production company based in Los Gatos," +
	" California. Launched on August 29, 1997, it offers a film and television series and libraries through" +
	" distribution" +
	" deals as well as its own productions and library, known as Netflix Originals."
//get all the nouns from the text
// let nouns = nlp(text).normalize({plurals:false, parentheses:true, possessives:true, honorifics:true}).nouns()
//sort them by frequency
// console.log(nouns.out('topk'))
const topWords = 30;

// d3.tsv("data/maker_Cards_Fries_Text.tsv", function (err, dataForNLP){
// // d3.csv("data/maker_init-journal-data.csv", function (err, dataForNLP){
//
// 	// group by time
// 	let dataGroupedByTime = d3.nest().key(d => d.Time)
// 		.entries(dataForNLP)
// 		.map(d => {return {time: d.key, text_concated: d.values.map(d => d.Text).join(". ")}})
//
// 	let dataForVis = [];
// 	dataGroupedByTime.forEach(item => {
// 	// let item = dataGroupedByTime[0]
// 		let obj = {};
// 		obj.date = item.time;
// 		obj.words = {};
//
// 		let textBlock = item.text_concated;
// 		let doc = nlp(textBlock)
//
// 		doc.compute('root')
// 		const terms = doc.terms().json()
//
// 		posCategories.forEach(category => {
// 			obj.words[category] = d3.nest().key(d => (d.terms[0].root || d.terms[0].normal))
// 				.entries(terms.filter(t => (t.terms[0].tags.includes(category))))
// 				.sort((a,b) => b.values.length - a.values.length)
// 				.splice(0, topWords)
// 				.map(d => {return {text: d.key, frequency: d.values.length, topic: category}})
// 		})
//
// 	// 	const nouns = doc.nouns().out('freq')
// 	// 	//
// 	// 	const verbs = doc.verbs().out('freq')
// 	// 	//
// 	// 	const adjectives = makeUnique(doc.adjectives().out('freq'), "Adjective")
//
//
// 		// posCategories.forEach(category => {
// 		// 	obj.words[category] = eval(category + "s")
// 		// })
// 		dataForVis.push(obj);
//
// 	})
//
// 	console.log(dataForVis)
// 	// verbs
//
// 	// getting root words
//
// 	// doc.verbs().compute('root') //compute all roots
// 	// doc.verbs().json().map(v => {
// 	// 	return v.terms.map(t=>t.root || t.normal)
// 	// })
// })

function textProcessing(dataForNLP){
	// group by time
	let dataGroupedByTime = d3.nest().key(d => d.Time)
		.entries(dataForNLP)
		.map(d => {return {time: d.key, text_concated: d.values.map(d => d.Text).join(". ")}})

	let dataForVis = [];
	dataGroupedByTime.forEach(item => {
		// let item = dataGroupedByTime[0]
		let obj = {};
		obj.date = item.time;
		obj.words = {};

		let textBlock = item.text_concated;
		let doc = nlp(textBlock)

		doc.compute('root')
		const terms = doc.terms().json()

		posCategories.forEach(category => {
			obj.words[category] = d3.nest().key(d => (d.terms[0].root || d.terms[0].normal))
				.entries(terms.filter(t => (t.terms[0].tags.includes(category))))
				.sort((a,b) => b.values.length - a.values.length)
				.splice(0, topWords)
				.map(d => {return {text: d.key, frequency: d.values.length, topic: category}})
		})

		dataForVis.push(obj);
	})
	return dataForVis;
}

function visualize(dataForVis){
	console.log(dataForVis)
}

function POS_tag(){

}

function removeEndingPuncMark(str){
	for (let i = 0; i < puncMarkList.length; i++){
		if (str.endsWith(puncMarkList[i])){
			return str.slice(0, -1);
		}
	}
	return str;
}

function makeUnique(array, topic){
	// remove punctuation
	// array.forEach(d => {
	// 	d.normal = topic === "Noun" ? stripArticle(removeEndingPuncMark(d.normal)) : removeEndingPuncMark(d.normal)
	// })

	// combine, only search for duplicates in twice as big as top words picked
	// return Array.from(array.splice(0, topWords*2)
	// 	.reduce((m, {normal, count}) => m.set(normal, (m.get(normal) || 0) + count), new Map),
	// 	([text, frequency]) => ({text, frequency, topic}))
	// 	.slice(0, topWords);

	array.splice(0, topWords)

	return rename(array, topic)
}

function stripArticle(str){
	for (let i = 0; i < articleList.length; i++){
		if (str.startsWith(articleList[i])){
			return str.substr(str.indexOf(" ") + 1);
		}
	}
	return str;
}

// console.log(rename({normal: 1, count: 2}))
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
