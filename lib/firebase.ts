import firebase from "firebase/app";
import "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCeWnsxEs3rrsXUH1LtK5QR3s8AAny5ya0",
  authDomain: "liulaoshi-shop.firebaseapp.com",
  projectId: "liulaoshi-shop",
  storageBucket: "liulaoshi-shop.firebasestorage.app",
  messagingSenderId: "765144873502",
  appId: "1:765144873502:web:d80f26e92684284f6b0c0f",
  measurementId: "G-H1VRPL5HV5"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

export { db };