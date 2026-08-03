import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import MedicineOrderService from "../../services/MedicineOrderService";

const statusStyles = {
  pending: "bg-gray-100 text-gray-800",
  paid: "bg-blue-100 text-blue-800",
  shipped: "bg-amber-100 text-amber-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  failed: "bg-red-100 text-red-800",
};

const MedicineOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 0 });

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const data = await MedicineOrderService.getMyOrders(pagination.page);
        setOrders(data.orders);
        setPagination(data.pagination);
      } catch (error) {
        toast.error(error.error || "Failed to load orders");
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [pagination.page]);

  const formatDate = (dateString) => {
    try {
      return format(parseISO(dateString), "MMM d, yyyy 'at' h:mm a");
    } catch {
      return dateString || "";
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Medicine Orders</h1>
          <p className="mt-1 text-gray-600">Track your medicine orders and their delivery status.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-600"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h3 className="text-lg font-medium text-gray-900">No orders yet</h3>
            <p className="mt-1 text-gray-500">Medicines you order will show up here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-sm text-gray-500">{formatDate(order.created_at)}</p>
                    <h3 className="text-lg font-semibold text-gray-900">Order #{order.id}</h3>
                  </div>
                  <span
                    className={`px-2.5 py-1 text-xs font-semibold rounded-full ${statusStyles[order.status] || "bg-gray-100 text-gray-800"}`}
                  >
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </div>

                <ul className="text-sm text-gray-700 space-y-1 mb-3">
                  {order.items.map((item) => (
                    <li key={item.id} className="flex justify-between">
                      <span>
                        {item.medicine_name} × {item.quantity}
                      </span>
                      <span>Rs. {(item.unit_price * item.quantity).toFixed(2)}</span>
                    </li>
                  ))}
                </ul>

                <div className="border-t border-gray-100 pt-3 flex justify-between font-semibold text-gray-900">
                  <span>Total</span>
                  <span>Rs. {order.total_amount}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {pagination.pages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <button
              onClick={() => setPagination((p) => ({ ...p, page: Math.max(1, p.page - 1) }))}
              disabled={pagination.page === 1}
              className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {pagination.page} of {pagination.pages}
            </span>
            <button
              onClick={() => setPagination((p) => ({ ...p, page: Math.min(p.pages, p.page + 1) }))}
              disabled={pagination.page === pagination.pages}
              className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MedicineOrdersPage;
