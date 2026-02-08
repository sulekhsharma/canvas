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
                    <h2>Transform Reviews into Business Growth</h2>
                    <p>The ultimate QR generator for Google My Business. Professional posters in 30 seconds.</p>

                    <div className="features-list">
                        <div className="feature-item-pill">
                            <Zap size={18} />
                            <span>Instant Live Preview</span>
                        </div>
                        <div className="feature-item-pill">
                            <Globe size={18} />
                            <span>300 DPI Print Ready</span>
                        </div>
                        <div className="feature-item-pill">
                            <ShieldCheck size={18} />
                            <span>Compliant Templates</span>
                        </div>
                        <div className="feature-item-pill">
                            <Zap size={18} />
                            <span>PDF & PNG Exports</span>
                        </div>
                    </div>

                    <div className="pricing-section">
                        <h3>Choose Your Plan</h3>
                        <div className="pricing-grid">
                            <a href="https://w3axis.in/google-business-review-qr-code.html" className="pricing-card">
                                <div className="plan-name">Basic</div>
                                <div className="plan-price">Rs 99<span>/mo</span></div>
                                <div className="buy-btn">Get Started</div>
                            </a>
                            <a href="https://w3axis.in/google-business-review-qr-code.html" className="pricing-card featured">
                                <div className="plan-name">Standard</div>
                                <div className="plan-price">Rs 199<span>/mo</span></div>
                                <div className="buy-btn">Popular</div>
                            </a>
                            <a href="https://w3axis.in/google-business-review-qr-code.html" className="pricing-card">
                                <div className="plan-name">Premium</div>
                                <div className="plan-price">Rs 299<span>/mo</span></div>
                                <div className="buy-btn">Go Pro</div>
                            </a>
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
                        <p><strong>Demo Account:</strong> demo1@example.com / demo123</p>
                    </div>
                </div>
            </div>

            <style>{`
        .login-container { display: grid; grid-template-columns: 1fr 500px; height: 100vh; overflow: hidden; background: #f8fafc; }
        .login-visual { background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); display: flex; align-items: center; justify-content: center; color: white; padding: 2rem; overflow-y: auto; }
        .visual-content { max-width: 600px; width: 100%; }
        .visual-content h2 { font-size: 2.5rem; font-weight: 800; margin-bottom: 1rem; }
        .visual-content p { font-size: 1.1rem; color: #94a3b8; line-height: 1.5; margin-bottom: 2rem; }
        
        .features-list { display: flex; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 3rem; }
        .feature-item-pill { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 0.6rem 1.2rem; border-radius: 99px; display: flex; align-items: center; gap: 0.6rem; font-size: 0.9rem; color: #cbd5e1; }

        .pricing-section { margin-top: 2rem; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 2rem; }
        .pricing-section h3 { margin-bottom: 1.5rem; font-size: 1.25rem; color: #cbd5e1; }
        .pricing-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
        .pricing-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 1.5rem; text-decoration: none; color: inherit; transition: all 0.2s; display: flex; flex-direction: column; align-items: center; text-align: center; }
        .pricing-card:hover { background: rgba(255,255,255,0.07); transform: translateY(-5px); border-color: #3b82f6; }
        .pricing-card.featured { background: rgba(59, 130, 246, 0.1); border-color: #3b82f6; }
        .plan-name { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8; margin-bottom: 0.5rem; font-weight: 700; }
        .plan-price { font-size: 1.5rem; font-weight: 800; color: white; margin-bottom: 1rem; }
        .plan-price span { font-size: 0.9rem; color: #64748b; font-weight: 400; }
        .buy-btn { width: 100%; padding: 0.5rem; background: rgba(255,255,255,0.05); border-radius: 8px; font-size: 0.8rem; font-weight: 600; color: #3b82f6; border: 1px solid rgba(59, 130, 246, 0.2); }
        .featured .buy-btn { background: #3b82f6; color: white; }

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
