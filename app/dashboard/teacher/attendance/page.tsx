"use client";

import React, { useState, useEffect } from "react";
import { 
  FaCalendarAlt, 
  FaChalkboardTeacher, 
  FaUsers, 
  FaCheck, 
  FaTimes, 
  FaEdit,
  FaSave,
  FaClock,
  FaBook,
  FaBuilding,
  FaExclamationTriangle,
  FaCheckCircle,
  FaUser,
  FaIdCard,
  FaHistory,
  FaCalendarDay,
  FaTrash,
  FaEye,
  FaArrowLeft
} from "react-icons/fa";

interface Student {
  id: string;
  name: string;
  studentId: string;
  status?: "present" | "absent";
  justified?: boolean;
  reason?: string;
  date?: string;
}

interface TeacherCourse {
  id: string;
  assignationId: string;
  date: string;
  startTime: string;
  endTime: string;
  subject: string;
  className: string;
  filiereId: number;
  vagueId: string;
  students: Student[];
  attendanceTaken: boolean;
}

interface AttendanceHistory {
  dates: string[];
  course: {
    subject: string;
    className: string;
    schedule: string;
  };
}

interface AttendanceDetails {
  date: string;
  students: Student[];
  course: {
    subject: string;
    className: string;
    schedule: string;
  };
}

// Composants Skeleton (garder les mêmes)
const CourseSkeleton = () => (
  <div className="w-full p-4 rounded-lg border border-gray-200 animate-pulse">
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 bg-gray-300 rounded"></div>
        <div className="h-4 bg-gray-300 rounded w-20"></div>
      </div>
      <div className="w-5 h-5 bg-gray-300 rounded-full"></div>
    </div>
    <div className="flex items-center gap-2 mb-1">
      <div className="w-4 h-4 bg-gray-300 rounded"></div>
      <div className="h-4 bg-gray-300 rounded w-24"></div>
    </div>
    <div className="flex items-center gap-2 mb-2">
      <div className="w-4 h-4 bg-gray-300 rounded"></div>
      <div className="h-3 bg-gray-300 rounded w-32"></div>
    </div>
    <div className="flex justify-between">
      <div className="h-3 bg-gray-300 rounded w-12"></div>
      <div className="h-3 bg-gray-300 rounded w-12"></div>
      <div className="h-3 bg-gray-300 rounded w-12"></div>
    </div>
  </div>
);

const StudentSkeleton = () => (
  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg animate-pulse">
    <div className="flex-1">
      <div className="h-5 bg-gray-300 rounded w-32 mb-2"></div>
      <div className="h-4 bg-gray-300 rounded w-20"></div>
    </div>
    <div className="flex items-center gap-4">
      <div className="h-8 bg-gray-300 rounded w-24"></div>
      <div className="h-8 bg-gray-300 rounded w-20"></div>
      <div className="h-8 bg-gray-300 rounded w-32"></div>
    </div>
  </div>
);

export default function TeacherAttendancePage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [courses, setCourses] = useState<TeacherCourse[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<TeacherCourse | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // États pour l'historique
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceHistory | null>(null);
  const [selectedHistoryDate, setSelectedHistoryDate] = useState<string | null>(null);
  const [attendanceDetails, setAttendanceDetails] = useState<AttendanceDetails | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fonction utilitaire pour compter les étudiants avec statut
  const getStudentsWithStatus = (course: TeacherCourse) => {
    return course.students.filter(student => student.status !== undefined).length;
  };

  // Charger TOUS les cours du professeur
  const fetchTeacherCourses = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/teacher/attendance?action=teacher-courses');

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors du chargement des cours');
      }

      const data = await response.json();
      setCourses(data.courses || []);
      
      // Si un cours était sélectionné, mettre à jour ses données
      if (selectedCourse) {
        const updatedCourse = data.courses.find((c: TeacherCourse) => c.id === selectedCourse.id);
        setSelectedCourse(updatedCourse || null);
      }
    } catch (error) {
      console.error('Erreur:', error);
      setError(error instanceof Error ? error.message : 'Erreur de chargement');
    } finally {
      setIsLoading(false);
    }
  };

  // Charger l'historique des présences d'un cours
  const fetchAttendanceHistory = async (courseId: string) => {
    try {
      setIsLoadingHistory(true);
      const response = await fetch(`/api/teacher/attendance?action=attendance-history&courseId=${courseId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors du chargement de l\'historique');
      }

      const data = await response.json();
      setAttendanceHistory(data);
      setSelectedHistoryDate(null);
      setAttendanceDetails(null);
    } catch (error) {
      console.error('Erreur:', error);
      setError(error instanceof Error ? error.message : 'Erreur de chargement de l\'historique');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Charger les détails des présences pour une date spécifique
  const fetchAttendanceByDate = async (courseId: string, date: string) => {
    try {
      setIsLoadingHistory(true);
      const response = await fetch(`/api/teacher/attendance?action=attendance-by-date&courseId=${courseId}&date=${date}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors du chargement des détails');
      }

      const data = await response.json();
      setAttendanceDetails(data);
      setSelectedHistoryDate(date);
    } catch (error) {
      console.error('Erreur:', error);
      setError(error instanceof Error ? error.message : 'Erreur de chargement des détails');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Supprimer les présences d'une date spécifique
  const deleteAttendanceForDate = async (courseId: string, date: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer toutes les présences du ${formatFrenchDate(date)} ?`)) {
      return;
    }

    try {
      setIsDeleting(true);
      const response = await fetch(`/api/teacher/attendance?action=delete-attendance&courseId=${courseId}&date=${date}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la suppression');
      }

      const data = await response.json();
      setSuccess(`Présences du ${formatFrenchDate(date)} supprimées avec succès`);
      
      // Recharger l'historique
      if (selectedCourse) {
        fetchAttendanceHistory(selectedCourse.id);
      }
      
      setTimeout(() => {
        setSuccess(null);
      }, 3000);

    } catch (error) {
      console.error('Erreur:', error);
      setError(error instanceof Error ? error.message : 'Erreur lors de la suppression');
    } finally {
      setIsDeleting(false);
    }
  };

  // Sauvegarder les présences pour une date spécifique
  const saveAttendance = async () => {
    if (!selectedCourse) return;

    try {
      setIsSaving(true);
      setError(null);

      // FILTRER : Ne envoyer que les étudiants qui ont un statut défini
      const studentsWithStatus = selectedCourse.students
        .filter(student => student.status !== undefined)
        .map(student => ({
          id: student.id,
          status: student.status as "present" | "absent",
          justified: student.justified || false,
          reason: student.reason || ""
        }));

      console.log('💾 Étudiants à sauvegarder:', studentsWithStatus);

      // VÉRIFICATION : Au moins un étudiant doit avoir un statut
      if (studentsWithStatus.length === 0) {
        setError("Veuillez définir au moins une présence avant de sauvegarder");
        setIsSaving(false);
        return;
      }

      const response = await fetch('/api/teacher/attendance?action=save-attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId: selectedCourse.id,
          date: selectedDate,
          students: studentsWithStatus,
          semester: "t1"
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la sauvegarde');
      }

      const result = await response.json();
      
      // Mettre à jour les données avec la réponse de l'API
      if (result.updatedCourse) {
        setSelectedCourse(prev => prev ? {
          ...prev,
          students: result.updatedCourse.students,
          attendanceTaken: result.updatedCourse.attendanceTaken
        } : null);
        
        setCourses(prev => prev.map(course => 
          course.id === selectedCourse.id 
            ? { 
                ...course, 
                students: result.updatedCourse.students,
                attendanceTaken: result.updatedCourse.attendanceTaken
              }
            : course
        ));
      }

      setSuccess(`Présences sauvegardées avec succès pour le ${formatFrenchDate(selectedDate)}`);
      setIsEditing(false);
      
      setTimeout(() => {
        setSuccess(null);
      }, 3000);

    } catch (error) {
      console.error('Erreur:', error);
      setError(error instanceof Error ? error.message : 'Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  // Basculer le statut de présence d'un étudiant
  const toggleStudentStatus = (studentId: string) => {
    if (!selectedCourse || !isEditing) return;

    setSelectedCourse(prev => {
      if (!prev) return null;

      return {
        ...prev,
        students: prev.students.map(student => 
          student.id === studentId 
            ? { 
                ...student, 
                status: student.status === "present" ? "absent" : "present",
                justified: student.status === "absent" ? false : student.justified,
                reason: student.status === "absent" ? "" : student.reason
              }
            : student
        )
      };
    });
  };

  // Marquer un absent comme justifié/non justifié
  const toggleJustification = (studentId: string) => {
    if (!selectedCourse || !isEditing) return;

    setSelectedCourse(prev => {
      if (!prev) return null;

      return {
        ...prev,
        students: prev.students.map(student => 
          student.id === studentId && student.status === "absent"
            ? { ...student, justified: !student.justified }
            : student
        )
      };
    });
  };

  // Mettre à jour le motif d'absence
  const updateReason = (studentId: string, reason: string) => {
    if (!selectedCourse || !isEditing) return;

    setSelectedCourse(prev => {
      if (!prev) return null;

      return {
        ...prev,
        students: prev.students.map(student => 
          student.id === studentId && student.status === "absent"
            ? { ...student, reason }
            : student
        )
      };
    });
  };

  // Réinitialiser la présence d'un étudiant
  const resetStudentStatus = (studentId: string) => {
    if (!selectedCourse || !isEditing) return;

    setSelectedCourse(prev => {
      if (!prev) return null;

      return {
        ...prev,
        students: prev.students.map(student => 
          student.id === studentId
            ? { 
                ...student, 
                status: undefined,
                justified: false,
                reason: ""
              }
            : student
        )
      };
    });
  };

  // Formater la date en français
  const formatFrenchDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Formater la date courte
  const formatShortDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Calculer les statistiques d'un cours
  const getCourseStats = (course: TeacherCourse) => {
    const present = course.students.filter(s => s.status === "present").length;
    const absent = course.students.filter(s => s.status === "absent").length;
    const notSet = course.students.filter(s => !s.status).length;
    const total = course.students.length;

    return { present, absent, notSet, total };
  };

  // Obtenir le pourcentage de complétion
  const getCompletionPercentage = (course: TeacherCourse) => {
    const stats = getCourseStats(course);
    return ((stats.present + stats.absent) / stats.total) * 100;
  };

  // Revenir à la vue normale
  const backToCourseView = () => {
    setAttendanceHistory(null);
    setSelectedHistoryDate(null);
    setAttendanceDetails(null);
  };

  // Effet pour charger les cours au démarrage
  useEffect(() => {
    fetchTeacherCourses();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 overflow-y-auto lg:pl-5 pt-20 lg:pt-6">
      <div className="p-6 max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Gestion des Présences
          </h1>
          <p className="text-gray-600">
            Gérez les présences de tous vos cours - Historique complet disponible
          </p>
        </div>

        {/* Sélecteur de date pour nouvelle présence */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-2 text-blue-600">
              <FaCalendarDay className="text-xl" />
              <span className="font-semibold">Date pour les présences :</span>
            </div>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading || isSaving}
            />
            <div className="text-lg font-semibold text-gray-700">
              {formatFrenchDate(selectedDate)}
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Sélectionnez la date pour laquelle vous voulez prendre les présences
          </p>
        </div>

        {/* Alertes */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-800">
              <FaExclamationTriangle />
              <span>{error}</span>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-800">
              <FaCheckCircle />
              <span>{success}</span>
            </div>
          </div>
        )}

        {/* VUE HISTORIQUE */}
        {attendanceHistory && (
          <div className="bg-white rounded-xl shadow-sm border mb-6">
            <div className="p-6 border-b">
              <div className="flex items-center gap-4 mb-4">
                <button
                  onClick={backToCourseView}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-semibold"
                >
                  <FaArrowLeft />
                  Retour au cours
                </button>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Historique des Présences - {attendanceHistory.course.subject}
              </h2>
              <div className="flex items-center gap-4 text-gray-600">
                <div className="flex items-center gap-2">
                  <FaBuilding />
                  <span>{attendanceHistory.course.className}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FaClock />
                  <span>{attendanceHistory.course.schedule}</span>
                </div>
              </div>
            </div>

            {/* Détails d'une date spécifique */}
            {attendanceDetails && (
              <div className="p-6 bg-blue-50 border-b">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-blue-900">
                    Présences du {formatFrenchDate(attendanceDetails.date)}
                  </h3>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => deleteAttendanceForDate(selectedCourse!.id, attendanceDetails.date)}
                      disabled={isDeleting}
                      className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <FaTrash />
                      {isDeleting ? "Suppression..." : "Supprimer"}
                    </button>
                  </div>
                </div>

                <div className="grid gap-3">
                  {attendanceDetails.students.map(student => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <FaUser className="text-blue-600" />
                            </div>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{student.name}</div>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <FaIdCard className="text-gray-400" />
                              <span>{student.studentId}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className={`px-3 py-2 rounded-lg text-sm font-medium ${
                          student.status === "present"
                            ? "bg-green-100 text-green-800"
                            : student.status === "absent"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }`}>
                          {student.status === "present" ? "✅ Présent" : 
                           student.status === "absent" ? "❌ Absent" : "⚪ Non renseigné"}
                        </span>
                        
                        {student.status === "absent" && student.justified && (
                          <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs">
                            Justifié
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Liste des dates d'historique */}
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Dates de présence enregistrées
              </h3>
              
              {isLoadingHistory ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <div key={n} className="p-4 border border-gray-200 rounded-lg animate-pulse">
                      <div className="h-4 bg-gray-300 rounded w-24 mb-2"></div>
                      <div className="h-3 bg-gray-300 rounded w-32"></div>
                    </div>
                  ))}
                </div>
              ) : attendanceHistory.dates.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FaHistory className="text-4xl text-gray-300 mx-auto mb-3" />
                  <p>Aucune présence enregistrée pour ce cours</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {attendanceHistory.dates.map(date => (
                    <button
                      key={date}
                      onClick={() => fetchAttendanceByDate(selectedCourse!.id, date)}
                      className={`p-4 border rounded-lg text-left transition-all ${
                        selectedHistoryDate === date
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium text-gray-900">
                          {formatShortDate(date)}
                        </div>
                        <FaEye className="text-gray-400" />
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatFrenchDate(date)}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* VUE NORMALE (cours) */}
        {!attendanceHistory && (
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            {/* Liste des cours - Sidebar */}
            <div className="xl:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FaChalkboardTeacher />
                  Mes Cours
                  <span className="text-sm font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    {courses.length}
                  </span>
                </h2>

                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((n) => (
                      <CourseSkeleton key={n} />
                    ))}
                  </div>
                ) : courses.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FaChalkboardTeacher className="text-4xl text-gray-300 mx-auto mb-3" />
                    <p>Aucun cours assigné</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {courses.map(course => {
                      const stats = getCourseStats(course);
                      const completion = getCompletionPercentage(course);
                      
                      return (
                        <button
                          key={course.id}
                          onClick={() => {
                            setSelectedCourse(course);
                            setAttendanceHistory(null);
                          }}
                          className={`w-full text-left p-4 rounded-lg border transition-all ${
                            selectedCourse?.id === course.id
                              ? 'border-blue-500 bg-blue-50 shadow-md'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <FaClock className="text-gray-400 text-sm" />
                              <span className="font-semibold text-gray-900">
                                {course.startTime} - {course.endTime}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              {completion === 100 && (
                                <FaCheckCircle className="text-green-500 text-sm" />
                              )}
                              <span className={`text-xs font-medium ${
                                completion === 100 ? 'text-green-600' : 'text-gray-500'
                              }`}>
                                {Math.round(completion)}%
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 mb-1">
                            <FaBook className="text-gray-400 text-sm" />
                            <span className="font-medium text-gray-700">{course.subject}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 mb-3">
                            <FaBuilding className="text-gray-400 text-sm" />
                            <span className="text-sm text-gray-600">{course.className}</span>
                          </div>

                          {/* Barre de progression */}
                          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${completion}%` }}
                            ></div>
                          </div>

                          <div className="flex justify-between text-xs text-gray-600">
                            <div className="flex items-center gap-1">
                              <FaCheck className="text-green-500" />
                              <span>{stats.present}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <FaTimes className="text-red-500" />
                              <span>{stats.absent}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <FaUser className="text-gray-400" />
                              <span>{stats.notSet}</span>
                            </div>
                            <div className="text-gray-500">
                              {stats.total} total
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Détails du cours sélectionné */}
            <div className="xl:col-span-3">
              {selectedCourse ? (
                <div className="bg-white rounded-xl shadow-sm border">
                  {/* En-tête du cours */}
                  <div className="p-6 border-b">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                          {selectedCourse.subject}
                        </h2>
                        <div className="flex flex-wrap items-center gap-4 text-gray-600">
                          <div className="flex items-center gap-2">
                            <FaClock />
                            <span>{selectedCourse.startTime} - {selectedCourse.endTime}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FaBuilding />
                            <span>{selectedCourse.className}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FaUsers />
                            <span>{selectedCourse.students.length} étudiants</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {!isEditing ? (
                          <>
                            <button
                              onClick={() => fetchAttendanceHistory(selectedCourse.id)}
                              className="flex items-center gap-2 border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-colors"
                            >
                              <FaHistory />
                              Historique
                            </button>
                            <button
                              onClick={() => setIsEditing(true)}
                              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                              disabled={isLoading}
                            >
                              <FaEdit />
                              {selectedCourse.attendanceTaken ? "Modifier" : "Prendre les présences"}
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => setIsEditing(false)}
                              className="flex items-center gap-2 border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-colors"
                              disabled={isSaving}
                            >
                              Annuler
                            </button>
                            <button
                              onClick={saveAttendance}
                              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                              disabled={isSaving || getStudentsWithStatus(selectedCourse) === 0}
                            >
                              <FaSave />
                              {isSaving ? "Sauvegarde..." : `Sauvegarder (${getStudentsWithStatus(selectedCourse)}/${selectedCourse.students.length})`}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Statistiques rapides */}
                  <div className="px-6 py-4 bg-gray-50 border-b">
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-gray-700">
                          <strong>{getCourseStats(selectedCourse).present}</strong> Présents
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span className="text-gray-700">
                          <strong>{getCourseStats(selectedCourse).absent}</strong> Absents
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                        <span className="text-gray-700">
                          <strong>{getCourseStats(selectedCourse).notSet}</strong> Non renseignés
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Liste des étudiants */}
                  <div className="p-6">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Liste des étudiants
                      </h3>
                      <span className="text-sm text-gray-500">
                        {selectedCourse.students.length} étudiants
                      </span>
                    </div>

                    {isLoading ? (
                      <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <StudentSkeleton key={n} />
                        ))}
                      </div>
                    ) : (
                      <div className="grid gap-3">
                        {selectedCourse.students.map(student => (
                          <div
                            key={student.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors gap-3"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <div className="flex-shrink-0">
                                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                    <FaUser className="text-blue-600" />
                                  </div>
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900">{student.name}</div>
                                  <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <FaIdCard className="text-gray-400" />
                                    <span>{student.studentId}</span>
                                  </div>
                                  {student.date && (
                                    <div className="text-xs text-gray-400 mt-1">
                                      Dernière présence: {formatShortDate(student.date)}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                              {/* Statut de présence */}
                              {isEditing ? (
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => toggleStudentStatus(student.id)}
                                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                                        student.status === "present"
                                          ? "bg-green-100 text-green-800 border border-green-200"
                                          : student.status === "absent"
                                          ? "bg-red-100 text-red-800 border border-red-200"
                                          : "bg-gray-100 text-gray-800 border border-gray-200"
                                      }`}
                                    >
                                      {student.status === "present" ? (
                                        <>✅ Présent</>
                                      ) : student.status === "absent" ? (
                                        <>❌ Absent</>
                                      ) : (
                                        <>⚪ Non renseigné</>
                                      )}
                                    </button>

                                    {student.status && (
                                      <button
                                        onClick={() => resetStudentStatus(student.id)}
                                        className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                                        title="Réinitialiser"
                                      >
                                        ↺
                                      </button>
                                    )}
                                  </div>

                                  {/* Justification et motif (seulement si absent) */}
                                  {student.status === "absent" && (
                                    <div className="flex flex-col sm:flex-row gap-2">
                                      <button
                                        onClick={() => toggleJustification(student.id)}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium ${
                                          student.justified
                                            ? "bg-orange-100 text-orange-800 border border-orange-200"
                                            : "bg-gray-100 text-gray-800 border border-gray-200"
                                        }`}
                                      >
                                        {student.justified ? "✅ Justifié" : "❌ Non justifié"}
                                      </button>

                                      <input
                                        type="text"
                                        value={student.reason || ""}
                                        onChange={(e) => updateReason(student.id, e.target.value)}
                                        placeholder="Motif de l'absence..."
                                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[200px]"
                                      />
                                    </div>
                                  )}
                                </div>
                              ) : (
                                // Affichage seul (non édition)
                                <div className="flex items-center gap-4">
                                  <span className={`px-3 py-2 rounded-lg text-sm font-medium ${
                                    student.status === "present"
                                      ? "bg-green-100 text-green-800"
                                      : student.status === "absent"
                                      ? "bg-red-100 text-red-800"
                                      : "bg-gray-100 text-gray-800"
                                  }`}>
                                    {student.status === "present" ? "✅ Présent" : 
                                     student.status === "absent" ? "❌ Absent" : "⚪ Non renseigné"}
                                  </span>
                                  
                                  {student.status === "absent" && student.justified && (
                                    <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs">
                                      Justifié
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
                  <FaChalkboardTeacher className="text-6xl text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Sélectionnez un cours
                  </h3>
                  <p className="text-gray-500">
                    Choisissez un cours dans la liste pour gérer les présences
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}