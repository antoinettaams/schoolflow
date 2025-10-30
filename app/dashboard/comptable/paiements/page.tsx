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
  type: 'inscription' | 'scolarite';
  methode: 'online' | 'especes' | 'cheque' | 'virement' | 'mobile_money';
  statut: 'en_attente' | 'approuve' | 'rejete' | 'saisi_manuel';
  datePaiement: string;
  dateValidation?: string;
  validateurId?: string;
  reference: string;
  notes?: string;
  justificatif?: string;
}

interface ManualPaymentForm {
  studentId: string;
  type: 'inscription' | 'scolarite';
  montant: number;
  methode: 'especes' | 'cheque' | 'virement' | 'mobile_money';
  date: string;
  reference: string;
  notes: string;
  // Champs spécifiques selon la méthode
  banque?: string;
  numeroCheque?: string;
  numeroCompte?: string;
  operateurMobile?: string;
  numeroTelephone?: string;
  justificatifFile?: File;
}

type ManualPaymentFormField = keyof ManualPaymentForm;

export default function PaiementsComptablePage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
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
    notes: ''
  });

  // Données simulées
  useEffect(() => {
    const mockPayments: Payment[] = [
      {
        id: '1',
        studentId: 's1',
        studentName: 'Marie Dupont',
        parentName: 'M. Dupont',
        filiere: 'Développement Web',
        vague: 'Vague Janvier 2024',
        montant: 150000,
        type: 'scolarite',
        methode: 'online',
        statut: 'en_attente',
        datePaiement: '2024-01-20',
        reference: 'PAY-001',
        notes: 'Paiement partiel'
      },
      {
        id: '2',
        studentId: 's2',
        studentName: 'Pierre Martin',
        parentName: 'Mme. Martin',
        filiere: 'Data Science',
        vague: 'Vague Janvier 2024',
        montant: 200000,
        type: 'scolarite',
        methode: 'online',
        statut: 'en_attente',
        datePaiement: '2024-01-19',
        reference: 'PAY-002'
      },
      {
        id: '3',
        studentId: 's3',
        studentName: 'Sophie Bernard',
        parentName: 'M. Bernard',
        filiere: 'Design Graphique',
        vague: 'Vague Janvier 2024',
        montant: 50000,
        type: 'inscription',
        methode: 'especes',
        statut: 'saisi_manuel',
        datePaiement: '2024-01-18',
        dateValidation: '2024-01-18',
        reference: 'CASH-001',
        notes: 'Paiement en espèces reçu'
      },
      {
        id: '4',
        studentId: 's4',
        studentName: 'Thomas Moreau',
        parentName: 'M. Moreau',
        filiere: 'Réseaux & Sécurité',
        vague: 'Vague Janvier 2024',
        montant: 300000,
        type: 'scolarite',
        methode: 'virement',
        statut: 'approuve',
        datePaiement: '2024-01-17',
        dateValidation: '2024-01-17',
        reference: 'VIR-001'
      }
    ];
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
      online: { variant: 'default' as const, text: 'En ligne' },
      especes: { variant: 'secondary' as const, text: 'Espèces' },
      cheque: { variant: 'outline' as const, text: 'Chèque' },
      virement: { variant: 'default' as const, text: 'Virement' },
      mobile_money: { variant: 'secondary' as const, text: 'Mobile Money' }
    };
    return <Badge variant={config[methode].variant}>{config[methode].text}</Badge>;
  };

  const handleApprovePayment = (paymentId: string) => {
    setPayments(prev => prev.map(p => 
      p.id === paymentId 
        ? { ...p, statut: 'approuve', dateValidation: new Date().toISOString().split('T')[0] }
        : p
    ));
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

  const handleManualPaymentSubmit = () => {
    // Générer une référence automatique
    const reference = `MAN-${Date.now()}`;
    
    const newPayment: Payment = {
      id: `manual-${Date.now()}`,
      studentId: manualPaymentForm.studentId,
      studentName: "Élève sélectionné", // Remplacer par les vraies données
      parentName: "Parent sélectionné",
      filiere: "Filière sélectionnée",
      vague: "Vague sélectionnée",
      montant: manualPaymentForm.montant,
      type: manualPaymentForm.type,
      methode: manualPaymentForm.methode,
      statut: 'saisi_manuel',
      datePaiement: manualPaymentForm.date,
      reference: manualPaymentForm.reference || reference,
      notes: manualPaymentForm.notes
    };

    setPayments(prev => [newPayment, ...prev]);
    setIsManualPaymentModalOpen(false);
    
    // Reset du formulaire
    setManualPaymentForm({
      studentId: '',
      type: 'scolarite',
      montant: 0,
      methode: 'especes',
      date: new Date().toISOString().split('T')[0],
      reference: '',
      notes: ''
    });
  };

  const handleFormChange = (field: ManualPaymentFormField, value: string | number | File) => {
    setManualPaymentForm(prev => ({
      ...prev,
      [field]: value
    }));
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
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Gestion des Paiements</h1>
            <p className="text-gray-600 mt-1">Validation des paiements en ligne et saisie manuelle</p>
          </div>
          <div className="flex gap-3 mt-4 sm:mt-0">
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
                
                <div className="flex gap-3">
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
                      <TableHead>Filière</TableHead>
                      <TableHead>Type</TableHead>
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
                        <TableCell colSpan={8} className="text-center py-8">
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
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {payment.type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {getMethodBadge(payment.methode)}
                          </TableCell>
                          <TableCell className="font-semibold text-green-600">
                            {formatMoney(payment.montant)}
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

      {/* Modal de détail */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-2xl bg-white">
          <DialogHeader>
            <DialogTitle>Détails du Paiement</DialogTitle>
            <DialogDescription>
              Informations complètes sur le paiement
            </DialogDescription>
          </DialogHeader>
          
          {selectedPayment && (
            <div className="space-y-4 bg-white  h-screen overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-700">Élève</Label>
                  <p className="font-medium">{selectedPayment.studentName}</p>
                </div>
                <div>
                  <Label className="text-gray-700">Parent</Label>
                  <p className="font-medium">{selectedPayment.parentName}</p>
                </div>
                <div>
                  <Label className="text-gray-700">Filière</Label>
                  <p>{selectedPayment.filiere}</p>
                </div>
                <div>
                  <Label className="text-gray-700">Vague</Label>
                  <p>{selectedPayment.vague}</p>
                </div>
                <div>
                  <Label className="text-gray-700">Type</Label>
                  <Badge variant="outline" className="capitalize">
                    {selectedPayment.type}
                  </Badge>
                </div>
                <div>
                  <Label className="text-gray-700">Méthode</Label>
                  {getMethodBadge(selectedPayment.methode)}
                </div>
                <div>
                  <Label className="text-gray-700">Montant</Label>
                  <p className="font-bold text-green-600 text-lg">
                    {formatMoney(selectedPayment.montant)}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-700">Statut</Label>
                  {getStatusBadge(selectedPayment.statut)}
                </div>
                <div>
                  <Label className="text-gray-700">Date Paiement</Label>
                  <p>{new Date(selectedPayment.datePaiement).toLocaleDateString('fr-FR')}</p>
                </div>
                {selectedPayment.dateValidation && (
                  <div>
                    <Label className="text-gray-700">Date Validation</Label>
                    <p>{new Date(selectedPayment.dateValidation).toLocaleDateString('fr-FR')}</p>
                  </div>
                )}
                <div className="col-span-2">
                  <Label className="text-gray-700">Référence</Label>
                  <p className="font-mono">{selectedPayment.reference}</p>
                </div>
                {selectedPayment.notes && (
                  <div className="col-span-2">
                    <Label className="text-gray-700">Notes</Label>
                    <p className="text-sm bg-gray-50 p-2 rounded">{selectedPayment.notes}</p>
                  </div>
                )}
              </div>

              {selectedPayment.statut === 'en_attente' && (
                <div className="flex gap-3 pt-4 border-t ">
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
        <DialogContent className="max-w-2xl bg-white">
          <DialogHeader>
            <DialogTitle>Saisir un Paiement Manuel</DialogTitle>
            <DialogDescription>
              Enregistrer un paiement reçu physiquement
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4 bg-white ">
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
                  <SelectItem value="s1">Marie Dupont (Dev Web)</SelectItem>
                  <SelectItem value="s2">Pierre Martin (Data Science)</SelectItem>
                  <SelectItem value="s3">Sophie Bernard (Design)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type" className="text-gray-700">Type *</Label>
              <Select 
                value={manualPaymentForm.type}
                onValueChange={(value: 'inscription' | 'scolarite') => handleFormChange('type', value)}
              >
                <SelectTrigger className="bg-white border-gray-300">
                  <SelectValue placeholder="Type de paiement" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inscription">Inscription</SelectItem>
                  <SelectItem value="scolarite">Scolarité</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="montant" className="text-gray-700">Montant (FCFA) *</Label>
              <Input 
                type="number" 
                placeholder="0"
                value={manualPaymentForm.montant || ''}
                onChange={(e) => handleFormChange('montant', parseInt(e.target.value) || 0)}
                className="bg-white border-gray-300"
              />
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