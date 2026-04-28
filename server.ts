import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import fs from "fs";

// Load Firebase Config
const firebaseConfig = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "firebase-applet-config.json"), "utf8")
);

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Local/Fallback College Data
  let localColleges: any[] = [];
  let dbColleges: any[] = [];
  let testimonials: any[] = [];

  try {
    const localDataPath = path.join(process.cwd(), "colleges-data.json");
    if (fs.existsSync(localDataPath)) {
      localColleges = JSON.parse(fs.readFileSync(localDataPath, "utf8"));
      console.log(`Loaded ${localColleges.length} colleges from local JSON file`);
    }

    const testimonialsPath = path.join(process.cwd(), "testimonials-data.json");
    if (fs.existsSync(testimonialsPath)) {
      testimonials = JSON.parse(fs.readFileSync(testimonialsPath, "utf8"));
      console.log(`Loaded ${testimonials.length} testimonials from local JSON file`);
    }
  } catch (error) {
    console.error("Error loading local data files:", error);
  }

  // Combined colleges
  const getColleges = () => {
    // If we have DB colleges, prioritize them but merge with unique local ones
    if (dbColleges.length > 0) {
      const dbIds = new Set(dbColleges.map(c => c.id));
      const uniqueLocal = localColleges.filter(c => !dbIds.has(c.id));
      return [...dbColleges, ...uniqueLocal];
    }
    return localColleges;
  };

  // Function to refresh colleges from Firestore
  const fetchColleges = async () => {
    try {
      console.log(`Attempting to fetch colleges from DB: ${firebaseConfig.firestoreDatabaseId || '(default)'}`);
      const querySnapshot = await getDocs(collection(db, "colleges"));
      const freshColleges = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (freshColleges.length > 0) {
        dbColleges = freshColleges;
        console.log(`Successfully loaded ${dbColleges.length} colleges from Firestore`);
      } else {
        console.log("Firestore collection 'colleges' is empty.");
      }
    } catch (error: any) {
      console.error("Error fetching colleges from Firestore, using local fallback:");
      console.error("Error Code:", error?.code);
    }
  };

  // API Endpoints
  app.post("/api/predict", async (req, res) => {
    const { rank, category, domicile, examType, quota } = req.body;
    const currentColleges = getColleges();
    
    console.log(`Prediction request: rank=${rank}, category=${category}, domicile=${domicile}, examType=${examType}, quota=${quota}`);
    
    const results = currentColleges.filter(college => {
      // 1. Exam Type Match
      if (college.examType !== examType) return false;
      
      // 2. Quota & State filtering logic
      // Important: If searching for State Quota, we must honor eligibility
      if (quota === "State Quota") {
        // Students can apply for State Quota if:
        // - They are local to that state
        // - OR the college is All India Quota (which is open to all)
        const isEligible = 
          (college.quota === "State Quota" && college.state === domicile) ||
          (college.quota === "All India Quota");
        
        if (!isEligible) return false;
      } else if (quota === "All India Quota") {
        // AIQ search only shows AIQ seats
        if (college.quota !== "All India Quota") return false;
      }
      
      // 3. Category Cutoff Logic
      const cutoffRankObj = college.cutoffRank || {};
      const specificCutoff = cutoffRankObj[category];
      const generalCutoff = cutoffRankObj["General"] || cutoffRankObj["GENERAL"];
      
      // Target rank for comparison
      const targetRank = specificCutoff !== undefined ? specificCutoff : generalCutoff;
      
      if (targetRank === undefined) return false;

      // 4. Score Comparison
      // Percentile/Score: Higher is better (CET-PCM, CET-PCB usually provide percentiles)
      if (examType === "CET-PCM" || examType === "CET_PCB" || examType === "CET-PCB") {
        return rank >= targetRank;
      }
      
      // rank (AIR): Lower is better (NEET/JEE ranks)
      return rank <= targetRank;
    });

    console.log(`Found ${results.length} results`);
    res.json(results);
  });

  app.get("/api/colleges", (req, res) => {
    res.json(getColleges());
  });

  app.post("/api/colleges", (req, res) => {
    const newCollege = req.body;
    localColleges.push(newCollege);
    
    // Persist to local JSON
    try {
      const localDataPath = path.join(process.cwd(), "colleges-data.json");
      fs.writeFileSync(localDataPath, JSON.stringify(localColleges, null, 2));
      console.log(`Added new college: ${newCollege.name} and saved to disk`);
    } catch (error) {
      console.error("Error saving to colleges-data.json:", error);
    }
    
    res.status(201).json(newCollege);
  });

  app.get("/api/testimonials", (req, res) => {
    res.json(testimonials);
  });

  app.post("/api/testimonials", (req, res) => {
    const newTestimonial = req.body;
    testimonials.push(newTestimonial);
    
    // Persist to local JSON
    try {
      const testimonialsPath = path.join(process.cwd(), "testimonials-data.json");
      fs.writeFileSync(testimonialsPath, JSON.stringify(testimonials, null, 2));
      console.log(`Added new testimonial and saved to disk`);
    } catch (error) {
      console.error("Error saving to testimonials-data.json:", error);
    }
    
    res.status(201).json(newTestimonial);
  });

  // Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    
    // In middlewareMode: true, we need to serve index.html ourselves
    app.get("*", async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = fs.readFileSync(path.resolve(process.cwd(), "index.html"), "utf-8");
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (e) {
        console.error("Vite transform error:", e);
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.setHeader("Content-Type", "text/html");
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    // Start initial fetch in background after server starts
    fetchColleges().catch(err => console.error("Background initial fetch failed:", err));
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
