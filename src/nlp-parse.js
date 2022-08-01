let doc = nlp('two cans of beer');
doc.numbers().minus(1);
console.log(doc.text())
