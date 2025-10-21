// /app/dashboard/admin/classes/page.tsx
"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  FaSchool, 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaSearch,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaExclamationTriangle
} from 'react-icons/fa';

interface Level {
  id: string;
  name: string;
  order: number;
  createdAt: string;
}

interface Class {
  id: string;
  name: string;
  levelId: string;
  levelName: string;
  maxStudents: number;
  currentStudents: number;
  mainTeacher?: string;
  mainTeacherName?: string;
  room?: string;
  academicYear: string;
  createdAt: string;
}

const ClassesPage = () => {
  const [levels, setLevels] = useState<Level[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'levels' | 'classes'>('levels');

  // CHARGEMENT depuis localStorage
  useEffect(() => {
    const loadData = () => {
      // Charger les niveaux
      const savedLevels = localStorage.getItem('schoolLevels');
      if (savedLevels) {
        setLevels(JSON.parse(savedLevels));
      } else {
        // Données par défaut
        const defaultLevels: Level[] = [
          { id: '1', name: '6ème', order: 1, createdAt: new Date().toISOString() },
          { id: '2', name: '5ème', order: 2, createdAt: new Date().toISOString() },
          { id: '3', name: '4ème', order: 3, createdAt: new Date().toISOString() },
          { id: '4', name: '3ème', order: 4, createdAt: new Date().toISOString() }
        ];
        setLevels(defaultLevels);
        localStorage.setItem('schoolLevels', JSON.stringify(defaultLevels));
      }

      // Charger les classes
      const savedClasses = localStorage.getItem('schoolClasses');
      if (savedClasses) {
        setClasses(JSON.parse(savedClasses));
      } else {
        setClasses([]);
      }

      setLoading(false);
    };

    loadData();
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

  // CRÉER UN NIVEAU
  const createLevel = (levelName: string) => {
    const newLevel: Level = {
      id: Date.now().toString(),
      name: levelName,
      order: levels.length + 1,
      createdAt: new Date().toISOString()
    };

    const updatedLevels = [...levels, newLevel];
    setLevels(updatedLevels);
    localStorage.setItem('schoolLevels', JSON.stringify(updatedLevels));
  };

  // CRÉER UNE CLASSE
  const createClass = (className: string, levelId: string, maxStudents: number, room?: string) => {
    const level = levels.find(l => l.id === levelId);
    if (!level) return;

    const newClass: Class = {
      id: Date.now().toString(),
      name: className,
      levelId: levelId,
      levelName: level.name,
      maxStudents: maxStudents,
      currentStudents: 0,
      room: room,
      academicYear: '2024-2025',
      createdAt: new Date().toISOString()
    };

    const updatedClasses = [...classes, newClass];
    setClasses(updatedClasses);
    localStorage.setItem('schoolClasses', JSON.stringify(updatedClasses));
  };

  // SUPPRIMER UN NIVEAU
  const deleteLevel = (levelId: string, levelName: string) => {
    // Vérifier si des classes utilisent ce niveau
    const classesUsingLevel = classes.filter(cls => cls.levelId === levelId);
    if (classesUsingLevel.length > 0) {
      alert(`Impossible de supprimer le niveau "${levelName}" : ${classesUsingLevel.length} classe(s) l'utilise(nt).`);
      return;
    }

    if (confirm(`Êtes-vous sûr de vouloir supprimer le niveau "${levelName}" ?`)) {
      const updatedLevels = levels.filter(level => level.id !== levelId);
      setLevels(updatedLevels);
      localStorage.setItem('schoolLevels', JSON.stringify(updatedLevels));
    }
  };

  // SUPPRIMER UNE CLASSE
  const deleteClass = (classId: string, className: string) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer la classe "${className}" ?`)) {
      const updatedClasses = classes.filter(cls => cls.id !== classId);
      setClasses(updatedClasses);
      localStorage.setItem('schoolClasses', JSON.stringify(updatedClasses));
    }
  };

  // Filtrer les classes
  const filteredClasses = classes
    .filter(cls =>
      cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cls.levelName.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const aValue = a[sortField as keyof Class];
      const bValue = b[sortField as keyof Class];

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

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
              {[1, 2, 3, 4].map(i => (
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
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">Classes & Niveaux</h1>
                    <p className="text-gray-600">
                      Gérez la structure pédagogique de votre établissement
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => setActiveTab('levels')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      activeTab === 'levels' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    <FaPlus />
                    Nouveau niveau
                  </button>
                  <button
                    onClick={() => setActiveTab('classes')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      activeTab === 'classes' 
                        ? 'bg-green-600 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    <FaPlus />
                    Nouvelle classe
                  </button>
                </div>
              </div>
            </div>

            {/* Navigation par onglets */}
            <div className="bg-white rounded-xl shadow-sm mb-6">
              <div className="flex border-b">
                <button
                  onClick={() => setActiveTab('levels')}
                  className={`flex-1 py-4 px-6 text-center font-medium border-b-2 transition-colors ${
                    activeTab === 'levels'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  📚 Niveaux ({levels.length})
                </button>
                <button
                  onClick={() => setActiveTab('classes')}
                  className={`flex-1 py-4 px-6 text-center font-medium border-b-2 transition-colors ${
                    activeTab === 'classes'
                      ? 'border-green-600 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  🏫 Classes ({classes.length})
                </button>
              </div>
            </div>

            {/* Contenu des onglets */}
            {activeTab === 'levels' ? (
              /* === ONGLET NIVEAUX === */
              <div className="space-y-6">
                
                {/* Formulaire création niveau */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Créer un nouveau niveau</h3>
                  <CreateLevelForm onCreateLevel={createLevel} />
                </div>

                {/* Liste des niveaux */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900">Niveaux existants</h3>
                  </div>
                  
                  <div className="divide-y divide-gray-200">
                    {levels.length === 0 ? (
                      <div className="text-center py-12">
                        <FaSchool className="text-5xl text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun niveau créé</h3>
                        <p className="text-gray-500">
                          Commencez par créer votre premier niveau
                        </p>
                      </div>
                    ) : (
                      levels.map((level) => (
                        <div key={level.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="bg-blue-100 p-3 rounded-lg">
                                <FaSchool className="text-blue-600" />
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900 text-lg">{level.name}</div>
                                <div className="text-sm text-gray-500">
                                  {classes.filter(cls => cls.levelId === level.id).length} classe(s) • 
                                  Créé le {new Date(level.createdAt).toLocaleDateString('fr-FR')}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex gap-2">
                              <button
                                onClick={() => {/* TODO: Édition */}}
                                className="text-blue-600 hover:text-blue-700 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                                title="Modifier"
                              >
                                <FaEdit />
                              </button>
                              <button
                                onClick={() => deleteLevel(level.id, level.name)}
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

              </div>
            ) : (
              /* === ONGLET CLASSES === */
              <div className="space-y-6">
                
                {/* Barre de recherche */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Rechercher une classe ou un niveau..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-500 flex items-center">
                      {filteredClasses.length} classe(s) trouvée(s)
                    </div>
                  </div>
                </div>

                {/* Formulaire création classe */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Créer une nouvelle classe</h3>
                  <CreateClassForm 
                    levels={levels} 
                    onCreateClass={createClass} 
                  />
                </div>

                {/* Liste des classes */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <div className="grid grid-cols-12 gap-4 items-center">
                      <div 
                        className="col-span-4 flex items-center gap-2 cursor-pointer"
                        onClick={() => handleSort('name')}
                      >
                        <span className="font-semibold text-gray-900">Classe</span>
                        {getSortIcon('name')}
                      </div>
                      <div 
                        className="col-span-2 flex items-center gap-2 cursor-pointer"
                        onClick={() => handleSort('levelName')}
                      >
                        <span className="font-semibold text-gray-900">Niveau</span>
                        {getSortIcon('levelName')}
                      </div>
                      <div 
                        className="col-span-3 flex items-center gap-2 cursor-pointer"
                        onClick={() => handleSort('currentStudents')}
                      >
                        <span className="font-semibold text-gray-900">Effectif</span>
                        {getSortIcon('currentStudents')}
                      </div>
                      <div className="col-span-2 font-semibold text-gray-900">Salle</div>
                      <div className="col-span-1 font-semibold text-gray-900 text-right">Actions</div>
                    </div>
                  </div>

                  <div className="divide-y divide-gray-200">
                    {filteredClasses.length === 0 ? (
                      <div className="text-center py-12">
                        <FaSchool className="text-5xl text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {searchTerm ? 'Aucune classe trouvée' : 'Aucune classe créée'}
                        </h3>
                        <p className="text-gray-500 mb-4">
                          {searchTerm 
                            ? 'Aucune classe ne correspond à votre recherche.' 
                            : 'Commencez par créer votre première classe.'
                          }
                        </p>
                      </div>
                    ) : (
                      filteredClasses.map((cls) => (
                        <div key={cls.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                          <div className="grid grid-cols-12 gap-4 items-center">
                            {/* Nom et icône */}
                            <div className="col-span-4 flex items-center gap-4">
                              <div className="bg-green-100 p-3 rounded-lg">
                                <FaSchool className="text-green-600" />
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900">{cls.name}</div>
                                <div className="text-sm text-gray-500">
                                  Créé le {new Date(cls.createdAt).toLocaleDateString('fr-FR')}
                                </div>
                              </div>
                            </div>

                            {/* Niveau */}
                            <div className="col-span-2">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {cls.levelName}
                              </span>
                            </div>

                            {/* Effectif */}
                            <div className="col-span-3">
                              <div className="flex items-center gap-3">
                                <div className="flex-1">
                                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                                    <span>{cls.currentStudents}/{cls.maxStudents} élèves</span>
                                    <span>{Math.round((cls.currentStudents / cls.maxStudents) * 100)}%</span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                      className="bg-green-600 h-2 rounded-full transition-all" 
                                      style={{ width: `${(cls.currentStudents / cls.maxStudents) * 100}%` }}
                                    ></div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Salle */}
                            <div className="col-span-2">
                              <span className="text-sm text-gray-600">
                                {cls.room || 'Non attribuée'}
                              </span>
                            </div>

                            {/* Actions */}
                            <div className="col-span-1 flex justify-end gap-2">
                              <button
                                onClick={() => {/* TODO: Édition */}}
                                className="text-blue-600 hover:text-blue-700 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                                title="Modifier"
                              >
                                <FaEdit />
                              </button>
                              <button
                                onClick={() => deleteClass(cls.id, cls.name)}
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

              </div>
            )}

            {/* Statistiques */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-white rounded-xl shadow-sm p-6 text-center">
                <div className="text-2xl font-bold text-blue-600">{levels.length}</div>
                <div className="text-gray-600">Niveaux</div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6 text-center">
                <div className="text-2xl font-bold text-green-600">{classes.length}</div>
                <div className="text-gray-600">Classes totales</div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {classes.reduce((total, cls) => total + cls.currentStudents, 0)}
                </div>
                <div className="text-gray-600">Élèves total</div>
              </div>
            </div>

            {/* Informations */}
            <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-3">Configuration recommandée</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ul className="text-blue-800 space-y-2 text-sm">
                  <li>• <strong>Créez d'abord les niveaux</strong> (6ème, 5ème, 4ème...)</li>
                  <li>• <strong>Puis créez les classes</strong> pour chaque niveau (6ème A, 6ème B...)</li>
                  <li>• <strong>Les niveaux seront disponibles</strong> dans la création des matières</li>
                </ul>
                <ul className="text-blue-800 space-y-2 text-sm">
                  <li>• <strong>Même niveau</strong> = même programme pédagogique</li>
                  <li>• <strong>Classes différentes</strong> = emplois du temps différents</li>
                  <li>• <strong>Modifiez à tout moment</strong> si besoin</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Composant Formulaire Création Niveau
const CreateLevelForm = ({ onCreateLevel }: { onCreateLevel: (name: string) => void }) => {
  const [levelName, setLevelName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!levelName.trim()) {
      alert('Veuillez saisir un nom pour le niveau');
      return;
    }

    onCreateLevel(levelName.trim());
    setLevelName('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-4">
      <input
        type="text"
        value={levelName}
        onChange={(e) => setLevelName(e.target.value)}
        placeholder="Ex: 6ème, 5ème, 4ème..."
        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
      <button
        type="submit"
        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
      >
        Créer le niveau
      </button>
    </form>
  );
};

// Composant Formulaire Création Classe
const CreateClassForm = ({ 
  levels, 
  onCreateClass 
}: { 
  levels: Level[]; 
  onCreateClass: (name: string, levelId: string, maxStudents: number, room?: string) => void;
}) => {
  const [formData, setFormData] = useState({
    className: '',
    levelId: '',
    maxStudents: 30,
    room: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.className.trim() || !formData.levelId) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    onCreateClass(
      formData.className.trim(), 
      formData.levelId, 
      formData.maxStudents,
      formData.room.trim() || undefined
    );
    
    setFormData({
      className: '',
      levelId: '',
      maxStudents: 30,
      room: ''
    });
  };

  if (levels.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
        <FaExclamationTriangle className="text-yellow-500 text-xl mx-auto mb-2" />
        <p className="text-yellow-800 font-medium">Aucun niveau disponible</p>
        <p className="text-yellow-700 text-sm">
          Vous devez d'abord créer des niveaux avant de pouvoir créer des classes.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Nom de la classe *
        </label>
        <input
          type="text"
          value={formData.className}
          onChange={(e) => setFormData(prev => ({ ...prev, className: e.target.value }))}
          placeholder="Ex: 6ème A, 5ème B..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Niveau *
        </label>
        <select
          value={formData.levelId}
          onChange={(e) => setFormData(prev => ({ ...prev, levelId: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          required
        >
          <option value="">Sélectionner un niveau</option>
          {levels.map(level => (
            <option key={level.id} value={level.id}>
              {level.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Effectif maximum *
        </label>
        <input
          type="number"
          value={formData.maxStudents}
          onChange={(e) => setFormData(prev => ({ ...prev, maxStudents: parseInt(e.target.value) || 30 }))}
          min="1"
          max="50"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Salle (optionnel)
        </label>
        <input
          type="text"
          value={formData.room}
          onChange={(e) => setFormData(prev => ({ ...prev, room: e.target.value }))}
          placeholder="Ex: Salle 101"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
        />
      </div>

      <div className="md:col-span-2 lg:col-span-4">
        <button
          type="submit"
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
        >
          Créer la classe
        </button>
      </div>
    </form>
  );
};

export default ClassesPage;