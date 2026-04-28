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
  let colleges: any[] = [];
  let testimonials: any[] = [];

  try {
    const localDataPath = path.join(process.cwd(), "colleges-data.json");
    if (fs.existsSync(localDataPath)) {
      colleges = JSON.parse(fs.readFileSync(localDataPath, "utf8"));
      console.log(`Loaded ${colleges.length} colleges from local JSON file`);
    }

    const testimonialsPath = path.join(process.cwd(), "testimonials-data.json");
    if (fs.existsSync(testimonialsPath)) {
      testimonials = JSON.parse(fs.readFileSync(testimonialsPath, "utf8"));
      console.log(`Loaded ${testimonials.length} testimonials from local JSON file`);
    }
  } catch (error) {
    console.error("Error loading local data files:", error);
  }

  // Default fallback if JSON is missing or empty
  if (colleges.length === 0) {
    colleges = [
      { 
        id: "1", name: "AIIMS Delhi", state: "Delhi", city: "New Delhi", examType: "NEET", type: "Medical", quota: "All India Quota", 
        choiceCode: "AIIMS01",
        cutoffRank: { General: 50, OBC: 200, SC: 500, ST: 1000, EWS: 150 }, 
        link: "https://www.aiims.edu/", fees: { tuition: 1628, hostel: 4226 },
        nirfRanking: 1,
        description: "India's premier medical research university and hospital, consistently ranked #1 since NIRF's inception."
      }
    ];
  }

  if (testimonials.length === 0) {
    testimonials = [
      {
        id: "default-1",
        studentName: "Success Student",
        college: "Top Institute",
        content: "Highly recommend this platform for career guidance!",
        year: "2024"
      }
    ];
  }

// Function to refresh colleges from Firestore
  const fetchColleges = async () => {
    try {
      console.log(`Attempting to fetch colleges from DB: ${firebaseConfig.firestoreDatabaseId || '(default)'}`);
      const querySnapshot = await getDocs(collection(db, "colleges"));
      const freshColleges = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (freshColleges.length > 0) {
        colleges = freshColleges;
        console.log(`Successfully loaded ${colleges.length} colleges from Firestore`);
      } else {
        console.log("Firestore collection 'colleges' is empty.");
      }
    } catch (error: any) {
      console.error("Error fetching colleges from Firestore, using local fallback:");
      console.error("Error Code:", error?.code);
      console.error("Error Message:", error?.message);
      console.error("Full Error:", JSON.stringify(error));
    }
  };

  // API Endpoints
  app.post("/api/predict", async (req, res) => {
    const { rank, category, domicile, examType, quota } = req.body;
    
    const results = colleges.filter(college => {
      if (college.examType !== examType) return false;
      if (quota === "State Quota" && college.quota === "State Quota" && college.state !== domicile) return false;
      if (quota === "All India Quota" && college.quota !== "All India Quota") return false;
      
      const cutoff = college.cutoffRank?.[category as keyof typeof college.cutoffRank];
      if (cutoff === undefined) return false;
      
      if (examType === "CET-PCM" || examType === "CET-PCB") {
        return rank >= cutoff;
      }
      
      return rank <= cutoff;
    });

    res.json(results);
  });

  app.get("/api/colleges", (req, res) => {
    res.json(colleges);
  });

  app.post("/api/colleges", (req, res) => {
    const newCollege = req.body;
    colleges.push(newCollege);
    
    // Persist to local JSON
    try {
      const localDataPath = path.join(process.cwd(), "colleges-data.json");
      fs.writeFileSync(localDataPath, JSON.stringify(colleges, null, 2));
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
