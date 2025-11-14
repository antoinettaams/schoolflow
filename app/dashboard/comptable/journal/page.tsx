"use client";
import React, { useState, useEffect } from 'react';
import { 
  Filter, Download, RefreshCw,
  Eye, Users, GraduationCap, CreditCard,
  FileText, Table, FileDown, CheckCircle, XCircle, AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table as UITable, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import toast from 'react-hot-toast';

// Types définis localement
interface OperationAutomatique {
  id: string;
  numero: string;
  date: string;
  type: 'inscription_eleve' | 'paiement_scolarite' | 'paiement_inscription';
  studentId?: string;
  studentName?: string;
  parentName?: string;
  filiere?: string;
  vague?: string;
  compteDebit: string;
  compteCredit: string;
  libelle: string;
  montant: number;
  reference: string;
  statut: 'comptabilise' | 'annule';
  modePaiement?: 'especes' | 'cheque' | 'virement' | 'mobile_money' | 'carte';
  source: 'paiement_auto' | 'inscription_auto';
  dateComptabilisation: string;
  notes?: string;
}

interface JournalFilters {
  dateDebut: string;
  dateFin: string;
  type: string;
  search: string;
}

interface ExportMetadata {
  title: string;
  generatedAt: string;
  totalOperations: number;
  totalMontant: number;
  filters: {
    periode: string;
    type: string;
    search: string;
  };
}

// Service API intégré
class JournalService {
  private static readonly API_URL = '/api/comptable/journal';

  static async getOperations(filters: JournalFilters) {
    const params = new URLSearchParams();
    
    if (filters.dateDebut) params.append('dateDebut', filters.dateDebut);
    if (filters.dateFin) params.append('dateFin', filters.dateFin);
    if (filters.type && filters.type !== 'all') params.append('type', filters.type);
    if (filters.search) params.append('search', filters.search);

    const response = await fetch(`${this.API_URL}?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des opérations');
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Erreur inconnue');
    }

    return result;
  }

  static async exportOperations(filters: JournalFilters, exportType: 'pdf' | 'excel') {
    const response = await fetch(this.API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'export',
        type: exportType,
        filters
      }),
    });

    if (!response.ok) {
      throw new Error('Erreur lors de l\'export');
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Erreur lors de l\'export');
    }

    return result;
  }

  static async syncOperations() {
    const response = await fetch(this.API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'sync'
      }),
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la synchronisation');
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Erreur lors de la synchronisation');
    }

    return result;
  }
}

// Service d'export amélioré avec toasts personnalisés
class ExportService {
  // Toast personnalisé pour le succès
  private static showSuccessToast(message: string, filename: string) {
    toast.custom(
      (t) => (
        <div className={`${
          t.visible ? 'animate-enter' : 'animate-leave'
        } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
          <div className="flex-1 w-0 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-0.5">
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900">
                  Export réussi
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  {message}
                </p>
                <p className="text-xs text-gray-400">
                  Fichier: {filename}
                </p>
              </div>
            </div>
          </div>
          <div className="flex border-l border-gray-200">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-gray-600 hover:text-gray-500 focus:outline-none"
            >
              Fermer
            </button>
          </div>
        </div>
      ),
      { duration: 5000 }
    );
  }

  // Toast personnalisé pour l'erreur
  private static showErrorToast(message: string) {
    toast.custom(
      (t) => (
        <div className={`${
          t.visible ? 'animate-enter' : 'animate-leave'
        } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 border-l-4 border-red-500`}>
          <div className="flex-1 w-0 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-0.5">
                <XCircle className="h-6 w-6 text-red-500" />
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900">
                  Erreur d'export
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  {message}
                </p>
              </div>
            </div>
          </div>
          <div className="flex border-l border-gray-200">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-gray-600 hover:text-gray-500 focus:outline-none"
            >
              Fermer
            </button>
          </div>
        </div>
      ),
      { duration: 6000 }
    );
  }

  // Toast personnalisé pour l'export en cours
  private static showLoadingToast(exportType: 'pdf' | 'excel') {
    const toastId = toast.custom(
      (t) => (
        <div className={`${
          t.visible ? 'animate-enter' : 'animate-leave'
        } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 border-l-4 border-blue-500`}>
          <div className="flex-1 w-0 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-0.5">
                <RefreshCw className="h-6 w-6 text-blue-500 animate-spin" />
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900">
                  Préparation de l'export
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  Génération du fichier {exportType.toUpperCase()} en cours...
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
      { duration: Infinity }
    );
    return toastId;
  }

  static async exportToPDF(data: { operations: any[]; metadata: ExportMetadata }, filename: string) {
    const toastId = this.showLoadingToast('pdf');
    
    try {
      // Simulation d'un délai pour l'export PDF
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Générer le contenu PDF formaté
      const content = this.generatePDFContent(data);
      const blob = new Blob([content], { type: 'application/pdf' });
      this.downloadFile(blob, filename);
      
      toast.dismiss(toastId);
      this.showSuccessToast(
        `Votre journal a été exporté en PDF avec ${data.metadata.totalOperations} opérations`,
        filename
      );
      
    } catch (error) {
      toast.dismiss(toastId);
      this.showErrorToast('Erreur lors de la génération du PDF');
      throw error;
    }
  }

  static async exportToExcel(data: { operations: any[]; metadata: ExportMetadata }, filename: string) {
    const toastId = this.showLoadingToast('excel');
    
    try {
      // Simulation d'un délai pour l'export Excel
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Générer le contenu Excel formaté
      const content = this.generateExcelContent(data);
      const blob = new Blob([content], { type: 'application/vnd.ms-excel' });
      this.downloadFile(blob, filename);
      
      toast.dismiss(toastId);
      this.showSuccessToast(
        `Votre journal a été exporté en Excel avec ${data.metadata.totalOperations} opérations`,
        filename
      );
      
    } catch (error) {
      toast.dismiss(toastId);
      this.showErrorToast('Erreur lors de la génération du fichier Excel');
      throw error;
    }
  }

  private static generatePDFContent(data: { operations: any[]; metadata: ExportMetadata }): string {
    const { operations, metadata } = data;
    
    return `JOURNAL DES OPÉRATIONS COMPTABLES
========================================

${metadata.title}
Période: ${metadata.filters.periode}
Généré le: ${metadata.generatedAt}

INFORMATIONS GÉNÉRALES
----------------------
Total des opérations: ${metadata.totalOperations}
Montant total: ${this.formatMoney(metadata.totalMontant)} XOF
Type: ${metadata.filters.type}
Recherche: ${metadata.filters.search || 'Aucune'}

DÉTAIL DES OPÉRATIONS
---------------------
${operations.map((op, index) => 
`${index + 1}. ${op.numero}
   Date: ${op.date}
   Élève: ${op.eleve}
   Filière: ${op.filiere || 'N/A'}
   Vague: ${op.vague || 'N/A'}
   Libellé: ${op.libelle}
   Montant: ${this.formatMoney(op.montant)} XOF
   Référence: ${op.reference}
   Mode paiement: ${op.modePaiement}
   Statut: ${op.statut}
   Source: ${op.source}
   ${'-'.repeat(50)}`
).join('\n')}

FIN DU RAPPORT
==============`;
  }

  private static generateExcelContent(data: { operations: any[]; metadata: ExportMetadata }): string {
    const { operations, metadata } = data;
    
    const headers = [
      'Numéro', 
      'Date', 
      'Élève', 
      'Filière', 
      'Vague', 
      'Libellé', 
      'Montant (XOF)', 
      'Référence', 
      'Mode Paiement', 
      'Statut', 
      'Source'
    ];
    
    const rows = operations.map(op => [
      op.numero,
      op.date,
      op.eleve,
      op.filiere || 'N/A',
      op.vague || 'N/A',
      op.libelle,
      op.montant,
      op.reference,
      op.modePaiement,
      op.statut,
      op.source
    ]);
    
    // Ajouter les métadonnées en en-tête
    const metaLines = [
      [`Journal des Opérations Comptables - ${metadata.title}`],
      [`Période: ${metadata.filters.periode}`],
      [`Généré le: ${metadata.generatedAt}`],
      [`Total opérations: ${metadata.totalOperations}`],
      [`Montant total: ${this.formatMoney(metadata.totalMontant)} XOF`],
      [`Type: ${metadata.filters.type}`],
      [`Recherche: ${metadata.filters.search || 'Aucune'}`],
      [''], // Ligne vide
      headers
    ];
    
    return [...metaLines, ...rows].map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');
  }

  private static formatMoney(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  private static downloadFile(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }
}

export default function JournalOperationsPage() {
  const [operations, setOperations] = useState<OperationAutomatique[]>([]);
  const [filteredOperations, setFilteredOperations] = useState<OperationAutomatique[]>([]);
  const [selectedType, setSelectedType] = useState<string>('all');
  
  // Dates par défaut - dernier mois
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  
  const [dateDebut, setDateDebut] = useState<string>(firstDayOfMonth.toISOString().split('T')[0]);
  const [dateFin, setDateFin] = useState<string>(today.toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOperation, setSelectedOperation] = useState<OperationAutomatique | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Charger les opérations
  const loadOperations = async () => {
    const loadingToast = toast.custom(
      (t) => (
        <div className={`${
          t.visible ? 'animate-enter' : 'animate-leave'
        } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 border-l-4 border-blue-500`}>
          <div className="flex-1 w-0 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-0.5">
                <RefreshCw className="h-6 w-6 text-blue-500 animate-spin" />
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900">
                  Chargement en cours
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  Récupération des opérations...
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
      { duration: Infinity }
    );

    try {
      setLoading(true);
      setError(null);
      
      const filters: JournalFilters = {
        dateDebut,
        dateFin,
        type: selectedType,
        search: searchTerm
      };
      
      const result = await JournalService.getOperations(filters);
      setOperations(result.data.operations);
      setFilteredOperations(result.data.operations);

      toast.dismiss(loadingToast);
      toast.success(`✅ ${result.data.operations.length} opérations chargées avec succès`);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des opérations';
      setError(errorMessage);
      
      toast.dismiss(loadingToast);
      toast.error(`❌ ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Chargement initial
  useEffect(() => {
    loadOperations();
  }, []);

  // Filtrage côté client
  useEffect(() => {
    const filtered = operations.filter(op => 
      op.date >= dateDebut &&
      op.date <= dateFin &&
      (selectedType === 'all' || op.type === selectedType) &&
      (searchTerm === '' || 
        op.libelle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        op.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (op.studentName && op.studentName.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    );
    setFilteredOperations(filtered);
  }, [operations, dateDebut, dateFin, selectedType, searchTerm]);

  const formatMoney = (amount: number) => new Intl.NumberFormat('fr-FR', {style: 'currency', currency: 'XOF'}).format(amount);

  const getTypeBadge = (type: OperationAutomatique['type']) => {
    const map = {
      inscription_eleve: { text: 'Inscription', variant: 'default' as const, icon: Users },
      paiement_scolarite: { text: 'Scolarité', variant: 'secondary' as const, icon: GraduationCap },
      paiement_inscription: { text: 'Paiement Inscription', variant: 'outline' as const, icon: CreditCard }
    };
    const {text, variant, icon: Icon} = map[type];
    return <Badge variant={variant} className="flex items-center gap-1"><Icon className="h-3 w-3" />{text}</Badge>;
  };

  const getSourceBadge = (source: OperationAutomatique['source']) => {
    const map = {
      paiement_auto: { text: 'Paiement Auto', variant: 'default' as const },
      inscription_auto: { text: 'Inscription Auto', variant: 'secondary' as const }
    };
    return <Badge variant={map[source].variant}>{map[source].text}</Badge>;
  };

  const getModePaiementBadge = (mode?: string) => {
    if (!mode) return null;
    const map = {
      especes: { text: 'Espèces', variant: 'secondary' as const },
      cheque: { text: 'Chèque', variant: 'outline' as const },
      virement: { text: 'Virement', variant: 'default' as const },
      mobile_money: { text: 'Mobile Money', variant: 'secondary' as const },
      carte: { text: 'Carte', variant: 'outline' as const }
    };
    return <Badge variant={map[mode as keyof typeof map]?.variant ?? 'default'}>{map[mode as keyof typeof map]?.text ?? mode}</Badge>;
  };

  const handleViewDetails = (operation: OperationAutomatique) => {
    setSelectedOperation(operation);
    setIsDetailModalOpen(true);
  };

  const handleExport = async (exportType: 'pdf' | 'excel') => {
    try {
      setExportLoading(true);
      setIsExportDialogOpen(false);

      const filters: JournalFilters = {
        dateDebut,
        dateFin,
        type: selectedType,
        search: searchTerm
      };

      const result = await JournalService.exportOperations(filters, exportType);

      // Utiliser le service d'export frontend amélioré
      const filename = `journal-operations-${dateDebut}-${dateFin}.${exportType === 'pdf' ? 'pdf' : 'xlsx'}`;
      
      if (exportType === 'pdf') {
        await ExportService.exportToPDF(result.data, filename);
      } else {
        await ExportService.exportToExcel(result.data, filename);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de l\'export';
      // L'erreur est déjà gérée par ExportService.showErrorToast()
    } finally {
      setExportLoading(false);
    }
  };

  const handleSync = async () => {
    const syncToast = toast.custom(
      (t) => (
        <div className={`${
          t.visible ? 'animate-enter' : 'animate-leave'
        } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 border-l-4 border-purple-500`}>
          <div className="flex-1 w-0 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-0.5">
                <RefreshCw className="h-6 w-6 text-purple-500 animate-spin" />
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900">
                  Synchronisation en cours
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  Recherche des nouvelles opérations...
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
      { duration: Infinity }
    );

    try {
      setLoading(true);
      const result = await JournalService.syncOperations();
      
      toast.dismiss(syncToast);
      toast.success(`🔄 ${result.message} - ${result.data.nouvellesOperations} nouvelles opérations`);

      // Recharger les données après synchronisation
      await loadOperations();

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la synchronisation';
      toast.dismiss(syncToast);
      toast.error(`❌ ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const openExportDialog = () => {
    if (filteredOperations.length === 0) {
      toast.custom(
        (t) => (
          <div className={`${
            t.visible ? 'animate-enter' : 'animate-leave'
          } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 border-l-4 border-orange-500`}>
            <div className="flex-1 w-0 p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 pt-0.5">
                  <AlertCircle className="h-6 w-6 text-orange-500" />
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    Aucune donnée à exporter
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    Il n'y a aucune opération à exporter avec les filtres actuels
                  </p>
                </div>
              </div>
            </div>
            <div className="flex border-l border-gray-200">
              <button
                onClick={() => toast.dismiss(t.id)}
                className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-gray-600 hover:text-gray-500 focus:outline-none"
              >
                Fermer
              </button>
            </div>
          </div>
        ),
        { duration: 4000 }
      );
      return;
    }
    setIsExportDialogOpen(true);
  };

  // Skeleton Loader
  const SkeletonRow = () => (
    <TableRow>
      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
      <TableCell><Skeleton className="h-6 w-24" /></TableCell>
      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
      <TableCell><Skeleton className="h-8 w-16" /></TableCell>
      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
      <TableCell><Skeleton className="h-6 w-20" /></TableCell>
      <TableCell><Skeleton className="h-8 w-8 rounded" /></TableCell>
    </TableRow>
  );

  return (
    <div className="flex flex-col h-screen bg-gray-50 lg:pl-5 pt-20 lg:pt-6">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Journal des Opérations</h1>
            <p className="text-gray-600 mt-1">Opérations comptables liées aux inscriptions et scolarités</p>
          </div>
         <div className="flex flex-col sm:flex-row gap-3 mt-4 sm:mt-0">
  <Button 
    variant="outline" 
    onClick={openExportDialog} 
    disabled={loading || exportLoading}
    className="w-full sm:w-auto justify-center"
  >
    <Download className="h-4 w-4 mr-2" />
    Exporter
  </Button>
  <Button 
    variant="outline" 
    onClick={handleSync} 
    disabled={loading}
    className="w-full sm:w-auto justify-center"
  >
    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
    Synchroniser
  </Button>
  <Button 
    onClick={loadOperations} 
    disabled={loading}
    className="w-full sm:w-auto justify-center"
  >
    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
    Actualiser
  </Button>
</div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
          {/* Stat cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {loading ? (
              <>
                {[...Array(4)].map((_, i) => (
                  <Card key={i}>
                    <CardHeader><Skeleton className="h-4 w-24" /></CardHeader>
                    <CardContent>
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-3 w-32 mt-2" />
                    </CardContent>
                  </Card>
                ))}
              </>
            ) : (
              <>
                <Card>
                  <CardHeader><CardTitle>Total Opérations</CardTitle></CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">{operations.length}</div>
                    <p className="text-xs text-gray-600 mt-1">Opérations liées inscr./scolarité</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Encaissements</CardTitle></CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {formatMoney(operations.reduce((a, op) => ['paiement_inscription', 'paiement_scolarite'].includes(op.type) ? a + op.montant : a, 0))}
                    </div>
                    <p className="text-xs text-gray-600 mt-1">Scolarité & Inscriptions</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Opérations Paiement Auto</CardTitle></CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-600">
                      {operations.filter(op => op.source === 'paiement_auto').length}
                    </div>
                    <p className="text-xs text-gray-600 mt-1">Depuis paiements automatique</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Période</CardTitle></CardHeader>
                  <CardContent>
                    <div className="text-lg font-bold text-orange-600">
                      {new Date(dateDebut).toLocaleDateString('fr-FR')}
                    </div>
                    <p className="text-xs text-gray-600 mt-1">au {new Date(dateFin).toLocaleDateString('fr-FR')}</p>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <Input 
                  placeholder="Rechercher par libellé, référence, élève..."
                  className="flex-grow"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-[160px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Tous types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous types</SelectItem>
                    <SelectItem value="paiement_inscription">Paiements Inscription</SelectItem>
                    <SelectItem value="paiement_scolarite">Paiements Scolarité</SelectItem>
                    <SelectItem value="inscription_eleve">Inscriptions Élèves</SelectItem>
                  </SelectContent>
                </Select>
                <Input type="date" value={dateDebut} onChange={e => setDateDebut(e.target.value)} />
                <Input type="date" value={dateFin} onChange={e => setDateFin(e.target.value)} />
                <Button onClick={loadOperations} disabled={loading}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Appliquer
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Table */}
          <Card>
            <CardHeader>
              <CardTitle>Journal des Opérations Automatiques</CardTitle>
              <CardDescription>
                {loading ? (
                  <Skeleton className="h-4 w-32" />
                ) : (
                  `${filteredOperations.length} opération(s) trouvée(s) - Total: ${formatMoney(filteredOperations.reduce((sum, op) => sum + op.montant, 0))}`
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <UITable>
                <TableHeader>
                  <TableRow>
                    <TableHead>N° Opération</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Élève</TableHead>
                    <TableHead>Libellé</TableHead>
                    <TableHead>Comptes</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Référence</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
                  ) : error ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8 text-red-500">
                        {error}
                        <Button variant="outline" className="ml-4" onClick={loadOperations}>
                          Réessayer
                        </Button>
                      </TableCell>
                    </TableRow>
                  ) : filteredOperations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                        Aucune opération trouvée avec les critères actuels
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOperations.map(op => (
                      <TableRow key={op.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleViewDetails(op)}>
                        <TableCell className="font-mono font-medium">{op.numero}</TableCell>
                        <TableCell>{new Date(op.date).toLocaleDateString('fr-FR')}</TableCell>
                        <TableCell>{getTypeBadge(op.type)}</TableCell>
                        <TableCell>{op.studentName || <span className="text-gray-400">Système</span>}</TableCell>
                        <TableCell title={op.libelle} className="max-w-[200px] truncate">{op.libelle}</TableCell>
                        <TableCell>
                          <div>Débit: {op.compteDebit}</div>
                          <div>Crédit: {op.compteCredit}</div>
                        </TableCell>
                        <TableCell className="font-semibold text-green-600">{formatMoney(op.montant)}</TableCell>
                        <TableCell className="font-mono text-sm">{op.reference}</TableCell>
                        <TableCell>{getSourceBadge(op.source)}</TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm" onClick={(e) => {
                            e.stopPropagation();
                            handleViewDetails(op);
                          }}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </UITable>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal Details */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-2xl max-h-screen overflow-y-auto p-6 bg-white">
          <DialogHeader>
            <DialogTitle>Détails de l&apos;Opération</DialogTitle>
            <DialogDescription>{selectedOperation?.numero} - Générée automatiquement</DialogDescription>
          </DialogHeader>
          {selectedOperation && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p><strong>Date:</strong> {new Date(selectedOperation.date).toLocaleDateString('fr-FR')}</p>
                  <p><strong>Type:</strong> {getTypeBadge(selectedOperation.type)}</p>
                  <p><strong>Référence:</strong> {selectedOperation.reference}</p>
                  <p><strong>Statut:</strong> <Badge variant="default">Comptabilisé</Badge></p>
                </div>
                <div>
                  <p><strong>Montant:</strong> <span className="text-green-600 font-bold">{formatMoney(selectedOperation.montant)}</span></p>
                  {selectedOperation.modePaiement && <p><strong>Mode paiement:</strong> {getModePaiementBadge(selectedOperation.modePaiement)}</p>}
                  <p><strong>Date comptabilisation:</strong> {new Date(selectedOperation.dateComptabilisation).toLocaleDateString('fr-FR')}</p>
                </div>
              </div>
              {selectedOperation.notes && (
                <div>
                  <h4 className="font-semibold">Notes</h4>
                  <p className="bg-gray-50 p-4 rounded">{selectedOperation.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Exporter le journal</DialogTitle>
            <DialogDescription>
              Choisissez le format d&apos;export pour {filteredOperations.length} opérations
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              onClick={() => handleExport('pdf')}
              disabled={exportLoading}
              className="h-20 flex-col hover:bg-red-50 hover:border-red-200 transition-colors"
            >
              <FileText className="h-8 w-8 mb-2 text-red-600" />
              <span className="font-medium">PDF</span>
              <span className="text-xs text-gray-500 mt-1">Format document</span>
            </Button>
            <Button 
              variant="outline" 
              onClick={() => handleExport('excel')}
              disabled={exportLoading}
              className="h-20 flex-col hover:bg-green-50 hover:border-green-200 transition-colors"
            >
              <Table className="h-8 w-8 mb-2 text-green-600" />
              <span className="font-medium">Excel</span>
              <span className="text-xs text-gray-500 mt-1">Format tableur</span>
            </Button>
          </div>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-2">
              <FileDown className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-900">Informations d'export</p>
                <p className="text-xs text-blue-700 mt-1">
                  Période: {new Date(dateDebut).toLocaleDateString('fr-FR')} au {new Date(dateFin).toLocaleDateString('fr-FR')}
                </p>
                <p className="text-xs text-blue-700">
                  {filteredOperations.length} opérations - {formatMoney(filteredOperations.reduce((sum, op) => sum + op.montant, 0))}
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}