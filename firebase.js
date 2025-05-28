// firebase.js – Configuración y funciones de Firestore para Seenly

// --- Firebase Configuración ---
const firebaseConfig = {
  apiKey: "AIzaSyAkujb9MVSBd12bH9McPyMqiZV9OyyeVzk",
  authDomain: "seenly-70397.firebaseapp.com",
  projectId: "seenly-70397",
  storageBucket: "seenly-70397.appspot.com",
  messagingSenderId: "38767262174",
  appId: "1:38767262174:web:73ba88675669bb418f054f"
};

// --- Importar Firebase SDK ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// --- Inicializar Firebase ---
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const contenidosRef = collection(db, "contenidos");

// --- Función: Guardar contenido en Firestore ---
async function guardarEnFirestore(item) {
  try {
    await addDoc(contenidosRef, item);
    console.log("📡 Guardado en Firestore");
  } catch (error) {
    console.error("❌ Error al guardar en Firestore:", error);
  }
}

// --- Función: Obtener contenidos desde Firestore ---
async function obtenerDesdeFirestore() {
  try {
    const snapshot = await getDocs(contenidosRef);
    return snapshot.docs.map(doc => doc.data());
  } catch (error) {
    console.error("❌ Error al obtener datos:", error);
    return [];
  }
}

// --- Exportar ---
export { db, guardarEnFirestore, obtenerDesdeFirestore };
