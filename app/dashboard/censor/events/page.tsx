// app/dashboard/events/page.tsx
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { 
  CalendarDays, AlertCircle, Users, Sun, ClipboardList, MapPin, 
  Filter, Search, ChevronDown, Plus, Edit, Trash2, X, Save,
  LucideIcon
} from 'lucide-react';

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
}

// Composant Principal
export default function CensorEventsPage() {
  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const [eventTypes, setEventTypes] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("Tous");
  const [showFilters, setShowFilters] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<SchoolEvent | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    type: '',
    location: '',
    date: '',
    time: '',
    description: '',
    badge: 'Important'
  });
  const [customType, setCustomType] = useState('');

  // Charger les données depuis le localStorage
  useEffect(() => {
    const savedEvents = localStorage.getItem('schoolflow_events');
    const savedTypes = localStorage.getItem('schoolflow_event_types');
    
    if (savedEvents) {
      setEvents(JSON.parse(savedEvents));
    } else {
      // Données par défaut
      const defaultEvents: SchoolEvent[] = [
        { id: '1', date: "24 Octobre", day: "MER", title: "Réunion Parents-Professeurs", type: "Réunion", location: "Gymnase de l'école", icon: "Users", color: "bg-blue-500", badge: "Important", month: "Octobre", time: "18:00 - 20:00" },
        { id: '2', date: "27 Octobre", day: "SAM", title: "Voyage Scolaire à Rome", type: "Voyage", location: "Départ à 8h00", icon: "Sun", color: "bg-indigo-500", badge: "Optionnel", month: "Octobre", time: "08:00 - 20:00" },
        { id: '3', date: "01 Novembre", day: "JEU", title: "Toussaint - Jour Férié", type: "Congé", location: "École Fermée", icon: "AlertCircle", color: "bg-green-500", badge: "Congé", month: "Novembre", time: "Toute la journée" },
      ];
      setEvents(defaultEvents);
      localStorage.setItem('schoolflow_events', JSON.stringify(defaultEvents));
    }

    if (savedTypes) {
      setEventTypes(['Tous', ...JSON.parse(savedTypes)]);
    } else {
      // Types par défaut
      const defaultTypes = ['Réunion', 'Voyage', 'Congé', 'Compétition', 'Fête'];
      setEventTypes(['Tous', ...defaultTypes]);
      localStorage.setItem('schoolflow_event_types', JSON.stringify(defaultTypes));
    }
  }, []);

  // Sauvegarder les événements
  const saveEvents = (updatedEvents: SchoolEvent[]) => {
    setEvents(updatedEvents);
    localStorage.setItem('schoolflow_events', JSON.stringify(updatedEvents));
  };

  // Sauvegarder les types
  const saveEventTypes = (updatedTypes: string[]) => {
    const typesWithoutTous = updatedTypes.filter(type => type !== 'Tous');
    setEventTypes(['Tous', ...typesWithoutTous]);
    localStorage.setItem('schoolflow_event_types', JSON.stringify(typesWithoutTous));
  };

  // Ajouter un nouveau type
  const addEventType = (newType: string) => {
    if (newType && !eventTypes.includes(newType)) {
      const updatedTypes = [...eventTypes.filter(type => type !== 'Tous'), newType];
      saveEventTypes(updatedTypes);
      setCustomType('');
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

  const handleDelete = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) {
      const updatedEvents = events.filter(event => event.id !== id);
      saveEvents(updatedEvents);
    }
  };

  const handleSave = () => {
    if (!formData.title || !formData.type || !formData.location || !formData.date || !formData.time) {
      alert("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    // Vérifier si le type existe
    if (formData.type && !eventTypes.includes(formData.type)) {
      addEventType(formData.type);
    }

    // Générer les métadonnées automatiques
    const dateParts = formData.date.split(' ');
    const month = dateParts[1] || 'Mois';
    const dayAbbrev = getDayAbbreviation();

    const eventData: SchoolEvent = {
      id: editingEvent?.id || Date.now().toString(),
      title: formData.title,
      type: formData.type,
      location: formData.location,
      date: formData.date,
      day: dayAbbrev,
      month: month,
      time: formData.time,
      description: formData.description,
      badge: formData.badge,
      icon: getIconByType(formData.type),
      color: getColorByType(formData.type)
    };

    if (editingEvent) {
      // Modification
      const updatedEvents = events.map(event => 
        event.id === editingEvent.id ? eventData : event
      );
      saveEvents(updatedEvents);
    } else {
      // Création
      saveEvents([...events, eventData]);
    }

    setIsDialogOpen(false);
    setEditingEvent(null);
  };

  // Fonctions utilitaires
  const getDayAbbreviation = () => {
    const days = ['DIM', 'LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM'];
    return days[Math.floor(Math.random() * days.length)];
  };

  const getIconByType = (type: string) => {
    const icons: Record<string, string> = {
      'Réunion': 'Users',
      'Voyage': 'Sun',
      'Congé': 'AlertCircle',
      'Compétition': 'Users',
      'Fête': 'Sun',
      'Sport': 'Users',
      'Culturel': 'Sun',
      'Pédagogique': 'ClipboardList'
    };
    return icons[type] || 'CalendarDays';
  };

  const getColorByType = (type: string) => {
    const colors: Record<string, string> = {
      'Réunion': 'bg-blue-500',
      'Voyage': 'bg-indigo-500',
      'Congé': 'bg-green-500',
      'Compétition': 'bg-purple-500',
      'Fête': 'bg-yellow-500',
      'Sport': 'bg-red-500',
      'Culturel': 'bg-pink-500',
      'Pédagogique': 'bg-teal-500'
    };
    return colors[type] || 'bg-gray-500';
  };

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

  return (
    <div className="min-h-screen bg-gray-50 overflow-y-auto lg:pl-5 pt-20 lg:pt-6">
      
      {/* Header */}
      <div className="border-b border-gray-200 p-4 sm:p-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 truncate">
                Gestion des Événements Scolaires
              </h1>
              <p className="text-gray-500 text-sm sm:text-base mt-1">
                {filteredEvents.length} événement(s)
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              {/* Barre de recherche */}
              <div className="relative flex-1 sm:flex-none sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Rechercher un événement..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                />
              </div>
              
              {/* Bouton Filtres */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors bg-white"
              >
                <Filter className="h-4 w-4" />
                <span className="hidden sm:inline">Filtres</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
              
              {/* Bouton Nouvel événement */}
              <button 
                onClick={handleAddNew}
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Nouvel événement</span>
                <span className="sm:hidden">Nouveau</span>
              </button>
            </div>
          </div>

          {/* Filtres dépliants */}
          {showFilters && (
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

                {/* Ajout de type personnalisé */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Ajouter un type personnalisé :</h4>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={customType}
                      onChange={(e) => setCustomType(e.target.value)}
                      placeholder="Nouveau type d'événement"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      onClick={() => {
                        if (customType.trim()) {
                          addEventType(customType.trim());
                          setCustomType('');
                        }
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors whitespace-nowrap"
                    >
                      Ajouter le type
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Les nouveaux types seront disponibles dans les filtres et lors de la création d'événements.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        {/* Événements par mois */}
        {Object.keys(eventsByMonth).length > 0 ? (
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
                              
                              {/* Actions et badge */}
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
                  : "Commencez par créer votre premier événement."}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button 
                  onClick={() => { setSearchTerm(""); setSelectedType("Tous"); }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Réinitialiser les filtres
                </button>
                <button 
                  onClick={handleAddNew}
                  className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Créer un événement
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal d'ajout/modification */}
      {isDialogOpen && (
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