const keywords = [
  "LET",
  "PRINT",
  "REM",
  "END",
  "GOTO",
  "IF",
  "THEN",
  "GOSUB",
  "RETURN",
  "FOR",
  "TO",
  "STEP",
  "NEXT",
];
enum TokenType {
  integer = "integer",
  label = "label",
  word = "word",
  less = "less",
  lessOrEqual = "lessOrEqual",
  greater = "greater",
  greaterOrEqual = "greaterOrEqual",
  notEqual = "notEqual",
  equal = "equal",
  plus = "plus",
  minus = "minus",
  mult = "mult",
  div = "div",
  exp = "exp",
  openParen = "openParen",
  closeParen = "closeParen",
}
const singleCharacterTokens = {
  "=": TokenType.equal,
  "+": TokenType.plus,
  "-": TokenType.minus,
  "*": TokenType.mult,
  "/": TokenType.div,
  "?": TokenType.exp,
  "(": TokenType.openParen,
  ")": TokenType.closeParen,
};
// Un token représente un bout de code source
// auquel on associe un type,
// le bout de code source en soit (lexeme),
// ainsi que la valeur fixe qu'il représente (literal)
// https://fr.wikipedia.org/wiki/Litt%C3%A9ral_(programmation)
class Token {
  type: TokenType;
  lexeme: string;
  literal?: number | string;
  constructor(type: TokenType, lexeme: string, literal?: number | string) {
    this.type = type;
    this.lexeme = lexeme;
    this.literal = literal;
  }
  asString(): string {
    return `Token { type : ${this.type}, lexeme : ${this.lexeme}, literal : ${this.literal}}`;
  }
}
