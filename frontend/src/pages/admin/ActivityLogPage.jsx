import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import AdminService from '../../services/AdminService';

const ActivityLogPage = () => {
  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ userId: '', action: '', from: '', to: '' });

  const fetchLogs = async (page = 1, filters = {}) => {
    setLoading(true);
    try {
      const params = { ...filters, page };
      const res = await AdminService.getActivityLogs(params);
      setLogs(res.logs);
      setPage(res.page);
      setPages(res.pages);
      setTotal(res.total);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1, filters);
  }, []);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    fetchLogs(1, filters);
  };

  const handlePageChange = (newPage) => {
    fetchLogs(newPage, filters);
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold mb-4 text-gray-800">Activity Log</h1>
          <form className="flex flex-wrap gap-4 mb-4" onSubmit={handleFilterSubmit}>
            <input
              type="text"
              name="userId"
              value={filters.userId}
              onChange={handleFilterChange}
              placeholder="User ID"
              className="border px-2 py-1 rounded"
            />
            <input
              type="text"
              name="action"
              value={filters.action}
              onChange={handleFilterChange}
              placeholder="Action"
              className="border px-2 py-1 rounded"
            />
            <input
              type="date"
              name="from"
              value={filters.from}
              onChange={handleFilterChange}
              className="border px-2 py-1 rounded"
            />
            <input
              type="date"
              name="to"
              value={filters.to}
              onChange={handleFilterChange}
              className="border px-2 py-1 rounded"
            />
            <button type="submit" className="bg-blue-600 text-white px-4 py-1 rounded">Filter</button>
          </form>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-50">
                <tr>
                  <th className="border-b px-4 py-2 text-left text-xs font-semibold text-gray-600">User ID</th>
                  <th className="border-b px-4 py-2 text-left text-xs font-semibold text-gray-600">User</th>
                  <th className="border-b px-4 py-2 text-left text-xs font-semibold text-gray-600">Action</th>
                  <th className="border-b px-4 py-2 text-left text-xs font-semibold text-gray-600">Details</th>
                  <th className="border-b px-4 py-2 text-left text-xs font-semibold text-gray-600">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="text-center py-4">Loading...</td></tr>
                ) : logs.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-4">No logs found.</td></tr>
                ) : (
                  logs.map(log => (
                    <tr key={log.id} className="hover:bg-gray-50 transition">
                      <td className="border-b px-4 py-2 text-sm text-gray-700">{log.userId}</td>
                      <td className="border-b px-4 py-2 text-sm text-gray-700">
                        {log.user?.name} <br />
                        <span className="text-xs text-gray-500">{log.user?.email}</span>
                      </td>
                      <td className="border-b px-4 py-2 text-sm text-gray-700">{log.action}</td>
                      <td className="border-b px-4 py-2 text-sm text-gray-700">{log.details}</td>
                      <td className="border-b px-4 py-2 text-sm text-gray-700">{new Date(log.timestamp).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="flex justify-between items-center mt-4">
            <span className="text-sm text-gray-600">Page {page} of {pages} ({total} logs)</span>
            <div className="space-x-2">
              <button disabled={page <= 1} onClick={() => handlePageChange(page - 1)} className="px-2 py-1 border rounded disabled:opacity-50">Prev</button>
              <button disabled={page >= pages} onClick={() => handlePageChange(page + 1)} className="px-2 py-1 border rounded disabled:opacity-50">Next</button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ActivityLogPage; 