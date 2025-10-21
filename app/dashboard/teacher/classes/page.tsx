"use client";
import React, { useState } from "react";
import {
  Search,
  Users,
  BookOpen,
  GraduationCap,
  Calendar,
  ChevronRight,
} from "lucide-react";

// --- Données fictives des classes d’un enseignant ---
const classesData = [
  { id: 1, name: "6e A", studentsCount: 25, academicYear: "2024-2025" },
  { id: 2, name: "5e B", studentsCount: 28, academicYear: "2024-2025" },
  { id: 3, name: "4e C", studentsCount: 30, academicYear: "2024-2025" },
  { id: 4, name: "3e D", studentsCount: 32, academicYear: "2024-2025" },
  { id: 5, name: "Première S", studentsCount: 29, academicYear: "2024-2025" },
  { id: 6, name: "Terminale D", studentsCount: 35, academicYear: "2024-2025" },
];

const TeacherClassesDashboard = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredClasses = classesData.filter((classe) =>
    classe.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewDetails = (classe: any) => {
    console.log("Voir l’emploi du temps de :", classe.name);
    // Exemple :
    // router.push(`/dashboard/teacher/schedule?class=${classe.id}`);
  };

  const ClassCard = ({ classe }: { classe: any }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <h3 className="text-xl font-bold text-gray-900 mb-2">{classe.name}</h3>
      <div className="flex items-center gap-2 text-gray-600 mb-4">
        <Users className="w-4 h-4" />
        <span className="text-sm">{classe.studentsCount} étudiants</span>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
        <span className="text-xs text-gray-500">{classe.academicYear}</span>
        <button
          onClick={() => handleViewDetails(classe)}
          className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
        >
          Voir emploi du temps
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:pl-5 pt-20 lg:pt-6">
      {/* --- En-tête --- */}
      <div className="bg-white border-b border-gray-200 p-6 flex-shrink-0">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Mes Classes</h1>
              <p className="text-gray-600 mt-1">
                Retrouvez toutes vos classes et leurs emplois du temps
              </p>
            </div>
          </div>

          {/* --- Barre de recherche --- */}
          <div className="max-w-2xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher une classe..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* --- Contenu principal avec défilement --- */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-6">
          {/* Statistiques globales */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{classesData.length}</p>
                <p className="text-sm text-gray-500">Classes totales</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {classesData.reduce((acc, classe) => acc + classe.studentsCount, 0)}
                </p>
                <p className="text-sm text-gray-500">Étudiants totaux</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center gap-3">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Calendar className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">2024-2025</p>
                <p className="text-sm text-gray-500">Année académique</p>
              </div>
            </div>
          </div>

          {/* --- Liste des classes --- */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClasses.map((classe) => (
              <ClassCard key={classe.id} classe={classe} />
            ))}
          </div>

          {/* --- Aucun résultat --- */}
          {filteredClasses.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Aucune classe trouvée
              </h3>
              <p className="text-gray-500">
                Vérifiez le nom de la classe et réessayez.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherClassesDashboard;
