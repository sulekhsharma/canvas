import { useState } from 'react';
import { LogIn, Globe, ShieldCheck, Zap } from 'lucide-react';

interface LoginPageProps {
    onLogin: (token: string, user: any) => void;
}

export const LoginPage = ({ onLogin }: LoginPageProps) => {
    const [email, setEmail] = useState('demo1@example.com');
    const [password, setPassword] = useState('demo123');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const apiBase = import.meta.env.VITE_API_BASE || '/api';
        try {
            const res = await fetch(`${apiBase}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();
            if (res.ok) {
                onLogin(data.token, data.user);
            } else {
                setError(data.error || 'Login failed');
            }
        } catch (err) {
            setError('Connection error');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        // Mock Google Login
        onLogin('mock-google-token', { id: 'google-user', email: 'user@gmail.com', name: 'Google User' });
    };

    return (
        <div className="login-container">
            <div className="login-visual">
                <div className="visual-content">
                    <h2>Transform Reviews into Design</h2>
                    <p>The ultimate QR generator for Google My Business. Professional posters in 30 seconds.</p>
                    <div className="info-cards">
                        <div className="info-card">
                            <Globe size={24} />
                            <h4>Print-Ready</h4>
                            <p>300 DPI high-resolution exports for any size.</p>
                        </div>
                        <div className="info-card">
                            <ShieldCheck size={24} />
                            <h4>Trust Verified</h4>
                            <p>Secure Google compliant branding templates.</p>
                        </div>
                        <div className="info-card">
                            <Zap size={24} />
                            <h4>Dynamic CMS</h4>
                            <p>Save multiple versions and update colors live.</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="login-form-area">
                <div className="form-card glass-card">
                    <h1>Welcome Back</h1>
                    <p className="subtitle">Sign in to manage your premium QR designs</p>

                    <form onSubmit={handleLogin}>
                        <div className="input-group">
                            <label>Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="demo1@example.com"
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
                        {error && <p className="error-msg">{error}</p>}
                        <button className="primary-btn" disabled={loading}>
                            {loading ? 'Authenticating...' : 'Sign In'}
                        </button>
                    </form>

                    <div className="divider"><span>OR</span></div>

                    <button className="secondary-btn google-btn" onClick={handleGoogleLogin}>
                        <LogIn size={18} /> Continue with Google
                    </button>

                    <div className="demo-hint">
                        <p><strong>Admin Account:</strong> admin@example.com / admin123</p>
                        <p><strong>Demo Account:</strong> demo1@example.com / demo123</p>
                        <p><strong>Demo Account 2:</strong> demo2@example.com / demo123</p>
                    </div>
                </div>
            </div>

            <style>{`
        .login-container { display: grid; grid-template-columns: 1fr 500px; height: 100vh; overflow: hidden; background: #f8fafc; }
        .login-visual { background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); display: flex; align-items: center; justify-content: center; color: white; padding: 4rem; }
        .visual-content { max-width: 600px; }
        .visual-content h2 { font-size: 3rem; font-weight: 800; margin-bottom: 1.5rem; }
        .visual-content p { font-size: 1.25rem; color: #94a3b8; line-height: 1.6; }
        .info-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; margin-top: 4rem; }
        .info-card { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 1.5rem; border-radius: 16px; }
        .info-card h4 { margin: 1rem 0 0.5rem; font-size: 1.1rem; }
        .info-card p { font-size: 0.9rem; color: #64748b; margin: 0; }

        .login-form-area { display: flex; align-items: center; justify-content: center; padding: 2rem; }
        .form-card { width: 100%; max-width: 400px; padding: 2.5rem; }
        .form-card h1 { font-size: 2rem; margin-bottom: 0.5rem; }
        .subtitle { color: #64748b; margin-bottom: 2rem; }
        
        .input-group { margin-bottom: 1.5rem; }
        .input-group label { display: block; font-size: 0.85rem; font-weight: 600; color: #475569; margin-bottom: 0.5rem; }
        .input-group input { width: 100%; padding: 0.75rem; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 1rem; }
        
        .primary-btn { width: 100%; padding: 0.85rem; background: #2563eb; color: white; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; transition: background 0.2s; }
        .primary-btn:hover { background: #1d4ed8; }
        .primary-btn:disabled { opacity: 0.7; cursor: not-allowed; }
        
        .divider { display: flex; align-items: center; margin: 1.5rem 0; color: #94a3b8; font-size: 0.8rem; }
        .divider::before, .divider::after { content: ''; flex: 1; height: 1px; background: #e2e8f0; }
        .divider span { margin: 0 1rem; }
        
        .secondary-btn { width: 100%; padding: 0.85rem; background: white; border: 1px solid #e2e8f0; border-radius: 10px; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 0.5rem; cursor: pointer; }
        .google-btn:hover { background: #f8fafc; }
        
        .error-msg { color: #ef4444; font-size: 0.85rem; margin-bottom: 1rem; text-align: center; }
        .demo-hint { margin-top: 2rem; padding: 1rem; background: #eff6ff; border-radius: 8px; font-size: 0.8rem; color: #1e40af; }
        .demo-hint p { margin: 0.2rem 0; }

        @media (max-width: 900px) {
          .login-container { grid-template-columns: 1fr; }
          .login-visual { display: none; }
        }
      `}</style>
        </div>
    );
};
