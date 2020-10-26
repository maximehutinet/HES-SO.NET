import {openChatBox} from './chat.js';
/**
 * Setting up the map
 */

// Add multiple layers and clustering
var msg_clusterGrp = L.markerClusterGroup.layerSupport();
export var  msg_layer = L.layerGroup(),
            areas_layer = L.layerGroup();

var key = "pk.eyJ1Ijoicm91bGV0YW1peCIsImEiOiJjazhsb3BnbDAwNGMyM2ZyeGRxYXh1cGRkIn0.9vMWTXl70EE__VKRlyCOdA",
    mbAttr = 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
			'<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
			'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    mbUrl = 'https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token='+key;

var dark = L.tileLayer(mbUrl, {id: 'mapbox/dark-v10', tileSize: 512, zoomOffset: -1, attribution: mbAttr}),
    grayscale = L.tileLayer(mbUrl, {id: 'mapbox/light-v9', tileSize: 512, zoomOffset: -1, attribution: mbAttr}),
    streets   = L.tileLayer(mbUrl, {id: 'mapbox/streets-v11', tileSize: 512, zoomOffset: -1, attribution: mbAttr}),
    satellite = L.tileLayer(mbUrl, {id: 'mapbox/satellite-v9', tileSize: 512, zoomOffset: -1, attribution: mbAttr});

export let map = L.map('map',{
    center: [46.2, 6.1667],
    zoom: 13,
    layers: [streets],
    overlays: [msg_layer]
});
var baseLayers = {
        "Dark": dark,
        "Grayscale": grayscale,
        "Streets": streets,
        "Satellite": satellite
    },
    overlays = {
        "Messages": msg_layer,
        "Areas": areas_layer
    };
msg_clusterGrp.addTo(map); 
msg_clusterGrp.checkIn(msg_layer);
msg_clusterGrp.checkIn(areas_layer);
// Init Layers and Group controls
L.control.layers(baseLayers, overlays).addTo(map);
/**
 * Display an alert message on the main screen
 * @param {*} message 
 */
export function showAlert(message){
    $(".alert-container").prepend(
        `
        <div id="alert-err" class="alert alert-danger alert-dismissible fade show" role="alert">
            <span class="alert-body">${message}</span>
            <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                <span aria-hidden="true">&times;</span>
            </button>
        </div>
        `
    );
    $(".alert-container .alert").first().delay(2000).fadeOut(1000, function () { $(this).remove(); });
}


/**
 * Display an success message on the main screen
 * @param {*} message 
 */
export function showSuccess(message){
    $(".alert-container").prepend(
        `
        <div id="alert-err" class="alert alert-success alert-dismissible fade show" role="alert">
            <span class="alert-body">${message}</span>
            <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                <span aria-hidden="true">&times;</span>
            </button>
        </div>
        `
    );
    $(".alert-container .alert").first().delay(2000).fadeOut(1000, function () { $(this).remove(); });
}

/**
 * Get the current user
 */
export function getCurrentUser(){
    return new Promise(
        resolve => {
            let URL = 'user/current';
            $.ajax( {
            type: "GET",
            url: URL,
            success: (data) => {
                resolve(data);
            },
            error: (res) => {
                if(res.status === 401)
                    showAlert("You're not authenticated");
                else
                    showAlert( "Bad request !" );
            },
            fail: () => {
                showAlert( "Server unreachable !" );
            }
            });
        }
    )
}

/**
 * Get a user by ID
 */
export function getUserByID(id){
    let URL = "user/" + id + "/";
    return getReq(URL);
}

/**
 * Get all the groups that a user belongs to
 * @param userID
 */
export function getGroups(userID){
    let URL = "/group/list/user/" + userID;
    return getReq(URL);
}

export function getFriendsList(id){
    return new Promise(
        resolve => {
            let URL = "user/list/friends/" + id + "/";
            $.ajax( {
                type: "GET",
                url: URL,
                headers: getCsrfAccessHeaders('application/x-www-form-urlencoded; charset=UTF-8'),
                success: (data) => {
                    resolve( data.result );
                },
                error: (res) => {
                    if(res.status === 403)
                        showAlert("You're not authenticated");

                    else 
                        alert( "Bad request !" );
                },
                fail: () => {
                    alert( "Server unreachable !" );
                }
            });
        }
    )
}

export function getUserAreas(id){
    let URL = "user/list/areas/" + id;
    return getReq(URL);
}

/**
 * GET request
 * @param URL : URL of the route
 */
export function getReq(URL){
    return new Promise(
        resolve => {
            $.ajax( {
                type: "GET",
                url: URL,
                headers: getAccessHeaders("application/json"),
                success: (data) => {
                    resolve(data.result)
                },
                error: (res) => {
                    if(res.status === 403)
                        showAlert("You're not authenticated");

                    else 
                        alert( "Bad request !" );
                },
                fail: () => {
                    alert( "Server unreachable !" );
                }
            });
        }
    )
}

/**
 * POST request
 * @param URL : URL of the route
 * @paran datas : Data to send
 */
export function postReq(URL, datas){
    return new Promise(
        resolve => {
            $.ajax( {
                type: "POST",
                url: URL,
                data: datas,
                headers: getCsrfAccessHeaders('application/x-www-form-urlencoded; charset=UTF-8'),
                success: (data) => {
                    resolve(data)
                },
                error: (res) => {
                    if(res.status === 403)
                        showAlert("You're not authenticated");

                    else 
                        alert( "Bad request !" );
                },
                fail: () => {
                    alert( "Server unreachable !" );
                }
            });
        }
    )
}

/**
 * POST request
 * @param URL : URL of the route
 * @param datas : Data to send
 */
export function postReqFiles(URL, datas){
    return new Promise(
        resolve => {
            console.log(datas);
            $.ajax( {
                type: "POST",
                url: URL,
                data: datas,
                headers: getCsrfAccessHeaders('application/x-www-form-urlencoded; charset=UTF-8'),
                enctype: 'multipart/form-data',
                processData: false,
                contentType: false,
                params: {
                    'csrf_token': getCookie('application/x-www-form-urlencoded; charset=UTF-8'),
                    'csrf_name': 'csrfmiddlewaretoken',
                    'csrf_xname': 'X-CSRFToken',
                },
                success: (data) => {
                    resolve(data);
                    console.log(data);
                },
                error: (res) => {
                    if(res.status === 403)
                        showAlert("You're not authenticated");

                    else
                        alert( "Bad request !" );
                },
                fail: () => {
                    alert( "Server unreachable !" );
                }
            });
        }
    )
}

/**
 * DELETE request
 * @param commentID : The comment id
 */
export function deleteReq(URL){
    return new Promise(
        resolve => {
            $.ajax( {
                type: "DELETE",
                url: URL,
                headers: getCsrfAccessHeaders('application/x-www-form-urlencoded; charset=UTF-8'),
                success: (data) => {
                    resolve(data)
                },
                error: (res) => {
                    if(res.status === 403)
                        showAlert("You're not authenticated");
                    else 
                        alert( "Bad request !" );
                },
                fail: () => {
                    alert( "Server unreachable !" );
                }
            });
        }
    )
}

/**
 * PATCH request
 * @param URL : URL of the route
 * @paran datas : Data to modify
 */
export function patchReq(URL, datas){
    return new Promise(
        resolve => {
            $.ajax( {
                type: "PATCH",
                url: URL,
                data: datas,
                headers: getCsrfAccessHeaders('application/x-www-form-urlencoded; charset=UTF-8'),
                success: (data) => {
                    resolve(data)
                },
                error: (res) => {
                    if(res.status === 403)
                        showAlert("You're not authenticated");

                    else 
                        alert( "Bad request !" );
                },
                fail: () => {
                    alert( "Server unreachable !" );
                }
            });
        }
    )
}

/**
 * Returns html of a list of friends
 * @param {*} friends 
 */
export function getHtmlFriendsList( friends ) {
    let content = `
        <form class="form-inline d-flex justify-content-center md-form form-sm mt-0 panel-search">
            <i class="metismenu-icon pe-7s-search"></i> 
            <input class="form-control form-control-sm ml-3 w-75 search-input" type="text" placeholder="Search" aria-label="Search">
        </form>
        <ul class="list-group">`;

    let image = "/static/img/avatar.png";

    friends.forEach( frd => {
        if(frd.photo) image = frd.photo;
        content += `
        <div class="friend-el search-item">
            <div class="media position-relative btn-list-friend item-list item-list-click" data-friendid="${frd.id}">
                <img src="${image}" alt="Smiley face" height="50" width="50">
                <div class="media-body item-list-name">
                    <h5 class="mt-0 search-match">${frd.name}</h5>
                </div>
            </div>
            <a href="#" class="btn btn-dark btn-chat-friend" data-friendid="${frd.id}">
                <i class="fas fa-comment-alt"></i>
            </a>
        </div>
            `
    })
    return content += "</ul>"
}

/**
 * Returns html of a list of friends to invit
 * @param {*} friends 
 */
export function getHtmlInvitList( friends ) {
    let content = `
        <form class="form-inline d-flex justify-content-center md-form form-sm mt-0 panel-search">
            <i class="metismenu-icon pe-7s-search"></i> 
            <input class="form-control form-control-sm ml-3 w-75 search-input" type="text" placeholder="Search" aria-label="Search">
        </form>
        <ul class="list-group">`;
    let image = "/static/img/avatar.png";
    friends.forEach( frd => {
        if(frd.photo) image = frd.photo;
        content += `
            <div class="media position-relative btn-list-friend item-list search-item">
                <img src="${image}" alt="Smiley face" height="50" width="50">
                <div class="media-body item-list-name">
                    <h5 class="mt-0 search-match">${frd.name}</h5>
                </div>
                <div class="btn-group">
                    <button type="button" class="btn btn-dark item-btn-see" data-friendid="${frd.id}"> Show </button>
                    <button type="button" class="btn btn-dark item-btn-invit" data-friendid="${frd.id}"> Invite </button>
                </div>
            </div>`
    });
    return content += "</ul>"
}

export function getHtmlContentSeeFriend( friend ) { 
    let bio = "Unknow";
    if( friend.bio ) bio = friend.bio;

    return `
            <img></img>
            <div class="card">
                <div class="card-header"> Biographie </div>
                <div class="card-body panel-content" > <p class="card-text"> ${bio} </p> </div>
            </div>`
}

export function updateScroll(id){
    var elem = document.getElementById(id);
    elem.scrollTop = elem.scrollHeight;
}

export function closeAllPanels() {
    // get all btns used to activate right-side panels
    let panelBtns = [...document.getElementsByClassName('cd-btn')];

    // get all right-side panels containers 
    let panelContainers = [...document.getElementsByClassName('cd-panel')];
	panelContainers.forEach( cont => cont.classList.remove('cd-panel--is-visible') );
	panelBtns.forEach( btn => btn.classList.remove('mm-active') );
}

export async function updateChatFriendsList(){
    $(".dropdown-chat-friends").html(`<h6 tabindex="-1" class="dropdown-header">Friends</h6><div tabindex="-1" class="dropdown-divider"></div>`);
    let currentUser = await getCurrentUser();
    let userFriends = await getFriendsList(currentUser.id);
    userFriends.forEach( friend => $(".dropdown-chat-friends").append(
        `<a href="#0" type="button" class="dropdown-item js-cd-panel-trigger btn-chat-friend" data-friendid="${friend.id}" data-panel="main">${friend.name}</a>`
    ));
    let chatFriendBtn = [...document.getElementsByClassName("btn-chat-friend")];
    chatFriendBtn.forEach( btn => btn.addEventListener( 'click', () => {
        const friendid = btn.getAttribute("data-friendid");
        openChatBox(friendid);
        // Hide the dropdown
        $('.dropdown-chat-friends').removeClass("show");
    }));
}



$('.close').click(function(){
    //$('#dropdownSearch').removeClass("show");
    document.getElementById("search-place").value = "";

});


function searchLieu( latitude,long) {
    let position = {lat: latitude, lng: long};
    map.panTo(position);
    $("#dropdownSearch").hide();
    document.getElementById("search-place").value = "";
    $(".search-wrapper").removeClass("active");
}

$('#search-place').on( "focusin", () => closeAllPanels() );

//SEARCH IN API Nominatim
$('.search-input').keydown(function (e){
    if(e.keyCode == 13){
        let query = document.getElementById("search-place").value;
        if (query != null){
            $("#dropdownSearch").html("");
            let URL = "https://nominatim.openstreetmap.org/search?city="+ query+"&format=json&limit=5";
            let cnt = 0;
            $.getJSON(URL, function(data) {
                for (let i = 0; i < data.length; i++) {
                    let span = document.createElement("span");
                    span.className= "dropdown-item";
                    span.onclick = ( ) => searchLieu(data[i].lat,data[i].lon);
                    span.innerText = data[i].display_name;
                    $("#dropdownSearch").append(span);
                    cnt = cnt +1;
                }
                if (cnt == 0){
                    let span = document.createElement("span");
                    span.className= "dropdown-item";
                    span.innerText = "No result ... :( ";
                    $("#dropdownSearch").append(span);
                }
                $("#dropdownSearch").show();
            });
        }
    }
});


