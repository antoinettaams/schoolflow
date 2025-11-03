// app/dashboard/finances/student/[id]/paiement/page.tsx
"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, CreditCard, DollarSign, Calendar, Save, X,
  CheckCircle, AlertCircle
} from 'lucide-react';

// Import des composants shadcn
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface Student {
  id: string;
  nom: string;
  prenom: string;
  filiere: string;
  montantInscription: number;
  montantScolarite: number;
  montantPaye: number;
}

interface PaymentForm {
  type: 'inscription' | 'scolarite' | 'autre';
  montant: number;
  methode: 'especes' | 'cheque' | 'virement' | 'mobile_money';
  date: string;
  reference: string;
  notes: string;
}

export default function NewPaymentPage() {
  const params = useParams();
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState<PaymentForm>({
    type: 'scolarite',
    montant: 0,
    methode: 'especes',
    date: new Date().toISOString().split('T')[0],
    reference: '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadStudentData = useCallback(() => {
    // Données simulées
    const mockStudent: Student = {
      id: params.id as string,
      nom: 'Dupont',
      prenom: 'Marie',
      filiere: 'Informatique',
      montantInscription: 50000,
      montantScolarite: 300000,
      montantPaye: 200000
    };
    setStudent(mockStudent);
  }, [params.id]); 

  useEffect(() => {
    loadStudentData();
  }, [loadStudentData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulation d'envoi
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('Nouveau paiement:', formData);
    
    router.push(`/dashboard/finances/student/${params.id}`);
  };

  const handleMontantChange = (value: string) => {
    const numericValue = value.replace(/[^\d]/g, '');
    setFormData(prev => ({ ...prev, montant: numericValue ? parseInt(numericValue) : 0 }));
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF'
    }).format(amount);
  };

  const totalAttendu = (student?.montantInscription || 0) + (student?.montantScolarite || 0);
  const resteAPayer = totalAttendu - (student?.montantPaye || 0);

  if (!student) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-y-auto bg-background p-4 sm:p-6 lg:pl-5 pt-20 lg:pt-6">
      <div className="max-w-2xl mx-auto">
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
          
          <div className="flex items-center gap-3 mb-2">
            <CreditCard className="h-8 w-8 text-green-600" />
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Nouveau Paiement
            </h1>
          </div>
          <p className="text-muted-foreground">
            Pour {student.prenom} {student.nom} - {student.filiere}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Informations de solde */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Solde actuel</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total payé</p>
                  <p className="text-xl font-bold text-green-600">
                    {formatMoney(student.montantPaye)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Reste à payer</p>
                  <p className="text-xl font-bold text-red-600">
                    {formatMoney(resteAPayer)}
                  </p>
                </div>
                <div className="pt-3 border-t">
                  <p className="text-sm text-muted-foreground">Total attendu</p>
                  <p className="text-lg font-semibold text-foreground">
                    {formatMoney(totalAttendu)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Formulaire de paiement */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                <form onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="space-y-2">
                      <Label htmlFor="type">Type de paiement *</Label>
                      <Select
                        value={formData.type}
                        onValueChange={(value: 'inscription' | 'scolarite' | 'autre') => 
                          setFormData(prev => ({ ...prev, type: value }))
                        }
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez le type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="scolarite">Frais de scolarité</SelectItem>
                          <SelectItem value="inscription">Frais d&apos;inscription</SelectItem>
                          <SelectItem value="autre">Autre frais</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="methode">Méthode de paiement *</Label>
                      <Select
                        value={formData.methode}
                        onValueChange={(value: 'especes' | 'cheque' | 'virement' | 'mobile_money') => 
                          setFormData(prev => ({ ...prev, methode: value }))
                        }
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez la méthode" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="especes">Espèces</SelectItem>
                          <SelectItem value="cheque">Chèque</SelectItem>
                          <SelectItem value="virement">Virement bancaire</SelectItem>
                          <SelectItem value="mobile_money">Mobile Money</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="montant">Montant (FCFA) *</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          type="text"
                          value={formData.montant === 0 ? '' : formData.montant.toLocaleString()}
                          onChange={(e) => handleMontantChange(e.target.value)}
                          className="pl-10"
                          placeholder="0"
                          required
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Maximum recommandé: {formatMoney(resteAPayer)}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="date">Date du paiement *</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          type="date"
                          value={formData.date}
                          onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="reference">Référence</Label>
                      <Input
                        type="text"
                        value={formData.reference}
                        onChange={(e) => setFormData(prev => ({ ...prev, reference: e.target.value }))}
                        placeholder="Numéro de chèque, référence virement..."
                      />
                    </div>

                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="notes">Notes (optionnel)</Label>
                      <Textarea
                        value={formData.notes}
                        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Informations complémentaires sur ce paiement..."
                        rows={3}
                      />
                    </div>
                  </div>

                  {/* Aperçu du paiement */}
                  <Alert className="mb-6 bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-200">
                    <CheckCircle className="h-4 w-4" />
                    <AlertTitle className="text-blue-900 dark:text-blue-200">Aperçu du paiement</AlertTitle>
                    <AlertDescription className="text-blue-800 dark:text-blue-300">
                      <div className="space-y-1 mt-2">
                        <div className="flex justify-between">
                          <span>Type:</span>
                          <span className="font-medium capitalize">{formData.type}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Méthode:</span>
                          <span className="font-medium capitalize">{formData.methode}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Montant:</span>
                          <span className="font-medium text-green-600">{formatMoney(formData.montant)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Date:</span>
                          <span className="font-medium">{new Date(formData.date).toLocaleDateString('fr-FR')}</span>
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>

                  {/* Alertes */}
                  {formData.montant > resteAPayer && (
                    <Alert className="mb-6 bg-red-50 border-red-200 text-red-900 dark:bg-red-950 dark:border-red-800 dark:text-red-200">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Attention</AlertTitle>
                      <AlertDescription>
                        Le montant saisi ({formatMoney(formData.montant)}) dépasse le solde restant ({formatMoney(resteAPayer)})
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Boutons */}
                  <div className="flex gap-3 justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.back()}
                      className="flex items-center gap-2"
                    >
                      <X className="h-4 w-4" />
                      Annuler
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting || formData.montant === 0}
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                    >
                      <Save className="h-4 w-4" />
                      {isSubmitting ? 'Enregistrement...' : 'Enregistrer le paiement'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}