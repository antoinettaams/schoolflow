// app/emploi-du-temps/page.tsx
"use client"
import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { 
  Search, 
  Clock, 
  MapPin, 
  User, 
  Calendar,
  Filter,
  RefreshCw,
  Eye
} from 'lucide-react'

// Interfaces CORRIGÉES
interface ScheduleSlot {
  day: string;
  startTime: string;
  endTime: string;
  classroom?: string;
}

interface Schedule {
  id: string;
  vagueId: string;
  filiereId: number;
  moduleId: number;
  teacherId: string;
  vague: { 
    id: string; 
    nom: string;
    dateDebut?: string;
    dateFin?: string;
  };
  filiere: { 
    id: number;
    nom: string 
  };
  module: { 
    id: number;
    nom: string;
    coefficient?: number;
    typeModule?: string;
  };
  teacher: { 
    id: string; 
    firstName: string; 
    lastName: string; 
    email: string 
  };
  slots: ScheduleSlot[];
  period: {
    startDate: string;
    endDate: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface Vague {
  id: string;
  name: string;
  nom: string;
}

interface Filiere {
  id: number;
  name: string;
  nom: string;
  modules?: Module[];
}

interface Module {
  id: number;
  name: string;
  nom: string;
  coefficient?: number;
  typeModule?: string;
}

interface Formateur {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

const JOURS_SEMAINE = [
  { id: 'monday', label: 'Lundi' },
  { id: 'tuesday', label: 'Mardi' },
  { id: 'wednesday', label: 'Mercredi' },
  { id: 'thursday', label: 'Jeudi' },
  { id: 'friday', label: 'Vendredi' },
  { id: 'saturday', label: 'Samedi' }
];

export default function EmploiDuTempsPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [vagues, setVagues] = useState<Vague[]>([])
  const [filieres, setFilieres] = useState<Filiere[]>([])
  const [filteredSchedules, setFilteredSchedules] = useState<Schedule[]>([])
  
  // Filtres
  const [filters, setFilters] = useState({
    vagueId: 'all',
    filiereId: 'all',
    searchTerm: ''
  })

  // Chargement des données
  useEffect(() => {
    if (isLoaded && user) {
      loadAllData()
    }
  }, [isLoaded, user])

  // Filtrage des données
  useEffect(() => {
    applyFilters()
  }, [filters, schedules])

  const loadAllData = async () => {
    try {
      setIsLoading(true)
      await Promise.all([
        loadSchedules(),
        loadVagues(),
        loadFilieres()
      ])
    } catch (error) {
      console.error('Erreur chargement données:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadSchedules = async () => {
    try {
      const response = await fetch('/api/censor/schedules')
      if (response.ok) {
        const data = await response.json()
        setSchedules(data)
      } else {
        console.error('Erreur API schedules:', response.status)
      }
    } catch (error) {
      console.error('Erreur chargement schedules:', error)
    }
  }

  const loadVagues = async () => {
    try {
      const response = await fetch('/api/censor/vagues')
      if (response.ok) {
        const data = await response.json()
        setVagues(data)
      }
    } catch (error) {
      console.error('Erreur chargement vagues:', error)
    }
  }

  const loadFilieres = async () => {
    try {
      const response = await fetch('/api/censor/filieres')
      if (response.ok) {
        const data = await response.json()
        setFilieres(data)
      }
    } catch (error) {
      console.error('Erreur chargement filières:', error)
    }
  }

  const applyFilters = () => {
    let filtered = schedules

    // Filtre par vague
    if (filters.vagueId !== 'all') {
      filtered = filtered.filter(schedule => schedule.vagueId === filters.vagueId)
    }

    // Filtre par filière - CONVERSION en number
    if (filters.filiereId !== 'all') {
      filtered = filtered.filter(schedule => schedule.filiereId === parseInt(filters.filiereId))
    }

    // Filtre par recherche
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase()
      filtered = filtered.filter(schedule => 
        schedule.module.nom.toLowerCase().includes(searchLower) ||
        schedule.teacher.firstName.toLowerCase().includes(searchLower) ||
        schedule.teacher.lastName.toLowerCase().includes(searchLower) ||
        schedule.filiere.nom.toLowerCase().includes(searchLower)
      )
    }

    setFilteredSchedules(filtered)
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await loadAllData()
    setIsRefreshing(false)
  }

  const getDayLabel = (day: string) => {
    return JOURS_SEMAINE.find(j => j.id === day)?.label || day
  }

  const formatTime = (time: string) => {
    return time.slice(0, 5)
  }

  if (!isLoaded) {
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
    <div className="min-h-screen overflow-y-auto bg-gray-50 lg:pl-5 pt-20 lg:pt-6">
      <div className="max-w-7xl mx-auto p-6">
        {/* En-tête avec actions */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">Emploi du Temps</h1>
            </div>
            <p className="text-gray-600">
              Consultez les emplois du temps par filière et par vague
            </p>
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
          </div>
        </div>

        {/* Filtres */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-5 w-5 text-gray-500" />
            <h3 className="font-semibold text-gray-900">Filtres</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Recherche */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Recherche
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Module, formateur, filière..."
                  value={filters.searchTerm}
                  onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Vague */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vague
              </label>
              <select 
                value={filters.vagueId} 
                onChange={(e) => setFilters(prev => ({ ...prev, vagueId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Toutes les vagues</option>
                {vagues.map(vague => (
                  <option key={vague.id} value={vague.id}>
                    {vague.nom || vague.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filière */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filière
              </label>
              <select 
                value={filters.filiereId} 
                onChange={(e) => setFilters(prev => ({ ...prev, filiereId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Toutes les filières</option>
                {filieres.map(filiere => (
                  <option key={filiere.id} value={filiere.id.toString()}>
                    {filiere.nom || filiere.name}
                  </option>
                ))}
              </select>
            </div>
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
            <div className="text-sm text-gray-600">Vagues actives</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="text-2xl font-bold text-purple-600">{filieres.length}</div>
            <div className="text-sm text-gray-600">Filières</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="text-2xl font-bold text-orange-600">
              {new Set(filteredSchedules.map(s => s.teacherId)).size}
            </div>
            <div className="text-sm text-gray-600">Formateurs assignés</div>
          </div>
        </div>

        {/* Liste des emplois du temps */}
        {isLoading ? (
          <div className="bg-white p-12 rounded-lg shadow-sm border border-gray-200 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement des emplois du temps...</p>
          </div>
        ) : filteredSchedules.length === 0 ? (
          <div className="bg-white p-12 rounded-lg shadow-sm border border-gray-200 text-center">
            <div className="text-gray-400 mb-4">
              <Clock className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {filters.vagueId !== 'all' || filters.filiereId !== 'all' || filters.searchTerm 
                ? "Aucun résultat trouvé" 
                : "Aucun emploi du temps"
              }
            </h3>
            <p className="text-gray-500 mb-4">
              {filters.vagueId !== 'all' || filters.filiereId !== 'all' || filters.searchTerm
                ? "Aucun emploi du temps ne correspond à vos critères de recherche."
                : "Aucun emploi du temps n'a été créé pour le moment."
              }
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredSchedules.map((schedule) => (
              <ScheduleCard 
                key={schedule.id} 
                schedule={schedule} 
                getDayLabel={getDayLabel}
                formatTime={formatTime}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Composant Carte d'emploi du temps - VERSION VISUALISATION SEULEMENT
function ScheduleCard({ 
  schedule,
  getDayLabel,
  formatTime 
}: { 
  schedule: Schedule
  getDayLabel: (day: string) => string
  formatTime: (time: string) => string
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* En-tête */}
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                {schedule.module.nom}
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {schedule.filiere.nom}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                {schedule.vague.nom}
              </span>
              <div className="flex items-center text-sm text-gray-600">
                <User className="h-4 w-4 mr-1" />
                {schedule.teacher.firstName} {schedule.teacher.lastName}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Calendar className="h-4 w-4" />
            Créé le {new Date(schedule.createdAt).toLocaleDateString('fr-FR')}
          </div>
        </div>
      </div>

      {/* Créneaux horaires */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-gray-900">Créneaux horaires</h4>
          <div className="text-sm text-gray-500">
            Période : du {new Date(schedule.period.startDate).toLocaleDateString('fr-FR')} 
            au {new Date(schedule.period.endDate).toLocaleDateString('fr-FR')}
          </div>
        </div>
        
        <div className="grid gap-3">
          {schedule.slots.map((slot, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
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
      </div>
    </div>
  )
}