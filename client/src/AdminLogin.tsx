import { useState } from 'react';
import { ShieldCheck, ArrowLeft } from 'lucide-react';

interface AdminLoginProps {
    onBack: () => void;
    onLoginSuccess: (token: string, user: any) => void;
}

export const AdminLogin = ({ onBack, onLoginSuccess }: AdminLoginProps) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';
            const res = await fetch(`${apiBase}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();

            if (res.ok) {
                if (data.user.role !== 'admin') {
                    setError('Access Denied: This account does not have admin privileges.');
                } else {
                    setIsLoggedIn(true);
                    onLoginSuccess(data.token, data.user);
                }
            } else {
                setError(data.error || 'Login failed');
            }
        } catch (err) {
            setError('Connection error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (isLoggedIn) {
        return (
            <div style={{ padding: '2rem' }}>
                <p>Redirecting to dashboard...</p>
                {/* This handles the internal state if needed, but app likely redirects */}
            </div>
        );
    }

    return (
        <div className="admin-login-container">
            <button className="back-btn" onClick={onBack}>
                <ArrowLeft size={16} /> Back to Home
            </button>

            <div className="admin-login-card">
                <div className="header">
                    <div className="icon-wrapper">
                        <ShieldCheck size={32} color="#dc2626" />
                    </div>
                    <h2>Admin Portal</h2>
                    <p>Secure access for system administrators only</p>
                </div>

                <form onSubmit={handleLogin}>
                    <div className="input-group">
                        <label>Admin Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="admin@example.com"
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    <button type="submit" disabled={loading} className="login-btn">
                        {loading ? 'Verifying...' : 'Access Dashboard'}
                    </button>
                </form>
            </div>

            <style>{`
                .admin-login-container {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #f1f5f9;
                    position: relative;
                }
                .back-btn {
                    position: absolute;
                    top: 2rem;
                    left: 2rem;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    background: white;
                    border: 1px solid #e2e8f0;
                    padding: 0.5rem 1rem;
                    border-radius: 8px;
                    cursor: pointer;
                    color: #64748b;
                    font-weight: 500;
                    transition: all 0.2s;
                }
                .back-btn:hover { color: #1e293b; border-color: #cbd5e1; }

                .admin-login-card {
                    background: white;
                    width: 100%;
                    max-width: 400px;
                    padding: 3rem;
                    border-radius: 20px;
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
                }
                .header { text-align: center; margin-bottom: 2rem; }
                .icon-wrapper {
                    background: #fef2f2;
                    width: 64px;
                    height: 64px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 1rem;
                }
                .header h2 { margin: 0; color: #1e293b; font-size: 1.5rem; }
                .header p { margin: 0.5rem 0 0; color: #64748b; font-size: 0.9rem; }

                .input-group { margin-bottom: 1.5rem; }
                .input-group label { display: block; font-size: 0.85rem; font-weight: 600; color: #475569; margin-bottom: 0.5rem; }
                .input-group input { 
                    width: 100%; 
                    padding: 0.75rem; 
                    border: 1px solid #e2e8f0; 
                    border-radius: 10px; 
                    font-size: 1rem;
                    transition: border-color 0.2s;
                }
                .input-group input:focus { outline: none; border-color: #dc2626; box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1); }

                .error-message {
                    background: #fef2f2;
                    color: #dc2626;
                    padding: 0.75rem;
                    border-radius: 8px;
                    font-size: 0.85rem;
                    margin-bottom: 1.5rem;
                    text-align: center;
                    border: 1px solid #fecaca;
                }

                .login-btn {
                    width: 100%;
                    padding: 0.85rem;
                    background: #dc2626;
                    color: white;
                    border: none;
                    border-radius: 10px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: background 0.2s;
                }
                .login-btn:hover { background: #b91c1c; }
                .login-btn:disabled { opacity: 0.7; cursor: not-allowed; }
            `}</style>
        </div>
    );
};
