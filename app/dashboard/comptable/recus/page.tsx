// app/dashboard/comptable/recus-quittances/page.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Filter, Download, Eye, FileText, 
  Printer, Mail, CheckCircle, Receipt
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

interface Quittance {
  id: string;
  numero: string;
  paymentId?: string;
  studentId: string;
  studentName: string;
  parentName: string;
  parentEmail: string;
  filiere: string;
  vague: string;
  type: 'inscription' | 'scolarite' | 'solde' | 'frais_divers';
  methodePaiement: 'online' | 'especes' | 'cheque' | 'virement' | 'mobile_money';
  montant: number;
  soldeRestant?: number;
  datePaiement: string;
  dateEmission: string;
  statut: 'genere' | 'envoye' | 'annule';
  notes?: string;
  origine: 'automatique' | 'manuelle';
  mentionSpeciale?: string;
}

interface ManualQuittanceForm {
  studentId: string;
  parentName: string;
  parentEmail: string;
  filiere: string;
  vague: string;
  type: 'inscription' | 'scolarite' | 'solde' | 'frais_divers';
  methodePaiement: 'especes' | 'cheque' | 'virement' | 'mobile_money';
  montant: number;
  soldeRestant?: number;
  datePaiement: string;
  notes: string;
  mentionSpeciale: string;
}

export default function RecusQuittancesPage() {
  const [quittances, setQuittances] = useState<Quittance[]>([]);
  const [filteredQuittances, setFilteredQuittances] = useState<Quittance[]>([]);
  const [selectedStatut, setSelectedStatut] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedOrigine, setSelectedOrigine] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedQuittance, setSelectedQuittance] = useState<Quittance | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [manualQuittanceForm, setManualQuittanceForm] = useState<ManualQuittanceForm>({
    studentId: '',
    parentName: '',
    parentEmail: '',
    filiere: '',
    vague: '',
    type: 'scolarite',
    methodePaiement: 'especes',
    montant: 0,
    datePaiement: new Date().toISOString().split('T')[0],
    notes: '',
    mentionSpeciale: ''
  });

  // Données simulées
  useEffect(() => {
    const mockQuittances: Quittance[] = [
      {
        id: '1',
        numero: 'QUIT-2024-001',
        paymentId: 'PAY-001',
        studentId: 's1',
        studentName: 'Marie Dupont',
        parentName: 'M. Dupont',
        parentEmail: 'parent.dupont@email.com',
        filiere: 'Développement Web',
        vague: 'Vague Janvier 2024',
        type: 'inscription',
        methodePaiement: 'online',
        montant: 50000,
        datePaiement: '2024-01-15',
        dateEmission: '2024-01-15',
        statut: 'envoye',
        origine: 'automatique',
        mentionSpeciale: 'Frais d&apos;inscription acquittés'
      },
      {
        id: '2',
        numero: 'QUIT-2024-002',
        paymentId: 'PAY-002',
        studentId: 's2',
        studentName: 'Pierre Martin',
        parentName: 'Mme. Martin',
        parentEmail: 'martin.parent@email.com',
        filiere: 'Data Science',
        vague: 'Vague Janvier 2024',
        type: 'scolarite',
        methodePaiement: 'virement',
        montant: 200000,
        soldeRestant: 150000,
        datePaiement: '2024-01-20',
        dateEmission: '2024-01-20',
        statut: 'genere',
        origine: 'automatique',
        notes: 'Acompte sur frais de scolarité'
      },
      {
        id: '3',
        numero: 'QUIT-2024-003',
        studentId: 's5',
        studentName: 'Jean Koffi',
        parentName: 'M. Koffi',
        parentEmail: 'koffi.jean@email.com',
        filiere: 'Développement Web',
        vague: 'Vague Janvier 2024',
        type: 'frais_divers',
        methodePaiement: 'especes',
        montant: 25000,
        datePaiement: '2024-01-25',
        dateEmission: '2024-01-25',
        statut: 'genere',
        origine: 'manuelle',
        notes: 'Paiement en espèces pour matériel pédagogique',
        mentionSpeciale: 'SOLDE ACQUITTÉ'
      },
      {
        id: '4',
        numero: 'QUIT-2024-004',
        paymentId: 'PAY-003',
        studentId: 's3',
        studentName: 'Sophie Bernard',
        parentName: 'M. Bernard',
        parentEmail: 'bernard.famille@email.com',
        filiere: 'Design Graphique',
        vague: 'Vague Janvier 2024',
        type: 'solde',
        methodePaiement: 'mobile_money',
        montant: 150000,
        soldeRestant: 0,
        datePaiement: '2024-02-01',
        dateEmission: '2024-02-01',
        statut: 'envoye',
        origine: 'automatique',
        mentionSpeciale: 'SOLDE ACQUITTÉ'
      }
    ];
    setQuittances(mockQuittances);
    setFilteredQuittances(mockQuittances);
  }, []);

  // Filtrage
  useEffect(() => {
    let result = quittances;

    if (selectedStatut !== 'all') {
      result = result.filter(q => q.statut === selectedStatut);
    }

    if (selectedType !== 'all') {
      result = result.filter(q => q.type === selectedType);
    }

    if (selectedOrigine !== 'all') {
      result = result.filter(q => q.origine === selectedOrigine);
    }

    if (searchTerm) {
      result = result.filter(q => 
        q.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.parentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.filiere.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredQuittances(result);
  }, [quittances, selectedStatut, selectedType, selectedOrigine, searchTerm]);

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF'
    }).format(amount);
  };

  const getStatusBadge = (statut: Quittance['statut']) => {
    const config = {
      genere: { variant: 'secondary' as const, text: 'Généré', icon: FileText },
      envoye: { variant: 'default' as const, text: 'Envoyé', icon: CheckCircle },
      annule: { variant: 'destructive' as const, text: 'Annulé', icon: FileText }
    };
    const { variant, text, icon: Icon } = config[statut];
    
    return (
      <Badge variant={variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {text}
      </Badge>
    );
  };

  const getTypeBadge = (type: Quittance['type']) => {
  const config = {
    inscription: { 
      variant: 'outline' as const, 
      text: 'Inscription',
      className: '' // ✅ Ajouter pour tous les types
    },
    scolarite: { 
      variant: 'default' as const, 
      text: 'Scolarité',
      className: ''
    },
    solde: { 
      variant: 'default' as const, 
      text: 'Solde', 
      className: 'bg-green-600' 
    },
    frais_divers: { 
      variant: 'secondary' as const, 
      text: 'Frais divers',
      className: ''
    }
  };
  const { variant, text, className } = config[type];
  
  return (
    <Badge variant={variant} className={className}>
      {text}
    </Badge>
  );
};
  const getMethodBadge = (methode: Quittance['methodePaiement']) => {
    const config = {
      online: { variant: 'default' as const, text: 'En ligne' },
      especes: { variant: 'secondary' as const, text: 'Espèces' },
      cheque: { variant: 'outline' as const, text: 'Chèque' },
      virement: { variant: 'default' as const, text: 'Virement' },
      mobile_money: { variant: 'secondary' as const, text: 'Mobile Money' }
    };
    return <Badge variant={config[methode].variant}>{config[methode].text}</Badge>;
  };

  const getOrigineBadge = (origine: Quittance['origine']) => {
    const config = {
      automatique: { variant: 'default' as const, text: 'Auto' },
      manuelle: { variant: 'outline' as const, text: 'Manuelle' }
    };
    return <Badge variant={config[origine].variant}>{config[origine].text}</Badge>;
  };

  const handleViewDetails = (quittance: Quittance) => {
    setSelectedQuittance(quittance);
    setIsDetailModalOpen(true);
  };

  const handleSendQuittance = (quittance: Quittance) => {
    setSelectedQuittance(quittance);
    setIsSendModalOpen(true);
  };

  const confirmSendQuittance = () => {
    if (selectedQuittance) {
      setQuittances(prev => prev.map(q => 
        q.id === selectedQuittance.id 
          ? { ...q, statut: 'envoye' }
          : q
      ));
    }
    setIsSendModalOpen(false);
    setSelectedQuittance(null);
  };

  const generateQuittancePDF = (quittance: Quittance) => {
    // Simulation de génération PDF
    console.log('Génération PDF pour:', quittance.numero);
    alert(`PDF de la quittance ${quittance.numero} généré avec succès!`);
  };

  const handleCreateManualQuittance = () => {
    // Génération du numéro de quittance
    const nouveauNumero = `QUIT-2024-${String(quittances.length + 1).padStart(3, '0')}`;
    
    const nouvelleQuittance: Quittance = {
      id: `manual-${Date.now()}`,
      numero: nouveauNumero,
      studentId: manualQuittanceForm.studentId,
      studentName: "Élève sélectionné",
      parentName: manualQuittanceForm.parentName,
      parentEmail: manualQuittanceForm.parentEmail,
      filiere: manualQuittanceForm.filiere,
      vague: manualQuittanceForm.vague,
      type: manualQuittanceForm.type,
      methodePaiement: manualQuittanceForm.methodePaiement,
      montant: manualQuittanceForm.montant,
      soldeRestant: manualQuittanceForm.soldeRestant,
      datePaiement: manualQuittanceForm.datePaiement,
      dateEmission: new Date().toISOString().split('T')[0],
      statut: 'genere',
      notes: manualQuittanceForm.notes,
      mentionSpeciale: manualQuittanceForm.mentionSpeciale,
      origine: 'manuelle'
    };

    setQuittances(prev => [nouvelleQuittance, ...prev]);
    setIsCreateModalOpen(false);
    
    // Reset du formulaire
    setManualQuittanceForm({
      studentId: '',
      parentName: '',
      parentEmail: '',
      filiere: '',
      vague: '',
      type: 'scolarite',
      methodePaiement: 'especes',
      montant: 0,
      datePaiement: new Date().toISOString().split('T')[0],
      notes: '',
      mentionSpeciale: ''
    });
  };

  const handleFormChange = (field: keyof ManualQuittanceForm, value: string | number) => {
    setManualQuittanceForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const stats = {
    totalQuittances: quittances.length,
    totalGenerees: quittances.filter(q => q.statut === 'genere').length,
    totalEnvoyees: quittances.filter(q => q.statut === 'envoye').length,
    totalAutomatiques: quittances.filter(q => q.origine === 'automatique').length,
    totalManuelles: quittances.filter(q => q.origine === 'manuelle').length,
    montantTotalQuitte: quittances.reduce((sum, q) => sum + q.montant, 0),
    quittancesInscription: quittances.filter(q => q.type === 'inscription').length,
    quittancesScolarite: quittances.filter(q => q.type === 'scolarite').length,
    quittancesSolde: quittances.filter(q => q.type === 'solde').length
  };

  const vagues = [
    'Vague Janvier 2024',
    'Vague Juillet 2024',
    'Vague Septembre 2024'
  ];

  const students = [
    { id: 's1', name: 'Marie Dupont', parent: 'M. Dupont', email: 'parent.dupont@email.com', filiere: 'Développement Web' },
    { id: 's2', name: 'Pierre Martin', parent: 'Mme. Martin', email: 'martin.parent@email.com', filiere: 'Data Science' },
    { id: 's3', name: 'Sophie Bernard', parent: 'M. Bernard', email: 'bernard.famille@email.com', filiere: 'Design Graphique' },
    { id: 's4', name: 'Thomas Moreau', parent: 'M. Moreau', email: 'moreau.t@email.com', filiere: 'Réseaux & Sécurité' }
  ];

  const getMentionSpecialeDefault = (type: Quittance['type'], soldeRestant?: number) => {
    if (type === 'solde' && soldeRestant === 0) {
      return 'SOLDE ACQUITTÉ';
    }
    if (type === 'inscription') {
      return 'Frais d&apos;inscription acquittés';
    }
    if (type === 'scolarite' && soldeRestant && soldeRestant > 0) {
      return `Acompte - Solde restant: ${formatMoney(soldeRestant)}`;
    }
    return '';
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 lg:pl-5 pt-20 lg:pt-6">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Reçus &amp; Quittances</h1>
            <p className="text-gray-600 mt-1">Gestion des preuves de paiement et documents d&apos;acquittement</p>
          </div>
          <div className="flex gap-3 mt-4 sm:mt-0">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Générer Quittance
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
                <CardTitle className="text-sm font-medium">Total Quittances</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.totalQuittances}</div>
                <p className="text-xs text-gray-600 mt-1">{stats.totalAutomatiques} auto / {stats.totalManuelles} manuelles</p>
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
                <p className="text-xs text-gray-600 mt-1">quittances envoyées</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Montant Acquitté</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {formatMoney(stats.montantTotalQuitte)}
                </div>
                <p className="text-xs text-gray-600 mt-1">total des règlements</p>
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
                      placeholder="Rechercher par élève, parent, n° quittance..."
                      className="pl-10 bg-white border-gray-300"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <Select value={selectedStatut} onValueChange={setSelectedStatut}>
                    <SelectTrigger className="w-[140px] bg-white border-gray-300">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Tous statuts" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous statuts</SelectItem>
                      <SelectItem value="genere">Généré</SelectItem>
                      <SelectItem value="envoye">Envoyé</SelectItem>
                      <SelectItem value="annule">Annulé</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger className="w-[140px] bg-white border-gray-300">
                      <Receipt className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Tous types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous types</SelectItem>
                      <SelectItem value="inscription">Inscription</SelectItem>
                      <SelectItem value="scolarite">Scolarité</SelectItem>
                      <SelectItem value="solde">Solde</SelectItem>
                      <SelectItem value="frais_divers">Frais divers</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={selectedOrigine} onValueChange={setSelectedOrigine}>
                    <SelectTrigger className="w-[140px] bg-white border-gray-300">
                      <FileText className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Toutes origines" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes origines</SelectItem>
                      <SelectItem value="automatique">Automatique</SelectItem>
                      <SelectItem value="manuelle">Manuelle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tableau des quittances */}
          <Card>
            <CardHeader>
              <CardTitle>Reçus &amp; Quittances</CardTitle>
              <CardDescription>
                {filteredQuittances.length} quittance(s) trouvée(s) - Documents officiels d&apos;acquittement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>N° Quittance</TableHead>
                      <TableHead>Élève &amp; Parent</TableHead>
                      <TableHead>Filière</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Méthode</TableHead>
                      <TableHead>Origine</TableHead>
                      <TableHead>Montant</TableHead>
                      <TableHead>Date Paiement</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredQuittances.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-8">
                          <div className="text-gray-500">
                            Aucune quittance trouvée
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredQuittances.map((quittance) => (
                        <TableRow key={quittance.id}>
                          <TableCell className="font-mono font-medium">
                            {quittance.numero}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{quittance.studentName}</div>
                              <div className="text-sm text-gray-600">{quittance.parentName}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{quittance.filiere}</div>
                              <div className="text-gray-600 text-xs">{quittance.vague}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {getTypeBadge(quittance.type)}
                          </TableCell>
                          <TableCell>
                            {getMethodBadge(quittance.methodePaiement)}
                          </TableCell>
                          <TableCell>
                            {getOrigineBadge(quittance.origine)}
                          </TableCell>
                          <TableCell className="font-semibold text-green-600">
                            {formatMoney(quittance.montant)}
                            {quittance.soldeRestant !== undefined && quittance.soldeRestant > 0 && (
                              <div className="text-xs text-orange-600">
                                Solde: {formatMoney(quittance.soldeRestant)}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {new Date(quittance.datePaiement).toLocaleDateString('fr-FR')}
                            </div>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(quittance.statut)}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleViewDetails(quittance)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => generateQuittancePDF(quittance)}
                              >
                                <Printer className="h-4 w-4" />
                              </Button>

                              {quittance.statut === 'genere' && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleSendQuittance(quittance)}
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

      {/* Modal de création manuelle de quittance */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-2xl bg-white">
          <DialogHeader>
            <DialogTitle>Générer une Quittance Manuelle</DialogTitle>
            <DialogDescription>
              Créer un reçu ou quittance officiel pour un paiement reçu
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 bg-white max-h-[50vh] overflow-y-auto">
            {/* Informations de base */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="student" className="text-gray-700">Élève *</Label>
                <Select 
                  value={manualQuittanceForm.studentId}
                  onValueChange={(value) => {
                    const student = students.find(s => s.id === value);
                    if (student) {
                      setManualQuittanceForm(prev => ({
                        ...prev,
                        studentId: value,
                        parentName: student.parent,
                        parentEmail: student.email,
                        filiere: student.filiere
                      }));
                    }
                  }}
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
                <Label htmlFor="vague" className="text-gray-700">Vague *</Label>
                <Select 
                  value={manualQuittanceForm.vague}
                  onValueChange={(value) => handleFormChange('vague', value)}
                >
                  <SelectTrigger className="bg-white border-gray-300">
                    <SelectValue placeholder="Sélectionner une vague" />
                  </SelectTrigger>
                  <SelectContent>
                    {vagues.map(vague => (
                      <SelectItem key={vague} value={vague}>
                        {vague}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="parentName" className="text-gray-700">Nom du Parent *</Label>
                <Input 
                  value={manualQuittanceForm.parentName}
                  onChange={(e) => handleFormChange('parentName', e.target.value)}
                  className="bg-white border-gray-300"
                  placeholder="Nom complet du parent"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="parentEmail" className="text-gray-700">Email du Parent</Label>
                <Input 
                  type="email"
                  value={manualQuittanceForm.parentEmail}
                  onChange={(e) => handleFormChange('parentEmail', e.target.value)}
                  className="bg-white border-gray-300"
                  placeholder="email@exemple.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type" className="text-gray-700">Type de Quittance *</Label>
                <Select 
                  value={manualQuittanceForm.type}
                  onValueChange={(value: 'inscription' | 'scolarite' | 'solde' | 'frais_divers') => {
                    handleFormChange('type', value);
                    // Mettre à jour la mention spéciale par défaut
                    const mention = getMentionSpecialeDefault(value, manualQuittanceForm.soldeRestant);
                    handleFormChange('mentionSpeciale', mention);
                  }}
                >
                  <SelectTrigger className="bg-white border-gray-300">
                    <SelectValue placeholder="Type de quittance" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inscription">Inscription</SelectItem>
                    <SelectItem value="scolarite">Scolarité</SelectItem>
                    <SelectItem value="solde">Solde</SelectItem>
                    <SelectItem value="frais_divers">Frais divers</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="methodePaiement" className="text-gray-700">Méthode de Paiement *</Label>
                <Select 
                  value={manualQuittanceForm.methodePaiement}
                  onValueChange={(value: 'especes' | 'cheque' | 'virement' | 'mobile_money') => handleFormChange('methodePaiement', value)}
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
                  value={manualQuittanceForm.datePaiement}
                  onChange={(e) => handleFormChange('datePaiement', e.target.value)}
                  className="bg-white border-gray-300"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="filiere" className="text-gray-700">Filière *</Label>
                <Input 
                  value={manualQuittanceForm.filiere}
                  onChange={(e) => handleFormChange('filiere', e.target.value)}
                  className="bg-white border-gray-300"
                  placeholder="Filière de l&apos;élève"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="montant" className="text-gray-700">Montant (FCFA) *</Label>
                <Input 
                  type="number"
                  value={manualQuittanceForm.montant || ''}
                  onChange={(e) => handleFormChange('montant', parseInt(e.target.value) || 0)}
                  className="bg-white border-gray-300"
                  placeholder="0"
                />
              </div>

              {(manualQuittanceForm.type === 'scolarite' || manualQuittanceForm.type === 'solde') && (
                <div className="space-y-2">
                  <Label htmlFor="soldeRestant" className="text-gray-700">Solde Restant (FCFA)</Label>
                  <Input 
                    type="number"
                    value={manualQuittanceForm.soldeRestant || ''}
                    onChange={(e) => {
                      const soldeRestant = parseInt(e.target.value) || 0;
                      handleFormChange('soldeRestant', soldeRestant);
                      // Mettre à jour la mention spéciale
                      const mention = getMentionSpecialeDefault(manualQuittanceForm.type, soldeRestant);
                      handleFormChange('mentionSpeciale', mention);
                    }}
                    className="bg-white border-gray-300"
                    placeholder="0"
                  />
                </div>
              )}
            </div>

            {/* Mention spéciale */}
            <div className="space-y-2">
              <Label htmlFor="mentionSpeciale" className="text-gray-700">Mention Spéciale</Label>
              <Input 
                value={manualQuittanceForm.mentionSpeciale}
                onChange={(e) => handleFormChange('mentionSpeciale', e.target.value)}
                className="bg-white border-gray-300"
                placeholder="Ex: SOLDE ACQUITTÉ, Acompte, etc."
              />
              <p className="text-xs text-gray-500">
                Cette mention apparaîtra en évidence sur le document
              </p>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-gray-700">Notes Internes</Label>
              <Textarea 
                placeholder="Informations complémentaires pour le suivi interne..."
                value={manualQuittanceForm.notes}
                onChange={(e) => handleFormChange('notes', e.target.value)}
                className="bg-white border-gray-300"
                rows={3}
              />
            </div>

            {/* Aperçu du montant */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Aperçu de la Quittance</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Montant:</div>
                <div className="font-bold text-green-600">{formatMoney(manualQuittanceForm.montant)}</div>
                
                <div>Type:</div>
                <div>{getTypeBadge(manualQuittanceForm.type)}</div>
                
                {manualQuittanceForm.soldeRestant !== undefined && (
                  <>
                    <div>Solde restant:</div>
                    <div className={manualQuittanceForm.soldeRestant === 0 ? 'text-green-600 font-bold' : 'text-orange-600'}>
                      {formatMoney(manualQuittanceForm.soldeRestant)}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="bg-white">
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreateManualQuittance}>
              <Receipt className="h-4 w-4 mr-2" />
              Générer la Quittance
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de détail de quittance */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-2xl bg-white">
          <DialogHeader>
            <DialogTitle>Détails de la Quittance</DialogTitle>
            <DialogDescription>
              {selectedQuittance?.origine === 'automatique' 
                ? `Quittance générée automatiquement après paiement - Référence: ${selectedQuittance?.paymentId}`
                : 'Quittance créée manuellement par le comptable'
              }
            </DialogDescription>
          </DialogHeader>
          
          {selectedQuittance && (
            <div className="space-y-6 bg-white max-h-[70vh] overflow-y-auto">
              {/* En-tête */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg">{selectedQuittance.numero}</h3>
                  <div className="mt-2 space-y-1 text-sm">
                    <p><strong>Élève:</strong> {selectedQuittance.studentName}</p>
                    <p><strong>Parent:</strong> {selectedQuittance.parentName}</p>
                    <p><strong>Email:</strong> {selectedQuittance.parentEmail}</p>
                    {selectedQuittance.paymentId && (
                      <p><strong>Référence Paiement:</strong> {selectedQuittance.paymentId}</p>
                    )}
                    <p><strong>Origine:</strong> {getOrigineBadge(selectedQuittance.origine)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="space-y-1 text-sm">
                    <p><strong>Date de paiement:</strong> {new Date(selectedQuittance.datePaiement).toLocaleDateString('fr-FR')}</p>
                    <p><strong>Date d&apos;émission:</strong> {new Date(selectedQuittance.dateEmission).toLocaleDateString('fr-FR')}</p>
                    <p><strong>Filière:</strong> {selectedQuittance.filiere}</p>
                    <p><strong>Vague:</strong> {selectedQuittance.vague}</p>
                  </div>
                </div>
              </div>

              {/* Informations paiement */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label>Type de Quittance</Label>
                  <p className="font-medium">{getTypeBadge(selectedQuittance.type)}</p>
                </div>
                <div>
                  <Label>Méthode de Paiement</Label>
                  <p className="font-medium">{getMethodBadge(selectedQuittance.methodePaiement)}</p>
                </div>
                <div>
                  <Label>Montant Reçu</Label>
                  <p className="font-bold text-green-600 text-lg">{formatMoney(selectedQuittance.montant)}</p>
                </div>
                {selectedQuittance.soldeRestant !== undefined && (
                  <div>
                    <Label>Solde Restant</Label>
                    <p className={`font-bold ${selectedQuittance.soldeRestant === 0 ? 'text-green-600' : 'text-orange-600'} text-lg`}>
                      {formatMoney(selectedQuittance.soldeRestant)}
                    </p>
                  </div>
                )}
              </div>

              {/* Mention spéciale */}
              {selectedQuittance.mentionSpeciale && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">Mention Spéciale</h4>
                  <p className="text-blue-800 font-medium">{selectedQuittance.mentionSpeciale}</p>
                </div>
              )}

              {selectedQuittance.notes && (
                <div>
                  <h4 className="font-semibold mb-2">Notes</h4>
                  <p className="text-sm bg-gray-50 p-3 rounded">{selectedQuittance.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => generateQuittancePDF(selectedQuittance)}
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Imprimer PDF
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Télécharger
                </Button>
                {selectedQuittance.statut === 'genere' && (
                  <Button 
                    onClick={() => handleSendQuittance(selectedQuittance)}
                    className="flex-1"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Envoyer au Parent
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal d'envoi de quittance */}
      <Dialog open={isSendModalOpen} onOpenChange={setIsSendModalOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Envoyer la Quittance</DialogTitle>
            <DialogDescription>
              Envoyer ce reçu officiel au parent par email
            </DialogDescription>
          </DialogHeader>
          
          {selectedQuittance && (
            <div className="space-y-4 bg-white max-h-[50vh] overflow-y-auto">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Destinataire</h4>
                <p><strong>Parent:</strong> {selectedQuittance.parentName}</p>
                <p><strong>Email:</strong> {selectedQuittance.parentEmail}</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Détails de la quittance</h4>
                <p><strong>N°:</strong> {selectedQuittance.numero}</p>
                <p><strong>Montant:</strong> {formatMoney(selectedQuittance.montant)}</p>
                <p><strong>Type:</strong> {selectedQuittance.type}</p>
                <p><strong>Date:</strong> {new Date(selectedQuittance.datePaiement).toLocaleDateString('fr-FR')}</p>
                {selectedQuittance.mentionSpeciale && (
                  <p><strong>Mention:</strong> {selectedQuittance.mentionSpeciale}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="message" className="text-gray-700">Message personnalisé</Label>
                <textarea 
                  id="message"
                  placeholder="Ajouter un message personnalisé pour le parent..."
                  rows={4}
                  className="w-full p-3 border border-gray-300 rounded-md bg-white resize-none"
                  defaultValue={`Bonjour ${selectedQuittance.parentName},
                    Veuillez trouver ci-joint la quittance n°${selectedQuittance.numero} attestant du règlement de ${selectedQuittance.type} pour ${selectedQuittance.studentName}.
                    Montant reçu: ${formatMoney(selectedQuittance.montant)}
                    Date de paiement: ${new Date(selectedQuittance.datePaiement).toLocaleDateString('fr-FR')}
                    ${selectedQuittance.mentionSpeciale ? `Mention: ${selectedQuittance.mentionSpeciale}` : ''}

                    Ce document fait foi de règlement et d&apos;acquittement.

                    Cordialement,
                    L&apos;équipe SchoolFlow`}
                />
              </div>
            </div>
          )}

          <DialogFooter className="bg-white">
            <Button variant="outline" onClick={() => setIsSendModalOpen(false)}>
              Annuler
            </Button>
            <Button onClick={confirmSendQuittance}>
              <Mail className="h-4 w-4 mr-2" />
              Envoyer la Quittance
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}