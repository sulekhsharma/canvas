import { useState, useEffect } from 'react';
import { Trash2, Users, Layout, RefreshCw, Database, FileText, Terminal, Plus, X, Briefcase, ChevronLeft, ChevronRight, Search } from 'lucide-react';
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

interface AdminLog {
    id: number;
    method: string;
    url: string;
    user_email: string;
    status_code: number;
    duration: number;
    ip: string;
    user_agent: string;
    headers: string;
    request_body: string;
    response_body: string;
    timestamp: string;
}

export function AdminPanel({ token, onClose }: AdminPanelProps) {
    const [view, setView] = useState<'users' | 'designs' | 'templates' | 'logs' | 'business'>('users');
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [designs, setDesigns] = useState<AdminDesign[]>([]);
    const [templates, setTemplates] = useState<any[]>([]);
    const [logs, setLogs] = useState<AdminLog[]>([]);
    const [loading, setLoading] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Logs Pagination & Filter
    const [logsPage, setLogsPage] = useState(1);
    const [logsFilter, setLogsFilter] = useState('');
    const [logsPagination, setLogsPagination] = useState({ total: 0, pages: 1, limit: 50 });

    // Modal State
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<any>(null);
    const [selectedLog, setSelectedLog] = useState<AdminLog | null>(null);

    const apiBase = import.meta.env.VITE_API_BASE || '/api';

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchData();
        }, view === 'logs' ? 300 : 0);
        return () => clearTimeout(timer);
    }, [view, logsPage, logsFilter]);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const headers = { 'Authorization': `Bearer ${token}` };
            if (view === 'users') {
                const res = await fetch(`${apiBase}/admin/users`, { headers });
                if (!res.ok) throw new Error('Failed to fetch users');
                setUsers(await res.json());
            } else if (view === 'designs' || view === 'business') {
                const res = await fetch(`${apiBase}/admin/designs`, { headers });
                if (!res.ok) throw new Error('Failed to fetch designs');
                setDesigns(await res.json());
            } else if (view === 'templates') {
                const res = await fetch(`${apiBase}/admin/templates`, { headers });
                if (!res.ok) throw new Error('Failed to fetch templates');
                setTemplates(await res.json());
            } else if (view === 'logs') {
                const res = await fetch(`${apiBase}/admin/logs?page=${logsPage}&limit=${logsPagination.limit}&url=${encodeURIComponent(logsFilter)}`, { headers });
                if (!res.ok) throw new Error('Failed to fetch logs');
                const data = await res.json();
                setLogs(data.logs);
                setLogsPagination(data.pagination);
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

    const handleSaveTemplate = async (templateData: FormData) => {
        try {
            const id = templateData.get('id');
            const isUpdate = !!id && templates.some(t => t.id === id);
            const url = isUpdate ? `${apiBase}/admin/templates/${id}` : `${apiBase}/admin/templates`;
            const method = isUpdate ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: templateData
            });

            if (res.ok) {
                setShowTemplateModal(false);
                setEditingTemplate(null);
                fetchData();
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to save template');
            }
        } catch (e) {
            alert('Error saving template');
        }
    };

    const handleDeleteTemplate = async (id: string) => {
        if (!confirm('Delete this template?')) return;
        try {
            const res = await fetch(`${apiBase}/admin/templates/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) fetchData();
            else alert('Failed to delete template');
        } catch (e) {
            alert('Error deleting template');
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
                <button
                    className={view === 'templates' ? 'active' : ''}
                    onClick={() => setView('templates')}
                >
                    <FileText size={18} /> Templates
                </button>
                <button
                    className={view === 'business' ? 'active' : ''}
                    onClick={() => setView('business')}
                >
                    <Briefcase size={18} /> Business Data
                </button>
                <button
                    className={view === 'logs' ? 'active' : ''}
                    onClick={() => setView('logs')}
                >
                    <Terminal size={18} /> API Logs
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

                {!loading && !error && view === 'templates' && (
                    <div className="templates-admin">
                        <div className="view-header">
                            <h3>Manage Templates</h3>
                            <button className="add-btn" onClick={() => { setEditingTemplate(null); setShowTemplateModal(true); }}>
                                <Plus size={16} /> Add New Template
                            </button>
                        </div>
                        <div className="table-responsive">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Image</th>
                                        <th>Name</th>
                                        <th>ID</th>
                                        <th>Active</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {templates.map(t => (
                                        <tr key={t.id}>
                                            <td>
                                                {t.image_url ? (
                                                    <img src={`${apiBase.replace('/api', '')}${t.image_url}`} alt={t.name} className="template-thumb-mini" />
                                                ) : (
                                                    <div className="template-thumb-mini placeholder">No Img</div>
                                                )}
                                            </td>
                                            <td>{t.name}</td>
                                            <td><code>{t.id}</code></td>
                                            <td>{t.is_active ? '✅' : '❌'}</td>
                                            <td className="actions-cell">
                                                <button className="edit-btn-text" onClick={() => { setEditingTemplate(t); setShowTemplateModal(true); }}>Edit</button>
                                                <button className="delete-btn-text" onClick={() => handleDeleteTemplate(t.id)}>Delete</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {!loading && !error && view === 'business' && (
                    <div className="designs-admin">
                        <div className="table-header">
                            <h3>Business Information Log</h3>
                            <p>Data provided by users during QR generation</p>
                        </div>
                        <div className="table-responsive">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Business Name</th>
                                        <th>GMB URL</th>
                                        <th>Hook Text</th>
                                        <th>Address</th>
                                        <th>User</th>
                                        <th>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {designs.map(d => (
                                        <tr key={d.id}>
                                            <td>{d.data.businessName || '-'}</td>
                                            <td><code style={{ fontSize: '0.7rem' }}>{d.data.gmbUrl || '-'}</code></td>
                                            <td>{d.data.hookText || '-'}</td>
                                            <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {d.data.physicalAddress || '-'}
                                            </td>
                                            <td>{d.user_email}</td>
                                            <td>{new Date(d.updated_at).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {!loading && !error && view === 'logs' && (
                    <div className="logs-admin">
                        <div className="filter-bar" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', background: 'white', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                            <div className="search-input-wrapper" style={{ position: 'relative', flex: 1 }}>
                                <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                <input
                                    type="text"
                                    placeholder="Filter by API URL (e.g. /api/export)..."
                                    value={logsFilter}
                                    onChange={(e) => { setLogsFilter(e.target.value); setLogsPage(1); }}
                                    style={{ width: '100%', padding: '0.6rem 0.6rem 0.6rem 2.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.9rem', outline: 'none' }}
                                />
                            </div>
                            <div className="log-count" style={{ fontSize: '0.85rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                                Found <b>{logsPagination.total}</b> entries
                            </div>
                        </div>
                        <div className="table-responsive">
                            <table className="admin-table logs-table clickable-rows">
                                <thead>
                                    <tr>
                                        <th>Time</th>
                                        <th>User</th>
                                        <th>Request</th>
                                        <th>Status</th>
                                        <th>Duration</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.map(log => (
                                        <tr key={log.id} onClick={() => setSelectedLog(log)}>
                                            <td>{new Date(log.timestamp).toLocaleTimeString()}</td>
                                            <td title={log.ip}>{log.user_email}</td>
                                            <td>
                                                <span className={`method-badge ${log.method.toLowerCase()}`}>{log.method}</span>
                                                <code className="url-code">{log.url}</code>
                                            </td>
                                            <td>
                                                <span className={`status-badge ${log.status_code >= 400 ? 'error' : 'success'}`}>
                                                    {log.status_code}
                                                </span>
                                            </td>
                                            <td>{log.duration}ms</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="pagination-controls" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', background: 'white', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                            <div className="pagination-info" style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                Showing <b>{logs.length}</b> of <b>{logsPagination.total}</b> logs
                            </div>
                            <div className="pagination-buttons" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <button
                                    disabled={logsPage === 1}
                                    onClick={() => setLogsPage(p => p - 1)}
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', border: '1px solid #e2e8f0', background: logsPage === 1 ? '#f8fafc' : 'white', cursor: logsPage === 1 ? 'not-allowed' : 'pointer', borderRadius: '6px', fontSize: '0.85rem' }}
                                >
                                    <ChevronLeft size={16} /> Prev
                                </button>
                                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b' }}>Page {logsPage} of {logsPagination.pages || 1}</span>
                                <button
                                    disabled={logsPage >= logsPagination.pages}
                                    onClick={() => setLogsPage(p => p + 1)}
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', border: '1px solid #e2e8f0', background: logsPage >= logsPagination.pages ? '#f8fafc' : 'white', cursor: logsPage >= logsPagination.pages ? 'not-allowed' : 'pointer', borderRadius: '6px', fontSize: '0.85rem' }}
                                >
                                    Next <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {
                showTemplateModal && (
                    <TemplateModal
                        template={editingTemplate}
                        onClose={() => setShowTemplateModal(false)}
                        onSave={handleSaveTemplate}
                    />
                )
            }

            {
                selectedLog && (
                    <LogDetailsModal
                        log={selectedLog}
                        onClose={() => setSelectedLog(null)}
                    />
                )
            }

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
                .admin-tabs button:hover:not(.active) { background: #f1f5f9; }
                
                .table-header { padding: 1.5rem; border-bottom: 1px solid #e2e8f0; border-top-left-radius: 12px; border-top-right-radius: 12px; background: white; }
                .table-header h3 { margin: 0; font-size: 1.1rem; color: #1e293b; }
                .table-header p { margin: 0.25rem 0 0 0; font-size: 0.85rem; color: #64748b; }

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

                /* New Styles */
                .view-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
                .add-btn { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; background: #10b981; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; }
                .edit-btn-text { color: #2563eb; background: none; border: none; cursor: pointer; margin-right: 1rem; font-weight: 600; }
                .delete-btn-text { color: #ef4444; background: none; border: none; cursor: pointer; font-weight: 600; }
                
                .method-badge { padding: 0.2rem 0.4rem; border-radius: 4px; font-size: 0.7rem; font-weight: 800; margin-right: 0.5rem; }
                .method-badge.get { background: #dcfce7; color: #166534; }
                .method-badge.post { background: #ecfeff; color: #0891b2; }
                .method-badge.put { background: #fef9c3; color: #854d0e; }
                .method-badge.delete { background: #fee2e2; color: #991b1b; }
                .url-code { font-size: 0.8rem; color: #475569; }
                .status-badge { padding: 0.2rem 0.5rem; border-radius: 99px; font-size: 0.75rem; font-weight: 700; }
                .status-badge.success { background: #dcfce7; color: #166534; }
                .status-badge.error { background: #fee2e2; color: #991b1b; }

                .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 100; }
                .modal-content { background: white; width: 90%; max-width: 800px; max-height: 90vh; overflow-y: auto; border-radius: 12px; padding: 2rem; position: relative; }
                .modal-close { position: absolute; top: 1rem; right: 1rem; cursor: pointer; color: #64748b; }
                
                .template-form { display: flex; flex-direction: column; gap: 1.5rem; }
                .form-group { display: flex; flex-direction: column; gap: 0.5rem; }
                .form-group label { font-weight: 600; color: #1e293b; }
                .form-group input, .form-group textarea { padding: 0.75rem; border: 1px solid #e2e8f0; border-radius: 8px; font-family: inherit; }
                .form-group textarea { font-family: monospace; font-size: 0.85rem; min-height: 300px; }
                .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
                .form-actions { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1rem; }
                .save-btn { padding: 0.75rem 2rem; background: #2563eb; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; }
                .cancel-btn { padding: 0.75rem 2rem; background: #f1f5f9; color: #64748b; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; }

                .template-thumb-mini {
                    width: 40px;
                    height: 56px;
                    object-fit: cover;
                    border-radius: 4px;
                    background: #f1f5f9;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.6rem;
                    color: #94a3b8;
                    border: 1px solid #e2e8f0;
                }
                .template-thumb-mini.placeholder { font-size: 0.5rem; text-align: center; }

                .image-upload-preview {
                    width: 100%;
                    height: 120px;
                    border: 2px dashed #e2e8f0;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                    margin-top: 0.5rem;
                }
                .image-upload-preview img {
                    width: 100%;
                    height: 100%;
                    object-fit: contain;
                }
                .admin-table.clickable-rows tbody tr { cursor: pointer; transition: background 0.2s; }
                .admin-table.clickable-rows tbody tr:hover { background: #f1f5f9; }

                .log-details-modal { max-width: 900px !important; }
                .log-info-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                    gap: 1.5rem;
                    margin-bottom: 2rem;
                    background: #f8fafc;
                    padding: 1.5rem;
                    border-radius: 8px;
                    border: 1px solid #e2e8f0;
                }
                .info-item { display: flex; flex-direction: column; gap: 0.25rem; }
                .info-item.full-width { grid-column: 1 / -1; }
                .info-item label { font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
                .info-item span, .info-item code { font-size: 0.9rem; color: #1e293b; word-break: break-all; }
                .ua-text { font-family: monospace; font-size: 0.8rem !important; }

                .log-data-sections { display: flex; flex-direction: column; gap: 1.5rem; }
                .data-section h4 { margin: 0 0 0.5rem 0; color: #334155; font-size: 0.9rem; }
                .data-section pre {
                    background: #0f172a;
                    color: #e2e8f0;
                    padding: 1rem;
                    border-radius: 6px;
                    font-size: 0.8rem;
                    overflow-x: auto;
                    max-height: 300px;
                    white-space: pre-wrap;
                    word-break: break-all;
                }
                
                /* Custom scrollbar for pre */
                .data-section pre::-webkit-scrollbar { width: 8px; height: 8px; }
                .data-section pre::-webkit-scrollbar-track { background: #1e293b; }
                .data-section pre::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
            `}</style>
        </div>
    );
}

function LogDetailsModal({ log, onClose }: { log: AdminLog, onClose: () => void }) {
    const formatJSON = (str: string) => {
        try {
            return JSON.stringify(JSON.parse(str), null, 2);
        } catch (e) {
            return str;
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content log-details-modal">
                <button className="modal-close" onClick={onClose}><X size={24} /></button>
                <h3>API Log Details</h3>

                <div className="log-info-grid">
                    <div className="info-item">
                        <label>ID</label>
                        <span>{log.id}</span>
                    </div>
                    <div className="info-item">
                        <label>Timestamp</label>
                        <span>{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                    <div className="info-item">
                        <label>Method</label>
                        <span className={`method-badge ${log.method.toLowerCase()}`}>{log.method}</span>
                    </div>
                    <div className="info-item">
                        <label>Status</label>
                        <span className={`status-badge ${log.status_code >= 400 ? 'error' : 'success'}`}>{log.status_code}</span>
                    </div>
                    <div className="info-item full-width">
                        <label>URL</label>
                        <code>{log.url}</code>
                    </div>
                    <div className="info-item">
                        <label>User Email</label>
                        <span>{log.user_email}</span>
                    </div>
                    <div className="info-item">
                        <label>IP Address</label>
                        <span>{log.ip}</span>
                    </div>
                    <div className="info-item full-width">
                        <label>User Agent</label>
                        <span className="ua-text">{log.user_agent}</span>
                    </div>
                </div>

                <div className="log-data-sections">
                    <div className="data-section">
                        <h4>Headers</h4>
                        <pre>{formatJSON(log.headers)}</pre>
                    </div>
                    <div className="data-section">
                        <h4>Request Data</h4>
                        <pre>{log.request_body ? formatJSON(log.request_body) : 'No request body'}</pre>
                    </div>
                    <div className="data-section">
                        <h4>Response Data</h4>
                        <pre>{log.response_body ? formatJSON(log.response_body) : 'No response body'}</pre>
                    </div>
                </div>
            </div>
        </div>
    );
}

function TemplateModal({ template, onClose, onSave }: { template: any, onClose: () => void, onSave: (t: FormData) => void }) {
    const [formData, setFormData] = useState({
        id: template?.id || '',
        name: template?.name || '',
        description: template?.description || '',
        data: template ? JSON.stringify(template.data, null, 2) : '',
        is_active: template?.is_active !== undefined ? template.is_active : true
    });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(template?.image_url ? `/public/uploads/templates/${template.image_url.split('/').pop()}` : null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 1024 * 1024) {
                alert('File size must be less than 1MB');
                return;
            }
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const parsedData = JSON.parse(formData.data);
            const data = new FormData();
            data.append('id', formData.id);
            data.append('name', formData.name);
            data.append('description', formData.description);
            data.append('data', JSON.stringify(parsedData));
            data.append('is_active', String(formData.is_active));
            if (selectedFile) {
                data.append('image', selectedFile);
            }
            onSave(data);
        } catch (err) {
            alert('Invalid JSON in template data');
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <button className="modal-close" onClick={onClose}><X size={24} /></button>
                <h3>{template ? 'Edit Template' : 'Add New Template'}</h3>
                <form className="template-form" onSubmit={handleSubmit}>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Template Name</label>
                            <input
                                required
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Business Card Portrait"
                            />
                        </div>
                        <div className="form-group">
                            <label>Template ID (Slug)</label>
                            <input
                                required
                                value={formData.id}
                                onChange={e => setFormData({ ...formData, id: e.target.value })}
                                placeholder="business-card-p"
                                disabled={!!template}
                            />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Description</label>
                            <input
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Standard portrait business card setup"
                            />
                        </div>
                        <div className="form-group">
                            <label>Template Image (PNG/JPG, max 1MB)</label>
                            <input
                                type="file"
                                accept="image/png, image/jpeg"
                                onChange={handleFileChange}
                            />
                            {previewUrl && (
                                <div className="image-upload-preview">
                                    <img src={previewUrl.startsWith('data:') ? previewUrl : `${window.location.protocol}//${window.location.host}${previewUrl}`} alt="Preview" />
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Template Configuration (JSON Elements)</label>
                        <textarea
                            required
                            value={formData.data}
                            onChange={e => setFormData({ ...formData, data: e.target.value })}
                            placeholder='{ "orientation": "portrait", "dimensions": {...}, "elements": [...] }'
                        />
                    </div>
                    <div className="form-group">
                        <label>
                            <input
                                type="checkbox"
                                checked={formData.is_active}
                                onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                            /> Active
                        </label>
                    </div>
                    <div className="form-actions">
                        <button type="button" className="cancel-btn" onClick={onClose}>Cancel</button>
                        <button type="submit" className="save-btn">Save Template</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
