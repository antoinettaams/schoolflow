"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Interface des modules
interface ModuleMoyenne {
  module: string;
  moyenneGenerale: number;
  coefficient: number;
  semestre: string;
}

// Interface principale pour chaque étudiant
interface Student {
  id: number;
  nom: string;
  filiere: string;
  vague: string;
  semestre: string;
  modules: ModuleMoyenne[];
  moyenneGenerale?: number;
  rang?: number;
  appreciation?: string;
}

// Données de test avec semestres
const initialStudents: Student[] = [
  {
    id: 1,
    nom: "Kossi Franck",
    filiere: "Développement Web",
    vague: "Vague 1",
    semestre: "Semestre 1",
    modules: [
      { module: "HTML & CSS", moyenneGenerale: 14, coefficient: 2, semestre: "Semestre 1" },
      { module: "JavaScript", moyenneGenerale: 15, coefficient: 3, semestre: "Semestre 1" },
      { module: "React", moyenneGenerale: 13, coefficient: 4, semestre: "Semestre 1" },
    ],
  },
  {
    id: 2,
    nom: "Ahouansou Mireille",
    filiere: "Développement Web",
    vague: "Vague 2",
    semestre: "Semestre 2",
    modules: [
      { module: "HTML & CSS", moyenneGenerale: 16, coefficient: 2, semestre: "Semestre 2" },
      { module: "JavaScript", moyenneGenerale: 14, coefficient: 3, semestre: "Semestre 2" },
      { module: "React", moyenneGenerale: 15, coefficient: 4, semestre: "Semestre 2" },
    ],
  },
  {
    id: 3,
    nom: "Hounsou Kelvin",
    filiere: "Marketing Digital",
    vague: "Vague 1",
    semestre: "Semestre 1",
    modules: [
      { module: "Communication", moyenneGenerale: 12, coefficient: 3, semestre: "Semestre 1" },
      { module: "SEO", moyenneGenerale: 13, coefficient: 2, semestre: "Semestre 1" },
      { module: "Réseaux Sociaux", moyenneGenerale: 15, coefficient: 3, semestre: "Semestre 1" },
    ],
  },
  {
    id: 4,
    nom: "Doe Jane",
    filiere: "Marketing Digital",
    vague: "Vague 2",
    semestre: "Semestre 2",
    modules: [
      { module: "Communication", moyenneGenerale: 14, coefficient: 3, semestre: "Semestre 2" },
      { module: "SEO", moyenneGenerale: 16, coefficient: 2, semestre: "Semestre 2" },
      { module: "Réseaux Sociaux", moyenneGenerale: 15, coefficient: 3, semestre: "Semestre 2" },
    ],
  },
];

export default function GestionNotesCenseur() {
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [selectedFiliere, setSelectedFiliere] = useState<string>("");
  const [selectedVague, setSelectedVague] = useState<string>("");
  const [selectedSemestre, setSelectedSemestre] = useState<string>("");

  // Récupération des valeurs uniques
  const getUniqueValues = (key: keyof Student): string[] => {
    return Array.from(
      new Set(
        students
          .map((s) => (typeof s[key] === "string" ? (s[key] as string) : ""))
          .filter((v) => v !== "")
      )
    );
  };

  const filieres = getUniqueValues("filiere");
  const vagues = getUniqueValues("vague");
  const semestres = getUniqueValues("semestre");

  // Mise à jour des champs
  const handleFieldChange = (
    id: number,
    field: keyof Pick<Student, "moyenneGenerale" | "rang" | "appreciation">,
    value: string
  ) => {
    setStudents((prev) =>
      prev.map((student) =>
        student.id === id
          ? {
              ...student,
              [field]:
                field === "moyenneGenerale"
                  ? parseFloat(value)
                  : field === "rang"
                  ? parseInt(value)
                  : value,
            }
          : student
      )
    );
  };

  // Filtrage des étudiants
  const filteredStudents = students.filter(
    (student) =>
      (selectedFiliere === "" || student.filiere === selectedFiliere) &&
      (selectedVague === "" || student.vague === selectedVague) &&
      (selectedSemestre === "" || student.semestre === selectedSemestre)
  );

  return (
    <div className="p-4 lg:p-6 space-y-6 overflow-y-auto lg:pl-5 pt-20 lg:pt-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg lg:text-xl font-semibold">
            Gestion des Notes — Censeur
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Filtres Responsive */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
            {/* Filtre Filière */}
            <div className="w-full">
              <Select onValueChange={setSelectedFiliere}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filtrer par filière" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {filieres.map((filiere) => (
                    <SelectItem key={filiere} value={filiere}>
                      {filiere}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtre Vague */}
            <div className="w-full">
              <Select onValueChange={setSelectedVague}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filtrer par vague" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {vagues.map((vague) => (
                    <SelectItem key={vague} value={vague}>
                      {vague}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Nouveau Filtre Semestre */}
            <div className="w-full">
              <Select onValueChange={setSelectedSemestre}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filtrer par semestre" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {semestres.map((semestre) => (
                    <SelectItem key={semestre} value={semestre}>
                      {semestre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tableau des notes - Version Responsive */}
          <div className="overflow-x-auto rounded-lg border">
            {/* Version Desktop */}
            <div className="hidden lg:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom de l&apos;élève</TableHead>
                    <TableHead>Filière</TableHead>
                    <TableHead>Vague</TableHead>
                    <TableHead>Semestre</TableHead>
                    <TableHead>Modules & Moyennes</TableHead>
                    <TableHead>Somme Coeff</TableHead>
                    <TableHead>Moyenne Générale</TableHead>
                    <TableHead>Rang</TableHead>
                    <TableHead>Appréciation</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredStudents.map((student) => {
                    const sommeCoeff = student.modules.reduce(
                      (acc, m) => acc + m.coefficient,
                      0
                    );

                    return (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">{student.nom}</TableCell>
                        <TableCell>{student.filiere}</TableCell>
                        <TableCell>{student.vague}</TableCell>
                        <TableCell>{student.semestre}</TableCell>
                        <TableCell>
                          <ul className="list-disc pl-5 space-y-1">
                            {student.modules.map((m) => (
                              <li key={m.module} className="text-sm">
                                {m.module} :{" "}
                                <span className="font-semibold">
                                  {m.moyenneGenerale}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </TableCell>
                        <TableCell className="text-center font-medium">
                          {sommeCoeff}
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            placeholder="Moyenne"
                            value={student.moyenneGenerale ?? ""}
                            onChange={(e) =>
                              handleFieldChange(
                                student.id,
                                "moyenneGenerale",
                                e.target.value
                              )
                            }
                            className="w-24"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            placeholder="Rang"
                            value={student.rang ?? ""}
                            onChange={(e) =>
                              handleFieldChange(
                                student.id,
                                "rang",
                                e.target.value
                              )
                            }
                            className="w-20"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="text"
                            placeholder="Appréciation"
                            value={student.appreciation ?? ""}
                            onChange={(e) =>
                              handleFieldChange(
                                student.id,
                                "appreciation",
                                e.target.value
                              )
                            }
                            className="min-w-[120px]"
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Version Mobile */}
            <div className="lg:hidden">
              {filteredStudents.map((student) => {
                const sommeCoeff = student.modules.reduce(
                  (acc, m) => acc + m.coefficient,
                  0
                );

                return (
                  <Card key={student.id} className="mb-4 mx-2">
                    <CardContent className="p-4 space-y-3">
                      {/* En-tête de l'étudiant */}
                      <div className="border-b pb-2">
                        <h3 className="font-bold text-lg">{student.nom}</h3>
                        <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mt-2">
                          <div>
                            <span className="font-semibold">Filière:</span> {student.filiere}
                          </div>
                          <div>
                            <span className="font-semibold">Vague:</span> {student.vague}
                          </div>
                          <div>
                            <span className="font-semibold">Semestre:</span> {student.semestre}
                          </div>
                          <div>
                            <span className="font-semibold">Coeff Total:</span> {sommeCoeff}
                          </div>
                        </div>
                      </div>

                      {/* Modules */}
                      <div>
                        <h4 className="font-semibold mb-2">Modules:</h4>
                        <div className="space-y-1">
                          {student.modules.map((m) => (
                            <div key={m.module} className="flex justify-between text-sm">
                              <span>{m.module}</span>
                              <span className="font-semibold">{m.moyenneGenerale}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Champs éditable */}
                      <div className="space-y-3 pt-2">
                        <div>
                          <label className="text-sm font-medium mb-1 block">
                            Moyenne Générale
                          </label>
                          <Input
                            type="number"
                            placeholder="Moyenne"
                            value={student.moyenneGenerale ?? ""}
                            onChange={(e) =>
                              handleFieldChange(
                                student.id,
                                "moyenneGenerale",
                                e.target.value
                              )
                            }
                          />
                        </div>

                        <div>
                          <label className="text-sm font-medium mb-1 block">
                            Rang
                          </label>
                          <Input
                            type="number"
                            placeholder="Rang"
                            value={student.rang ?? ""}
                            onChange={(e) =>
                              handleFieldChange(
                                student.id,
                                "rang",
                                e.target.value
                              )
                            }
                          />
                        </div>

                        <div>
                          <label className="text-sm font-medium mb-1 block">
                            Appréciation
                          </label>
                          <Input
                            type="text"
                            placeholder="Appréciation"
                            value={student.appreciation ?? ""}
                            onChange={(e) =>
                              handleFieldChange(
                                student.id,
                                "appreciation",
                                e.target.value
                              )
                            }
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Bouton d'action */}
          <div className="flex justify-end">
            <Button className="mt-4 w-full md:w-auto">
              Enregistrer les moyennes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}