import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, collection } from "firebase/firestore";
import fs from "fs";
import path from "path";

// 1. Load Firebase Config
const firebaseConfig = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "firebase-applet-config.json"), "utf8")
);

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

// 2. Sample Data Structure
// You can create a file named 'colleges-data.json' with an array of objects
const sampleData = [
  { 
    id: "vjti-mumbai", 
    name: "Veermata Jijabai Technological Institute (VJTI)", 
    state: "Maharashtra", 
    city: "Mumbai", 
    examType: "CET-PCM", 
    type: "Engineering", 
    quota: "State Quota", 
    cutoffRank: { General: 99.8, OBC: 99.2, SC: 98.5, ST: 95.0, EWS: 99.5 }, 
    link: "https://vjti.ac.in/", 
    fees: { tuition: 85000, hostel: 20000 },
    historicalTrends: {
        General: [{ year: 2021, rank: 99.5 }, { year: 2022, rank: 99.6 }, { year: 2023, rank: 99.7 }, { year: 2024, rank: 99.8 }]
    }
  }
];

async function importColleges() {
  console.log("Starting import...");
  
  // You can point this to your actual JSON file
  const dataToImport = sampleData; 

  for (const item of dataToImport) {
    const { id, ...data } = item;
    try {
      const docRef = doc(db, "colleges", id);
      await setDoc(docRef, data);
      console.log(`✅ Imported: ${data.name}`);
    } catch (error) {
      console.error(`❌ Error importing ${data.name}:`, error);
    }
  }
  
  console.log("Import finished successfully!");
  process.exit(0);
}

importColleges();
