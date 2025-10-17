// components/ParentDashboard.tsx
"use client";

import Link from "next/link";
import { FaCalendarAlt, FaFileInvoiceDollar, FaRegChartBar, FaClipboardList, FaComments, FaGraduationCap, FaArrowRight, FaClock } from "react-icons/fa";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const childInfo = {
  name: "Antoine Dupont",
  className: "4ème B",
  latestGrade: "17/20 en Histoire-Géographie",
  absencesLastWeek: 1,
  nextInvoiceDue: "30 Novembre",
};

const nextSchedule = {
  subject: "Anglais",
  time: "Demain, 14:00",
  location: "Salle B103"
};

const nextEvent = {
  name: "Réunion d'information Parents",
  date: "25 Octobre",
};

const latestForumMessage = {
  subject: "Nouveau message du professeur principal",
  sender: "Mme Dubois",
};

const ParentDashboard = ({ parentName = "Marie Dupont" }) => {
  return (
    <div className="p-6 space-y-6 h-full bg-gray-50 overflow-y-auto">

      {/* SECTION BIENVENUE */}
      <header className="pb-4 border-b border-gray-200">
        <h1 className="font-title text-3xl font-extrabold tracking-tight text-gray-900">
          Bonjour, {parentName}! 👋
        </h1>
        <p className="text-gray-500 mt-1">
          Supervision de votre enfant : <span className="font-semibold">{childInfo.name} ({childInfo.className})</span>.
        </p>
      </header>

      {/* GRID PRINCIPALE: Notes, Assiduité, Prochain Cours, Événement */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Dernière Note */}
        <Card className="hover:shadow-lg transition">
          <CardHeader className="flex justify-between items-center pb-2">
            <CardTitle className="font-title text-sm font-medium">Dernière Note</CardTitle>
            <FaRegChartBar className="text-principal h-5 w-5" />
          </CardHeader>
          <CardContent className="pt-2 space-y-1">
            <div className="text-3xl font-bold text-green-600">{childInfo.latestGrade.split('/')[0]}</div>
            <p className="text-xs text-gray-700">{childInfo.latestGrade.split(' en ')[1]}</p>
            <Link href="/parent/exams" className="mt-1 inline-block">
              <Button variant="link" className="font-link p-0 text-principal text-xs">
                Voir toutes les notes <FaArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Assiduité */}
        <Card className="hover:shadow-lg transition">
          <CardHeader className="flex justify-between items-center pb-2">
            <CardTitle className="font-title text-sm font-medium">Assiduité (7 jours)</CardTitle>
            <FaClipboardList className="text-principal h-5 w-5" />
          </CardHeader>
          <CardContent className="pt-2 space-y-1">
            <div className="text-3xl font-bold text-red-600">{childInfo.absencesLastWeek}</div>
            <p className="text-xs text-gray-700">{childInfo.absencesLastWeek <= 1 ? "Absence signalée" : "Absences signalées"}</p>
            <Link href="/parent/attendance" className="mt-1 inline-block">
              <Button variant="link" className="font-link p-0 text-principal text-xs">
                Détails complets <FaArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Prochain Cours */}
        <Card className="hover:shadow-lg transition">
          <CardHeader className="flex justify-between items-center pb-2">
            <CardTitle className="text-sm font-medium font-title">Prochain Cours</CardTitle>
            <FaCalendarAlt className="text-principal h-5 w-5" />
          </CardHeader>
          <CardContent className="pt-2 space-y-1">
            <div className="text-xl font-bold text-gray-900">{nextSchedule.subject}</div>
            <p className="text-xs text-gray-700 flex items-center gap-1">
              <FaClock className="h-3 w-3" /> {nextSchedule.time} à {nextSchedule.location}
            </p>
            <Link href="/parent/schedules" className="mt-1 inline-block">
              <Button variant="link" className="font-link p-0 text-principal text-xs">
                Voir l'EDT complet <FaArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Évènement à Venir */}
        <Card className="hover:shadow-lg transition">
          <CardHeader className="flex justify-between items-center pb-2">
            <CardTitle className="text-sm font-medium font-title">Évènement à Venir</CardTitle>
            <FaGraduationCap className="text-principal h-5 w-5" />
          </CardHeader>
          <CardContent className="pt-2 space-y-1">
            <div className="text-xl font-bold text-gray-900">{nextEvent.name}</div>
            <p className="text-xs text-gray-700">Date : {nextEvent.date}</p>
            <Link href="/parent/events" className="mt-1 inline-block">
              <Button variant="link" className="font-link p-0 text-principal text-xs">
                Calendrier complet <FaArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* GRID INFÉRIEURE: Frais & Forum */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Frais Scolaires */}
        <Card className="hover:shadow-lg transition">
          <CardHeader>
            <CardTitle className="font-title text-lg font-bold text-gray-800">Frais Scolaires</CardTitle>
            <CardDescription>Facture en attente ou prochaine échéance</CardDescription>
          </CardHeader>
          <CardContent className="pt-2 space-y-2">
            <div className="text-3xl font-bold text-red-500">50000 FCFA</div>
            <p className="text-sm text-gray-700">Échéance : {childInfo.nextInvoiceDue}</p>
            <Link href="/parent/finance" className="mt-2 block">
              <Button className="w-full font-link bg-red-500 hover:bg-red-600">Payer Maintenant</Button>
            </Link>
          </CardContent>
        </Card>

        {/* Forum / Messagerie */}
        <Card className="hover:shadow-lg transition">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-gray-800font-title ">Communication</CardTitle>
            <CardDescription>Messages non lus</CardDescription>
          </CardHeader>
          <CardContent className="pt-2 space-y-2">
            <div className="flex items-center gap-3">
              <FaComments className="h-6 w-6 text-principal" />
              <div>
                <p className="font-semibold text-gray-900">{latestForumMessage.subject}</p>
                <p className="text-sm text-gray-600">De : {latestForumMessage.sender}</p>
              </div>
            </div>
            <Link href="/parent/forum" className="mt-2 block">
              <Button variant="outline" className="font-link w-full text-principal border-principal hover:bg-principal/10">
                Accéder au Forum/Messagerie
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ParentDashboard;
