// app/dashboard/finances/student/[id]/page.tsx
"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, User, Mail, Book, Calendar, DollarSign, 
  CreditCard, CheckCircle, XCircle, Clock, AlertCircle,
  Printer, Edit
} from 'lucide-react';

// Import des composants shadcn
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Student {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  filiere: string;
  telephone?: string;
  dateNaissance?: string;
  statutInscription: 'complete' | 'partielle' | 'en_attente';
  statutPaiement: 'paye' | 'partiel' | 'en_retard' | 'non_paye';
  montantInscription: number;
  montantScolarite: number;
  montantPaye: number;
  dateInscription: string;
  vagueName: string;
}

interface Payment {
  id: string;
  date: string;
  type: 'inscription' | 'scolarite' | 'autre';
  montant: number;
  methode: 'especes' | 'cheque' | 'virement' | 'mobile_money';
  reference: string;
  statut: 'complete' | 'en_attente' | 'annule';
  notes?: string;
}

export default function StudentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Déplacer loadStudentData dans un useCallback pour éviter les recréations
  const loadStudentData = useCallback(() => {
    // Données simulées
    const mockStudent: Student = {
      id: params.id as string,
      nom: 'Dupont',
      prenom: 'Marie',
      email: 'marie.dupont@email.com',
      filiere: 'Informatique',
      telephone: '+225 07 12 34 56 78',
      dateNaissance: '2000-05-15',
      statutInscription: 'complete',
      statutPaiement: 'partiel',
      montantInscription: 50000,
      montantScolarite: 300000,
      montantPaye: 200000,
      dateInscription: '2024-01-05',
      vagueName: 'Vague Janvier-Juin 2024'
    };

    const mockPayments: Payment[] = [
      {
        id: 'p1',
        date: '2024-01-05',
        type: 'inscription',
        montant: 50000,
        methode: 'virement',
        reference: 'VIR-2024-001',
        statut: 'complete',
        notes: 'Paiement inscription complète'
      },
      {
        id: 'p2',
        date: '2024-01-15',
        type: 'scolarite',
        montant: 150000,
        methode: 'especes',
        reference: 'ESP-2024-001',
        statut: 'complete',
        notes: 'Premier versement scolarité'
      }
    ];

    setStudent(mockStudent);
    setPayments(mockPayments);
    setIsLoading(false);
  }, [params.id]); // Ajouter params.id comme dépendance

  useEffect(() => {
    loadStudentData();
  }, [loadStudentData]); // Maintenant loadStudentData est stable grâce à useCallback

  const getStatusBadge = (statut: Student['statutPaiement']) => {
    const config = {
      paye: { variant: "default" as const, text: 'Payé', icon: CheckCircle },
      partiel: { variant: "secondary" as const, text: 'Partiel', icon: Clock },
      en_retard: { variant: "destructive" as const, text: 'En retard', icon: AlertCircle },
      non_paye: { variant: "outline" as const, text: 'Non payé', icon: XCircle }
    };
    
    const { variant, text, icon: Icon } = config[statut];
    return (
      <Badge variant={variant} className="flex items-center gap-1">
        <Icon className="h-4 w-4" />
        {text}
      </Badge>
    );
  };

  const getPaymentMethodBadge = (methode: Payment['methode']) => {
    const config = {
      especes: { variant: "default" as const, text: 'Espèces' },
      cheque: { variant: "secondary" as const, text: 'Chèque' },
      virement: { variant: "outline" as const, text: 'Virement' },
      mobile_money: { variant: "destructive" as const, text: 'Mobile Money' }
    };
    
    const { variant, text } = config[methode];
    return (
      <Badge variant={variant}>
        {text}
      </Badge>
    );
  };

  const getPaymentTypeBadge = (type: Payment['type']) => {
    const config = {
      inscription: { variant: "secondary" as const, text: 'Inscription' },
      scolarite: { variant: "default" as const, text: 'Scolarité' },
      autre: { variant: "outline" as const, text: 'Autre' }
    };
    
    const { variant, text } = config[type];
    return (
      <Badge variant={variant}>
        {text}
      </Badge>
    );
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const totalAttendu = (student?.montantInscription || 0) + (student?.montantScolarite || 0);
  const resteAPayer = totalAttendu - (student?.montantPaye || 0);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Chargement des détails...</p>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-2xl">Étudiant non trouvé</CardTitle>
            <CardDescription>
              L&apos;étudiant que vous recherchez n&apos;existe pas ou a été supprimé.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.back()}>
              Retour
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-y-auto p-4 sm:p-6 lg:pl-5 pt-20 lg:pt-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => router.back()}
            className="flex items-center gap-2 mb-4 pl-0"
          >
            <ArrowLeft className="h-5 w-5" />
            Retour
          </Button>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                {student.prenom} {student.nom}
              </h1>
              <p className="text-muted-foreground">Détails financiers de l&apos;étudiant</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex items-center gap-2">
                <Printer className="h-4 w-4" />
                Imprimer
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonne de gauche - Informations étudiant */}
          <div className="lg:col-span-1 space-y-6">
            {/* Carte informations personnelles */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-muted-foreground" />
                  Informations Personnelles
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    {student.email}
                  </p>
                </div>
                {student.telephone && (
                  <div>
                    <p className="text-sm text-muted-foreground">Téléphone</p>
                    <p className="text-sm font-medium text-foreground">{student.telephone}</p>
                  </div>
                )}
                {student.dateNaissance && (
                  <div>
                    <p className="text-sm text-muted-foreground">Date de naissance</p>
                    <p className="text-sm font-medium text-foreground">
                      {formatDate(student.dateNaissance)}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Date d&apos;inscription</p>
                  <p className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {formatDate(student.dateInscription)}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Carte formation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Book className="h-5 w-5 text-muted-foreground" />
                  Formation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Filière</p>
                  <p className="text-sm font-medium text-foreground">{student.filiere}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Vague</p>
                  <p className="text-sm font-medium text-foreground">{student.vagueName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Statut inscription</p>
                  <div className="mt-1">
                    <Badge variant={
                      student.statutInscription === 'complete' ? 'default' :
                      student.statutInscription === 'partielle' ? 'secondary' : 'outline'
                    }>
                      {student.statutInscription === 'complete' ? 'Complète' :
                       student.statutInscription === 'partielle' ? 'Partielle' : 'En attente'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Colonne de droite - Informations financières */}
          <div className="lg:col-span-2 space-y-6">
            {/* Résumé financier */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-muted-foreground" />
                  Résumé Financier
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Frais d&apos;inscription</p>
                      <p className="text-2xl font-bold text-foreground">
                        {formatMoney(student.montantInscription)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Frais de scolarité</p>
                      <p className="text-2xl font-bold text-foreground">
                        {formatMoney(student.montantScolarite)}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Total payé</p>
                      <p className="text-2xl font-bold text-green-600">
                        {formatMoney(student.montantPaye)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Reste à payer</p>
                      <p className="text-2xl font-bold text-red-600">
                        {formatMoney(resteAPayer)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Barre de progression */}
                <div className="mb-2">
                  <div className="flex justify-between text-sm text-muted-foreground mb-1">
                    <span>Progression du paiement</span>
                    <span>{Math.round((student.montantPaye / totalAttendu) * 100)}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(student.montantPaye / totalAttendu) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-4">
                  <div className="text-sm text-muted-foreground">
                    Total attendu: <span className="font-semibold text-foreground">{formatMoney(totalAttendu)}</span>
                  </div>
                  <div>
                    {getStatusBadge(student.statutPaiement)}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Historique des paiements */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Historique des Paiements</CardTitle>
                  <CardDescription>{payments.length} paiement(s)</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                {payments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CreditCard className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                    <p>Aucun paiement enregistré</p>
                  </div>
                ) : (
                  <ScrollArea className="h-96">
                    <div className="space-y-4">
                      {payments.map((payment) => (
                        <Card key={payment.id} className="hover:bg-muted/50 transition-colors">
                          <CardContent className="p-4">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  {getPaymentTypeBadge(payment.type)}
                                  {getPaymentMethodBadge(payment.methode)}
                                  <span className="text-sm text-muted-foreground">{formatDate(payment.date)}</span>
                                </div>
                                <div className="text-sm text-foreground">
                                  <div className="font-medium">{formatMoney(payment.montant)}</div>
                                  {payment.notes && (
                                    <div className="text-muted-foreground mt-1">{payment.notes}</div>
                                  )}
                                  <div className="text-xs text-muted-foreground mt-1">
                                    Référence: {payment.reference}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant={
                                  payment.statut === 'complete' ? 'default' :
                                  payment.statut === 'en_attente' ? 'secondary' : 'destructive'
                                }>
                                  {payment.statut === 'complete' ? 'Complet' :
                                   payment.statut === 'en_attente' ? 'En attente' : 'Annulé'}
                                </Badge>
                                <Button variant="ghost" size="sm">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}