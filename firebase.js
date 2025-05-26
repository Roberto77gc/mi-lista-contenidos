// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAkujb9MVSBd12bH9McPyMqiZV9OyyeVzk",
  authDomain: "seenly-70397.firebaseapp.com",
  projectId: "seenly-70397",
  storageBucket: "seenly-70397.appspot.com",
  messagingSenderId: "38767262174",
  appId: "1:38767262174:web:73ba88675669bb418f054f"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
