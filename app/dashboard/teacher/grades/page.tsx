"use client";

import React, { useState, useEffect } from "react";
import {
  FaSave,
  FaEdit,
  FaLock,
  FaSync,
  FaExclamationTriangle,
  FaCalculator,
  FaPlus,
  FaInfoCircle,
  FaTrash,
} from "react-icons/fa";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

/* ---------- Types ---------- */

interface StudentGrade {
  id: string;
  name: string;
  email: string;
  studentNumber: string;
  filiere: string;
  grades: {
    interrogation1?: number;
    interrogation2?: number;
    interrogation3?: number;
    devoir?: number;
    composition?: number;
    rang?: number;
  };
  moyenneInterro?: number;
  moyenneDevoir?: number;
  moyenneComposition?: number;
  moyenneModule?: number;
}

interface Module {
  id: number;
  name: string;
  coefficient: number;
  filiere: string;
  filiereId: number;
  vague: string;
  vagueId: string;
  semestre: string;
}

interface GradeData {
  studentId: string;
  interrogation1?: number;
  interrogation2?: number;
  interrogation3?: number;
  devoir?: number;
  composition?: number;
  rang?: number;
}

interface GradeFormula {
  id: string;
  name: string;
  formula: string;
  description: string;
}

/* ---------- Moteur de calcul ---------- */

class GradeCalculator {
  private variables: { [key: string]: number };
  
  constructor(variables: { [key: string]: number }) {
    this.variables = variables;
  }

  evaluateFormula(formula: string): number {
    try {
      if (!formula.trim()) return 0;
      
      const cleanFormula = this.sanitizeFormula(formula);
      let evaluatedFormula = cleanFormula;
      
      // Remplacer les variables
      for (const [key, value] of Object.entries(this.variables)) {
        const regex = new RegExp(`\\b${key}\\b`, 'g');
        evaluatedFormula = evaluatedFormula.replace(regex, value.toString());
      }

      const result = this.evaluateMathExpression(evaluatedFormula);
      return Math.max(0, Math.min(20, Math.round(result * 100) / 100));
      
    } catch (error) {
      console.error('Erreur calcul formule:', error);
      return 0;
    }
  }

  private sanitizeFormula(formula: string): string {
    // Autoriser seulement les caractères mathématiques sécurisés
    const safeFormula = formula.replace(/[^0-9+\-*/().\sinterro1|interro2|interro3|devoir|compo|moyenne_interro|coef]/gi, '');
    
    if (safeFormula.includes('**') || safeFormula.includes('//') || safeFormula.includes('eval')) {
      throw new Error('Formule non sécurisée');
    }
    
    return safeFormula;
  }

  private evaluateMathExpression(expression: string): number {
    try {
      // Méthode simple pour les opérations basiques
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
    } catch (error) {
      // Fallback vers une évaluation basique
      const safeExpression = expression.replace(/[^0-9+\-*/().]/g, '');
      try {
        return Function(`"use strict"; return (${safeExpression})`)();
      } catch {
        return 0;
      }
    }
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

/* ---------- SVG Icons ---------- */

const FileText = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
    <path d="M14 2v4a2 2 0 0 0 2 2h4" />
    <path d="M10 9H8" />
    <path d="M16 13H8" />
    <path d="M16 17H8" />
  </svg>
);

/* ---------- Composant Formula Manager ---------- */

const FormulaManager: React.FC<{
  formulas: GradeFormula[];
  selectedFormula: string;
  onSelectFormula: (formula: string) => void;
  onSaveFormula: (formula: Omit<GradeFormula, 'id'>) => void;
  onUpdateFormula: (id: string, formula: Omit<GradeFormula, 'id'>) => void;
  onDeleteFormula: (id: string) => void;
  isLoading?: boolean;
}> = ({ formulas, selectedFormula, onSelectFormula, onSaveFormula, onUpdateFormula, onDeleteFormula, isLoading }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingFormula, setEditingFormula] = useState<GradeFormula | null>(null);
  const [newFormula, setNewFormula] = useState({
    name: "",
    formula: "",
    description: ""
  });

  const handleSave = () => {
    if (newFormula.name && newFormula.formula) {
      onSaveFormula(newFormula);
      setNewFormula({ name: "", formula: "", description: "" });
      setIsDialogOpen(false);
    }
  };

  const handleEdit = (formula: GradeFormula) => {
    setEditingFormula(formula);
    setNewFormula({
      name: formula.name,
      formula: formula.formula,
      description: formula.description
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (editingFormula && newFormula.name && newFormula.formula) {
      onUpdateFormula(editingFormula.id, newFormula);
      setNewFormula({ name: "", formula: "", description: "" });
      setEditingFormula(null);
      setIsEditDialogOpen(false);
    }
  };

  const handleDelete = (formula: GradeFormula) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer la formule "${formula.name}" ?`)) {
      onDeleteFormula(formula.id);
    }
  };

  const defaultFormulas: GradeFormula[] = [
    {
      id: "default-1",
      name: "Formule Standard",
      formula: "(moyenne_interro * 0.3 + devoir * 0.3 + compo * 0.4)",
      description: "Interros 30%, Devoir 30%, Composition 40%"
    },
    {
      id: "default-2",
      name: "Formule Technique",
      formula: "(moyenne_interro * 0.4 + devoir * 0.2 + compo * 0.4)",
      description: "Interros 40%, Devoir 20%, Composition 40%"
    },
    {
      id: "default-3",
      name: "Formule Simplifiée",
      formula: "(moyenne_interro * 0.5 + compo * 0.5)",
      description: "Interros 50%, Composition 50%"
    }
  ];

  const allFormulas = [...formulas, ...defaultFormulas];

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FaCalculator className="h-5 w-5 text-blue-600" />
            Formule de Calcul
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Sélection de formule */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Formule active</Label>
            <Select 
              value={selectedFormula} 
              onValueChange={onSelectFormula}
              disabled={isLoading}
            >
              <SelectTrigger className="w-5 bg-white">
                <SelectValue placeholder="Choisir une formule" />
              </SelectTrigger>
              <SelectContent className="bg-white max-h-80">
                {allFormulas.map(formula => (
                  <SelectItem key={formula.id} value={formula.formula}>
                    <div className="flex flex-col">
                      <span className="font-medium">{formula.name}</span>
                      <span className="text-xs text-gray-500">{formula.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Formule actuelle */}
          {selectedFormula && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="text-sm font-medium text-blue-800 mb-1">Formule sélectionnée:</div>
              <code className="text-xs bg-white px-2 py-1 rounded border">{selectedFormula}</code>
            </div>
          )}

          {/* Liste des formules personnalisées */}
          {formulas.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Mes formules personnalisées</Label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {formulas.map(formula => (
                  <div key={formula.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{formula.name}</div>
                      <code className="text-xs text-gray-600 truncate">{formula.formula}</code>
                    </div>
                    <div className="mb-8 flex gap-1 ml-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(formula)}
                        className="h-8 w-8 p-0"
                      >
                        <FaEdit className="h-3 w-3 text-blue-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(formula)}
                        className="h-8 w-8 p-0"
                      >
                        <FaTrash className="h-3 w-3 text-red-600" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bouton nouvelle formule */}
          <Button 
            onClick={() => setIsDialogOpen(true)}
            variant="outline"
            className="w-full"
            disabled={isLoading}
          >
            <FaPlus className="h-4 w-4 mr-2" />
            Créer une formule 
          </Button>

          {/* Aide variables */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <FaInfoCircle className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Variables disponibles:</span>
            </div>
            <div className="grid grid-cols-2 gap-1 text-xs text-gray-600">
              <code>interro1</code><span>Interrogation 1</span>
              <code>interro2</code><span>Interrogation 2</span>
              <code>interro3</code><span>Interrogation 3</span>
              <code>devoir</code><span>Devoir</span>
              <code>compo</code><span>Composition</span>
              <code>moyenne_interro</code><span>Moyenne interros</span>
              <code>coef</code><span>Coefficient</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog création formule */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nouvelle Formule de Calcul</DialogTitle>
            <DialogDescription>
              Créez votre propre formule personnalisée pour le calcul des moyennes
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nom de la formule *</Label>
              <Input
                placeholder="Ex: Formule de mon établissement"
                value={newFormula.name}
                onChange={(e) => setNewFormula(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Formule mathématique *</Label>
              <Textarea
                placeholder="Ex: (moyenne_interro * 0.3 + devoir * 0.3 + compo * 0.4)"
                value={newFormula.formula}
                onChange={(e) => setNewFormula(prev => ({ ...prev, formula: e.target.value }))}
                className="font-mono text-sm h-20"
              />
              <p className="text-xs text-gray-500">
                Utilisez les variables disponibles avec les opérateurs +, -, *, / et les parenthèses
              </p>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                placeholder="Ex: Pondération standard de l'établissement"
                value={newFormula.description}
                onChange={(e) => setNewFormula(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            {/* Aperçu du calcul */}
            {newFormula.formula && (
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="text-sm font-medium text-green-800 mb-2">Aperçu du calcul:</div>
                <div className="text-xs font-mono bg-white p-2 rounded border">
                  {newFormula.formula}
                </div>
                <p className="text-xs text-green-600 mt-2">
                  Exemple: avec interro1=15, interro2=16, devoir=14, compo=13
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleSave}
              disabled={!newFormula.name || !newFormula.formula}
            >
              <FaSave className="h-4 w-4 mr-2" />
              Sauvegarder la formule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog modification formule */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifier la Formule</DialogTitle>
            <DialogDescription>
              Modifiez votre formule personnalisée
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nom de la formule *</Label>
              <Input
                placeholder="Ex: Formule de mon établissement"
                value={newFormula.name}
                onChange={(e) => setNewFormula(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Formule mathématique *</Label>
              <Textarea
                placeholder="Ex: (moyenne_interro * 0.3 + devoir * 0.3 + compo * 0.4)"
                value={newFormula.formula}
                onChange={(e) => setNewFormula(prev => ({ ...prev, formula: e.target.value }))}
                className="font-mono text-sm h-20"
              />
              <p className="text-xs text-gray-500">
                Utilisez les variables disponibles avec les opérateurs +, -, *, / et les parenthèses
              </p>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                placeholder="Ex: Pondération standard de l'établissement"
                value={newFormula.description}
                onChange={(e) => setNewFormula(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleUpdate}
              disabled={!newFormula.name || !newFormula.formula}
            >
              <FaSave className="h-4 w-4 mr-2" />
              Mettre à jour
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

/* ---------- Composant principal ---------- */

const TeacherGrades: React.FC = () => {
  const [selectedVague, setSelectedVague] = useState<string>("");
  const [selectedSemestre, setSelectedSemestre] = useState<string>("");
  const [selectedFiliere, setSelectedFiliere] = useState<string>("");
  const [selectedModule, setSelectedModule] = useState<string>("");
  const [studentGrades, setStudentGrades] = useState<StudentGrade[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [formulas, setFormulas] = useState<GradeFormula[]>([]);
  const [selectedFormula, setSelectedFormula] = useState<string>(
    "(moyenne_interro * 0.3 + devoir * 0.3 + compo * 0.4)"
  );
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [hasChanges, setHasChanges] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Trouver les données du module sélectionné
  const selectedModuleData = modules.find(m => m.id.toString() === selectedModule);

  // Charger les modules assignés au professeur
  const fetchModules = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/teacher/grades?action=modules');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors du chargement des modules');
      }

      const data = await response.json();
      setModules(data.modules || []);
    } catch (error) {
      console.error('Erreur:', error);
      setError(error instanceof Error ? error.message : 'Erreur lors du chargement des modules');
    } finally {
      setIsLoading(false);
    }
  };

  // Charger les formules personnalisées
  const fetchFormulas = async () => {
    try {
      const response = await fetch('/api/teacher/grade-formulas');
      if (response.ok) {
        const data = await response.json();
        setFormulas(data.formulas || []);
      }
    } catch (error) {
      console.error('Erreur chargement formules:', error);
    }
  };

  // Sauvegarder une nouvelle formule
  const handleSaveFormula = async (formulaData: Omit<GradeFormula, 'id'>) => {
    try {
      const response = await fetch('/api/teacher/grade-formulas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formulaData)
      });

      if (response.ok) {
        const data = await response.json();
        setFormulas(prev => [data.formula, ...prev]);
        setSelectedFormula(data.formula.formula);
        setSuccess("Formule sauvegardée avec succès");
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (error) {
      setError("Erreur lors de la sauvegarde de la formule");
    }
  };

  // Modifier une formule existante
  const handleUpdateFormula = async (id: string, formulaData: Omit<GradeFormula, 'id'>) => {
    try {
      const response = await fetch('/api/teacher/grade-formulas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...formulaData })
      });

      if (response.ok) {
        const data = await response.json();
        setFormulas(prev => prev.map(f => f.id === id ? data.formula : f));
        // Si la formule modifiée est celle sélectionnée, on met à jour
        if (selectedFormula === formulas.find(f => f.id === id)?.formula) {
          setSelectedFormula(data.formula.formula);
        }
        setSuccess("Formule modifiée avec succès");
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (error) {
      setError("Erreur lors de la modification de la formule");
    }
  };

  // Supprimer une formule
  const handleDeleteFormula = async (id: string) => {
    try {
      const response = await fetch(`/api/teacher/grade-formulas?id=${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setFormulas(prev => prev.filter(f => f.id !== id));
        // Si la formule supprimée était sélectionnée, on revient à la formule par défaut
        if (selectedFormula === formulas.find(f => f.id === id)?.formula) {
          setSelectedFormula("(moyenne_interro * 0.3 + devoir * 0.3 + compo * 0.4)");
        }
        setSuccess("Formule supprimée");
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (error) {
      setError("Erreur lors de la suppression de la formule");
    }
  };

  // Charger les notes quand un module est sélectionné
  const fetchGrades = async () => {
    if (!selectedModule || !selectedFiliere || !selectedVague) return;

    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(
        `/api/teacher/grades?action=grades&moduleId=${selectedModule}&filiereId=${selectedFiliere}&vagueId=${selectedVague}`
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors du chargement des notes');
      }

      const data = await response.json();
      setStudentGrades(data.grades || []);
    } catch (error) {
      console.error('Erreur:', error);
      setError(error instanceof Error ? error.message : 'Erreur lors du chargement des notes');
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrer les vagues disponibles
  const availableVagues = [...new Set(modules.map(module => module.vagueId))].map(vagueId => {
    const module = modules.find(m => m.vagueId === vagueId);
    return {
      id: vagueId,
      name: module?.vague || vagueId
    };
  });

  // Filtrer les semestres disponibles selon la vague sélectionnée
  const availableSemestres = [...new Set(
    modules
      .filter(module => !selectedVague || module.vagueId === selectedVague)
      .map(module => module.semestre)
  )].sort();

  // Filtrer les filières disponibles selon la vague et semestre sélectionnés
  const availableFilieres = [...new Set(
    modules
      .filter(module => 
        (!selectedVague || module.vagueId === selectedVague) &&
        (!selectedSemestre || module.semestre === selectedSemestre)
      )
      .map(module => ({
        id: module.filiereId.toString(),
        name: module.filiere
      }))
  )];

  // Filtrer les modules disponibles selon la vague, semestre et filière sélectionnés
  const availableModules = modules.filter(module => 
    (!selectedVague || module.vagueId === selectedVague) &&
    (!selectedSemestre || module.semestre === selectedSemestre) &&
    (!selectedFiliere || module.filiereId.toString() === selectedFiliere)
  );

  // Réinitialiser les sélections quand la vague change
  useEffect(() => {
    setSelectedSemestre("");
    setSelectedFiliere("");
    setSelectedModule("");
    setStudentGrades([]);
  }, [selectedVague]);

  // Réinitialiser les sélections quand le semestre change
  useEffect(() => {
    setSelectedFiliere("");
    setSelectedModule("");
    setStudentGrades([]);
  }, [selectedSemestre]);

  // Réinitialiser les sélections quand la filière change
  useEffect(() => {
    setSelectedModule("");
    setStudentGrades([]);
  }, [selectedFiliere]);

  // Réinitialiser les notes quand le module change
  useEffect(() => {
    if (selectedModule && selectedFiliere && selectedVague) {
      fetchGrades();
    } else {
      setStudentGrades([]);
    }
  }, [selectedModule]);

  // Charger les données au montage du composant
  useEffect(() => {
    fetchModules();
    fetchFormulas();
  }, []);

  // Calcul des moyennes avec formule personnalisée
  const calculateWithFormula = (student: StudentGrade) => {
    const interroNotes = [
      student.grades.interrogation1 || 0,
      student.grades.interrogation2 || 0, 
      student.grades.interrogation3 || 0
    ].filter(grade => grade > 0);
    
    const moyenneInterro = interroNotes.length > 0 
      ? interroNotes.reduce((sum, grade) => sum + grade, 0) / interroNotes.length 
      : 0;

    const calculator = new GradeCalculator({
      interro1: student.grades.interrogation1 || 0,
      interro2: student.grades.interrogation2 || 0,
      interro3: student.grades.interrogation3 || 0,
      devoir: student.grades.devoir || 0,
      compo: student.grades.composition || 0,
      moyenne_interro: moyenneInterro,
      coef: selectedModuleData?.coefficient || 1
    });

    return calculator.evaluateFormula(selectedFormula);
  };

  // Calcul des moyennes pour chaque étudiant
  const processedGrades = studentGrades.map(student => {
    const interroNotes = [
      student.grades.interrogation1 || 0,
      student.grades.interrogation2 || 0,
      student.grades.interrogation3 || 0
    ].filter(grade => grade > 0);
    
    const moyenneInterro = interroNotes.length > 0 
      ? interroNotes.reduce((sum, grade) => sum + grade, 0) / interroNotes.length 
      : 0;
    
    const moyenneDevoir = student.grades.devoir || 0;
    const moyenneComposition = student.grades.composition || 0;
    const moyenneModule = calculateWithFormula(student);
    
    return {
      ...student,
      moyenneInterro,
      moyenneDevoir,
      moyenneComposition,
      moyenneModule,
    };
  });

  const handleGradeChange = (studentId: string, field: keyof GradeData, value: string) => {
    let numericValue: number | undefined;
    
    if (field === 'rang') {
      numericValue = value === "" ? undefined : Math.max(1, parseInt(value) || 1);
    } else {
      numericValue = value === "" ? undefined : Math.min(20, Math.max(0, parseFloat(value) || 0));
    }
    
    setStudentGrades(prev => prev.map(student => 
      student.id === studentId 
        ? { 
            ...student, 
            grades: { 
              ...student.grades, 
              [field]: numericValue 
            } 
          } 
        : student
    ));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const gradesToSave: GradeData[] = studentGrades.map(student => ({
        studentId: student.id,
        interrogation1: student.grades.interrogation1,
        interrogation2: student.grades.interrogation2,
        interrogation3: student.grades.interrogation3,
        devoir: student.grades.devoir,
        composition: student.grades.composition,
        rang: student.grades.rang
      }));

      const response = await fetch('/api/teacher/grades', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          moduleId: selectedModule,
          filiereId: selectedFiliere,
          vagueId: selectedVague,
          grades: gradesToSave
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la sauvegarde');
      }

      setSuccess("Notes sauvegardées avec succès");
      setIsEditing(false);
      setHasChanges(false);
      
      setTimeout(() => {
        setSuccess(null);
        fetchGrades();
      }, 3000);

    } catch (error) {
      console.error('Erreur:', error);
      setError(error instanceof Error ? error.message : 'Erreur lors de la sauvegarde des notes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    fetchGrades();
    setIsEditing(false);
    setHasChanges(false);
    setError(null);
  };

  const getGradeColor = (grade: number) => {
    if (grade >= 16) return "bg-green-100 text-green-800 border-green-200";
    if (grade >= 14) return "bg-blue-100 text-blue-800 border-blue-200";
    if (grade >= 12) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    return "bg-red-100 text-red-800 border-red-200";
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    if (rank <= 3) return "bg-green-100 text-green-800 border-green-200";
    if (rank <= 5) return "bg-blue-100 text-blue-800 border-blue-200";
    return "bg-gray-100 text-gray-800 border-gray-200";
  };

  // Skeleton Loader
  const GradeSkeleton = () => (
    <Card className="animate-pulse">
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 bg-gray-300 rounded-lg"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            <div className="flex gap-2">
              <div className="h-5 bg-gray-300 rounded-full w-16"></div>
              <div className="h-5 bg-gray-300 rounded-full w-12"></div>
            </div>
            <div className="space-y-1">
              <div className="h-3 bg-gray-300 rounded w-32"></div>
              <div className="h-3 bg-gray-300 rounded w-28"></div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50 overflow-y-auto lg:pl-5 pt-20 lg:pt-10">
      <div className="p-3 sm:p-4 lg:p-6 space-y-4 lg:space-y-6">
        {/* Alertes */}
        {error && (
          <Alert variant="destructive">
            <FaExclamationTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-green-50 border-green-200">
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {/* En-tête */}
        <Card>
          <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-4">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 sm:gap-4">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 break-words">
                  Gestion des Notes - {selectedModuleData?.name || "Sélectionnez un module"}
                </CardTitle>
                <p className="text-gray-600 mt-1 text-sm sm:text-base">
                  {selectedModuleData ? `Coefficient: ${selectedModuleData.coefficient} | ` : ""}
                  {selectedFiliere ? `Filière: ${availableFilieres.find(f => f.id === selectedFiliere)?.name || ""} | ` : ""}
                  {selectedSemestre ? `Semestre: ${selectedSemestre} | ` : ""}
                  {selectedVague ? `Vague: ${availableVagues.find(v => v.id === selectedVague)?.name || ""}` : ""}
                </p>
              </div>
              <div className="flex flex-col xs:flex-row gap-2 w-full lg:w-48 flex-shrink-0">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={fetchModules}
                  disabled={isLoading}
                  className="flex-1 lg:flex-none"
                >
                  <FaSync className={`w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  <span className="text-xs sm:text-sm">Actualiser</span>
                </Button>
                
                {isEditing ? (
                  <>
                    <Button variant="outline" size="sm" onClick={handleCancel} className="flex-1 lg:flex-none">
                      Annuler
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={handleSave}
                      disabled={!hasChanges || isLoading}
                      className="flex-1 lg:flex-none"
                    >
                      <FaSave className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      <span className="text-xs sm:text-sm">Enregistrer</span>
                    </Button>
                  </>
                ) : (
                  <Button 
                    size="sm" 
                    onClick={() => setIsEditing(true)}
                    disabled={!selectedModule || isLoading}
                    className="w-full"
                  >
                    <FaEdit className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    <span className="text-xs sm:text-sm">Modifier les notes</span>
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 lg:gap-6">
          {/* Colonne des filtres et formules */}
          <div className="xl:col-span-1 space-y-4 lg:space-y-6">
            {/* Filtres */}
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-4">
                  {/* Filtre Vague */}
                  <div className="min-w-0">
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Vague *
                    </label>
                    <Select 
                      value={selectedVague} 
                      onValueChange={setSelectedVague}
                      disabled={isLoading}
                    >
                      <SelectTrigger className="bg-white w-full">
                        <SelectValue placeholder="Sélectionnez une vague" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        {availableVagues.map(vague => (
                          <SelectItem key={vague.id} value={vague.id}>
                            {vague.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Filtre Semestre */}
                  <div className="min-w-0">
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Semestre *
                    </label>
                    <Select 
                      value={selectedSemestre} 
                      onValueChange={setSelectedSemestre}
                      disabled={!selectedVague || isLoading}
                    >
                      <SelectTrigger className={`bg-white w-full ${!selectedVague ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        <div className="flex items-center">
                          {!selectedVague && <FaLock className="w-3 h-3 text-gray-400 mr-2 flex-shrink-0" />}
                          <SelectValue 
                            placeholder={!selectedVague ? "Choisissez une vague"  : "Sélectionnez un semestre"} 
                          /> 
                        </div>
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        {availableSemestres.map(semestre => (
                          <SelectItem key={semestre} value={semestre}>
                            {semestre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Filtre Filière */}
                  <div className="min-w-0">
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Filière *
                    </label>
                    <Select 
                      value={selectedFiliere} 
                      onValueChange={setSelectedFiliere}
                      disabled={!selectedVague || !selectedSemestre || isLoading}
                    >
                      <SelectTrigger className={`bg-white w-full ${!selectedVague || !selectedSemestre ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        <div className="flex items-center">
                          {(!selectedVague || !selectedSemestre) && <FaLock className="w-3 h-3 text-gray-400 mr-2 flex-shrink-0" />}
                          <SelectValue 
                            placeholder={
                              !selectedVague 
                                ? "Choisissez une vague" 
                                : !selectedSemestre
                                ? "Choisissez un semestre"
                                : availableFilieres.length === 0
                                ? "Aucune filière disponible"
                                : "Sélectionnez une filière"
                            } 
                          />
                        </div>
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        {availableFilieres.map(filiere => (
                          <SelectItem key={filiere.id} value={filiere.id}>
                            {filiere.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Filtre Module */}
                  <div className="min-w-0">
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Module *
                    </label>
                    <Select 
                      value={selectedModule} 
                      onValueChange={setSelectedModule}
                      disabled={!selectedVague || !selectedSemestre || !selectedFiliere || isLoading}
                    >
                      <SelectTrigger className={`bg-white w-full ${!selectedVague || !selectedSemestre || !selectedFiliere ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        <div className="flex items-center">
                          {(!selectedVague || !selectedSemestre || !selectedFiliere) && <FaLock className="w-3 h-3 text-gray-400 mr-2 flex-shrink-0" />}
                          <SelectValue 
                            placeholder={
                              !selectedVague 
                                ? "Choisissez une vague" 
                                : !selectedSemestre
                                ? "Choisissez un semestre"
                                : !selectedFiliere
                                ? "Choisissez une filière"
                                : availableModules.length === 0
                                ? "Aucun module disponible"
                                : "Sélectionnez un module"
                            } 
                          />
                        </div>
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        {availableModules.map(module => (
                          <SelectItem key={module.id} value={module.id.toString()}>
                            <span className="truncate">{module.name} (Coef: {module.coefficient})</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Résumé des filtres */}
                <div className="mt-4 flex flex-wrap gap-1 sm:gap-2">
                  {selectedVague && (
                    <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                      <span className="truncate">
                        Vague: {availableVagues.find(v => v.id === selectedVague)?.name || selectedVague}
                      </span>
                    </Badge>
                  )}
                  {selectedSemestre && (
                    <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                      {selectedSemestre}
                    </Badge>
                  )}
                  {selectedFiliere && (
                    <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-800">
                      <span className="truncate">
                        {availableFilieres.find(f => f.id === selectedFiliere)?.name || selectedFiliere}
                      </span>
                    </Badge>
                  )}
                  {selectedModuleData && (
                    <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">
                      <span className="truncate">{selectedModuleData.name}</span>
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Gestionnaire de formules */}
            <FormulaManager
              formulas={formulas}
              selectedFormula={selectedFormula}
              onSelectFormula={setSelectedFormula}
              onSaveFormula={handleSaveFormula}
              onUpdateFormula={handleUpdateFormula}
              onDeleteFormula={handleDeleteFormula}
              isLoading={isLoading}
            />
          </div>

          {/* Colonne du tableau des notes */}
          <div className="xl:col-span-3">
            {/* Tableau des notes */}
            {selectedModule && !isLoading ? (
              <Card>
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="flex flex-col sm:flex-row sm:items-center gap-2 text-base sm:text-lg lg:text-xl">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
                      <span className="break-words">Saisie des Notes - {selectedModuleData?.name}</span>
                    </div>
                    <Badge variant="outline" className="text-xs sm:text-sm w-fit">
                      Coefficient: {selectedModuleData?.coefficient}
                    </Badge>
                    <Badge variant="secondary" className="text-xs sm:text-sm w-fit bg-orange-100 text-orange-800">
                      {processedGrades.length} étudiant(s)
                    </Badge>
                  </CardTitle>
                </CardHeader>

                <CardContent className="p-0">
                  <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <div className="min-w-[800px] lg:min-w-[1000px]">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50">
                            <TableHead className="font-semibold text-gray-900 w-40 lg:w-48 sticky left-0 bg-gray-50 z-10 text-xs sm:text-sm">
                              Étudiant
                            </TableHead>
                            
                            {/* Interrogations */}
                            <TableHead colSpan={4} className="text-center font-semibold text-gray-900 bg-blue-50 text-xs sm:text-sm">
                              Interrogations
                            </TableHead>
                            
                            {/* Devoir */}
                            <TableHead colSpan={2} className="text-center font-semibold text-gray-900 bg-green-50 text-xs sm:text-sm">
                              Devoir
                            </TableHead>
                            
                            {/* Composition */}
                            <TableHead colSpan={2} className="text-center font-semibold text-gray-900 bg-purple-50 text-xs sm:text-sm">
                              Composition
                            </TableHead>
                            
                            <TableHead className="text-center font-semibold text-gray-900 bg-yellow-50 text-xs sm:text-sm">
                              Moy. Module
                            </TableHead>
                            
                            <TableHead className="text-center font-semibold text-gray-900 bg-gray-100 text-xs sm:text-sm">
                              Rang
                            </TableHead>
                          </TableRow>
                          
                          <TableRow className="bg-gray-50">
                            <TableHead className="sticky left-0 bg-gray-50 z-10 text-xs sm:text-sm">Nom</TableHead>
                            
                            {/* Colonnes Interrogations */}
                            <TableHead className="text-center min-w-[60px] sm:min-w-[80px] text-xs sm:text-sm">Interro 1</TableHead>
                            <TableHead className="text-center min-w-[60px] sm:min-w-[80px] text-xs sm:text-sm">Interro 2</TableHead>
                            <TableHead className="text-center min-w-[60px] sm:min-w-[80px] text-xs sm:text-sm">Interro 3</TableHead>
                            <TableHead className="text-center min-w-[70px] sm:min-w-[80px] bg-blue-50 text-xs sm:text-sm">Moy. Interro</TableHead>
                            
                            {/* Colonnes Devoir */}
                            <TableHead className="text-center min-w-[60px] sm:min-w-[80px] text-xs sm:text-sm">Devoir</TableHead>
                            <TableHead className="text-center min-w-[70px] sm:min-w-[80px] bg-green-50 text-xs sm:text-sm">Moy. Devoir</TableHead>
                            
                            {/* Colonnes Composition */}
                            <TableHead className="text-center min-w-[60px] sm:min-w-[80px] text-xs sm:text-sm">Composition</TableHead>
                            <TableHead className="text-center min-w-[70px] sm:min-w-[80px] bg-purple-50 text-xs sm:text-sm">Moy. Comp.</TableHead>
                            
                            <TableHead className="text-center min-w-[80px] sm:min-w-[100px] bg-yellow-50 text-xs sm:text-sm">Moyenne</TableHead>
                            <TableHead className="text-center min-w-[60px] sm:min-w-[80px] bg-gray-100 text-xs sm:text-sm">Rang</TableHead>
                          </TableRow>
                        </TableHeader>

                        <TableBody>
                          {processedGrades.map((student) => (
                            <TableRow key={student.id} className="hover:bg-gray-50">
                              {/* Nom de l'étudiant */}
                              <TableCell className="font-medium sticky left-0 bg-white p-2 sm:p-3">
                                <div className="min-w-0">
                                  <div className="font-semibold text-xs sm:text-sm break-words">{student.name}</div>
                                  <div className="text-xs text-gray-500 truncate">{student.email}</div>
                                  <div className="text-xs text-gray-400">{student.studentNumber}</div>
                                </div>
                              </TableCell>

                              {/* Interrogations */}
                              <TableCell className="text-center p-1">
                                {isEditing ? (
                                  <Input
                                    type="number"
                                    min="0"
                                    max="20"
                                    step="0.5"
                                    value={student.grades.interrogation1 || ""}
                                    onChange={(e) => handleGradeChange(student.id, 'interrogation1', e.target.value)}
                                    className="w-12 sm:w-16 text-center mx-auto text-xs"
                                    placeholder="0"
                                  />
                                ) : (
                                  <Badge className={`px-1 sm:px-2 py-1 text-xs ${getGradeColor(student.grades.interrogation1 || 0)}`}>
                                    {student.grades.interrogation1?.toFixed(1) || "-"}
                                  </Badge>
                                )}
                              </TableCell>

                              <TableCell className="text-center p-1">
                                {isEditing ? (
                                  <Input
                                    type="number"
                                    min="0"
                                    max="20"
                                    step="0.5"
                                    value={student.grades.interrogation2 || ""}
                                    onChange={(e) => handleGradeChange(student.id, 'interrogation2', e.target.value)}
                                    className="w-12 sm:w-16 text-center mx-auto text-xs"
                                    placeholder="0"
                                  />
                                ) : (
                                  <Badge className={`px-1 sm:px-2 py-1 text-xs ${getGradeColor(student.grades.interrogation2 || 0)}`}>
                                    {student.grades.interrogation2?.toFixed(1) || "-"}
                                  </Badge>
                                )}
                              </TableCell>

                              <TableCell className="text-center p-1">
                                {isEditing ? (
                                  <Input
                                    type="number"
                                    min="0"
                                    max="20"
                                    step="0.5"
                                    value={student.grades.interrogation3 || ""}
                                    onChange={(e) => handleGradeChange(student.id, 'interrogation3', e.target.value)}
                                    className="w-12 sm:w-16 text-center mx-auto text-xs"
                                    placeholder="0"
                                  />
                                ) : (
                                  <Badge className={`px-1 sm:px-2 py-1 text-xs ${getGradeColor(student.grades.interrogation3 || 0)}`}>
                                    {student.grades.interrogation3?.toFixed(1) || "-"}
                                  </Badge>
                                )}
                              </TableCell>

                              <TableCell className="text-center bg-blue-50/20 p-1">
                                <Badge className={`px-1 sm:px-2 py-1 font-medium text-xs ${getGradeColor(student.moyenneInterro || 0)}`}>
                                  {student.moyenneInterro?.toFixed(2) || "0.00"}
                                </Badge>
                              </TableCell>

                              {/* Devoir */}
                              <TableCell className="text-center p-1">
                                {isEditing ? (
                                  <Input
                                    type="number"
                                    min="0"
                                    max="20"
                                    step="0.5"
                                    value={student.grades.devoir || ""}
                                    onChange={(e) => handleGradeChange(student.id, 'devoir', e.target.value)}
                                    className="w-12 sm:w-16 text-center mx-auto text-xs"
                                    placeholder="0"
                                  />
                                ) : (
                                  <Badge className={`px-1 sm:px-2 py-1 text-xs ${getGradeColor(student.grades.devoir || 0)}`}>
                                    {student.grades.devoir?.toFixed(1) || "-"}
                                  </Badge>
                                )}
                              </TableCell>

                              <TableCell className="text-center bg-green-50/20 p-1">
                                <Badge className={`px-1 sm:px-2 py-1 font-medium text-xs ${getGradeColor(student.moyenneDevoir || 0)}`}>
                                  {student.moyenneDevoir?.toFixed(2) || "0.00"}
                                </Badge>
                              </TableCell>

                              {/* Composition */}
                              <TableCell className="text-center p-1">
                                {isEditing ? (
                                  <Input
                                    type="number"
                                    min="0"
                                    max="20"
                                    step="0.5"
                                    value={student.grades.composition || ""}
                                    onChange={(e) => handleGradeChange(student.id, 'composition', e.target.value)}
                                    className="w-12 sm:w-16 text-center mx-auto text-xs"
                                    placeholder="0"
                                  />
                                ) : (
                                  <Badge className={`px-1 sm:px-2 py-1 text-xs ${getGradeColor(student.grades.composition || 0)}`}>
                                    {student.grades.composition?.toFixed(1) || "-"}
                                  </Badge>
                                )}
                              </TableCell>

                              <TableCell className="text-center bg-purple-50/20 p-1">
                                <Badge className={`px-1 sm:px-2 py-1 font-medium text-xs ${getGradeColor(student.moyenneComposition || 0)}`}>
                                  {student.moyenneComposition?.toFixed(2) || "0.00"}
                                </Badge>
                              </TableCell>

                              {/* Moyenne Module */}
                              <TableCell className="text-center bg-yellow-50/20 p-1">
                                <Badge className={`px-1 sm:px-2 py-1 font-bold text-xs ${getGradeColor(student.moyenneModule || 0)}`}>
                                  {student.moyenneModule?.toFixed(2) || "0.00"}
                                </Badge>
                              </TableCell>

                              {/* Rang (saisi par le prof) */}
                              <TableCell className="text-center bg-gray-50 p-1">
                                {isEditing ? (
                                  <Input
                                    type="number"
                                    min="1"
                                    value={student.grades.rang || ""}
                                    onChange={(e) => handleGradeChange(student.id, 'rang', e.target.value)}
                                    className="w-12 sm:w-16 text-center mx-auto text-xs"
                                    placeholder="1"
                                  />
                                ) : (
                                  <Badge className={`px-1 sm:px-2 py-1 font-bold text-xs ${getRankColor(student.grades.rang || 0)}`}>
                                    {student.grades.rang || "-"}
                                  </Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  {/* Légende et informations */}
                  <div className="mt-3 sm:mt-4 p-3 bg-gray-50 rounded-lg">
                    <div className="text-xs sm:text-sm text-gray-600 mb-2">
                      <strong>Calcul automatique :</strong> 
                      <span className="ml-2 font-mono text-xs bg-white px-2 py-1 rounded border">
                        {selectedFormula}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      <strong>Note :</strong> Les moyennes sont calculées automatiquement selon la formule sélectionnée.
                      Les rangs doivent être saisis manuellement par le professeur.
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : isLoading ? (
              // Skeleton Loader
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <GradeSkeleton key={i} />
                ))}
              </div>
            ) : (
              // Message d'information
              <Card>
                <CardContent className="p-6 sm:p-8 text-center">
                  <FileText className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                  <h3 className="text-base sm:text-lg font-semibold text-gray-700 mb-2">
                    {!selectedVague ? "Sélectionnez une vague" : !selectedSemestre ? "Sélectionnez un semestre" : !selectedFiliere ? "Sélectionnez une filière" : "Sélectionnez un module"}
                  </h3>
                  <p className="text-gray-500 text-sm sm:text-base">
                    {!selectedVague 
                      ? "Veuillez d'abord choisir une vague pour voir les semestres disponibles."
                      : !selectedSemestre
                      ? "Veuillez sélectionner un semestre pour afficher les filières disponibles."
                      : !selectedFiliere
                      ? "Veuillez sélectionner une filière pour afficher les modules disponibles."
                      : "Veuillez sélectionner un module pour afficher le tableau des notes."
                    }
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherGrades;