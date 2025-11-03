// app/emploi-du-temps/page.tsx
"use client"
import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { Search, Plus, Edit, Trash2, Clock, MapPin, User, Calendar } from 'lucide-react'

// Interfaces
interface ScheduleSlot {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  classroom: string; 
}

interface Schedule {
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

interface Vague {
  id: string;
  name: string;
}

interface Module {
  id: string;
  name: string;
}

interface Filiere {
  id: string;
  name: string;
  modules?: Module[];
}

interface Formateur {
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

// Composant Principal
export default function EmploiDuTempsPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [vagues, setVagues] = useState<Vague[]>([])
  const [filieres, setFilieres] = useState<Filiere[]>([])
  const [formateurs, setFormateurs] = useState<Formateur[]>([])
  const [filteredSchedules, setFilteredSchedules] = useState<Schedule[]>([])
  const [selectedVague, setSelectedVague] = useState<string>('all')
  const [selectedFiliere, setSelectedFiliere] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null)

  const joursSemaine = [
    { id: 'monday', label: 'Lundi' },
    { id: 'tuesday', label: 'Mardi' },
    { id: 'wednesday', label: 'Mercredi' },
    { id: 'thursday', label: 'Jeudi' },
    { id: 'friday', label: 'Vendredi' },
    { id: 'saturday', label: 'Samedi' }
  ]

  // Chargement des données
  useEffect(() => {
    if (isLoaded) {
      loadData()
      setIsLoading(false)
    }
  }, [isLoaded])

  // Filtrage des emplois du temps
  useEffect(() => {
    let filtered = schedules

    // Filtre par vague
    if (selectedVague !== 'all') {
      filtered = filtered.filter(schedule => schedule.vagueId === selectedVague)
    }

    // Filtre par filière
    if (selectedFiliere !== 'all') {
      filtered = filtered.filter(schedule => schedule.filiereId === selectedFiliere)
    }

    // Filtre par recherche
    if (searchTerm) {
      filtered = filtered.filter(schedule => {
        const filiere = filieres.find(f => f.id === schedule.filiereId)
        const moduleItem = filiere?.modules?.find(m => m.id === schedule.moduleId)
        const moduleName = moduleItem?.name || ''
        
        return moduleName.toLowerCase().includes(searchTerm.toLowerCase())
      })
    }

    // Tri alphabétique par nom de module
    filtered.sort((a, b) => {
      const filiereA = filieres.find(f => f.id === a.filiereId)
      const moduleItemA = filiereA?.modules?.find(m => m.id === a.moduleId)
      const filiereB = filieres.find(f => f.id === b.filiereId)
      const moduleItemB = filiereB?.modules?.find(m => m.id === b.moduleId)
      
      const nameA = moduleItemA?.name || ''
      const nameB = moduleItemB?.name || ''
      
      return nameA.localeCompare(nameB)
    })

    setFilteredSchedules(filtered)
  }, [schedules, selectedVague, selectedFiliere, searchTerm, filieres])

  const loadData = () => {
    try {
      // Charger les emplois du temps
      const savedSchedules = localStorage.getItem('schoolflow_assignations')
      if (savedSchedules) {
        const schedulesData = JSON.parse(savedSchedules) as Schedule[]
        setSchedules(schedulesData)
      }

      // Charger les vagues
      const savedVagues = localStorage.getItem('schoolflow_vagues')
      if (savedVagues) {
        const vaguesData = JSON.parse(savedVagues) as Vague[]
        setVagues(vaguesData)
      }

      // Charger les filières
      const savedFilieres = localStorage.getItem('schoolflow_filieres')
      if (savedFilieres) {
        const filieresData = JSON.parse(savedFilieres) as Filiere[]
        setFilieres(filieresData)
      }

      // Charger les formateurs
      const savedUsers = localStorage.getItem('schoolflow_users')
      if (savedUsers) {
        const users = JSON.parse(savedUsers) as Formateur[]
        const teachers = users.filter(user => 
          user.role === 'Enseignant' && user.statut !== 'inactif'
        )
        setFormateurs(teachers)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error)
    }
  }

  // Fonctions utilitaires
  const getTeacherName = (teacherId: string) => {
    const teacher = formateurs.find(f => f.id === teacherId)
    if (teacher?.prenom && teacher?.nom) {
      return `${teacher.prenom} ${teacher.nom}`
    }
    return teacher?.name || 'Non assigné'
  }

  const getFiliereName = (filiereId: string) => {
    return filieres.find(f => f.id === filiereId)?.name || 'Inconnue'
  }

  const getVagueName = (vagueId: string) => {
    return vagues.find(v => v.id === vagueId)?.name || 'Inconnue'
  }

  const getModuleName = (filiereId: string, moduleId: string) => {
    const filiere = filieres.find(f => f.id === filiereId)
    return filiere?.modules?.find(m => m.id === moduleId)?.name || 'Inconnu'
  }

  const getDayLabel = (day: string) => {
    return joursSemaine.find(j => j.id === day)?.label || day
  }

  const formatTime = (time: string) => {
    return time.slice(0, 5)
  }

  // Gestion des actions
  const handleEdit = (schedule: Schedule) => {
    setEditingSchedule(schedule)
    setIsDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet emploi du temps ?')) {
      const updatedSchedules = schedules.filter(s => s.id !== id)
      setSchedules(updatedSchedules)
      localStorage.setItem('schoolflow_assignations', JSON.stringify(updatedSchedules))
    }
  }

  const handleAddNew = () => {
    // Redirection vers la page planning dans le dashboard
    router.push('/dashboard/censor/planning')
  }

  const handleSaveSchedule = (scheduleData: Schedule) => {
    if (editingSchedule) {
      // Modification
      setSchedules(prev => 
        prev.map(s => s.id === scheduleData.id ? scheduleData : s)
      )
    }

    // Sauvegarder dans le localStorage
    const updatedSchedules = editingSchedule
      ? schedules.map(s => s.id === scheduleData.id ? scheduleData : s)
      : schedules

    localStorage.setItem('schoolflow_assignations', JSON.stringify(updatedSchedules))
    
    setEditingSchedule(null)
    setIsDialogOpen(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Accès non autorisé</h1>
          <p className="text-gray-600">Veuillez vous connecter pour accéder à cette page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen overflow-y-auto bg-gray-50 p-6 lg:pl-5 pt-20 lg:pt-6">
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Emploi du Temps</h1>
          </div>
          <p className="text-gray-600">
            Consultez les emplois du temps par filière et par vague
          </p>
        </div>

        {/* Filtres */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
              {/* Sélection Vague */}
              <div className="w-full sm:w-48">
                <select 
                  value={selectedVague} 
                  onChange={(e) => setSelectedVague(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Toutes les vagues</option>
                  {vagues.map(vague => (
                    <option key={vague.id} value={vague.id}>
                      {vague.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sélection Filière */}
              <div className="w-full sm:w-48">
                <select 
                  value={selectedFiliere} 
                  onChange={(e) => setSelectedFiliere(e.target.value)}
                  disabled={!selectedVague || selectedVague === 'all'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                >
                  <option value="all">Toutes les filières</option>
                  {filieres.map(filiere => (
                    <option key={filiere.id} value={filiere.id}>
                      {filiere.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Recherche */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Rechercher un module..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <button 
              onClick={handleAddNew}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg whitespace-nowrap transition-colors"
            >
              <Plus className="h-4 w-4" />
              Nouvel emploi
            </button>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="text-2xl font-bold text-blue-600">{filteredSchedules.length}</div>
            <div className="text-sm text-gray-600">Emplois du temps</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="text-2xl font-bold text-green-600">{vagues.length}</div>
            <div className="text-sm text-gray-600">Vagues</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="text-2xl font-bold text-purple-600">{filieres.length}</div>
            <div className="text-sm text-gray-600">Filières</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="text-2xl font-bold text-orange-600">{formateurs.length}</div>
            <div className="text-sm text-gray-600">Formateurs</div>
          </div>
        </div>

        {/* Liste des emplois du temps */}
        {filteredSchedules.length === 0 ? (
          <div className="bg-white p-12 rounded-lg shadow-sm border border-gray-200 text-center">
            <div className="text-gray-400 mb-4">
              <Clock className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Aucun emploi du temps trouvé
            </h3>
            <p className="text-gray-500 mb-4">
              Aucun emploi du temps ne correspond à vos critères de recherche.
            </p>
            <button 
              onClick={handleAddNew}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-2 py-2 rounded-lg mx-auto"
            >
              <Plus className="h-4 w-4" />
              Créer le premier emploi du temps
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSchedules.map((schedule) => (
              <div key={schedule.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {/* En-tête */}
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {getModuleName(schedule.filiereId, schedule.moduleId)}
                      </h3>
                      <div className="flex flex-wrap gap-2 mt-1">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {getFiliereName(schedule.filiereId)}
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-300">
                          {getVagueName(schedule.vagueId)}
                        </span>
                        <div className="flex items-center text-sm text-gray-600">
                          <User className="h-4 w-4 mr-1" />
                          {getTeacherName(schedule.teacherId)}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleEdit(schedule)}
                        className="flex items-center gap-1 px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                        Modifier
                      </button>
                      <button 
                        onClick={() => handleDelete(schedule.id)}
                        className="flex items-center gap-1 px-3 py-1 border border-red-300 text-red-600 rounded text-sm hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                        Supprimer
                      </button>
                    </div>
                  </div>
                </div>

                {/* Créneaux horaires */}
                <div className="p-6">
                  <h4 className="font-medium text-gray-900 mb-4">Créneaux horaires :</h4>
                  <div className="grid gap-3">
                    {schedule.schedule.slots.map((slot: ScheduleSlot, index: number) => (
                      <div key={slot.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-6">
                          <div className="w-24">
                            <span className="inline-flex items-center justify-center w-full px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-600 text-white">
                              {getDayLabel(slot.day)}
                            </span>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center text-sm">
                              <Clock className="h-4 w-4 mr-1 text-gray-500" />
                              {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                            </div>
                            {slot.classroom && (
                              <div className="flex items-center text-sm text-gray-600">
                                <MapPin className="h-4 w-4 mr-1" />
                                {slot.classroom}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">
                          Créneau {index + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Période */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                      Période : du {new Date(schedule.schedule.period.startDate).toLocaleDateString('fr-FR')} 
                      au {new Date(schedule.schedule.period.endDate).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal de modification */}
        {isDialogOpen && editingSchedule && (
          <EditScheduleModal
            schedule={editingSchedule}
            isOpen={isDialogOpen}
            onClose={() => {
              setIsDialogOpen(false)
              setEditingSchedule(null)
            }}
            onSave={handleSaveSchedule}
            vagues={vagues}
            filieres={filieres}
            formateurs={formateurs}
            joursSemaine={joursSemaine}
          />
        )}
      </div>
    </div>
  )
}

// Composant Modal pour l'édition
function EditScheduleModal({ 
  schedule, 
  isOpen, 
  onClose, 
  onSave,
  vagues,
  filieres,
  formateurs,
  joursSemaine 
}: {
  schedule: Schedule
  isOpen: boolean
  onClose: () => void
  onSave: (schedule: Schedule) => void
  vagues: Vague[]
  filieres: Filiere[]
  formateurs: Formateur[]
  joursSemaine: { id: string; label: string }[]
}) {
  const [formData, setFormData] = useState({
    vagueId: schedule.vagueId,
    filiereId: schedule.filiereId,
    moduleId: schedule.moduleId,
    teacherId: schedule.teacherId,
    period: schedule.schedule.period,
    slots: schedule.schedule.slots
  })

  const getModuleName = (filiereId: string, moduleId: string) => {
    const filiere = filieres.find(f => f.id === filiereId)
    return filiere?.modules?.find(m => m.id === moduleId)?.name || 'Inconnu'
  }

  const getDayLabel = (day: string) => {
    return joursSemaine.find(j => j.id === day)?.label || day
  }

  const handleSave = () => {
    const updatedSchedule: Schedule = {
      ...schedule,
      ...formData,
      schedule: {
        slots: formData.slots,
        period: formData.period
      }
    }
    onSave(updatedSchedule)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl border w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* En-tête */}
        <div className="bg-white p-6 border-b border-gray-200 sticky top-0 z-10">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">
              Modifier l&apos;emploi du temps - {getModuleName(schedule.filiereId, schedule.moduleId)}
            </h2>
            <button 
              onClick={onClose} 
              className="text-gray-500 hover:text-gray-700 text-xl"
            >
              ×
            </button>
          </div>
        </div>

        {/* Contenu */}
        <div className="p-6 space-y-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800 text-sm">
              <strong>Note :</strong> Pour créer un nouvel emploi du temps, utilisez la page &ldquo;Planning&ldquo; dans le dashboard.
              Cette interface permet uniquement de modifier les emplois existants.
            </p>
          </div>

          {/* Informations en lecture seule */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Vague</label>
              <div className="mt-1 p-2 bg-gray-100 rounded border border-gray-300">
                {vagues.find(v => v.id === formData.vagueId)?.name || 'Inconnue'}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Filière</label>
              <div className="mt-1 p-2 bg-gray-100 rounded border border-gray-300">
                {filieres.find(f => f.id === formData.filiereId)?.name || 'Inconnue'}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Module</label>
              <div className="mt-1 p-2 bg-gray-100 rounded border border-gray-300">
                {getModuleName(formData.filiereId, formData.moduleId)}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Formateur</label>
              <select 
                value={formData.teacherId} 
                onChange={(e) => setFormData(prev => ({ ...prev, teacherId: e.target.value }))}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Sélectionnez un formateur</option>
                {formateurs.map(formateur => (
                  <option key={formateur.id} value={formateur.id}>
                    {formateur.prenom && formateur.nom 
                      ? `${formateur.prenom} ${formateur.nom}`
                      : formateur.name
                    }
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Période */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-4 w-4" />
              <h4 className="font-medium text-gray-900">Période du module</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Date de début *</label>
                <input
                  type="date"
                  value={formData.period.startDate}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    period: { ...prev.period, startDate: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Date de fin *</label>
                <input
                  type="date"
                  value={formData.period.endDate}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    period: { ...prev.period, endDate: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Créneaux horaires existants */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-4 w-4" />
              <h4 className="font-medium text-gray-900">Créneaux horaires</h4>
            </div>
            
            {formData.slots.length > 0 ? (
              <div className="space-y-2">
                <h5 className="font-medium">Créneaux programmés ({formData.slots.length})</h5>
                {formData.slots.map((slot) => (
                  <div key={slot.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                    <div className="flex items-center gap-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-600 text-white">
                        {getDayLabel(slot.day)}
                      </span>
                      <div className="flex items-center text-sm">
                        <Clock className="h-4 w-4 mr-1" />
                        {slot.startTime} - {slot.endTime}
                      </div>
                      {slot.classroom && (
                        <div className="flex items-center text-sm">
                          <MapPin className="h-4 w-4 mr-1" />
                          {slot.classroom}
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      Lecture seule
                    </div>
                  </div>
                ))}
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-blue-800 text-sm">
                    Pour modifier les créneaux horaires, veuillez utiliser la page &ldquo;Planning&ldquo; dans le dashboard.
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <Clock className="h-8 w-8 mx-auto mb-2" />
                <p>Aucun créneau horaire</p>
              </div>
            )}
          </div>
        </div>

        {/* Pied de page */}
        <div className="bg-white p-4 border-t border-gray-200 sticky bottom-0">
          <div className="flex gap-2 justify-end">
            <button 
              onClick={onClose} 
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors"
            >
              ✓ Modifier
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}