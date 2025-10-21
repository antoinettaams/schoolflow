// app/parent/finance/page.tsx
"use client";

import React, { useState } from "react";
import { 
  FaFileInvoice, 
  FaSort, 
  FaSortUp, 
  FaSortDown, 
  FaDownload, 
  FaCreditCard, 
  FaMobile, 
  FaMoneyBillWave,
  FaHistory,
  FaChartBar,
  FaReceipt
} from "react-icons/fa";
import PaymentModal from "@/components/ui/payment-modal";

export default function ParentFinancePage() {
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [sortField, setSortField] = useState("dueDate");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [selectedFee, setSelectedFee] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
  const [paymentStep, setPaymentStep] = useState("select");

  const feesData = [
    { id: 1, description: "Frais de scolarité - Trimestre 1", amount: 295000, dueDate: "15/09/2024", status: "paid", paymentDate: "10/09/2024", type: "Scolarité", reference: "FSC-2024-T1" },
    { id: 2, description: "Frais de cantine - Septembre", amount: 78700, dueDate: "05/10/2024", status: "paid", paymentDate: "01/10/2024", type: "Cantine", reference: "CAN-2024-09" },
    { id: 3, description: "Frais de scolarité - Trimestre 2", amount: 295000, dueDate: "15/11/2024", status: "pending", paymentDate: "", type: "Scolarité", reference: "FSC-2024-T2" },
    { id: 4, description: "Frais de cantine - Octobre", amount: 78700, dueDate: "05/11/2024", status: "overdue", paymentDate: "", type: "Cantine", reference: "CAN-2024-10" },
    { id: 5, description: "Frais d'activités périscolaires", amount: 55700, dueDate: "20/11/2024", status: "pending", paymentDate: "", type: "Activités", reference: "ACT-2024-11" },
  ];

  const statusFilters = [
    { id: "all", name: "Tous les frais" },
    { id: "paid", name: "Payés" },
    { id: "pending", name: "En attente" },
    { id: "overdue", name: "En retard" }
  ];

  const paymentMethods = [
    { id: "momo", name: "Mobile Money", icon: FaMobile, description: "Payer avec Orange Money ou MTN Mobile Money" },
    { id: "card", name: "Carte Bancaire", icon: FaCreditCard, description: "Payer par carte Visa, Mastercard" },
    { id: "cash", name: "Espèces", icon: FaMoneyBillWave, description: "Payer en espèces à la comptabilité" }
  ];

  const downloadReceipt = (fee: any) => {
    const receiptContent = `
      RECU DE PAIEMENT - SCHOOLFLOW
      ==============================
      
      Référence: ${fee.reference}
      Description: ${fee.description}
      Type: ${fee.type}
      Montant: ${formatFCFA(fee.amount)}
      Date d'échéance: ${fee.dueDate}
      Date de paiement: ${fee.paymentDate}
      Statut: Payé
      
      Élève: Jean Dupont - Terminale S
      Parent: Marie Dupont
      Date d'émission: ${new Date().toLocaleDateString('fr-FR')}
      
      Merci pour votre confiance.
      École Secondaire Excellence
      
      Ce reçu est valable comme justificatif de paiement.
    `;

    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reçu-${fee.reference}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const initiatePayment = (fee: any) => {
    setSelectedFee(fee);
    setShowPaymentModal(true);
    setPaymentStep("select");
    setSelectedPaymentMethod("");
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) return <FaSort className="text-gray-400" />;
    return sortDirection === "asc" ? <FaSortUp className="text-blue-600" /> : <FaSortDown className="text-blue-600" />;
  };

  const filteredFees = feesData.filter(fee =>
    selectedStatus === "all" || fee.status === selectedStatus
  );

  const sortedFees = [...filteredFees].sort((a, b) => {
    let aValue: any = a[sortField as keyof typeof a];
    let bValue: any = b[sortField as keyof typeof b];

    if (sortField === "amount") {
      aValue = Number(aValue);
      bValue = Number(bValue);
    } else if (sortField === "dueDate") {
      aValue = new Date(aValue.split('/').reverse().join('-'));
      bValue = new Date(bValue.split('/').reverse().join('-'));
    }

    if (sortDirection === "asc") return aValue > bValue ? 1 : -1;
    return aValue < bValue ? 1 : -1;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "bg-green-100 text-green-800 border-green-200";
      case "pending": return "bg-blue-100 text-blue-800 border-blue-200";
      case "overdue": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Scolarité": return "bg-purple-100 text-purple-800 border-purple-200";
      case "Cantine": return "bg-orange-100 text-orange-800 border-orange-200";
      case "Activités": return "bg-indigo-100 text-indigo-800 border-indigo-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatFCFA = (amount: number) => new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';

  const totalPaid = feesData.filter(f => f.status === "paid").reduce((sum, fee) => sum + fee.amount, 0);
  const totalPending = feesData.filter(f => f.status === "pending").reduce((sum, fee) => sum + fee.amount, 0);
  const totalOverdue = feesData.filter(f => f.status === "overdue").reduce((sum, fee) => sum + fee.amount, 0);
  const totalAll = feesData.reduce((sum, fee) => sum + fee.amount, 0);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-gray-50 lg:pl-5 pt-20 lg:pt-6">
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-7xl mx-auto">
          {/* En-tête */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Finance et Paiements</h1>
              <p className="text-gray-600 mt-2">
                Gestion des frais scolaires - <span className="font-semibold">Jean Dupont (Terminale S)</span>
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Solde total</p>
                <p className="text-2xl font-bold text-gray-900">{formatFCFA(totalAll)}</p>
              </div>
            </div>
          </div>

          {/* Cartes de résumé */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total des frais</p>
                  <p className="text-2xl font-bold text-gray-900">{formatFCFA(totalAll)}</p>
                </div>
                <FaChartBar className="text-2xl text-blue-600" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Frais payés</p>
                  <p className="text-2xl font-bold text-green-600">{formatFCFA(totalPaid)}</p>
                </div>
                <FaReceipt className="text-2xl text-green-600" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">En attente</p>
                  <p className="text-2xl font-bold text-blue-600">{formatFCFA(totalPending)}</p>
                </div>
                <FaHistory className="text-2xl text-blue-600" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">En retard</p>
                  <p className="text-2xl font-bold text-red-600">{formatFCFA(totalOverdue)}</p>
                </div>
                <FaFileInvoice className="text-2xl text-red-600" />
              </div>
            </div>
          </div>

          {/* Filtres */}
          <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
            {statusFilters.map(filter => (
              <button
                key={filter.id}
                onClick={() => setSelectedStatus(filter.id)}
                className={`px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap min-w-[160px] text-center border ${
                  selectedStatus === filter.id
                    ? "bg-blue-600 text-white border-blue-600 shadow-md"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400"
                }`}
              >
                {filter.name}
              </button>
            ))}
          </div>

          {/* Tableau des frais */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <FaFileInvoice className="text-blue-600" />
                  Détail des Frais Scolaires
                </h2>
                <div className="text-sm text-gray-500">
                  {sortedFees.length} frais trouvé(s)
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 cursor-pointer hover:bg-gray-50" onClick={() => handleSort("reference")}>
                        Référence {getSortIcon("reference")}
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 cursor-pointer hover:bg-gray-50" onClick={() => handleSort("description")}>
                        Description {getSortIcon("description")}
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Type</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 cursor-pointer hover:bg-gray-50" onClick={() => handleSort("amount")}>
                        Montant {getSortIcon("amount")}
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 cursor-pointer hover:bg-gray-50" onClick={() => handleSort("dueDate")}>
                        Échéance {getSortIcon("dueDate")}
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Statut</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedFees.map(fee => (
                      <tr key={fee.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-4 font-mono text-sm text-gray-600">{fee.reference}</td>
                        <td className="py-4 px-4 font-medium text-gray-900">{fee.description}</td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getTypeColor(fee.type)}`}>
                            {fee.type}
                          </span>
                        </td>
                        <td className="py-4 px-4 font-bold text-gray-900">{formatFCFA(fee.amount)}</td>
                        <td className="py-4 px-4 text-gray-700">{fee.dueDate}</td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(fee.status)}`}>
                            {fee.status === "paid" ? "Payé" : fee.status === "pending" ? "En attente" : "En retard"}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex gap-2">
                            {fee.status === "paid" && (
                              <button
                                onClick={() => downloadReceipt(fee)}
                                className="flex items-center gap-2 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                              >
                                <FaDownload className="text-xs" />
                                Reçu
                              </button>
                            )}
                            {(fee.status === "pending" || fee.status === "overdue") && (
                              <button
                                onClick={() => initiatePayment(fee)}
                                className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                              >
                                <FaCreditCard className="text-xs" />
                                Payer
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {sortedFees.length === 0 && (
                <div className="text-center py-12">
                  <FaFileInvoice className="text-5xl text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun frais trouvé</h3>
                  <p className="text-gray-500">Aucun frais scolaire ne correspond aux critères sélectionnés.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de paiement */}
      {showPaymentModal && selectedFee && (
        <PaymentModal
          fee={selectedFee}
          paymentStep={paymentStep}
          selectedPaymentMethod={selectedPaymentMethod}
          onPaymentMethodSelect={setSelectedPaymentMethod}
          onStepChange={setPaymentStep}
          onClose={() => setShowPaymentModal(false)}
          paymentMethods={paymentMethods}
        />
      )}
    </div>
  );
}