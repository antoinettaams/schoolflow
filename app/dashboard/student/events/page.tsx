"use client";

import React, { useState, useMemo } from 'react';
import { CalendarDays, AlertCircle, Users, Sun, MapPin, Filter, Search, ChevronDown, ClipboardList, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

// --- Configuration des Semestres Disponibles ---
const availableSemesters = ["Tous", "Semestre 1", "Semestre 2", "Semestre 3", "Semestre 4"];

// Types d'événements 
const eventTypes = ["Tous", "Réunion", "Congé", "Fête", "Examen"];

// --- Données simulées ---
const allEvents = [
    { id: 1, date: "24 Octobre", day: "MER", title: "Réunion Parents-Professeurs", type: "Réunion", location: "Gymnase de l'école", icon: Users, color: "bg-blue-500", badge: "Important", month: "Octobre", time: "18:00 - 20:00", semestre: "Semestre 1" },
    { id: 2, date: "27 Octobre", day: "SAM", title: "Voyage Scolaire à Rome", type: "Congé", location: "Départ à 8h00", icon: Sun, color: "bg-indigo-500", badge: "Optionnel", month: "Octobre", time: "08:00 - 20:00", semestre: "Semestre 1" },
    { id: 3, date: "01 Novembre", day: "JEU", title: "Toussaint - Jour Férié", type: "Congé", location: "École Fermée", icon: AlertCircle, color: "bg-green-500", badge: "Congé", month: "Novembre", time: "Toute la journée", semestre: "Semestre 1" },
    { id: 4, date: "10 Novembre", day: "MAR", title: "Examen de Mathématiques", type: "Examen", location: "Salle 305", icon: ClipboardList, color: "bg-red-600", badge: "Urgent", month: "Novembre", time: "09:00 - 12:00", semestre: "Semestre 2" },
    { id: 6, date: "15 Décembre", day: "VEN", title: "Fête de Noël de l'École", type: "Fête", location: "Cantine principale", icon: Sun, color: "bg-yellow-500", badge: "Fête", month: "Décembre", time: "18:00 - 22:00", semestre: "Semestre 2" },
    { id: 7, date: "18 Décembre", day: "LUN", title: "Concert de Noël", type: "Fête", location: "Auditorium", icon: Sun, color: "bg-yellow-500", badge: "Fête", month: "Décembre", time: "19:00 - 21:00", semestre: "Semestre 3" },
    { id: 8, date: "20 Décembre", day: "MER", title: "Remise des Bulletins", type: "Réunion", location: "Salle des Professeurs", icon: Users, color: "bg-blue-500", badge: "Important", month: "Décembre", time: "16:00 - 18:00", semestre: "Semestre 4" },
];

// --- Composant Principal ---
const StudentEvents = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedType, setSelectedType] = useState("Tous");
    const [selectedSemester, setSelectedSemester] = useState("Tous");
    const [showTypeFilters, setShowTypeFilters] = useState(false);
    const [showSemesterDropdown, setShowSemesterDropdown] = useState(false);
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    // Filtrage des événements scolaires
    const filteredEvents = useMemo(() => {
        return allEvents.filter(event => {
            const matchesSearch = searchTerm === "" ||
                                  event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  event.location.toLowerCase().includes(searchTerm.toLowerCase());
                                  
            const matchesType = selectedType === "Tous" || event.type === selectedType;
            const matchesSemester = selectedSemester === "Tous" || event.semestre === selectedSemester;
            
            return matchesSearch && matchesType && matchesSemester;
        });
    }, [searchTerm, selectedType, selectedSemester]);

    // Grouper par mois
    const eventsByMonth = filteredEvents.reduce((acc, event) => {
        if (!acc[event.month]) acc[event.month] = [];
        acc[event.month].push(event);
        return acc;
    }, {} as Record<string, typeof allEvents>);

    const resetFilters = () => {
        setSearchTerm("");
        setSelectedType("Tous");
        setSelectedSemester("Tous");
        setShowTypeFilters(false);
        setShowSemesterDropdown(false);
        setShowMobileFilters(false);
    }

    const hasActiveFilters = selectedType !== "Tous" || selectedSemester !== "Tous" || searchTerm !== "";

    return (
        <div className="flex flex-col h-screen bg-gray-50 overflow-hidden lg:pl-5 pt-20 lg:pt-6">
            
            {/* Header */}
            <header className="border-b border-gray-200 p-4 sm:p-6 sticky top-0 z-20 shadow-sm flex-shrink-0 bg-gray-50">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    {/* Titre et statistiques */}
                    <div className="flex-1 min-w-0">
                        <h1 className="text-sm sm:text-xl lg:text-2xl font-extrabold text-gray-900 break-words">
                            Événements scolaires
                        </h1>
                        <p className="text-gray-500 text-sm sm:text-base mt-1">
                            {filteredEvents.length} événement(s) trouvé(s)
                            {hasActiveFilters && (
                                <span className="text-blue-600 ml-2">
                                    • Filtres actifs
                                </span>
                            )}
                        </p>
                    </div>

                    {/* Contrôles de recherche et filtres - Desktop */}
                    <div className="hidden md:flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                        
                        {/* Barre de Recherche */}
                        <div className="relative flex-1 sm:w-48 lg:w-64 min-w-0">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <Input
                                placeholder="Rechercher..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 w-full"
                            />
                        </div>

                        {/* Groupe de boutons filtres */}
                        <div className="flex gap-2">
                            {/* BOUTON DROPDOWN SEMESTRE */}
                            <div className="relative flex-1 sm:flex-none">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowSemesterDropdown(!showSemesterDropdown)}
                                    className="flex items-center justify-between gap-2 w-full sm:w-40"
                                >
                                    <span className="text-gray-700 font-medium text-sm truncate">
                                        {selectedSemester === "Tous" ? "Tous semestres" : selectedSemester}
                                    </span>
                                    <ChevronDown className={`h-4 w-4 transition-transform flex-shrink-0 ${showSemesterDropdown ? 'rotate-180' : ''}`} />
                                </Button>
                                
                                {/* Options du Semestre */}
                                {showSemesterDropdown && (
                                    <div className="absolute right-0 mt-1 w-full sm:w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20">
                                        <div className="py-1">
                                            {availableSemesters.map(semester => (
                                                <button
                                                    key={semester}
                                                    onClick={() => {
                                                        setSelectedSemester(semester);
                                                        setShowSemesterDropdown(false);
                                                    }}
                                                    className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                                                        selectedSemester === semester ? 'bg-blue-600 text-white hover:bg-blue-700' : 'text-gray-700'
                                                    }`}
                                                >
                                                    {semester}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Bouton pour les filtres de Type */}
                            <Button
                                variant="outline"
                                onClick={() => setShowTypeFilters(!showTypeFilters)}
                                className="flex items-center gap-2 flex-1 sm:flex-none sm:w-32"
                            >
                                <Filter className="h-4 w-4" />
                                <span>Type</span>
                                <ChevronDown className={`h-4 w-4 transition-transform ${showTypeFilters ? 'rotate-180' : ''}`} />
                            </Button>

                            {/* Bouton reset */}
                            {hasActiveFilters && (
                                <Button
                                    variant="ghost"
                                    onClick={resetFilters}
                                    className="flex items-center gap-2"
                                >
                                    <X className="h-4 w-4" />
                                    <span className="hidden sm:inline">Reset</span>
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Contrôles Mobile */}
                    <div className="flex md:hidden gap-2">
                        {/* Barre de Recherche Mobile */}
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <Input
                                placeholder="Rechercher..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 w-full"
                            />
                        </div>

                        {/* Bouton Filtres Mobile */}
                        <Button
                            variant="outline"
                            onClick={() => setShowMobileFilters(!showMobileFilters)}
                            className="flex items-center gap-2 flex-shrink-0"
                        >
                            <Filter className="h-4 w-4" />
                            <span className="hidden xs:inline">Filtres</span>
                            {hasActiveFilters && (
                                <Badge variant="secondary" className="h-5 w-5 p-0 flex items-center justify-center text-xs">
                                    !
                                </Badge>
                            )}
                        </Button>
                    </div>
                </div>

                {/* Filtres de Type (Desktop) */}
                {showTypeFilters && (
                    <div className="hidden md:block mt-4 p-4 bg-white rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-semibold text-gray-700">Filtrer par type :</h4>
                            {hasActiveFilters && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={resetFilters}
                                    className="text-xs h-8"
                                >
                                    Tout effacer
                                </Button>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {eventTypes.map(type => (
                                <Badge
                                    key={type}
                                    variant={selectedType === type ? "default" : "outline"}
                                    className={`cursor-pointer transition-colors text-xs ${
                                        selectedType === type 
                                            ? 'bg-blue-600 text-white hover:bg-blue-700' 
                                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-300'
                                    }`}
                                    onClick={() => setSelectedType(type)}
                                >
                                    {type}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}

                {/* Filtres Mobile */}
                {showMobileFilters && (
                    <div className="md:hidden mt-4 p-4 bg-white rounded-lg border border-gray-200 shadow-lg">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-sm font-semibold text-gray-700">Filtres</h4>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowMobileFilters(false)}
                                className="h-8 w-8 p-0"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Sélecteur de Semestre Mobile */}
                        <div className="space-y-2 mb-4">
                            <label className="text-sm font-medium text-gray-700">Semestre</label>
                            <div className="grid grid-cols-2 gap-2">
                                {availableSemesters.map(semester => (
                                    <Button
                                        key={semester}
                                        variant={selectedSemester === semester ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setSelectedSemester(semester)}
                                        className="text-xs h-9"
                                    >
                                        {semester}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {/* Filtres par Type Mobile */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Type d'événement</label>
                            <div className="grid grid-cols-2 gap-2">
                                {eventTypes.map(type => (
                                    <Button
                                        key={type}
                                        variant={selectedType === type ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setSelectedType(type)}
                                        className="text-xs h-9"
                                    >
                                        {type}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {/* Actions Mobile */}
                        <div className="flex gap-2 mt-4 pt-4 border-t">
                            <Button
                                variant="outline"
                                onClick={resetFilters}
                                className="flex-1"
                            >
                                Réinitialiser
                            </Button>
                            <Button
                                onClick={() => setShowMobileFilters(false)}
                                className="flex-1"
                            >
                                Appliquer
                            </Button>
                        </div>
                    </div>
                )}
            </header>

            {/* Indicateurs de filtres actifs (Mobile) */}
            {hasActiveFilters && (
                <div className="md:hidden bg-blue-50 border-b border-blue-200 px-4 py-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs text-blue-800 font-medium">Filtres :</span>
                            {selectedSemester !== "Tous" && (
                                <Badge variant="secondary" className="text-xs">
                                    {selectedSemester}
                                </Badge>
                            )}
                            {selectedType !== "Tous" && (
                                <Badge variant="secondary" className="text-xs">
                                    {selectedType}
                                </Badge>
                            )}
                            {searchTerm && (
                                <Badge variant="secondary" className="text-xs">
                                    "{searchTerm}"
                                </Badge>
                            )}
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={resetFilters}
                            className="h-6 text-xs"
                        >
                            <X className="h-3 w-3 mr-1" />
                            Effacer
                        </Button>
                    </div>
                </div>
            )}

            {/* Zone scrollable */}
            <div className="flex-1 overflow-y-auto">
                <div className="p-3 sm:p-4 lg:p-6 space-y-6 lg:space-y-8 max-w-4xl mx-auto">

                    {/* Événements par mois */}
                    {Object.keys(eventsByMonth).length > 0 ? (
                        Object.entries(eventsByMonth).map(([month, events]) => (
                            <section key={month} className="space-y-4">
                                {/* En-tête du mois */}
                                <div className="flex items-center gap-3">
                                    <div className="w-1 h-6 sm:h-8 bg-blue-600 rounded-full flex-shrink-0"></div>
                                    <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 truncate">{month}</h2>
                                    <Badge variant="secondary" className="text-xs sm:text-sm">
                                        {events.length} événement(s)
                                    </Badge>
                                </div>

                                {/* Grille des événements */}
                                <div className="grid gap-3 sm:gap-4">
                                    {events.map(event => {
                                        const EventIcon = event.icon;
                                        return (
                                            <Card key={event.id} className="hover:shadow-lg transition-all duration-300 border-l-4 border-blue-500/50 cursor-pointer group">
                                                <div className="flex flex-col sm:flex-row">
                                                    {/* Section Date */}
                                                    <div className={`${event.color} text-white p-3 sm:p-4 flex items-center justify-between sm:justify-center sm:flex-col w-full sm:w-24 lg:w-28 flex-shrink-0`}>
                                                        <div className="text-center">
                                                            <div className="text-xl sm:text-2xl lg:text-3xl font-bold">{event.date.split(' ')[0]}</div>
                                                            <div className="text-xs sm:text-sm opacity-90">{event.date.split(' ')[1]}</div>
                                                            <div className="text-xs opacity-75 mt-1">({event.day})</div>
                                                        </div>
                                                    </div>

                                                    {/* Détails de l'événement */}
                                                    <CardContent className="flex-1 p-3 sm:p-4 lg:p-6">
                                                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3">
                                                            <div className="flex-1 space-y-2 min-w-0">
                                                                <div className="flex items-start gap-2 sm:gap-3">
                                                                    <EventIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 mt-0.5 flex-shrink-0" />
                                                                    <div className="flex-1 min-w-0">
                                                                        <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors break-words">
                                                                            {event.title}
                                                                        </h3>
                                                                        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-3 mt-2 text-xs sm:text-sm text-gray-600">
                                                                            <div className="flex items-center gap-1 sm:gap-2">
                                                                                <MapPin className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" /> 
                                                                                <span className="break-words">{event.location}</span>
                                                                            </div>
                                                                            <div className="flex items-center gap-1 sm:gap-2">
                                                                                <CalendarDays className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" /> 
                                                                                <span>{event.time}</span>
                                                                            </div>
                                                                            {/* Badge Semestre */}
                                                                            <div className="flex items-center gap-1 sm:gap-2 text-xs font-medium text-blue-600 border border-blue-300 rounded-full px-2 py-0.5 bg-blue-50 flex-shrink-0">
                                                                                {event.semestre}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            {/* Badge de statut */}
                                                            <div className="flex items-center gap-2 self-start sm:self-center">
                                                                <Badge className={`text-xs ${
                                                                    event.badge === "Urgent" ? "bg-red-100 text-red-800 border-red-200" : ""
                                                                } ${event.badge === "Important" ? "bg-blue-100 text-blue-800 border-blue-200" : ""}
                                                                    ${event.badge === "Congé" ? "bg-green-100 text-green-800 border-green-200" : ""}
                                                                    ${event.badge === "Optionnel" ? "bg-gray-100 text-gray-800 border-gray-200" : ""}
                                                                    ${event.badge === "Compétition" ? "bg-purple-100 text-purple-800 border-purple-200" : ""}
                                                                    ${event.badge === "Fête" ? "bg-yellow-100 text-yellow-800 border-yellow-200" : ""}
                                                                `}>
                                                                    {event.badge}
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </div>
                                            </Card>
                                        );
                                    })}
                                </div>
                            </section>
                        ))
                    ) : (
                        /* État vide */
                        <Card className="text-center py-8 sm:py-12">
                            <CardContent className="p-6 sm:p-8">
                                <CalendarDays className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
                                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Aucun événement trouvé</h3>
                                <p className="text-gray-500 text-sm sm:text-base mb-4 sm:mb-6">
                                    Aucun événement ne correspond à vos critères de recherche ou de filtre.
                                </p>
                                <Button 
                                    variant="outline" 
                                    onClick={resetFilters}
                                    className="w-full sm:w-auto"
                                >
                                    Réinitialiser les filtres
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {/* Informations importantes */}
                    <Separator className="my-6 sm:my-8" />
                    <section className="bg-white rounded-lg p-4 sm:p-6 border">
                        <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4">Informations importantes</h2>
                        <div className="space-y-1 sm:space-y-2 text-sm text-gray-600">
                            <p className="flex items-start gap-2">
                                <span>•</span>
                                <span>Tous les événements sont susceptibles d&apos;être modifiés.</span>
                            </p>
                            <p className="flex items-start gap-2">
                                <span>•</span>
                                <span>Consultez régulièrement cette page pour les mises à jour.</span>
                            </p>
                            <p className="flex items-start gap-2">
                                <span>•</span>
                                <span>Contactez l&apos;administration pour toute question.</span>
                            </p>
                        </div>
                    </section>

                </div>
            </div>
        </div>
    );
};

export default StudentEvents;