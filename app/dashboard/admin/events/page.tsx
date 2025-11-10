// app/dashboard/events/page.tsx
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { 
  CalendarDays, AlertCircle, Users, Sun, ClipboardList, MapPin, 
  Filter, Search, ChevronDown, Plus, Edit, Trash2, X, Save,
  LucideIcon
} from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import toast from 'react-hot-toast';

// Interfaces
interface SchoolEvent {
  id: string;
  date: string;
  day: string;
  title: string;
  type: string;
  location: string;
  icon: string;
  color: string;
  badge: string;
  month: string;
  time: string;
  description?: string;
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

// Composants Skeleton
const EventCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 border-l-4 border-blue-500/50 animate-pulse">
      <div className="flex flex-col sm:flex-row">
        {/* Section Date Skeleton */}
        <div className="bg-gray-200 p-4 flex items-center justify-between sm:justify-center sm:flex-col w-full sm:w-28 flex-shrink-0">
          <div className="text-center space-y-2">
            <div className="h-8 w-12 bg-gray-300 rounded mx-auto"></div>
            <div className="h-4 w-16 bg-gray-300 rounded mx-auto"></div>
            <div className="h-3 w-12 bg-gray-300 rounded mx-auto"></div>
          </div>
        </div>

        {/* Détails Skeleton */}
        <div className="flex-1 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="flex-1 space-y-3">
              <div className="flex items-start gap-3">
                <div className="h-5 w-5 bg-gray-300 rounded-full mt-0.5 flex-shrink-0"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-6 w-3/4 bg-gray-300 rounded"></div>
                  <div className="h-4 w-20 bg-gray-200 rounded"></div>
                  <div className="h-4 w-full bg-gray-200 rounded"></div>
                  <div className="flex flex-col sm:flex-row gap-4 mt-2">
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 bg-gray-300 rounded-full"></div>
                      <div className="h-3 w-24 bg-gray-200 rounded"></div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 bg-gray-300 rounded-full"></div>
                      <div className="h-3 w-20 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Actions Skeleton */}
            <div className="flex items-center justify-between sm:justify-end gap-2 sm:flex-col sm:items-end">
              <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
              <div className="flex gap-1">
                <div className="h-8 w-8 bg-gray-200 rounded"></div>
                <div className="h-8 w-8 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const MonthSectionSkeleton: React.FC = () => {
  return (
    <section className="space-y-4">
      {/* En-tête du mois Skeleton */}
      <div className="flex items-center gap-3">
        <div className="w-1 h-8 bg-gray-300 rounded-full flex-shrink-0"></div>
        <div className="h-7 w-32 bg-gray-300 rounded"></div>
        <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
      </div>

      {/* Grille des événements Skeleton */}
      <div className="grid gap-4">
        {[...Array(3)].map((_, index) => (
          <EventCardSkeleton key={index} />
        ))}
      </div>
    </section>
  );
};

const FilterSkeleton: React.FC = () => {
  return (
    <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200 shadow-sm animate-pulse">
      <div className="space-y-4">
        <div>
          <div className="h-4 w-24 bg-gray-300 rounded mb-3"></div>
          <div className="flex flex-wrap gap-2">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="h-8 w-20 bg-gray-200 rounded-full"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Composant Principal
export default function EventsPage() {
  const { user } = useUser();
  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const [eventTypes, setEventTypes] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("Tous");
  const [showFilters, setShowFilters] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<SchoolEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    type: '',
    location: '',
    date: '',
    time: '',
    description: '',
    badge: 'Important'
  });

  // Vérifier si l'utilisateur peut modifier (admin ou censeur)
  const userRole = user?.publicMetadata?.role as string || '';
  const canModify = userRole && (
    userRole.toLowerCase().includes('admin') || 
    userRole.toLowerCase().includes('censeur') ||
    userRole === 'Admin' ||
    userRole === 'Censeur'
  );

  // Charger les événements depuis l'API
  useEffect(() => {
    loadEvents();
    loadEventTypes();
  }, []);

  const loadEvents = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/censor/events');
      if (response.ok) {
        const data = await response.json();
        setEvents(data);
      } else {
        toast.error('Erreur chargement événements');
      }
    } catch (error) {
      toast.error('Erreur chargement événements:');
    } finally {
      setIsLoading(false);
    }
  };

  const loadEventTypes = async () => {
    const defaultTypes = ['Tous', 'Réunion', 'Voyage', 'Congé', 'Compétition', 'Fête', 'Sport', 'Culturel', 'Pédagogique'];
    setEventTypes(defaultTypes);
  };

  // CRUD Operations
  const createEvent = async (eventData: any) => {
    try {
      const response = await fetch('/api/censor/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });

      if (response.ok) {
        const newEvent = await response.json();
        setEvents(prev => [newEvent, ...prev]);
        return true;
      } else {
        const error = await response.json();
        alert(error.error || 'Erreur lors de la création');
        return false;
      }
    } catch (error) {
      toast.error('Erreur création événement:');
      toast('Erreur lors de la création');
      return false;
    }
  };

  const updateEvent = async (id: string, eventData: any) => {
    try {
      const response = await fetch('/api/censor/events', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: id,
          ...eventData
        }),
      });

      if (response.ok) {
        const updatedEvent = await response.json();
        setEvents(prev => prev.map(event => 
          event.id === id ? updatedEvent : event
        ));
        return true;
      } else {
        const error = await response.json();
        toast(error.error || 'Erreur lors de la modification');
        return false;
      }
    } catch (error) {
      toast.error('Erreur modification événement:');
      toast('Erreur lors de la modification');
      return false;
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      const response = await fetch(`/api/censor/events?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setEvents(prev => prev.filter(event => event.id !== id));
        return true;
      } else {
        const error = await response.json();
        toast(error.error || 'Erreur lors de la suppression');
        return false;
      }
    } catch (error) {
      toast.error('Erreur suppression événement:');
      toast('Erreur lors de la suppression');
      return false;
    }
  };

  // Filtrage des événements
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const matchesSearch = searchTerm === "" ||
                            event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            event.location.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = selectedType === "Tous" || event.type === selectedType;
      return matchesSearch && matchesType;
    });
  }, [events, searchTerm, selectedType]);

  // Grouper par mois
  const eventsByMonth = filteredEvents.reduce((acc, event) => {
    if (!acc[event.month]) acc[event.month] = [];
    acc[event.month].push(event);
    return acc;
  }, {} as Record<string, SchoolEvent[]>);

  // Gestion du formulaire
  const handleAddNew = () => {
    if (!canModify) {
      toast("Vous n'avez pas les permissions pour créer un événement");
      return;
    }
    
    setEditingEvent(null);
    setFormData({
      title: '',
      type: eventTypes[1] || '',
      location: '',
      date: '',
      time: '',
      description: '',
      badge: 'Important'
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (event: SchoolEvent) => {
    if (!canModify) {
      toast("Vous n'avez pas les permissions pour modifier un événement");
      return;
    }
    
    setEditingEvent(event);
    setFormData({
      title: event.title,
      type: event.type,
      location: event.location,
      date: event.date,
      time: event.time,
      description: event.description || '',
      badge: event.badge
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!canModify) {
      toast("Vous n'avez pas les permissions pour supprimer un événement");
      return;
    }

    if (confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) {
      await deleteEvent(id);
    }
  };

  const handleSave = async () => {
    if (!formData.title || !formData.type || !formData.location || !formData.date || !formData.time) {
      toast("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    const success = editingEvent 
      ? await updateEvent(editingEvent.id, formData)
      : await createEvent(formData);

    if (success) {
      setIsDialogOpen(false);
      setEditingEvent(null);
    }
  };

  // Fonctions utilitaires pour les icônes
  const getIconComponent = (iconName: string): LucideIcon => {
    const icons: Record<string, LucideIcon> = {
      'Users': Users,
      'Sun': Sun,
      'AlertCircle': AlertCircle,
      'CalendarDays': CalendarDays,
      'ClipboardList': ClipboardList
    };
    return icons[iconName] || CalendarDays;
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Accès non autorisé</h1>
          <p className="text-gray-600">Veuillez vous connecter pour accéder à cette page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 overflow-y-auto lg:pl-5 pt-20 lg:pt-6">
      
      {/* Header */}
      <div className="border-b border-gray-200 p-4 sm:p-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1 min-w-0">
              {isLoading ? (
                <div className="space-y-2">
                  <div className="h-8 w-64 bg-gray-300 rounded animate-pulse"></div>
                  <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
                </div>
              ) : (
                <>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 truncate">
                    Événements Scolaires
                  </h1>
                  <p className="text-gray-500 text-sm sm:text-base mt-1">
                    {filteredEvents.length} événement(s) - {canModify ? 'Mode édition' : 'Mode consultation'}
                  </p>
                </>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              {/* Barre de recherche */}
              <div className="relative flex-1 sm:flex-none sm:w-64">
                {isLoading ? (
                  <div className="h-10 bg-gray-200 rounded-lg animate-pulse"></div>
                ) : (
                  <>
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Rechercher un événement..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    />
                  </>
                )}
              </div>
              
              {/* Bouton Filtres */}
              {isLoading ? (
                <div className="h-10 w-24 bg-gray-200 rounded-lg animate-pulse"></div>
              ) : (
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors bg-white"
                >
                  <Filter className="h-4 w-4" />
                  <span className="hidden sm:inline">Filtres</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                </button>
              )}
              
              {/* Bouton Nouvel événement (seulement pour admin/censeur) */}
              {isLoading ? (
                <div className="h-10 w-40 bg-gray-200 rounded-lg animate-pulse"></div>
              ) : (
                canModify && (
                  <button 
                    onClick={handleAddNew}
                    className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Nouvel événement</span>
                    <span className="sm:hidden">Nouveau</span>
                  </button>
                )
              )}
            </div>
          </div>

          {/* Filtres dépliants */}
          {showFilters && !isLoading && (
            <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Filtrer par type :</h4>
                  <div className="flex flex-wrap gap-2">
                    {eventTypes.map(type => (
                      <button
                        key={type}
                        onClick={() => setSelectedType(type)}
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                          selectedType === type 
                            ? 'bg-blue-600 text-white hover:bg-blue-700' 
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200 border border-gray-300'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Skeleton pour les filtres */}
          {isLoading && showFilters && <FilterSkeleton />}
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        {/* Événements par mois */}
        {isLoading ? (
          <div className="space-y-8">
            {[...Array(2)].map((_, index) => (
              <MonthSectionSkeleton key={index} />
            ))}
          </div>
        ) : Object.keys(eventsByMonth).length > 0 ? (
          <div className="space-y-8">
            {Object.entries(eventsByMonth).map(([month, monthEvents]) => (
              <section key={month} className="space-y-4">
                {/* En-tête du mois */}
                <div className="flex items-center gap-3">
                  <div className="w-1 h-8 bg-blue-600 rounded-full flex-shrink-0"></div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-800">{month}</h2>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {monthEvents.length} événement(s)
                  </span>
                </div>

                {/* Grille des événements */}
                <div className="grid gap-4">
                  {monthEvents.map(event => {
                    const EventIcon = getIconComponent(event.icon);
                    return (
                      <div key={event.id} className="bg-white rounded-lg shadow-sm border border-gray-200 border-l-4 border-blue-500/50 hover:shadow-lg transition-all duration-300">
                        <div className="flex flex-col sm:flex-row">
                          {/* Section Date */}
                          <div className={`${event.color} text-white p-4 flex items-center justify-between sm:justify-center sm:flex-col w-full sm:w-28 flex-shrink-0`}>
                            <div className="text-center">
                              <div className="text-2xl sm:text-3xl font-bold">{event.date.split(' ')[0]}</div>
                              <div className="text-sm opacity-90">{event.date.split(' ')[1]}</div>
                              <div className="text-xs opacity-75 mt-1">({event.day})</div>
                            </div>
                          </div>

                          {/* Détails de l'événement */}
                          <div className="flex-1 p-4 sm:p-6">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                              <div className="flex-1 space-y-2">
                                <div className="flex items-start gap-3">
                                  <EventIcon className="h-5 w-5 text-gray-500 mt-0.5 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 break-words">
                                      {event.title}
                                    </h3>
                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                        {event.type}
                                      </span>
                                    </div>
                                    {event.description && (
                                      <p className="text-gray-600 mt-2 text-sm break-words">{event.description}</p>
                                    )}
                                    <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4 mt-2 text-sm text-gray-600">
                                      <div className="flex items-center gap-2">
                                        <MapPin className="h-4 w-4 flex-shrink-0" />
                                        <span className="break-words">{event.location}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <CalendarDays className="h-4 w-4 flex-shrink-0" />
                                        <span>{event.time}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Actions et badge (seulement pour admin/censeur) */}
                              <div className="flex items-center justify-between sm:justify-end gap-2 sm:flex-col sm:items-end">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  event.badge === "Important" ? "bg-blue-100 text-blue-800 border border-blue-200" : ""
                                } ${event.badge === "Congé" ? "bg-green-100 text-green-800 border border-green-200" : ""}
                                  ${event.badge === "Optionnel" ? "bg-gray-100 text-gray-800 border border-gray-200" : ""}
                                  ${event.badge === "Compétition" ? "bg-purple-100 text-purple-800 border border-purple-200" : ""}
                                  ${event.badge === "Fête" ? "bg-yellow-100 text-yellow-800 border border-yellow-200" : ""}
                                `}>
                                  {event.badge}
                                </span>
                                {canModify && (
                                  <div className="flex gap-1">
                                    <button 
                                      onClick={() => handleEdit(event)}
                                      className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                      aria-label="Modifier"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </button>
                                    <button 
                                      onClick={() => handleDelete(event.id)}
                                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                      aria-label="Supprimer"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        ) : (
          /* État vide */
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 text-center py-12">
            <div className="max-w-md mx-auto p-6">
              <CalendarDays className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun événement trouvé</h3>
              <p className="text-gray-500 mb-6">
                {searchTerm || selectedType !== "Tous" 
                  ? "Aucun événement ne correspond à vos critères de recherche." 
                  : "Aucun événement n'a été créé pour le moment."}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button 
                  onClick={() => { setSearchTerm(""); setSelectedType("Tous"); }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Réinitialiser les filtres
                </button>
                {canModify && (
                  <button 
                    onClick={handleAddNew}
                    className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Créer un événement
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal d'ajout/modification (seulement pour admin/censeur) */}
      {isDialogOpen && canModify && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl border w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* En-tête */}
            <div className="bg-white p-4 sm:p-6 border-b border-gray-200 sticky top-0 z-10">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingEvent ? "Modifier l'événement" : "Nouvel événement"}
                </h2>
                <button 
                  onClick={() => setIsDialogOpen(false)} 
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                  aria-label="Fermer"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Contenu du formulaire */}
            <div className="p-4 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Titre */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Titre de l'événement"
                  />
                </div>

                {/* Type */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Sélectionnez un type</option>
                      {eventTypes.filter(type => type !== 'Tous').map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={formData.type}
                      onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Ou écrivez un nouveau type"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Choisissez un type existant ou écrivez un nouveau type personnalisé.
                  </p>
                </div>

                {/* Lieu */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lieu *</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Lieu de l'événement"
                  />
                </div>

                {/* Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                  <input
                    type="text"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ex: 24 Octobre"
                  />
                </div>

                {/* Heure */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Heure *</label>
                  <input
                    type="text"
                    value={formData.time}
                    onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ex: 18:00 - 20:00"
                  />
                </div>

                {/* Priorité */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priorité</label>
                  <select
                    value={formData.badge}
                    onChange={(e) => setFormData(prev => ({ ...prev, badge: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Important">Important</option>
                    <option value="Optionnel">Optionnel</option>
                    <option value="Congé">Congé</option>
                    <option value="Compétition">Compétition</option>
                    <option value="Fête">Fête</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Description de l'événement (optionnel)"
                />
              </div>
            </div>

            {/* Pied de page */}
            <div className="bg-white p-4 sm:p-6 border-t border-gray-200 sticky bottom-0">
              <div className="flex flex-col sm:flex-row gap-2 justify-end">
                <button 
                  onClick={() => setIsDialogOpen(false)} 
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors order-2 sm:order-1"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSave}
                  className="flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors order-1 sm:order-2"
                >
                  <Save className="h-4 w-4" />
                  {editingEvent ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}