"use client";
import React, { useState, useEffect } from 'react';
import { 
  Filter, Download, RefreshCw,
  Eye, Users, GraduationCap, CreditCard,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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

export default function JournalOperationsPage() {
  const [operations, setOperations] = useState<OperationAutomatique[]>([]);
  const [filteredOperations, setFilteredOperations] = useState<OperationAutomatique[]>([]);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [dateDebut, setDateDebut] = useState<string>('2024-01-01');
  const [dateFin, setDateFin] = useState<string>('2024-01-31');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOperation, setSelectedOperation] = useState<OperationAutomatique | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  useEffect(() => {
    const mockOperationsAutomatiques: OperationAutomatique[] = [
      {
        id: '1',
        numero: 'JOU-2024-001',
        date: '2024-01-05',
        type: 'paiement_inscription',
        studentId: 's1',
        studentName: 'Marie Dupont',
        parentName: 'M. Dupont',
        filiere: 'Développement Web',
        vague: 'Vague Janvier 2024',
        compteDebit: '101',
        compteCredit: '702',
        libelle: 'Inscription - Marie Dupont - Paiement espèces',
        montant: 50000,
        reference: 'INSC-001',
        statut: 'comptabilise',
        modePaiement: 'especes',
        source: 'paiement_auto',
        dateComptabilisation: '2024-01-05',
        notes: 'Paiement en espèces enregistré automatiquement'
      },
      {
        id: '2',
        numero: 'JOU-2024-002',
        date: '2024-01-05',
        type: 'paiement_scolarite',
        studentId: 's2',
        studentName: 'Pierre Martin',
        parentName: 'Mme. Martin',
        filiere: 'Data Science',
        vague: 'Vague Janvier 2024',
        compteDebit: '102',
        compteCredit: '701',
        libelle: 'Scolarité - Pierre Martin - Virement bancaire',
        montant: 300000,
        reference: 'FACT-001',
        statut: 'comptabilise',
        modePaiement: 'virement',
        source: 'paiement_auto',
        dateComptabilisation: '2024-01-05'
      },
      {
        id: '3',
        numero: 'JOU-2024-003',
        date: '2024-01-10',
        type: 'paiement_inscription',
        studentId: 's3',
        studentName: 'Sophie Bernard',
        parentName: 'M. Bernard',
        filiere: 'Design Graphique',
        vague: 'Vague Janvier 2024',
        compteDebit: '102',
        compteCredit: '702',
        libelle: 'Inscription - Sophie Bernard - Mobile Money',
        montant: 50000,
        reference: 'INSC-002',
        statut: 'comptabilise',
        modePaiement: 'mobile_money',
        source: 'paiement_auto',
        dateComptabilisation: '2024-01-10'
      }
    ];
    setOperations(mockOperationsAutomatiques);
    setFilteredOperations(mockOperationsAutomatiques);
  }, []);

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

  return (
    <div className="flex flex-col h-screen bg-gray-50 lg:pl-5 pt-20 lg:pt-6">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Journal des Opérations</h1>
            <p className="text-gray-600 mt-1">Opérations comptables liées aux inscriptions et scolarités</p>
          </div>
          <div className="flex gap-3 mt-4 sm:mt-0 flex flex-col">
            <Button variant="outline" onClick={() => alert('Export PDF en cours')}>
              <Download className="h-4 w-4 mr-2" />
              Exporter PDF
            </Button>
            <Button variant="outline" onClick={() => alert('Synchronisation en cours')}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Synchroniser
            </Button>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
          {/* Stat cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
                <div className="text-2xl font-bold text-green-600">{formatMoney(operations.reduce((a, op) => ['paiement_inscription', 'paiement_scolarite'].includes(op.type) ? a + op.montant : a, 0))}</div>
                <p className="text-xs text-gray-600 mt-1">Scolarité & Inscriptions</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Opérations Paiement Auto</CardTitle></CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{operations.filter(op => op.source === 'paiement_auto').length}</div>
                <p className="text-xs text-gray-600 mt-1">Depuis paiements automatique</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardContent>
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
              </div>
            </CardContent>
          </Card>

          {/* Table */}
          <Card>
            <CardHeader>
              <CardTitle>Journal des Opérations Automatiques</CardTitle>
              <CardDescription>{filteredOperations.length} opération(s) trouvée(s)</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
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
                  {filteredOperations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8 text-gray-500">Aucune opération trouvée</TableCell>
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
              </Table>
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
    </div>
  );
}