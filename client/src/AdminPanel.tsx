import { useState, useEffect } from 'react';
import { Trash2, Users, Layout, RefreshCw, Database, FileText, Terminal, Plus, X } from 'lucide-react';
import type { User, DesignData, DesignTemplate } from './types';

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
    timestamp: string;
}

export function AdminPanel({ token, onClose }: AdminPanelProps) {
    const [view, setView] = useState<'users' | 'designs' | 'templates' | 'logs'>('users');
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [designs, setDesigns] = useState<AdminDesign[]>([]);
    const [templates, setTemplates] = useState<any[]>([]);
    const [logs, setLogs] = useState<AdminLog[]>([]);
    const [loading, setLoading] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Template Modal State
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<any>(null);

    const apiBase = import.meta.env.VITE_API_BASE || '/api';

    useEffect(() => {
        fetchData();
    }, [view]);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const headers = { 'Authorization': `Bearer ${token}` };
            if (view === 'users') {
                const res = await fetch(`${apiBase}/admin/users`, { headers });
                if (!res.ok) throw new Error('Failed to fetch users');
                setUsers(await res.json());
            } else if (view === 'designs') {
                const res = await fetch(`${apiBase}/admin/designs`, { headers });
                if (!res.ok) throw new Error('Failed to fetch designs');
                setDesigns(await res.json());
            } else if (view === 'templates') {
                const res = await fetch(`${apiBase}/admin/templates`, { headers });
                if (!res.ok) throw new Error('Failed to fetch templates');
                setTemplates(await res.json());
            } else if (view === 'logs') {
                const res = await fetch(`${apiBase}/admin/logs`, { headers });
                if (!res.ok) throw new Error('Failed to fetch logs');
                setLogs(await res.json());
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

    const handleSaveTemplate = async (template: any) => {
        try {
            const isUpdate = !!template.id && templates.some(t => t.id === template.id);
            const url = isUpdate ? `${apiBase}/admin/templates/${template.id}` : `${apiBase}/admin/templates`;
            const method = isUpdate ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(template)
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
                                        <th>Name</th>
                                        <th>ID</th>
                                        <th>Active</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {templates.map(t => (
                                        <tr key={t.id}>
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

                {!loading && !error && view === 'logs' && (
                    <div className="logs-admin">
                        <div className="table-responsive">
                            <table className="admin-table logs-table">
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
                                        <tr key={log.id}>
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
            `}</style>
        </div>
    );
}

function TemplateModal({ template, onClose, onSave }: { template: any, onClose: () => void, onSave: (t: any) => void }) {
    const [formData, setFormData] = useState({
        id: template?.id || '',
        name: template?.name || '',
        description: template?.description || '',
        data: template ? JSON.stringify(template.data, null, 2) : '',
        is_active: template?.is_active !== undefined ? template.is_active : true
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const parsedData = JSON.parse(formData.data);
            onSave({
                ...formData,
                data: parsedData
            });
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
                    <div className="form-group">
                        <label>Description</label>
                        <input
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Standard portrait business card setup"
                        />
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
