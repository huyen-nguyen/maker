const excludeCategories = {
	Noun: ['Pronoun', 'Possessive'],
	Verb: ['Modal', 'Copula', 'Auxiliary'],
	Adjective: [],
}

const excludeWords = {
	Noun: ['thing'],
	Verb: ['be', 'do', 'have'],
	Adjective: [],
}

function textProcessing(dataForNLP){
	// group by time
	let dataGroupedByTime = d3.nest().key(d => d.Time)
		.entries(dataForNLP)
		.map(d => {return {time: d.key, text_concated: d.values.map(d => d.Text).join(". ")}})
		.sort((a,b) => +a.time - +b.time)

	let dataForVis = [];

	dataGroupedByTime.forEach((item, index) => {
		let obj = {};  // obj is the desired WS format
		obj.date = item.time;
		obj.words = {};

		let textBlock = item.text_concated;
		let doc = nlp(textBlock)

		doc.compute('root')
		const terms = doc.terms().json()

		posCategories.forEach(category => {
			obj.words[category] = d3.nest().key(d => (d.terms[0].root || d.terms[0].normal))
				.entries(terms
					.filter(t => (t.terms[0].tags.includes(category)) && // get only the category
						excludeCategories[category].filter(c => t.terms[0].tags.includes(c)).length === 0 && // exclude the nonsense from `excludeCategories`
						excludeWords[category].filter(w => w === (t.terms[0].root || t.terms[0].normal)).length === 0 && // exclude the word itself
						(t.terms[0].normal !== '') // exclude empty word -- this freaking bug costs me my nerves
					)
				)
				.sort((a,b) => b.values.length - a.values.length)
				.splice(0, topWords)
				.map(d => {return {text: d.key, frequency: d.values.length, topic: category, id: d.key + '_' + category + '_' + index}})
		})

		dataForVis.push(obj);
	})
	return dataForVis;
}

function POS_tag(){

}

function removeEndingPuncMark(str){ // no need for this function, now we take either terms from `text` or `normal` fields
	for (let i = 0; i < puncMarkList.length; i++){
		if (str.endsWith(puncMarkList[i])){
			return str.slice(0, -1);
		}
	}
	return str;
}

function stripArticle(str){
	for (let i = 0; i < articleList.length; i++){
		if (str.startsWith(articleList[i])){
			return str.substr(str.indexOf(" ") + 1);
		}
	}
	return str;
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
