// app/student/exams/page.tsx
"use client";
import React, { useState } from 'react';
import { FaAward, FaChartLine, FaArrowDown, FaClipboardList, FaFileAlt, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';

// --- Données de simulation ---
const gradesSummary = [
    { 
        title: "Moyenne Générale", 
        value: "15.3 / 20", 
        icon: FaAward, 
        color: "text-green-600", 
        description: "Votre moyenne sur l'ensemble des matières." 
    },
    { 
        title: "Progression (Semestre)", 
        value: "+1.2 pts", 
        icon: FaChartLine, 
        color: "text-blue-600", 
        description: "Amélioration notable par rapport au semestre précédent." 
    },
    { 
        title: "Matière la plus faible", 
        value: "Anglais", 
        icon: FaArrowDown, 
        color: "text-red-600", 
        description: "Moyenne: 11.5/20. À travailler." 
    },
    { 
        title: "Prochains Évaluations", 
        value: "3", 
        icon: FaClipboardList, 
        color: "text-principal", 
        description: "Examens prévus la semaine prochaine." 
    },
];

const recentExams = [
    { 
        subject: "Mathématiques", 
        date: "15/12/2024", 
        examType: "Devoir", 
        grade: 16.0, 
        coefficient: 4,
        teacher: "M. Martin",
    },
    { 
        subject: "Physique-Chimie", 
        date: "12/12/2024", 
        examType: "Interrogation", 
        grade: 14.5, 
        coefficient: 3,
        teacher: "Mme. Dubois",
    },
    { 
        subject: "Histoire-Géo", 
        date: "10/12/2024", 
        examType: "Composition", 
        grade: 13.0, 
        coefficient: 3,
        teacher: "Mme. Bernard",
    },
    { 
        subject: "Français", 
        date: "08/12/2024", 
        examType: "Devoir", 
        grade: 15.5, 
        coefficient: 4,
        teacher: "M. Leroy",
    },
    { 
        subject: "Anglais", 
        date: "05/12/2024", 
        examType: "Interrogation", 
        grade: 11.5, 
        coefficient: 2,
        teacher: "Mme. Johnson",
    },
    { 
        subject: "SVT", 
        date: "02/12/2024", 
        examType: "Devoir", 
        grade: 17.0, 
        coefficient: 3,
        teacher: "M. Petit",
    },
];

// --- Composant Principal ---
const StudentExams = () => {
    const [sortField, setSortField] = useState("date");
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

    const handleSort = (field: string) => {
        if (sortField === field) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortDirection("desc");
        }
    };

    const getSortIcon = (field: string) => {
        if (sortField !== field) return <FaSort className="text-gray-400" />;
        return sortDirection === "asc" ? <FaSortUp className="text-blue-600" /> : <FaSortDown className="text-blue-600" />;
    };

    const getGradeColor = (grade: number) => {
        if (grade >= 16) return "text-green-600 bg-green-100";
        if (grade >= 14) return "text-blue-600 bg-blue-100";
        if (grade >= 12) return "text-yellow-600 bg-yellow-100";
        return "text-red-600 bg-red-100";
    };

    const getExamTypeColor = (examType: string) => {
        switch (examType) {
            case "Composition":
                return "bg-purple-100 text-purple-800 border-purple-200";
            case "Devoir":
                return "bg-blue-100 text-blue-800 border-blue-200";
            case "Interrogation":
                return "bg-orange-100 text-orange-800 border-orange-200";
            default:
                return "bg-gray-100 text-gray-800 border-gray-200";
        }
    };

    // Trier les examens
    const sortedGrades = [...recentExams].sort((a, b) => {
        let aValue = a[sortField as keyof typeof a];
        let bValue = b[sortField as keyof typeof b];
        
        if (sortField === "grade" || sortField === "coefficient") {
            aValue = Number(aValue);
            bValue = Number(bValue);
        } else {
            aValue = String(aValue).toLowerCase();
            bValue = String(bValue).toLowerCase();
        }

        if (sortDirection === "asc") {
            return aValue > bValue ? 1 : -1;
        } else {
            return aValue < bValue ? 1 : -1;
        }
    });

    return (
        <div className="flex-1 flex flex-col min-h-0 lg:pl-5 pt-20 lg:pt-6">
            <div className="flex-1 overflow-y-auto">
                <div className="p-6 space-y-8 bg-gray-50 min-h-full">
                    
                    {/* En-tête de la Page */}
                    <header className="pb-4 border-b border-gray-200">
                        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 flex items-center gap-3">
                            Examens & Notes
                        </h1>
                        <p className="text-gray-500 mt-1">
                            Consultez vos résultats détaillés et votre progression scolaire.
                        </p>
                    </header>

                    {/* Section Résumé des Notes */}
                    <h2 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
                        <FaChartLine className="h-6 w-6 text-gray-700" />
                        Tableau de Bord des Performances
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {gradesSummary.map((item, index) => {
                            const Icon = item.icon;
                            return (
                                <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-sm font-medium text-gray-500">{item.title}</h3>
                                        <Icon className={`h-5 w-5 ${item.color}`} />
                                    </div>
                                    <div className={`text-2xl font-bold ${item.color}`}>{item.value}</div>
                                    <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                                </div>
                            );
                        })}
                    </div>

                    {/* Section Résultats des Examens - Même design que parent/grades */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                                    <FaFileAlt className="text-blue-600" />
                                    Résultats des Examens - Premier Semestre
                                </h2>
                                <div className="text-sm text-gray-500">
                                    {sortedGrades.length} évaluation(s)
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-gray-200">
                                            <th 
                                                className="text-left py-3 px-4 font-semibold text-gray-900 cursor-pointer hover:bg-gray-50"
                                                onClick={() => handleSort("subject")}
                                            >
                                                <div className="flex items-center gap-2">
                                                    Matière
                                                    {getSortIcon("subject")}
                                                </div>
                                            </th>
                                            <th 
                                                className="text-left py-3 px-4 font-semibold text-gray-900 cursor-pointer hover:bg-gray-50"
                                                onClick={() => handleSort("grade")}
                                            >
                                                <div className="flex items-center gap-2">
                                                    Note
                                                    {getSortIcon("grade")}
                                                </div>
                                            </th>
                                            <th 
                                                className="text-left py-3 px-4 font-semibold text-gray-900 cursor-pointer hover:bg-gray-50"
                                                onClick={() => handleSort("coefficient")}
                                            >
                                                <div className="flex items-center gap-2">
                                                    Coefficient
                                                    {getSortIcon("coefficient")}
                                                </div>
                                            </th>
                                            <th 
                                                className="text-left py-3 px-4 font-semibold text-gray-900 cursor-pointer hover:bg-gray-50"
                                                onClick={() => handleSort("examType")}
                                            >
                                                <div className="flex items-center gap-2">
                                                    Type d'Examen
                                                    {getSortIcon("examType")}
                                                </div>
                                            </th>
                                            <th className="text-left py-3 px-4 font-semibold text-gray-900">Professeur</th>
                                            <th 
                                                className="text-left py-3 px-4 font-semibold text-gray-900 cursor-pointer hover:bg-gray-50"
                                                onClick={() => handleSort("date")}
                                            >
                                                <div className="flex items-center gap-2">
                                                    Date
                                                    {getSortIcon("date")}
                                                </div>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sortedGrades.map((grade, index) => (
                                            <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                                <td className="py-4 px-4 font-medium text-gray-900">{grade.subject}</td>
                                                <td className="py-4 px-4">
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${getGradeColor(grade.grade)}`}>
                                                        {grade.grade}/20
                                                    </span>
                                                </td>
                                                <td className="py-4 px-4 text-gray-700">{grade.coefficient}</td>
                                                <td className="py-4 px-4">
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getExamTypeColor(grade.examType)}`}>
                                                        {grade.examType}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-4 text-gray-700">{grade.teacher}</td>
                                                <td className="py-4 px-4 text-gray-700">{grade.date}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {sortedGrades.length === 0 && (
                                <div className="text-center py-12">
                                    <FaFileAlt className="text-5xl text-gray-300 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                        Aucun examen disponible
                                    </h3>
                                    <p className="text-gray-500">
                                        Aucun examen n'a été enregistré pour ce semestre.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentExams;