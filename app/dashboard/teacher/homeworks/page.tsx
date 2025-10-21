'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  FaSearch, 
  FaFilter, 
  FaChalkboardTeacher,
  FaPlus,
  FaBook,
  FaDownload,
  FaUniversity,
  FaTrash,
  FaCheck,
  FaArrowUp,
  FaArrowDown
} from 'react-icons/fa';
import { Exercise, ClassInfo } from '@/types/exercise';

const TeacherExercises = () => {
  const contentRef = useRef<HTMLDivElement>(null);
  const createFormRef = useRef<HTMLDivElement>(null);

  const [currentTeacher] = useState({
    id: 'teacher1',
    name: 'Prof. Martin',
    subject: 'Mathématiques'
  });

  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);

  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [collapsedExercises, setCollapsedExercises] = useState<{ [id: number]: boolean }>({});
  const [newExercise, setNewExercise] = useState({
    title: '',
    description: '',
    dueDate: '',
    class: ''
  });

  const teacherClasses: ClassInfo[] = [
    { id: '1', name: 'Classe A', level: '6ème', subject: 'Mathématiques', studentCount: 25 },
    { id: '2', name: 'Classe B', level: '5ème', subject: 'Mathématiques', studentCount: 28 },
    { id: '3', name: 'Classe C', level: '4ème', subject: 'Mathématiques', studentCount: 30 }
  ];

  const initialExercises: Exercise[] = [
    {
      id: 1,
      title: 'Exercices de géométrie - Angles et triangles',
      subject: 'Mathématiques',
      class: '1',
      dueDate: '2024-10-05',
      assignedDate: '2024-09-28',
      description: 'Série d\'exercices sur les propriétés des angles dans les triangles.',
      status: 'assigned',
      studentCount: 25,
      submittedCount: 20
    },
    {
      id: 2,
      title: 'Projet - Théorème de Pythagore',
      subject: 'Mathématiques',
      class: '2',
      dueDate: '2024-10-15',
      assignedDate: '2024-10-01',
      description: 'Projet de recherche et d\'application du théorème de Pythagore dans des situations concrètes.',
      status: 'assigned',
      studentCount: 28,
      submittedCount: 15
    },
    {
      id: 3,
      title: 'Contrôle - Fractions et pourcentages',
      subject: 'Mathématiques',
      class: '1',
      dueDate: '2024-09-25',
      assignedDate: '2024-09-20',
      description: 'Contrôle sur les opérations avec les fractions et les calculs de pourcentages.',
      status: 'closed',
      studentCount: 25,
      submittedCount: 24
    },
    {
      id: 4,
      title: 'Devoir maison - Équations du premier degré',
      subject: 'Mathématiques',
      class: '3',
      dueDate: '2024-10-20',
      assignedDate: '2024-10-05',
      description: 'Série d\'exercices sur la résolution d\'équations du premier degré à une inconnue.',
      status: 'assigned',
      studentCount: 30,
      submittedCount: 10
    }
  ];

  useEffect(() => {
    setClasses(teacherClasses);
    setExercises(initialExercises);
    
    if (teacherClasses.length > 0 && !selectedClass) {
      setSelectedClass(teacherClasses[0].id);
      setNewExercise(prev => ({ ...prev, class: teacherClasses[0].id }));
    }
  }, []);

  const filteredExercises = exercises
    .filter(exercise => 
      (selectedClass ? exercise.class === selectedClass : true) &&
      (selectedStatus ? exercise.status === selectedStatus : true) &&
      (searchTerm ? 
        exercise.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exercise.description.toLowerCase().includes(searchTerm.toLowerCase())
        : true
      )
    );

  const createExercise = () => {
    if (!newExercise.title || !newExercise.dueDate || !newExercise.class) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const selectedClasse = classes.find(c => c.id === newExercise.class);
    const exerciseToAdd: Exercise = {
      id: Date.now(),
      subject: currentTeacher.subject,
      assignedDate: new Date().toISOString().split('T')[0],
      status: 'draft',
      studentCount: selectedClasse?.studentCount || 0,
      submittedCount: 0,
      ...newExercise
    };

    setExercises(prev => [...prev, exerciseToAdd]);
    setShowCreateForm(false);
    setNewExercise({
      title: '',
      description: '',
      dueDate: '',
      class: selectedClass
    });
    
    alert('Exercice créé avec succès !');
  };

  const assignExercise = (exerciseId: number) => {
    setExercises(prev => prev.map(exercise => 
      exercise.id === exerciseId 
        ? { ...exercise, status: 'assigned' as const }
        : exercise
    ));
    alert('Exercice assigné à la classe !');
  };

  const deleteExercise = (exerciseId: number) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet exercice ?')) {
      setExercises(prev => prev.filter(exercise => exercise.id !== exerciseId));
    }
  };

  const handleScroll = (direction: 'up' | 'down') => {
    if (contentRef.current) {
      const scrollAmount = 300;
      contentRef.current.scrollTop += direction === 'down' ? scrollAmount : -scrollAmount;
    }
  };

  const handleFormScroll = (direction: 'up' | 'down') => {
    if (createFormRef.current) {
      const scrollAmount = 200;
      createFormRef.current.scrollTop += direction === 'down' ? scrollAmount : -scrollAmount;
    }
  };

  const getStatusColor = (status: Exercise['status']) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'assigned': return 'bg-blue-100 text-blue-800';
      case 'closed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: Exercise['status']) => {
    switch (status) {
      case 'draft': return 'Brouillon';
      case 'assigned': return 'Assigné';
      case 'closed': return 'Fermé';
      default: return status;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 overflow-y-auto custom-scrollbar lg:pl-5 pt-20 lg:pt-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Gestion des Exercices</h1>
                <p className="text-gray-600">
                  {currentTeacher.name} - {currentTeacher.subject}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => setShowCreateForm(true)}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                <FaPlus />
                Nouvel Exercice
              </button>
            </div>
          </div>
        </div>

        {showCreateForm && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border-2 border-blue-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Créer un nouvel exercice</h3>
              
              <div className="flex gap-2">
                <button
                  onClick={() => handleFormScroll('up')}
                  className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition-colors"
                  title="Défiler vers le haut du formulaire"
                >
                  <FaArrowUp size={14} />
                </button>
                <button
                  onClick={() => handleFormScroll('down')}
                  className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition-colors"
                  title="Défiler vers le bas du formulaire"
                >
                  <FaArrowDown size={14} />
                </button>
              </div>
            </div>
            
            <div 
              ref={createFormRef}
              className="max-h-[50vh] overflow-y-auto pr-2 scroll-smooth custom-scrollbar"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Titre de l'exercice *
                  </label>
                  <input
                    type="text"
                    value={newExercise.title}
                    onChange={(e) => setNewExercise(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ex: Exercices de géométrie..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Classe *
                  </label>
                  <select
                    value={newExercise.class}
                    onChange={(e) => setNewExercise(prev => ({ ...prev, class: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Sélectionner une classe</option>
                    {classes.map(classe => (
                      <option key={classe.id} value={classe.id}>
                        {classe.name} - {classe.level}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date de rendu *
                  </label>
                  <input
                    type="date"
                    value={newExercise.dueDate}
                    onChange={(e) => setNewExercise(prev => ({ ...prev, dueDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newExercise.description}
                    onChange={(e) => setNewExercise(prev => ({ ...prev, description: e.target.value }))}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Description détaillée de l'exercice..."
                  />
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={createExercise}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
              >
                Créer l'exercice
              </button>
              <button
                onClick={() => setShowCreateForm(false)}
                className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FaUniversity className="inline mr-2" />
                Classe
              </label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Toutes les classes</option>
                {classes.map(classe => (
                  <option key={classe.id} value={classe.id}>
                    {classe.name} - {classe.level}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FaFilter className="inline mr-2" />
                Statut
              </label>
              <select 
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Tous les statuts</option>
                <option value="draft">Brouillon</option>
                <option value="assigned">Assigné</option>
                <option value="closed">Fermé</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FaSearch className="inline mr-2" />
                Rechercher
              </label>
              <input
                type="text"
                placeholder="Titre, description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        <div 
          ref={contentRef} 
          className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-y-auto max-h-[60vh] scroll-smooth custom-scrollbar"
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Mes Exercices Créés
              </h2>
              <div className="text-sm text-gray-500">
                {filteredExercises.length} exercice(s) trouvé(s)
              </div>
            </div>

            <div className="space-y-6">
              {filteredExercises.map((exercise) => {
                const classe = classes.find(c => c.id === exercise.class);
                const isCollapsed = collapsedExercises[exercise.id] || false;

                return (
                  <div key={exercise.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{exercise.title}</h3>
                      <div className="flex gap-2">
                        {exercise.status === 'draft' && (
                          <button
                            onClick={() => assignExercise(exercise.id)}
                            className="bg-green-600 text-white px-3 py-1 rounded text-sm"
                          >
                            Assigner
                          </button>
                        )}
                        <button
                          onClick={() => setCollapsedExercises(prev => ({
                            ...prev,
                            [exercise.id]: !prev[exercise.id]
                          }))}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-sm"
                        >
                          {isCollapsed ? 'Ouvrir' : 'Fermer'}
                        </button>
                        <button
                          onClick={() => deleteExercise(exercise.id)}
                          className="bg-red-600 text-white px-3 py-1 rounded text-sm"
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>

                    {!isCollapsed && (
                      <div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(exercise.status)}`}>
                          {getStatusLabel(exercise.status)}
                        </span>
                        <p className="text-gray-600 mb-2 mt-2">{exercise.description}</p>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                          <span><strong>Classe:</strong> {classe?.name} - {classe?.level}</span>
                          <span><strong>Assigné le:</strong> {new Date(exercise.assignedDate).toLocaleDateString('fr-FR')}</span>
                          <span><strong>À rendre le:</strong> {new Date(exercise.dueDate).toLocaleDateString('fr-FR')}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {filteredExercises.length === 0 && (
              <div className="text-center py-12">
                <FaBook className="text-5xl text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Aucun exercice trouvé
                </h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm || selectedClass || selectedStatus
                    ? 'Aucun exercice ne correspond aux filtres sélectionnés.'
                    : 'Vous n\'avez encore créé aucun exercice.'}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={() => handleScroll('up')}
            className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition-colors"
          >
            <FaArrowUp />
          </button>
          <button
            onClick={() => handleScroll('down')}
            className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition-colors"
          >
            <FaArrowDown />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeacherExercises;
