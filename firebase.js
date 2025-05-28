// firebase.js

// Configuración de Firebase para Seenly
const firebaseConfig = {
  apiKey: "AIzaSyAkujb9MVSBd12bH9McPyMqiZV9OyyeVzk",
  authDomain: "seenly-70397.firebaseapp.com",
  projectId: "seenly-70397",
  storageBucket: "seenly-70397.appspot.com",
  messagingSenderId: "38767262174",
  appId: "1:38767262174:web:73ba88675669bb418f054f"
};

// Importar módulos de Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Inicializar Firebase y base de datos
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Referencia a la colección "contenidos"
const contenidosRef = collection(db, "contenidos");

/**
 * Guarda un ítem en Firestore.
 * @param {Object} item - Objeto de contenido a guardar.
 */
async function guardarEnFirestore(item) {
  try {
    await addDoc(contenidosRef, item);
    console.log("📡 Guardado en Firestore");
  } catch (error) {
    console.error("❌ Error al guardar en Firestore:", error);
  }
}

/**
 * Obtiene todos los contenidos desde Firestore.
 * @returns {Promise<Array>} Lista de objetos.
 */
async function obtenerDesdeFirestore() {
  try {
    const snapshot = await getDocs(contenidosRef);
    const datos = snapshot.docs.map(doc => doc.data());
    console.log("📥 Datos cargados desde Firestore");
    return datos;
  } catch (error) {
    console.error("❌ Error al obtener datos:", error);
    return [];
  }
}

// Exportar funciones y base de datos
export { db, guardarEnFirestore, obtenerDesdeFirestore };
