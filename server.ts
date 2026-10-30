import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { dbService } from './server/db';
import { requireAuth, AuthenticatedRequest, JWT_SECRET } from './server/middleware/auth';
import { analyzeVisualPayload } from './server/services/gemini';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// High limit for large image payloads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Request logger
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    console.log(`[API] ${req.method} ${req.path}`);
  }
  next();
});

// Validation schemas for auth
const RegisterSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(50),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// --- Auth Routes ---
app.post('/api/auth/register', (req, res) => {
  try {
    const parse = RegisterSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: parse.error.issues[0]?.message || 'Invalid input data' });
    }

    const { username, email, password } = parse.data;

    // Check unique email
    const existingEmail = dbService.findUserByEmail(email);
    if (existingEmail) {
      return res.status(409).json({ error: 'An account with this email address already exists.' });
    }

    // Check unique username
    const existingUsername = dbService.findUserByUsername(username);
    if (existingUsername) {
      return res.status(409).json({ error: 'Username is already claimed. Please choose another.' });
    }

    // Hash password with bcrypt salt rounds
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    const newUser = dbService.createUser(username, email, passwordHash);
    const token = jwt.sign({ id: newUser.id, email: newUser.email }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        created_at: newUser.created_at,
      },
    });
  } catch (error: any) {
    console.error('Registration failed:', error);
    res.status(500).json({ error: 'Internal server error during user onboarding.' });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const parse = LoginSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: parse.error.issues[0]?.message || 'Invalid login credentials' });
    }

    const { email, password } = parse.data;
    const user = dbService.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'No account found matching this email address.' });
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid password. Please check your credentials.' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        created_at: user.created_at,
      },
    });
  } catch (error: any) {
    console.error('Login failed:', error);
    res.status(500).json({ error: 'Internal server error during authentication.' });
  }
});

app.get('/api/auth/me', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.user;
  res.json({ user });
});

// --- Vision Analysis Route ---
const AnalyzeRequestSchema = z.object({
  imageUrl: z.string().min(1, 'Image data is required'),
  domain: z.enum(['industrial', 'medical', 'document', 'general']),
  sensitivity: z.enum(['Low', 'Medium', 'High']).optional().default('Medium'),
  customQuery: z.string().optional().default(''),
});

app.post('/api/analyze', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const parsed = AnalyzeRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid inspection parameters' });
    }

    const { imageUrl, domain, sensitivity, customQuery } = parsed.data;
    const userId = req.user!.id;

    // Call Gemini Vision with structured schema and Zod validation
    const analysis = await analyzeVisualPayload({
      imageUrl,
      domain,
      sensitivity,
      customQuery,
    });

    // Save scan to database linked to authenticated user
    const scanRecord = dbService.createScan({
      userId,
      domain,
      imageUrl,
      summary: analysis.summary,
      rawAnalysis: analysis,
      status: 'completed',
    });

    res.status(201).json({
      scan: {
        ...scanRecord,
        raw_analysis: analysis,
      },
    });
  } catch (error: any) {
    console.error('Vision analysis pipeline error:', error);
    res.status(500).json({
      error: error.message || 'Vision inspection pipeline failed to evaluate payload.',
    });
  }
});

// --- Scans History Routes ---
app.get('/api/scans', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const domain = (req.query.domain as string) || 'all';
    const search = (req.query.search as string) || '';
    const anomalyFilter = (req.query.anomaly as string) || '';
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 12;

    const results = dbService.getScans({
      userId,
      domain,
      search,
      anomalyFilter,
      page,
      limit,
    });

    res.json(results);
  } catch (error: any) {
    console.error('Failed to retrieve scans:', error);
    res.status(500).json({ error: 'Failed to retrieve scan history.' });
  }
});

app.get('/api/scans/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const scanId = parseInt(req.params.id, 10);
    if (isNaN(scanId)) {
      return res.status(400).json({ error: 'Invalid scan ID.' });
    }

    const scan = dbService.getScanById(scanId, userId);
    if (!scan) {
      return res.status(404).json({ error: 'Inspection report not found or access denied.' });
    }

    res.json({ scan });
  } catch (error: any) {
    console.error('Failed to get scan by id:', error);
    res.status(500).json({ error: 'Failed to retrieve scan record.' });
  }
});

app.delete('/api/scans/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const scanId = parseInt(req.params.id, 10);
    if (isNaN(scanId)) {
      return res.status(400).json({ error: 'Invalid scan ID.' });
    }

    const deleted = dbService.deleteScan(scanId, userId);
    if (!deleted) {
      return res.status(404).json({ error: 'Scan not found or already removed.' });
    }

    res.json({ success: true, message: 'Scan record deleted successfully.' });
  } catch (error: any) {
    console.error('Failed to delete scan:', error);
    res.status(500).json({ error: 'Failed to delete scan record.' });
  }
});

// --- Operational Stats Route ---
app.get('/api/stats', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const stats = dbService.getStats(userId);
    res.json({ stats });
  } catch (error: any) {
    console.error('Failed to compute stats:', error);
    res.status(500).json({ error: 'Failed to compute operational stats.' });
  }
});

// --- Seed Sample Data Route (Convenience for instant testing) ---
app.post('/api/seed-samples', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const existingCount = dbService.getScans({ userId, limit: 1 }).total;
    if (existingCount > 0) {
      return res.json({ message: 'User already has scans; seed skipped.', seeded: false });
    }

    // Seed realistic sample inspections
    const samples = [
      {
        domain: 'industrial',
        imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
        summary: 'AOI identified high-risk solder bridging adjacent to microcontroller QFP-64 pins and mild surface oxidation.',
        analysis: {
          summary: 'AOI identified high-risk solder bridging adjacent to microcontroller QFP-64 pins and mild surface oxidation.',
          confidenceScore: 0.96,
          anomaliesDetected: true,
          regions: [
            {
              label: 'Solder Bridge Flaw',
              severity: 'Critical',
              box_2d: [340, 410, 520, 580],
              description: 'Involuntary solder short between lead pins 23 and 24, creating electrical short-circuit risk.',
            },
            {
              label: 'Oxidation Trace',
              severity: 'Medium',
              box_2d: [180, 220, 290, 350],
              description: 'Copper trace discoloration indicating flux residue or atmospheric exposure.',
            },
          ],
          recommendations: [
            'Reroute PCB to manual desoldering rework station #4.',
            'Adjust solder paste stencil volume for pin pitch < 0.5mm.',
          ],
        },
      },
      {
        domain: 'medical',
        imageUrl: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1200&q=80',
        summary: 'Bilateral lung fields clear with prominent right retrocardiac vascular markings. No acute pneumothorax.',
        analysis: {
          summary: 'Bilateral lung fields clear with prominent right retrocardiac vascular markings. No acute pneumothorax.',
          confidenceScore: 0.94,
          anomaliesDetected: false,
          regions: [
            {
              label: 'Thoracic Cavity',
              severity: 'Low',
              box_2d: [150, 150, 850, 850],
              description: 'Normal pulmonary parenchymal aeration with symmetrical hemidiaphragms.',
            },
          ],
          recommendations: [
            'Maintain standard clinical monitoring.',
            'Routine follow-up in 12 months as indicated.',
          ],
        },
      },
      {
        domain: 'document',
        imageUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1200&q=80',
        summary: 'Commercial invoice parsed with 100% field extraction. Flagged discrepancy in remittance due date.',
        analysis: {
          summary: 'Commercial invoice parsed with 100% field extraction. Flagged discrepancy in remittance due date.',
          confidenceScore: 0.98,
          anomaliesDetected: true,
          regions: [
            {
              label: 'Due Date Mismatch',
              severity: 'Medium',
              box_2d: [210, 620, 310, 890],
              description: 'Net 30 term conflicts with printed due date timestamp.',
            },
            {
              label: 'Total Net Remittance',
              severity: 'Low',
              box_2d: [780, 600, 890, 920],
              description: 'Verified sum line item $14,850.00 matches line-item ledger.',
            },
          ],
          recommendations: [
            'Automate vendor AP voucher notification for date reconciliation.',
          ],
        },
      },
      {
        domain: 'general',
        imageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80',
        summary: 'High-bay warehouse scan detected 2 operators without high-vis jackets in active forklift traffic zone.',
        analysis: {
          summary: 'High-bay warehouse scan detected 2 operators without high-vis jackets in active forklift traffic zone.',
          confidenceScore: 0.95,
          anomaliesDetected: true,
          regions: [
            {
              label: 'PPE Violation: Missing Hi-Vis',
              severity: 'High',
              box_2d: [420, 310, 680, 450],
              description: 'Personnel in aisle B-3 operating within 5 meters of forklift without class 2 safety vest.',
            },
            {
              label: 'Aisle Obstruction',
              severity: 'Medium',
              box_2d: [720, 550, 880, 750],
              description: 'Wooden pallet overhang encroaching 18cm into designated pedestrian lane.',
            },
          ],
          recommendations: [
            'Broadcast audio safety notification on Zone 2 PA system.',
            'Dispatch floor supervisor for pallet realignment.',
          ],
        },
      },
    ];

    for (const item of samples) {
      dbService.createScan({
        userId,
        domain: item.domain,
        imageUrl: item.imageUrl,
        summary: item.summary,
        rawAnalysis: item.analysis,
        status: 'completed',
      });
    }

    res.json({ message: 'Seeded 4 realistic demo scans.', seeded: true });
  } catch (error: any) {
    console.error('Seed error:', error);
    res.status(500).json({ error: 'Seed failed.' });
  }
});

// --- Server & Vite Middleware Integration ---
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[VisionPulse Engine] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start VisionPulse server:', err);
  process.exit(1);
});
