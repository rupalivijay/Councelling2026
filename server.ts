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

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

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
    
    const results = currentColleges.map(college => {
      // 1. Exam Type Match
      if (college.examType !== examType) return { ...college, _isMatch: false };
      
      // 2. Quota & State filtering logic
      let isQuotaEligible = true;
      if (quota === "State Quota") {
        isQuotaEligible = 
          (college.quota === "State Quota" && college.state === domicile) ||
          (college.quota === "All India Quota");
      } else if (quota === "All India Quota") {
        isQuotaEligible = college.quota === "All India Quota";
      }
      
      if (!isQuotaEligible) return { ...college, _isMatch: false };
      
      // 3. Category Cutoff Logic
      const cutoffRankObj = college.cutoffRank || {};
      const specificCutoff = cutoffRankObj[category];
      const generalCutoff = cutoffRankObj["General"] || cutoffRankObj["GENERAL"];
      
      const targetRank = specificCutoff !== undefined ? specificCutoff : generalCutoff;
      if (targetRank === undefined) return { ...college, _isMatch: false };

      // 4. Score Comparison & Chance Calculation
      let chance: "Excellent" | "Safe" | "Moderate" | "Risky" = "Moderate";
      let isEligible = false;

      const isPercentile = examType === "CET-PCM" || examType === "CET-PCB";

      if (isPercentile) {
        // Percentile: Higher is better
        if (rank >= targetRank) {
          isEligible = true;
          if (rank >= targetRank + 3) chance = "Excellent";
          else if (rank >= targetRank + 1) chance = "Safe";
          else chance = "Moderate";
        } else if (rank >= targetRank - 0.5) { // Very close margin for percentiles
          isEligible = true; 
          chance = "Risky";
        }
      } else {
        // Rank: Lower is better
        if (rank <= targetRank) {
          isEligible = true;
          if (rank <= targetRank * 0.75) chance = "Excellent";
          else if (rank <= targetRank * 0.9) chance = "Safe";
          else chance = "Moderate";
        } else if (rank <= targetRank * 1.08) { // 8% margin for ranks
          isEligible = true; 
          chance = "Risky";
        }
      }

      return { 
        ...college, 
        _isMatch: isEligible,
        predictionChance: chance,
        cutoffUsed: targetRank
      };
    }).filter(c => c._isMatch);

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
