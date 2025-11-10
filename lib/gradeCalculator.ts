// Moteur d'évaluation de formules sécurisé
export class GradeCalculator {
  private variables: { [key: string]: number };
  
  constructor(variables: { [key: string]: number }) {
    this.variables = variables;
  }

  // Méthode sécurisée pour évaluer les formules
  evaluateFormula(formula: string): number {
    try {
      // Nettoyer et valider la formule
      const cleanFormula = this.sanitizeFormula(formula);
      
      // Remplacer les variables par leurs valeurs
      let evaluatedFormula = cleanFormula;
      for (const [key, value] of Object.entries(this.variables)) {
        const regex = new RegExp(`\\b${key}\\b`, 'g');
        evaluatedFormula = evaluatedFormula.replace(regex, value.toString());
      }

      // Évaluer l'expression mathématique
      const result = this.evaluateMathExpression(evaluatedFormula);
      
      // Limiter à 2 décimales et entre 0-20
      return Math.max(0, Math.min(20, Math.round(result * 100) / 100));
      
    } catch (error) {
      console.error('Erreur calcul formule:', error);
      return 0;
    }
  }

  private sanitizeFormula(formula: string): string {
    // Autoriser seulement les caractères mathématiques sécurisés
    const safeFormula = formula.replace(/[^0-9+\-*/().\sinterro|devoir|compo|moyenne|coef]/gi, '');
    
    // Validation basique de sécurité
    if (safeFormula.includes('**') || safeFormula.includes('//')) {
      throw new Error('Formule non sécurisée');
    }
    
    return safeFormula;
  }

  private evaluateMathExpression(expression: string): number {
    // Évaluation sécurisée des expressions mathématiques
    const tokens = expression.match(/(\d+\.?\d*|[+\-*/()]|\b\w+\b)/g) || [];
    
    let result = 0;
    let currentOp = '+';
    let i = 0;

    while (i < tokens.length) {
      const token = tokens[i];
      
      if (token === '(') {
        let j = i + 1;
        let parenCount = 1;
        while (j < tokens.length && parenCount > 0) {
          if (tokens[j] === '(') parenCount++;
          if (tokens[j] === ')') parenCount--;
          j++;
        }
        const subExpr = tokens.slice(i + 1, j - 1).join('');
        const subResult = this.evaluateMathExpression(subExpr);
        result = this.applyOperation(result, currentOp, subResult);
        i = j;
      } else if (['+', '-', '*', '/'].includes(token)) {
        currentOp = token;
        i++;
      } else {
        const num = !isNaN(Number(token)) ? Number(token) : this.variables[token] || 0;
        result = this.applyOperation(result, currentOp, num);
        i++;
      }
    }

    return result;
  }

  private applyOperation(left: number, op: string, right: number): number {
    switch (op) {
      case '+': return left + right;
      case '-': return left - right;
      case '*': return left * right;
      case '/': return right !== 0 ? left / right : 0;
      default: return left;
    }
  }
}

// Variables disponibles dans les formules
export const AVAILABLE_VARIABLES = {
  interro1: 'Note interrogation 1',
  interro2: 'Note interrogation 2', 
  interro3: 'Note interrogation 3',
  devoir: 'Note devoir',
  compo: 'Note composition',
  moyenne_interro: 'Moyenne des interrogations',
  coef: 'Coefficient du module'
};

// Formules prédéfinies
export const DEFAULT_FORMULAS = [
  {
    name: "Formule Standard",
    formula: "(moyenne_interro * 0.3 + devoir * 0.3 + compo * 0.4)",
    description: "Interros 30%, Devoir 30%, Composition 40%"
  },
  {
    name: "Formule Technique", 
    formula: "((interro1 + interro2 + interro3) / 3 * 0.4 + devoir * 0.3 + compo * 0.3)",
    description: "Interros 40%, Devoir 30%, Composition 30%"
  },
  {
    name: "Formule Simplifiée",
    formula: "(moyenne_interro * 0.5 + compo * 0.5)",
    description: "Interros 50%, Composition 50%"
  }
];