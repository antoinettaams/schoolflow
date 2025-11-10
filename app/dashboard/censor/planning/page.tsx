"use client";
import React, { useState, useEffect } from 'react';
import { 
  FaPlus, FaSave, FaCalendarAlt, FaChalkboardTeacher, 
  FaClock, FaMapMarkerAlt, FaFilter, FaTrash, FaTimes, FaEdit
} from 'react-icons/fa';
import toast from 'react-hot-toast';

// Interfaces (garder les mêmes)
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
  clerkId: string;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  statut: string;
  specialite?: string;
  createdAt: number;
}

interface Vague {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: "active" | "upcoming" | "completed";
  description: string;
  filieres: Array<{ id: string; name: string }>;
  totalEtudiants: number;
  totalFormateurs: number;
  semestres: string[];
}

interface Filiere {
  id: number;
  name: string;
  duration: string;
  description: string;
  vagues: Array<{id: string, name: string}>;
  modules: Module[];
  totalStudents?: number;
  createdAt?: string;
}

interface Module {
  id: number;
  name: string;
  coefficient: number;
  type: 'theorique' | 'pratique' | 'mixte' | 'projet';
  description?: string;
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
  const [isEditing, setIsEditing] = useState(false);
  const [editingAssignmentId, setEditingAssignmentId] = useState<string>('');
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

  // NOUVEAU : États pour la modal de suppression
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState<Assignment | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger toutes les données (garder le même useEffect)
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('🔄 CHARGEMENT DES DONNÉES...');
        setError(null);

        const vaguesResponse = await fetch('/api/censor/vagues');
        if (!vaguesResponse.ok) throw new Error(`Erreur chargement vagues: ${vaguesResponse.status}`);
        const vaguesData = await vaguesResponse.json();
        setVagues(vaguesData);

        const filieresResponse = await fetch('/api/censor/filieres');
        if (!filieresResponse.ok) throw new Error(`Erreur chargement filières: ${filieresResponse.status}`);
        const filieresData = await filieresResponse.json();
        setFilieres(filieresData);

        const professeursResponse = await fetch('/api/censor/teacher');
        if (professeursResponse.ok) {
          const professeursData = await professeursResponse.json();
          setFormateurs(professeursData);
        } else {
          setFormateurs([]);
        }

        try {
          const assignationsResponse = await fetch('/api/censor/assignations');
          if (assignationsResponse.ok) {
            const assignationsData = await assignationsResponse.json();
            setAssignations(assignationsData);
          } else {
            setAssignations([]);
          }
        } catch (assignError) {
          console.error('❌ Erreur chargement assignations:', assignError);
          setAssignations([]);
        }

        toast.success('Données chargées avec succès!');

      } catch (error) {
        console.error('❌ Erreur lors du chargement des données:', error);
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
        setError(errorMessage);
        toast.error(`Erreur de chargement: ${errorMessage}`);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Filtrer les filières disponibles pour la vague sélectionnée
  const filieresDisponibles = filieres.filter(filiere => {
    if (!selectedVague) return false;
    const hasNoVagues = !filiere.vagues || filiere.vagues.length === 0;
    const hasThisVague = filiere.vagues?.some(v => v.id === selectedVague);
    return hasNoVagues || hasThisVague;
  });

  // Modules disponibles pour la filière sélectionnée
  const modulesDisponibles = selectedFiliere 
    ? filieres.find(f => f.id === parseInt(selectedFiliere))?.modules || []
    : [];

  // Formateurs disponibles
  const formateursDisponibles = formateurs.filter(f => f.statut === 'active');

  const getTeacherDisplayName = (teacher: Teacher) => {
    return `${teacher.prenom} ${teacher.nom}`.trim() || teacher.email;
  };

  // Vérifier si un module est déjà assigné
  const moduleDejaAssigne = (moduleId: string) => {
    return assignations.some(assignment => 
      assignment.vagueId === selectedVague && 
      assignment.filiereId === selectedFiliere &&
      assignment.moduleId === moduleId &&
      assignment.id !== editingAssignmentId
    );
  };

  // Ajouter un créneau horaire
  const ajouterCreneau = () => {
    if (!currentSlot.day || !currentSlot.startTime || !currentSlot.endTime) {
      toast.error('Veuillez remplir tous les champs du créneau horaire');
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

    toast.success('Créneau ajouté avec succès!');
  };

  // Supprimer un créneau
  const supprimerCreneau = (slotId: string) => {
    setNewAssignment(prev => ({
      ...prev,
      slots: prev.slots.filter(slot => slot.id !== slotId)
    }));
    toast.success('Créneau supprimé');
  };

  // Ouvrir le formulaire en mode édition
  const ouvrirModification = (assignment: Assignment) => {
    console.log('📝 Ouverture en mode édition:', assignment);
    
    setSelectedVague(assignment.vagueId);
    setSelectedFiliere(assignment.filiereId);
    setSelectedModule(assignment.moduleId);
    setSelectedTeacher(assignment.teacherId);
    
    setNewAssignment({
      slots: assignment.schedule.slots,
      period: assignment.schedule.period
    });

    setIsEditing(true);
    setEditingAssignmentId(assignment.id);
    setShowAssignmentForm(true);

    toast.success('Mode modification activé');
  };

  // NOUVEAU : Ouvrir la modal de suppression
  const ouvrirSuppression = (assignment: Assignment) => {
    console.log('🗑️ Ouverture modal suppression pour:', assignment.id);
    setAssignmentToDelete(assignment);
    setShowDeleteModal(true);
  };

  // NOUVEAU : Confirmer la suppression
  const confirmerSuppression = async () => {
    if (!assignmentToDelete) return;

    const toastId = toast.loading('Suppression en cours...');
    
    try {
      console.log(`🗑️ Suppression de l'assignation: ${assignmentToDelete.id}`);
      
      const response = await fetch(`/api/censor/assignations?id=${assignmentToDelete.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la suppression');
      }

      const result = await response.json();
      console.log('✅ Réponse suppression:', result);

      // Mettre à jour le state local
      setAssignations(prev => prev.filter(a => a.id !== assignmentToDelete.id));
      
      // Fermer la modal
      setShowDeleteModal(false);
      setAssignmentToDelete(null);
      
      toast.success('Assignation supprimée avec succès!', { id: toastId });

    } catch (error) {
      console.error('❌ Erreur suppression:', error);
      const errorMessage = error instanceof Error ? error.message : "Erreur lors de la suppression";
      toast.error(errorMessage, { id: toastId });
    }
  };

  // NOUVEAU : Annuler la suppression
  const annulerSuppression = () => {
    setShowDeleteModal(false);
    setAssignmentToDelete(null);
    toast('Suppression annulée', { icon: 'ℹ️' });
  };

  // Sauvegarder l'assignation
  const sauvegarderAssignation = async () => {
    console.log('Tentative de sauvegarde d\'assignation:');
    console.log('Mode:', isEditing ? 'MODIFICATION' : 'AJOUT');

    // Validation
    if (!selectedVague || !selectedFiliere || !selectedModule || !selectedTeacher) {
      toast.error('Veuillez remplir tous les champs requis');
      return;
    }

    if (!newAssignment.period.startDate || !newAssignment.period.endDate) {
      toast.error('Veuillez définir la période');
      return;
    }

    if (newAssignment.slots.length === 0) {
      toast.error('Veuillez ajouter au moins un créneau horaire');
      return;
    }

    // Créer l'assignation
    const assignment: Assignment = {
      id: isEditing ? editingAssignmentId : Date.now().toString(),
      vagueId: selectedVague,
      filiereId: selectedFiliere,
      moduleId: selectedModule,
      teacherId: selectedTeacher,
      schedule: newAssignment
    };

    const toastId = toast.loading(isEditing ? 'Modification en cours...' : 'Création en cours...');

    try {
      const method = isEditing ? 'PUT' : 'POST';
      const url = '/api/censor/assignations';
      
      console.log(`📤 Envoi ${method} à ${url}`, assignment);

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(assignment)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Erreur lors de la ${isEditing ? 'modification' : 'sauvegarde'}`);
      }

      const result = await response.json();
      console.log(`✅ Assignation ${isEditing ? 'modifiée' : 'sauvegardée'}:`, result);

      // Recharger les assignations
      const refreshResponse = await fetch('/api/censor/assignations');
      if (refreshResponse.ok) {
        const refreshedData = await refreshResponse.json();
        setAssignations(refreshedData);
      }

      reinitialiserFormulaire();
      setShowAssignmentForm(false);
      
      toast.success(
        isEditing ? 'Assignation modifiée avec succès!' : 'Assignation créée avec succès!',
        { id: toastId }
      );

    } catch (error) {
      console.error(`❌ Erreur ${isEditing ? 'modification' : 'sauvegarde'}:`, error);
      const errorMessage = error instanceof Error ? error.message : `Erreur lors de la ${isEditing ? 'modification' : 'sauvegarde'}`;
      toast.error(errorMessage, { id: toastId });
    }
  };

  // Réinitialiser le formulaire
  const reinitialiserFormulaire = () => {
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
    setIsEditing(false);
    setEditingAssignmentId('');
  };

  // Jours de la semaine
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

  // Fermer le modal
  const fermerModal = () => {
    setShowAssignmentForm(false);
    reinitialiserFormulaire();
    toast('Formulaire annulé', { icon: 'ℹ️' });
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

  if (error) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <h2 className="text-lg font-bold mb-2">Erreur de chargement</h2>
            <p>{error}</p>
            <p className="text-sm mt-2">Vérifiez que les APIs vagues et filières sont accessibles</p>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen bg-gray-50 lg:pl-5 pt-20 lg:pt-6">
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
              {vagues.length === 0 && (
                <p className="text-xs text-red-600 mt-1">
                  Aucune vague disponible. Créez d'abord des vagues.
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Filière *</label>
              <select
                value={selectedFiliere}
                onChange={(e) => setSelectedFiliere(e.target.value)}
                disabled={!selectedVague || filieresDisponibles.length === 0}
                className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              >
                <option value="">Sélectionnez une filière</option>
                {filieresDisponibles.map(f => (
                  <option key={f.id} value={f.id.toString()}>{f.name}</option>
                ))}
              </select>
              {filieresDisponibles.length === 0 && selectedVague && (
                <p className="text-xs text-red-600 mt-1">
                  Aucune filière disponible pour cette vague.
                </p>
              )}
            </div>
          </div>

          {selectedVague && selectedFiliere && (
            <div className="flex justify-end">
              <button
                onClick={() => {
                  reinitialiserFormulaire();
                  setShowAssignmentForm(true);
                }}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
              >
                <FaPlus /> Nouvelle assignation
              </button>
            </div>
          )}
        </div>

        {/* LISTE DES ASSIGNATIONS */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold mb-4">Assignations existantes</h2>
          {assignations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-2">Aucune assignation pour l'instant.</p>
              <p className="text-sm text-gray-400">
                Créez votre première assignation en sélectionnant une vague et une filière.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {assignations.map(assignment => {
                const vague = vagues.find(v => v.id === assignment.vagueId);
                const filiere = filieres.find(f => f.id === parseInt(assignment.filiereId));
                const moduleItem = filiere?.modules?.find(m => m.id === parseInt(assignment.moduleId));
                const teacher = formateurs.find(f => f.id === assignment.teacherId);
                
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
                      <div className="flex gap-2 self-start">
                        <button 
                          onClick={() => ouvrirModification(assignment)} 
                          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                          title="Modifier cette assignation"
                        >
                          <FaEdit size={12} /> Modifier
                        </button>
                        <button 
                          onClick={() => ouvrirSuppression(assignment)} 
                          className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                          title="Supprimer cette assignation"
                        >
                          <FaTrash size={12} /> Supprimer
                        </button>
                      </div>
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

      {/* MODAL D'ASSIGNATION */}
      {showAssignmentForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl border w-full max-w-2xl max-h-[95vh] overflow-hidden flex flex-col">
            {/* En-tête */}
            <div className="bg-white p-6 border-b border-gray-200 sticky top-0 z-10">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">
                  {isEditing ? 'Modifier l\'assignation' : 'Nouvelle assignation'}
                </h2>
                <button 
                  onClick={fermerModal} 
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
                        value={moduleItem.id.toString()}
                        disabled={moduleDejaAssigne(moduleItem.id.toString())}
                      >
                        {moduleItem.name} {moduleDejaAssigne(moduleItem.id.toString()) && '(Déjà assigné)'}
                      </option>
                    ))}
                  </select>
                  {modulesDisponibles.length === 0 && selectedFiliere && (
                    <p className="text-xs text-red-600 mt-1">
                      Aucun module disponible dans cette filière.
                    </p>
                  )}
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
                        {getTeacherDisplayName(f)} {f.specialite ? `(${f.specialite})` : ''}
                      </option>
                    ))}
                  </select>
                  {formateursDisponibles.length === 0 && (
                    <p className="text-xs text-red-600 mt-1">
                      Aucun formateur disponible. Créez d'abord des comptes formateurs.
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

                {/* Formulaire d'ajout de créneau */}
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
                  onClick={fermerModal} 
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  onClick={sauvegarderAssignation}
                  disabled={newAssignment.slots.length === 0}
                  className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  <FaSave size={14} /> {isEditing ? 'Modifier' : 'Enregistrer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NOUVELLE MODAL DE SUPPRESSION */}
      {showDeleteModal && assignmentToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl border w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <FaTrash className="text-red-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Confirmer la suppression</h2>
              </div>
              
              <p className="text-gray-600 mb-2">
                Êtes-vous sûr de vouloir supprimer cette assignation ?
              </p>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="font-medium text-red-800">
                  {(() => {
                    const vague = vagues.find(v => v.id === assignmentToDelete.vagueId);
                    const filiere = filieres.find(f => f.id === parseInt(assignmentToDelete.filiereId));
                    const moduleItem = filiere?.modules?.find(m => m.id === parseInt(assignmentToDelete.moduleId));
                    const teacher = formateurs.find(f => f.id === assignmentToDelete.teacherId);
                    
                    return `${moduleItem?.name || 'Module'} - ${filiere?.name || 'Filière'} - ${vague?.name || 'Vague'}`;
                  })()}
                </p>
                <p className="text-sm text-red-600 mt-1">
                  Cette action est irréversible.
                </p>
              </div>

              <div className="flex gap-3 justify-end">
                <button 
                  onClick={annulerSuppression}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  onClick={confirmerSuppression}
                  className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700"
                >
                  <FaTrash size={12} /> Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}