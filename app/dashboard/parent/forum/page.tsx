"use client";
import React, { useState, useEffect } from 'react';
import { FaWhatsapp, FaUsers, FaChild, FaArrowRight } from 'react-icons/fa';

interface ChildClass {
  id: string;
  childName: string;
  className: string;
  level: string;
  whatsappGroup: string;
  teacher: string;
}

const ParentForumPage = () => {
  const [childrenClasses, setChildrenClasses] = useState<ChildClass[]>([]);
  
  // Données simulées - À remplacer par l'API
  useEffect(() => {
    // En réalité, ça viendrait de l'API avec les enfants du parent connecté
    const mockData: ChildClass[] = [
      {
        id: "1",
        childName: "Marie Dubois",
        className: "6ème A",
        level: "6ème",
        whatsappGroup: "https://chat.whatsapp.com/ABC123Classe6A",
        teacher: "M. Martin"
      },
      {
        id: "2", 
        childName: "Pierre Dubois",
        className: "4ème B",
        level: "4ème",
        whatsappGroup: "https://chat.whatsapp.com/DEF456Classe4B",
        teacher: "Mme. Bernard"
      }
    ];
    
    setChildrenClasses(mockData);
  }, []);

  const handleWhatsAppRedirect = (whatsappUrl: string, childName: string, className: string) => {
    // Ouvrir WhatsApp dans un nouvel onglet
    window.open(whatsappUrl, '_blank');
    
    // Optionnel : tracking analytics
    console.log(`Redirection WhatsApp pour ${childName} - ${className}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* En-tête */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="bg-green-100 p-3 rounded-lg">
              <FaWhatsapp className="text-green-600 text-2xl" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Groupes de Classe</h1>
              <p className="text-gray-600">
                Rejoignez les groupes WhatsApp des classes de vos enfants
              </p>
            </div>
          </div>
        </div>

        {/* Liste des groupes */}
        <div className="grid gap-6">
          {childrenClasses.map((childClass) => (
            <div key={childClass.id} className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <FaUsers className="text-blue-600 text-xl" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <FaChild className="text-gray-400" />
                      <span className="font-semibold text-gray-900">{childClass.childName}</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{childClass.className}</h3>
                    <p className="text-gray-600 mb-2">
                      Niveau : {childClass.level} • Professeur principal : {childClass.teacher}
                    </p>
                    <p className="text-sm text-gray-500">
                      Groupe de discussion et d'annonces importantes
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => handleWhatsAppRedirect(
                    childClass.whatsappUrl, 
                    childClass.childName, 
                    childClass.className
                  )}
                  className="flex items-center gap-3 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors min-w-[200px] justify-center"
                >
                  <FaWhatsapp className="text-xl" />
                  <span>Rejoindre le groupe</span>
                  <FaArrowRight />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Message si pas d'enfants */}
        {childrenClasses.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <FaUsers className="text-5xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Aucun enfant inscrit
            </h3>
            <p className="text-gray-500">
              Vous n'avez pas d'enfants inscrits dans l'établissement.
            </p>
          </div>
        )}

        {/* Informations */}
        <div className="bg-blue-50 rounded-xl p-6 mt-6 border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">Informations importantes</h3>
          <ul className="text-blue-800 space-y-1 text-sm">
            <li>• Ces groupes sont réservés aux parents d'élèves de la classe</li>
            <li>• Respectez les règles de bonne conduite dans les échanges</li>
            <li>• Les annonces officielles sont également disponibles sur le portail</li>
            <li>• En cas de problème avec le lien, contactez l'administration</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ParentForumPage;