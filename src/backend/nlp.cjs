var natural = require('natural/lib/natural/tokenizers');
var stemmers = require('natural/lib/natural/stemmers/');

var tokenizer = new natural.WordTokenizer();


console.log(get_token_data("Driscoll Stawberries, 16oz").tokens);


function get_token_data(text) {
    var tokens = tokenizer.tokenize(text);
    var stemmed_tokens = tokens.map(token => stemmers.PorterStemmer.stem(token));
    return {
        tokens: stemmed_tokens,
    }
}


