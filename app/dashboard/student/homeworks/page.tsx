// app/student/exercises/page.tsx
"use client";
import React, { useState } from "react";
import {
  BookOpen,
  Calculator,
  Pencil,
  FlaskConical,
  Globe,
  GraduationCap,
  Mic,
  Code,
  ChevronDown,
  ChevronUp,
  Calendar,
  Search,
} from "lucide-react";

// --- Données simulées ---
const exercisesList = [
  {
    subject: "Mathématiques",
    title: "Exercices d'algèbre",
    exerciseType: "Passion des Maths",
    pages: "Pages 20 à 25",
    content:
      "Exercices sur les équations du second degré et la factorisation. Bien comprendre la méthode du discriminant.",
    date: "15 Octobre 2025",
  },
  {
    subject: "Anglais",
    title: "Grammar Practice",
    exerciseType: "Workbook Unit 3",
    pages: "Pages 17-19",
    content:
      "Exercices de grammaire sur le present simple tense. Réviser l'utilisation des adverbes de fréquence.",
    date: "16 Octobre 2025",
  },
  {
    subject: "Physique-Chimie",
    title: "Les réactions chimiques",
    exerciseType: "Manuel de Physique-Chimie",
    pages: "Pages 45 à 47",
    content:
      "Exercices sur les réactifs et produits chimiques. Rédiger un bilan de matière complet pour chaque équation.",
    date: "13 Octobre 2025",
  },
  {
    subject: "Français",
    title: "Expression écrite",
    exerciseType: "Cahier d'expression",
    pages: "Pages 12-15",
    content:
      "Rédaction sur le thème des réseaux sociaux : avantages et inconvénients. Minimum 300 mots.",
    date: "12 Octobre 2025",
  },
  {
    subject: "HistoireGéo",
    title: "Révolution Industrielle",
    exerciseType: "Manuel d'Histoire",
    pages: "Pages 78-82",
    content:
      "Étude des impacts de la révolution industrielle sur l'Europe au XIXe siècle. Préparer une fiche de synthèse.",
    date: "11 Octobre 2025",
  },
  {
    subject: "Informatique",
    title: "Algorithmes de tri",
    exerciseType: "Cahier d'algorithmique",
    pages: "Pages 34-37",
    content:
      "Implémentation d'algorithmes de tri en Python (tri à bulles et par insertion).",
    date: "9 Octobre 2025",
  },
];

const iconMap = {
  Mathématiques: Calculator,
  Français: Pencil,
  "Physique-Chimie": FlaskConical,
  HistoireGéo: Globe,
  Philosophie: GraduationCap,
  Anglais: Mic,
  Informatique: Code,
};

interface ExerciseProps {
  ex: (typeof exercisesList)[0];
  index: number;
  isExpanded: boolean;
  toggleExpand: (index: number) => void;
}

const ExerciseItem = ({ ex, index, isExpanded, toggleExpand }: ExerciseProps) => {
  const Icon = iconMap[ex.subject as keyof typeof iconMap] || BookOpen;

  return (
    <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 p-5 lg:pl-5 pt-20 lg:pt-6">
      {/* En-tête */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1">
          <div className="p-3 bg-blue-600 rounded-xl flex-shrink-0">
            <Icon className="h-6 w-6 text-white" />
          </div>

          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900">{ex.title}</h3>
            <div className="flex items-center gap-3 mt-2 text-gray-600">
              <span className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-blue-600" />
                {ex.date}
              </span>
            </div>
          </div>
        </div>

        {/* Bouton déplier */}
        <button
          onClick={() => toggleExpand(index)}
          className="p-2 rounded-full hover:bg-blue-100 transition-colors"
          aria-expanded={isExpanded}
        >
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-blue-600" />
          ) : (
            <ChevronDown className="h-5 w-5 text-blue-600" />
          )}
        </button>
      </div>

      {/* Contenu détaillé */}
      <div
        className={`transition-all overflow-hidden duration-500 ${
          isExpanded ? "max-h-96 mt-4" : "max-h-0"
        }`}
      >
        <div className="space-y-4">
          <div className="p-3 bg-blue-50 rounded-lg flex items-center justify-between text-sm font-medium">
            <div className="flex items-center gap-2 text-blue-700">
              <BookOpen className="h-4 w-4" />
              {ex.exerciseType}
            </div>
            <span className="text-gray-700 font-semibold">{ex.pages}</span>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg text-sm text-gray-700 leading-relaxed">
            {ex.content}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function StudentExercises() {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const toggleExpand = (index: number) => {
    setExpanded(expanded === index ? null : index);
  };

  const filteredExercises = exercisesList.filter(
    (ex) =>
      ex.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ex.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ex.exerciseType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto h-[calc(100vh-3rem)] flex flex-col">
        {/* En-tête */}
        <header className="pb-6 sticky top-0 bg-gray-50 z-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                Devoirs et Exercices
              </h1>
              <p className="text-gray-600 mt-2 text-sm">
                {filteredExercises.length} devoir
                {filteredExercises.length > 1 ? "s trouvés" : " trouvé"}
              </p>
            </div>

            {/* Recherche */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un devoir..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white rounded-xl text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
          </div>
        </header>

        {/* Liste des exercices (scrollable) */}
        <div className="flex-1 overflow-y-auto mt-4 pr-2 scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-blue-100 scrollbar-thumb-rounded-full">
          <div className="space-y-4 pb-8">
            {filteredExercises.map((ex, index) => (
              <ExerciseItem
                key={index}
                ex={ex}
                index={index}
                isExpanded={expanded === index}
                toggleExpand={toggleExpand}
              />
            ))}

            {filteredExercises.length === 0 && (
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-700 font-medium">
                  Aucun devoir ne correspond à votre recherche.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
