'use client';

import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  Filter,
  PlusCircle,
  BookOpen,
  Calculator,
  List,
  Settings,
  UserPlus,
  Trash2,
  Edit,
  Save,
} from 'lucide-react';

// Définitions de types
type Session = string; // Ex: Semestre 1 (2025/2026)
type GradeType = 'Interrogation' | 'Devoir Surveillé' | 'Composition' | 'Oral';

interface Student {
  id: string;
  name: string;
  classId: string;
  session: Session;
}

interface Grade {
  id: number;
  studentId: string;
  subject: string;
  type: GradeType;
  score: number;
  maxScore: number;
  coefficient: number;
  session: Session;
  date: string;
}

interface CalculatedAverages {
  studentId: string;
  session: Session;
  classId: string;
  Interrogation: number | null;
  'Devoir Surveillé': number | null;
  Composition: number | null;
  Oral: number | null;
  GeneralAverage: number | null;
}

// Données Mocks de l'enseignant
const teacherData = {
  id: 1,
  name: 'M. Lefevre',
  classes: ['6ème A', 'Terminale C', 'Première S'],
};

// Données Initiales
const initialStudents: Student[] = [
  { id: 's1', name: 'Alice K.', classId: '6ème A', session: 'Semestre 1 (2025/2026)' },
  { id: 's2', name: 'Bernard D.', classId: '6ème A', session: 'Semestre 1 (2025/2026)' },
  { id: 's3', name: 'Cécile T.', classId: 'Terminale C', session: 'Semestre 2 (2025/2026)' },
];

const initialGrades: Grade[] = [
  { id: 1, studentId: 's1', subject: 'Mathématiques', type: 'Interrogation', score: 15, maxScore: 20, coefficient: 1, session: 'Semestre 1 (2025/2026)', date: '2025-09-15' },
  { id: 5, studentId: 's1', subject: 'Mathématiques', type: 'Devoir Surveillé', score: 12, maxScore: 20, coefficient: 3, session: 'Semestre 1 (2025/2026)', date: '2025-10-01' },
  { id: 10, studentId: 's1', subject: 'Mathématiques', type: 'Interrogation', score: 18, maxScore: 20, coefficient: 1, session: 'Semestre 1 (2025/2026)', date: '2025-10-10' },
  { id: 2, studentId: 's2', subject: 'Mathématiques', type: 'Interrogation', score: 13, maxScore: 20, coefficient: 1, session: 'Semestre 1 (2025/2026)', date: '2025-09-15' },
  { id: 7, studentId: 's2', subject: 'Mathématiques', type: 'Devoir Surveillé', score: 10, maxScore: 20, coefficient: 3, session: 'Semestre 1 (2025/2026)', date: '2025-10-01' },
  { id: 8, studentId: 's2', subject: 'Mathématiques', type: 'Composition', score: 8, maxScore: 20, coefficient: 5, session: 'Semestre 1 (2025/2026)', date: '2025-10-25' },
  { id: 3, studentId: 's3', subject: 'Physique', type: 'Composition', score: 17, maxScore: 20, coefficient: 4, session: 'Semestre 2 (2025/2026)', date: '2026-03-20' },
];

const initialSessions: Session[] = ['Semestre 1 (2025/2026)', 'Semestre 2 (2025/2026)'];
const allGradeTypes: GradeType[] = ['Interrogation', 'Devoir Surveillé', 'Composition', 'Oral'];

const StudentGradesDetail: React.FC<{ studentId: string; studentName: string }> = ({ studentId, studentName }) => {
  const [grades, setGrades] = useState<Grade[]>(initialGrades);
  const [gradeFilters, setGradeFilters] = useState({
    session: initialSessions[0] || '',
    className: teacherData.classes[0] || '',
    type: '' as GradeType | '',
  });

  const studentGrades = grades.filter(
    (g) => g.studentId === studentId && g.session === gradeFilters.session
  );

  const handleDeleteGrade = (gradeId: number) => {
    if (confirm(`Supprimer cette note pour ${studentName} ?`)) {
      setGrades((prev) => prev.filter((g) => g.id !== gradeId));
    }
  };

  return (
    <div className="bg-gray-50 p-4 border-t border-gray-200 lg:pl-5 pt-20 lg:pt-6">
      <h3 className="text-md font-semibold text-gray-700 mb-2">Détails des notes - {studentName}</h3>
      {studentGrades.length > 0 ? (
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-2 text-left">Matière</th>
              <th className="p-2 text-center">Type</th>
              <th className="p-2 text-center">Note</th>
              <th className="p-2 text-center">Coefficient</th>
              <th className="p-2 text-center">Date</th>
              <th className="p-2 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {studentGrades.map((grade) => (
              <tr key={grade.id} className="border-b">
                <td className="p-2">{grade.subject}</td>
                <td className="p-2 text-center">{grade.type}</td>
                <td className="p-2 text-center">
                  {grade.score}/{grade.maxScore}
                </td>
                <td className="p-2 text-center">{grade.coefficient}</td>
                <td className="p-2 text-center">{new Date(grade.date).toLocaleDateString('fr-FR')}</td>
                <td className="p-2 text-center">
                  <button
                    onClick={() => handleDeleteGrade(grade.id)}
                    className="text-red-500 hover:text-red-700"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-gray-500 text-center py-4">Aucune note pour cette session.</p>
      )}
    </div>
  );
};

const GradeModal: React.FC<{
  show: boolean;
  onClose: () => void;
  onAddGrade: (grade: Omit<Grade, 'id'>) => void;
  students: Student[];
  sessions: Session[];
}> = ({ show, onClose, onAddGrade, students, sessions }) => {
  const [newGrade, setNewGrade] = useState<Omit<Grade, 'id'>>({
    studentId: students.length > 0 ? students[0].id : '',
    subject: '',
    type: allGradeTypes[0],
    score: 0,
    maxScore: 20,
    coefficient: 1,
    session: sessions[0] || '',
    date: new Date().toISOString().substring(0, 10),
  });

  const handleSubmit = () => {
    if (!newGrade.subject || !newGrade.studentId || !newGrade.session) {
      alert('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    if (newGrade.score < 0 || newGrade.score > newGrade.maxScore) {
      alert(`La note doit être entre 0 et ${newGrade.maxScore}.`);
      return;
    }
    onAddGrade(newGrade);
    setNewGrade({
      studentId: students.length > 0 ? students[0].id : '',
      subject: '',
      type: allGradeTypes[0],
      score: 0,
      maxScore: 20,
      coefficient: 1,
      session: sessions[0] || '',
      date: new Date().toISOString().substring(0, 10),
    });
    onClose();
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-6 max-w-lg w-full shadow-2xl max-h-[80vh] overflow-y-auto custom-scrollbar">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <PlusCircle className="w-5 h-5 text-green-600" /> Saisie de Note
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Élève</label>
            <select
              value={newGrade.studentId}
              onChange={(e) => setNewGrade((prev) => ({ ...prev, studentId: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.classId}, {s.session})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Matière</label>
            <input
              type="text"
              value={newGrade.subject}
              onChange={(e) => setNewGrade((prev) => ({ ...prev, subject: e.target.value }))}
              placeholder="Ex: Mathématiques"
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={newGrade.type}
              onChange={(e) => setNewGrade((prev) => ({ ...prev, type: e.target.value as GradeType }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              {allGradeTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
              <input
                type="number"
                value={newGrade.score}
                onChange={(e) => setNewGrade((prev) => ({ ...prev, score: parseFloat(e.target.value) }))}
                placeholder="Note sur 20"
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Note maximale</label>
              <input
                type="number"
                value={newGrade.maxScore}
                onChange={(e) => setNewGrade((prev) => ({ ...prev, maxScore: parseInt(e.target.value) }))}
                placeholder="Ex: 20"
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Coefficient</label>
            <input
              type="number"
              value={newGrade.coefficient}
              onChange={(e) => setだけでNewGrade((prev) => ({ ...prev, coefficient: parseInt(e.target.value) }))}
              placeholder="Ex: 1"
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Session</label>
            <select
              value={newGrade.session}
              onChange={(e) => setNewGrade((prev) => ({ ...prev, session: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              {sessions.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={newGrade.date}
              onChange={(e) => setNewGrade((prev) => ({ ...prev, date: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSubmit}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700"
            >
              Enregistrer la note
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-500 text-white py-3 rounded-lg font-semibold hover:bg-gray-600"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const TeacherDashboardPage = () => {
  const [activeTab, setActiveTab] = useState<'grades' | 'calculation' | 'config'>('grades');
  const [grades, setGrades] = useState<Grade[]>(initialGrades);
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [sessions, setSessions] = useState<Session[]>(initialSessions);
  const [calculatedAverages, setCalculatedAverages] = useState<CalculatedAverages[]>([]);
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const [gradeFilters, setGradeFilters] = useState({
    session: initialSessions[0] || '',
    className: teacherData.classes[0] || '',
    type: '' as GradeType | '',
  });

  const [showAddGrade, setShowAddGrade] = useState(false);
  const [newGrade, setNewGrade] = useState<Omit<Grade, 'id'>>({
    studentId: initialStudents.length > 0 ? initialStudents[0].id : '',
    subject: '',
    type: allGradeTypes[0],
    score: 0,
    maxScore: 20,
    coefficient: 1,
    session: initialSessions[0] || '',
    date: new Date().toISOString().substring(0, 10),
  });

  const [newStudentConfig, setNewStudentConfig] = useState({
    name: '',
    classId: teacherData.classes[0] || '',
    session: initialSessions[0] || '',
  });

  const handleAddStudentAndSession = () => {
    const { name, classId, session } = newStudentConfig;
    if (!name.trim() || !classId || !session) {
      alert('Veuillez remplir tous les champs (nom, classe, session).');
      return;
    }

    // Ajouter la session si elle n'existe pas
    if (!sessions.includes(session)) {
      setSessions((prev) => [...prev, session].sort());
    }

    // Ajouter l'élève
    const newStudent: Student = {
      id: `s${Date.now()}`,
      name: name.trim(),
      classId,
      session,
    };
    setStudents((prev) => [...prev, newStudent]);
    setNewStudentConfig({
      name: '',
      classId: teacherData.classes[0] || '',
      session: initialSessions[0] || '',
    });
    alert(`L'élève ${newStudent.name} a été ajouté à ${classId} pour ${session}.`);
  };

  const handleDeleteSession = (name: string) => {
    if (grades.some((g) => g.session === name)) {
      alert('Impossible de supprimer cette session, car elle contient déjà des notes.');
      return;
    }
    setSessions((prev) => prev.filter((t) => t !== name));
    if (gradeFilters.session === name) {
      setGradeFilters((prev) => ({ ...prev, session: sessions.filter((t) => t !== name)[0] || '' }));
    }
  };

  const calculateInternalAverage = useCallback(
    (studentId: string, subject?: string, session: Session | '' = gradeFilters.session, type: GradeType | '' = gradeFilters.type) => {
      const relevantGrades = grades.filter(
        (g) =>
          g.studentId === studentId &&
          (session === '' || g.session === session) &&
          (type === '' || g.type === type) &&
          (!subject || g.subject === subject)
      );

      if (relevantGrades.length === 0) return 'N/A';

      const totalWeightedScore = relevantGrades.reduce((sum, g) => sum + (g.score / g.maxScore) * 20 * g.coefficient, 0);
      const totalCoefficient = relevantGrades.reduce((sum, g) => sum + g.coefficient, 0);

      return totalCoefficient > 0 ? (totalWeightedScore / totalCoefficient).toFixed(2) : 'N/A';
    },
    [grades, gradeFilters.session, gradeFilters.type]
  );

  const countGradesByType = useCallback(
    (studentId: string, type: GradeType) => {
      return grades.filter((g) => g.studentId === studentId && g.session === gradeFilters.session && g.type === type).length;
    },
    [grades, gradeFilters.session]
  );

  const filteredStudentsForGrades = useMemo(() => {
    return students.filter((s) => s.classId === gradeFilters.className && s.session === gradeFilters.session);
  }, [students, gradeFilters.className, gradeFilters.session]);

  const getStudentGrades = useCallback(
    (studentId: string) => {
      return grades
        .filter((g) => g.studentId === studentId && g.session === gradeFilters.session)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    },
    [grades, gradeFilters.session]
  );

  const uniqueSubjects = useMemo(() => {
    const classGrades = grades.filter((g) => filteredStudentsForGrades.some((s) => s.id === g.studentId) && g.session === gradeFilters.session);
    return Array.from(new Set(classGrades.map((g) => g.subject))).sort();
  }, [grades, filteredStudentsForGrades, gradeFilters.session]);

  const getOrCreateAverages = useCallback(
    (studentId: string) => {
      const existing = calculatedAverages.find((a) => a.studentId === studentId && a.session === gradeFilters.session);
      if (existing) return existing;

      const student = students.find((s) => s.id === studentId);
      return {
        studentId,
        session: gradeFilters.session,
        classId: student?.classId || gradeFilters.className,
        Interrogation: null,
        'Devoir Surveillé': null,
        Composition: null,
        Oral: null,
        GeneralAverage: null,
      };
    },
    [calculatedAverages, gradeFilters.session, gradeFilters.className, students]
  );

  const handleAverageChange = (studentId: string, type: GradeType | 'GeneralAverage', value: string) => {
    const numValue = value === '' ? null : Math.min(20, Math.max(0, parseFloat(value)));

    setCalculatedAverages((prev) => {
      const newAverages = prev.filter((a) => !(a.studentId === studentId && a.session === gradeFilters.session));
      const existing = getOrCreateAverages(studentId);

      return [...newAverages, { ...existing, [type]: numValue }];
    });
  };

  const handleSaveAverages = async () => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      alert('Moyennes sauvegardées avec succès !');
    } catch (error) {
      alert('Erreur lors de la sauvegarde des moyennes.');
    }
  };

  const handleAddGrade = (grade: Omit<Grade, 'id'>) => {
    setGrades((prev) => [...prev, { ...grade, id: Date.now() }]);
    alert('Note ajoutée avec succès !');
  };

  const scrollToBottom = () => {
    if (contentRef.current) {
      contentRef.current.scrollTo({
        top: contentRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div ref={contentRef} className="h-screen overflow-y-auto bg-gray-50 p-4 sm:p-6 lg:p-8 custom-scrollbar">
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Tableau de Bord Enseignant 🧑‍🏫
            </h1>
            <p className="text-gray-600">Bienvenue, {teacherData.name}. Gérez vos notes, calculs et configuration.</p>
          </div>
        </div>

        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('grades')}
            className={`px-4 py-2 text-lg font-medium transition-colors ${
              activeTab === 'grades' ? 'border-b-4 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <BookOpen className="w-5 h-5 inline mr-2" /> Saisie des Notes
          </button>
          <button
            onClick={() => setActiveTab('calculation')}
            className={`px-4 py-2 text-lg font-medium transition-colors ${
              activeTab === 'calculation' ? 'border-b-4 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Calculator className="w-5 h-5 inline mr-2" /> Calcul & Synthèse
          </button>
          <button
            onClick={() => setActiveTab('config')}
            className={`px-4 py-2 text-lg font-medium transition-colors ${
              activeTab === 'config' ? 'border-b-4 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Settings className="w-5 h-5 inline mr-2" /> Configuration
          </button>
        </div>

        {activeTab === 'config' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Settings className="w-6 h-6 text-blue-600" /> Gestion des Données
            </h2>

            <div className="bg-white shadow-md rounded-xl p-6 border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-green-600" /> Ajouter un Élève et Session
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l'élève</label>
                  <input
                    type="text"
                    value={newStudentConfig.name}
                    onChange={(e) => setNewStudentConfig((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Jean Dupont"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Classe</label>
                  <select
                    value={newStudentConfig.classId}
                    onChange={(e) => setNewStudentConfig((prev) => ({ ...prev, classId: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    {teacherData.classes.map((cls) => (
                      <option key={cls} value={cls}>
                        {cls}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Session</label>
                  <input
                    type="text"
                    value={newStudentConfig.session}
                    onChange={(e) => setNewStudentConfig((prev) => ({ ...prev, session: e.target.value }))}
                    placeholder="Ex: Semestre 1 (2025/2026)"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                <button
                  onClick={handleAddStudentAndSession}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-5 h-5" /> Ajouter Élève et Session
                </button>
              </div>
            </div>

            <div className="bg-white shadow-md rounded-xl p-6 border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Sessions Actuelles</h3>
              <div className="flex flex-wrap gap-3">
                {sessions.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 border border-purple-300"
                  >
                    {t}
                    <button
                      onClick={() => handleDeleteSession(t)}
                      className="text-purple-600 hover:text-purple-800 ml-1"
                      title="Supprimer la session"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {(activeTab === 'grades' || activeTab === 'calculation') && (
          <div className="space-y-6">
            <div className="bg-white shadow-md rounded-xl p-5 border border-gray-200 sticky top-0 z-20">
              <h2 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" /> Filtres
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <select
                  value={gradeFilters.className}
                  onChange={(e) => {
                    setGradeFilters((prev) => ({ ...prev, className: e.target.value }));
                    setExpandedStudentId(null);
                  }}
                  className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500"
                >
                  {teacherData.classes.map((cls) => (
                    <option key={cls} value={cls}>
                      {cls}
                    </option>
                  ))}
                </select>
                <select
                  value={gradeFilters.session}
                  onChange={(e) => {
                    setGradeFilters((prev) => ({ ...prev, session: e.target.value }));
                    setExpandedStudentId(null);
                  }}
                  className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500"
                >
                  {sessions.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <select
                  value={gradeFilters.type}
                  onChange={(e) => setGradeFilters((prev) => ({ ...prev, type: e.target.value as GradeType }))}
                  className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500"
                  disabled={activeTab === 'calculation'}
                >
                  <option value="">Tous les types</option>
                  {allGradeTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {activeTab === 'grades' && (
              <div className="space-y-4">
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowAddGrade(true)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                  >
                    <PlusCircle className="w-4 h-4" /> Enregistrer une Note
                  </button>
                </div>

                <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">
                    Synthèse des notes pour la saisie ({gradeFilters.session})
                  </h2>
                  <div className="max-h-[60vh] overflow-y-auto border rounded-md custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                      <thead className="sticky top-0 bg-gray-100 z-10 shadow-sm">
                        <tr className="border-b">
                          <th className="p-3 text-sm font-medium">Étudiant</th>
                          {uniqueSubjects.map((s) => (
                            <th key={s} className="p-3 text-sm font-medium text-center">
                              {s} (Moy. Interne)
                            </th>
                          ))}
                          <th className="p-3 text-sm font-medium text-center">Moyenne Générale Interne</th>
                          <th className="p-3 text-sm font-medium text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStudentsForGrades.map((student) => (
                          <React.Fragment key={student.id}>
                            <tr className="border-b hover:bg-gray-50">
                              <td className="p-3 font-medium text-gray-900">{student.name}</td>
                              {uniqueSubjects.map((s) => (
                                <td key={s} className="p-3 text-center text-sm font-semibold text-blue-600">
                                  {calculateInternalAverage(student.id, s, gradeFilters.session, gradeFilters.type)}
                                </td>
                              ))}
                              <td className="p-3 text-center font-bold text-lg text-indigo-700">
                                {calculateInternalAverage(student.id, undefined, gradeFilters.session, '')}
                              </td>
                              <td className="p-3 text-right">
                                <button
                                  onClick={() => setExpandedStudentId(student.id === expandedStudentId ? null : student.id)}
                                  className="text-sm text-blue-500 hover:text-blue-700 flex items-center justify-end w-full"
                                >
                                  {student.id === expandedStudentId ? 'Masquer' : 'Détails Notes'}
                                  <List className="w-4 h-4 ml-1" />
                                </button>
                              </td>
                            </tr>
                            {student.id === expandedStudentId && (
                              <tr>
                                <td colSpan={uniqueSubjects.length + 3} className="p-0">
                                  <StudentGradesDetail studentId={student.id} studentName={student.name} />
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                    {filteredStudentsForGrades.length === 0 && (
                      <div className="p-6 text-center text-gray-500">Aucun élève trouvé dans cette classe.</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'calculation' && (
              <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Edit className="w-5 h-5 text-red-600" /> Saisie des Moyennes Finales (sur 20)
                </h2>
                <p className="text-sm text-gray-500 mb-4">
                  Saisissez les moyennes pour chaque type de note et la Moyenne Générale de la Session **{gradeFilters.session}** pour la classe **{gradeFilters.className}**.
                </p>
                <div className="max-h-[70vh] overflow-y-auto border rounded-md custom-scrollbar">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-gray-100 z-10 shadow-sm">
                      <tr className="border-b">
                        <th className="p-3 text-sm font-medium sticky left-0 bg-gray-100 z-20">Étudiant</th>
                        {allGradeTypes.map((type) => (
                          <React.Fragment key={type}>
                            <th colSpan={2} className="p-3 text-sm font-medium text-center">
                              {type}
                            </th>
                          </React.Fragment>
                        ))}
                        <th className="p-3 text-sm font-medium text-center font-bold text-indigo-700">Moyenne Générale</th>
                      </tr>
                      <tr className="border-b">
                        <th className="p-3 text-sm font-medium sticky left-0 bg-gray-100 z-20"></th>
                        {allGradeTypes.map((type) => (
                          <React.Fragment key={type}>
                            <th className="p-3 text-sm font-medium text-center">Notes</th>
                            <th className="p-3 text-sm font-medium text-center">Moy.</th>
                          </React.Fragment>
                        ))}
                        <th className="p-3 text-sm font-medium text-center"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudentsForGrades.map((student) => {
                        const averages = getOrCreateAverages(student.id);
                        const studentGrades = grades.filter((g) => g.studentId === student.id && g.session === gradeFilters.session);

                        return (
                          <tr key={student.id} className="border-b hover:bg-gray-50">
                            <td className="p-3 font-medium text-gray-900 sticky left-0 bg-white hover:bg-gray-50 z-20">{student.name}</td>
                            {allGradeTypes.map((type) => {
                              const relevantGrades = studentGrades.filter((g) => g.type === type);
                              const gradeCount = countGradesByType(student.id, type);
                              const internalAvg = calculateInternalAverage(student.id, undefined, gradeFilters.session, type).toString().replace('N/A', '-');

                              return (
                                <React.Fragment key={type}>
                                  <td className="p-1 text-center">
                                    <div className="flex flex-col items-center">
                                      {relevantGrades.map((grade, index) => (
                                        <span key={index} className="text-xs text-gray-600">
                                          {grade.score}/{grade.maxScore} (coef. {grade.coefficient})
                                        </span>
                                      ))}
                                      {gradeCount === 0 && <span className="text-xs text-gray-500">-</span>}
                                    </div>
                                  </td>
                                  <td className="p-1 text-center">
                                    <div className="flex flex-col items-center">
                                      <span className="text-xs text-gray-500 mb-1">
                                        ({gradeCount} notes, Moy. interne: {internalAvg})
                                      </span>
                                      <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max="20"
                                        value={averages[type] !== null ? averages[type]!.toFixed(2) : ''}
                                        onChange={(e) => handleAverageChange(student.id, type, e.target.value)}
                                        placeholder="Saisir /20"
                                        className="w-24 text-center border border-gray-300 rounded-md py-1 px-2 text-sm font-semibold focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                      />
                                    </div>
                                  </td>
                                </React.Fragment>
                              );
                            })}
                            <td className="p-1 text-center font-bold">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                max="20"
                                value={averages.GeneralAverage !== null ? averages.GeneralAverage!.toFixed(2) : ''}
                                onChange={(e) => handleAverageChange(student.id, 'GeneralAverage', e.target.value)}
                                placeholder={calculateInternalAverage(student.id, undefined, gradeFilters.session, '').toString().replace('N/A', 'Saisir')}
                                className="w-24 text-center border-2 border-indigo-500 rounded-md py-1 px-2 text-lg font-bold shadow-sm"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {filteredStudentsForGrades.length === 0 && (
                    <div className="p-6 text-center text-gray-500">Aucun élève trouvé dans cette classe pour la saisie des moyennes.</div>
                  )}
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={handleSaveAverages}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" /> Sauvegarder les moyennes
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <GradeModal
          show={showAddGrade}
          onClose={() => setShowAddGrade(false)}
          onAddGrade={handleAddGrade}
          students={students}
          sessions={sessions}
        />
      </div>
    </div>
  );
};

export default TeacherDashboardPage;