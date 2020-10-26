// get all btns used to activate right-side panels
let panelBtns = [...document.getElementsByClassName('cd-btn')];

// get all right-side panels containers 
let panelContainers = [...document.getElementsByClassName('cd-panel')];

// add event to all panels in order to close them on outside click or cross click
panelContainers.forEach( cont => {
	cont.onclick = function(event) { 
		if( event.target.classList.contains('js-cd-close') || event.target.classList.contains('cd-panel') ) {
			this.classList.remove( 'cd-panel--is-visible' );
			panelBtns.forEach( btn => btn.classList.remove('mm-active') );
		}
	}
});

// close all panels and reset btn
function closeAllPanels() {
	panelContainers.forEach( cont => cont.classList.remove('cd-panel--is-visible') );
	panelBtns.forEach( btn => btn.classList.remove('mm-active') );
}


//toogle a panel and btn
function togglePanel( panelBtnID, panelID ) {
		panelBtn = panelBtnID===undefined ? undefined : document.getElementById(panelBtnID);
		let panel =  document.getElementById(panelID);
		if( panel.classList.contains('cd-panel--is-visible') ) {
			closeAllPanels(); 
			return false;
		}
		else {
			closeAllPanels();
			panel.classList.add( 'cd-panel--is-visible' );
			if(panelBtn) panelBtn.classList.add( "mm-active" );
			return true;
		}
}

/* //toogle a simple panel (without button management)
function toggleSimplePanel( panelID ) {
	let panel =  document.getElementById(panelID);
	if( panel.classList.contains('cd-panel--is-visible') ) {
		closeAllPanels(); 
		return false;
	}
	else {
		closeAllPanels();
		panel.classList.add( 'cd-panel--is-visible' );
		panelBtn.classList.add( "mm-active" );
		return true;
	}
} */




// exemple de l'ouverture du panel notifications
notificationsBtn = document.getElementById("notifications-panel-btn");
notificationsBtn.onclick = function() {
	togglePanel( notificationsBtn.id, "notifications-panel" );

	
}

// exemple de l'ouverture du panel friends
/* friendsBtn = document.getElementById("friends-panel-btn");
friendsBtn.onclick = function() {
	//{ ... }
	togglePanel( friendsBtn.id, "friends-panel" );
} */



/* // exemple de l'ouverture du panel area
areasBtn = document.getElementById("areas-panel-btn");
areasBtn.onclick = function() {
	//{ ... }
	togglePanel( areasBtn.id, "areas-panel" );
} */

// exemple de l'ouverture du panel profile
profileBtn = document.getElementById("profile-panel-btn");
profileBtn.onclick = function() {
	//{ ... }
	togglePanel( profileBtn.id, "profile-panel" );
	$('.dropdown-profile').removeClass("show");
}