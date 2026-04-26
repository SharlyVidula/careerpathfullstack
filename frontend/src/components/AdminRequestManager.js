import React, { useState, useEffect } from 'react';
import apiClient from '../apiClient'; // Assuming we've set this up

const AdminRequestManager = () => {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    const res = await apiClient.get('/admin/connection-requests');
    setRequests(res.data);
  };

  const handleAction = async (requestId, status) => {
    try {
      await apiClient.put(`/admin/connection-requests/${requestId}`, { status });
      fetchRequests(); // Refresh list
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  return (
    <div className="admin-requests">
      <h3>Pending Employer Requests</h3>
      <table>
        <thead>
          <tr>
            <th>Employer</th>
            <th>Target Employee</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {requests.filter(r => r.status === 'PENDING_ADMIN').map(req => (
            <tr key={req._id}>
              <td>{req.employerId.name}</td>
              <td>{req.employeeId.name}</td>
              <td>
                <button onClick={() => handleAction(req._id, 'PENDING_EMPLOYEE')}>Approve</button>
                <button onClick={() => handleAction(req._id, 'DENIED')}>Reject</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminRequestManager;