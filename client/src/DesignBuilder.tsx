import React, { useState, useEffect, useRef } from 'react';
import type { DesignData, DesignTemplate } from './types';
import QRCode from 'qrcode';
import { ArrowLeft, Download, Image as ImageIcon, FileText, Loader2, Save, Check } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';
const SERVER_BASE = API_BASE.replace(/\/api$/, '');
const getAssetUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('data:')) return url;
    return `${SERVER_BASE}${url}`;
};

export const DesignBuilder: React.FC<{
    initialTemplate: DesignTemplate;
    onBack: () => void;
    initialData?: DesignData;
    token: string;
}> = ({ initialTemplate, onBack, initialData, token }) => {
    const [data, setData] = useState<DesignData>(() => {
        const defaultColors = initialTemplate.elements.reduce((acc, el) => {
            if ('color' in el && el.color) acc[el.id] = el.color;
            if (el.type === 'qr') acc[el.id] = '#000000';
            if (el.type === 'star-rating') acc[el.id] = (el as any).color || '#FFC107';
            return acc;
        }, {} as Record<string, string>);

        if (initialData) {
            return {
                ...initialData,
                elementColors: initialData.elementColors || defaultColors
            };
        }

        return {
            id: undefined,
            gmbUrl: 'https://g.page/r/YOUR_LINK_HERE',
            businessName: '',
            ctaText: '',
            hookText: '',
            showStars: true,
            showSocials: false,
            physicalAddress: '',
            primaryColor: '#000000',
            secondaryColor: '#4285F4',
            elementColors: defaultColors
        };
    });

    const [selectedTemplate] = useState<DesignTemplate>(initialTemplate);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [qrBase64, setQrBase64] = useState<string>('');
    const [isExporting, setIsExporting] = useState<'png' | 'pdf' | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [backgrounds, setBackgrounds] = useState<any[]>([]);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    useEffect(() => {
        fetch(`${API_BASE}/backgrounds`)
            .then(res => res.json())
            .then(data => setBackgrounds(data))
            .catch(err => console.error('Failed to fetch backgrounds', err));
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target as HTMLInputElement;
        const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
        setData(prev => ({ ...prev, [name]: val }));
        setHasUnsavedChanges(true);
    };

    const handleColorChange = (elementId: string, color: string) => {
        setData(prev => ({
            ...prev,
            elementColors: {
                ...(prev.elementColors || {}),
                [elementId]: color
            }
        }));
        setHasUnsavedChanges(true);
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setData(prev => ({ ...prev, logoUrl: reader.result as string }));
                setHasUnsavedChanges(true);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setData(prev => ({ ...prev, backgroundImageUrl: reader.result as string }));
                setHasUnsavedChanges(true);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch(`${API_BASE}/designs`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    id: data.id,
                    templateId: selectedTemplate.id,
                    data
                }),
            });
            const resData = await res.json();
            if (res.ok) {
                setData(prev => ({ ...prev, id: resData.id }));
                setHasUnsavedChanges(false);
            } else {
                alert('Failed to save design');
            }
        } catch (err) {
            console.error(err);
            alert('Save failed.');
        } finally {
            setIsSaving(false);
        }
    };

    useEffect(() => {
        const generateQR = async () => {
            const qrElement = selectedTemplate.elements.find(el => el.type === 'qr');
            const qrColor = (data.elementColors && qrElement) ? data.elementColors[qrElement.id] : (data.primaryColor || '#000000');

            try {
                const url = await QRCode.toDataURL(data.gmbUrl || 'https://g.page/r/', {
                    errorCorrectionLevel: 'H',
                    margin: 1,
                    width: 800,
                    color: {
                        dark: qrColor,
                        light: '#ffffff'
                    }
                });
                setQrBase64(url);
            } catch (err) {
                console.error(err);
            }
        };
        generateQR();
    }, [data.gmbUrl, data.primaryColor, data.elementColors, selectedTemplate.elements]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !qrBase64) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const render = async () => {
            const { width, height } = selectedTemplate.dimensions;
            canvas.width = width;
            canvas.height = height;

            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, width, height);

            if (data.backgroundImageUrl) {
                const bgImg = new Image();
                bgImg.crossOrigin = 'anonymous';
                bgImg.src = getAssetUrl(data.backgroundImageUrl);
                await new Promise(resolve => (bgImg.onload = resolve));
                ctx.drawImage(bgImg, 0, 0, width, height);
            }

            for (const el of selectedTemplate.elements) {
                ctx.save();

                if (el.type === 'decoration') {
                    const radius = el.borderRadius || 0;
                    const x = el.x; const y = el.y; const w = el.width; const h = el.height;
                    ctx.beginPath();
                    ctx.moveTo(x + radius, y);
                    ctx.lineTo(x + w - radius, y);
                    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
                    ctx.lineTo(x + w, y + h - radius);
                    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
                    ctx.lineTo(x + radius, y + h);
                    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
                    ctx.lineTo(x, y + radius);
                    ctx.quadraticCurveTo(x, y, x + radius, y);
                    ctx.closePath();

                    let color = (data.elementColors && data.elementColors[el.id]) || el.color;
                    if (color) { ctx.fillStyle = color; ctx.fill(); }
                    if (el.strokeColor && el.borderWidth) { ctx.strokeStyle = el.strokeColor; ctx.lineWidth = el.borderWidth; ctx.stroke(); }
                }

                if (el.type === 'text') {
                    const userValue = el.field ? (data as any)[el.field] : null;
                    const textValue = (userValue && userValue.trim() !== '') ? userValue : el.content;
                    if (!textValue) { ctx.restore(); continue; }
                    ctx.translate(el.x, el.y);
                    if (el.rotation) ctx.rotate((el.rotation * Math.PI) / 180);

                    // DYNAMIC COLORS
                    let color = (data.elementColors && data.elementColors[el.id]) || el.color;

                    ctx.fillStyle = color;
                    ctx.font = `${el.fontWeight || 'normal'} ${el.fontSize}px Inter, sans-serif`;
                    ctx.textAlign = el.align;
                    ctx.textBaseline = 'middle';
                    const lines = textValue.split('\n');
                    const lineHeight = el.lineHeight || 1.2;
                    lines.forEach((line: string, i: number) => {
                        ctx.fillText(line, 0, i * el.fontSize * lineHeight);
                    });
                }

                if (el.type === 'logo' && data.logoUrl) {
                    const logoImg = new Image();
                    logoImg.crossOrigin = 'anonymous';
                    logoImg.src = getAssetUrl(data.logoUrl);
                    await new Promise(resolve => (logoImg.onload = resolve));
                    const ratio = Math.min(el.maxWidth / logoImg.width, el.maxHeight / logoImg.height);
                    const w = logoImg.width * ratio;
                    const h = logoImg.height * ratio;
                    ctx.drawImage(logoImg, el.x - w / 2, el.y - h / 2, w, h);
                }

                if (el.type === 'qr') {
                    const qrImg = new Image();
                    qrImg.src = qrBase64;
                    await new Promise(resolve => (qrImg.onload = resolve));
                    ctx.drawImage(qrImg, el.x - el.size / 2, el.y - el.size / 2, el.size, el.size);

                    if (el.includeLogo && data.logoUrl) {
                        const logoImg = new Image();
                        logoImg.crossOrigin = 'anonymous';
                        logoImg.src = getAssetUrl(data.logoUrl);
                        await new Promise(resolve => (logoImg.onload = resolve));
                        const logoSize = el.size * 0.22;
                        const pad = el.logoPadding || 0;
                        if (el.logoShape === 'circle') {
                            ctx.beginPath();
                            ctx.arc(el.x, el.y, (logoSize + pad) / 2, 0, Math.PI * 2);
                            ctx.fillStyle = '#ffffff'; ctx.fill();
                            ctx.save();
                            ctx.beginPath();
                            ctx.arc(el.x, el.y, logoSize / 2, 0, Math.PI * 2);
                            ctx.clip();
                            ctx.drawImage(logoImg, el.x - logoSize / 2, el.y - logoSize / 2, logoSize, logoSize);
                            ctx.restore();
                            ctx.beginPath();
                            ctx.arc(el.x, el.y, (logoSize + pad) / 2, 0, Math.PI * 2);
                            ctx.strokeStyle = '#e0e0e0'; ctx.lineWidth = 2; ctx.stroke();
                        } else {
                            ctx.fillStyle = '#ffffff';
                            ctx.fillRect(el.x - (logoSize + pad) / 2, el.y - (logoSize + pad) / 2, logoSize + pad, logoSize + pad);
                            ctx.drawImage(logoImg, el.x - logoSize / 2, el.y - logoSize / 2, logoSize, logoSize);
                        }
                    }
                }

                if (el.type === 'star-rating' && data.showStars) {
                    ctx.fillStyle = (data.elementColors && data.elementColors[el.id]) || el.color;
                    const starSize = el.size; const spacing = 20;
                    const totalW = (starSize * el.count) + (spacing * (el.count - 1));
                    ctx.translate(el.x - totalW / 2, el.y);
                    for (let i = 0; i < el.count; i++) {
                        ctx.beginPath();
                        for (let j = 0; j < 5; j++) {
                            ctx.lineTo(
                                Math.cos(((18 + j * 72) / 180) * Math.PI) * (starSize / 2) + (starSize / 2 + i * (starSize + spacing)),
                                -Math.sin(((18 + j * 72) / 180) * Math.PI) * (starSize / 2)
                            );
                            ctx.lineTo(
                                Math.cos(((54 + j * 72) / 180) * Math.PI) * (starSize / 4) + (starSize / 2 + i * (starSize + spacing)),
                                -Math.sin(((54 + j * 72) / 180) * Math.PI) * (starSize / 4)
                            );
                        }
                        ctx.closePath(); ctx.fill();
                    }
                }
                ctx.restore();
            }
        };
        render();
    }, [data, selectedTemplate, qrBase64]);

    const downloadFile = (blob: Blob, filename: string) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        window.URL.revokeObjectURL(url);
    };

    const handleExport = async (format: 'png' | 'pdf') => {
        setIsExporting(format);
        try {
            const response = await fetch(`${API_BASE}/export/${format}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ designData: data, template: selectedTemplate }),
            });
            if (!response.ok) throw new Error('Export failed');
            const blob = await response.blob();
            const filename = `gmb-design-${data.businessName.replace(/\s+/g, '-').toLowerCase() || 'unnamed'}.${format}`;
            downloadFile(blob, filename);
        } catch (err) {
            console.error(err);
            alert('Export failed.');
        } finally {
            setIsExporting(null);
        }
    };

    return (
        <div className="builder-layout">
            <aside className="builder-sidebar">
                <button onClick={onBack} className="back-btn">
                    <ArrowLeft size={18} /> Exit to Dashboard
                </button>

                <section className="form-section">
                    <h3>Assets & Identity</h3>
                    <div className="input-group">
                        <label>Brand Logo</label>
                        <div className="file-upload">
                            <label htmlFor="logo-upload" className="file-label">
                                <ImageIcon size={18} /> {data.logoUrl ? 'Change Asset' : 'Upload Asset'}
                            </label>
                            <input id="logo-upload" type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                        </div>
                    </div>
                    <div className="input-group" style={{ marginTop: '1rem' }}>
                        <label>Background Decoration</label>

                        <div className="file-upload">
                            <label htmlFor="bg-upload" className="file-label">
                                <ImageIcon size={18} /> {data.backgroundImageUrl ? 'Change/Upload' : 'Upload Overlay'}
                            </label>
                            <input id="bg-upload" type="file" accept="image/*" onChange={handleBackgroundUpload} className="hidden" />
                        </div>

                        {backgrounds.length > 0 && (
                            <div className="bg-library-selector" style={{ marginTop: '0.8rem' }}>
                                <label style={{ fontSize: '0.75rem', opacity: 0.8, marginBottom: '0.4rem', display: 'block' }}>Choose from Library</label>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(5, 1fr)',
                                    gap: '4px',
                                    background: '#f1f5f9',
                                    padding: '4px',
                                    borderRadius: '8px'
                                }}>
                                    {backgrounds.map(bg => (
                                        <button
                                            key={bg.id}
                                            onClick={() => { setData(prev => ({ ...prev, backgroundImageUrl: bg.url })); setHasUnsavedChanges(true); }}
                                            style={{
                                                padding: 0,
                                                border: data.backgroundImageUrl === bg.url ? '2px solid #4f46e5' : '1px solid #e2e8f0',
                                                borderRadius: '4px',
                                                overflow: 'hidden',
                                                height: '30px',
                                                background: '#eee'
                                            }}
                                            title={bg.name}
                                        >
                                            <img src={getAssetUrl(bg.url)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => { setData(prev => ({ ...prev, backgroundImageUrl: undefined })); setHasUnsavedChanges(true); }}
                                        style={{
                                            padding: 0,
                                            border: !data.backgroundImageUrl ? '2px solid #4f46e5' : '1px solid #e2e8f0',
                                            borderRadius: '4px',
                                            background: 'white',
                                            fontSize: '0.6rem',
                                            height: '30px'
                                        }}
                                    >
                                        None
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                <section className="form-section">
                    <h3>Business Info</h3>
                    <div className="input-group">
                        <label>GMB Review Link</label>
                        <input name="gmbUrl" value={data.gmbUrl} onChange={handleChange} />
                    </div>
                    <div className="input-group">
                        <label>Business Name</label>
                        <input name="businessName" value={data.businessName} onChange={handleChange} placeholder="Your Business Name" />
                    </div>
                    <div className="input-group">
                        <label>Emotional Hook</label>
                        <input name="hookText" value={data.hookText || ''} onChange={handleChange} placeholder="Loved our service?" />
                    </div>
                    <div className="input-group">
                        <label>CTA Subtext</label>
                        <textarea name="ctaText" value={data.ctaText} onChange={handleChange} rows={2} placeholder="" />
                    </div>
                </section>

                <div className="action-footer">
                    {hasUnsavedChanges ? (
                        <button className="save-btn pulse" onClick={handleSave} disabled={isSaving}>
                            {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                            Save Changes
                        </button>
                    ) : (
                        <div className="saved-status"><Check size={16} /> Saved to Cloud</div>
                    )}

                    <div className="export-row">
                        <button className="download-btn secondary" onClick={() => handleExport('png')} disabled={!!isExporting || hasUnsavedChanges}>
                            {isExporting === 'png' ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />} PNG
                        </button>
                        <button className="download-btn" onClick={() => handleExport('pdf')} disabled={!!isExporting || hasUnsavedChanges}>
                            {isExporting === 'pdf' ? <Loader2 className="animate-spin" size={18} /> : <FileText size={18} />} PDF
                        </button>
                    </div>
                    {hasUnsavedChanges && <p className="save-hint">Please save before downloading</p>}
                </div>
            </aside>

            <main className="preview-area">
                <div className="toolbar-header">
                    <div className="toolbar-label">Quick Colors</div>
                    <div className="dynamic-colors-bar">
                        {selectedTemplate.elements
                            .filter(el => ('color' in el && el.color) || el.type === 'qr' || el.type === 'star-rating')
                            .map(el => {
                                const field = (el as any).field;
                                const label = field
                                    ? field.replace(/([A-Z])/g, ' $1').replace(/^./, (str: string) => str.toUpperCase())
                                    : el.id.replace(/[-_]/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());

                                return (
                                    <div className="toolbar-color-item" key={el.id} title={label}>
                                        <div className="color-swatch-wrapper">
                                            <input
                                                type="color"
                                                value={(data.elementColors && data.elementColors[el.id]) || (el as any).color || '#000000'}
                                                onChange={(e) => handleColorChange(el.id, e.target.value)}
                                            />
                                            <div
                                                className="color-swatch-preview"
                                                style={{ backgroundColor: (data.elementColors && data.elementColors[el.id]) || (el as any).color || '#000000' }}
                                            />
                                        </div>
                                        <span className="color-label-mini">{label}</span>
                                    </div>
                                );
                            })}
                    </div>
                </div>
                <div className="canvas-wrapper">
                    <canvas ref={canvasRef} />
                </div>
            </main>

            <style>{`
        .builder-layout { display: grid; grid-template-columns: 350px 1fr; height: 100vh; background: #f1f5f9; }
        .builder-sidebar { background: white; padding: 1.5rem; border-right: 1px solid #e2e8f0; overflow-y: auto; display: flex; flex-direction: column; gap: 1rem; }
        .back-btn { display: flex; align-items: center; gap: 0.5rem; background: none; border: none; color: #64748b; cursor: pointer; font-weight: 600; margin-bottom: 0.5rem; font-size: 0.85rem; }
        .form-section h3 { font-size: 0.75rem; text-transform: uppercase; color: #94a3b8; margin-bottom: 1rem; border-bottom: 1px solid #f1f5f9; padding-bottom: 0.5rem; letter-spacing: 0.05em; }
        
        .color-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .color-picker-wrapper { display: flex; align-items: center; gap: 0.5rem; background: #f8fafc; padding: 0.4rem; border: 1px solid #e2e8f0; border-radius: 8px; }
        .color-picker-wrapper input[type="color"] { width: 30px; height: 30px; border: none; background: none; cursor: pointer; }
        .color-picker-wrapper span { font-size: 0.7rem; font-family: monospace; color: #64748b; }

        .input-group { margin-bottom: 0.8rem; }
        .input-group label { display: block; font-size: 0.75rem; font-weight: 700; margin-bottom: 0.3rem; color: #475569; }
        .input-group input, .input-group textarea { width: 100%; padding: 0.6rem; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.85rem; }
        
        .action-footer { margin-top: auto; padding-top: 2rem; border-top: 2px solid #f1f5f9; display: flex; flex-direction: column; gap: 0.75rem; }
        .save-btn { background: #10b981; color: white; padding: 1rem; border: none; border-radius: 12px; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 0.5rem; cursor: pointer; transition: all 0.2s; }
        .save-btn:hover { background: #059669; transform: translateY(-2px); }
        .save-btn.pulse { animation: pulse-green 2s infinite; }
        @keyframes pulse-green { 0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); } 70% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); } 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); } }

        .saved-status { color: #10b981; font-size: 0.85rem; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 0.4rem; padding: 1rem; background: #f0fdf4; border-radius: 12px; }
        .export-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; }
        .download-btn { background: #1e293b; color: white; padding: 0.8rem; border: none; border-radius: 10px; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 0.5rem; cursor: pointer; font-size: 0.85rem; }
        .download-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .download-btn.secondary { background: #e2e8f0; color: #475569; }
        .save-hint { font-size: 0.7rem; color: #ef4444; font-weight: 500; text-align: center; margin: 0; }

        .preview-area { padding: 3rem; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; background: #cbd5e1; overflow: auto; position: relative; }
        .toolbar-header { width: 100%; max-width: 1200px; background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(10px); padding: 0.75rem 1.5rem; border-radius: 16px; margin-bottom: 2rem; display: flex; align-items: center; gap: 1.5rem; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); border: 1px solid rgba(255,255,255,0.5); position: sticky; top: 0; z-index: 10; }
        .toolbar-label { font-size: 0.7rem; font-weight: 800; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em; border-right: 1px solid #e2e8f0; padding-right: 1.5rem; white-space: nowrap; }
        .dynamic-colors-bar { display: flex; gap: 1rem; overflow-x: auto; padding-bottom: 4px; flex: 1; scrollbar-width: thin; }
        .toolbar-color-item { display: flex; flex-direction: column; align-items: center; gap: 0.3rem; min-width: 60px; }
        .color-swatch-wrapper { position: relative; width: 32px; height: 32px; cursor: pointer; }
        .color-swatch-wrapper input[type="color"] { position: absolute; opacity: 0; width: 100%; height: 100%; cursor: pointer; z-index: 2; }
        .color-swatch-preview { width: 100%; height: 100%; border-radius: 8px; border: 2px solid white; box-shadow: 0 0 0 1px #e2e8f0; pointer-events: none; transition: transform 0.2s; }
        .toolbar-color-item:hover .color-swatch-preview { transform: scale(1.1); }
        .color-label-mini { font-size: 0.6rem; color: #475569; font-weight: 600; white-space: nowrap; max-width: 80px; overflow: hidden; text-overflow: ellipsis; }

        .canvas-wrapper { background: white; box-shadow: 0 40px 100px -20px rgba(0,0,0,0.3); line-height: 0; border-radius: 4px; overflow: hidden; }
        canvas { max-width: 100%; max-height: 75vh; object-fit: contain; }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .hidden { display: none; }
        .file-label { display: flex; align-items: center; gap: 0.5rem; padding: 0.7rem; border: 2px dashed #e2e8f0; border-radius: 10px; cursor: pointer; font-size: 0.8rem; color: #64748b; }
        .remove-btn { margin-top: 0.5rem; background: #fee2e2; color: #ef4444; border: none; padding: 0.5rem; border-radius: 6px; font-size: 0.75rem; font-weight: 600; cursor: pointer; width: 100%; }
        .remove-btn:hover { background: #fecaca; }
      `}</style>
        </div>
    );
};
