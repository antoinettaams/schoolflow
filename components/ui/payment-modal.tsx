"use client";

import React, { useState } from "react";
import { FaTimes, FaMobile, FaCreditCard, FaMoneyBillWave, FaShieldAlt, FaLock } from "react-icons/fa";

interface PaymentModalProps {
  fee: any;
  paymentStep: string;
  selectedPaymentMethod: string;
  onPaymentMethodSelect: (method: string) => void;
  onStepChange: (step: string) => void;
  onClose: () => void;
  paymentMethods: any[];
}

export default function PaymentModal({
  fee,
  paymentStep,
  selectedPaymentMethod,
  onPaymentMethodSelect,
  onStepChange,
  onClose,
  paymentMethods
}: PaymentModalProps) {
  const [momoData, setMomoData] = useState({
    phoneNumber: "",
    network: "orange"
  });
  const [pinCode, setPinCode] = useState("");
  const [cardData, setCardData] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardHolder: ""
  });
  const [isProcessing, setIsProcessing] = useState(false);

  const processMomoPayment = async () => {
    setIsProcessing(true);
    
    // Processus Mobile Money
    setTimeout(() => {
      setIsProcessing(false);
      onStepChange("momo_pin");
    }, 2000);
  };

  const confirmMomoPayment = async () => {
    setIsProcessing(true);
    
    // Confirmation du code PIN
    setTimeout(() => {
      setIsProcessing(false);
      onStepChange("success");
      
      // Reçu
      setTimeout(() => {
        alert(`Paiement de ${formatFCFA(fee.amount)} réussi ! Un reçu a été envoyé à votre numéro.`);
      }, 1000);
    }, 3000);
  };

  const processCardPayment = async () => {
    setIsProcessing(true);
    
    // Paiement carte réussi
    setTimeout(() => {
      setIsProcessing(false);
      onStepChange("success");
      
      setTimeout(() => {
        alert(`Paiement carte de ${formatFCFA(fee.amount)} réussi !`);
      }, 1000);
    }, 3000);
  };

  const renderStepContent = () => {
    switch (paymentStep) {
      case "select":
        return (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Choisir le mode de paiement</h3>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <FaTimes className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-6 p-4 bg-second rounded-lg border border-bluvy">
              <p className="font-semibold text-blue-900">{fee.description}</p>
              <p className="text-2xl font-bold text-blue-800 mt-2">{formatFCFA(fee.amount)}</p>
              <p className="text-sm text-blue-700 mt-1">Échéance: {fee.dueDate}</p>
            </div>

            <div className="space-y-3">
              {paymentMethods.map(method => {
                const Icon = method.icon;
                return (
                  <button
                    key={method.id}
                    onClick={() => onPaymentMethodSelect(method.id)}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                      selectedPaymentMethod === method.id
                        ? "border-blue-500 bg-second"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`text-xl ${
                        selectedPaymentMethod === method.id ? "text-blue-600" : "text-gray-600"
                      }`} />
                      <div>
                        <div className="font-semibold text-gray-900">{method.name}</div>
                        <div className="text-sm text-gray-600">{method.description}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  if (selectedPaymentMethod === "momo") onStepChange("momo_form");
                  else if (selectedPaymentMethod === "card") onStepChange("card_form");
                  else if (selectedPaymentMethod === "cash") {
                    alert("Veuillez vous rendre à la comptabilité pour régler en espèces.");
                    onClose();
                  }
                }}
                disabled={!selectedPaymentMethod}
                className={`flex-1 px-4 py-3 rounded-lg transition-colors ${
                  selectedPaymentMethod
                    ? "bg-blue-600 text-white hover:bg-link"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                Continuer
              </button>
            </div>
          </div>
        );

      case "momo_form":
        return (
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <FaMobile className="text-2xl text-[#399f2d]" />
              <h3 className="text-xl font-bold text-gray-900">Paiement Mobile Money</h3>
            </div>

            <div className="mb-6 p-4 bg-[#DDF3D4] rounded-lg border border-green-200">
              <p className="font-semibold text-[#144600]">Montant à payer</p>
              <p className="text-2xl font-bold text-[#144600]">{formatFCFA(fee.amount)}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Opérateur
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setMomoData(prev => ({...prev, network: "orange"}))}
                    className={`p-3 border-2 rounded-lg text-center transition-all ${
                      momoData.network === "orange" 
                        ? "border-[#FF8C00] bg-[#F9DDBF]" 
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="font-semibold text-[#FF5800]">Orange Money</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMomoData(prev => ({...prev, network: "mtn"}))}
                    className={`p-3 border-2 rounded-lg text-center transition-all ${
                      momoData.network === "mtn" 
                        ? "border-[#FFF62D] bg-yellow-50" 
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="font-semibold text-[#EABD33]">MTN Mobile Money</div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Numéro de téléphone
                </label>
                <input
                  type="tel"
                  value={momoData.phoneNumber}
                  onChange={(e) => setMomoData(prev => ({...prev, phoneNumber: e.target.value}))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#399F2D] focus:border-[#399F2D]"
                  placeholder="+225 07 00 00 00 00"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => onStepChange("select")}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Retour
              </button>
              <button
                onClick={processMomoPayment}
                disabled={!momoData.phoneNumber || isProcessing}
                className={`flex-1 px-4 py-3 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                  !momoData.phoneNumber || isProcessing
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-green-600 text-white hover:bg-green-700"
                }`}
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Envoi de la demande...
                  </>
                ) : (
                  <>
                    <FaMobile className="w-4 h-4" />
                    Demander le paiement
                  </>
                )}
              </button>
            </div>
          </div>
        );

      case "momo_pin":
        return (
          <div className="p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaLock className="text-2xl text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Confirmez le paiement</h3>
              <p className="text-gray-600">
                Entrez votre code PIN pour confirmer le paiement de
              </p>
              <p className="text-2xl font-bold text-green-600 my-3">{formatFCFA(fee.amount)}</p>
              <p className="text-sm text-gray-500">
                Sur votre mobile: {momoData.phoneNumber}
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Code PIN
              </label>
              <input
                type="password"
                maxLength={4}
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))}
                className="w-full p-3 border border-gray-300 rounded-lg text-center text-2xl font-mono tracking-widest focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="••••"
              />
              <p className="text-xs text-gray-500 mt-2 text-center">
                Code PIN à 4 chiffres de votre Mobile Money
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => onStepChange("momo_form")}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isProcessing}
              >
                Retour
              </button>
              <button
                onClick={confirmMomoPayment}
                disabled={pinCode.length !== 4 || isProcessing}
                className={`flex-1 px-4 py-3 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                  pinCode.length !== 4 || isProcessing
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-green-600 text-white hover:bg-green-700"
                }`}
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Traitement...
                  </>
                ) : (
                  <>
                    <FaShieldAlt className="w-4 h-4" />
                    Confirmer
                  </>
                )}
              </button>
            </div>
          </div>
        );

      case "card_form":
        return (
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <FaCreditCard className="text-2xl text-blue-600" />
              <h3 className="text-xl font-bold text-gray-900">Paiement par Carte</h3>
            </div>

            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="font-semibold text-blue-900">Montant à payer</p>
              <p className="text-2xl font-bold text-blue-800">{formatFCFA(fee.amount)}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Numéro de carte
                </label>
                <input
                  type="text"
                  value={cardData.cardNumber}
                  onChange={(e) => setCardData(prev => ({...prev, cardNumber: e.target.value}))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date d'expiration
                  </label>
                  <input
                    type="text"
                    value={cardData.expiryDate}
                    onChange={(e) => setCardData(prev => ({...prev, expiryDate: e.target.value}))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="MM/AA"
                    maxLength={5}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CVV
                  </label>
                  <input
                    type="text"
                    value={cardData.cvv}
                    onChange={(e) => setCardData(prev => ({...prev, cvv: e.target.value}))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="123"
                    maxLength={3}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Titulaire de la carte
                </label>
                <input
                  type="text"
                  value={cardData.cardHolder}
                  onChange={(e) => setCardData(prev => ({...prev, cardHolder: e.target.value}))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="JEAN DUPONT"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => onStepChange("select")}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Retour
              </button>
              <button
                onClick={processCardPayment}
                disabled={isProcessing}
                className={`flex-1 px-4 py-3 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                  isProcessing
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Traitement...
                  </>
                ) : (
                  <>
                    <FaShieldAlt className="w-4 h-4" />
                    Payer {formatFCFA(fee.amount)}
                  </>
                )}
              </button>
            </div>
          </div>
        );

      case "success":
        return (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaShieldAlt className="text-2xl text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Paiement réussi !</h3>
            <p className="text-gray-600 mb-4">
              Votre paiement de <strong>{formatFCFA(fee.amount)}</strong> a été traité avec succès.
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-green-800">
                <strong>Transaction ID:</strong> TX{Date.now()}
              </p>
              <p className="text-sm text-green-800 mt-1">
                <strong>Date:</strong> {new Date().toLocaleDateString('fr-FR')}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Fermer
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        {renderStepContent()}
      </div>
    </div>
  );
}

function formatFCFA(amount: number): string {
  return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
}