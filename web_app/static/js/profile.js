/* ---------------------------------
 * Profile
 ---------------------------------*/
$('#profile-update').submit(function(event){
    event.preventDefault();
    console.log("Update Profile is working!"); // sanity check
    let photo = $('#id_photo').val();
    let email =  $('#id_email').val();
    let bio = $('#id_bio').val();

    // Sanitizer fields
    if (photo === "") photo = undefined;
    if (email === "") email = undefined;
    if (bio === "") bio = undefined;
    //let form_data = $("#profile-update").serialize();
    var form_dom = $('#profile-update');
    let form_data = new FormData(form_dom.closest('form').get(0));
    // Start Ajax call
    $.ajax({
        url : "/user/update_profile/", // the endpoint
        //url : "/main", // the endpoint
        type : "POST", // http method
        headers: getCookie('application/x-www-form-urlencoded; charset=UTF-8'),
        enctype: 'multipart/form-data',
        data: form_data, // data sent with the post request
        processData: false,
        contentType: false,
        // handle a successful response
        params: {
                'csrf_token': getCookie('application/x-www-form-urlencoded; charset=UTF-8'),
                'csrf_name': 'csrfmiddlewaretoken',
                'csrf_xname': 'X-CSRFToken',
                },
        success : function(json) {
            if (json.success ){
                $('#id_photo').val(''); // remove the value from the input
                $('#id_email').val(''); // remove the value from the input
                $('#id_bio').val(''); // remove the value from the input
                if (email) {
                    $('#top-email').text(email);
                    $('#profile_view_email').text("Email: "+ email);
                }

                if (photo){
                    $('#profile_photo').attr('src', 'media/avatars/'+photo.replace(/C:\\fakepath\\/g, ""));
                    $('#profile_photo_top').attr('src', 'media/avatars/'+photo.replace(/C:\\fakepath\\/g, ""));
                }

                if (bio)
                    $('#profile_view_bio').text(bio);

                console.log(json); // log the returned json to the console
                console.log("success"); // another sanity check
                $('#results_update_profile').html(
                    "<div class=\"alert alert-success alert-dismissible fade show\" role=\"alert\">" +
                    "Success! Your profile has been updated."+
                    "  <button type=\"button\" class=\"close\" data-dismiss=\"alert\" aria-label=\"Close\">" +
                    "    <span aria-hidden=\"true\">&times;</span>" +
                    "  </button>" +
                    "</div>"
                ); // add the error to the dom
            }
        },

        // handle a non-successful response
        error : function(xhr,errmsg,err) {
            $('#results_update_profile').html(
            "<div class=\"alert alert-danger alert-dismissible fade show\" role=\"alert\">" +
            "Oops! We have encountered an error: "+errmsg+
            "  <button type=\"button\" class=\"close\" data-dismiss=\"alert\" aria-label=\"Close\">" +
            "    <span aria-hidden=\"true\">&times;</span>" +
            "  </button>" +
            "</div>"); // provide a bit more info about the error to the console
        }
    });
});

$('#change_password').submit(function(event){
    event.preventDefault();
    console.log("form submitted!");  // sanity check

    let old_password = $('#id_old_password').val();
    let new_password1 =  $('#id_new_password1').val();
    let new_password2 = $('#id_new_password2').val();

    // Sanitizer fields
    if (old_password === "") old_password = undefined;
    if (new_password1 === "") new_password1 = undefined;
    if (new_password2 === "") new_password2 = undefined;

    console.log(old_password, new_password1, new_password2);
    $.ajax({
        url : "/user/change_password/", // the endpoint
        type : "POST", // http method
        headers: getCsrfAccessHeaders('application/x-www-form-urlencoded; charset=UTF-8'),
        data : {
            old_password: old_password,
            new_password1: new_password1,
            new_password2: new_password2,
        }, // data sent with the post request

        // handle a successful response
        success : function(json) {
            $('#post-text').val(''); // remove the value from the input
            console.log(json); // log the returned json to the console
            console.log("success"); // another sanity check
            $('#results_update_password').html(
                "<div class=\"alert alert-success alert-dismissible fade show\" role=\"alert\">" +
                "Success! Your password has been updated."+
                "  <button type=\"button\" class=\"close\" data-dismiss=\"alert\" aria-label=\"Close\">" +
                "    <span aria-hidden=\"true\">&times;</span>" +
                "  </button>" +
                "</div>"); // add the error to the dom
        },

        // handle a non-successful response
        error : function(xhr,errmsg,err) {
            $('#results_update_password').html(
            "<div class=\"alert alert-danger alert-dismissible fade show\" role=\"alert\">" +
            "Oops! We have encountered an error: "+errmsg+
            "  <button type=\"button\" class=\"close\" data-dismiss=\"alert\" aria-label=\"Close\">" +
            "    <span aria-hidden=\"true\">&times;</span>" +
            "  </button>" +
            "</div>");
        }
    });
});