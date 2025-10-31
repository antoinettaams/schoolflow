"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FaSearch, FaPen } from "react-icons/fa";

// ✅ Types stricts
interface Student {
  id: string;
  firstName: string;
  lastName: string;
  filiere: string;
  vague: string;
  module: string;
  interro: number[];
  devoir: number[];
  composition: number[];
  moyenneInterro?: number;
  moyenneDevoir?: number;
  moyenneComposition?: number;
  moyenneGenerale?: number;
  role?: string;
}

// ✅ Données de démonstration
const initialStudents: Student[] = [
  {
    id: "1",
    firstName: "Jean",
    lastName: "Kouassi",
    filiere: "Développement Web",
    vague: "Vague 1",
    module: "Programmation",
    interro: [14, 16],
    devoir: [13, 15],
    composition: [17],
  },
  {
    id: "2",
    firstName: "Marie",
    lastName: "Adjaho",
    filiere: "Design UI/UX",
    vague: "Vague 2",
    module: "Design Graphique",
    interro: [12, 14],
    devoir: [15, 13],
    composition: [16],
  },
];

export default function NotesManagementPage() {
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFiliere, setSelectedFiliere] = useState("all");
  const [selectedVague, setSelectedVague] = useState("all");
  const [selectedModule, setSelectedModule] = useState("all");

  // ✅ Fonctions de filtrage
  const filteredStudents = students.filter((student) => {
    return (
      (selectedFiliere === "all" || student.filiere === selectedFiliere) &&
      (selectedVague === "all" || student.vague === selectedVague) &&
      (selectedModule === "all" || student.module === selectedModule) &&
      `${student.firstName} ${student.lastName}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
  });

  // ✅ Fonctions utilitaires
  const getUniqueValues = (key: keyof Student): string[] => {
  return Array.from(
    new Set(
      students
        .map((s) => {
          const value = s[key];
          return typeof value === "string" ? value : "";
        })
        .filter((v) => v !== "")
    )
  );
  };


  // ✅ Mise à jour des moyennes
  const handleNoteChange = (
    id: string,
    field: keyof Student,
    value: number
  ) => {
    setStudents((prev) =>
      prev.map((student) =>
        student.id === id ? { ...student, [field]: value } : student
      )
    );
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gestion des Notes</CardTitle>
          <CardDescription>
            Le censeur peut trier les élèves par filière, vague et module, puis
            saisir ou mettre à jour les moyennes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filtres */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="relative md:col-span-2">
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
              <Input
                placeholder="Rechercher un élève..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <Select value={selectedFiliere} onValueChange={setSelectedFiliere}>
              <SelectTrigger>
                <SelectValue placeholder="Filière" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les filières</SelectItem>
                {getUniqueValues("filiere").map((f) => (
                  <SelectItem key={f} value={f}>
                    {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedVague} onValueChange={setSelectedVague}>
              <SelectTrigger>
                <SelectValue placeholder="Vague" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les vagues</SelectItem>
                {getUniqueValues("vague").map((v) => (
                  <SelectItem key={v} value={v}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedModule} onValueChange={setSelectedModule}>
              <SelectTrigger>
                <SelectValue placeholder="Module" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les modules</SelectItem>
                {getUniqueValues("module").map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tableau */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Élève</TableHead>
                  <TableHead>Filière</TableHead>
                  <TableHead>Module</TableHead>
                  <TableHead>Interros</TableHead>
                  <TableHead>Moy. Interro</TableHead>
                  <TableHead>Devoirs</TableHead>
                  <TableHead>Moy. Devoir</TableHead>
                  <TableHead>Composition</TableHead>
                  <TableHead>Moy. Comp.</TableHead>
                  <TableHead>Moy. Générale</TableHead>
                  <TableHead>Rôle</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">
                      {student.firstName} {student.lastName}
                    </TableCell>
                    <TableCell>{student.filiere}</TableCell>
                    <TableCell>{student.module}</TableCell>

                    {/* Interros */}
                    <TableCell>
                      {student.interro.join(", ")}
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={student.moyenneInterro || ""}
                        onChange={(e) =>
                          handleNoteChange(
                            student.id,
                            "moyenneInterro",
                            Number(e.target.value)
                          )
                        }
                        className="w-20"
                      />
                    </TableCell>

                    {/* Devoirs */}
                    <TableCell>
                      {student.devoir.join(", ")}
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={student.moyenneDevoir || ""}
                        onChange={(e) =>
                          handleNoteChange(
                            student.id,
                            "moyenneDevoir",
                            Number(e.target.value)
                          )
                        }
                        className="w-20"
                      />
                    </TableCell>

                    {/* Composition */}
                    <TableCell>
                      {student.composition.join(", ")}
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={student.moyenneComposition || ""}
                        onChange={(e) =>
                          handleNoteChange(
                            student.id,
                            "moyenneComposition",
                            Number(e.target.value)
                          )
                        }
                        className="w-20"
                      />
                    </TableCell>

                    {/* Moyenne générale */}
                    <TableCell>
                      <Input
                        type="number"
                        value={student.moyenneGenerale || ""}
                        onChange={(e) =>
                          handleNoteChange(
                            student.id,
                            "moyenneGenerale",
                            Number(e.target.value)
                          )
                        }
                        className="w-20"
                      />
                    </TableCell>

                    {/* Rôle */}
                    <TableCell>
                      <Input
                        type="text"
                        value={student.role || ""}
                        onChange={(e) =>
                          handleNoteChange(
                            student.id,
                            "role",
                            e.target.value as unknown as number
                          )
                        }
                        className="w-28"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-end mt-6">
            <Button>
              <FaPen className="mr-2" /> Enregistrer les modifications
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
