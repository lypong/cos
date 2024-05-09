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
