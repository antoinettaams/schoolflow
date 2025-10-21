// /app/dashboard/admin/subjects/page.tsx
"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  FaBook, 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaSearch,
  FaSort,
  FaSortUp,
  FaSortDown,
} from 'react-icons/fa';

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

// Composant Modal d'édition
const EditSubjectModal: React.FC<{
  subject: Subject;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedSubject: Subject) => void;
}> = ({ subject, isOpen, onClose, onUpdate }) => {
  const [formData, setFormData] = useState<Subject>(subject);
  const [availableLevels, setAvailableLevels] = useState<Level[]>([]);
  const [loading, setLoading] = useState(false);

  const colorOptions = [
    '#3B82F6', '#10B981', '#8B5CF6', '#EF4444', 
    '#F59E0B', '#06B6D4', '#84CC16', '#EC4899',
  ];

  useEffect(() => {
    const savedLevels = localStorage.getItem('schoolLevels');
    if (savedLevels) {
      setAvailableLevels(JSON.parse(savedLevels));
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setFormData(subject);
    }
  }, [isOpen, subject]);

  const handleLevelToggle = (levelId: string) => {
    setFormData(prev => ({
      ...prev,
      levels: prev.levels.includes(levelId)
        ? prev.levels.filter(id => id !== levelId)
        : [...prev.levels, levelId]
    }));
  };

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
      const existingSubjects = JSON.parse(localStorage.getItem('subjects') || '[]');
      const updatedSubjects = existingSubjects.map((sub: Subject) =>
        sub.id === subject.id ? formData : sub
      );
      
      localStorage.setItem('subjects', JSON.stringify(updatedSubjects));
      onUpdate(formData);
      onClose();
      
    } catch (error) {
      console.error('Erreur lors de la modification:', error);
      alert('Une erreur est survenue lors de la modification');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 className="text-2xl font-bold text-gray-900">
            Modifier la matière
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FaTimes className="text-gray-500 text-lg" />
          </button>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom de la matière *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Couleur
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
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Niveaux concernés *
              </label>
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
            </div>

            <div className="flex gap-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Sauvegarde...
                  </>
                ) : (
                  <>
                    <FaSave />
                    Sauvegarder
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Composant principal
const SubjectsPage = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

  // Chargement depuis localStorage
  useEffect(() => {
    const savedSubjects = localStorage.getItem('subjects');
    if (savedSubjects) {
      setSubjects(JSON.parse(savedSubjects));
    } else {
      const defaultSubjects: Subject[] = [
        {
          id: '1',
          name: 'Mathématiques',
          coefficient: 3,
          color: '#3B82F6',
          levels: ['1', '2', '3', '4'],
          teacherCount: 0,
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Français',
          coefficient: 2,
          color: '#10B981',
          levels: ['1', '2', '3', '4'],
          teacherCount: 0,
          createdAt: new Date().toISOString()
        }
      ];
      setSubjects(defaultSubjects);
      localStorage.setItem('subjects', JSON.stringify(defaultSubjects));
    }
    setLoading(false);
  }, []);

  // Fonction de tri
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) return <FaSort className="text-gray-400" />;
    return sortDirection === 'asc' ? <FaSortUp className="text-blue-600" /> : <FaSortDown className="text-blue-600" />;
  };

  // Filtrer les matières
  const filteredSubjects = subjects
    .filter(subject =>
      subject.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const aValue = a[sortField as keyof Subject];
      const bValue = b[sortField as keyof Subject];

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  // Supprimer une matière
  const deleteSubject = (subjectId: string, subjectName: string) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer la matière "${subjectName}" ?`)) {
      const updatedSubjects = subjects.filter(subject => subject.id !== subjectId);
      setSubjects(updatedSubjects);
      localStorage.setItem('subjects', JSON.stringify(updatedSubjects));
    }
  };

  // Ouvrir la modal d'édition
  const handleEditClick = (subject: Subject) => {
    setSelectedSubject(subject);
    setEditModalOpen(true);
  };

  // Mettre à jour après édition
  const handleSubjectUpdate = (updatedSubject: Subject) => {
    setSubjects(prev => prev.map(sub => 
      sub.id === updatedSubject.id ? updatedSubject : sub
    ));
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Conteneur principal avec défilement */}
      <div className="h-screen overflow-y-auto">
        <div className="p-6">
          <div className="max-w-6xl mx-auto">
            
            {/* En-tête */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <FaBook className="text-blue-600 text-2xl" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">Gestion des Matières</h1>
                    <p className="text-gray-600">
                      Configurez les matières enseignées dans votre établissement
                    </p>
                  </div>
                </div>
                
                <Link
                  href="/dashboard/admin/subjects/create"
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  <FaPlus />
                  Ajouter une matière
                </Link>
              </div>
            </div>

            {/* Barre de recherche et filtres */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Rechercher une matière..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                <div className="text-sm text-gray-500 flex items-center">
                  {filteredSubjects.length} matière(s) trouvée(s)
                </div>
              </div>
            </div>

            {/* Liste des matières */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              {/* En-tête du tableau */}
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <div className="grid grid-cols-12 gap-4 items-center">
                  <div 
                    className="col-span-5 flex items-center gap-2 cursor-pointer"
                    onClick={() => handleSort('name')}
                  >
                    <span className="font-semibold text-gray-900">Matière</span>
                    {getSortIcon('name')}
                  </div>
                  <div 
                    className="col-span-2 flex items-center gap-2 cursor-pointer"
                    onClick={() => handleSort('coefficient')}
                  >
                    <span className="font-semibold text-gray-900">Coefficient</span>
                    {getSortIcon('coefficient')}
                  </div>
                  <div className="col-span-3 font-semibold text-gray-900">Niveaux</div>
                  <div 
                    className="col-span-1 flex items-center gap-2 cursor-pointer"
                    onClick={() => handleSort('teacherCount')}
                  >
                    <span className="font-semibold text-gray-900">Profs</span>
                    {getSortIcon('teacherCount')}
                  </div>
                  <div className="col-span-1 font-semibold text-gray-900 text-right">Actions</div>
                </div>
              </div>

              {/* Corps du tableau */}
              <div className="divide-y divide-gray-200">
                {filteredSubjects.length === 0 ? (
                  <div className="text-center py-12">
                    <FaBook className="text-5xl text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {searchTerm ? 'Aucune matière trouvée' : 'Aucune matière créée'}
                    </h3>
                    <p className="text-gray-500 mb-4">
                      {searchTerm 
                        ? 'Aucune matière ne correspond à votre recherche.' 
                        : 'Commencez par créer votre première matière.'
                      }
                    </p>
                    {!searchTerm && (
                      <Link
                        href="/dashboard/admin/subjects/create"
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors inline-block"
                      >
                        Créer la première matière
                      </Link>
                    )}
                  </div>
                ) : (
                  filteredSubjects.map((subject) => (
                    <div key={subject.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                      <div className="grid grid-cols-12 gap-4 items-center">
                        {/* Nom et couleur */}
                        <div className="col-span-5 flex items-center gap-4">
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: subject.color }}
                          ></div>
                          <div>
                            <div className="font-semibold text-gray-900">{subject.name}</div>
                            <div className="text-sm text-gray-500">
                              Créé le {new Date(subject.createdAt).toLocaleDateString('fr-FR')}
                            </div>
                          </div>
                        </div>

                        {/* Coefficient */}
                        <div className="col-span-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Coef. {subject.coefficient}
                          </span>
                        </div>

                        {/* Niveaux */}
                        <div className="col-span-3">
                          <div className="flex flex-wrap gap-1">
                            {subject.levels.slice(0, 3).map((levelId, index) => {
                              // Dans un vrai projet, on récupérerait le nom du niveau depuis localStorage
                              const levelNames: {[key: string]: string} = {
                                '1': '6ème', '2': '5ème', '3': '4ème', '4': '3ème'
                              };
                              return (
                                <span
                                  key={index}
                                  className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800"
                                >
                                  {levelNames[levelId] || levelId}
                                </span>
                              );
                            })}
                            {subject.levels.length > 3 && (
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                +{subject.levels.length - 3}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Nombre de professeurs */}
                        <div className="col-span-1">
                          <span className="text-sm text-gray-600">
                            {subject.teacherCount} prof{subject.teacherCount > 1 ? 's' : ''}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="col-span-1 flex justify-end gap-2">
                          <button
                            onClick={() => handleEditClick(subject)}
                            className="text-blue-600 hover:text-blue-700 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                            title="Modifier"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => deleteSubject(subject.id, subject.name)}
                            className="text-red-600 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors"
                            title="Supprimer"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Informations */}
            <div className="bg-blue-50 rounded-xl p-6 mt-6 border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-2">Comment configurer les matières ?</h3>
              <ul className="text-blue-800 space-y-1 text-sm">
                <li>• Créez d'abord toutes les matières enseignées dans votre établissement</li>
                <li>• Définissez les coefficients pour le calcul des moyennes</li>
                <li>• Assignez les matières aux niveaux concernés</li>
                <li>• Les professeurs pourront ensuite être assignés à ces matières</li>
              </ul>
            </div>

          </div>
        </div>
      </div>

      {/* Modal d'édition */}
      {selectedSubject && (
        <EditSubjectModal
          subject={selectedSubject}
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          onUpdate={handleSubjectUpdate}
        />
      )}
    </div>
  );
};

// Icône FaTimes manquante
const FaTimes = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
  </svg>
);

// Icône FaSave manquante
const FaSave = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6a1 1 0 10-2 0v5.586l-1.293-1.293z"/>
    <path d="M3 5a2 2 0 012-2h1a1 1 0 010 2H5v7h2v1H5a2 2 0 01-2-2V5z"/>
  </svg>
);

export default SubjectsPage;