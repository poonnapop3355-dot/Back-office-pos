import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
 apiKey:"AIzaSyCeWnsxEs3rrsXUH1LtK5QR3s8AAny5ya0",
  authDomain: "pos-back-office-fba73.firebaseapp.com",
  projectId: "pos-back-office-fba73",
  storageBucket: "pos-back-office-fba73.appspot.com",
  messagingSenderId: "367332308119",
  appId: "1:367332308119:web:9c50153835c24e0f40776b"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);

// 4. เรียกใช้ service ที่ต้องการ (เช่น Firestore) และ export ออกไป
// นี่คือการ Export แบบ Named Export
export const db = getFirestore(app);
