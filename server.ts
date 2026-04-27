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
  let colleges: any[] = [
    { 
      id: "1", name: "AIIMS Delhi", state: "Delhi", city: "New Delhi", examType: "NEET", type: "Medical", quota: "All India Quota", 
      cutoffRank: { General: 50, OBC: 200, SC: 500, ST: 1000, EWS: 150 }, 
      link: "https://www.aiims.edu/", fees: { tuition: 1628, hostel: 4226 },
      nirfRanking: 1,
      description: "India's premier medical research university and hospital, consistently ranked #1 since NIRF's inception.",
      historicalTrends: {
        General: [{ year: 2021, rank: 45 }, { year: 2022, rank: 48 }, { year: 2023, rank: 52 }, { year: 2024, rank: 50 }, { year: 2025, rank: 55 }],
        OBC: [{ year: 2021, rank: 180 }, { year: 2022, rank: 195 }, { year: 2023, rank: 210 }, { year: 2024, rank: 200 }, { year: 2025, rank: 215 }]
      }
    },
    { 
      id: "2", name: "Maulana Azad Medical College", state: "Delhi", city: "New Delhi", examType: "NEET", type: "Medical", quota: "All India Quota", 
      cutoffRank: { General: 100, OBC: 400, SC: 800, ST: 1500, EWS: 250 }, 
      link: "https://www.mamc.ac.in/", fees: { tuition: 4350, hostel: 3000 },
      historicalTrends: {
        General: [{ year: 2021, rank: 85 }, { year: 2022, rank: 92 }, { year: 2023, rank: 105 }, { year: 2024, rank: 100 }, { year: 2025, rank: 110 }]
      }
    },
    { 
      id: "3", name: "Grant Medical College", state: "Maharashtra", city: "Mumbai", examType: "NEET", type: "Medical", quota: "State Quota", 
      cutoffRank: { General: 500, OBC: 1200, SC: 3000, ST: 5000, EWS: 1000 }, 
      link: "https://gmcjjh.org/", fees: { tuition: 125000, hostel: 10000 },
      historicalTrends: {
        General: [{ year: 2021, rank: 450 }, { year: 2022, rank: 480 }, { year: 2023, rank: 520 }, { year: 2024, rank: 500 }, { year: 2025, rank: 550 }]
      }
    },
    { 
      id: "4", name: "IIT Bombay", state: "Maharashtra", city: "Mumbai", examType: "JEE", type: "Engineering", quota: "All India Quota", 
      cutoffRank: { General: 60, OBC: 300, SC: 600, ST: 1200, EWS: 180 }, 
      link: "https://www.iitb.ac.in/", fees: { tuition: 211000, hostel: 25000 },
      nirfRanking: 3,
      description: "Renowned globally for its engineering and science programs, located in the heart of Mumbai.",
      historicalTrends: {
        General: [{ year: 2021, rank: 55 }, { year: 2022, rank: 58 }, { year: 2023, rank: 62 }, { year: 2024, rank: 60 }, { year: 2025, rank: 65 }]
      }
    },
    { 
      id: "5", name: "IIT Delhi", state: "Delhi", city: "New Delhi", examType: "JEE", type: "Engineering", quota: "All India Quota", 
      cutoffRank: { General: 100, OBC: 450, SC: 900, ST: 1800, EWS: 300 }, 
      link: "https://home.iitd.ac.in/", fees: { tuition: 220000, hostel: 28000 },
      historicalTrends: {
        General: [{ year: 2021, rank: 90 }, { year: 2022, rank: 95 }, { year: 2023, rank: 110 }, { year: 2024, rank: 100 }, { year: 2025, rank: 105 }]
      }
    },
    { 
      id: "6", name: "COEP Pune", state: "Maharashtra", city: "Pune", examType: "JEE", type: "Engineering", quota: "State Quota", 
      cutoffRank: { General: 2000, OBC: 5000, SC: 10000, ST: 20000, EWS: 4000 }, 
      link: "https://www.coep.org.in/", fees: { tuition: 90000, hostel: 35000 } 
    },
    { 
      id: "7", name: "VMMC & Safdarjung Hospital", state: "Delhi", city: "New Delhi", examType: "NEET", type: "Medical", quota: "All India Quota", 
      cutoffRank: { General: 150, OBC: 500, SC: 1000, ST: 2000, EWS: 300 }, 
      link: "http://www.vmmc-sjh.nic.in/", fees: { tuition: 36000, hostel: 12000 } 
    },
    { 
      id: "8", name: "Armed Forces Medical College", state: "Maharashtra", city: "Pune", examType: "NEET", type: "Medical", quota: "All India Quota", 
      cutoffRank: { General: 600, OBC: 600, SC: 600, ST: 600, EWS: 600 }, 
      link: "https://www.afmc.nic.in/", fees: { tuition: 0, hostel: 0 } 
    },
    { 
      id: "9", name: "IIT Madras", state: "Tamil Nadu", city: "Chennai", examType: "JEE", type: "Engineering", quota: "All India Quota", 
      cutoffRank: { General: 150, OBC: 500, SC: 1100, ST: 2200, EWS: 350 }, 
      link: "https://www.iitm.ac.in/", fees: { tuition: 215000, hostel: 24000 },
      nirfRanking: 1,
      description: "Consistent top performer in engineering with a strong focus on research and industrial collaboration."
    },
    { 
      id: "10", name: "NIT Trichy", state: "Tamil Nadu", city: "Tiruchirappalli", examType: "JEE", type: "Engineering", quota: "State Quota", 
      cutoffRank: { General: 5000, OBC: 10000, SC: 15000, ST: 25000, EWS: 6000 }, link: "https://www.nitt.edu/", fees: { tuition: 135000, hostel: 40000 } 
    },
    { 
      id: "11", name: "VJTI Mumbai", state: "Maharashtra", city: "Mumbai", examType: "CET-PCM", type: "Engineering", quota: "State Quota", 
      cutoffRank: { General: 99.8, OBC: 99.2, SC: 98.5, ST: 95.0, EWS: 99.5 }, link: "https://vjti.ac.in/", fees: { tuition: 85000, hostel: 20000 } 
    },
    { 
      id: "12", name: "ICT Mumbai", state: "Maharashtra", city: "Mumbai", examType: "CET-PCM", type: "Engineering", quota: "State Quota", 
      cutoffRank: { General: 99.5, OBC: 98.8, SC: 97.5, ST: 94.0, EWS: 99.0 }, link: "https://www.ictmumbai.edu.in/", fees: { tuition: 95000, hostel: 25000 } 
    },
    { 
      id: "13", name: "Government College of Pharmacy", state: "Maharashtra", city: "Aurangabad", examType: "CET-PCB", type: "Medical", quota: "State Quota", 
      cutoffRank: { General: 98.0, OBC: 96.5, SC: 94.0, ST: 90.0, EWS: 97.5 }, link: "https://geca.ac.in/", fees: { tuition: 45000, hostel: 15000 } 
    },
  ];

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
