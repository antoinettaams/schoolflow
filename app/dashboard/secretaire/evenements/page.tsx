// app/student/events/page.tsx
"use client";

import React, { useState, useMemo } from 'react';
import { CalendarDays, AlertCircle, Users, Sun, MapPin, Filter, Search, ChevronDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

// --- Données fictives ---
const allEvents = [
    { id: 1, date: "24 Octobre", day: "MER", title: "Réunion Parents-Professeurs", type: "Réunion", location: "Gymnase de l&apos;école", icon: Users, color: "bg-blue-500", badge: "Important", month: "Octobre", time: "18:00 - 20:00" },
    { id: 2, date: "27 Octobre", day: "SAM", title: "Voyage Scolaire à Rome", type: "Voyage", location: "Départ à 8h00", icon: Sun, color: "bg-indigo-500", badge: "Optionnel", month: "Octobre", time: "08:00 - 20:00" },
    { id: 3, date: "01 Novembre", day: "JEU", title: "Toussaint - Jour Férié", type: "Congé", location: "École Fermée", icon: AlertCircle, color: "bg-green-500", badge: "Congé", month: "Novembre", time: "Toute la journée" },
    { id: 4, date: "11 Novembre", day: "DIM", title: "Armistice 1918", type: "Congé", location: "École Fermée", icon: AlertCircle, color: "bg-green-500", badge: "Congé", month: "Novembre", time: "Toute la journée" },
    { id: 5, date: "15 Novembre", day: "JEU", title: "Olympiades de Sciences", type: "Compétition", location: "Laboratoire de Physique", icon: Users, color: "bg-purple-500", badge: "Compétition", month: "Novembre", time: "14:00 - 17:00" },
    { id: 6, date: "15 Décembre", day: "VEN", title: "Fête de Noël de l&apos;École", type: "Fête", location: "Cantine principale", icon: Sun, color: "bg-yellow-500", badge: "Fête", month: "Décembre", time: "18:00 - 22:00" },
    { id: 7, date: "18 Décembre", day: "LUN", title: "Concert de Noël", type: "Fête", location: "Auditorium", icon: Sun, color: "bg-yellow-500", badge: "Fête", month: "Décembre", time: "19:00 - 21:00" },
    { id: 8, date: "20 Décembre", day: "MER", title: "Remise des Bulletins", type: "Réunion", location: "Salle des Professeurs", icon: Users, color: "bg-blue-500", badge: "Important", month: "Décembre", time: "16:00 - 18:00" },
];

// Types d'événements pour filtres
const eventTypes = ["Tous", "Réunion", "Voyage", "Congé", "Compétition", "Fête"];

// --- Composant Principal ---
const StudentEvents = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedType, setSelectedType] = useState("Tous");
    const [showFilters, setShowFilters] = useState(false);

    // Filtrage des événements scolaires uniquement
    const filteredEvents = useMemo(() => {
        return allEvents.filter(event => {
            const matchesSearch = searchTerm === "" ||
                                  event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  event.location.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesType = selectedType === "Tous" || event.type === selectedType;
            return matchesSearch && matchesType;
        });
    }, [searchTerm, selectedType]);

    // Grouper par mois
    const eventsByMonth = filteredEvents.reduce((acc, event) => {
        if (!acc[event.month]) acc[event.month] = [];
        acc[event.month].push(event);
        return acc;
    }, {} as Record<string, typeof allEvents>);

    return (
        <div className="flex flex-col h-screen bg-gray-50 overflow-hidden lg:pl-5 pt-20 lg:pt-6">
            
            {/* Header */}
            <header className="border-b border-gray-200 p-4 sm:p-6 sticky top-0 z-10 shadow-sm flex-shrink-0 bg-gray-50">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                            Événements scolaires
                        </h1>
                        <p className="text-gray-500 text-sm sm:text-base">
                            {filteredEvents.length} événement(s) trouvé(s)
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                        <div className="relative flex-1 sm:w-64">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <Input
                                placeholder="Rechercher un événement..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Button
                            variant="outline"
                            onClick={() => setShowFilters(!showFilters)}
                            className="flex items-center gap-2"
                        >
                            <Filter className="h-4 w-4" />
                            Filtres
                            <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                        </Button>
                    </div>
                </div>

                {showFilters && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">Filtrer par type :</h4>
                        <div className="flex flex-wrap gap-2">
                            {eventTypes.map(type => (
                                <Badge
                                    key={type}
                                    variant={selectedType === type ? "default" : "outline"}
                                    className={`cursor-pointer transition-colors ${selectedType === type ? 'bg-principal text-white hover:bg-principal/90' : 'hover:bg-gray-200'}`}
                                    onClick={() => setSelectedType(type)}
                                >
                                    {type}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}
            </header>

            {/* Zone scrollable */}
            <div className="flex-1 overflow-y-auto">
                <div className="p-4 sm:p-6 space-y-8 max-w-4xl mx-auto">

                    {/* Événements par mois */}
                    {Object.keys(eventsByMonth).length > 0 ? (
                        Object.entries(eventsByMonth).map(([month, events]) => (
                            <section key={month} className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-1 h-8 bg-principal rounded-full"></div>
                                    <h2 className="text-xl sm:text-2xl font-bold text-gray-800">{month}</h2>
                                    <Badge variant="secondary" className="ml-2">{events.length} événement(s)</Badge>
                                </div>

                                <div className="grid gap-4">
                                    {events.map(event => {
                                        const EventIcon = event.icon;
                                        return (
                                            <Card key={event.id} className="hover:shadow-lg transition-all duration-300 border-l-4 border-principal/50 cursor-pointer group">
                                                <div className="flex flex-col sm:flex-row">
                                                    {/* Date */}
                                                    <div className={`${event.color} text-white p-4 flex items-center justify-between sm:justify-center sm:flex-col w-full sm:w-28 flex-shrink-0`}>
                                                        <div className="text-center">
                                                            <div className="text-2xl sm:text-3xl font-bold">{event.date.split(' ')[0]}</div>
                                                            <div className="text-sm opacity-90">{event.date.split(' ')[1]}</div>
                                                            <div className="text-xs opacity-75 mt-1">({event.day})</div>
                                                        </div>
                                                    </div>

                                                    {/* Détails */}
                                                    <CardContent className="flex-1 p-4 sm:p-6">
                                                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                                                            <div className="flex-1 space-y-2">
                                                                <div className="flex items-start gap-3">
                                                                    <EventIcon className="h-5 w-5 text-gray-500 mt-0.5 flex-shrink-0" />
                                                                    <div>
                                                                        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 group-hover:text-principal transition-colors">
                                                                            {event.title}
                                                                        </h3>
                                                                        <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                                                                            <div className="flex items-center gap-2">
                                                                                <MapPin className="h-4 w-4" /> {event.location}
                                                                            </div>
                                                                            <div className="flex items-center gap-2">
                                                                                <CalendarDays className="h-4 w-4" /> {event.time}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <Badge className={`${
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
                        <Card className="text-center py-12">
                            <CardContent>
                                <CalendarDays className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun événement trouvé</h3>
                                <p className="text-gray-500">Aucun événement ne correspond à vos critères de recherche.</p>
                                <Button variant="outline" className="mt-4" onClick={() => { setSearchTerm(""); setSelectedType("Tous"); }}>Réinitialiser les filtres</Button>
                            </CardContent>
                        </Card>
                    )}

                    {/* Informations importantes */}
                    <Separator className="my-8" />
                    <section className="bg-white rounded-lg p-6 border">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">Informations importantes</h2>
                        <div className="space-y-2 text-sm text-gray-600">
                            <p>• Tous les événements sont susceptibles d&apos;être modifiés.</p>
                            <p>• Consultez régulièrement cette page pour les mises à jour.</p>
                            <p>• Contactez l&apos;administration pour toute question.</p>
                        </div>
                    </section>

                </div>
            </div>
        </div>
    );
};

export default StudentEvents;
