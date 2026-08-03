import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import { useCart } from "../../context/CartContext";
import MedicineOrderService from "../../services/MedicineOrderService";

const MedicineCheckoutPage = () => {
  const navigate = useNavigate();
  const { items, cartTotal, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const getUnitPrice = (item) =>
    item.discount_price && item.discount_price < item.price ? item.discount_price : item.price;

  const handleConfirmPayment = async () => {
    try {
      setLoading(true);
      setShowConfirm(false);

      const orderPayload = items.map((item) => ({
        medicine_id: item.medicine_id,
        quantity: item.quantity,
      }));

      const created = await MedicineOrderService.createOrder(orderPayload);
      const result = await MedicineOrderService.confirmOrderPayment(created.order.id);

      toast.success("Payment confirmed! Your order has been placed.");
      clearCart();
      navigate("/medicine-order-success", {
        state: {
          order_id: result.order_id,
          total_amount: result.total_amount,
        },
      });
    } catch (error) {
      toast.error(error.error || "Failed to process order");
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <DashboardLayout>
        <div className="max-w-lg mx-auto text-center py-16">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Your cart is empty</h2>
          <p className="text-gray-500 mb-6">Add medicines to your cart before checking out.</p>
          <button
            onClick={() => navigate("/dashboard/medicines")}
            className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Browse Medicines
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-lg mx-auto py-8">
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-800">Confirm Your Order</h2>
            <p className="text-sm text-gray-500 mt-1">Review your items before completing payment.</p>
          </div>

          <div className="p-6 space-y-3">
            {items.map((item) => (
              <div key={item.medicine_id} className="flex justify-between text-sm">
                <span className="text-gray-700">
                  {item.name} <span className="text-gray-400">× {item.quantity}</span>
                </span>
                <span className="font-medium text-gray-900">
                  Rs. {(getUnitPrice(item) * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
            <div className="border-t border-gray-100 pt-3 flex justify-between font-semibold text-gray-900">
              <span>Total</span>
              <span>Rs. {cartTotal.toFixed(2)}</span>
            </div>
          </div>

          <div className="p-6 bg-gray-50 border-t border-gray-100">
            <button
              onClick={() => setShowConfirm(true)}
              disabled={loading}
              className="w-full px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {loading ? "Processing..." : "Confirm & Pay"}
            </button>
          </div>
        </div>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm payment</h3>
            <p className="text-sm text-gray-600 mb-6">
              You're about to pay Rs. {cartTotal.toFixed(2)} for {items.length} item{items.length === 1 ? "" : "s"}.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPayment}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default MedicineCheckoutPage;
