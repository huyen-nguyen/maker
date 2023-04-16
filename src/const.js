const fileType = ['csv', 'tsv',
	// 'txt', 'xls', 'xlsx'
];
const fileSignature = {
	'text/csv': 'csv',
	'text/tab-separated-values': 'tsv',
	// 'text/plain': 'txt',
	// 'application/vnd.ms-excel': 'xls',
	// 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx'
}
const puncMarkList = ['.', ',', '?', ';', '!', ':']

const articleList = ['a ', 'an ', 'the '];

const posCategories = ['Noun', 'Verb', 'Adjective']

const nerCategories = ['Person', 'Place', 'Organization']

const rename = (({normal: text, count: frequency, ...rest}, topic) => ({text, frequency, ...rest, topic}))

const topWords = 60;
