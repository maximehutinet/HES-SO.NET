
// return headers with jwt token

/**
 * get jwt headers for ajax GET request
 * @param contentType
 */
function getAccessHeaders(contentType) {
    return {"Content-Type": contentType,
            "Authorization": 'Bearer ' + localStorage.getItem("access_token")}
}

/**
 * get jwt annd csrf headers for ajax POST request
 * @param contentType 
 */
function getCsrfAccessHeaders(contentType) {
    let csrftoken = getCookie("csrftoken");
    return {"Content-Type": contentType,
            "Authorization": 'Bearer ' + localStorage.getItem("access_token"),
            "X-CSRFToken": csrftoken}
}

/**
 * get csrf from cookies (django documentation function) 
 * @param name 
 */
function getCookie(name) {
    var cookieValue = null;
    if (document.cookie && document.cookie != '') {
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var cookie = cookies[i].trim();
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) == (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}


/**
 * refresh access token
 */
function refreshToken() {
    let URL = '/refresh_token';
    $.ajax( {
        type: "POST",
        url: URL,
        data: {"refresh": localStorage.getItem("refresh_token")},
        headers: getCsrfAccessHeaders('application/x-www-form-urlencoded; charset=UTF-8'),
        success: (data) => {
            localStorage.setItem('access_token', data.access);
        },
        error: (res, status, err) => {
            if(res.status == 401)
                showAlert("You're not authenticated");
            else 
                alert( "Bad request !" );
        },
        fail: () => {
            alert( "Server unreachable !" );
        }
    });
}

// refresh token every 3 minutes
//setInterval(refreshToken, 3*60*1000);
