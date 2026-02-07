import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import QRCode from 'qrcode';
import { createCanvas, loadImage } from 'canvas';
import { PDFDocument } from 'pdf-lib';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import db, { syncDatabase } from './db.js';
import multer from 'multer';
import fs from 'fs';
import path, { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';

app.use(cors());
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        const userEmail = req.user ? req.user.email : 'guest';
        try {
            db.prepare(`
                INSERT INTO api_logs (method, url, user_email, status_code, duration, ip, user_agent)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `).run(
                req.method,
                req.url,
                userEmail,
                res.statusCode,
                duration,
                req.ip || req.get('x-forwarded-for') || 'unknown',
                req.get('user-agent') || 'unknown'
            );
        } catch (e) {
            console.error('Failed to log API request:', e);
        }
    });
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});
app.use(express.json({ limit: '50mb' }));
app.use('/public', express.static(join(__dirname, '../public')));
app.use(express.static(join(__dirname, '../../client/dist')));

// Swagger Documentation
const swaggerDocument = YAML.load(join(__dirname, '../swagger.yaml'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Configure Multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = join(__dirname, '../public/uploads/');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname) || '.png';
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});
const upload = multer({ storage: storage });

const templateStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = join(__dirname, '../public/uploads/templates/');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname) || '.png';
        cb(null, 'template-' + uniqueSuffix + ext);
    }
});
const templateUpload = multer({
    storage: templateStorage,
    limits: { fileSize: 1024 * 1024 } // 1MB limit
});

// Auth Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        console.warn('Authentication failed: No token provided');
        return res.sendStatus(401);
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            console.warn('Authentication failed: Invalid token');
            return res.sendStatus(403);
        }
        req.user = user;
        next();
    });
};

// --- AUTH ROUTES ---

app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    console.log(`Login attempt for: ${email}`);
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

    if (!user || !bcrypt.compareSync(password, user.password)) {
        console.warn(`Login failed for ${email}: Invalid credentials`);
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log(`Login successful: ${email} (${user.role})`);
    const token = jwt.sign({ id: user.id, email: user.email, name: user.name, role: user.role || 'user' }, JWT_SECRET);
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role || 'user' } });
});

app.post('/api/auth/google', (req, res) => {
    // Mock Google Login for now - in real world would verify tokenId
    const { email, name, googleId } = req.body;
    let user = db.prepare('SELECT * FROM users WHERE google_id = ? OR email = ?').get(googleId, email);

    if (!user) {
        const id = uuidv4();
        db.prepare('INSERT INTO users (id, email, name, google_id) VALUES (?, ?, ?, ?)').run(id, email, name, googleId);
        user = { id, email, name };
    }

    const token = jwt.sign({ id: user.id, email: user.email, name: user.name, role: user.role || 'user' }, JWT_SECRET);
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role || 'user' } });
});

// Admin Middleware
const authenticateAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        console.warn(`Admin access denied for user: ${req.user ? req.user.email : 'unknown'} [Role: ${req.user ? req.user.role : 'none'}]`);
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

// --- TEMPLATE ROUTES ---

app.get('/api/templates', (req, res) => {
    try {
        const templates = db.prepare('SELECT * FROM templates WHERE is_active = 1').all();
        res.json(templates.map(t => ({
            ...JSON.parse(t.data),
            image_url: t.image_url
        })));
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch templates' });
    }
});

// --- ADMIN ROUTES ---

app.get('/api/admin/users', authenticateToken, authenticateAdmin, (req, res) => {
    try {
        console.log('Fetching all users for admin...');
        const users = db.prepare('SELECT id, email, name, role, created_at FROM users').all();
        console.log(`Found ${users.length} users.`);
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

app.delete('/api/admin/users/:id', authenticateToken, authenticateAdmin, (req, res) => {
    try {
        const { id } = req.params;
        console.log(`Admin deleting user: ${id}`);
        db.prepare('DELETE FROM designs WHERE user_id = ?').run(id);
        const result = db.prepare('DELETE FROM users WHERE id = ?').run(id);
        if (result.changes === 0) return res.status(404).json({ error: 'User not found' });
        console.log(`User ${id} deleted successfully.`);
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

app.get('/api/admin/designs', authenticateToken, authenticateAdmin, (req, res) => {
    try {
        console.log('Fetching all designs for admin...');
        const designs = db.prepare(`
            SELECT d.*, u.email as user_email 
            FROM designs d 
            LEFT JOIN users u ON d.user_id = u.id 
            ORDER BY d.updated_at DESC
        `).all();
        console.log(`Found ${designs.length} designs in database.`);

        const simplifiedDesigns = designs.map(d => {
            try {
                return { ...d, data: d.data ? JSON.parse(d.data) : {} };
            } catch (e) {
                console.error(`Malformed JSON for design ${d.id}:`, d.data);
                return { ...d, data: { businessName: 'Data Corrupted' } };
            }
        });

        res.json(simplifiedDesigns);
    } catch (error) {
        console.error('Error fetching designs:', error);
        res.status(500).json({ error: 'Failed to fetch designs' });
    }
});

app.post('/api/admin/sync', authenticateToken, authenticateAdmin, (req, res) => {
    try {
        console.log('Manual database sync requested...');
        const result = syncDatabase();
        res.json(result);
    } catch (error) {
        console.error('Manual sync failed:', error);
        res.status(500).json({ error: 'Database sync failed' });
    }
});

// Admin Templates Management
app.get('/api/admin/templates', authenticateToken, authenticateAdmin, (req, res) => {
    try {
        const templates = db.prepare('SELECT * FROM templates ORDER BY created_at DESC').all();
        res.json(templates.map(t => ({ ...t, data: JSON.parse(t.data) })));
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch templates' });
    }
});

app.post('/api/admin/templates', authenticateToken, authenticateAdmin, templateUpload.single('image'), (req, res) => {
    let { id, name, description, data } = req.body;
    try {
        if (typeof data === 'string') data = JSON.parse(data);
        const imageUrl = req.file ? `/public/uploads/templates/${req.file.filename}` : null;

        db.prepare('INSERT INTO templates (id, name, description, data, image_url) VALUES (?, ?, ?, ?, ?)')
            .run(id || uuidv4(), name, description, JSON.stringify(data), imageUrl);
        res.json({ message: 'Template created successfully' });
    } catch (e) {
        console.error('Failed to create template:', e);
        res.status(500).json({ error: 'Failed to create template' });
    }
});

app.put('/api/admin/templates/:id', authenticateToken, authenticateAdmin, templateUpload.single('image'), (req, res) => {
    const { id } = req.params;
    let { name, description, data, is_active } = req.body;
    try {
        if (typeof data === 'string') data = JSON.parse(data);
        const imageUrl = req.file ? `/public/uploads/templates/${req.file.filename}` : null;

        if (imageUrl) {
            db.prepare('UPDATE templates SET name = ?, description = ?, data = ?, is_active = ?, image_url = ? WHERE id = ?')
                .run(name, description, JSON.stringify(data), is_active === 'true' || is_active === 1 ? 1 : 0, imageUrl, id);
        } else {
            db.prepare('UPDATE templates SET name = ?, description = ?, data = ?, is_active = ? WHERE id = ?')
                .run(name, description, JSON.stringify(data), is_active === 'true' || is_active === 1 ? 1 : 0, id);
        }
        res.json({ message: 'Template updated successfully' });
    } catch (e) {
        console.error('Failed to update template:', e);
        res.status(500).json({ error: 'Failed to update template' });
    }
});

app.delete('/api/admin/templates/:id', authenticateToken, authenticateAdmin, (req, res) => {
    const { id } = req.params;
    try {
        db.prepare('DELETE FROM templates WHERE id = ?').run(id);
        res.json({ message: 'Template deleted successfully' });
    } catch (e) {
        res.status(500).json({ error: 'Failed to delete template' });
    }
});

// API Logs
app.get('/api/admin/logs', authenticateToken, authenticateAdmin, (req, res) => {
    try {
        const logs = db.prepare('SELECT * FROM api_logs ORDER BY timestamp DESC LIMIT 200').all();
        res.json(logs);
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch logs' });
    }
});

// --- DESIGN MANAGEMENT ---

app.get('/api/designs', authenticateToken, (req, res) => {
    const designs = db.prepare('SELECT * FROM designs WHERE user_id = ? ORDER BY updated_at DESC').all(req.user.id);
    res.json(designs.map(d => ({ ...d, data: JSON.parse(d.data) })));
});

app.post('/api/designs', authenticateToken, (req, res) => {
    const { id, templateId, data } = req.body;
    const designId = id || uuidv4();
    const designData = JSON.stringify(data);

    const existing = db.prepare('SELECT id FROM designs WHERE id = ?').get(designId);

    if (existing) {
        db.prepare('UPDATE designs SET data = ?, template_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(designData, templateId, designId);
    } else {
        db.prepare('INSERT INTO designs (id, user_id, template_id, data) VALUES (?, ?, ?, ?)').run(designId, req.user.id, templateId, designData);
    }

    res.json({ id: designId, message: 'Saved successfully' });
});

// --- EXPORT LOGIC ---

async function renderToCanvas(designData, template) {
    const { width, height } = template.dimensions;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    if (designData.backgroundImageUrl) {
        try {
            const bgImg = await loadImage(designData.backgroundImageUrl);
            ctx.drawImage(bgImg, 0, 0, width, height);
        } catch (e) {
            console.error('Failed to load background image for export:', e);
        }
    }

    for (const el of template.elements) {
        ctx.save();

        if (el.type === 'decoration') {
            const radius = el.borderRadius || 0;
            const x = el.x; const y = el.y; const w = el.width; const h = el.height;

            // Use primary color for specific decorations if logic requires
            ctx.beginPath();
            ctx.roundRect(x, y, w, h, radius);

            if (el.color) {
                ctx.fillStyle = el.color;
                ctx.fill();
            }
            if (el.strokeColor && el.borderWidth) {
                ctx.strokeStyle = el.strokeColor;
                ctx.lineWidth = el.borderWidth;
                ctx.stroke();
            }
        }

        if (el.type === 'text') {
            const userValue = el.field ? designData[el.field] : null;
            let textValue = (userValue && userValue.trim() !== '') ? userValue : el.content;
            if (!textValue) { ctx.restore(); continue; }

            ctx.translate(el.x, el.y);
            if (el.rotation) ctx.rotate((el.rotation * Math.PI) / 180);

            // Dynamic Color Injection
            ctx.fillStyle = el.color; // Template default
            if (el.field === 'hookText' && designData.primaryColor) ctx.fillStyle = designData.primaryColor;
            if (el.field === 'ctaText' && designData.secondaryColor) ctx.fillStyle = designData.secondaryColor;

            ctx.font = `${el.fontWeight || 'normal'} ${el.fontSize}px Arial`;
            ctx.textAlign = el.align;
            ctx.textBaseline = 'middle';
            const lines = textValue.split('\n');
            const lineHeight = el.lineHeight || 1.2;
            lines.forEach((line, i) => {
                ctx.fillText(line, 0, i * el.fontSize * lineHeight);
            });
        }

        if (el.type === 'logo' && designData.logoUrl) {
            try {
                const logoImg = await loadImage(designData.logoUrl);
                const ratio = Math.min(el.maxWidth / logoImg.width, el.maxHeight / logoImg.height);
                const w = logoImg.width * ratio;
                const h = logoImg.height * ratio;
                ctx.drawImage(logoImg, el.x - w / 2, el.y - h / 2, w, h);
            } catch (e) { }
        }

        if (el.type === 'qr') {
            const qrDataUrl = await QRCode.toDataURL(designData.gmbUrl || 'https://g.page/r/', {
                errorCorrectionLevel: 'H',
                margin: 1,
                width: el.size,
                color: {
                    dark: designData.primaryColor || '#000000',
                    light: '#ffffff'
                }
            });
            const qrImg = await loadImage(qrDataUrl);
            ctx.drawImage(qrImg, el.x - el.size / 2, el.y - el.size / 2, el.size, el.size);

            if (el.includeLogo && designData.logoUrl) {
                try {
                    const logoImg = await loadImage(designData.logoUrl);
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

                    } else {
                        ctx.fillStyle = '#ffffff';
                        ctx.fillRect(el.x - (logoSize + pad) / 2, el.y - (logoSize + pad) / 2, logoSize + pad, logoSize + pad);
                        ctx.drawImage(logoImg, el.x - logoSize / 2, el.y - logoSize / 2, logoSize, logoSize);
                    }
                } catch (e) { }
            }
        }

        if (el.type === 'star-rating' && designData.showStars) {
            ctx.fillStyle = designData.primaryColor || el.color;
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
    return canvas;
}

app.post('/api/export/pdf', async (req, res) => {
    try {
        const { designData, template } = req.body;
        const canvas = await renderToCanvas(designData, template);
        const imageBuffer = canvas.toBuffer('image/png');
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([canvas.width * 0.72, canvas.height * 0.72]);
        const pngImage = await pdfDoc.embedPng(imageBuffer);
        page.drawImage(pngImage, { x: 0, y: 0, width: page.getWidth(), height: page.getHeight() });
        const pdfBytes = await pdfDoc.save();
        res.contentType('application/pdf');
        res.send(Buffer.from(pdfBytes));
    } catch (error) { res.status(500).json({ error: 'Failed' }); }
});

app.post('/api/export/png', async (req, res) => {
    try {
        const { designData, template } = req.body;
        const canvas = await renderToCanvas(designData, template);
        res.contentType('image/png');
        res.send(canvas.toBuffer('image/png'));
    } catch (error) { res.status(500).json({ error: 'Failed' }); }
});



app.post('/api/generate-qr', upload.single('logo'), async (req, res) => {
    try {
        const { body, file } = req;

        // Parse parameters
        // Support 'data' field as JSON string, or use body directly
        let params = {};
        if (body.data) {
            try {
                params = JSON.parse(body.data);
            } catch (e) {
                console.error("Failed to parse data field:", e);
                params = body;
            }
        } else {
            params = body;
        }

        // Normalize keys (handle spaces, snake_case)
        const normalizeKey = (key) => {
            // "business_address" -> "businessAddress", "mobile number" -> "mobileNumber"
            return key.replace(/([-_ ][a-z])/ig, ($1) => {
                return $1.toUpperCase()
                    .replace('-', '')
                    .replace('_', '')
                    .replace(' ', '');
            });
        };

        const normalizedParams = {};
        Object.keys(params).forEach(key => {
            normalizedParams[normalizeKey(key)] = params[key];
        });

        // Specific mappings if regex isn't enough or for specific user requests
        if (params['website url']) normalizedParams.websiteUrl = params['website url'];
        if (params['mobile number']) normalizedParams.mobileNumber = params['mobile number'];
        if (params['whatsapp number']) normalizedParams.whatsappNumber = params['whatsapp number'];
        if (params['other_mobile number']) normalizedParams.otherMobileNumber = params['other_mobile number'];
        if (params['email id']) normalizedParams.email = params['email id'];
        if (params['facebookpage url']) normalizedParams.facebookUrl = params['facebookpage url'];
        if (params['instaurl']) normalizedParams.instagramUrl = params['instaurl'];
        if (params['linkedin url']) normalizedParams.linkedinUrl = params['linkedin url'];

        // Merge back normalized params
        params = { ...params, ...normalizedParams };

        // Load Template
        let template = null;
        if (params.template) {
            template = typeof params.template === 'string' ? JSON.parse(params.template) : params.template;
        } else if (params.templateId) {
            const t = db.prepare('SELECT data FROM templates WHERE id = ?').get(params.templateId);
            if (t) {
                template = JSON.parse(t.data);
            } else {
                throw new Error(`Template with ID '${params.templateId}' not found in database.`);
            }
        } else {
            // Load first available template as default
            const t = db.prepare('SELECT data FROM templates LIMIT 1').get();
            if (t) {
                template = JSON.parse(t.data);
            } else {
                // Fallback minimal template if DB is empty
                template = {
                    id: 'fallback',
                    dimensions: { width: 1000, height: 1000 },
                    elements: [{ type: 'qr', x: 500, y: 500, size: 800 }]
                };
            }
        }

        // Normalize template: Ensure dimensions exist (map from size if needed)
        if (template && !template.dimensions && template.size) {
            template.dimensions = template.size;
        }

        // Prepare Design Data
        const designData = {
            ...params,
            logoUrl: file ? file.path : (params.logoUrl || null)
        };

        const canvas = await renderToCanvas(designData, template);

        // Save to public/generated
        const fileName = `qr-${uuidv4()}.png`;
        const filePath = join(__dirname, '../public/generated', fileName);
        const buffer = canvas.toBuffer('image/png');
        fs.writeFileSync(filePath, buffer);

        // Construct URL
        const protocol = req.protocol;
        const host = req.get('host');
        // If behind proxy (ngrok, etc), host usually correct or needs config. 
        // For local development, this works.
        const fileUrl = `${protocol}://${host}/public/generated/${fileName}`;

        res.json({
            success: true,
            url: fileUrl,
            downloadUrl: fileUrl
        });

    } catch (error) {
        console.error("Generate QR Error:", error);
        res.status(500).json({ error: error.message || 'Failed to generate QR code' });
    }
});

// Serve React App for any other route
// Serve React App for any other route
app.use((req, res) => {
    res.sendFile(join(__dirname, '../../client/dist/index.html'));
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
