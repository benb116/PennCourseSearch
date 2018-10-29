//adds outer click listener to all modals with ids
arr(document.getElementsByClassName("modal")).forEach(function(el){
    const id = el.getAttribute("id");
    if(id!== undefined && id.length > 0){
        add_outer_click_listener(["#"+id],function(){
            close_modal(id);
        }, true);
    }
});