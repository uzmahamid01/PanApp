// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD8qcha2kVEMpVblQYvHCPspON39gmta2Q",
  authDomain: "pantry-tracking-136e6.firebaseapp.com",
  projectId: "pantry-tracking-136e6",
  storageBucket: "pantry-tracking-136e6.appspot.com",
  messagingSenderId: "972368731803",
  appId: "1:972368731803:web:4ab8a5df004fd81f43703e",
  measurementId: "G-3WYR2C5WX9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app)
