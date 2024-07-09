
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

auth.signInAnonymously().catch(function(error) {
console.error('Authentication error:', error);
});

var firebaseConfig = {
    apiKey: "AIzaSyBY-upsPz8tgMUzmdt-r4uB61zI8k8OqBs",
    authDomain: "messagessite1.firebaseapp.com",
    // The value of `databaseURL` depends on the location of the database
    projectId: "messagessite1",
    storageBucket: "messagessite1.appspot.com",
    messagingSenderId: "971917162916",
    appId: "1:971917162916:web:ce325acb1b95e833e9a931",
    // For Firebase JavaScript SDK v7.20.0 and later, `measurementId` is an optional field
    measurementId: "G-GXMNREKVQ1"
  };

const form = document.getElementById('contactForm'); 
form.addEventListener('submit', (e) => {
e.preventDefault(); // Empêche l'envoi par défaut du formulaire

// Récupération des valeurs du formulaire
const name = form['name'].value;
const email = form['email'].value;
const subject = form['subject'].value;
const message = form['message'].value;
console.log("test booba")

// Enregistrement des données dans Firestore
const db = firebase.firestore();
db.collection('contacts').add({
    name: name,
    email: email,
    subject: subject,
    message: message,
    timestamp: firebase.firestore.FieldValue.serverTimestamp() // Optionnel : timestamp de l'enregistrement
})
.then((docRef) => {
    console.log("Document written with ID: ", docRef.id);
    // Réinitialisation du formulaire après soumission
    form.reset();
})
.catch((error) => {
    console.error("Error adding document: ", error);
});
});


