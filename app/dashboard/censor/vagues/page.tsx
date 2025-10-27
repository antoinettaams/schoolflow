"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaCalendarAlt,
  FaPlay,
  FaPause,
  FaCheck,
  FaList,
} from "react-icons/fa";

interface Vague {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: "active" | "upcoming" | "completed";
  description?: string;
  filieres: any[]; // Filières assignées à cette vague
}

export default function VaguesPage() {
  const [vagues, setVagues] = useState<Vague[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newVague, setNewVague] = useState({
    name: "",
    startDate: "",
    endDate: "",
    description: "",
  });

  // Charger depuis localStorage au premier rendu
  useEffect(() => {
    const savedVagues = localStorage.getItem("schoolflow_vagues");
    if (savedVagues) {
      try {
        const parsedVagues = JSON.parse(savedVagues);
        const vaguesWithUpdatedStatus = parsedVagues.map((vague: Vague) => ({
          ...vague,
          status: getVagueStatus(vague.startDate, vague.endDate),
        }));
        setVagues(vaguesWithUpdatedStatus);
      } catch (error) {
        console.error("Erreur lors du parsing des vagues:", error);
        setVagues([]);
      }
    }
    setIsLoaded(true);
  }, []);

  // Sauvegarde dans localStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("schoolflow_vagues", JSON.stringify(vagues));
    }
  }, [vagues, isLoaded]);

  // Détermination du statut
  const getVagueStatus = (
    startDate: string,
    endDate: string
  ): "active" | "upcoming" | "completed" => {
    const today = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (today < start) return "upcoming";
    if (today > end) return "completed";
    return "active";
  };

  // Textes, couleurs et icônes du statut
  const getStatusText = (status: Vague["status"]) => {
    switch (status) {
      case "active":
        return "En cours";
      case "upcoming":
        return "À venir";
      case "completed":
        return "Terminée";
      default:
        return "";
    }
  };

  const getStatusColor = (status: Vague["status"]) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-700 border-green-200";
      case "upcoming":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "completed":
        return "bg-gray-100 text-gray-700 border-gray-200";
      default:
        return "";
    }
  };

  const getStatusIcon = (status: Vague["status"]) => {
    switch (status) {
      case "active":
        return <FaPlay className="text-xs" />;
      case "upcoming":
        return <FaPause className="text-xs" />;
      case "completed":
        return <FaCheck className="text-xs" />;
      default:
        return null;
    }
  };

  // Ajouter une vague
  const ajouterVague = () => {
    if (!newVague.name || !newVague.startDate || !newVague.endDate) {
      alert("Veuillez remplir tous les champs obligatoires");
      return;
    }

    const status = getVagueStatus(newVague.startDate, newVague.endDate);
    const vague: Vague = {
      id: Date.now().toString(),
      name: newVague.name,
      startDate: newVague.startDate,
      endDate: newVague.endDate,
      status: status,
      description: newVague.description,
      filieres: [], // Aucune filière assignée au départ
    };

    setVagues((prev) => [...prev, vague]);
    setShowAddForm(false);
    setNewVague({ name: "", startDate: "", endDate: "", description: "" });
  };

  // Supprimer une vague
  const supprimerVague = (id: string) => {
    if (confirm("Voulez-vous vraiment supprimer cette vague ?")) {
      setVagues((prev) => prev.filter((v) => v.id !== id));
    }
  };

  if (!isLoaded) {
    return (
      <div className="p-6">
        <div className="text-center py-8">Chargement des vagues...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* En-tête */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Gestion des Vagues
          </h1>
          <p className="text-gray-600">
            {vagues.length} vague(s) créée(s) - Créez d'abord les sessions de formation
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <FaPlus /> Nouvelle vague
        </button>
      </div>

      {/* Formulaire d'ajout */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-2xl max-h-[90vh] overflow-hidden">
            {/* En-tête du formulaire */}
            <div className="bg-white p-6 border-b border-gray-200 sticky top-0 z-10">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">
                  Nouvelle vague de formation
                </h2>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="text-gray-400 hover:text-gray-600 text-xl"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Contenu du formulaire */}
            <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom de la vague *
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Vague Janvier-Juin 2024"
                    value={newVague.name}
                    onChange={(e) =>
                      setNewVague((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date de début *
                  </label>
                  <input
                    type="date"
                    value={newVague.startDate}
                    onChange={(e) =>
                      setNewVague((prev) => ({
                        ...prev,
                        startDate: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date de fin *
                  </label>
                  <input
                    type="date"
                    value={newVague.endDate}
                    onChange={(e) =>
                      setNewVague((prev) => ({
                        ...prev,
                        endDate: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    placeholder="Description optionnelle..."
                    value={newVague.description}
                    onChange={(e) =>
                      setNewVague((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
                  />
                </div>
              </div>

              {/* Aperçu */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Aperçu de la vague
                </h3>
                {newVague.name && (
                  <p className="text-sm text-gray-600">
                    <strong>Nom:</strong> {newVague.name}
                  </p>
                )}
                {newVague.startDate && (
                  <p className="text-sm text-gray-600">
                    <strong>Début:</strong>{" "}
                    {new Date(newVague.startDate).toLocaleDateString("fr-FR")}
                  </p>
                )}
                {newVague.endDate && (
                  <p className="text-sm text-gray-600">
                    <strong>Fin:</strong>{" "}
                    {new Date(newVague.endDate).toLocaleDateString("fr-FR")}
                  </p>
                )}
                {newVague.startDate && newVague.endDate && (
                  <p className="text-sm text-gray-600">
                    <strong>Statut:</strong>{" "}
                    {getStatusText(
                      getVagueStatus(newVague.startDate, newVague.endDate)
                    )}
                  </p>
                )}
              </div>

              {/* Information workflow */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">📋 Prochaines étapes</h4>
                <p className="text-sm text-blue-800">
                  Après la création de cette vague, vous pourrez :
                </p>
                <ul className="text-sm text-blue-800 mt-2 list-disc list-inside space-y-1">
                  <li>Assigner des filières existantes</li>
                  <li>Inscrire des étudiants</li>
                  <li>Créer l'emploi du temps</li>
                  <li>Assigner les formateurs</li>
                </ul>
              </div>
            </div>

            {/* Boutons */}
            <div className="bg-white p-6 border-t border-gray-200 sticky bottom-0">
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={ajouterVague}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  Créer la vague
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Liste des vagues */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vagues.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white rounded-lg border border-gray-200">
            <FaCalendarAlt className="text-5xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Aucune vague créée
            </h3>
            <p className="text-gray-500 mb-4">
              Créez votre première vague de formation
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              Créer une vague
            </button>
          </div>
        ) : (
          vagues.map((vague) => (
            <div
              key={vague.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {vague.name}
                  </h3>
                  <span
                    className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                      vague.status
                    )}`}
                  >
                    {getStatusIcon(vague.status)}
                    {getStatusText(vague.status)}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-2">
                    <FaCalendarAlt className="text-gray-400" />
                    <span>
                      Du{" "}
                      {new Date(vague.startDate).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaCalendarAlt className="text-gray-400" />
                    <span>
                      Au {new Date(vague.endDate).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaList className="text-gray-400" />
                    <span>
                      {vague.filieres.length} filière(s) assignée(s)
                    </span>
                  </div>
                </div>

                {vague.description && (
                  <p className="mt-3 text-sm text-gray-500 line-clamp-2 mb-4">
                    {vague.description}
                  </p>
                )}

                <div className="flex gap-2 pt-4 border-t border-gray-200">
                  <Link
                    href={`/dashboard/censeur/vagues/${vague.id}/filieres`}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded text-sm transition-colors text-center"
                  >
                    <FaList className="inline mr-1" /> Gérer filières
                  </Link>
                  <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded text-sm transition-colors">
                    <FaEdit className="inline mr-1" /> Modifier
                  </button>
                  <button
                    onClick={() => supprimerVague(vague.id)}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded text-sm transition-colors"
                  >
                    <FaTrash className="inline mr-1" /> Supprimer
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}