// app/teacher/attendance/page.tsx
"use client";

import React, { useState } from "react";
import { 
  FaCalendarTimes, 
  FaCheck, 
  FaTimes, 
  FaExclamationTriangle, 
  FaSort, 
  FaSortUp, 
  FaSortDown,
  FaUsers,
  FaEdit,
  FaSave,
  FaSearch,
  FaUserPlus,
  FaTrash,
  FaClock,
  FaCalendarAlt,
  FaChalkboardTeacher
} from "react-icons/fa";

export default function TeacherAttendancePage() {
  const [selectedClass, setSelectedClass] = useState("1");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSemester, setSelectedSemester] = useState("t1");
  const [selectedCourseTime, setSelectedCourseTime] = useState("");
  const [sortField, setSortField] = useState("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [newStudent, setNewStudent] = useState({ name: "", studentId: "" });

  // Données simulées des classes AVEC LES HORAIRES HEBDOMADAIRES DU PROFESSEUR
  const classesData = [
    { 
      id: "1", 
      name: "Classe A", 
      level: "6ème",
      // Le professeur a cette classe 3 fois par semaine à des horaires différents
      teacherSchedule: [
        { 
          id: "mon-08:00-10:00", 
          label: "Lundi 8h00 - 10h00", 
          subject: "Mathématiques",
          dayOfWeek: "monday",
          time: "08:00-10:00"
        },
        { 
          id: "wed-13:30-15:30", 
          label: "Mercredi 13h30 - 15h30", 
          subject: "Mathématiques",
          dayOfWeek: "wednesday", 
          time: "13:30-15:30"
        },
        { 
          id: "fri-15:45-17:45", 
          label: "Vendredi 15h45 - 17h45", 
          subject: "Soutien Mathématiques",
          dayOfWeek: "friday",
          time: "15:45-17:45"
        }
      ]
    },
    { 
      id: "2", 
      name: "Classe B", 
      level: "5ème",
      teacherSchedule: [
        { 
          id: "tue-10:15-12:15", 
          label: "Mardi 10h15 - 12h15", 
          subject: "Mathématiques",
          dayOfWeek: "tuesday",
          time: "10:15-12:15"
        },
        { 
          id: "thu-15:45-17:45", 
          label: "Jeudi 15h45 - 17h45", 
          subject: "Mathématiques",
          dayOfWeek: "thursday",
          time: "15:45-17:45"
        }
      ]
    },
    { 
      id: "3", 
      name: "Classe C", 
      level: "4ème",
      teacherSchedule: [
        { 
          id: "mon-10:15-12:15", 
          label: "Lundi 10h15 - 12h15", 
          subject: "Mathématiques",
          dayOfWeek: "monday",
          time: "10:15-12:15"
        },
        { 
          id: "fri-08:00-10:00", 
          label: "Vendredi 8h00 - 10h00", 
          subject: "Mathématiques", 
          dayOfWeek: "friday",
          time: "08:00-10:00"
        }
      ]
    },
  ];

  // Trimestres
  const semesters = [
    { id: "t1", name: "Premier Trimestre", start: "2024-09-01", end: "2024-12-20" },
    { id: "t2", name: "Deuxième Trimestre", start: "2025-01-06", end: "2025-04-05" },
    { id: "t3", name: "Troisième Trimestre", start: "2025-04-22", end: "2025-06-30" }
  ];

  // Obtenir les horaires de cours pour la classe sélectionnée
  const getCurrentClassSchedule = () => {
    const currentClass = classesData.find(c => c.id === selectedClass);
    return currentClass?.teacherSchedule || [];
  };

  // Obtenir le jour de la semaine pour une date
  const getDayOfWeek = (dateString: string) => {
    const date = new Date(dateString);
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[date.getDay()];
  };

  // Filtrer les horaires disponibles pour la date sélectionnée
  const getAvailableTimeSlots = () => {
    const currentSchedule = getCurrentClassSchedule();
    const selectedDayOfWeek = getDayOfWeek(selectedDate);
    
    // Retourner seulement les horaires qui correspondent au jour de la semaine sélectionné
    return currentSchedule.filter(schedule => 
      schedule.dayOfWeek === selectedDayOfWeek
    );
  };

  // Données simulées des étudiants
  const [studentData, setStudentData] = useState({
    "1": [
      { 
        id: 1, 
        name: "Martin Léa", 
        studentId: "STU001", 
        attendance: []
      },
      { 
        id: 2, 
        name: "Dubois Hugo", 
        studentId: "STU002", 
        attendance: []
      }
    ],
    "2": [
      { 
        id: 3, 
        name: "Garcia Manon", 
        studentId: "STU003", 
        attendance: []
      }
    ],
    "3": [
      { 
        id: 4, 
        name: "Petit Lucas", 
        studentId: "STU004", 
        attendance: []
      }
    ]
  });

  const currentClass = classesData.find(c => c.id === selectedClass);
  const currentStudents = studentData[selectedClass as keyof typeof studentData] || [];
  const availableTimeSlots = getAvailableTimeSlots();

  // Vérifier si la date sélectionnée est dans le semestre choisi
  const isDateInSelectedSemester = () => {
    const semester = semesters.find(s => s.id === selectedSemester);
    if (!semester) return false;
    return selectedDate >= semester.start && selectedDate <= semester.end;
  };

  // Obtenir le statut actuel pour la date, l'heure de cours et le semestre sélectionnés
  const getCurrentStatus = (student: any) => {
    if (!selectedCourseTime) {
      return { 
        status: "present", 
        justified: false, 
        reason: "", 
        semester: selectedSemester,
        courseTime: "",
        date: selectedDate
      };
    }

    const todayRecord = student.attendance.find((a: any) => 
      a.date === selectedDate && 
      a.courseTime === selectedCourseTime
    );
    
    if (todayRecord) {
      return todayRecord;
    }
    
    return { 
      status: "present", 
      justified: false, 
      reason: "", 
      semester: selectedSemester,
      courseTime: selectedCourseTime,
      date: selectedDate
    };
  };

  // Filtrer les étudiants selon la recherche
  const filteredStudents = currentStudents.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.studentId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Obtenir toutes les absences d'un étudiant pour le semestre sélectionné
  const getSemesterAbsences = (student: any) => {
    return student.attendance.filter((a: any) => 
      a.semester === selectedSemester && a.status === "absent"
    );
  };

  // Obtenir les absences d'un étudiant pour la matière actuelle
  const getCurrentSubjectAbsences = (student: any) => {
    if (!selectedCourseTime) return [];
    
    const currentScheduleItem = availableTimeSlots.find(s => s.id === selectedCourseTime);
    if (!currentScheduleItem) return [];
    
    return student.attendance.filter((a: any) => 
      a.semester === selectedSemester && 
      a.status === "absent" &&
      a.courseTime === selectedCourseTime
    );
  };

  // Statistiques pour le semestre sélectionné
  const attendanceStats = {
    totalStudents: currentStudents.length,
    presentToday: currentStudents.filter(student => {
      const currentStatus = getCurrentStatus(student);
      return currentStatus.status === "present";
    }).length,
    absentToday: currentStudents.filter(student => {
      const currentStatus = getCurrentStatus(student);
      return currentStatus.status === "absent";
    }).length,
    totalSemesterAbsences: currentStudents.reduce((total, student) => {
      return total + getSemesterAbsences(student).length;
    }, 0),
    currentSubjectAbsences: currentStudents.reduce((total, student) => {
      return total + getCurrentSubjectAbsences(student).length;
    }, 0)
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) return <FaSort className="text-gray-400" />;
    return sortDirection === "asc" ? <FaSortUp className="text-blue-600" /> : <FaSortDown className="text-blue-600" />;
  };

  // Trier les données
  const sortedStudents = [...filteredStudents].sort((a, b) => {
    let aValue = a[sortField as keyof typeof a];
    let bValue = b[sortField as keyof typeof b];

    if (sortField === "name") {
      aValue = String(aValue).toLowerCase();
      bValue = String(bValue).toLowerCase();
    }

    if (sortDirection === "asc") {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Fonctions de gestion des présences
  const toggleAttendance = (studentId: number) => {
    if (!isEditing || !isDateInSelectedSemester() || !selectedCourseTime) return;

    setStudentData(prev => ({
      ...prev,
      [selectedClass]: prev[selectedClass as keyof typeof prev].map(student => {
        if (student.id === studentId) {
          const currentStatus = getCurrentStatus(student);
          const newStatus = currentStatus.status === "present" ? "absent" : "present";
          
          const updatedAttendance = student.attendance.filter((a: any) => 
            !(a.date === selectedDate && a.courseTime === selectedCourseTime)
          );
          
          if (newStatus === "absent") {
            const currentScheduleItem = availableTimeSlots.find(s => s.id === selectedCourseTime);
            updatedAttendance.push({
              date: selectedDate,
              courseTime: selectedCourseTime,
              subject: currentScheduleItem?.subject || "Mathématiques",
              status: newStatus,
              justified: false,
              reason: "",
              semester: selectedSemester
            });
          }

          return {
            ...student,
            attendance: updatedAttendance
          };
        }
        return student;
      })
    }));
  };

  const toggleJustification = (studentId: number) => {
    if (!isEditing || !isDateInSelectedSemester() || !selectedCourseTime) return;

    setStudentData(prev => ({
      ...prev,
      [selectedClass]: prev[selectedClass as keyof typeof prev].map(student => {
        if (student.id === studentId) {
          const currentStatus = getCurrentStatus(student);
          if (currentStatus.status === "absent") {
            const updatedAttendance = student.attendance.filter((a: any) => 
              !(a.date === selectedDate && a.courseTime === selectedCourseTime)
            );
            updatedAttendance.push({
              ...currentStatus,
              justified: !currentStatus.justified,
              reason: !currentStatus.justified ? currentStatus.reason : ""
            });

            return {
              ...student,
              attendance: updatedAttendance
            };
          }
        }
        return student;
      })
    }));
  };

  const updateReason = (studentId: number, reason: string) => {
    if (!isEditing || !isDateInSelectedSemester() || !selectedCourseTime) return;

    setStudentData(prev => ({
      ...prev,
      [selectedClass]: prev[selectedClass as keyof typeof prev].map(student => {
        if (student.id === studentId) {
          const currentStatus = getCurrentStatus(student);
          if (currentStatus.status === "absent") {
            const updatedAttendance = student.attendance.filter((a: any) => 
              !(a.date === selectedDate && a.courseTime === selectedCourseTime)
            );
            updatedAttendance.push({
              ...currentStatus,
              reason
            });

            return {
              ...student,
              attendance: updatedAttendance
            };
          }
        }
        return student;
      })
    }));
  };

  // Fonctions d'ajout/suppression d'étudiants
  const addStudent = () => {
    if (!newStudent.name || !newStudent.studentId) {
      alert("Veuillez remplir tous les champs");
      return;
    }

    const newStudentData = {
      id: Date.now(),
      name: newStudent.name,
      studentId: newStudent.studentId,
      attendance: []
    };

    setStudentData(prev => ({
      ...prev,
      [selectedClass]: [...prev[selectedClass as keyof typeof prev], newStudentData]
    }));

    setNewStudent({ name: "", studentId: "" });
    setShowAddStudentModal(false);
  };

  const removeStudent = (studentId: number) => {
    if (!isEditing) return;
    
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet élève ?")) return;

    setStudentData(prev => ({
      ...prev,
      [selectedClass]: prev[selectedClass as keyof typeof prev].filter(student => student.id !== studentId)
    }));
  };

  // Obtenir la matière actuelle
  const getCurrentSubject = () => {
    if (!selectedCourseTime) return "Sélectionnez un horaire";
    const currentScheduleItem = availableTimeSlots.find(s => s.id === selectedCourseTime);
    return currentScheduleItem?.subject || "Mathématiques";
  };

  // Obtenir le libellé de l'horaire actuel
  const getCurrentTimeLabel = () => {
    if (!selectedCourseTime) return "";
    const currentScheduleItem = availableTimeSlots.find(s => s.id === selectedCourseTime);
    return currentScheduleItem?.label || "";
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:pl-5 pt-20 lg:pt-6">
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-7xl mx-auto">
          {/* En-tête */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Gestion des Présences
              </h1>
              <p className="text-gray-600 mt-1">
                Marquez les absences par créneau horaire et trimestre
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative">
                <FaCalendarAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setSelectedCourseTime(""); // Réinitialiser l'horaire quand la date change
                  }}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              {isEditing && (
                <button
                  onClick={() => setShowAddStudentModal(true)}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  <FaUserPlus className="text-sm" />
                  Ajouter un élève
                </button>
              )}
              
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                {isEditing ? (
                  <>
                    <FaSave className="text-sm" />
                    Sauvegarder
                  </>
                ) : (
                  <>
                    <FaEdit className="text-sm" />
                    Modifier
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Filtres */}
          <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Classe
                </label>
                <select
                  value={selectedClass}
                  onChange={(e) => {
                    setSelectedClass(e.target.value);
                    setSelectedCourseTime(""); // Réinitialiser l'horaire quand la classe change
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {classesData.map(classe => (
                    <option key={classe.id} value={classe.id}>
                      {classe.name} - {classe.level}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trimestre
                </label>
                <select
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {semesters.map(semester => (
                    <option key={semester.id} value={semester.id}>
                      {semester.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  Créneau horaire
                </label>
                <select
                  value={selectedCourseTime}
                  onChange={(e) => setSelectedCourseTime(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={availableTimeSlots.length === 0}
                >
                  <option value="">Sélectionnez un horaire</option>
                  {availableTimeSlots.map(time => (
                    <option key={time.id} value={time.id}>
                      {time.label} ({time.subject})
                    </option>
                  ))}
                </select>
                {availableTimeSlots.length === 0 && (
                  <p className="text-sm text-gray-500 mt-1">
                    Aucun cours programmé pour cette date
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rechercher un élève
                </label>
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Nom ou matricule..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Informations sur la sélection actuelle */}
            {selectedCourseTime && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 text-blue-800">
                  <FaChalkboardTeacher />
                  <span className="text-sm font-medium">
                    {currentClass?.name} - {getCurrentSubject()} - {getCurrentTimeLabel()}
                  </span>
                </div>
              </div>
            )}

            {/* Avertissement si la date n'est pas dans le semestre */}
            {!isDateInSelectedSemester() && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-800">
                  <FaExclamationTriangle />
                  <span className="text-sm font-medium">
                    La date sélectionnée n'est pas dans le trimestre choisi. 
                    Les modifications seront enregistrées pour le trimestre sélectionné.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm border p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">{attendanceStats.totalStudents}</div>
              <div className="text-sm text-gray-500">Total élèves</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{attendanceStats.presentToday}</div>
              <div className="text-sm text-gray-500">Présents</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{attendanceStats.absentToday}</div>
              <div className="text-sm text-gray-500">Absents</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{attendanceStats.currentSubjectAbsences}</div>
              <div className="text-sm text-gray-500">Absences {getCurrentSubject()}</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{attendanceStats.totalSemesterAbsences}</div>
              <div className="text-sm text-gray-500">Total absences ({selectedSemester})</div>
            </div>
          </div>

          {/* Tableau principal avec défilement */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <FaCalendarTimes />
                  Liste des élèves - {currentClass?.name}
                  <span className="text-sm font-normal text-gray-500">
                    {selectedCourseTime ? 
                      `${getCurrentSubject()} - ${getCurrentTimeLabel()} - ${semesters.find(s => s.id === selectedSemester)?.name}` 
                      : "Sélectionnez un créneau horaire"}
                  </span>
                </h2>
                <div className="text-sm text-gray-500">
                  {sortedStudents.length} élève(s)
                </div>
              </div>
            </div>

            <div className="overflow-auto max-h-[600px]">
              {!selectedCourseTime ? (
                <div className="text-center py-12">
                  <FaClock className="text-5xl text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Sélectionnez un créneau horaire
                  </h3>
                  <p className="text-gray-500">
                    Veuillez choisir un horaire de cours pour gérer les présences.
                  </p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr className="border-b border-gray-200">
                      <th 
                        className="text-left py-3 px-4 font-semibold text-gray-900 cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort("name")}
                      >
                        <div className="flex items-center gap-2">
                          Nom de l'élève
                          {getSortIcon("name")}
                        </div>
                      </th>
                      <th 
                        className="text-left py-3 px-4 font-semibold text-gray-900 cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort("studentId")}
                      >
                        <div className="flex items-center gap-2">
                          Matricule
                          {getSortIcon("studentId")}
                        </div>
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">
                        Statut ({getCurrentTimeLabel()})
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Justification</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Motif</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">
                        Absences {getCurrentSubject()}
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">
                        Total ({selectedSemester})
                      </th>
                      {isEditing && (
                        <th className="text-left py-3 px-4 font-semibold text-gray-900">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedStudents.map((student) => {
                      const currentStatus = getCurrentStatus(student);
                      const semesterAbsences = getSemesterAbsences(student);
                      const currentSubjectAbsences = getCurrentSubjectAbsences(student);
                      
                      return (
                        <tr key={student.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="py-4 px-4 font-medium text-gray-900">{student.name}</td>
                          <td className="py-4 px-4 text-gray-700">{student.studentId}</td>
                          <td className="py-4 px-4">
                            <button
                              onClick={() => toggleAttendance(student.id)}
                              disabled={!isEditing}
                              className={`flex items-center gap-2 px-3 py-1 rounded-lg font-medium transition-colors ${
                                isEditing ? "cursor-pointer hover:opacity-80" : "cursor-not-allowed opacity-60"
                              } ${
                                currentStatus.status === "present"
                                  ? "bg-green-100 text-green-800 border border-green-200"
                                  : "bg-red-100 text-red-800 border border-red-200"
                              }`}
                            >
                              {currentStatus.status === "present" ? <><FaCheck /> Présent</> : <><FaTimes /> Absent</>}
                            </button>
                          </td>
                          <td className="py-4 px-4">
                            {currentStatus.status === "absent" && (
                              <button
                                onClick={() => toggleJustification(student.id)}
                                disabled={!isEditing}
                                className={`flex items-center gap-2 px-3 py-1 rounded-lg font-medium transition-colors ${
                                  isEditing ? "cursor-pointer hover:opacity-80" : "cursor-not-allowed opacity-60"
                                } ${
                                  currentStatus.justified
                                    ? "bg-orange-100 text-orange-800 border border-orange-200"
                                    : "bg-gray-100 text-gray-800 border border-gray-200"
                                }`}
                              >
                                <FaExclamationTriangle />
                                {currentStatus.justified ? "Justifié" : "Non justifié"}
                              </button>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            {currentStatus.status === "absent" && (
                              <input
                                type="text"
                                value={currentStatus.reason}
                                onChange={(e) => updateReason(student.id, e.target.value)}
                                disabled={!isEditing}
                                placeholder="Motif de l'absence..."
                                className={`w-full px-3 py-1 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                  isEditing ? "border-gray-300 bg-white" : "border-gray-200 bg-gray-100 cursor-not-allowed"
                                }`}
                              />
                            )}
                          </td>
                          <td className="py-4 px-4">
                            <div className="text-center">
                              <span className={`px-2 py-1 rounded text-sm font-medium ${
                                currentSubjectAbsences.length === 0 
                                  ? "bg-green-100 text-green-800" 
                                  : currentSubjectAbsences.length <= 2 
                                  ? "bg-yellow-100 text-yellow-800" 
                                  : "bg-red-100 text-red-800"
                              }`}>
                                {currentSubjectAbsences.length}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="text-center">
                              <span className={`px-2 py-1 rounded text-sm font-medium ${
                                semesterAbsences.length === 0 
                                  ? "bg-blue-100 text-blue-800" 
                                  : semesterAbsences.length <= 5 
                                  ? "bg-orange-100 text-orange-800" 
                                  : "bg-red-100 text-red-800"
                              }`}>
                                {semesterAbsences.length}
                              </span>
                            </div>
                          </td>
                          {isEditing && (
                            <td className="py-4 px-4">
                              <button
                                onClick={() => removeStudent(student.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Supprimer l'élève"
                              >
                                <FaTrash className="text-sm" />
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {sortedStudents.length === 0 && selectedCourseTime && (
              <div className="text-center py-12">
                <FaUsers className="text-5xl text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Aucun élève trouvé
                </h3>
                <p className="text-gray-500">
                  Aucun élève ne correspond à votre recherche.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal d'ajout d'élève */}
      {showAddStudentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FaUserPlus className="text-green-600" />
                Ajouter un élève
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom complet
                  </label>
                  <input
                    type="text"
                    value={newStudent.name}
                    onChange={(e) => setNewStudent(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ex: Martin Léa"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Matricule
                  </label>
                  <input
                    type="text"
                    value={newStudent.studentId}
                    onChange={(e) => setNewStudent(prev => ({ ...prev, studentId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ex: STU001"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={addStudent}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  Ajouter
                </button>
                <button
                  onClick={() => setShowAddStudentModal(false)}
                  className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}