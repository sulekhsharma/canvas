import { useState, useEffect } from 'react';
import { Trash2, Users, Layout, RefreshCw, Database } from 'lucide-react';
import type { User, DesignData } from './types';

interface AdminPanelProps {
    token: string;
    onClose: () => void;
}

interface AdminUser extends User {
    created_at: string;
}

interface AdminDesign {
    id: string;
    user_id: string;
    user_email: string;
    template_id: string;
    data: DesignData;
    updated_at: string;
}

export function AdminPanel({ token, onClose }: AdminPanelProps) {
    const [view, setView] = useState<'users' | 'designs'>('users');
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [designs, setDesigns] = useState<AdminDesign[]>([]);
    const [loading, setLoading] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const apiBase = import.meta.env.VITE_API_BASE || '/api';

    useEffect(() => {
        fetchData();
    }, [view]);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            if (view === 'users') {
                const res = await fetch(`${apiBase}/admin/users`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!res.ok) throw new Error('Failed to fetch users');
                const data = await res.json();
                setUsers(data);
            } else {
                const res = await fetch(`${apiBase}/admin/designs`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!res.ok) throw new Error('Failed to fetch designs');
                const data = await res.json();
                setDesigns(data);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSync = async () => {
        setSyncing(true);
        setError(null);
        try {
            const res = await fetch(`${apiBase}/admin/sync`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                alert(data.message || 'Database synced successfully');
                fetchData();
            } else {
                throw new Error(data.error || 'Sync failed');
            }
        } catch (err: any) {
            alert('Error: ' + err.message);
        } finally {
            setSyncing(false);
        }
    };

    const handleDeleteUser = async (id: string) => {
        if (!confirm('Are you sure you want to delete this user and all their designs?')) return;

        try {
            const res = await fetch(`${apiBase}/admin/users/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setUsers(users.filter(u => u.id !== id));
            } else {
                alert('Failed to delete user');
            }
        } catch (e) {
            alert('Error deleting user');
        }
    };

    return (
        <div className="admin-container">
            <header className="admin-header">
                <h2>Admin Dashboard</h2>
                <div className="admin-actions">
                    <button
                        onClick={handleSync}
                        disabled={syncing}
                        className="sync-btn"
                        title="Force Database Schema Sync"
                    >
                        <Database size={18} /> {syncing ? 'Syncing...' : 'Sync DB'}
                    </button>
                    <button onClick={fetchData} title="Refresh Data"><RefreshCw size={18} /></button>
                    <button onClick={onClose} className="close-btn">Exit Admin</button>
                </div>
            </header>

            <div className="admin-tabs">
                <button
                    className={view === 'users' ? 'active' : ''}
                    onClick={() => setView('users')}
                >
                    <Users size={18} /> Users
                </button>
                <button
                    className={view === 'designs' ? 'active' : ''}
                    onClick={() => setView('designs')}
                >
                    <Layout size={18} /> All Designs
                </button>
            </div>

            <div className="admin-content">
                {loading && <div className="loading">Loading data...</div>}
                {error && <div className="error">{error}</div>}

                {!loading && !error && view === 'users' && users.length === 0 && (
                    <div className="empty-admin-state">No users found in the database.</div>
                )}

                {!loading && !error && view === 'users' && users.length > 0 && (
                    <div className="table-responsive">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Created</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => (
                                    <tr key={user.id}>
                                        <td>{user.name}</td>
                                        <td>{user.email}</td>
                                        <td>
                                            <span className={`role-badge ${user.role || 'user'}`}>
                                                {user.role || 'user'}
                                            </span>
                                        </td>
                                        <td>{user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</td>
                                        <td>
                                            {user.role !== 'admin' && (
                                                <button
                                                    className="delete-btn"
                                                    onClick={() => handleDeleteUser(user.id)}
                                                    title="Delete User"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {!loading && !error && view === 'designs' && designs.length === 0 && (
                    <div className="empty-admin-state">No designs have been created yet.</div>
                )}

                {!loading && !error && view === 'designs' && designs.length > 0 && (
                    <div className="designs-grid-admin">
                        {designs.map(design => (
                            <div key={design.id} className="design-card-mini">
                                <div className="design-header">
                                    <span className="user-email">{design.user_email || 'Deleted User'}</span>
                                    <span className="template-name">{design.template_id}</span>
                                </div>
                                <div className="design-body">
                                    <h4>{design.data.businessName || 'Untitled'}</h4>
                                    <p>Updated: {design.updated_at ? new Date(design.updated_at).toLocaleDateString() : 'N/A'}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <style>{`
                .admin-container {
                    padding: 2rem;
                    background: #f8fafc;
                    min-height: 100vh;
                }
                .admin-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 2rem;
                    background: white;
                    padding: 1.5rem;
                    border-radius: 12px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                }
                .admin-header h2 { margin: 0; color: #1e293b; }
                .admin-actions { display: flex; gap: 1rem; }
                .sync-btn {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.5rem 1rem;
                    background: #6366f1;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 600;
                    transition: background 0.2s;
                }
                .sync-btn:hover { background: #4f46e5; }
                .sync-btn:disabled { opacity: 0.7; cursor: not-allowed; }
                
                .admin-actions button[title="Refresh Data"] {
                    background: #f1f5f9;
                    border: 1px solid #e2e8f0;
                    padding: 0.5rem;
                    border-radius: 6px;
                    cursor: pointer;
                    color: #64748b;
                }

                .close-btn {
                    padding: 0.5rem 1rem;
                    background: #ef4444;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 600;
                }
                
                .admin-tabs {
                    display: flex;
                    gap: 1rem;
                    margin-bottom: 2rem;
                }
                .admin-tabs button {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.75rem 1.5rem;
                    background: white;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 600;
                    color: #64748b;
                    transition: all 0.2s;
                }
                .admin-tabs button.active {
                    background: #2563eb;
                    color: white;
                    border-color: #2563eb;
                }

                .admin-table {
                    width: 100%;
                    background: white;
                    border-radius: 12px;
                    border-collapse: collapse;
                    overflow: hidden;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                }
                .admin-table th, .admin-table td {
                    text-align: left;
                    padding: 1rem 1.5rem;
                    border-bottom: 1px solid #e2e8f0;
                }
                .admin-table th {
                    background: #f1f5f9;
                    font-weight: 600;
                    color: #475569;
                }
                .role-badge {
                    padding: 0.25rem 0.5rem;
                    border-radius: 99px;
                    font-size: 0.75rem;
                    text-transform: uppercase;
                    font-weight: 700;
                }
                .role-badge.admin { background: #dbeafe; color: #1e40af; }
                .role-badge.user { background: #f1f5f9; color: #475569; }
                
                .delete-btn {
                    background: none;
                    border: none;
                    color: #ef4444;
                    cursor: pointer;
                    padding: 4px;
                    border-radius: 4px;
                }
                .delete-btn:hover { background: #fee2e2; }

                .designs-grid-admin {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    gap: 1.5rem;
                }
                .design-card-mini {
                    background: white;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    padding: 1rem;
                }
                .design-header {
                    display: flex;
                    justify-content: space-between;
                    font-size: 0.8rem;
                    color: #64748b;
                    margin-bottom: 0.5rem;
                    border-bottom: 1px solid #f1f5f9;
                    padding-bottom: 0.5rem;
                }
                .user-email { font-weight: 500; color: #2563eb; }
                .design-body h4 { margin: 0 0 0.25rem 0; font-size: 1rem; }
                .design-body p { margin: 0; font-size: 0.8rem; color: #94a3b8; }

                .empty-admin-state {
                    text-align: center;
                    padding: 4rem;
                    background: white;
                    border-radius: 12px;
                    border: 2px dashed #e2e8f0;
                    color: #64748b;
                    font-size: 1.1rem;
                }
            `}</style>
        </div>
    );
}
