import { useState } from 'react';
import { LogIn, Globe, ShieldCheck, Zap, Check } from 'lucide-react';

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
                    <div className="hero-badge">🚀 #1 GMB Tool for Local Business</div>
                    <h2>Turn Every Customer Into a 5-Star Review</h2>
                    <p className="hero-sub">Professional review posters, custom-branded for your business. Increase your GMB ranking with high-converting QR designs.</p>

                    <div className="features-grid-v2">
                        <div className="feature-card-v2">
                            <div className="f-icon"><Zap size={20} /></div>
                            <div>
                                <h4>Instant Creation</h4>
                                <p>Generate posters in under 30 seconds.</p>
                            </div>
                        </div>
                        <div className="feature-card-v2">
                            <div className="f-icon"><Globe size={20} /></div>
                            <div>
                                <h4>300 DPI High-Res</h4>
                                <p>Print-ready exports for any material.</p>
                            </div>
                        </div>
                        <div className="feature-card-v2">
                            <div className="f-icon"><ShieldCheck size={20} /></div>
                            <div>
                                <h4>Smart Branding</h4>
                                <p>Automatic Google-compliant styling.</p>
                            </div>
                        </div>
                    </div>

                    <div className="showcase-section">
                        <h3>Premium Design Library</h3>
                        <div className="showcase-scroll">
                            <div className="showcase-item">
                                <img src="/home/dhiren/.gemini/antigravity/brain/9bf54449-d5e6-44eb-a289-b0c3d290b3a5/gmb_poster_showcase_1_1770520207943.png" alt="Clinical Style" />
                                <span>Modern Clinical</span>
                            </div>
                            <div className="showcase-item">
                                <img src="/home/dhiren/.gemini/antigravity/brain/9bf54449-d5e6-44eb-a289-b0c3d290b3a5/gmb_poster_showcase_2_1770520222832.png" alt="Executive Dark" />
                                <span>Executive Dark</span>
                            </div>
                            <div className="showcase-item">
                                <img src="/home/dhiren/.gemini/antigravity/brain/9bf54449-d5e6-44eb-a289-b0c3d290b3a5/gmb_poster_showcase_3_1770520242982.png" alt="Vibrant Tech" />
                                <span>Vibrant Tech</span>
                            </div>
                        </div>
                    </div>

                    <div className="how-it-works">
                        <h3>How It Works</h3>
                        <div className="steps-row">
                            <div className="step"><span>1</span> Link GMB</div>
                            <div className="step"><span>2</span> Pick Design</div>
                            <div className="step"><span>3</span> Go Live</div>
                        </div>
                    </div>

                    <div className="pricing-section">
                        <h3>Professional Plans</h3>
                        <div className="pricing-grid">
                            <a href="https://w3axis.in/google-business-review-qr-code.html" className="pricing-card">
                                <div className="plan-tag">Personal</div>
                                <div className="plan-name">Basic</div>
                                <div className="plan-price">Rs 99<span>/mo</span></div>
                                <ul className="plan-features">
                                    <li><Check size={14} /> 2 Designs/mo</li>
                                    <li><Check size={14} /> PNG Export</li>
                                </ul>
                                <div className="buy-btn">Get Started</div>
                            </a>
                            <a href="https://w3axis.in/google-business-review-qr-code.html" className="pricing-card featured">
                                <div className="plan-tag popular">Best Value</div>
                                <div className="plan-name">Standard</div>
                                <div className="plan-price">Rs 199<span>/mo</span></div>
                                <ul className="plan-features">
                                    <li><Check size={14} /> 10 Designs/mo</li>
                                    <li><Check size={14} /> PDF & PNG High-Res</li>
                                    <li><Check size={14} /> Background Removal</li>
                                </ul>
                                <div className="buy-btn">Go Popular</div>
                            </a>
                            <a href="https://w3axis.in/google-business-review-qr-code.html" className="pricing-card">
                                <div className="plan-tag">Teams</div>
                                <div className="plan-name">Premium</div>
                                <div className="plan-price">Rs 299<span>/mo</span></div>
                                <ul className="plan-features">
                                    <li><Check size={14} /> Unlimited Designs</li>
                                    <li><Check size={14} /> Custom Watermarks</li>
                                    <li><Check size={14} /> Team Sharing</li>
                                </ul>
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
                                placeholder="name@company.com"
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
        .login-container { display: grid; grid-template-columns: 1fr 450px; height: 100vh; overflow: hidden; background: #f8fafc; }
        .login-visual { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); display: flex; align-items: flex-start; justify-content: center; color: white; padding: 3rem 4rem; overflow-y: auto; scrollbar-width: none; }
        .login-visual::-webkit-scrollbar { display: none; }
        
        .visual-content { max-width: 800px; width: 100%; }
        .hero-badge { display: inline-block; padding: 0.4rem 1rem; background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 99px; color: #60a5fa; font-size: 0.8rem; font-weight: 600; margin-bottom: 1.5rem; }
        .visual-content h2 { font-size: 2.75rem; font-weight: 900; margin-bottom: 1rem; line-height: 1.1; letter-spacing: -0.02em; }
        .hero-sub { font-size: 1.15rem; color: #94a3b8; line-height: 1.6; margin-bottom: 2.5rem; }
        
        .features-grid-v2 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; margin-bottom: 3.5rem; }
        .feature-card-v2 { display: flex; gap: 1rem; }
        .f-icon { width: 40px; height: 40px; border-radius: 10px; background: rgba(59, 130, 246, 0.1); display: flex; align-items: center; justify-content: center; color: #3b82f6; flex-shrink: 0; }
        .feature-card-v2 h4 { font-size: 0.95rem; margin: 0 0 0.25rem 0; color: #f1f5f9; }
        .feature-card-v2 p { font-size: 0.8rem; color: #64748b; margin: 0; line-height: 1.4; }

        .showcase-section { margin-bottom: 3.5rem; }
        .showcase-section h3 { font-size: 1rem; text-transform: uppercase; letter-spacing: 0.1em; color: #475569; margin-bottom: 1.5rem; }
        .showcase-scroll { display: flex; gap: 1.5rem; padding-bottom: 1rem; overflow-x: auto; scrollbar-width: none; }
        .showcase-scroll::-webkit-scrollbar { display: none; }
        .showcase-item { flex-shrink: 0; width: 180px; }
        .showcase-item img { width: 100%; aspect-ratio: 3/4; object-fit: cover; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); margin-bottom: 0.75rem; transition: transform 0.2s; }
        .showcase-item:hover img { transform: scale(1.05); border-color: #3b82f6; }
        .showcase-item span { display: block; text-align: center; font-size: 0.75rem; color: #94a3b8; font-weight: 500; }

        .how-it-works { margin-bottom: 3.5rem; background: rgba(255,255,255,0.03); border-radius: 20px; padding: 2rem; border: 1px solid rgba(255,255,255,0.05); }
        .how-it-works h3 { font-size: 1rem; margin-bottom: 1.5rem; color: #f1f5f9; }
        .steps-row { display: flex; justify-content: space-between; gap: 1rem; }
        .step { display: flex; align-items: center; gap: 0.75rem; font-size: 0.9rem; color: #cbd5e1; font-weight: 600; }
        .step span { width: 28px; height: 28px; border-radius: 50%; background: #3b82f6; color: white; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; }

        .pricing-section { border-top: 1px solid rgba(255,255,255,0.1); padding-top: 2.5rem; padding-bottom: 4rem; }
        .pricing-section h3 { margin-bottom: 2rem; font-size: 1.25rem; color: #f1f5f9; text-align: center; }
        .pricing-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.25rem; }
        .pricing-card { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; padding: 1.75rem; text-decoration: none; color: inherit; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); display: flex; flex-direction: column; position: relative; }
        .pricing-card:hover { background: rgba(255,255,255,0.05); transform: translateY(-8px); border-color: #3b82f6; box-shadow: 0 20px 40px rgba(0,0,0,0.3); }
        .pricing-card.featured { background: rgba(59, 130, 246, 0.05); border-color: #3b82f6; }
        
        .plan-tag { font-size: 0.7rem; font-weight: 700; color: #64748b; margin-bottom: 0.5rem; text-transform: uppercase; }
        .plan-tag.popular { color: #3b82f6; }
        .plan-name { font-size: 1.25rem; font-weight: 800; color: white; margin-bottom: 0.5rem; }
        .plan-price { font-size: 2rem; font-weight: 900; color: white; margin-bottom: 1.5rem; }
        .plan-price span { font-size: 0.9rem; color: #64748b; font-weight: 400; }
        
        .plan-features { list-style: none; padding: 0; margin: 0 0 2rem 0; flex-grow: 1; }
        .plan-features li { font-size: 0.85rem; color: #94a3b8; display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.75rem; }
        .plan-features li svg { color: #10b981; }

        .buy-btn { width: 100%; padding: 0.75rem; background: rgba(255,255,255,0.05); border-radius: 12px; font-size: 0.85rem; font-weight: 700; color: #3b82f6; border: 1px solid rgba(59, 130, 246, 0.2); text-align: center; }
        .featured .buy-btn { background: #3b82f6; color: white; border-color: #3b82f6; }

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
