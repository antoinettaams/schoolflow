// app/dashboard/comptable/facturations/page.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Download, Eye, FileText, 
  CreditCard, Printer, Mail, CheckCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

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
  methodePaiement: 'online' | 'especes' | 'cheque' | 'virement' | 'mobile_money';
  datePaiement: string;
  dateFacturation: string;
  montant: number;
  statut: 'generee' | 'envoyee' | 'annulee';
  items: FactureItem[];
  notes?: string;
}

interface FactureItem {
  id: string;
  description: string;
  quantite: number;
  prixUnitaire: number;
  montant: number;
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
        methodePaiement: 'online',
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
        notes: 'Paiement en ligne validé automatiquement'
      },
      {
        id: '2',
        numero: 'FACT-2024-002',
        paymentId: 'PAY-002',
        studentId: 's2',
        studentName: 'Pierre Martin',
        parentName: 'Mme. Martin',
        parentEmail: 'martin.parent@email.com',
        filiere: 'Data Science',
        vague: 'Vague Janvier 2024',
        typePaiement: 'scolarite',
        methodePaiement: 'virement',
        datePaiement: '2024-01-20',
        dateFacturation: '2024-01-20',
        montant: 200000,
        statut: 'generee',
        items: [
          {
            id: '1',
            description: 'Acompte sur frais de scolarité - Trimestre 1',
            quantite: 1,
            prixUnitaire: 200000,
            montant: 200000
          }
        ],
        notes: 'Premier versement pour le trimestre 1'
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
        datePaiement: '2024-01-18',
        dateFacturation: '2024-01-18',
        montant: 250000,
        statut: 'envoyee',
        items: [
          {
            id: '1',
            description: 'Frais de scolarité complet - Trimestre 1',
            quantite: 1,
            prixUnitaire: 250000,
            montant: 250000
          }
        ]
      },
      {
        id: '4',
        numero: 'FACT-2024-004',
        paymentId: 'PAY-004',
        studentId: 's4',
        studentName: 'Thomas Moreau',
        parentName: 'M. Moreau',
        parentEmail: 'moreau.t@email.com',
        filiere: 'Réseaux & Sécurité',
        vague: 'Vague Janvier 2024',
        typePaiement: 'inscription',
        methodePaiement: 'especes',
        datePaiement: '2024-01-22',
        dateFacturation: '2024-01-22',
        montant: 50000,
        statut: 'generee',
        items: [
          {
            id: '1',
            description: 'Frais d\'inscription - Réseaux & Sécurité',
            quantite: 1,
            prixUnitaire: 50000,
            montant: 50000
          }
        ],
        notes: 'Paiement en espèces reçu à l\'accueil'
      },
      {
        id: '5',
        numero: 'FACT-2024-005',
        paymentId: 'PAY-005',
        studentId: 's1',
        studentName: 'Marie Dupont',
        parentName: 'M. Dupont',
        parentEmail: 'parent.dupont@email.com',
        filiere: 'Développement Web',
        vague: 'Vague Janvier 2024',
        typePaiement: 'scolarite',
        methodePaiement: 'online',
        datePaiement: '2024-02-01',
        dateFacturation: '2024-02-01',
        montant: 150000,
        statut: 'generee',
        items: [
          {
            id: '1',
            description: 'Solde frais de scolarité - Trimestre 1',
            quantite: 1,
            prixUnitaire: 150000,
            montant: 150000
          }
        ],
        notes: 'Deuxième versement pour compléter le trimestre'
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
      online: { variant: 'default' as const, text: 'En ligne' },
      especes: { variant: 'secondary' as const, text: 'Espèces' },
      cheque: { variant: 'outline' as const, text: 'Chèque' },
      virement: { variant: 'default' as const, text: 'Virement' },
      mobile_money: { variant: 'secondary' as const, text: 'Mobile Money' }
    };
    return <Badge variant={config[methode].variant}>{config[methode].text}</Badge>;
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
    // Simulation de génération PDF
    console.log('Génération PDF pour:', facture.numero);
    alert(`PDF de la facture ${facture.numero} généré avec succès!`);
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
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Gestion des Factures</h1>
            <p className="text-gray-600 mt-1">Factures générées automatiquement après paiement</p>
          </div>
          <div className="flex gap-3 mt-4 sm:mt-0">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exporter
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
                
                <div className="flex gap-3">
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
                        <TableCell colSpan={9} className="text-center py-8">
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

      {/* Modal de détail de facture */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-4xl bg-white">
          <DialogHeader>
            <DialogTitle>Détails de la Facture</DialogTitle>
            <DialogDescription>
              Facture générée automatiquement après paiement - Référence: {selectedFacture?.paymentId}
            </DialogDescription>
          </DialogHeader>
          
          {selectedFacture && (
            <div className="space-y-6 bg-white">
              {/* En-tête */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg">{selectedFacture.numero}</h3>
                  <div className="mt-2 space-y-1 text-sm">
                    <p><strong>Élève:</strong> {selectedFacture.studentName}</p>
                    <p><strong>Parent:</strong> {selectedFacture.parentName}</p>
                    <p><strong>Email:</strong> {selectedFacture.parentEmail}</p>
                    <p><strong>Référence Paiement:</strong> {selectedFacture.paymentId}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="space-y-1 text-sm">
                    <p><strong>Date de paiement:</strong> {new Date(selectedFacture.datePaiement).toLocaleDateString('fr-FR')}</p>
                    <p><strong>Date de facturation:</strong> {new Date(selectedFacture.dateFacturation).toLocaleDateString('fr-FR')}</p>
                    <p><strong>Filière:</strong> {selectedFacture.filiere}</p>
                    <p><strong>Vague:</strong> {selectedFacture.vague}</p>
                  </div>
                </div>
              </div>

              {/* Informations paiement */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label>Type de Paiement</Label>
                  <p className="font-medium">{getTypeBadge(selectedFacture.typePaiement)}</p>
                </div>
                <div>
                  <Label>Méthode de Paiement</Label>
                  <p className="font-medium">{getMethodBadge(selectedFacture.methodePaiement)}</p>
                </div>
                <div>
                  <Label>Montant Total</Label>
                  <p className="font-bold text-green-600 text-lg">{formatMoney(selectedFacture.montant)}</p>
                </div>
              </div>

              {/* Items de la facture */}
              <div>
                <h4 className="font-semibold mb-3">Détail de la facture</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Quantité</TableHead>
                      <TableHead className="text-right">Prix unitaire</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedFacture.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.description}</TableCell>
                        <TableCell className="text-right">{item.quantite}</TableCell>
                        <TableCell className="text-right">{formatMoney(item.prixUnitaire)}</TableCell>
                        <TableCell className="text-right font-medium">{formatMoney(item.montant)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                <div className="flex justify-end mt-4">
                  <div className="text-right space-y-1">
                    <p className="text-lg font-bold">
                      Total: {formatMoney(selectedFacture.montant)}
                    </p>
                  </div>
                </div>
              </div>

              {selectedFacture.notes && (
                <div>
                  <h4 className="font-semibold mb-2">Notes</h4>
                  <p className="text-sm bg-gray-50 p-3 rounded">{selectedFacture.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => generateFacturePDF(selectedFacture)}
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
                {selectedFacture.statut === 'generee' && (
                  <Button 
                    onClick={() => handleSendFacture(selectedFacture)}
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

Veuillez trouver ci-joint la facture n°${selectedFacture.numero} pour le paiement de ${selectedFacture.typePaiement} de ${selectedFacture.studentName}.

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