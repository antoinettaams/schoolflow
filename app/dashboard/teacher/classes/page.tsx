"use client";
import React, { useState, useEffect } from "react";
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
  id: string;
  name: string;
  studentsCount: number;
  vague: string;
  duree: string;
  professeur: string;
  modules: Array<{
    id: number;
    nom: string;
    type: string;
    coefficient: number;
  }>;
}

interface ApiResponse {
  teacher: {
    name: string;
    specialite: string;
  };
  filieres: Filiere[];
  stats: {
    totalFilieres: number;
    totalStudents: number;
    totalVagues: number;
  };
}

const FormateurFilieresDashboard = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [data, setData] = useState<ApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Charger les données
  useEffect(() => {
    const loadFilieres = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/teacher/filieres');
        if (response.ok) {
          const result = await response.json();
          setData(result);
        }
      } catch (error) {
        console.error('Erreur chargement filières:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadFilieres();
  }, []);

  // Filtrer les filières
  const filteredFilieres = data?.filieres.filter((filiere) =>
    filiere.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    filiere.vague.toLowerCase().includes(searchTerm.toLowerCase()) ||
    filiere.modules.some(module => 
      module.nom.toLowerCase().includes(searchTerm.toLowerCase())
    )
  ) || [];

  const filieresHaut = filteredFilieres.slice(0, 2);
  const filieresBas = filteredFilieres.slice(2, 4);

  // Composant carte de filière
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
          <div className="mt-2">
            <p className="text-sm font-medium text-gray-700 mb-1">Modules :</p>
            <div className="flex flex-wrap gap-1">
              {filiere.modules.map(module => (
                <span 
                  key={module.id}
                  className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                >
                  {module.nom}
                </span>
              ))}
            </div>
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
            <Link href={`/teacher/schedule?filiere=${filiere.id}`}>
              Voir planning
              <ChevronRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col lg:pl-5 pt-20 lg:pt-6">
        <div className="bg-white border-b border-gray-200 p-6">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900">Mes Filieres</h1>
            <p className="text-gray-600 mt-1">Chargement...</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-6">
            <div className="animate-pulse">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {[1, 2, 3].map(i => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
                placeholder="Rechercher une filière, vague ou module..."
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
          {data && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardContent className="p-6 flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <BookOpen className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{data.stats.totalFilieres}</div>
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
                      {data.stats.totalStudents}
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
                      {data.stats.totalVagues}
                    </div>
                    <div className="text-sm text-gray-500">Vagues différentes</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* --- Liste des filières --- */}
          <div className="space-y-6">
            {filieresHaut.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filieresHaut.map((filiere) => (
                  <FiliereCard key={filiere.id} filiere={filiere} />
                ))}
              </div>
            )}

            {filieresBas.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filieresBas.map((filiere) => (
                  <FiliereCard key={filiere.id} filiere={filiere} />
                ))}
              </div>
            )}
          </div>

          {/* --- Aucun résultat --- */}
          {filteredFilieres.length === 0 && !isLoading && (
            <Card>
              <CardContent className="text-center py-12">
                <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Aucune filière trouvée
                </h3>
                <p className="text-gray-500">
                  {searchTerm ? 
                    "Aucune filière ne correspond à votre recherche." : 
                    "Vous n'êtes actuellement assigné à aucune filière."
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