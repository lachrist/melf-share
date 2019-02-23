
module.exports = {
  __proto__: Reflect,
  unary: (operator, argument) => {
    switch (operator) {
      case "-":      return -      argument;
      case "+":      return +      argument;
      case "!":      return !      argument;
      case "~":      return ~      argument;
      case "typeof": return typeof argument;
      case "void":   return void   argument;
      case "delete": return delete argument;
    }
    throw new Error("Invalid unary operator: "+operator);
  },
  binary: (operator, left, right) => {
    switch (operator) {
      case "==":  return left ==  right;
      case "!=":  return left !=  right;
      case "===": return left === right;
      case "!==": return left !== right;
      case "<":   return left <   right;
      case "<=":  return left <=  right;
      case ">":   return left >   right;
      case ">=":  return left >=  right;
      case "<<":  return left <<  right;
      case ">>":  return left >>  right;
      case ">>>": return left >>> right;
      case "+":   return left +   right;
      case "-":   return left -   right;
      case "*":   return left *   right;
      case "/":   return left /   right;
      case "%":   return left %   right;
      case "|":   return left |   right;
      case "^":   return left ^   right;
      case "&":   return left &   right;
      case "in":  return left in  right;
      case "instanceof": return left instanceof right;
    }
    throw new Error("Invalid binary operator: "+operator);
  }
};


