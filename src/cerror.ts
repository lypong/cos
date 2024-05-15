// Ce fichier comporte une liste de fonctions
// permettant de vérifier de manière pratique et rapide
// la validité de variables.

function expectEqualOrThrow(lhs: any, rhs: any, errorMessage: string) {
  if (lhs !== rhs) throw new Error(errorMessage);
}

function expectDefinedOrThrow(value: any, errorMessage: string) {
  if (value === undefined || value === null) throw new Error(errorMessage);
}

function expectNotKeywordOrThrow(value: Token, errorMessage: string) {
  if (keywords.includes(value.lexeme)) throw new Error(errorMessage);
}

function consumeVariableNameOrThrow(parser : Parser) : Token {
  let variableName = parser.consume() as Token;
  expectDefinedOrThrow(variableName,"Wanted variable name but tokens are empty");
  expectEqualOrThrow(variableName.type,TokenType.word,`Expected variable name got ${variableName.lexeme}`);
  expectNotKeywordOrThrow(variableName,`Expected variable name name got keyword instead : ${variableName.lexeme}`);
  return variableName;
}
