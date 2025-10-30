"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Search, Filter, Download, Upload, MoreHorizontal, FileText, Image, File } from "lucide-react";

interface Document {
  id: string;
  nom: string;
  type: "pdf" | "word" | "excel" | "image";
  taille: string;
  dateUpload: string; 
  uploadPar: string;
  categorie: "administration" | "pedagogique" | "financier" | "divers";
  statut: "public" | "prive" | "archive";
}

export default function DocumentsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [documents] = useState<Document[]>([
    {
      id: "DOC-001",
      nom: "Règlement intérieur 2024",
      type: "pdf",
      taille: "2.4 MB",
      dateUpload: "2024-01-10",
      uploadPar: "Jean Martin",
      categorie: "administration",
      statut: "public"
    },
    {
      id: "DOC-002",
      nom: "Liste des élèves",
      type: "excel",
      taille: "1.2 MB",
      dateUpload: "2024-01-12",
      uploadPar: "Marie Dubois",
      categorie: "administration",
      statut: "prive"
    },
  ]);

  const getTypeIcon = (type: string) => {
    const icons = {
      pdf: FileText,
      word: File,
      excel: File,
      image: Image
    };
    const Icon = icons[type as keyof typeof icons];
    return <Icon className="w-4 h-4" />;
  };

  const getTypeColor = (type: string) => {
    const colors = {
      pdf: "text-red-600 bg-red-50",
      word: "text-blue-600 bg-blue-50",
      excel: "text-green-600 bg-green-50",
      image: "text-purple-600 bg-purple-50"
    };
    return colors[type as keyof typeof colors];
  };

 const getCategorieBadge = (categorie: string) => {
  const categories = {
    administration: { label: "Administration", variant: "default" as const },
    pedagogique: { label: "Pédagogique", variant: "secondary" as const },
    financier: { label: "Financier", variant: "outline" as const },
    divers: { label: "Divers", variant: "destructive" as const } // Remplace "success" par "destructive"
  };
  
  const config = categories[categorie as keyof typeof categories] || categories.divers;
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Documents</h1>
          <p className="text-gray-600 mt-2">
            Gérez tous les documents de l&apos;établissement
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Télécharger
          </Button>
          <Button className="bg-principal hover:bg-principal/90">
            <Upload className="w-4 h-4 mr-2" />
            Uploader
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
            <FileText className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documents.length}</div>
            <p className="text-xs text-gray-600">+2 ce mois</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">PDF</CardTitle>
            <FileText className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {documents.filter(d => d.type === "pdf").length}
            </div>
            <p className="text-xs text-gray-600">Documents</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Public</CardTitle>
            <FileText className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {documents.filter(d => d.statut === "public").length}
            </div>
            <p className="text-xs text-gray-600">Documents accessibles</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Espace utilisé</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156 MB</div>
            <p className="text-xs text-gray-600">Sur 2 GB</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
          <CardDescription>
            {documents.length} document(s) trouvé(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Rechercher un document..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Filter className="w-4 h-4 mr-2" />
                  Filtres
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>Tous les types</DropdownMenuItem>
                <DropdownMenuItem>PDF</DropdownMenuItem>
                <DropdownMenuItem>Word</DropdownMenuItem>
                <DropdownMenuItem>Excel</DropdownMenuItem>
                <DropdownMenuItem>Images</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom du document</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Taille</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Date d&apos;upload</TableHead>
                <TableHead>Uploadé par</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((document) => (
                <TableRow key={document.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(document.type)}
                      {document.nom}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getTypeColor(document.type)}>
                      {document.type.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>{document.taille}</TableCell>
                  <TableCell>
                    {getCategorieBadge(document.categorie)}
                  </TableCell>
                  <TableCell>
                    {new Date(document.dateUpload).toLocaleDateString('fr-FR')}
                  </TableCell>
                  <TableCell>{document.uploadPar}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="flex items-center gap-2">
                          <Download className="w-4 h-4" />
                          Télécharger
                        </DropdownMenuItem>
                        <DropdownMenuItem>Modifier</DropdownMenuItem>
                        <DropdownMenuItem>Partager</DropdownMenuItem>
                        <DropdownMenuItem>Archiver</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}