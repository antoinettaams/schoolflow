// app/dashboard/emploi-du-temps-global/page.tsx
"use client"
import { useState, useEffect, useCallback } from 'react'
import { useUser } from '@clerk/nextjs'
import { Search, Filter, Clock, MapPin, User, Calendar} from 'lucide-react'

// Import des composants shadcn
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge" 
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"

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

interface FiliereModule {
  id: string;
  name: string;
}

interface Filiere {
  id: string;
  name: string;
  modules?: FiliereModule[];
}

interface SchoolUser {
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
export default function EmploiDuTempsGlobalPage() {
  const { user, isLoaded } = useUser()
  const [isLoading, setIsLoading] = useState(true)
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [vagues, setVagues] = useState<Vague[]>([])
  const [filieres, setFilieres] = useState<Filiere[]>([])
  const [formateurs, setFormateurs] = useState<SchoolUser[]>([])
  const [filteredSchedules, setFilteredSchedules] = useState<Schedule[]>([])
  const [selectedVague, setSelectedVague] = useState<string>('all')
  const [selectedFiliere, setSelectedFiliere] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState<string>('')

  const joursSemaine = [
    { id: 'monday', label: 'Lundi' },
    { id: 'tuesday', label: 'Mardi' },
    { id: 'wednesday', label: 'Mercredi' },
    { id: 'thursday', label: 'Jeudi' },
    { id: 'friday', label: 'Vendredi' },
    { id: 'saturday', label: 'Samedi' }
  ]

  // Chargement des données
  const loadData = useCallback(() => {
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

      // Charger les filières - CORRECTION ICI
      const savedFilieres = localStorage.getItem('schoolflow_filieres')
      if (savedFilieres) {
        const filieresData = JSON.parse(savedFilieres) as Filiere[]
        setFilieres(filieresData) // Correction: filieresData au lieu de fileresData
      }

      // Charger les formateurs
      const savedUsers = localStorage.getItem('schoolflow_users')
      if (savedUsers) {
        const users = JSON.parse(savedUsers) as SchoolUser[]
        const teachers = users.filter((user: SchoolUser) => 
          user.role === 'Enseignant' && user.statut !== 'inactif'
        )
        setFormateurs(teachers)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error)
    }
  }, [])

  useEffect(() => {
    if (isLoaded) {
      loadData()
      setIsLoading(false)
    }
  }, [isLoaded, loadData])

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
        const moduleItem = filiere?.modules?.find((m: FiliereModule) => m.id === schedule.moduleId)
        const moduleName = moduleItem?.name || ''
        const teacher = formateurs.find(f => f.id === schedule.teacherId)
        const teacherName = teacher ? getTeacherDisplayName(teacher) : ''
        
        return moduleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
               teacherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
               filiere?.name.toLowerCase().includes(searchTerm.toLowerCase())
      })
    }

    // Tri alphabétique par nom de module
    filtered.sort((a, b) => {
      const filiereA = filieres.find(f => f.id === a.filiereId)
      const moduleA = filiereA?.modules?.find((m: FiliereModule) => m.id === a.moduleId)
      const filiereB = filieres.find(f => f.id === b.filiereId)
      const moduleB = filiereB?.modules?.find((m: FiliereModule) => m.id === b.moduleId)
      
      const nameA = moduleA?.name || ''
      const nameB = moduleB?.name || ''
      
      return nameA.localeCompare(nameB)
    })

    setFilteredSchedules(filtered)
  }, [schedules, selectedVague, selectedFiliere, searchTerm, filieres, formateurs])

  // Fonctions utilitaires
  const getTeacherDisplayName = (teacher: SchoolUser) => {
    if (teacher.prenom && teacher.nom) {
      return `${teacher.prenom} ${teacher.nom}`
    }
    return teacher.name || 'Non assigné'
  }

  const getDayLabel = (day: string) => {
    return joursSemaine.find(j => j.id === day)?.label || day
  }

  const formatTime = (time: string) => {
    return time.slice(0, 5) // Format HH:MM
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Chargement de l&apos;emploi du temps global...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-2xl">Accès non autorisé</CardTitle>
            <CardDescription>
              Veuillez vous connecter pour accéder à cette page.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6 overflow-y-auto  lg:pl-5 pt-20 lg:pt-6">
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-foreground">Emploi du Temps Global</h1>
          </div>
          <p className="text-muted-foreground">
            Consultation de tous les emplois du temps - Vue Administrative
          </p>
        </div>

        {/* Filtres */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                {/* Sélection Vague */}
                <div className="w-full sm:w-48">
                  <Select value={selectedVague} onValueChange={setSelectedVague}>
                    <SelectTrigger>
                      <SelectValue placeholder="Toutes les vagues" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les vagues</SelectItem>
                      {vagues.map(vague => (
                        <SelectItem key={vague.id} value={vague.id}>
                          {vague.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Sélection Filière */}
                <div className="w-full sm:w-48">
                  <Select 
                    value={selectedFiliere} 
                    onValueChange={setSelectedFiliere}
                    disabled={!selectedVague || selectedVague === 'all'}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Toutes les filières" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les filières</SelectItem>
                      {filieres.map(filiere => (
                        <SelectItem key={filiere.id} value={filiere.id}>
                          {filiere.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Recherche */}
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    type="text"
                    placeholder="Rechercher un module, formateur..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Filtres avancés
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Filtres avancés</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <h4 className="text-sm font-semibold text-foreground mb-3">Statistiques globales :</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <Card>
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-blue-600">{filteredSchedules.length}</div>
                          <div className="text-muted-foreground">Cours programmés</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-green-600">{vagues.length}</div>
                          <div className="text-muted-foreground">Vagues actives</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-purple-600">{filieres.length}</div>
                          <div className="text-muted-foreground">Filières</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-orange-600">{formateurs.length}</div>
                          <div className="text-muted-foreground">Formateurs</div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </CardContent>
        </Card>

        {/* Liste des emplois du temps */}
        {filteredSchedules.length === 0 ? (
          <Card className="text-center">
            <CardContent className="p-12">
              <div className="text-muted-foreground mb-4">
                <Clock className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Aucun emploi du temps trouvé
              </h3>
              <p className="text-muted-foreground">
                Aucun emploi du temps ne correspond à vos critères de recherche.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {filteredSchedules.map((schedule) => {
              const vague = vagues.find(v => v.id === schedule.vagueId)
              const filiere = filieres.find(f => f.id === schedule.filiereId)
              const moduleItem = filiere?.modules?.find((m: FiliereModule) => m.id === schedule.moduleId)
              const teacher = formateurs.find(f => f.id === schedule.teacherId)

              return (
                <Card key={schedule.id} className="overflow-hidden">
                  {/* En-tête */}
                  <CardHeader className="bg-muted/50">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <CardTitle className="text-lg">
                          {moduleItem?.name || 'Module inconnu'}
                        </CardTitle>
                        <div className="flex flex-wrap gap-2 mt-1">
                          <Badge variant="secondary">
                            {filiere?.name || 'Filière inconnue'}
                          </Badge>
                          <Badge variant="outline">
                            {vague?.name || 'Vague inconnue'}
                          </Badge>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <User className="h-4 w-4 mr-1" />
                            {teacher ? getTeacherDisplayName(teacher) : 'Formateur non assigné'}
                          </div>
                        </div>
                      </div>
                      <CardDescription>
                        Période: {new Date(schedule.schedule.period.startDate).toLocaleDateString('fr-FR')} - {new Date(schedule.schedule.period.endDate).toLocaleDateString('fr-FR')}
                      </CardDescription>
                    </div>
                  </CardHeader>

                  {/* Créneaux horaires */}
                  <CardContent className="p-6">
                    <h4 className="font-medium text-foreground mb-4">Créneaux horaires :</h4>
                    <div className="grid gap-3">
                      {schedule.schedule.slots.map((slot: ScheduleSlot, index: number) => (
                        <Card key={slot.id} className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-6">
                              <div className="w-24">
                                <Badge className="w-full justify-center bg-blue-600 text-white">
                                  {getDayLabel(slot.day)}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="flex items-center text-sm">
                                  <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                                  {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                                </div>
                                {slot.classroom && (
                                  <div className="flex items-center text-sm text-muted-foreground">
                                    <MapPin className="h-4 w-4 mr-1" />
                                    {slot.classroom}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Créneau {index + 1}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Résumé en bas de page */}
        {filteredSchedules.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Résumé global</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                <div>
                  <h4 className="font-medium text-foreground mb-2">Répartition par vague</h4>
                  <ScrollArea className="h-48">
                    <div className="space-y-2">
                      {vagues.map(vague => {
                        const count = filteredSchedules.filter(s => s.vagueId === vague.id).length
                        if (count === 0) return null
                        return (
                          <div key={vague.id} className="flex justify-between py-1">
                            <span className="text-muted-foreground">{vague.name}</span>
                            <span className="font-medium">{count} cours</span>
                          </div>
                        )
                      })}
                    </div>
                  </ScrollArea>
                </div>
                <div>
                  <h4 className="font-medium text-foreground mb-2">Répartition par filière</h4>
                  <ScrollArea className="h-48">
                    <div className="space-y-2">
                      {filieres.map(filiere => {
                        const count = filteredSchedules.filter(s => s.filiereId === filiere.id).length
                        if (count === 0) return null
                        return (
                          <div key={filiere.id} className="flex justify-between py-1">
                            <span className="text-muted-foreground">{filiere.name}</span>
                            <span className="font-medium">{count} cours</span>
                          </div>
                        )
                      })}
                    </div>
                  </ScrollArea>
                </div>
                <div>
                  <h4 className="font-medium text-foreground mb-2">Formateurs actifs</h4>
                  <ScrollArea className="h-48">
                    <div className="space-y-2">
                      {formateurs.map(teacher => {
                        const count = filteredSchedules.filter(s => s.teacherId === teacher.id).length
                        if (count === 0) return null
                        return (
                          <div key={teacher.id} className="flex justify-between py-1">
                            <span className="text-muted-foreground">{getTeacherDisplayName(teacher)}</span>
                            <span className="font-medium">{count} cours</span>
                          </div>
                        )
                      })}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}