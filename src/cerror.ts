// Ce fichier comporte une liste de fonction permettant de vérifier de manière pratique et rapide la validité de variables

function expectEqualOrThrow(lhs: any, rhs: any, errorMessage: string) {
  if (lhs !== rhs) throw new Error(errorMessage);
}

function expectDefinedOrThrow(value: any, errorMessage: string) {
  if (value === undefined || value === null) throw new Error(errorMessage);
}

function expectNotKeywordOrThrow(value: Token, errorMessage: string) {
  if (keywords.includes(value.lexeme)) throw new Error(errorMessage);
}
