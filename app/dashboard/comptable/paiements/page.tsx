// app/dashboard/comptable/paiements/page.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Filter, Download, CheckCircle, XCircle, 
  Eye, Clock, CreditCard, Save, Upload
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

interface Payment {
  id: string;
  studentId: string;
  studentName: string;
  parentName: string;
  filiere: string;
  vague: string;
  montant: number;
  type: 'inscription' | 'scolarite' | 'cantine' | 'activites';
  methode: 'especes' | 'cheque' | 'virement' | 'mobile_money';
  statut: 'en_attente' | 'approuve' | 'rejete' | 'saisi_manuel';
  datePaiement: string;
  dateValidation?: string;
  validateurId?: string;
  reference: string;
  notes?: string;
  justificatif?: string;
  semester?: string;
  description: string;
}

interface ManualPaymentForm {
  studentId: string;
  type: 'inscription' | 'scolarite' | 'cantine' | 'activites';
  montant: number;
  methode: 'especes' | 'cheque' | 'virement' | 'mobile_money';
  date: string;
  reference: string;
  notes: string;
  semester?: string;
  description: string;
  // Champs spécifiques selon la méthode
  banque?: string;
  numeroCheque?: string;
  numeroCompte?: string;
  operateurMobile?: string;
  numeroTelephone?: string;
  justificatifFile?: File;
}

interface Student {
  id: string;
  name: string;
  filiere: string;
  vague: string;
  parentName: string;
  registrationFee: number;
  tuitionFee: number;
  paidAmount: number;
  remainingAmount: number;
  totalSchoolFees: number;
  paidSemesters: string[];
  pendingSemesters: string[];
  currentSemester: string;
}

type ManualPaymentFormField = keyof ManualPaymentForm;

export default function PaiementsComptablePage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStatut, setSelectedStatut] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isManualPaymentModalOpen, setIsManualPaymentModalOpen] = useState(false);
  
  const [manualPaymentForm, setManualPaymentForm] = useState<ManualPaymentForm>({
    studentId: '',
    type: 'scolarite',
    montant: 0,
    methode: 'especes',
    date: new Date().toISOString().split('T')[0],
    reference: '',
    notes: '',
    semester: '',
    description: ''
  });

  // Données simulées avec les bonnes structures
  useEffect(() => {
    const mockStudents: Student[] = [
      {
        id: 's1',
        name: 'Marie Dupont',
        filiere: 'Développement Web',
        vague: 'Vague Janvier 2024',
        parentName: 'M. Dupont',
        registrationFee: 50000,
        tuitionFee: 885000,
        paidAmount: 345000,
        remainingAmount: 590000,
        totalSchoolFees: 935000,
        paidSemesters: ['Semestre 1'],
        pendingSemesters: ['Semestre 2', 'Semestre 3'],
        currentSemester: 'Semestre 2'
      },
      {
        id: 's2',
        name: 'Pierre Martin',
        filiere: 'Data Science',
        vague: 'Vague Janvier 2024',
        parentName: 'Mme. Martin',
        registrationFee: 50000,
        tuitionFee: 885000,
        paidAmount: 0,
        remainingAmount: 935000,
        totalSchoolFees: 935000,
        paidSemesters: [],
        pendingSemesters: ['Semestre 1', 'Semestre 2', 'Semestre 3'],
        currentSemester: 'Semestre 1'
      }
    ];

    const mockPayments: Payment[] = [
      {
        id: '1',
        studentId: 's1',
        studentName: 'Marie Dupont',
        parentName: 'M. Dupont',
        filiere: 'Développement Web',
        vague: 'Vague Janvier 2024',
        montant: 50000,
        type: 'inscription',
        methode: 'especes',
        statut: 'approuve',
        datePaiement: '2024-01-15',
        dateValidation: '2024-01-15',
        reference: 'INS-001',
        description: 'Frais d\'inscription - Année scolaire 2024/2025'
      },
      {
        id: '2',
        studentId: 's1',
        studentName: 'Marie Dupont',
        parentName: 'M. Dupont',
        filiere: 'Développement Web',
        vague: 'Vague Janvier 2024',
        montant: 295000,
        type: 'scolarite',
        methode: 'virement',
        statut: 'approuve',
        datePaiement: '2024-01-20',
        dateValidation: '2024-01-20',
        reference: 'SCO-S1-001',
        semester: 'Semestre 1',
        description: 'Frais de scolarité - Semestre 1'
      },
      {
        id: '3',
        studentId: 's1',
        studentName: 'Marie Dupont',
        parentName: 'M. Dupont',
        filiere: 'Développement Web',
        vague: 'Vague Janvier 2024',
        montant: 295000,
        type: 'scolarite',
        methode: 'mobile_money',
        statut: 'en_attente',
        datePaiement: '2024-02-15',
        reference: 'SCO-S2-001',
        semester: 'Semestre 2',
        description: 'Frais de scolarité - Semestre 2'
      }
    ];

    setStudents(mockStudents);
    setPayments(mockPayments);
    setFilteredPayments(mockPayments);
  }, []);

  // Filtrage
  useEffect(() => {
    let result = payments;

    if (selectedStatut !== 'all') {
      result = result.filter(p => p.statut === selectedStatut);
    }

    if (selectedType !== 'all') {
      result = result.filter(p => p.type === selectedType);
    }

    if (searchTerm) {
      result = result.filter(p => 
        p.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.parentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.filiere.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredPayments(result);
  }, [payments, selectedStatut, selectedType, searchTerm]);

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF'
    }).format(amount);
  };

  const formatFCFA = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
  };

  const getStatusBadge = (statut: Payment['statut']) => {
    const config = {
      en_attente: { variant: 'secondary' as const, text: 'En attente', icon: Clock },
      approuve: { variant: 'default' as const, text: 'Approuvé', icon: CheckCircle },
      rejete: { variant: 'destructive' as const, text: 'Rejeté', icon: XCircle },
      saisi_manuel: { variant: 'outline' as const, text: 'Saisi manuel', icon: CreditCard }
    };
    const { variant, text, icon: Icon } = config[statut];
    
    return (
      <Badge variant={variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {text}
      </Badge>
    );
  };

  const getMethodBadge = (methode: Payment['methode']) => {
    const config = {
      especes: { variant: 'secondary' as const, text: 'Espèces' },
      cheque: { variant: 'outline' as const, text: 'Chèque' },
      virement: { variant: 'default' as const, text: 'Virement' },
      mobile_money: { variant: 'secondary' as const, text: 'Mobile Money' }
    };
    
    const methodConfig = config[methode];
    
    if (!methodConfig) {
      return <Badge variant="outline">Inconnu</Badge>;
    }
    
    return <Badge variant={methodConfig.variant}>{methodConfig.text}</Badge>;
  };

  const getTypeLabel = (type: Payment['type']) => {
    switch (type) {
      case 'inscription': return 'Inscription';
      case 'scolarite': return 'Scolarité';
      case 'cantine': return 'Cantine';
      case 'activites': return 'Activités';
      default: return type;
    }
  };

  // Fonction pour mettre à jour les données de l'élève après approbation
  const updateStudentPaymentData = (studentId: string, montant: number, semester?: string) => {
    setStudents(prev => prev.map(student => {
      if (student.id === studentId) {
        const newPaidAmount = student.paidAmount + montant;
        const newRemainingAmount = Math.max(0, student.totalSchoolFees - newPaidAmount);
        
        const newPaidSemesters = [...student.paidSemesters];
        let newPendingSemesters = [...student.pendingSemesters];
        
        // Si c'est un paiement de scolarité avec semestre, mettre à jour les listes
        if (semester && student.pendingSemesters.includes(semester)) {
          newPaidSemesters.push(semester);
          newPendingSemesters = newPendingSemesters.filter(s => s !== semester);
        }
        
        return {
          ...student,
          paidAmount: newPaidAmount,
          remainingAmount: newRemainingAmount,
          paidSemesters: newPaidSemesters,
          pendingSemesters: newPendingSemesters
        };
      }
      return student;
    }));
  };

  const handleApprovePayment = (paymentId: string) => {
    setPayments(prev => prev.map(p => {
      if (p.id === paymentId) {
        const updatedPayment: Payment = { 
          ...p, 
          statut: 'approuve', 
          dateValidation: new Date().toISOString().split('T')[0] 
        };
        
        // Mettre à jour les données de l'élève
        updateStudentPaymentData(p.studentId, p.montant, p.semester);
        
        return updatedPayment;
      }
      return p;
    }));
  };

  const handleRejectPayment = (paymentId: string) => {
    setPayments(prev => prev.map(p => 
      p.id === paymentId 
        ? { ...p, statut: 'rejete', dateValidation: new Date().toISOString().split('T')[0] }
        : p
    ));
  };

  const handleViewDetails = (payment: Payment) => {
    setSelectedPayment(payment);
    setIsDetailModalOpen(true);
  };

  const generateDescription = (type: string, semester?: string): string => {
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;
    
    switch (type) {
      case 'inscription':
        return `Frais d'inscription - Année scolaire ${currentYear}/${nextYear}`;
      case 'scolarite':
        return semester ? `Frais de scolarité - ${semester}` : `Frais de scolarité`;
      case 'cantine':
        return `Frais de cantine - ${new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`;
      case 'activites':
        return `Frais d'activités périscolaires`;
      default:
        return 'Paiement divers';
    }
  };

  const handleManualPaymentSubmit = () => {
    const selectedStudent = students.find(s => s.id === manualPaymentForm.studentId);
    if (!selectedStudent) return;

    // Générer la description automatiquement
    const description = manualPaymentForm.description || generateDescription(manualPaymentForm.type, manualPaymentForm.semester);
    
    // Générer une référence automatique
    const reference = manualPaymentForm.reference || `MAN-${Date.now()}`;
    
    const newPayment: Payment = {
      id: `manual-${Date.now()}`,
      studentId: manualPaymentForm.studentId,
      studentName: selectedStudent.name,
      parentName: selectedStudent.parentName,
      filiere: selectedStudent.filiere,
      vague: selectedStudent.vague,
      montant: manualPaymentForm.montant,
      type: manualPaymentForm.type,
      methode: manualPaymentForm.methode,
      statut: 'saisi_manuel',
      datePaiement: manualPaymentForm.date,
      reference: reference,
      notes: manualPaymentForm.notes,
      semester: manualPaymentForm.type === 'scolarite' ? manualPaymentForm.semester : undefined,
      description: description
    };

    setPayments(prev => [newPayment, ...prev]);
    
    // Si c'est un paiement manuel, on met à jour directement les données de l'élève
    updateStudentPaymentData(manualPaymentForm.studentId, manualPaymentForm.montant, manualPaymentForm.semester);
    
    setIsManualPaymentModalOpen(false);
    
    // Reset du formulaire
    setManualPaymentForm({
      studentId: '',
      type: 'scolarite',
      montant: 0,
      methode: 'especes',
      date: new Date().toISOString().split('T')[0],
      reference: '',
      notes: '',
      semester: '',
      description: ''
    });
  };

  const handleFormChange = (field: ManualPaymentFormField, value: string | number | File) => {
    const updatedForm = {
      ...manualPaymentForm,
      [field]: value
    };

    // Si l'élève ou le type change, réinitialiser le semestre et regénérer la description
    if (field === 'studentId' || field === 'type' || field === 'semester') {
      updatedForm.semester = field === 'studentId' ? '' : updatedForm.semester;
      updatedForm.description = generateDescription(updatedForm.type, updatedForm.semester);
    }

    setManualPaymentForm(updatedForm);
  };

  const getAvailableSemesters = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return [];
    
    return student.pendingSemesters;
  };

  const getAmountSuggestions = (studentId: string, type: string): number => {
    const student = students.find(s => s.id === studentId);
    if (!student) return 0;

    switch (type) {
      case 'inscription':
        return student.registrationFee;
      case 'scolarite':
        // Prix par semestre (total scolarité / nombre de semestres)
        return Math.round(student.tuitionFee / 3);
      case 'cantine':
        return 25000; // Prix fixe pour la cantine
      case 'activites':
        return 50000; // Prix fixe pour les activités
      default:
        return 0;
    }
  };

  const renderMethodSpecificFields = () => {
    switch (manualPaymentForm.methode) {
      case 'cheque':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="banque">Banque *</Label>
              <Input 
                id="banque"
                placeholder="Nom de la banque"
                value={manualPaymentForm.banque || ''}
                onChange={(e) => handleFormChange('banque', e.target.value)}
                className="bg-white border-gray-300"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="numeroCheque">Numéro de chèque *</Label>
              <Input 
                id="numeroCheque"
                placeholder="Numéro du chèque"
                value={manualPaymentForm.numeroCheque || ''}
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
              <Label htmlFor="banque">Banque *</Label>
              <Input 
                id="banque"
                placeholder="Nom de la banque"
                value={manualPaymentForm.banque || ''}
                onChange={(e) => handleFormChange('banque', e.target.value)}
                className="bg-white border-gray-300"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="numeroCompte">Numéro de compte *</Label>
              <Input 
                id="numeroCompte"
                placeholder="Numéro de compte"
                value={manualPaymentForm.numeroCompte || ''}
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
              <Label htmlFor="operateurMobile">Opérateur *</Label>
              <Select 
                value={manualPaymentForm.operateurMobile || ''}
                onValueChange={(value) => handleFormChange('operateurMobile', value)}
              >
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
              <Label htmlFor="numeroTelephone">Numéro de téléphone *</Label>
              <Input 
                id="numeroTelephone"
                placeholder="Numéro de téléphone"
                value={manualPaymentForm.numeroTelephone || ''}
                onChange={(e) => handleFormChange('numeroTelephone', e.target.value)}
                className="bg-white border-gray-300"
              />
            </div>
          </>
        );
      
      case 'especes':
        return (
          <div className="col-span-2 space-y-2">
            <Label htmlFor="justificatif">Justificatif (Reçu de caisse)</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center bg-white">
              <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Cliquez pour télécharger le reçu</p>
              <Input 
                type="file" 
                id="justificatif"
                className="hidden"
                onChange={(e) => handleFormChange('justificatifFile', e.target.files?.[0] as File)}
              />
              <Button 
                variant="outline" 
                type="button"
                onClick={() => document.getElementById('justificatif')?.click()}
                className="mt-2"
              >
                <Upload className="h-4 w-4 mr-2" />
                Télécharger
              </Button>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  const stats = {
    totalEnAttente: payments.filter(p => p.statut === 'en_attente').length,
    totalApprouves: payments.filter(p => p.statut === 'approuve').length,
    totalMontantEnAttente: payments.filter(p => p.statut === 'en_attente').reduce((sum, p) => sum + p.montant, 0),
    totalMontantApprouve: payments.filter(p => p.statut === 'approuve').reduce((sum, p) => sum + p.montant, 0)
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 lg:pl-5 pt-20 lg:pt-6">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Gestion des Paiements</h1>
            <p className="text-gray-600 mt-1">Saisie et validation des paiements physiques</p>
          </div>
          <div className="flex gap-3 mt-4 sm:mt-0 flex flex-col">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
            <Button onClick={() => setIsManualPaymentModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Saisir Paiement
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
                <CardTitle className="text-sm font-medium">En Attente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{stats.totalEnAttente}</div>
                <p className="text-xs text-gray-600 mt-1">{formatMoney(stats.totalMontantEnAttente)}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Approuvés</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.totalApprouves}</div>
                <p className="text-xs text-gray-600 mt-1">{formatMoney(stats.totalMontantApprouve)}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Paiements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{payments.length}</div>
                <p className="text-xs text-gray-600 mt-1">paiements traités</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Montant Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {formatMoney(payments.reduce((sum, p) => sum + p.montant, 0))}
                </div>
                <p className="text-xs text-gray-600 mt-1">tous statuts</p>
              </CardContent>
            </Card>
          </div>

          {/* Filtres et recherche */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Rechercher par élève, parent ou filière..."
                      className="pl-10 bg-white border-gray-300"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="flex gap-3 sm:flex flex-col">
                  <Select value={selectedStatut} onValueChange={setSelectedStatut}>
                    <SelectTrigger className="w-[150px] bg-white border-gray-300">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Tous statuts" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous statuts</SelectItem>
                      <SelectItem value="en_attente">En attente</SelectItem>
                      <SelectItem value="approuve">Approuvé</SelectItem>
                      <SelectItem value="rejete">Rejeté</SelectItem>
                      <SelectItem value="saisi_manuel">Saisi manuel</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger className="w-[150px] bg-white border-gray-300">
                      <CreditCard className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Tous types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous types</SelectItem>
                      <SelectItem value="inscription">Inscription</SelectItem>
                      <SelectItem value="scolarite">Scolarité</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tableau des paiements */}
          <Card>
            <CardHeader>
              <CardTitle>Paiements</CardTitle>
              <CardDescription>
                {filteredPayments.length} paiement(s) trouvé(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Élève & Parent</TableHead>
                      <TableHead>Filière & Vague</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Semestre</TableHead>
                      <TableHead>Méthode</TableHead>
                      <TableHead>Montant</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-8">
                          <div className="text-gray-500">
                            Aucun paiement trouvé
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredPayments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{payment.studentName}</div>
                              <div className="text-sm text-gray-600">{payment.parentName}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{payment.filiere}</div>
                              <div className="text-gray-600 text-xs">{payment.vague}</div>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[200px]">
                            <div className="text-sm truncate" title={payment.description}>
                              {payment.description}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {getTypeLabel(payment.type)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {payment.semester ? (
                              <Badge variant="secondary" className="text-xs">
                                {payment.semester}
                              </Badge>
                            ) : (
                              <span className="text-gray-400 text-xs">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {getMethodBadge(payment.methode)}
                          </TableCell>
                          <TableCell className="font-semibold text-green-600">
                            {formatFCFA(payment.montant)}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {new Date(payment.datePaiement).toLocaleDateString('fr-FR')}
                            </div>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(payment.statut)}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleViewDetails(payment)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              
                              {payment.statut === 'en_attente' && (
                                <>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleApprovePayment(payment.id)}
                                    className="text-green-600 border-green-200 hover:bg-green-50"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleRejectPayment(payment.id)}
                                    className="text-red-600 border-red-200 hover:bg-red-50"
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                </>
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

      {/* Modal de détail - Version simplifiée et professionnelle */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>Détails du Paiement</DialogTitle>
          </DialogHeader>
          
          {selectedPayment && (
            <div className="space-y-4 bg-white">
              {/* Informations de base */}
              <div className="space-y-3">
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="font-medium text-gray-700">Élève:</span>
                  <span>{selectedPayment.studentName}</span>
                </div>
                
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="font-medium text-gray-700">Filière:</span>
                  <span>{selectedPayment.filiere}</span>
                </div>

                <div className="flex justify-between items-center border-b pb-2">
                  <span className="font-medium text-gray-700">Vague:</span>
                  <span>{selectedPayment.vague}</span>
                </div>

                <div className="flex justify-between items-center border-b pb-2">
                  <span className="font-medium text-gray-700">Type:</span>
                  <Badge variant="outline" className="capitalize">
                    {getTypeLabel(selectedPayment.type)}
                  </Badge>
                </div>

                {selectedPayment.semester && (
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="font-medium text-gray-700">Semestre:</span>
                    <Badge variant="secondary">{selectedPayment.semester}</Badge>
                  </div>
                )}

                <div className="flex justify-between items-center border-b pb-2">
                  <span className="font-medium text-gray-700">Montant:</span>
                  <span className="font-bold text-green-600 text-lg">
                    {formatFCFA(selectedPayment.montant)}
                  </span>
                </div>

                <div className="flex justify-between items-center border-b pb-2">
                  <span className="font-medium text-gray-700">Méthode:</span>
                  {getMethodBadge(selectedPayment.methode)}
                </div>

                <div className="flex justify-between items-center border-b pb-2">
                  <span className="font-medium text-gray-700">Statut:</span>
                  {getStatusBadge(selectedPayment.statut)}
                </div>

                <div className="flex justify-between items-center border-b pb-2">
                  <span className="font-medium text-gray-700">Date:</span>
                  <span>{new Date(selectedPayment.datePaiement).toLocaleDateString('fr-FR')}</span>
                </div>

                <div className="flex justify-between items-center border-b pb-2">
                  <span className="font-medium text-gray-700">Référence:</span>
                  <span className="font-mono text-sm">{selectedPayment.reference}</span>
                </div>
              </div>

              {/* Résumé financier de l'élève */}
              {selectedPayment.studentId && (
                <Card className="mt-4">
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Situation Financière</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total payé:</span>
                        <span className="font-semibold text-green-600">
                          {formatFCFA(students.find(s => s.id === selectedPayment.studentId)?.paidAmount || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Reste à payer:</span>
                        <span className="font-semibold text-orange-600">
                          {formatFCFA(students.find(s => s.id === selectedPayment.studentId)?.remainingAmount || 0)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {selectedPayment.statut === 'en_attente' && (
                <div className="flex gap-3 pt-4 border-t">
                  <Button 
                    onClick={() => handleApprovePayment(selectedPayment.id)}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approuver
                  </Button>
                  <Button 
                    onClick={() => handleRejectPayment(selectedPayment.id)}
                    variant="outline"
                    className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Rejeter
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de saisie manuelle */}
      <Dialog open={isManualPaymentModalOpen} onOpenChange={setIsManualPaymentModalOpen}>
        <DialogContent className="max-w-2xl bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Saisir un Paiement Manuel</DialogTitle>
            <DialogDescription>
              Enregistrer un paiement reçu physiquement
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4 bg-white">
            <div className="space-y-2">
              <Label htmlFor="student" className="text-gray-700">Élève *</Label>
              <Select 
                value={manualPaymentForm.studentId}
                onValueChange={(value) => handleFormChange('studentId', value)}
              >
                <SelectTrigger className="bg-white border-gray-300">
                  <SelectValue placeholder="Sélectionner un élève" />
                </SelectTrigger>
                <SelectContent>
                  {students.map(student => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.name} - {student.filiere} ({student.vague})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type" className="text-gray-700">Type *</Label>
              <Select 
                value={manualPaymentForm.type}
                onValueChange={(value: 'inscription' | 'scolarite' | 'cantine' | 'activites') => handleFormChange('type', value)}
              >
                <SelectTrigger className="bg-white border-gray-300">
                  <SelectValue placeholder="Type de paiement" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inscription">Inscription</SelectItem>
                  <SelectItem value="scolarite">Scolarité</SelectItem>
                  <SelectItem value="cantine">Cantine</SelectItem>
                  <SelectItem value="activites">Activités</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {manualPaymentForm.type === 'scolarite' && manualPaymentForm.studentId && (
              <div className="space-y-2">
                <Label htmlFor="semester" className="text-gray-700">Semestre *</Label>
                <Select 
                  value={manualPaymentForm.semester || ''}
                  onValueChange={(value) => handleFormChange('semester', value)}
                >
                  <SelectTrigger className="bg-white border-gray-300">
                    <SelectValue placeholder="Sélectionner un semestre" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableSemesters(manualPaymentForm.studentId).map(semester => (
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
                value={manualPaymentForm.montant || ''}
                onChange={(e) => handleFormChange('montant', parseInt(e.target.value) || 0)}
                className="bg-white border-gray-300"
              />
              {manualPaymentForm.studentId && (
                <p className="text-xs text-gray-500">
                  Suggestion: {formatFCFA(getAmountSuggestions(manualPaymentForm.studentId, manualPaymentForm.type))}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="methode" className="text-gray-700">Méthode *</Label>
              <Select 
                value={manualPaymentForm.methode}
                onValueChange={(value: 'especes' | 'cheque' | 'virement' | 'mobile_money') => handleFormChange('methode', value)}
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
              <Label htmlFor="date" className="text-gray-700">Date *</Label>
              <Input 
                type="date" 
                value={manualPaymentForm.date}
                onChange={(e) => handleFormChange('date', e.target.value)}
                className="bg-white border-gray-300"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reference" className="text-gray-700">Référence</Label>
              <Input 
                placeholder="Numéro de chèque, référence..."
                value={manualPaymentForm.reference}
                onChange={(e) => handleFormChange('reference', e.target.value)}
                className="bg-white border-gray-300"
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="description" className="text-gray-700">Description</Label>
              <Input 
                placeholder="Description du paiement"
                value={manualPaymentForm.description}
                onChange={(e) => handleFormChange('description', e.target.value)}
                className="bg-white border-gray-300"
              />
            </div>

            {/* Champs spécifiques selon la méthode de paiement */}
            {renderMethodSpecificFields()}

            <div className="col-span-2 space-y-2">
              <Label htmlFor="notes" className="text-gray-700">Notes</Label>
              <Textarea 
                placeholder="Informations complémentaires..."
                value={manualPaymentForm.notes}
                onChange={(e) => handleFormChange('notes', e.target.value)}
                className="bg-white border-gray-300"
              />
            </div>
          </div>

          {/* Résumé de l'élève sélectionné */}
          {manualPaymentForm.studentId && (
            <Card className="mt-4">
              <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Total payé:</span>
                    <p className="font-semibold text-green-600">
                      {formatFCFA(students.find(s => s.id === manualPaymentForm.studentId)?.paidAmount || 0)}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Reste à payer:</span>
                    <p className="font-semibold text-orange-600">
                      {formatFCFA(students.find(s => s.id === manualPaymentForm.studentId)?.remainingAmount || 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <DialogFooter className="bg-white">
            <Button variant="outline" onClick={() => setIsManualPaymentModalOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleManualPaymentSubmit}>
              <Save className="h-4 w-4 mr-2" />
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}