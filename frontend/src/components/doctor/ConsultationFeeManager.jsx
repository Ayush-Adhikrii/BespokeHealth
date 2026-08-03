import { useState, useEffect } from "react";
import ConfirmModal from "../common/ConfirmModal";

const defaultConsultationTypes = [
  "First Visit",
  "Follow-up",
  "Emergency",
];

const ConsultationFeeManager = ({ fees = [], onSave }) => {
  const [feesList, setFeesList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [feePendingRemoval, setFeePendingRemoval] = useState(null);

  
  useEffect(() => {
    if (fees.length > 0) {
      const formattedFees = fees.map((fee) => ({
        id: fee.id || `fee-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        consultation_type: fee.consultation_type,
        amount: fee.amount,
        currency: fee.currency || "NPR",
      }));
      setFeesList(formattedFees);
    } else {
      
      setFeesList(
        defaultConsultationTypes.map((type) => ({
          id: `fee-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          consultation_type: type,
          amount: 0,
          currency: "NPR",
        }))
      );
    }
  }, [fees]);

  
  const getEmptyFee = () => ({
    id: `fee-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    consultation_type: "",
    amount: 0,
    currency: "NPR",
  });

  
  const handleAddFee = () => {
    setFeesList([...feesList, getEmptyFee()]);
  };

  
  const handleRemoveFee = (id) => {
    setFeePendingRemoval(feesList.find((fee) => fee.id === id) || null);
  };

  const confirmRemoveFee = () => {
    setFeesList(feesList.filter((fee) => fee.id !== feePendingRemoval.id));
    setFeePendingRemoval(null);
  };

  
  const handleFeeChange = (id, field, value) => {
    setFeesList(
      feesList.map((fee) =>
        fee.id === id ? { ...fee, [field]: value } : fee
      )
    );
  };

  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    
    for (const fee of feesList) {
      if (!fee.consultation_type || fee.amount < 0) {
        alert("All fees must have a type and a non-negative amount.");
        return;
      }
    }
    
    setIsLoading(true);
    try {
      
      const feesData = feesList.map(({ consultation_type, amount, currency }) => ({
        consultation_type,
        amount: parseFloat(amount),
        currency
      }));
      
      await onSave(feesData);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">
        Set Your Consultation Fees
      </h2>
      
      <form onSubmit={handleSubmit}>
        <div className="space-y-4 mb-6">
          {feesList.map((fee) => (
            <div
              key={fee.id}
              className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-gray-50 rounded-lg relative"
            >
              <div className="sm:w-1/2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Consultation Type
                </label>
                <input
                  type="text"
                  value={fee.consultation_type}
                  onChange={(e) =>
                    handleFeeChange(fee.id, "consultation_type", e.target.value)
                  }
                  placeholder="e.g., Video Consultation"
                  className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="sm:w-1/3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">Rs.</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={fee.amount}
                    onChange={(e) =>
                      handleFeeChange(fee.id, "amount", e.target.value)
                    }
                    className="w-full p-2 pl-10 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              {feesList.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveFee(fee.id)}
                  className="sm:self-end mb-1 text-red-600 hover:text-red-800"
                  aria-label="Remove fee"
                >
                  <svg
                    className="h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
        
        <div className="flex justify-between items-center mb-6">
          <button
            type="button"
            onClick={handleAddFee}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg
              className="-ml-1 mr-2 h-5 w-5 text-gray-500"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            Add Fee Type
          </button>
        </div>
        
        <div className="border-t border-gray-200 pt-6">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center disabled:bg-blue-400 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  ></path>
                </svg>
                Saving...
              </>
            ) : (
              "Save Consultation Fees"
            )}
          </button>
        </div>
      </form>

      {feePendingRemoval && (
        <ConfirmModal
          title="Remove consultation fee?"
          message={`Remove the "${feePendingRemoval.consultation_type || "Untitled"}" fee (Rs. ${feePendingRemoval.amount})? Patients won't be able to book this consultation type until you add it back and save.`}
          confirmLabel="Remove"
          onConfirm={confirmRemoveFee}
          onCancel={() => setFeePendingRemoval(null)}
        />
      )}
    </div>
  );
};

export default ConsultationFeeManager;