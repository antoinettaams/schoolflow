"use client";
import React, { useState, useEffect } from 'react';
import { FaWhatsapp, FaChalkboardTeacher, FaArrowRight, FaLink } from 'react-icons/fa';

interface TeacherClass {
  id: string;
  className: string;
  level: string;
  whatsappGroup: string;
  studentCount: number;
  parentCount: number;
}

const TeacherForumPage = () => {
  const [teacherClasses, setTeacherClasses] = useState<TeacherClass[]>([]);
  
  // Données simulées - À remplacer par l'API
  useEffect(() => {
    const mockData: TeacherClass[] = [
      {
        id: "1",
        className: "6ème A",
        level: "6ème", 
        whatsappGroup: "https://chat.whatsapp.com/ABC123Classe6A",
        studentCount: 28,
        parentCount: 25
      },
      {
        id: "2",
        className: "4ème B",
        level: "4ème",
        whatsappGroup: "https://chat.whatsapp.com/DEF456Classe4B", 
        studentCount: 30,
        parentCount: 28
      }
    ];
    
    setTeacherClasses(mockData);
  }, []);

  const handleWhatsAppRedirect = (whatsappUrl: string, className: string) => {
    window.open(whatsappUrl, '_blank');
    console.log(`Redirection WhatsApp pour ${className}`);
  };

  const copyGroupLink = (whatsappUrl: string, className: string) => {
    navigator.clipboard.writeText(whatsappUrl);
    alert(`Lien du groupe ${className} copié !`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 lg:pl-5 pt-20 lg:pt-6">
      <div className="max-w-4xl mx-auto">
        {/* En-tête */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="bg-green-100 p-3 rounded-lg">
              <FaWhatsapp className="text-green-600 text-2xl" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Groupes des Classes</h1>
              <p className="text-gray-600">
                Accédez aux groupes WhatsApp de vos classes et gérez les liens
              </p>
            </div>
          </div>
        </div>

        {/* Liste des groupes */}
        <div className="grid gap-6">
          {teacherClasses.map((classItem) => (
            <div key={classItem.id} className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <FaChalkboardTeacher className="text-purple-600 text-xl" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{classItem.className}</h3>
                    <p className="text-gray-600 mb-2">
                      Niveau : {classItem.level} • {classItem.studentCount} élèves • {classItem.parentCount} parents
                    </p>
                    <p className="text-sm text-gray-500">
                      Groupe de communication avec les parents
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => copyGroupLink(classItem.whatsappGroup, classItem.className)}
                    className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                  >
                    <FaLink />
                    <span>Copier le lien</span>
                  </button>
                  
                  <button
                    onClick={() => handleWhatsAppRedirect(classItem.whatsappGroup, classItem.className)}
                    className="flex items-center gap-3 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                  >
                    <FaWhatsapp className="text-xl" />
                    <span>Rejoindre</span>
                    <FaArrowRight />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Informations pour professeurs */}
        <div className="bg-purple-50 rounded-xl p-6 mt-6 border border-purple-200">
          <h3 className="font-semibold text-purple-900 mb-2">Fonctionnalités professeur</h3>
          <ul className="text-purple-800 space-y-1 text-sm">
            <li>• Accédez à tous les groupes de vos classes</li>
            <li>• Copiez les liens pour les partager avec les parents</li>
            <li>• Annonces importantes et communications rapides</li>
            <li>• Échanges avec les parents d&apos;élèves</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TeacherForumPage;