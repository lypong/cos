// Les nodes permettent de représenter une expression en forme d'arbre.
// le bas de l'arbre (analogie : feuilles) est évalué en premier
// de manière récursive jusqu'à atteindre et évaluer
// la node se trouvant à la base.
// Le besoin de ces arbres se justifie par l'ordre des opérations.
// (voir recursive descent parser)
// (explicité dans le livre "Crafting Interpreters")

// Le type Operator représente différents
// opérateurs arithmétiques (réutilisés)
// elle comporte aussi des opérateurs 
// spécifiques au nodes.
type Operator =
  | "getVar"
  | "callFunc"
  | TokenType.plus
  | TokenType.minus
  | TokenType.mult
  | TokenType.div
  | TokenType.exp;

// Les builtins sont une association 
// entre des noms de fonction BASIC
// et leurs implémentations.
const builtins: { [x: string]: (param: number) => number } = {
  INT: Math.trunc,
  RND: Math.random,
  SIN: Math.sin,
  COS: Math.cos,
  TAN: Math.tan,
  ATN: Math.atan,
  EXP: Math.exp,
  ABS: Math.abs,
  LOG: (n) => Math.log(Math.abs(n)),
  SQR: (n) => Math.sqrt(Math.abs(n)),
};
class BNode {
  operator: Operator;
  lhs: BNode | number | string;
  rhs?: BNode | number;
  
  constructor(
    operator: Operator,
    lhs: BNode | number | string,
    rhs?: BNode | number,
  ) {
    this.operator = operator;
    this.lhs = lhs;
    this.rhs = rhs;
  }

  evaluate(vars: { [x: string]: number }): number | null {
    let evaluatedLhs: number;
    let evaluatedRhs: number;
    // Si la node représente un appel de fonction,
    // on appelle la fonction stockée dans le côté 
    // gauche de la node, avec comme paramètre 
    // l'évaluation du côté droit.
    if (this.operator === "callFunc") {
      let f = builtins[this.lhs as string];
      if (f === undefined) return null;
      let evaluated = (this.rhs as BNode).evaluate(vars);
      if (evaluated === null) return null;
      return f(evaluated);
    }

    // Si la node représente un accès de variable,
    // on retourne la valeur associée à la variable
    // si elle existe.
    // Sinon on retourne 0
    if (this.operator === "getVar") return vars[this.lhs as string] ?? 0;

    // On évalue le côté gauche de la node.
    // S'il a une fonction evaluate on l'apelle pour obtenir un nombre,
    // Sinon on traite le côté gauche comme un nombre pas besoin d'évaluer.
    if ((this.lhs as any).evaluate === undefined)
      evaluatedLhs = this.lhs as number;
    else {
      let evaluated = (this.lhs as BNode).evaluate(vars);
      if (evaluated === null) return null;
      evaluatedLhs = evaluated;
    }

    // On évalue le côté droit de la node
    // pareil que côté gauche
    if ((this.rhs as any).evaluate === undefined)
      evaluatedRhs = this.rhs as number;
    else {
      let evaluated = (this.rhs as BNode).evaluate(vars);
      if (evaluated === null) return null;
      evaluatedRhs = evaluated;
    }

    switch (this.operator) {
      case TokenType.plus:
        return evaluatedLhs + evaluatedRhs;
      case TokenType.minus:
        return evaluatedLhs - evaluatedRhs;
      case TokenType.mult:
        return evaluatedLhs * evaluatedRhs;
      case TokenType.div:
        return evaluatedLhs / evaluatedRhs;
      case TokenType.exp:
        return evaluatedLhs ** evaluatedRhs;
    }
  }
}
