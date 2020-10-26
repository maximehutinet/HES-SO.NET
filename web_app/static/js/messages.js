function getHtmlContentCretateMessage( userGroups ) {

    let groups = `<option value="-1">No groups, create one.</option>"`;
    console.log( userGroups.length );
    if(userGroups.length > 0) {
        groups = `<option value="-1"> Select groups</option>`;
        userGroups.forEach( group => { 
            //groups += `<li class="list-group-item"> ${user.name} </li>`)
            groups += `<option value="${group.id}"> ${group.name} </option>`;
        });
    }

    return ` 
        <div class="main-card mb-3 card">
            <div class="card-header-tab card-header">
                <ul class="tabs-animated-shadow nav-justified tabs-animated nav">
                    <li class="nav-item">
                        <a role="tab" class="nav-link active show" id="tab-prf-view" data-toggle="tab" href="#tab-create-message" aria-selected="true">
                            <span class="nav-text">New Message</span>
                        </a>
                    </li>
                </ul>
            </div>
            <div class="card-body tab-content panel-content">
                <div class="tab-pane show active" id="tab-create-message" role="tabpanel">
                    <form id="create_message" method="post">
                        <div class="row">
                            <div class="col-lg-6">
                                <div id="message-group-list" class="form-group">
                                    <select id="group-listing" name="group-listing" class="form-control">${groups}</select>
                                </div>
                            </div>
                            <div class="col-lg-6">
                                <select id="message-visibility" name="visibility" class="form-control">
                                    <option value="3">Private</option>
                                    <option value="1">Public</option>
                                </select>
                            </div>
                            <div class="col-lg-6">
                                <div class="form-group">
                                    <div class="box">
                                    <label id="valueRadius" for="radius">5</label>
                                    </div>
                                    <span id="textSlider">Radius in KM</span>
                                    <input id="radius" name="radius" type="range" class="sliderRange form-control-range" value="5" min="5" max="50">
                                </div>
                            </div>
                            <div class="col-lg-6">
                                <div class="form-group">
                                    <div class="box">
                                    <label id="valueRadius" for="duration">1</label>
                                    </div>
                                    <span id="textSlider">Duration in hour</span>
                                    <input id="duration" name="duration" type="range" class="sliderRange form-control-range" value="1" min="1" max="24" step="1" >
                                </div>
                            </div>
                            <div class="col-lg-12" style="padding:20px;">
                                <textarea id="content" class="textarea form-control" name="content" rows="5" placeholder="Your message"></textarea>
                            </div>
                            <div class="col-lg-12">
                                <div class="form-group text-center">
                                    <button type="button" id="create-form-btn" class="btn btn-block btn-dark">Send</button>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `
}