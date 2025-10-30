"use client";
import React, { useState, useEffect } from 'react';
import { 
  FaPlus, FaSave, FaCalendarAlt, FaChalkboardTeacher, 
  FaClock, FaMapMarkerAlt, FaFilter, FaTrash, FaTimes 
} from 'react-icons/fa';

// Interfaces
interface ScheduleSlot {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  classroom: string;
}

interface Assignment {
  id: string;
  vagueId: string;
  filiereId: string;
  moduleId: string;
  teacherId: string;
  schedule: {
    slots: ScheduleSlot[];
    period: {
      startDate: string;
      endDate: string;
    };
  };
}

interface Teacher {
  id: string;
  name: string;
  email: string;
  role: string;
  teacherNumber?: string;
  statut?: string;
  prenom?: string;
  nom?: string;
  specialite?: string;
}

interface Vague {
  id: string;
  name: string;
  // Ajoutez d'autres propriétés si nécessaire
}

interface Filiere {
  id: string;
  name: string;
  vagues?: string[];
  modules?: Module[];
}

interface Module {
  id: string;
  name: string;
  // Ajoutez d'autres propriétés si nécessaire
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  statut?: string;
  prenom?: string;
  nom?: string;
  // Ajoutez d'autres propriétés si nécessaire
}

export default function PlanningAssignationsPage() {
  const [assignations, setAssignations] = useState<Assignment[]>([]);
  const [vagues, setVagues] = useState<Vague[]>([]);
  const [filieres, setFilieres] = useState<Filiere[]>([]);
  const [formateurs, setFormateurs] = useState<Teacher[]>([]);
  const [selectedVague, setSelectedVague] = useState<string>('');
  const [selectedFiliere, setSelectedFiliere] = useState<string>('');
  const [selectedModule, setSelectedModule] = useState<string>('');
  const [selectedTeacher, setSelectedTeacher] = useState<string>('');
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [newAssignment, setNewAssignment] = useState({
    slots: [] as ScheduleSlot[],
    period: { startDate: '', endDate: '' }
  });
  const [currentSlot, setCurrentSlot] = useState({
    day: 'monday',
    startTime: '09:00',
    endTime: '12:30',
    classroom: ''
  });

  // Chargement des données
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = () => {
      try {
        const savedVagues = localStorage.getItem('schoolflow_vagues');
        const savedFilieres = localStorage.getItem('schoolflow_filieres');
        const savedUsers = localStorage.getItem('schoolflow_users');
        const savedAssignations = localStorage.getItem('schoolflow_assignations');
        
        console.log('🔍 CHARGEMENT DES DONNÉES:');
        
        if (savedVagues) {
          const vaguesData = JSON.parse(savedVagues) as Vague[];
          console.log('📅 Vagues chargées:', vaguesData);
          setVagues(vaguesData);
        }
        
        if (savedFilieres) {
          const filieresData = JSON.parse(savedFilieres) as Filiere[];
          console.log('🎓 Filières chargées:', filieresData);
          setFilieres(filieresData);
        }
        
        if (savedUsers) {
          const users = JSON.parse(savedUsers) as User[];
          console.log('👥 Tous les utilisateurs:', users);
          
          // Filtrer seulement les enseignants
          const teachers = users.filter((user) => {
            const isTeacher = user.role === 'Enseignant';
            const isActive = user.statut !== 'inactif';
            console.log(`👨‍🏫 ${user.name} - Rôle: ${user.role}, Statut: ${user.statut}, Actif: ${isActive}`);
            return isTeacher && isActive;
          });
          
          console.log('✅ Formateurs filtrés:', teachers);
          setFormateurs(teachers);
        } else {
          console.log('❌ Aucun utilisateur trouvé dans schoolflow_users');
        }
        
        if (savedAssignations) {
          const assignationsData = JSON.parse(savedAssignations) as Assignment[];
          console.log('📋 Assignations existantes:', assignationsData);
          setAssignations(assignationsData);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Sauvegarde des assignations
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem('schoolflow_assignations', JSON.stringify(assignations));
        console.log('💾 Assignations sauvegardées:', assignations);
      } catch (error) {
        console.error('Erreur lors de la sauvegarde des assignations:', error);
      }
    }
  }, [assignations, isLoading]);

  const filieresDisponibles = filieres.filter(filiere => {
    const filiereNonAssignee = !filiere.vagues || filiere.vagues.length === 0;
    const filiereDejaDansCetteVague = filiere.vagues && filiere.vagues.includes(selectedVague);
    return filiereNonAssignee || filiereDejaDansCetteVague;
  });

  const modulesDisponibles = selectedFiliere 
    ? filieres.find(f => f.id === selectedFiliere)?.modules || []
    : [];

  // CORRECTION : Utiliser la bonne structure des formateurs
  const formateursDisponibles = formateurs.filter(f => 
    f.role === 'Enseignant' && (f.statut !== 'inactif')
  );

  console.log('🎯 Formateurs disponibles pour sélection:', formateursDisponibles);

  // CORRECTION : Fonction pour afficher le nom du formateur
  const getTeacherDisplayName = (teacher: Teacher) => {
    // Utiliser prenom + nom si disponibles, sinon utiliser name
    if (teacher.prenom && teacher.nom) {
      return `${teacher.prenom} ${teacher.nom}`;
    }
    return teacher.name;
  };

  const moduleDejaAssigne = (moduleId: string) => {
    return assignations.some(assignment => 
      assignment.vagueId === selectedVague && 
      assignment.filiereId === selectedFiliere &&
      assignment.moduleId === moduleId
    );
  };

  const verifierConflitHoraires = (teacherId: string, slots: ScheduleSlot[]) => {
    return assignations.some(assignment => 
      assignment.teacherId === teacherId &&
      assignment.schedule.slots.some(existingSlot => 
        slots.some(newSlot => 
          newSlot.day === existingSlot.day &&
          newSlot.startTime === existingSlot.startTime &&
          newSlot.endTime === newSlot.endTime
        )
      )
    );
  };

  const ajouterCreneau = () => {
    if (!currentSlot.day || !currentSlot.startTime || !currentSlot.endTime) {
      alert("Veuillez remplir tous les champs du créneau horaire");
      return;
    }

    const nouveauCreneau: ScheduleSlot = {
      id: Date.now().toString(),
      ...currentSlot
    };

    setNewAssignment(prev => ({
      ...prev,
      slots: [...prev.slots, nouveauCreneau]
    }));

    setCurrentSlot({
      day: 'monday',
      startTime: '09:00',
      endTime: '12:30',
      classroom: ''
    });
  };

  const supprimerCreneau = (slotId: string) => {
    setNewAssignment(prev => ({
      ...prev,
      slots: prev.slots.filter(slot => slot.id !== slotId)
    }));
  };

  const ajouterAssignation = () => {
    console.log('🔄 Tentative d&apos;ajout d&apos;assignation:');
    console.log('Vague:', selectedVague);
    console.log('Filière:', selectedFiliere);
    console.log('Module:', selectedModule);
    console.log('Formateur:', selectedTeacher);
    console.log('Période:', newAssignment.period);
    console.log('Créneaux:', newAssignment.slots);

    if (!selectedVague || !selectedFiliere || !selectedModule || !selectedTeacher) {
      alert("Veuillez remplir tous les champs requis.");
      return;
    }

    if (!newAssignment.period.startDate || !newAssignment.period.endDate) {
      alert("Veuillez définir la période.");
      return;
    }

    if (newAssignment.slots.length === 0) {
      alert("Veuillez ajouter au moins un créneau horaire.");
      return;
    }

    if (verifierConflitHoraires(selectedTeacher, newAssignment.slots)) {
      alert("⚠️ Ce formateur a déjà un cours à ces horaires !");
      return;
    }

    const assignment: Assignment = {
      id: Date.now().toString(),
      vagueId: selectedVague,
      filiereId: selectedFiliere,
      moduleId: selectedModule,
      teacherId: selectedTeacher,
      schedule: newAssignment
    };

    console.log('✅ Nouvelle assignation créée:', assignment);

    setAssignations(prev => {
      const newAssignations = [...prev, assignment];
      console.log('📋 Liste des assignations mise à jour:', newAssignations);
      return newAssignations;
    });

    // Mettre à jour la filière avec la vague
    const filiere = filieres.find(f => f.id === selectedFiliere);
    if (filiere && (!filiere.vagues || !filiere.vagues.includes(selectedVague))) {
      setFilieres(prev => prev.map(f => 
        f.id === selectedFiliere 
          ? { ...f, vagues: [...(f.vagues || []), selectedVague] }
          : f
      ));
      
      try {
        const savedFilieres = localStorage.getItem('schoolflow_filieres');
        if (savedFilieres) {
          const allFilieres = JSON.parse(savedFilieres) as Filiere[];
          const updatedFilieres = allFilieres.map((f) => 
            f.id === selectedFiliere 
              ? { ...f, vagues: [...(f.vagues || []), selectedVague] }
              : f
          );
          localStorage.setItem('schoolflow_filieres', JSON.stringify(updatedFilieres));
        }
      } catch (error) {
        console.error('Erreur lors de la mise à jour de la filière:', error);
      }
    }

    // Réinitialiser le formulaire
    setSelectedModule('');
    setSelectedTeacher('');
    setNewAssignment({
      slots: [],
      period: { startDate: '', endDate: '' }
    });
    setCurrentSlot({
      day: 'monday',
      startTime: '09:00',
      endTime: '12:30',
      classroom: ''
    });

    setShowAssignmentForm(false);
    alert("✅ Assignation ajoutée !");
  };

  const supprimerAssignation = (id: string) => {
    if (confirm("Supprimer cette assignation ?")) {
      setAssignations(prev => prev.filter(a => a.id !== id));
    }
  };

  const joursSemaine = [
    { id: 'monday', label: 'Lundi' },
    { id: 'tuesday', label: 'Mardi' },
    { id: 'wednesday', label: 'Mercredi' },
    { id: 'thursday', label: 'Jeudi' },
    { id: 'friday', label: 'Vendredi' },
    { id: 'saturday', label: 'Samedi' }
  ];

  const getDayLabel = (dayId: string) => {
    return joursSemaine.find(j => j.id === dayId)?.label || dayId;
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du planning...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Planning & Assignations</h1>
          <p className="text-gray-600 text-sm">
            Gérez les cours, les horaires et les formateurs.
          </p>
        </div>
      </div>

      {/* CONTENU PRINCIPAL AVEC DÉFILEMENT */}
      <div className="h-[calc(100vh-180px)] overflow-y-auto">
        
        {/* FILTRES */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <FaFilter className="text-blue-600" />
            <h2 className="text-lg font-semibold">Filtrage & Sélection</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Vague *</label>
              <select
                value={selectedVague}
                onChange={(e) => {
                  setSelectedVague(e.target.value);
                  setSelectedFiliere('');
                  setSelectedModule('');
                }}
                className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Sélectionnez une vague</option>
                {vagues.map(v => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Filière *</label>
              <select
                value={selectedFiliere}
                onChange={(e) => setSelectedFiliere(e.target.value)}
                disabled={!selectedVague}
                className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              >
                <option value="">Sélectionnez une filière</option>
                {filieresDisponibles.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>
          </div>

          {selectedVague && selectedFiliere && (
            <div className="flex justify-end">
              <button
                onClick={() => setShowAssignmentForm(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
              >
                <FaPlus /> Nouvelle assignation
              </button>
            </div>
          )}
        </div>

        {/* LISTE DES ASSIGNATIONS EXISTANTES */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold mb-4">Assignations existantes</h2>
          {assignations.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Aucune assignation pour l&apos;instant.</p>
          ) : (
            <div className="space-y-4">
              {assignations.map(assignment => {
                const vague = vagues.find(v => v.id === assignment.vagueId);
                const filiere = filieres.find(f => f.id === assignment.filiereId);
                const moduleItem = filiere?.modules?.find(m => m.id === assignment.moduleId);
                const teacher = formateurs.find(f => f.id === assignment.teacherId);
                
                console.log('📊 Affichage assignation:', {
                  assignment,
                  vague,
                  filiere,
                  moduleItem,
                  teacher
                });

                return (
                  <div key={assignment.id} className="border p-4 rounded-lg">
                    <div className="flex justify-between mb-3">
                      <div>
                        <p className="font-semibold text-lg">{moduleItem?.name || 'Module inconnu'}</p>
                        <p className="text-sm text-gray-500">
                          {filiere?.name || 'Filière inconnue'} - {vague?.name || 'Vague inconnue'}
                        </p>
                        <p className="text-sm text-gray-700 mt-1">
                          <FaChalkboardTeacher className="inline mr-1" />
                          {teacher ? getTeacherDisplayName(teacher) : `Formateur ID: ${assignment.teacherId}`}
                        </p>
                      </div>
                      <button 
                        onClick={() => supprimerAssignation(assignment.id)} 
                        className="text-red-500 hover:text-red-700 self-start"
                      >
                        <FaTrash />
                      </button>
                    </div>
                    
                    <div className="border-t pt-3">
                      <h4 className="font-medium text-gray-900 mb-2">Créneaux horaires :</h4>
                      <div className="space-y-1">
                        {assignment.schedule.slots.map((slot) => (
                          <div key={slot.id} className="flex items-center gap-3 text-sm bg-gray-50 p-2 rounded">
                            <span className="font-medium min-w-[60px]">{getDayLabel(slot.day)}</span>
                            <span>{slot.startTime} - {slot.endTime}</span>
                            {slot.classroom && (
                              <span className="text-gray-500">
                                <FaMapMarkerAlt className="inline mr-1" /> {slot.classroom}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Période: {assignment.schedule.period.startDate} à {assignment.schedule.period.endDate}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* MODAL - VERSION AMÉLIORÉE */}
      {showAssignmentForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl border w-full max-w-2xl max-h-[95vh] overflow-hidden flex flex-col">
            {/* En-tête fixe */}
            <div className="bg-white p-6 border-b border-gray-200 sticky top-0 z-10">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Nouvelle assignation</h2>
                <button 
                  onClick={() => setShowAssignmentForm(false)} 
                  className="text-gray-500 hover:text-gray-700 text-xl"
                >
                  <FaTimes />
                </button>
              </div>
            </div>

            {/* Contenu avec défilement */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Sélection module et formateur */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Module *</label>
                  <select
                    value={selectedModule}
                    onChange={(e) => setSelectedModule(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Choisissez un module</option>
                    {modulesDisponibles.map(moduleItem => (
                      <option 
                        key={moduleItem.id} 
                        value={moduleItem.id}
                        disabled={moduleDejaAssigne(moduleItem.id)}
                      >
                        {moduleItem.name} {moduleDejaAssigne(moduleItem.id) && '(Déjà assigné)'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Formateur *</label>
                  <select
                    value={selectedTeacher}
                    onChange={(e) => setSelectedTeacher(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Choisissez un formateur</option>
                    {formateursDisponibles.map(f => (
                      <option key={f.id} value={f.id}>
                        {getTeacherDisplayName(f)} {f.teacherNumber ? `(${f.teacherNumber})` : ''}
                      </option>
                    ))}
                  </select>
                  {formateursDisponibles.length === 0 && (
                    <p className="text-xs text-red-600 mt-1">
                      ⚠️ Aucun formateur disponible. Créez d&apos;abord des comptes formateurs.
                    </p>
                  )}
                </div>
              </div>

              {/* Période du module */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FaCalendarAlt /> Période du module
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Début du module *
                    </label>
                    <input
                      type="date"
                      value={newAssignment.period.startDate}
                      onChange={(e) => setNewAssignment(prev => ({
                        ...prev, period: { ...prev.period, startDate: e.target.value }
                      }))}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Fin du module *
                    </label>
                    <input
                      type="date"
                      value={newAssignment.period.endDate}
                      onChange={(e) => setNewAssignment(prev => ({
                        ...prev, period: { ...prev.period, endDate: e.target.value }
                      }))}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Créneaux horaires */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FaClock /> Créneaux horaires
                </h3>

                {/* Formulaire d&apos;ajout de créneau */}
                <div className="bg-blue-50 p-3 rounded-lg mb-3">
                  <h4 className="font-medium text-gray-900 mb-2 text-sm">Ajouter un créneau</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Jour</label>
                      <select
                        value={currentSlot.day}
                        onChange={(e) => setCurrentSlot(prev => ({ ...prev, day: e.target.value }))}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                      >
                        {joursSemaine.map(jour => (
                          <option key={jour.id} value={jour.id}>{jour.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Début</label>
                      <input
                        type="time"
                        value={currentSlot.startTime}
                        onChange={(e) => setCurrentSlot(prev => ({ ...prev, startTime: e.target.value }))}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Fin</label>
                      <input
                        type="time"
                        value={currentSlot.endTime}
                        onChange={(e) => setCurrentSlot(prev => ({ ...prev, endTime: e.target.value }))}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Salle</label>
                      <input
                        type="text"
                        placeholder="Salle"
                        value={currentSlot.classroom}
                        onChange={(e) => setCurrentSlot(prev => ({ ...prev, classroom: e.target.value }))}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <button
                    onClick={ajouterCreneau}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs transition-colors"
                  >
                    <FaPlus className="inline mr-1" /> Ajouter créneau
                  </button>
                </div>

                {/* Liste des créneaux ajoutés */}
                {newAssignment.slots.length > 0 ? (
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900 mb-2 text-sm">
                      Créneaux programmés ({newAssignment.slots.length})
                    </h4>
                    {newAssignment.slots.map((slot) => (
                      <div key={slot.id} className="flex items-center justify-between p-2 bg-white rounded border text-sm">
                        <div className="flex items-center gap-3">
                          <span className="font-medium">{getDayLabel(slot.day)}</span>
                          <span className="text-gray-600">{slot.startTime} - {slot.endTime}</span>
                          {slot.classroom && (
                            <span className="text-gray-500">
                              <FaMapMarkerAlt className="inline mr-1" /> {slot.classroom}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => supprimerCreneau(slot.id)}
                          className="text-red-600 hover:text-red-800 ml-2"
                        >
                          <FaTrash size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-3 text-gray-500 text-sm">
                    <p>Aucun créneau horaire ajouté</p>
                    <p className="text-xs">Ajoutez au moins un créneau pour ce module</p>
                  </div>
                )}
              </div>
            </div>

            {/* Boutons fixes en bas */}
            <div className="bg-white p-4 border-t border-gray-200 sticky bottom-0">
              <div className="flex gap-2 justify-end">
                <button 
                  onClick={() => setShowAssignmentForm(false)} 
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  onClick={ajouterAssignation}
                  disabled={newAssignment.slots.length === 0}
                  className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  <FaSave size={14} /> Enregistrer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}