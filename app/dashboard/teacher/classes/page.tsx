"use client";
import React, { useState } from "react";
import {
  Search,
  Users,
  BookOpen,
  GraduationCap,
  Calendar,
  ChevronRight,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// --- Types pour les filières ---
interface Filiere {
  id: number;
  name: string;
  studentsCount: number;
  vague: string;
  duree: string;
  professeur: string;
}

// --- Données fictives des filières d'un formateur ---
const filieresData: Filiere[] = [
  { 
    id: 1, 
    name: "Développement Web Fullstack", 
    studentsCount: 25, 
    vague: "Vague Janvier 2024",
    duree: "6 mois",
    professeur: "M. Diallo"
  },
  { 
    id: 2, 
    name: "Data Science", 
    studentsCount: 18, 
    vague: "Vague Février 2024",
    duree: "8 mois", 
    professeur: "M. Diallo"
  },
  { 
    id: 3, 
    name: "Design Graphique", 
    studentsCount: 22, 
    vague: "Vague Mars 2024",
    duree: "5 mois",
    professeur: "Mme. Traoré"
  },
  { 
    id: 4, 
    name: "Marketing Digital", 
    studentsCount: 30, 
    vague: "Vague Janvier 2024",
    duree: "4 mois",
    professeur: "M. Diallo"
  },
];

const FormateurFilieresDashboard = () => {
  const [searchTerm, setSearchTerm] = useState("");
  
  // Filtrer par le nom du formateur actuel (exemple: "M. Diallo")
  const formateurActuel = "M. Diallo";
  
  const mesFilieres = filieresData.filter(filiere => 
    filiere.professeur === formateurActuel
  );

  const filteredFilieres = mesFilieres.filter((filiere) =>
    filiere.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    filiere.vague.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Séparer les filières en deux groupes : 2 en haut, 2 en bas
  const filieresHaut = filteredFilieres.slice(0, 2);
  const filieresBas = filteredFilieres.slice(2, 4);

  // Composant carte de filière avec typage approprié
  const FiliereCard = ({ filiere }: { filiere: Filiere }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl">{filiere.name}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-2 text-gray-600">
            <Users className="w-4 h-4" />
            <span className="text-sm">{filiere.studentsCount} apprenants</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="w-4 h-4" />
            <span className="text-sm">{filiere.duree}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">{filiere.vague}</span>
          </div>
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <CardDescription>Formateur: {filiere.professeur}</CardDescription>
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
          >
            <Link href={`/dashboard/teacher/schedule`}>
              Voir planning
              <ChevronRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:pl-5 pt-20 lg:pt-6">
      {/* --- En-tête --- */}
      <div className="bg-white border-b border-gray-200 p-6 flex-shrink-0">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Mes Filieres</h1>
              <p className="text-gray-600 mt-1">
                Gérez vos filières et consultez vos plannings de cours
              </p>
            </div>
          </div>

          {/* --- Barre de recherche --- */}
          <div className="max-w-2xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Rechercher une filière ou une vague..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10"
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
            <Card>
              <CardContent className="p-6 flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{mesFilieres.length}</div>
                  <div className="text-sm text-gray-500">Filières assignées</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {mesFilieres.reduce((acc, filiere) => acc + filiere.studentsCount, 0)}
                  </div>
                  <div className="text-sm text-gray-500">Apprenants totaux</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 flex items-center gap-3">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <GraduationCap className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {new Set(mesFilieres.map(f => f.vague)).size}
                  </div>
                  <div className="text-sm text-gray-500">Vagues différentes</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* --- Liste des filières en disposition 2x2 --- */}
          <div className="space-y-6">
            {/* Première ligne : 2 filières en haut */}
            {filieresHaut.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filieresHaut.map((filiere) => (
                  <FiliereCard key={filiere.id} filiere={filiere} />
                ))}
              </div>
            )}

            {/* Deuxième ligne : 2 filières en bas */}
            {filieresBas.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filieresBas.map((filiere) => (
                  <FiliereCard key={filiere.id} filiere={filiere} />
                ))}
              </div>
            )}
          </div>

          {/* --- Aucun résultat --- */}
          {filteredFilieres.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Aucune filière trouvée
                </h3>
                <p className="text-gray-500">
                  {searchTerm ? 
                    "Aucune filière ne correspond à votre recherche." : 
                    "Vous n&apos;êtes actuellement assigné à aucune filière."
                  }
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default FormateurFilieresDashboard;