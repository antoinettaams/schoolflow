"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  FaCalendarAlt,
  FaPlus,
  FaTrash,
  FaEye,
  FaFilter,
  FaSearch,
  FaUniversity
} from 'react-icons/fa';

interface ExamDate {
  id: number;
  title: string;
  type: 'devoir' | 'composition' | 'examen' | 'interrogation';
  classId: string;
  date: string;
  description?: string;
  createdBy: 'admin' | 'teacher';
}

interface ClassInfo {
  id: string;
  name: string;
  level: string;
}

export default function TeacherExamDatesPage() {
  const contentRef = useRef<HTMLDivElement>(null);

  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [examDates, setExamDates] = useState<ExamDate[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showAddForm, setShowAddForm] = useState<boolean>(false);

  // CORRECTION : Utiliser le type ExamDate pour newDate avec Omit pour exclure les champs non nécessaires
  const [newDate, setNewDate] = useState<Omit<ExamDate, 'id' | 'createdBy'> & { description: string }>({
    title: '',
    type: 'interrogation',
    classId: '',
    date: '',
    description: ''
  });

  // Données simulées
  const teacherClasses: ClassInfo[] = [
    { id: '1', name: 'Classe A', level: '6ème' },
    { id: '2', name: 'Classe B', level: '5ème' },
    { id: '3', name: 'Classe C', level: '4ème' }
  ];

  const initialExamDates: ExamDate[] = [
    { id: 1, title: 'Devoir Mathématiques', type: 'devoir', classId: '1', date: '2024-10-25', description: 'Devoir sur les fractions', createdBy: 'admin' },
    { id: 2, title: 'Composition Français', type: 'composition', classId: '2', date: '2024-10-30', description: 'Analyse de texte', createdBy: 'admin' },
    { id: 3, title: 'Interrogation Histoire', type: 'interrogation', classId: '1', date: '2024-10-22', description: 'Révolution française', createdBy: 'teacher' }
  ];

  useEffect(() => {
    setClasses(teacherClasses);
    setExamDates(initialExamDates);

    if (teacherClasses.length > 0 && !selectedClass) {
      const defaultClassId = teacherClasses[0].id;
      setSelectedClass(defaultClassId);
      setNewDate(prev => ({ ...prev, classId: defaultClassId }));
    }
  }, []);

  // Filtrage
  const filteredDates = useMemo(() => {
    return examDates.filter(ed =>
      (selectedClass ? ed.classId === selectedClass : true) &&
      (selectedType ? ed.type === selectedType : true) &&
      (searchTerm ? ed.title.toLowerCase().includes(searchTerm.toLowerCase()) : true)
    ).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [examDates, selectedClass, selectedType, searchTerm]);

  const addExamDate = () => {
    if (!newDate.title || !newDate.date || !newDate.classId) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    // CORRECTION : Créer l'objet avec le bon typage
    const dateToAdd: ExamDate = {
      id: Date.now(),
      createdBy: 'teacher',
      title: newDate.title,
      type: newDate.type, // Maintenant le type est correct
      classId: newDate.classId,
      date: newDate.date,
      description: newDate.description || undefined
    };
    
    setExamDates(prev => [...prev, dateToAdd]);
    setShowAddForm(false);
    setNewDate({ 
      title: '', 
      type: 'interrogation', 
      classId: selectedClass, 
      date: '', 
      description: '' 
    });
    alert('Date ajoutée avec succès !');
  };

  const deleteDate = (id: number) => {
    if (confirm('Voulez-vous supprimer cette date ?')) {
      setExamDates(prev => prev.filter(ed => ed.id !== id));
    }
  };

  const getTypeColor = (type: ExamDate['type']) => {
    switch (type) {
      case 'devoir': return 'bg-blue-100 text-blue-800';
      case 'composition': return 'bg-purple-100 text-purple-800';
      case 'examen': return 'bg-red-100 text-red-800';
      case 'interrogation': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 lg:pl-5 pt-20 lg:pt-6">
      <div className="max-w-7xl mx-auto">

        {/* En-tête */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <FaCalendarAlt className="text-3xl text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dates et Examens</h1>
              <p className="text-gray-600">Gestion des devoirs, compositions et interrogations</p>
            </div>
          </div>
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              <FaPlus />
              Ajouter une date
            </button>
          </div>
        </div>

        {/* Formulaire ajout */}
        {showAddForm && (
          <div className="bg-white rounded-xl shadow-sm mb-6 border-2 border-blue-200 max-h-[70vh] overflow-y-auto p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Ajouter une date</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Titre *</label>
                <input
                  type="text"
                  value={newDate.title}
                  onChange={e => setNewDate(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Ex: Interrogation Mathématiques"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Classe *</label>
                <select
                  value={newDate.classId}
                  onChange={e => setNewDate(prev => ({ ...prev, classId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="">Sélectionnez une classe</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name} - {c.level}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type *</label>
                <select
                  value={newDate.type}
                  onChange={e => setNewDate(prev => ({ ...prev, type: e.target.value as ExamDate['type'] }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="interrogation">Interrogation</option>
                  <option value="devoir">Devoir</option>
                  <option value="composition">Composition</option>
                  <option value="examen">Examen</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
                <input
                  type="date"
                  value={newDate.date}
                  onChange={e => setNewDate(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={newDate.description}
                onChange={e => setNewDate(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Description de l'examen..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={addExamDate}
                disabled={!newDate.title || !newDate.date || !newDate.classId}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-2 px-6 rounded-lg transition-colors"
              >
                Ajouter
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        )}

        {/* Filtres */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FaUniversity className="inline mr-2 text-gray-500" />
                Classe
              </label>
              <select
                value={selectedClass}
                onChange={e => setSelectedClass(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="">Toutes les classes</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name} - {c.level}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FaFilter className="inline mr-2 text-gray-500" />
                Type
              </label>
              <select
                value={selectedType}
                onChange={e => setSelectedType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="">Tous</option>
                <option value="interrogation">Interrogation</option>
                <option value="devoir">Devoir</option>
                <option value="composition">Composition</option>
                <option value="examen">Examen</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FaSearch className="inline mr-2 text-gray-500" />
                Rechercher
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Rechercher par titre..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Tableau des dates */}
        <div ref={contentRef} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {filteredDates.length === 0 ? (
            <div className="text-center py-12">
              <FaCalendarAlt className="text-5xl text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune date trouvée</h3>
              <p className="text-gray-600">Aucune date d'examen ne correspond à vos critères de recherche.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900 border-b">Titre</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900 border-b">Classe</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900 border-b">Type</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900 border-b">Date</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900 border-b">Créé par</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-900 border-b">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDates.map(ed => {
                    const classe = classes.find(c => c.id === ed.classId);
                    return (
                      <tr key={ed.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-6">
                          <div>
                            <div className="font-medium text-gray-900">{ed.title}</div>
                            {ed.description && (
                              <div className="text-sm text-gray-600 mt-1">{ed.description}</div>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="font-medium text-gray-900">{classe?.name}</span>
                          <div className="text-sm text-gray-600">{classe?.level}</div>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getTypeColor(ed.type)}`}>
                            {ed.type}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="font-medium text-gray-900">
                            {new Date(ed.date).toLocaleDateString('fr-FR')}
                          </div>
                          <div className="text-sm text-gray-600">
                            {new Date(ed.date).toLocaleDateString('fr-FR', { weekday: 'long' })}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          {ed.createdBy === 'admin' ? (
                            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">Admin</span>
                          ) : (
                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">Professeur</span>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex gap-2">
                            <button 
                              className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors"
                              title="Voir les détails"
                            >
                              <FaEye className="text-sm" />
                            </button>
                            {ed.createdBy === 'teacher' && (
                              <button 
                                onClick={() => deleteDate(ed.id)} 
                                className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-colors"
                                title="Supprimer"
                              >
                                <FaTrash className="text-sm" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}