import {map, getCurrentUser, getUserAreas, getReq, postReq, deleteReq, patchReq, showAlert, showSuccess} from './commun.js';
import {getMessage} from "./home.js";


// ******************************************************************************************
// INIT 
// ******************************************************************************************

let currentUser = undefined;//JSON.parse(document.getElementById('current_user').textContent);
let userAreas = undefined;
let isOpenPanel = false;

export let visibleAreas = {};

/**
 * Get currentUser and update current user areas list
 */
async function init() {
    currentUser = await getCurrentUser();
    await updateUserAreas();
} 
init();

/*
 * Update current user areas list
 */
async function updateUserAreas() {
    userAreas = await getUserAreas(currentUser.id);

}

// ******************************************************************************************
// OPEN AREA PANEL 
// ******************************************************************************************

// get open panel button, the header of panel and content of panel
let areaBtn = document.getElementById("areas-panel-btn");
let areaHeader = document.getElementById("areas-panel").getElementsByClassName("cd-panel__header")[0].getElementsByTagName("h3")[0];
let areaContent = document.getElementById("tab-area");

/**
 * Click on btn open panel
 */
areaBtn.onclick = async function() {
    if( !isOpenPanel ) await updateUserAreas(); 
    isOpenPanel = togglePanel( areaBtn.id, "areas-panel" ); 
    if( isOpenPanel ) await initAreasListener(); 
}


// ******************************************************************************************
// HTML CONTENT 
// ******************************************************************************************


/**
 * Returns html of a list of frieareasnds
 * @param {*} areas 
 */

function getHtmlAreasList( areas ) {
    let content = `
        <form class="form-inline d-flex justify-content-center md-form form-sm mt-0 panel-search">
            <i class="metismenu-icon pe-7s-search"></i> 
            <input class="form-control form-control-sm ml-3 w-75 search-input" type="text" placeholder="Search" aria-label="Search">
        </form>
        <ul class="list-group">`;
    areas.forEach( area => { 

        let photo = "/static/img/map-background.jpg";

        let displayed = "";
        if( visibleAreas[area.id] ){
            displayed = `<button type="button" class="btn btn-dark item-btn-hide" data-areaid="${area.id}"> Hide </button>`
        }
        
        content += ` 
            <div class="media position-relative btn-list-area item-list search-item" data-areaid="${area.id}">
                <img src="${photo}" alt="Smiley face" height="50" width="50">
                <div class="media-body item-list-name">
                    <h5 class="mt-0 search-match">${area.name}</h5>
                </div>
                <div class="btn-group">
                    <button type="button" class="btn btn-dark item-btn-goto" data-areaid="${area.id}"> Go to </button>
               ${displayed}
                    <button type="button" class="btn btn-dark item-btn-details" data-areaid="${area.id}"> Edit </button>
                    <button type="button" class="btn btn-dark area-edit-del" data-areaid="${area.id}"> Delete </button>
                </div>
            </div>`
    });
    return content += "</ul>"
}

/**
 * Returns html of an area
 * @param {*} area
 */
function getHtmlArea( area ) {
    return `
    <div class="area-detail">
        <p id="lat">Latitude : 
            <span>${area.latitude}</span> 
        </p>
        <p id="long">Longitude : 
            <span>${area.longitude}</span> 
        </p>
        <p id="rad">Radius : 
            <span>${area.radius}</span> 
        </p>
    </div>
    `;
}

/**
 * Returns html of edit area
 * @param {*} area
 */
function getHtmlEditArea( area ) {
    return `
    <div class="area-detail">
        <p id="lat">Latitude : 
            <input id="area-edit-lat-field" type="text" maxlength="15" value="${area.latitude}"></input>
        </p>
        <p id="long">Longitude : 
            <input id="area-edit-long-field" type="text" maxlength="15" value="${area.longitude}"></input>
        </p>
        <p id="rad">Radius : 
            <input id="area-edit-rad-field" type="text" maxlength="15" value="${area.radius}"></input> 
        </p>
    </div>`;
}




// ******************************************************************************************
// SEARCH FUNCTION 
// ******************************************************************************************

/**
 * Filters lists depending on a regex
 * Filter input needs to have "search-input" class
 * Item's block to hide need to have "search-item" class
 * Item's html for matching  need to have "search-match" class
 */
$(document).on("keyup", ".search-input", function() {
    let regex = new RegExp( $(this).val(), 'i' );
    $(".search-item").each( function() {
        let matchItem = $(this).find( $(".search-match") ).html();
        if( matchItem.search(regex) === -1 ) $(this).hide();
        else $(this).show();
    });
});


// ******************************************************************************************
// LISTENERS 
// ******************************************************************************************


/**
 * On area creation panel click 
 * => initialize location fields with center of map values
 */
$(document).on( 'click', '#tab-prf-view-add', function() {
        let centerLat = (map.getBounds()._northEast.lat - map.getBounds()._southWest.lat)/2 + map.getBounds()._southWest.lat;
        let centerLng = (map.getBounds()._northEast.lng - map.getBounds()._southWest.lng)/2 + map.getBounds()._southWest.lng;
        $('#id_latitude').val(centerLat);
        $('#id_longitude').val(centerLng);
        $('#id_radius').val( 1 );
})


/**
 * Opens panel for area creation
 * Initialise location fields with location values
 * Used for right click area creation
 * @param {*} location 
 */
export async function openAreaPanelCreator( location ) {
    isOpenPanel = togglePanel( areaBtn.id, "areas-panel" ); 
    if( isOpenPanel ) {
        await initAreasListener();
        switchAreaPanel( "add" );
        $('#id_latitude').val( location.lat );
        $('#id_longitude').val( location.lng );
        $('#id_radius').val( 1 );
    }
}

/**
 * Display Area panel corresponding to panType value
 * @param {*} panType : "list" or "add"
 */
function switchAreaPanel( panType ) {
    if( panType === "list" ) {
        $('#tab-prf-view-list').addClass( 'active' );
        $('#tab-area').addClass( 'active' );
        $('#tab-area-add').removeClass( 'active' );
        $('#tab-prf-view-add').removeClass( 'active' );
    }
    if( panType === "add" ) {
        $('#tab-prf-view-add').addClass( 'active' );
        $('#tab-area-add').addClass( 'active' );
        $('#tab-area').removeClass( 'active' );
        $('#tab-prf-view-list').removeClass( 'active' );
    }
}

/**
 * Listener => Fill initial right-side areas panel with area user list
 */
async function initAreasListener() {

    await updateUserAreas();

    switchAreaPanel( "list" );

    areaHeader.innerHTML = `Areas`;


    areaContent.innerHTML = getHtmlAreasList( userAreas );

    let hideAreaBtns = [...document.getElementsByClassName("item-btn-hide")];
    hideAreaBtns.forEach( btn => btn.addEventListener( 'click', () => hideAreaListener(btn) ));

    // attach listener to all see friends button
    let gotoAreaBtn = [...document.getElementsByClassName("item-btn-goto")];
    gotoAreaBtn.forEach( btn => btn.addEventListener( 'click', () => gotoAreaListener(btn) ));
    
    // attach listener to all see friends button
    let seeAreaBtn = [...document.getElementsByClassName("item-btn-details")];
    seeAreaBtn.forEach( btn => btn.addEventListener( 'click', () => editAreaListener(btn) ));

    let deleteBtns = [...document.getElementsByClassName("area-edit-del")];
    deleteBtns.forEach( btn =>  btn.addEventListener( 'click', async () => {
                                    let areaID = btn.getAttribute("data-areaid");
                                    await deleteArea(areaID);
                                    if( visibleAreas[areaID] ) removeCircleMap(areaID);
                                    await initAreasListener();
                                }));
}


/**
 * Listener => Get messages and display area circle and center map on area
 * @param {*} btn 
 */
async function gotoAreaListener(btn) {
    let areaID = btn.getAttribute("data-areaid");
    await gotoArea( areaID, true ); 
    await initAreasListener();
}


/**
 * Listener => move circle and messages of an area
 * @param {*} btn 
 */
async function hideAreaListener(btn) {
    let areaID = btn.getAttribute("data-areaid");
    removeCircleMap( areaID );
    await initAreasListener();
}

/**
 * Get messages and display area circle and center map on area
 * @param {*} areaID
 * @param offset
 */
export async function gotoArea(areaID, offset=false) {
    let area = await getAreaById(areaID);
    await addCircleMap( area );

    // offset used to shift area on the left
    // used to see area with open panel
    let offsetValue = 0;
    if( offset )
        offsetValue = (map.getBounds()._northEast.lng - map.getBounds()._southWest.lng)/4;

    map.panTo(new L.LatLng(area.latitude, area.longitude+offsetValue));

}

/**
 * Add or update a circle shape on the map with messages area
 * @param {*} area 
 */
async function addCircleMap(area) {
    let messages = await getMessage(area.latitude, area.longitude, area.radius, "area");
    let areaVisibility = undefined;
    if(visibleAreas[area.id]) {
        removeMsgArea(area.id);
        areaVisibility = visibleAreas[area.id].areaVisibility
    } else {
        areaVisibility = L.circle([area.latitude, area.longitude], {radius: area.radius * 1000, color:"#34eb77"});
        map.addLayer(areaVisibility);
    }
    visibleAreas[area.id] = {"areaVisibility": areaVisibility, "messages": messages};
}

/**
 * Remove circle and messages of an area
 * @param {*} areaID 
 */
function removeCircleMap(areaID) {
    map.removeLayer(visibleAreas[areaID]["areaVisibility"]);
    visibleAreas[areaID]["messages"].forEach(msg => map.removeLayer(msg));
    delete visibleAreas[areaID];
}

function removeMsgArea( areaID ) {
    visibleAreas[areaID]["messages"].forEach(msg => map.removeLayer(msg));
}

/**
 * Update messages area if circle is visible
 * Used by notifications
 * @param {*} area 
 */
export function updateAreaMarkers( area ) {
    if( visibleAreas[area.id] ) addCircleMap( area );
}

/**
 * 
 */
$('#id-area-create').on('submit', async function(event){
   event.preventDefault();
   await createArea();
});

async function editAreaListener(btn){
    let areaID = btn.getAttribute("data-areaid");
    let area = await getAreaById(areaID);
    areaHeader.innerHTML =
        `<input id="area-edit-name-field" type="text" maxlength="15" value="${area.name}">
        <button id="area-back-btn" type="button" data-areaid="${area.id}" class="btn btn-light">Back</button>
        <button id="area-apply-edit" type="button" class="btn-pill btn-shadow btn-wide ml-auto btn btn-focus btn-sm">Apply</button>`;
    areaContent.innerHTML = getHtmlEditArea( area );


    // attach listener to apply button
    let applyBtn = document.getElementById("area-apply-edit");
    applyBtn.addEventListener( 'click', async () => {
                                        let newAreaName = $("#area-edit-name-field").val();
                                        let newLat = $("#area-edit-lat-field").val();
                                        let newLong = $("#area-edit-long-field").val();
                                        let newRad = $("#area-edit-rad-field").val();   
                                   
                                        let response = await updateArea(area.id, {
                                            "name" : newAreaName,
                                            "latitude" : newLat,
                                            "longitude" : newLong,
                                            "radius" : newRad
                                        });

                                        if(response.status_code == 200){
                                            if( visibleAreas[area.id] ) 
                                                removeCircleMap(area.id);
                                            await initAreasListener();
                                            
                                        }
                                        else{
                                            showAlert("Please check your inputs !");
                                        }
                                
                                        });

    // attach listener to apply button
    let backBtn = document.getElementById("area-back-btn");
    backBtn.addEventListener( 'click', async () => await initAreasListener() );
}

// ******************************************************************************************
// MAP FUNCTIONS
// ******************************************************************************************


function initCreateFormLocation( location ) {

}


// ******************************************************************************************
// API CALLS 
// ******************************************************************************************

function createArea() {
    console.log("Create Area is working!"); // sanity check
    let name = $('#id-area-create').find( '#id_name' ).val();
    let lat =  $('#id_latitude').val();
    let long = $('#id_longitude').val();
    let rad = $('#id_radius').val();
    let user = $('#id_user').val();

    // Start Ajax call
    $.ajax({
        url : "/area/add", // the endpoint
        type : "POST", // http method
        headers: getCsrfAccessHeaders('application/x-www-form-urlencoded; charset=UTF-8'),
        data : {
            name: name,
            latitude: lat,
            longitude: long,
            radius: rad,
            user: user,
        }, // data sent with the post request

        // handle a successful response
        success : async function() {
            $("#id-area-create")[0].reset();
            showSuccess("Success! Your Area has been updated.")
            await initAreasListener();
        },

        // handle a non-successful response
        error : async function(xhr,errmsg,err) {
            console.log( err );
            showAlert("Oops! We have encountered an error. Please check your inputs !");
            await initAreasListener();
        }
    });
}

export function getAreaById(areaID) {
    let URL = "area/" + areaID + "/";
    return getReq(URL);
}

export function deleteArea(areaID) {
    let URL = "area/" + areaID + "/";
    return deleteReq(URL);
}

export function updateArea(areaID, data) {
    let URL = "area/" + areaID + "/";
    return patchReq(URL, data);
}

