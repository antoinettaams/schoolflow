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

// Données simulées déplacées en dehors du composant
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

export default function TeacherExamDatesPage() {
  const contentRef = useRef<HTMLDivElement>(null);

  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [examDates, setExamDates] = useState<ExamDate[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showAddForm, setShowAddForm] = useState<boolean>(false);

  const [newDate, setNewDate] = useState({
    title: '',
    type: 'interrogation' as ExamDate['type'],
    classId: '',
    date: '',
    description: ''
  });

  useEffect(() => {
    setClasses(teacherClasses);
    setExamDates(initialExamDates);

    if (teacherClasses.length > 0 && !selectedClass) {
      setSelectedClass(teacherClasses[0].id);
      setNewDate(prev => ({ ...prev, classId: teacherClasses[0].id }));
    }
  }, [selectedClass]); // Maintenant selectedClass est inclus dans les dépendances

  // Alternative : utiliser un useEffect séparé pour l'initialisation
  // useEffect(() => {
  //   // Initialisation des données
  //   setClasses(teacherClasses);
  //   setExamDates(initialExamDates);
  //   
  //   if (teacherClasses.length > 0) {
  //     setSelectedClass(teacherClasses[0].id);
  //     setNewDate(prev => ({ ...prev, classId: teacherClasses[0].id }));
  //   }
  // }, []); // Tableau de dépendances vide pour l'initialisation

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

    const dateToAdd: ExamDate = { 
      id: Date.now(), 
      createdBy: 'teacher', 
      ...newDate 
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Interrogation Mathématiques"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Classe *</label>
                <select
                  value={newDate.classId}
                  onChange={e => setNewDate(prev => ({ ...prev, classId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={newDate.description}
                onChange={e => setNewDate(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-3 mb-4">
              <button
                onClick={addExamDate}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg"
              >
                Ajouter
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-6 rounded-lg"
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
                <FaUniversity className="inline mr-2" />
                Classe
              </label>
              <select
                value={selectedClass}
                onChange={e => setSelectedClass(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Toutes les classes</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name} - {c.level}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FaFilter className="inline mr-2" />
                Type
              </label>
              <select
                value={selectedType}
                onChange={e => setSelectedType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                <FaSearch className="inline mr-2" />
                Rechercher
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Titre..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Tableau des dates */}
        <div ref={contentRef} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-y-auto max-h-[70vh]">
          {filteredDates.length === 0 && (
            <div className="text-center py-12">
              <FaCalendarAlt className="text-5xl text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune date trouvée</h3>
            </div>
          )}
          {filteredDates.length > 0 && (
            <table className="min-w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Titre</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Classe</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Type</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Créé par</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDates.map(ed => {
                  const classe = classes.find(c => c.id === ed.classId);
                  return (
                    <tr key={ed.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">{ed.title}</td>
                      <td className="py-3 px-4">{classe?.name} - {classe?.level}</td>
                      <td className="py-3 px-4 capitalize">{ed.type}</td>
                      <td className="py-3 px-4">{new Date(ed.date).toLocaleDateString('fr-FR')}</td>
                      <td className="py-3 px-4">
                        {ed.createdBy === 'admin' ? (
                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">Admin</span>
                        ) : (
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Professeur</span>
                        )}
                      </td>
                      <td className="py-3 px-4 flex gap-2">
                        <button className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm">
                          <FaEye />
                        </button>
                        {ed.createdBy === 'teacher' && (
                          <button 
                            onClick={() => deleteDate(ed.id)} 
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                          >
                            <FaTrash />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}