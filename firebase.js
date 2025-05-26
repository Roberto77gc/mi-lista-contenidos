// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Configuración de Firebase para Seenly
const firebaseConfig = {
  apiKey: "AIzaSyAkujb9MVSBd12bH9McPyMqiZV9OyyeVzk",
  authDomain: "seenly-70397.firebaseapp.com",
  projectId: "seenly-70397",
  storageBucket: "seenly-70397.appspot.com",
  messagingSenderId: "38767262174",
  appId: "1:38767262174:web:73ba88675669bb418f054f"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Referencia a la colección en Firestore
const contenidosRef = collection(db, "contenidos");

// Función para guardar un contenido en Firestore
async function guardarEnFirestore(item) {
  try {
    await addDoc(contenidosRef, item);
    console.log("📡 Guardado en Firestore");
  } catch (error) {
    console.error("❌ Error al guardar en Firestore:", error);
  }
}

// Función para obtener todos los datos desde Firestore
async function obtenerDesdeFirestore() {
  try {
    const snapshot = await getDocs(contenidosRef);
    const datos = snapshot.docs.map(doc => doc.data());
    console.log("📥 Cargado desde Firestore");
    return datos;
  } catch (error) {
    console.error("❌ Error al cargar desde Firestore:", error);
    return [];
  }
}

export { db, guardarEnFirestore, obtenerDesdeFirestore };
