import { useState, useEffect } from 'react'
import './index.css'
import { DesignBuilder } from './DesignBuilder'
import { LoginPage } from './LoginPage'
import { AdminPanel } from './AdminPanel'
import { AdminLogin } from './AdminLogin'
import type { DesignTemplate, User, DesignData } from './types'
import { LogOut, Plus, Clock, LayoutGrid } from 'lucide-react'

function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'))
  const [user, setUser] = useState<User | null>(JSON.parse(localStorage.getItem('user') || 'null'))
  const [selectedTemplate, setSelectedTemplate] = useState<DesignTemplate | null>(null)
  const [dynamicTemplates, setDynamicTemplates] = useState<DesignTemplate[]>([])
  const [myDesigns, setMyDesigns] = useState<any[]>([])
  const [editingDesign, setEditingDesign] = useState<DesignData | null>(null)
  const [view, setView] = useState<'selection' | 'history'>('selection')
  const [showAdmin, setShowAdmin] = useState(false)
  const [showAdminLogin, setShowAdminLogin] = useState(false)

  const apiBase = import.meta.env.VITE_API_BASE || '/api';

  useEffect(() => {
    // Check for Admin URL access on load
    if (window.location.pathname === '/admin') {
      if (token) {
        // Logged in
        const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
        if (storedUser?.role === 'admin' || user?.role === 'admin') {
          setShowAdmin(true);
        } else {
          // Not authorized
          window.history.pushState({}, '', '/');
          setShowAdmin(false);
        }
      } else {
        // Not logged in, show specific Admin Login
        setShowAdminLogin(true);
      }
    }

    fetchTemplates()

    if (token) {
      // Refresh user data from local storage
      const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
      if (storedUser && storedUser.role !== user?.role) {
        setUser(storedUser);
      }
      fetchDesigns()
    }
  }, [token])

  const fetchTemplates = async () => {
    try {
      const res = await fetch(`${apiBase}/templates`)
      const data = await res.json()
      if (res.ok) setDynamicTemplates(data)
    } catch (err) {
      console.error(err)
    }
  }

  const fetchDesigns = async () => {
    try {
      const res = await fetch(`${apiBase}/designs`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (res.ok) setMyDesigns(data)
    } catch (err) {
      console.error(err)
    }
  }

  const handleLogin = (newToken: string, newUser: User) => {
    setToken(newToken)
    setUser(newUser)
    localStorage.setItem('token', newToken)
    localStorage.setItem('user', JSON.stringify(newUser))

    // Redirect to admin if that was the intended destination
    if (window.location.pathname === '/admin' && newUser.role === 'admin') {
      setShowAdmin(true);
    } else if (window.location.pathname === '/admin') {
      window.history.pushState({}, '', '/');
    }
  }

  const handleAdminLoginSuccess = (newToken: string, newUser: User) => {
    handleLogin(newToken, newUser);
    setShowAdmin(true);
    setShowAdminLogin(false);
  }

  const handleLogout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setSelectedTemplate(null)
    setEditingDesign(null)
    setShowAdmin(false)
    setShowAdminLogin(false)
  }

  const startEditing = (design: any) => {
    const template = dynamicTemplates.find(t => t.id === design.template_id) || dynamicTemplates[0]
    setEditingDesign(design.data)
    setSelectedTemplate(template)
  }

  // Admin Login Screen (checks !token to prevent showing if already logged in)
  if (showAdminLogin && !token) {
    return (
      <AdminLogin
        onBack={() => {
          setShowAdminLogin(false);
          window.history.pushState({}, '', '/');
        }}
        onLoginSuccess={handleAdminLoginSuccess}
      />
    );
  }

  if (!token) {
    return <LoginPage onLogin={handleLogin} />
  }

  if (showAdmin && user?.role === 'admin') {
    return <AdminPanel token={token} onClose={() => {
      setShowAdmin(false);
      window.history.pushState({}, '', '/');
    }} />
  }

  if (selectedTemplate) {
    return (
      <DesignBuilder
        initialTemplate={selectedTemplate}
        onBack={() => { setSelectedTemplate(null); setEditingDesign(null); fetchDesigns(); }}
        initialData={editingDesign || undefined}
        token={token}
      />
    )
  }

  return (
    <div className="app-container">
      <nav className="top-nav">
        <div className="nav-brand">GMB QR Generator</div>
        <div className="nav-actions">
          <button onClick={() => setView('selection')} className={view === 'selection' ? 'active' : ''}>
            <Plus size={18} /> New Design
          </button>
          <button onClick={() => setView('history')} className={view === 'history' ? 'active' : ''}>
            <Clock size={18} /> My Designs ({myDesigns.length})
          </button>
          <div className="user-profile">
            <span>{user?.name}</span>
            <button onClick={handleLogout} className="logout-btn"><LogOut size={16} /></button>
          </div>
        </div>
      </nav>

      <main className="dashboard-content">
        {view === 'selection' ? (
          <div className="centered-view">
            <h1>Select a Design Base</h1>
            <p>Start fresh with a professional, conversion-optimized template.</p>
            <div className="template-grid">
              {dynamicTemplates.length === 0 && <p>Loading templates...</p>}
              {dynamicTemplates.map(template => (
                <div key={template.id} className="template-card" onClick={() => setSelectedTemplate(template)}>
                  <div className={`preview-placeholder ${template.orientation}`}>
                    {template.orientation === 'portrait' ? <LayoutGrid /> : <LayoutGrid style={{ transform: 'rotate(90deg)' }} />}
                  </div>
                  <h3>{template.name}</h3>
                  <p>{template.description}</p>
                  <button className="select-btn">Customize Template</button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="history-view">
            <h1>My Recent Designs</h1>
            {myDesigns.length === 0 ? (
              <div className="empty-state">
                <p>You haven't saved any designs yet.</p>
                <button className="primary-btn" onClick={() => setView('selection')}>Create One Now</button>
              </div>
            ) : (
              <div className="designs-grid">
                {myDesigns.map(design => (
                  <div key={design.id} className="design-history-card">
                    <div className="design-info">
                      <h3>{design.data.businessName || 'Unnamed Design'}</h3>
                      <span className="template-badge">{design.template_id}</span>
                      <p className="timestamp">Saved: {new Date(design.updated_at).toLocaleDateString()}</p>
                    </div>
                    <div className="card-actions">
                      <button onClick={() => startEditing(design)} className="edit-btn">Edit Design</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <style>{`
        .top-nav { display: flex; justify-content: space-between; align-items: center; padding: 1rem 4rem; background: white; border-bottom: 1px solid #e2e8f0; position: sticky; top: 0; z-index: 10; }
        .nav-brand { font-size: 1.25rem; font-weight: 800; color: #1e293b; }
        .nav-actions { display: flex; gap: 1rem; align-items: center; }
        .nav-actions button { display: flex; align-items: center; gap: 0.5rem; background: none; border: none; padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer; color: #64748b; font-weight: 600; }
        .nav-actions button.active { background: #eff6ff; color: #2563eb; }
        .logout-btn { color: #ef4444 !important; }
        .user-profile { background: #f8fafc; padding: 0.5rem 1rem; border-radius: 99px; display: flex; gap: 1rem; align-items: center; font-size: 0.9rem; font-weight: 500; }
        
        .dashboard-content { padding: 4rem; max-width: 1400px; margin: 0 auto; }
        .centered-view { text-align: center; }
        .centered-view h1 { font-size: 2.5rem; margin-bottom: 1rem; }
        .centered-view p { color: #64748b; font-size: 1.1rem; margin-bottom: 3rem; }

        .template-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 2rem; }
        .template-card { background: white; border-radius: 20px; padding: 2rem; border: 1px solid #e2e8f0; cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .template-card:hover { transform: translateY(-10px); box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); border-color: #2563eb; }
        .preview-placeholder { background: #f1f5f9; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: #94a3b8; font-size: 3rem; margin-bottom: 2rem; }
        .preview-placeholder.portrait { aspect-ratio: 1/1.41; }
        .preview-placeholder.square { aspect-ratio: 1/1; }

        .design-history-card { background: white; padding: 1.5rem; border-radius: 16px; border: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; transition: all 0.2s; }
        .design-history-card:hover { border-color: #2563eb; background: #fafafa; }
        .template-badge { font-size: 0.7rem; background: #f1f5f9; padding: 0.2rem 0.5rem; border-radius: 4px; color: #64748b; text-transform: uppercase; font-weight: 700; }
        .timestamp { font-size: 0.8rem; color: #94a3b8; margin: 0.5rem 0 0; }
        .edit-btn { background: #2563eb; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; font-weight: 600; cursor: pointer; }
        .designs-grid { display: grid; grid-template-columns: 1fr; gap: 1rem; }
        .empty-state { text-align: center; padding: 4rem; background: white; border-radius: 20px; border: 2px dashed #e2e8f0; }

        h1 { color: #1e293b; }
      `}</style>
    </div>
  )
}

export default App
