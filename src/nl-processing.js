//get the wikipedia plaintext with wtf_wikipedia
let text = "Netflix, Inc. is an American subscription streaming service and production company based in Los Gatos," +
	" California. Launched on August 29, 1997, it offers a film and television series and library through" +
	" distribution" +
	" deals as well as its own productions and library, known as Netflix Originals."
//get all the nouns from the text
let nouns = nlp(text).normalize({plurals:true, parentheses:true, possessives:true, honorifics:true}).nouns()
//sort them by frequency
console.log(JSON.stringify(nouns.out('topk'), null, 2))

function extractWords(){

}

function visualize(){
	extractWords()
}
