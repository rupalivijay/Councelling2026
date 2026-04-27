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

// 2. Data Loading
let dataToImport = [];
const dataFilePath = path.join(process.cwd(), "colleges-data.json");

if (fs.existsSync(dataFilePath)) {
  console.log("Reading data from colleges-data.json...");
  dataToImport = JSON.parse(fs.readFileSync(dataFilePath, "utf8"));
} else {
  console.log("No colleges-data.json found, using sample data.");
  dataToImport = [
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
      fees: { tuition: 85000, hostel: 20000 }
    }
  ];
}

async function importColleges() {
  console.log(`Starting import of ${dataToImport.length} colleges...`);
  
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
