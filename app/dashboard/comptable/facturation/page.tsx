// app/dashboard/comptable/facturations/page.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Download, Eye, FileText, 
  CreditCard, Printer, Mail, CheckCircle, Plus
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

interface Facture {
  id: string;
  numero: string;
  paymentId: string;
  studentId: string;
  studentName: string;
  parentName: string;
  parentEmail: string;
  filiere: string;
  vague: string;
  typePaiement: 'inscription' | 'scolarite' | 'frais_divers';
  methodePaiement: 'especes' | 'cheque' | 'virement' | 'mobile_money';
  datePaiement: string;
  dateFacturation: string;
  montant: number;
  statut: 'generee' | 'envoyee' | 'annulee';
  items: FactureItem[];
  notes?: string;
  semester?: string;
}

interface FactureItem {
  id: string;
  description: string;
  quantite: number;
  prixUnitaire: number;
  montant: number;
}

interface GenerateFactureForm {
  studentId: string;
  typePaiement: 'inscription' | 'scolarite' | 'frais_divers';
  methodePaiement: 'especes' | 'cheque' | 'virement' | 'mobile_money';
  datePaiement: string;
  montant: number;
  description: string;
  notes: string;
  semester?: string;
  // Champs spécifiques
  banque?: string;
  numeroCheque?: string;
  numeroCompte?: string;
  operateurMobile?: string;
  numeroTelephone?: string;
}

export default function FacturationsPage() {
  const [factures, setFactures] = useState<Facture[]>([]);
  const [filteredFactures, setFilteredFactures] = useState<Facture[]>([]);
  const [selectedStatut, setSelectedStatut] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFacture, setSelectedFacture] = useState<Facture | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);

  const [generateForm, setGenerateForm] = useState<GenerateFactureForm>({
    studentId: '',
    typePaiement: 'scolarite',
    methodePaiement: 'especes',
    datePaiement: new Date().toISOString().split('T')[0],
    montant: 0,
    description: '',
    notes: '',
    semester: ''
  });

  // Données simulées pour les élèves avec semestres
  const students = [
    { 
      id: 's1', 
      name: 'Marie Dupont', 
      parent: 'M. Dupont', 
      email: 'parent.dupont@email.com', 
      filiere: 'Développement Web', 
      vague: 'Vague Janvier 2024',
      paidSemesters: ['Semestre 1'],
      pendingSemesters: ['Semestre 2', 'Semestre 3'],
      paidAmount: 345000,
      remainingAmount: 590000
    },
    { 
      id: 's2', 
      name: 'Pierre Martin', 
      parent: 'Mme. Martin', 
      email: 'martin.parent@email.com', 
      filiere: 'Data Science', 
      vague: 'Vague Janvier 2024',
      paidSemesters: [],
      pendingSemesters: ['Semestre 1', 'Semestre 2', 'Semestre 3'],
      paidAmount: 0,
      remainingAmount: 935000
    },
    { 
      id: 's3', 
      name: 'Sophie Bernard', 
      parent: 'M. Bernard', 
      email: 'bernard.famille@email.com', 
      filiere: 'Design Graphique', 
      vague: 'Vague Janvier 2024',
      paidSemesters: ['Semestre 1', 'Semestre 2'],
      pendingSemesters: ['Semestre 3'],
      paidAmount: 590000,
      remainingAmount: 295000
    },
  ];

  // Données simulées - Factures générées automatiquement après paiement
  useEffect(() => {
    const mockFactures: Facture[] = [
      {
        id: '1',
        numero: 'FACT-2024-001',
        paymentId: 'PAY-001',
        studentId: 's1',
        studentName: 'Marie Dupont',
        parentName: 'M. Dupont',
        parentEmail: 'parent.dupont@email.com',
        filiere: 'Développement Web',
        vague: 'Vague Janvier 2024',
        typePaiement: 'inscription',
        methodePaiement: 'especes',
        datePaiement: '2024-01-15',
        dateFacturation: '2024-01-15',
        montant: 50000,
        statut: 'envoyee',
        items: [
          {
            id: '1',
            description: 'Frais d\'inscription - Développement Web',
            quantite: 1,
            prixUnitaire: 50000,
            montant: 50000
          }
        ],
        notes: 'Paiement en espèces reçu à l\'accueil'
      },
      {
        id: '2',
        numero: 'FACT-2024-002',
        paymentId: 'PAY-002',
        studentId: 's1',
        studentName: 'Marie Dupont',
        parentName: 'M. Dupont',
        parentEmail: 'parent.dupont@email.com',
        filiere: 'Développement Web',
        vague: 'Vague Janvier 2024',
        typePaiement: 'scolarite',
        methodePaiement: 'virement',
        datePaiement: '2024-01-20',
        dateFacturation: '2024-01-20',
        montant: 295000,
        statut: 'generee',
        semester: 'Semestre 1',
        items: [
          {
            id: '1',
            description: 'Frais de scolarité - Semestre 1',
            quantite: 1,
            prixUnitaire: 295000,
            montant: 295000
          }
        ],
        notes: 'Paiement par virement bancaire'
      },
      {
        id: '3',
        numero: 'FACT-2024-003',
        paymentId: 'PAY-003',
        studentId: 's3',
        studentName: 'Sophie Bernard',
        parentName: 'M. Bernard',
        parentEmail: 'bernard.famille@email.com',
        filiere: 'Design Graphique',
        vague: 'Vague Janvier 2024',
        typePaiement: 'scolarite',
        methodePaiement: 'mobile_money',
        datePaiement: '2024-02-15',
        dateFacturation: '2024-02-15',
        montant: 295000,
        statut: 'generee',
        semester: 'Semestre 2',
        items: [
          {
            id: '1',
            description: 'Frais de scolarité - Semestre 2',
            quantite: 1,
            prixUnitaire: 295000,
            montant: 295000
          }
        ],
        notes: 'Paiement par Orange Money'
      }
    ];
    setFactures(mockFactures);
    setFilteredFactures(mockFactures);
  }, []);

  // Filtrage
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

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF'
    }).format(amount);
  };

  const formatFCFA = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
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
    
    if (methode in config) {
      return <Badge variant={config[methode].variant}>{config[methode].text}</Badge>;
    }
    
    return <Badge variant="outline">{methode}</Badge>;
  };

  const handleViewDetails = (facture: Facture) => {
    setSelectedFacture(facture);
    setIsDetailModalOpen(true);
  };

  const handleSendFacture = (facture: Facture) => {
    setSelectedFacture(facture);
    setIsSendModalOpen(true);
  };

  const confirmSendFacture = () => {
    if (selectedFacture) {
      setFactures(prev => prev.map(f => 
        f.id === selectedFacture.id 
          ? { ...f, statut: 'envoyee' }
          : f
      ));
    }
    setIsSendModalOpen(false);
    setSelectedFacture(null);
  };

  const generateFacturePDF = (facture: Facture) => {
    console.log('Génération PDF pour:', facture.numero);
    alert(`PDF de la facture ${facture.numero} généré avec succès!`);
  };

  // Fonction pour obtenir les semestres disponibles pour un élève
  const getAvailableSemesters = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return [];
    
    return student.pendingSemesters;
  };

  // Fonction pour générer une nouvelle facture
  const handleGenerateFacture = () => {
    if (!generateForm.studentId || !generateForm.montant || !generateForm.description) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const student = students.find(s => s.id === generateForm.studentId);
    if (!student) return;

    // Générer un numéro de facture unique
    const factureCount = factures.length + 1;
    const numero = `FACT-2024-${factureCount.toString().padStart(3, '0')}`;
    const paymentId = `PAY-${Date.now()}`;

    const newFacture: Facture = {
      id: `fact-${Date.now()}`,
      numero,
      paymentId,
      studentId: generateForm.studentId,
      studentName: student.name,
      parentName: student.parent,
      parentEmail: student.email,
      filiere: student.filiere,
      vague: student.vague,
      typePaiement: generateForm.typePaiement,
      methodePaiement: generateForm.methodePaiement,
      datePaiement: generateForm.datePaiement,
      dateFacturation: new Date().toISOString().split('T')[0],
      montant: generateForm.montant,
      statut: 'generee',
      semester: generateForm.typePaiement === 'scolarite' ? generateForm.semester : undefined,
      items: [
        {
          id: '1',
          description: generateForm.description,
          quantite: 1,
          prixUnitaire: generateForm.montant,
          montant: generateForm.montant
        }
      ],
      notes: generateForm.notes
    };

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
  };

  const handleFormChange = (field: keyof GenerateFactureForm, value: string | number) => {
    const updatedForm = {
      ...generateForm,
      [field]: value
    };

    // Si l'élève ou le type change, réinitialiser le semestre
    if (field === 'studentId' || field === 'typePaiement') {
      updatedForm.semester = '';
    }

    setGenerateForm(updatedForm);
  };

  // Rendu des champs spécifiques selon la méthode de paiement
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
                value={generateForm.banque || ''}
                onChange={(e) => handleFormChange('banque', e.target.value)}
                className="bg-white border-gray-300"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="numeroCheque">Numéro de chèque</Label>
              <Input 
                id="numeroCheque"
                placeholder="Numéro du chèque"
                value={generateForm.numeroCheque || ''}
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
                value={generateForm.banque || ''}
                onChange={(e) => handleFormChange('banque', e.target.value)}
                className="bg-white border-gray-300"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="numeroCompte">Numéro de compte</Label>
              <Input 
                id="numeroCompte"
                placeholder="Numéro de compte"
                value={generateForm.numeroCompte || ''}
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
              <Select 
                value={generateForm.operateurMobile || ''}
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
              <Label htmlFor="numeroTelephone">Numéro de téléphone</Label>
              <Input 
                id="numeroTelephone"
                placeholder="Numéro de téléphone"
                value={generateForm.numeroTelephone || ''}
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

  const stats = {
    totalFactures: factures.length,
    totalGenerees: factures.filter(f => f.statut === 'generee').length,
    totalEnvoyees: factures.filter(f => f.statut === 'envoyee').length,
    totalInscriptions: factures.filter(f => f.typePaiement === 'inscription').length,
    totalScolarite: factures.filter(f => f.typePaiement === 'scolarite').length,
    montantTotal: factures.reduce((sum, f) => sum + f.montant, 0)
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 lg:pl-5 pt-20 lg:pt-6">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Gestion des Factures</h1>
            <p className="text-gray-600 mt-1">Factures générées automatiquement après paiement</p>
          </div>
          <div className="flex gap-3 mt-4 sm:mt-0 flex flex-col">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
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
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Rechercher par élève, parent, n° facture ou filière..."
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
                      <SelectItem value="generee">Générée</SelectItem>
                      <SelectItem value="envoyee">Envoyée</SelectItem>
                      <SelectItem value="annulee">Annulée</SelectItem>
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
        <DialogContent className="max-w-2xl bg-white h-screen overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Générer une Nouvelle Facture</DialogTitle>
            <DialogDescription>
              Créer une facture manuellement pour un paiement reçu
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4 bg-white">
            <div className="space-y-2">
              <Label htmlFor="student" className="text-gray-700">Élève *</Label>
              <Select 
                value={generateForm.studentId}
                onValueChange={(value) => handleFormChange('studentId', value)}
              >
                <SelectTrigger className="bg-white border-gray-300">
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent className="w-12 bg-white">
                  {students.map(student => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.name} - {student.filiere} ({student.parent})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="typePaiement" className="text-gray-700">Type de Paiement *</Label>
              <Select
                value={generateForm.typePaiement}
                onValueChange={(value: 'inscription' | 'scolarite' | 'frais_divers') => handleFormChange('typePaiement', value)}
              >
                <SelectTrigger className=" border-gray-300">
                  <SelectValue placeholder="Type de paiement" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="inscription">Inscription</SelectItem>
                  <SelectItem value="scolarite">Scolarité</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Champ Semestre - seulement pour les paiements de scolarité */}
            {generateForm.typePaiement === 'scolarite' && generateForm.studentId && (
              <div className="space-y-2">
                <Label htmlFor="semester" className="text-gray-700">Semestre *</Label>
                <Select 
                  value={generateForm.semester || ''}
                  onValueChange={(value) => handleFormChange('semester', value)}
                >
                  <SelectTrigger className="bg-white border-gray-300">
                    <SelectValue placeholder="Sélectionner un semestre" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {getAvailableSemesters(generateForm.studentId).map(semester => (
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
                onValueChange={(value: 'especes' | 'cheque' | 'virement' | 'mobile_money') => handleFormChange('methodePaiement', value)}
              >
                <SelectTrigger className="bg-white border-gray-300">
                  <SelectValue placeholder="Méthode de paiement" />
                </SelectTrigger>
                <SelectContent className="bg-white">
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

            <div className="space-y-2">
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

            <div className="col-span-2 space-y-2">
              <Label htmlFor="notes" className="text-gray-700">Notes</Label>
              <Textarea 
                placeholder="Informations complémentaires..."
                value={generateForm.notes}
                onChange={(e) => handleFormChange('notes', e.target.value)}
                className="bg-white border-gray-300"
                rows={3}
              />
            </div>

            {/* Aperçu de la facture */}
            {generateForm.studentId && generateForm.montant > 0 && (
              <div className="col-span-2 mt-4">
                <Card className="bg-blue-50 border-blue-200">
                  <CardHeader>
                    <CardTitle className="text-sm">Aperçu de la Facture</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p><strong>Élève:</strong> {students.find(s => s.id === generateForm.studentId)?.name}</p>
                        <p><strong>Parent:</strong> {students.find(s => s.id === generateForm.studentId)?.parent}</p>
                        <p><strong>Type:</strong> {generateForm.typePaiement}</p>
                        {generateForm.semester && <p><strong>Semestre:</strong> {generateForm.semester}</p>}
                      </div>
                      <div>
                        <p><strong>Méthode:</strong> {generateForm.methodePaiement}</p>
                        <p><strong>Date:</strong> {new Date(generateForm.datePaiement).toLocaleDateString('fr-FR')}</p>
                        <p><strong>Montant:</strong> {formatMoney(generateForm.montant)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          <DialogFooter className="bg-white">
            <Button variant="outline" onClick={() => setIsGenerateModalOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleGenerateFacture}>
              <FileText className="h-4 w-4 mr-2" />
              Générer la Facture
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de détail de facture - Version simplifiée et professionnelle */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>Détails de la Facture</DialogTitle>
          </DialogHeader>
          
          {selectedFacture && (
            <div className="space-y-4 bg-white">
              {/* Informations essentielles */}
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
                    {formatFCFA(selectedFacture.montant)}
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

              {/* Situation financière de l'élève */}
              {selectedFacture.studentId && (
                <Card className="mt-4">
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Situation Financière</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total payé:</span>
                        <span className="font-semibold text-green-600">
                          {formatFCFA(students.find(s => s.id === selectedFacture.studentId)?.paidAmount || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Reste à payer:</span>
                        <span className="font-semibold text-orange-600">
                          {formatFCFA(students.find(s => s.id === selectedFacture.studentId)?.remainingAmount || 0)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Actions */}
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
        <DialogContent className="bg-white">
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
  );
}