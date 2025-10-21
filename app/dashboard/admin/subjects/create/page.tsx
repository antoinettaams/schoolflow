// /app/dashboard/admin/subjects/create/page.tsx
"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FaPlus, FaArrowLeft, FaSave, FaExclamationTriangle } from 'react-icons/fa';

interface Subject {
  id: string;
  name: string;
  coefficient: number;
  color: string;
  levels: string[];
  teacherCount: number;
  createdAt: string;
}

interface Level {
  id: string;
  name: string;
}

const CreateSubjectPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [availableLevels, setAvailableLevels] = useState<Level[]>([]);
  const [levelsLoading, setLevelsLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    coefficient: 1,
    color: '#3B82F6',
    levels: [] as string[],
    description: ''
  });

  // CHARGER les niveaux depuis localStorage
  useEffect(() => {
    const loadLevels = () => {
      const savedLevels = localStorage.getItem('schoolLevels');
      if (savedLevels) {
        setAvailableLevels(JSON.parse(savedLevels));
      }
      setLevelsLoading(false);
    };

    loadLevels();
    
    // Écouter les changements de localStorage (au cas où)
    window.addEventListener('storage', loadLevels);
    return () => window.removeEventListener('storage', loadLevels);
  }, []);

  // Couleurs prédéfinies
  const colorOptions = [
    '#3B82F6', '#10B981', '#8B5CF6', '#EF4444', 
    '#F59E0B', '#06B6D4', '#84CC16', '#EC4899',
  ];

  // Gérer la sélection des niveaux
  const handleLevelToggle = (levelId: string) => {
    setFormData(prev => ({
      ...prev,
      levels: prev.levels.includes(levelId)
        ? prev.levels.filter(id => id !== levelId)
        : [...prev.levels, levelId]
    }));
  };

  // CRÉATION avec sauvegarde localStorage
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('Veuillez saisir un nom pour la matière');
      return;
    }

    if (formData.levels.length === 0) {
      alert('Veuillez sélectionner au moins un niveau');
      return;
    }

    setLoading(true);

    try {
      // Récupérer les matières existantes
      const existingSubjects = JSON.parse(localStorage.getItem('subjects') || '[]');
      
      // Créer la nouvelle matière
      const newSubject: Subject = {
        id: Date.now().toString(),
        name: formData.name,
        coefficient: formData.coefficient,
        color: formData.color,
        levels: formData.levels,
        teacherCount: 0,
        createdAt: new Date().toISOString()
      };

      // Ajouter à la liste
      const updatedSubjects = [...existingSubjects, newSubject];
      
      // Sauvegarder dans localStorage
      localStorage.setItem('subjects', JSON.stringify(updatedSubjects));
      
      console.log('Matière créée:', newSubject);
      
      // Redirection vers la liste
      router.push('/dashboard/admin/subjects');
      
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      alert('Une erreur est survenue lors de la création de la matière');
    } finally {
      setLoading(false);
    }
  };

  // Fonctions pour le défilement
  const scrollToBottom = () => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'smooth'
    });
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Conteneur principal avec défilement */}
      <div className="h-screen overflow-y-auto">
        <div className="p-6">
          <div className="max-w-2xl mx-auto">
            
            {/* En-tête avec bouton retour */}
            <div className="flex items-center gap-4 mb-6">
              <Link
                href="/dashboard/admin/subjects"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors p-2 rounded-lg hover:bg-gray-100"
              >
                <FaArrowLeft />
                <span>Retour</span>
              </Link>
            </div>

            {/* Carte principale */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              {/* Titre */}
              <div className="flex items-center gap-4 mb-8">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Créer une nouvelle matière</h1>
                  <p className="text-gray-600">
                    Remplissez les informations pour créer une nouvelle matière
                  </p>
                </div>
              </div>

              {/* Formulaire */}
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Nom de la matière */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom de la matière *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Mathématiques, Français, SVT..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    required
                  />
                </div>

                {/* Coefficient et Couleur sur la même ligne */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Coefficient */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Coefficient *
                    </label>
                    <select
                      value={formData.coefficient}
                      onChange={(e) => setFormData(prev => ({ ...prev, coefficient: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(coef => (
                        <option key={coef} value={coef}>
                          Coefficient {coef}
                        </option>
                      ))}
                    </select>
                    <p className="text-sm text-gray-500 mt-1">
                      Utilisé pour le calcul des moyennes
                    </p>
                  </div>

                  {/* Couleur */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Couleur d'identification
                    </label>
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-8 h-8 rounded-full border-2 border-gray-300"
                        style={{ backgroundColor: formData.color }}
                      ></div>
                      <select
                        value={formData.color}
                        onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        {colorOptions.map(color => (
                          <option key={color} value={color}>
                            {color === '#3B82F6' && 'Bleu'}
                            {color === '#10B981' && 'Vert'}
                            {color === '#8B5CF6' && 'Violet'}
                            {color === '#EF4444' && 'Rouge'}
                            {color === '#F59E0B' && 'Orange'}
                            {color === '#06B6D4' && 'Cyan'}
                            {color === '#84CC16' && 'Lime'}
                            {color === '#EC4899' && 'Rose'}
                          </option>
                        ))}
                      </select>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Pour identifier visuellement la matière
                    </p>
                  </div>

                </div>

                {/* Niveaux concernés - DYNAMIQUE */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Niveaux concernés *
                  </label>
                  
                  {levelsLoading ? (
                    <div className="animate-pulse">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                          <div key={i} className="h-12 bg-gray-200 rounded-lg"></div>
                        ))}
                      </div>
                    </div>
                  ) : availableLevels.length === 0 ? (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                      <FaExclamationTriangle className="text-yellow-500 text-xl mx-auto mb-2" />
                      <p className="text-yellow-800 font-medium mb-2">Aucun niveau disponible</p>
                      <p className="text-yellow-700 text-sm mb-3">
                        Vous devez d'abord créer des niveaux dans la section "Classes & Niveaux"
                      </p>
                      <Link
                        href="/dashboard/admin/classes"
                        className="inline-flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
                      >
                        <FaPlus />
                        Créer des niveaux
                      </Link>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {availableLevels.map((level) => (
                          <label
                            key={level.id}
                            className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={formData.levels.includes(level.id)}
                              onChange={() => handleLevelToggle(level.id)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm font-medium text-gray-700">{level.name}</span>
                          </label>
                        ))}
                      </div>
                      <p className="text-sm text-gray-500 mt-2">
                        {formData.levels.length} niveau{formData.levels.length !== 1 ? 'x' : ''} sélectionné{formData.levels.length !== 1 ? 's' : ''}
                      </p>
                    </>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (optionnel)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    placeholder="Description de la matière, objectifs pédagogiques..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-colors"
                  />
                </div>

                {/* Aperçu */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-3">Aperçu de la matière</h3>
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-6 h-6 rounded-full"
                      style={{ backgroundColor: formData.color }}
                    ></div>
                    <div>
                      <div className="font-semibold text-gray-900">
                        {formData.name || 'Nom de la matière'}
                      </div>
                      <div className="text-sm text-gray-600">
                        Coefficient {formData.coefficient} • {formData.levels.length} niveau{formData.levels.length !== 1 ? 'x' : ''} concerné{formData.levels.length !== 1 ? 's' : ''}
                      </div>
                      {formData.levels.length > 0 && (
                        <div className="text-xs text-gray-500 mt-1">
                          Niveaux : {formData.levels.map(levelId => {
                            const level = availableLevels.find(l => l.id === levelId);
                            return level?.name;
                          }).filter(Boolean).join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Boutons d'action */}
                <div className="flex gap-4 pt-6 border-t border-gray-200">
                  <Link
                    href="/dashboard/admin/subjects"
                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors text-center"
                  >
                    Annuler
                  </Link>
                  <button
                    type="submit"
                    disabled={loading || availableLevels.length === 0}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        Création...
                      </>
                    ) : (
                      <>
                        <FaSave />
                        Créer la matière
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Informations supplémentaires */}
            <div className="space-y-6">
             {/* Section conseils */}
              <div className="bg-green-50 rounded-xl p-6 border border-green-200">
                <h3 className="font-semibold text-green-900 mb-3">Conseils de configuration</h3>
                <ul className="text-green-800 space-y-2 text-sm">
                  <li>✅ <strong>Nom clair</strong> : Utilisez le nom officiel de la matière</li>
                  <li>✅ <strong>Cohérence des coefficients</strong> : Maintenez la même logique pour toutes les matières</li>
                  <li>✅ <strong>Niveaux appropriés</strong> : Ne sélectionnez que les niveaux où la matière est réellement enseignée</li>
                  <li>✅ <strong>Couleur distinctive</strong> : Choisissez des couleurs différentes pour les matières principales</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateSubjectPage;