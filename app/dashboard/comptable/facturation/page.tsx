// app/dashboard/secretaires/facturations/page.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Download, Eye, FileText, 
  CreditCard, Printer, Mail, CheckCircle, Plus,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import toast, { Toaster } from 'react-hot-toast';

// Import des bibliothèques d'export
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { utils, writeFile } from 'xlsx';

// Interfaces
interface Facture {
  id: string; 
  numero: string;
  studentName: string;
  parentName: string;
  parentEmail: string;
  filiere: string;
  vague: string;
  typePaiement: 'inscription' | 'scolarite' | 'frais_divers';
  methodePaiement: 'especes' | 'cheque' | 'virement' | 'mobile_money';
  datePaiement: string;
  montant: number;
  statut: 'generee' | 'envoyee' | 'annulee';
  semester?: string;
}

interface Student {
  id: string;
  name: string;
  email: string;
  filiere: string;
  vague: string;
}

interface Stats {
  totalFactures: number;
  totalGenerees: number;
  totalEnvoyees: number;
  totalInscriptions: number;
  totalScolarite: number;
  montantTotal: number;
}

// Composants Skeleton
const SkeletonCard = () => (
  <Card className="w-full">
    <CardHeader className="pb-3">
      <Skeleton className="h-4 w-1/2" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-6 w-3/4 mb-2" />
      <Skeleton className="h-3 w-1/2" />
    </CardContent>
  </Card>
);

const SkeletonTableRow = () => (
  <TableRow>
    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
    <TableCell><Skeleton className="h-6 w-16" /></TableCell>
    <TableCell><Skeleton className="h-8 w-24" /></TableCell>
  </TableRow>
);

const FactureSkeleton = () => (
  <div className="space-y-6">
    {/* Skeleton pour les cartes de statistiques */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>

    {/* Skeleton pour les filtres */}
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
      </CardContent>
    </Card>

    {/* Skeleton pour le tableau */}
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N° Facture</TableHead>
                <TableHead>Élève & Parent</TableHead>
                <TableHead>Filière</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Semestre</TableHead>
                <TableHead>Méthode</TableHead>
                <TableHead>Date Paiement</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(6)].map((_, index) => (
                <SkeletonTableRow key={index} />
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  </div>
);

export default function FacturationsPage() {
  const [factures, setFactures] = useState<Facture[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalFactures: 0,
    totalGenerees: 0,
    totalEnvoyees: 0,
    totalInscriptions: 0,
    totalScolarite: 0,
    montantTotal: 0
  });
  
  const [filteredFactures, setFilteredFactures] = useState<Facture[]>([]);
  const [selectedStatut, setSelectedStatut] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFacture, setSelectedFacture] = useState<Facture | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const [generateForm, setGenerateForm] = useState({
    studentId: '',
    typePaiement: 'scolarite' as 'inscription' | 'scolarite' | 'frais_divers',
    methodePaiement: 'especes' as 'especes' | 'cheque' | 'virement' | 'mobile_money',
    datePaiement: new Date().toISOString().split('T')[0],
    montant: 0,
    description: '',
    notes: '',
    semester: ''
  });

  // FONCTIONS D'EXPORT
  const exportToPDF = () => {
    if (!factures || factures.length === 0) {
      toast.error("Aucune donnée à exporter en PDF");
      return;
    }

    const toastId = toast.loading("Génération du PDF en cours...");

    setTimeout(() => {
      try {
        const doc = new jsPDF();
        
        // En-tête du document
        doc.setFontSize(20);
        doc.setTextColor(40, 40, 40);
        doc.text("Gestion des Factures - Secrétariat", 14, 15);
        
        // Informations générales
        doc.setFontSize(11);
        doc.setTextColor(100, 100, 100);
        doc.text(`Total des factures: ${stats.totalFactures}`, 14, 25);
        doc.text(`Montant total: ${formatMoney(stats.montantTotal)}`, 14, 32);
        doc.text(`Factures générées: ${stats.totalGenerees}`, 14, 39);
        doc.text(`Factures envoyées: ${stats.totalEnvoyees}`, 14, 46);
        doc.text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, 14, 53);

        // Préparation des données du tableau
        const tableData = factures.map(facture => [
          facture.numero,
          facture.studentName,
          facture.filiere,
          getTypeLabel(facture.typePaiement),
          facture.methodePaiement,
          formatMoney(facture.montant),
          new Date(facture.datePaiement).toLocaleDateString('fr-FR'),
          facture.statut === 'generee' ? 'Générée' : 
          facture.statut === 'envoyee' ? 'Envoyée' : 'Annulée'
        ]);

        // Tableau principal
        autoTable(doc, {
          head: [['N° Facture', 'Élève', 'Filière', 'Type', 'Méthode', 'Montant', 'Date', 'Statut']],
          body: tableData,
          startY: 65,
          styles: { 
            fontSize: 8,
            cellPadding: 2,
          },
          headStyles: { 
            fillColor: [59, 130, 246],
            textColor: 255,
            fontStyle: 'bold'
          },
          alternateRowStyles: {
            fillColor: [248, 250, 252]
          },
          margin: { top: 65 },
          theme: 'grid'
        });

        // Statistiques par statut
        const summaryY = (doc as any).lastAutoTable.finalY + 15;
        if (summaryY < 250) {
          doc.setFontSize(12);
          doc.setTextColor(40, 40, 40);
          doc.text("Statistiques par Statut", 14, summaryY);
          
          const statsData = [
            ['Générée', factures.filter(f => f.statut === 'generee').length.toString()],
            ['Envoyée', factures.filter(f => f.statut === 'envoyee').length.toString()],
            ['Annulée', factures.filter(f => f.statut === 'annulee').length.toString()]
          ];

          autoTable(doc, {
            body: statsData,
            startY: summaryY + 5,
            styles: { fontSize: 9 },
            columnStyles: {
              0: { fontStyle: 'bold', cellWidth: 60 },
              1: { cellWidth: 40, halign: 'center' }
            },
            head: [['Statut', 'Nombre']],
            headStyles: { 
              fillColor: [16, 185, 129],
              textColor: 255
            },
            margin: { top: 10 }
          });
        }

        // Pied de page
        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          doc.setFontSize(8);
          doc.setTextColor(150, 150, 150);
          doc.text(
            `Page ${i} / ${pageCount} - Gestion des factures secrétariat`,
            doc.internal.pageSize.width / 2,
            doc.internal.pageSize.height - 10,
            { align: 'center' }
          );
        }

        // Sauvegarde du fichier
        const fileName = `factures-secretariat-${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);
        
        toast.success("PDF généré avec succès!", {
          icon: "📄",
          id: toastId
        });
        
      } catch (error) {
        console.error("Erreur lors de l'export PDF:", error);
        toast.error("Erreur lors de la génération du PDF", {
          icon: "❌",
          id: toastId
        });
      }
    }, 2000);
  };

  const exportToExcel = () => {
    if (!factures || factures.length === 0) {
      toast.error("Aucune donnée à exporter en Excel");
      return;
    }

    const toastId = toast.loading("Export Excel en cours...");

    setTimeout(() => {
      try {
        // Préparation des données
        const data = factures.map(facture => ({
          'N° Facture': facture.numero,
          'Élève': facture.studentName,
          'Parent': facture.parentName,
          'Email Parent': facture.parentEmail,
          'Filière': facture.filiere,
          'Vague': facture.vague,
          'Type': getTypeLabel(facture.typePaiement),
          'Méthode': facture.methodePaiement,
          'Montant': facture.montant,
          'Date Paiement': new Date(facture.datePaiement).toLocaleDateString('fr-FR'),
          'Statut': facture.statut === 'generee' ? 'Générée' : 
                   facture.statut === 'envoyee' ? 'Envoyée' : 'Annulée',
          'Semestre': facture.semester || 'N/A'
        }));

        // Création du workbook
        const wb = utils.book_new();
        
        // Feuille principale
        const ws = utils.json_to_sheet(data);
        
        // En-têtes et métadonnées
        const metadata = [
          ["Gestion des Factures - Secrétariat"],
          [`Total des factures: ${stats.totalFactures}`],
          [`Montant total: ${formatMoney(stats.montantTotal)}`],
          [`Factures générées: ${stats.totalGenerees}`],
          [`Factures envoyées: ${stats.totalEnvoyees}`],
          [`Généré le: ${new Date().toLocaleDateString('fr-FR')}`],
          [] // ligne vide
        ];
        
        utils.sheet_add_aoa(ws, metadata, { origin: 'A1' });
        
        // Ajuster la largeur des colonnes
        const colWidths = [
          { wch: 15 }, // N° Facture
          { wch: 20 }, // Élève
          { wch: 15 }, // Parent
          { wch: 20 }, // Email Parent
          { wch: 15 }, // Filière
          { wch: 12 }, // Vague
          { wch: 12 }, // Type
          { wch: 12 }, // Méthode
          { wch: 15 }, // Montant
          { wch: 12 }, // Date Paiement
          { wch: 12 }, // Statut
          { wch: 12 }  // Semestre
        ];
        ws['!cols'] = colWidths;

        utils.book_append_sheet(wb, ws, 'Factures');

        // Feuille de statistiques
        const statsData = [
          { 'Statut': 'Générée', 'Nombre': factures.filter(f => f.statut === 'generee').length },
          { 'Statut': 'Envoyée', 'Nombre': factures.filter(f => f.statut === 'envoyee').length },
          { 'Statut': 'Annulée', 'Nombre': factures.filter(f => f.statut === 'annulee').length }
        ];
        
        const wsStats = utils.json_to_sheet(statsData);
        utils.book_append_sheet(wb, wsStats, 'Statistiques');

        // Sauvegarde
        const fileName = `factures-secretariat-${new Date().toISOString().split('T')[0]}.xlsx`;
        writeFile(wb, fileName);
        
        toast.success("Fichier Excel exporté!", {
          icon: "📊",
          id: toastId
        });
        
      } catch (error) {
        console.error("Erreur lors de l'export Excel:", error);
        toast.error("Erreur lors de l'export Excel", {
          icon: "❌",
          id: toastId
        });
      }
    }, 1500);
  };

  const exportToCSV = () => {
    if (!factures || factures.length === 0) {
      toast.error("Aucune donnée à exporter en CSV");
      return;
    }

    const toastId = toast.loading("Export CSV en cours...");

    setTimeout(() => {
      try {
        const headers = ['N° Facture', 'Élève', 'Parent', 'Email Parent', 'Filière', 'Vague', 'Type', 'Méthode', 'Montant', 'Date Paiement', 'Statut', 'Semestre'];
        
        const csvContent = [
          "Gestion des Factures - Secrétariat",
          `Total des factures: ${stats.totalFactures}`,
          `Montant total: ${formatMoney(stats.montantTotal)}`,
          `Généré le: ${new Date().toLocaleDateString('fr-FR')}`,
          '',
          headers.join(','),
          ...factures.map(facture => {
            return [
              `"${facture.numero}"`,
              `"${facture.studentName}"`,
              `"${facture.parentName}"`,
              `"${facture.parentEmail}"`,
              `"${facture.filiere}"`,
              `"${facture.vague}"`,
              `"${getTypeLabel(facture.typePaiement)}"`,
              `"${facture.methodePaiement}"`,
              facture.montant,
              `"${new Date(facture.datePaiement).toLocaleDateString('fr-FR')}"`,
              `"${facture.statut === 'generee' ? 'Générée' : facture.statut === 'envoyee' ? 'Envoyée' : 'Annulée'}"`,
              `"${facture.semester || 'N/A'}"`
            ].join(',');
          })
        ].join('\n');

        // Création et téléchargement du fichier
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `factures-secretariat-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success("Fichier CSV généré!", {
          icon: "📋",
          id: toastId
        });
        
      } catch (error) {
        console.error("Erreur lors de l'export CSV:", error);
        toast.error("Erreur lors de l'export CSV", {
          icon: "❌",
          id: toastId
        });
      }
    }, 1000);
  };

  const handlePrint = () => {
    toast.loading("Préparation de l'impression...");
    
    setTimeout(() => {
      window.print();
      toast.success("Document prêt pour l'impression!", {
        icon: "🖨️"
      });
    }, 1000);
  };

  // Fonctions API directes
  const fetchFactures = async (filters?: { statut?: string; type?: string; search?: string }) => {
    const params = new URLSearchParams();
    
    if (filters?.statut && filters.statut !== 'all') {
      params.append('statut', filters.statut);
    }
    
    if (filters?.type && filters.type !== 'all') {
      params.append('type', filters.type);
    }
    
    if (filters?.search) {
      params.append('search', filters.search);
    }

    const url = params.toString() ? `/api/comptable/factures?${params.toString()}` : '/api/comptable/factures';
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des factures');
    }
    
    return response.json();
  };

  const fetchStats = async () => {
    const response = await fetch('/api/comptable/factures?action=stats');
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des statistiques');
    }
    
    return response.json();
  };

  const fetchStudents = async () => {
    const response = await fetch('/api/comptable/factures?action=students');
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des étudiants');
    }
    
    return response.json();
  };

  const createFacture = async (data: any) => {
    const response = await fetch('/api/comptable/factures?action=create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la création de la facture');
    }

    return response.json();
  };

  const updateStatut = async (data: { id: string; statut: string }) => {
    const response = await fetch('/api/comptable/factures?action=update-statut', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la mise à jour de la facture');
    }

    return response.json();
  };

  // Charger toutes les données
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [facturesData, statsData, studentsData] = await Promise.all([
          fetchFactures(),
          fetchStats(),
          fetchStudents()
        ]);
        
        setFactures(facturesData);
        setStats(statsData);
        setStudents(studentsData);
      } catch (error) {
        console.error('Erreur chargement données:', error);
        toast.error('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filtrage des factures
  useEffect(() => {
    let result = factures;

    if (selectedStatut !== 'all') {
      result = result.filter(f => f.statut === selectedStatut);
    }

    if (selectedType !== 'all') {
      result = result.filter(f => f.typePaiement === selectedType);
    }

    if (searchTerm) {
      result = result.filter(f => 
        f.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.parentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.filiere.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredFactures(result);
  }, [factures, selectedStatut, selectedType, searchTerm]);

  // Fonctions utilitaires
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF'
    }).format(amount);
  };

  const getTypeLabel = (type: Facture['typePaiement']) => {
    switch (type) {
      case 'inscription': return 'Inscription';
      case 'scolarite': return 'Scolarité';
      case 'frais_divers': return 'Frais divers';
      default: return type;
    }
  };

  const getStatusBadge = (statut: Facture['statut']) => {
    const config = {
      generee: { variant: 'secondary' as const, text: 'Générée', icon: FileText },
      envoyee: { variant: 'default' as const, text: 'Envoyée', icon: CheckCircle },
      annulee: { variant: 'destructive' as const, text: 'Annulée', icon: FileText }
    };
    const { variant, text, icon: Icon } = config[statut];
    
    return (
      <Badge variant={variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {text}
      </Badge>
    );
  };

  const getTypeBadge = (type: Facture['typePaiement']) => {
    const config = {
      inscription: { variant: 'outline' as const, text: 'Inscription' },
      scolarite: { variant: 'default' as const, text: 'Scolarité' },
      frais_divers: { variant: 'secondary' as const, text: 'Frais divers' }
    };
    return <Badge variant={config[type].variant}>{config[type].text}</Badge>;
  };

  const getMethodBadge = (methode: Facture['methodePaiement']) => {
    const config = {
      especes: { variant: 'secondary' as const, text: 'Espèces' },
      cheque: { variant: 'outline' as const, text: 'Chèque' },
      virement: { variant: 'default' as const, text: 'Virement' },
      mobile_money: { variant: 'secondary' as const, text: 'Mobile Money' }
    };
    return <Badge variant={config[methode].variant}>{config[methode].text}</Badge>;
  };

  // Gestion des actions
  const handleViewDetails = (facture: Facture) => {
    setSelectedFacture(facture);
    setIsDetailModalOpen(true);
  };

  const handleSendFacture = (facture: Facture) => {
    setSelectedFacture(facture);
    setIsSendModalOpen(true);
  };

  const confirmSendFacture = async () => {
    if (!selectedFacture) return;

    try {
      await updateStatut({
        id: selectedFacture.id,
        statut: 'envoyee'
      });

      setFactures(prev => prev.map(f => 
        f.id === selectedFacture.id ? { ...f, statut: 'envoyee' } : f
      ));

      setIsSendModalOpen(false);
      setSelectedFacture(null);
      toast.success('Facture envoyée avec succès!');
    } catch (error) {
      console.error('Erreur envoi facture:', error);
      toast.error('Erreur lors de l\'envoi de la facture');
    }
  };

  const generateFacturePDF = (facture: Facture) => {
    console.log('Génération PDF pour:', facture.numero);
    toast.success(`PDF de la facture ${facture.numero} généré avec succès!`);
  };

  const handleGenerateFacture = async () => {
    if (!generateForm.studentId || !generateForm.montant || !generateForm.description) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (generateForm.typePaiement === 'scolarite' && !generateForm.semester) {
      toast.error('Veuillez sélectionner un semestre pour les frais de scolarité');
      return;
    }

    try {
      setGenerating(true);
      const newFacture = await createFacture(generateForm);
      
      setFactures(prev => [newFacture, ...prev]);
      setIsGenerateModalOpen(false);
      
      // Reset du formulaire
      setGenerateForm({
        studentId: '',
        typePaiement: 'scolarite',
        methodePaiement: 'especes',
        datePaiement: new Date().toISOString().split('T')[0],
        montant: 0,
        description: '',
        notes: '',
        semester: ''
      });
      
      toast.success('Facture générée avec succès!');
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la génération de la facture');
    } finally {
      setGenerating(false);
    }
  };

  const handleFormChange = (field: string, value: any) => {
    setGenerateForm(prev => {
      const updated = { ...prev, [field]: value };
      
      // Réinitialiser le semestre si l'élève ou le type change
      if (field === 'studentId' || field === 'typePaiement') {
        updated.semester = '';
      }
      
      return updated;
    });
  };

  const renderMethodSpecificFields = () => {
    switch (generateForm.methodePaiement) {
      case 'cheque':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="banque">Banque</Label>
              <Input 
                id="banque"
                placeholder="Nom de la banque"
                onChange={(e) => handleFormChange('banque', e.target.value)}
                className="bg-white border-gray-300"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="numeroCheque">Numéro de chèque</Label>
              <Input 
                id="numeroCheque"
                placeholder="Numéro du chèque"
                onChange={(e) => handleFormChange('numeroCheque', e.target.value)}
                className="bg-white border-gray-300"
              />
            </div>
          </>
        );
      
      case 'virement':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="banque">Banque</Label>
              <Input 
                id="banque"
                placeholder="Nom de la banque"
                onChange={(e) => handleFormChange('banque', e.target.value)}
                className="bg-white border-gray-300"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="numeroCompte">Numéro de compte</Label>
              <Input 
                id="numeroCompte"
                placeholder="Numéro de compte"
                onChange={(e) => handleFormChange('numeroCompte', e.target.value)}
                className="bg-white border-gray-300"
              />
            </div>
          </>
        );
      
      case 'mobile_money':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="operateurMobile">Opérateur</Label>
              <Select onValueChange={(value) => handleFormChange('operateurMobile', value)}>
                <SelectTrigger className="bg-white border-gray-300">
                  <SelectValue placeholder="Sélectionner un opérateur" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="orange">Orange Money</SelectItem>
                  <SelectItem value="mtn">MTN Mobile Money</SelectItem>
                  <SelectItem value="moov">Moov Money</SelectItem>
                  <SelectItem value="wave">Wave</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="numeroTelephone">Numéro de téléphone</Label>
              <Input 
                id="numeroTelephone"
                placeholder="Numéro de téléphone"
                onChange={(e) => handleFormChange('numeroTelephone', e.target.value)}
                className="bg-white border-gray-300"
              />
            </div>
          </>
        );
      
      default:
        return null;
    }
  };

  const semestreOptions = [
    'Semestre 1',
    'Semestre 2', 
    'Semestre 3',
    'Semestre 4',
    'Semestre 5',
    'Semestre 6'
  ];

  if (loading) {
    return (
      <>
        <Toaster position="top-right" />
        <div className="flex flex-col h-screen bg-gray-50 lg:pl-5 pt-20 lg:pt-6">
          <div className="flex-shrink-0 bg-white border-b border-gray-200 p-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            <FactureSkeleton />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 4000,
          },
        }}
      />
      
      <div className="flex flex-col h-screen bg-gray-50 lg:pl-5 pt-20 lg:pt-6">
        {/* Header */}
        <div className="flex-shrink-0 bg-white border-b border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Gestion des Factures</h1>
              <p className="text-gray-600 mt-1">Factures générées automatiquement après paiement</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 mt-4 sm:mt-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center justify-center">
                    <Download className="h-4 w-4 mr-2" />
                    Exporter
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-white w-48">
                  <DropdownMenuItem 
                    onClick={exportToPDF}
                    className="flex items-center cursor-pointer"
                  >
                    <span>Export PDF</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={exportToExcel}
                    className="flex items-center cursor-pointer"
                  >
                    <span>Export Excel</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={exportToCSV}
                    className="flex items-center cursor-pointer"
                  >
                    <span>Export CSV</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={handlePrint}
                    className="flex items-center cursor-pointer"
                  >
                    <Printer className="w-4 h-4 mr-2 text-gray-500" />
                    <span>Imprimer</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Button onClick={() => setIsGenerateModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Générer Facture
              </Button>
            </div>
          </div>
        </div>

        {/* Contenu scrollable */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6 max-w-7xl mx-auto">
            {/* Cartes de statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Total Factures</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{stats.totalFactures}</div>
                  <p className="text-xs text-gray-600 mt-1">factures générées</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">À Envoyer</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">{stats.totalGenerees}</div>
                  <p className="text-xs text-gray-600 mt-1">en attente d&apos;envoi</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Envoyées</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{stats.totalEnvoyees}</div>
                  <p className="text-xs text-gray-600 mt-1">factures envoyées</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Montant Total</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">
                    {formatMoney(stats.montantTotal)}
                  </div>
                  <p className="text-xs text-gray-600 mt-1">toutes factures</p>
                </CardContent>
              </Card>
            </div>

            {/* Filtres et recherche */}
            <Card>
  <CardContent className="pt-6">
    <div className="flex flex-col sm:flex-row gap-4">
      {/* Barre de recherche - pleine largeur sur mobile */}
      <div className="flex-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Rechercher par élève, parent, n° facture ou filière..."
            className="pl-10 bg-white border-gray-300 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {/* Filtres - en colonne sur mobile, en ligne sur ordi */}
      <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
        <Select value={selectedStatut} onValueChange={setSelectedStatut}>
          <SelectTrigger className="w-full sm:w-[150px] bg-white border-gray-300">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Tous statuts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous statuts</SelectItem>
            <SelectItem value="generee">Générée</SelectItem>
            <SelectItem value="envoyee">Envoyée</SelectItem>
            <SelectItem value="annulee">Annulée</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-full sm:w-[150px] bg-white border-gray-300">
            <CreditCard className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Tous types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous types</SelectItem>
            <SelectItem value="inscription">Inscription</SelectItem>
            <SelectItem value="scolarite">Scolarité</SelectItem>
            <SelectItem value="frais_divers">Frais divers</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  </CardContent>
</Card>

            {/* Tableau des factures */}
            <Card>
              <CardHeader>
                <CardTitle>Factures Générées</CardTitle>
                <CardDescription>
                  {filteredFactures.length} facture(s) trouvée(s) - Générées automatiquement après validation des paiements
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>N° Facture</TableHead>
                        <TableHead>Élève & Parent</TableHead>
                        <TableHead>Filière</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Semestre</TableHead>
                        <TableHead>Méthode</TableHead>
                        <TableHead>Date Paiement</TableHead>
                        <TableHead>Montant</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredFactures.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={10} className="text-center py-8">
                            <div className="text-gray-500">
                              Aucune facture trouvée
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredFactures.map((facture) => (
                          <TableRow key={facture.id}>
                            <TableCell className="font-mono font-medium">
                              {facture.numero}
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{facture.studentName}</div>
                                <div className="text-sm text-gray-600">{facture.parentName}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div>{facture.filiere}</div>
                                <div className="text-gray-600 text-xs">{facture.vague}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {getTypeBadge(facture.typePaiement)}
                            </TableCell>
                            <TableCell>
                              {facture.semester ? (
                                <Badge variant="secondary" className="text-xs">
                                  {facture.semester}
                                </Badge>
                              ) : (
                                <span className="text-gray-400 text-xs">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {getMethodBadge(facture.methodePaiement)}
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {new Date(facture.datePaiement).toLocaleDateString('fr-FR')}
                              </div>
                            </TableCell>
                            <TableCell className="font-semibold text-green-600">
                              {formatMoney(facture.montant)}
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(facture.statut)}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleViewDetails(facture)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => generateFacturePDF(facture)}
                                >
                                  <Printer className="h-4 w-4" />
                                </Button>

                                {facture.statut === 'generee' && (
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleSendFacture(facture)}
                                    className="text-blue-600 border-blue-200 hover:bg-blue-50"
                                  >
                                    <Mail className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Modal de génération de facture */}
        <Dialog open={isGenerateModalOpen} onOpenChange={setIsGenerateModalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
            <DialogHeader>
              <DialogTitle>Générer une Nouvelle Facture</DialogTitle>
              <DialogDescription>
                Créer une facture manuellement pour un paiement reçu
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white">
              <div className="space-y-2">
                <Label htmlFor="student" className="text-gray-700">Élève *</Label>
                <Select 
                  value={generateForm.studentId}
                  onValueChange={(value) => handleFormChange('studentId', value)}
                >
                  <SelectTrigger className="bg-white border-gray-300">
                    <SelectValue placeholder="Sélectionner un élève" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map(student => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.name} - {student.filiere}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="typePaiement" className="text-gray-700">Type de Paiement *</Label>
                <Select
                  value={generateForm.typePaiement}
                  onValueChange={(value) => handleFormChange('typePaiement', value)}
                >
                  <SelectTrigger className="border-gray-300">
                    <SelectValue placeholder="Type de paiement" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inscription">Inscription</SelectItem>
                    <SelectItem value="scolarite">Scolarité</SelectItem>
                    <SelectItem value="frais_divers">Frais divers</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Champ Semestre - seulement pour les paiements de scolarité */}
              {generateForm.typePaiement === 'scolarite' && (
                <div className="space-y-2">
                  <Label htmlFor="semester" className="text-gray-700">Semestre *</Label>
                  <Select 
                    value={generateForm.semester || ''}
                    onValueChange={(value) => handleFormChange('semester', value)}
                  >
                    <SelectTrigger className="bg-white border-gray-300">
                      <SelectValue placeholder="Sélectionner un semestre" />
                    </SelectTrigger>
                    <SelectContent>
                      {semestreOptions.map(semester => (
                        <SelectItem key={semester} value={semester}>
                          {semester}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="montant" className="text-gray-700">Montant (FCFA) *</Label>
                <Input 
                  type="number" 
                  placeholder="0"
                  value={generateForm.montant || ''}
                  onChange={(e) => handleFormChange('montant', parseInt(e.target.value) || 0)}
                  className="bg-white border-gray-300"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="methodePaiement" className="text-gray-700">Méthode de Paiement *</Label>
                <Select 
                  value={generateForm.methodePaiement}
                  onValueChange={(value) => handleFormChange('methodePaiement', value)}
                >
                  <SelectTrigger className="bg-white border-gray-300">
                    <SelectValue placeholder="Méthode de paiement" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="especes">Espèces</SelectItem>
                    <SelectItem value="cheque">Chèque</SelectItem>
                    <SelectItem value="virement">Virement</SelectItem>
                    <SelectItem value="mobile_money">Mobile Money</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="datePaiement" className="text-gray-700">Date de Paiement *</Label>
                <Input 
                  type="date" 
                  value={generateForm.datePaiement}
                  onChange={(e) => handleFormChange('datePaiement', e.target.value)}
                  className="bg-white border-gray-300"
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="description" className="text-gray-700">Description *</Label>
                <Input 
                  placeholder="Description du paiement..."
                  value={generateForm.description}
                  onChange={(e) => handleFormChange('description', e.target.value)}
                  className="bg-white border-gray-300"
                />
              </div>

              {/* Champs spécifiques selon la méthode de paiement */}
              {renderMethodSpecificFields()}

              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="notes" className="text-gray-700">Notes</Label>
                <Textarea 
                  placeholder="Informations complémentaires..."
                  value={generateForm.notes}
                  onChange={(e) => handleFormChange('notes', e.target.value)}
                  className="bg-white border-gray-300"
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter className="bg-white">
              <Button variant="outline" onClick={() => setIsGenerateModalOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleGenerateFacture} disabled={generating}>
                {generating ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                    Génération...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Générer la Facture
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de détail de facture */}
        <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
          <DialogContent className="max-w-md bg-white max-h-screen overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Détails de la Facture</DialogTitle>
            </DialogHeader>
            
            {selectedFacture && (
              <div className="space-y-4 bg-white">
                <div className="space-y-3">
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="font-medium text-gray-700">N° Facture:</span>
                    <span className="font-mono">{selectedFacture.numero}</span>
                  </div>
                  
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="font-medium text-gray-700">Élève:</span>
                    <span>{selectedFacture.studentName}</span>
                  </div>

                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="font-medium text-gray-700">Filière:</span>
                    <span>{selectedFacture.filiere}</span>
                  </div>

                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="font-medium text-gray-700">Type:</span>
                    {getTypeBadge(selectedFacture.typePaiement)}
                  </div>

                  {selectedFacture.semester && (
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="font-medium text-gray-700">Semestre:</span>
                      <Badge variant="secondary">{selectedFacture.semester}</Badge>
                    </div>
                  )}

                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="font-medium text-gray-700">Montant payé:</span>
                    <span className="font-bold text-green-600 text-lg">
                      {formatMoney(selectedFacture.montant)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="font-medium text-gray-700">Méthode:</span>
                    {getMethodBadge(selectedFacture.methodePaiement)}
                  </div>

                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="font-medium text-gray-700">Date:</span>
                    <span>{new Date(selectedFacture.datePaiement).toLocaleDateString('fr-FR')}</span>
                  </div>

                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="font-medium text-gray-700">Statut:</span>
                    {getStatusBadge(selectedFacture.statut)}
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => generateFacturePDF(selectedFacture)}
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    PDF
                  </Button>
                  {selectedFacture.statut === 'generee' && (
                    <Button 
                      onClick={() => handleSendFacture(selectedFacture)}
                      className="flex-1"
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Envoyer
                    </Button>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Modal d'envoi de facture */}
        <Dialog open={isSendModalOpen} onOpenChange={setIsSendModalOpen}>
          <DialogContent className="bg-white max-h-screen overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Envoyer la Facture</DialogTitle>
              <DialogDescription>
                Envoyer cette facture au parent par email
              </DialogDescription>
            </DialogHeader>
            
            {selectedFacture && (
              <div className="space-y-4 bg-white">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Destinataire</h4>
                  <p><strong>Parent:</strong> {selectedFacture.parentName}</p>
                  <p><strong>Email:</strong> {selectedFacture.parentEmail}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Détails de la facture</h4>
                  <p><strong>N°:</strong> {selectedFacture.numero}</p>
                  <p><strong>Montant:</strong> {formatMoney(selectedFacture.montant)}</p>
                  <p><strong>Type:</strong> {selectedFacture.typePaiement}</p>
                  {selectedFacture.semester && (
                    <p><strong>Semestre:</strong> {selectedFacture.semester}</p>
                  )}
                  <p><strong>Date:</strong> {new Date(selectedFacture.datePaiement).toLocaleDateString('fr-FR')}</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message" className="text-gray-700">Message personnalisé</Label>
                  <textarea 
                    id="message"
                    placeholder="Ajouter un message personnalisé pour le parent..."
                    rows={4}
                    className="w-full p-3 border border-gray-300 rounded-md bg-white resize-none"
                    defaultValue={`Bonjour ${selectedFacture.parentName},

Veuillez trouver ci-joint la facture n°${selectedFacture.numero} pour le paiement de ${selectedFacture.typePaiement}${selectedFacture.semester ? ` - ${selectedFacture.semester}` : ''} de ${selectedFacture.studentName}.

Montant: ${formatMoney(selectedFacture.montant)}
Date de paiement: ${new Date(selectedFacture.datePaiement).toLocaleDateString('fr-FR')}

Cordialement,
L'équipe SchoolFlow`}
                  />
                </div>
              </div>
            )}

            <DialogFooter className="bg-white">
              <Button variant="outline" onClick={() => setIsSendModalOpen(false)}>
                Annuler
              </Button>
              <Button onClick={confirmSendFacture}>
                <Mail className="h-4 w-4 mr-2" />
                Envoyer la Facture
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}