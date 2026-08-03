import { useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";

const CartDrawer = ({ isOpen, onClose }) => {
  const { items, removeItem, updateQuantity, cartTotal } = useCart();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const getUnitPrice = (item) =>
    item.discount_price && item.discount_price < item.price ? item.discount_price : item.price;

  const handleCheckout = () => {
    onClose();
    navigate("/dashboard/medicine-checkout");
  };

  return (
    <div className="fixed inset-0 overflow-hidden z-50">
      <div
        className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
        onClick={onClose}
      ></div>

      <div className="fixed inset-y-0 right-0 max-w-md w-full flex">
        <div className="relative w-screen max-w-md transform transition-all ease-in-out duration-300 translate-x-0">
          <div className="h-full flex flex-col bg-white shadow-xl">
            <div className="px-4 py-6 sm:px-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900">Your Cart</h2>
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-500 focus:outline-none"
                  onClick={onClose}
                >
                  <span className="sr-only">Close panel</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {items.length === 0 ? (
                <div className="text-center py-16 px-6">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Your cart is empty</h3>
                  <p className="mt-1 text-sm text-gray-500">Add medicines from the store to get started.</p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {items.map((item) => (
                    <li key={item.medicine_id} className="py-4 px-6">
                      <div className="flex items-start gap-3">
                        <div className="h-16 w-16 flex-shrink-0 rounded-md bg-gray-100 overflow-hidden">
                          {item.image_url ? (
                            <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-gray-400 text-xs">
                              No image
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                          <p className="text-sm text-gray-500">Rs. {getUnitPrice(item)} each</p>
                          {item.prescription_required && (
                            <span className="inline-block mt-1 text-xs px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded">
                              Prescription required
                            </span>
                          )}
                          <div className="mt-2 flex items-center gap-3">
                            <div className="flex items-center border border-gray-300 rounded-md">
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.medicine_id, item.quantity - 1)}
                                className="px-2 py-1 text-gray-600 hover:bg-gray-100 rounded-l-md"
                              >
                                −
                              </button>
                              <span className="px-3 text-sm">{item.quantity}</span>
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.medicine_id, item.quantity + 1)}
                                className="px-2 py-1 text-gray-600 hover:bg-gray-100 rounded-r-md"
                              >
                                +
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeItem(item.medicine_id)}
                              className="text-xs text-red-600 hover:text-red-800"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                        <p className="text-sm font-medium text-gray-900">
                          Rs. {(getUnitPrice(item) * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {items.length > 0 && (
              <div className="border-t border-gray-200 px-6 py-4">
                <div className="flex justify-between text-base font-medium text-gray-900 mb-4">
                  <p>Subtotal</p>
                  <p>Rs. {cartTotal.toFixed(2)}</p>
                </div>
                <button
                  type="button"
                  onClick={handleCheckout}
                  className="w-full px-4 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Checkout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartDrawer;
