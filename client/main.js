// Routing
Router.configure({
    layoutTemplate: "site_ace"
});

Router.route("/", function() {
    this.render("home", {
        to: "content"
    });
});

Router.route("/:_id", function() {
    this.render("website", {
        to: "content",
        data: function() {
            return Websites.findOne({_id: this.params._id});
        }
    });
});

// Accounts config
Accounts.ui.config({
    passwordSignupFields: "USERNAME_AND_EMAIL"
});

/////
// template helpers
/////

// helper function that returns all available websites
Template.website_list.helpers({
    websites:function(){
        return Websites.find({}, {sort: {upvotes: -1}});
    }
});

Template.website_item.helpers({
    format_date: function() {
        var website_id = this._id;
        date = Websites.findOne({_id: website_id}, {fields: {createdOn: 1}});
        return date.createdOn.toLocaleDateString() + " @ " + date.createdOn.toLocaleTimeString();
    }
});

Template.website_comments.helpers({
    comments_exist: function() {
        if (this.comments) {
            return true;
        } else {
            return false;
        }
    },

    comments: function() {
        return this.comments.reverse();
    },

    placeholder: function() {
        var comments = this.comments;
        if (comments) {
            return "Put here your comments";
        } else {
            return "Be the first one to comment!"
        }
    }
});

Template.website_comment_item.helpers({
    comment_author: function() {
        var user = Meteor.users.findOne({_id: this.author});
        return user.username;
    }
});

/////
// template events
/////
var website_events = {
    "click .js-upvote": function(event) {
        var website_id = this._id;
        Websites.update({_id: website_id}, {$inc: {upvotes: 1}});
        console.log("Up voting the "+ this.title + " website.");
        return false;// prevent the button from reloading the page
    },
    "click .js-downvote": function(event) {
        var website_id = this._id;
        Websites.update({_id: website_id}, {$inc: {downvotes: 1}});
        console.log("Down voting the "+ this.title + " website.");
        return false;// prevent the button from reloading the page
    }
};

Template.website_item.events(website_events);
Template.website.events(website_events);

Template.website_form.events({
    "click .js-toggle-website-form": function(event){
        $("#website_form").toggle('slow');
    },
    "submit .js-save-website-form": function(event){
        var url = event.target.url.value;

        Meteor.call("check_webpage", url, function(error, response) {
            if (error) {
                console.log(error);
            } else {
                page = "<div>" + response.content + "</div>";
                var title = $("title", page).text();
                var description = $("meta[name='description']", page).attr("content");
                console.log(title);
                console.log(description);

                if (Meteor.user()) {
                    Websites.insert({
                        url: url,
                        title: title,
                        description: description,
                        createdOn: new Date(),
                        upvotes: 0,
                        downvotes: 0,
                        comments: []
                    });
                    console.log("Added site with url " + url);
                } else {
                    alert("You must login to add a site!");
                }
            }
        });

        $("#website_form").delay(1000).toggle('slow');
        return false;// stop the form submit from reloading the page
    }
});

Template.website_comments.events({
    "submit .js-save-comment-form": function(event) {
        var website_id = this._id;
        var comment = event.target.comment.value;

        if (Meteor.user()) {
            Websites.update(
                {_id: website_id}, {
                    $push: {
                        comments: {
                            author: Meteor.user()._id,
                            content: comment,
                            date: new Date()
                        }
                    }
                }
            );
            console.log("Added comment to site " + this.title);
            $("#comment").val("");
        } else {
            alert("Can not comment as anonymous user");
        }

        return false;
    }
});