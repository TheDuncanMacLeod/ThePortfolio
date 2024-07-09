import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase, ref, set } from "firebase/database";
// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDivJYowj8vS2bwIL-v_8ni137u_NbWaas",
  authDomain: "testdb111-3cc4e.firebaseapp.com",
  databaseURL: "https://testdb111-3cc4e-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "testdb111-3cc4e",
  storageBucket: "testdb111-3cc4e.appspot.com",
  messagingSenderId: "194820217287",
  appId: "1:194820217287:web:5e4e41997ce2ad2e9861e2",
  measurementId: "G-89H5X1VHTD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const database = getDatabase(app);


const contactFormDB = ref(database, 'contactForm');

form.addEventListener('submit', (e) => {
    e.preventDefault(); // Empêche l'envoi par défaut du formulaire

    // Récupération des valeurs du formulaire
    const name = form['name'].value;
    const email = form['email'].value;
    const subject = form['subject'].value;
    const message = form['message'].value;

    // Enregistrement des données dans Realtime Database
    set(contactFormDB, {
        name: name,
        email: email,
        subject: subject,
        message: message,
        timestamp: firebase.database.ServerValue.TIMESTAMP // Optionnel : timestamp de l'enregistrement
    })
    .then(() => {
        console.log("Data successfully written to Realtime Database");
        // Réinitialisation du formulaire après soumission
        form.reset();
    })
    .catch((error) => {
        console.error("Error writing document: ", error);
    });
});

