// Import des modules Firebase nécessaires
import { initializeApp } from "firebase/app";
import { getDatabase, ref, push } from "firebase/database";

// Configuration de votre application Firebase
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
  
// Initialisation de Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const contactFormDB = ref(database, 'contactForm');

// Attente du chargement de reCAPTCHA et gestion du formulaire
document.addEventListener('DOMContentLoaded', function() {
    // Chargement de reCAPTCHA v3 avec votre clé de site
    grecaptcha.ready(function() {
        const form = document.getElementById('contactForm');
        
        form.addEventListener('submit', function(event) {
            event.preventDefault(); // Empêche l'envoi par défaut du formulaire
            
            // Récupération des valeurs du formulaire
            const name = form['name'].value;
            const email = form['email'].value;
            const subject = form['subject'].value;
            const message = form['message'].value;
            
            // Exécution de reCAPTCHA pour obtenir le token
            grecaptcha.execute('YOUR_SITE_KEY', { action: 'submit' }).then(function(token) {
                // Enregistrement des données dans Firebase Realtime Database
                saveDataToFirebase(name, email, subject, message, token);
            });
        });
    });
});

// Fonction pour enregistrer les données dans Firebase
function saveDataToFirebase(name, email, subject, message, token) {
    push(contactFormDB, {
        name: name,
        email: email,
        subject: subject,
        message: message,
        recaptchaResponse: token,
        timestamp: firebase.database.ServerValue.TIMESTAMP // Optionnel : timestamp de l'enregistrement
    })
    .then(() => {
        console.log("Data successfully written to Realtime Database");
        document.getElementById('contactForm').reset(); // Réinitialisation du formulaire
    })
    .catch((error) => {
        console.error("Error writing document: ", error);
    });
}
