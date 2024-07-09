$(document).ready(function(){
	"use strict";
    
        /*==================================
* Author        : "ThemeSine"
* Template Name : Khanas HTML Template
* Version       : 1.0
==================================== */



/*=========== TABLE OF CONTENTS ===========
1. Scroll To Top 
2. Smooth Scroll spy
3. Progress-bar
4. owl carousel
5. welcome animation support
======================================*/

    // 1. Scroll To Top 
		$(window).on('scroll',function () {
			if ($(this).scrollTop() > 600) {
				$('.return-to-top').fadeIn();
			} else {
				$('.return-to-top').fadeOut();
			}
		});
		$('.return-to-top').on('click',function(){
				$('html, body').animate({
				scrollTop: 0
			}, 1500);
			return false;
		});
	
	
	
	// 2. Smooth Scroll spy
		
		$('.header-area').sticky({
           topSpacing:0
        });
		
		//=============

		$('li.smooth-menu a').bind("click", function(event) {
			event.preventDefault();
			var anchor = $(this);
			$('html, body').stop().animate({
				scrollTop: $(anchor.attr('href')).offset().top - 0
			}, 1200,'easeInOutExpo');
		});
		
		$('body').scrollspy({
			target:'.navbar-collapse',
			offset:0
		});

	// 3. Progress-bar
	
		var dataToggleTooTip = $('[data-toggle="tooltip"]');
		var progressBar = $(".progress-bar");
		if (progressBar.length) {
			progressBar.appear(function () {
				dataToggleTooTip.tooltip({
					trigger: 'manual'
				}).tooltip('show');
				progressBar.each(function () {
					var each_bar_width = $(this).attr('aria-valuenow');
					$(this).width(each_bar_width + '%');
				});
			});
		}
	
	// 4. owl carousel
	
		// i. client (carousel)
		
			$('#client').owlCarousel({
				items:7,
				loop:true,
				smartSpeed: 1000,
				autoplay:true,
				dots:false,
				autoplayHoverPause:true,
				responsive:{
						0:{
							items:2
						},
						415:{
							items:2
						},
						600:{
							items:4

						},
						1199:{
							items:4
						},
						1200:{
							items:7
						}
					}
				});
				
				
				$('.play').on('click',function(){
					owl.trigger('play.owl.autoplay',[1000])
				})
				$('.stop').on('click',function(){
					owl.trigger('stop.owl.autoplay')
				})


    // 5. welcome animation support

        $(window).load(function(){
        	$(".header-text h2,.header-text p").removeClass("animated fadeInUp").css({'opacity':'0'});
            $(".header-text a").removeClass("animated fadeInDown").css({'opacity':'0'});
        });

        $(window).load(function(){
        	$(".header-text h2,.header-text p").addClass("animated fadeInUp").css({'opacity':'0'});
            $(".header-text a").addClass("animated fadeInDown").css({'opacity':'0'});
        });

});	
	// Initialize Firebase
	const app = initializeApp(firebaseConfig);
	const analytics = getAnalytics(app);

	auth.signInAnonymously().catch(function(error) {
    console.error('Authentication error:', error);
});

// Configuration de votre application Firebase
const firebaseConfig = {
	apiKey: "AIzaSyBY-upsPz8tgMUzmdt-r4uB61zI8k8OqBs",
	authDomain: "messagessite1.firebaseapp.com",
	projectId: "messagessite1",
	storageBucket: "messagessite1.appspot.com",
	messagingSenderId: "971917162916",
	appId: "1:971917162916:web:ce325acb1b95e833e9a931",
	measurementId: "G-GXMNREKVQ1"
  };

// Initialisation de Firebase
const app = initializeApp(firebaseConfig);

// Accès à Firestore (base de données)
const db = getFirestore(app);

	
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
