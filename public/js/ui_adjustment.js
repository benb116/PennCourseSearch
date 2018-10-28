//file for managing color scheme and other aspects of UI

//possible color classes (corresponds with CSS classes)
const top_colors_recitation_save = ["red", "orange", "pink"];
const top_colors_other_save = ["blue", "aqua", "green", "sea", "indigo"];

//available color classes
let top_colors_recitation = [];
let top_colors_other = [];

//makes all recitation colors available
const reset_recitation_colors = function(){
    top_colors_recitation = top_colors_recitation_save.slice();
};

//makes all other colors available
const reset_other_colors = function(){
    top_colors_other = top_colors_other_save.slice();
};

//dictionary associating class name with color
let class_colors = {};

//makes all colors available
const reset_colors = function (){
    reset_recitation_colors();
    reset_other_colors();
    class_colors = {};
};

//generates a color from a given day of the week, hour, and course name
const generate_color = function (day, hour, name) {
    var temp_color =  class_colors[name];
    if(temp_color !== undefined){
        return temp_color;
    }else {
        let chosen_list = null;
        if (parseInt(name.substring(name.length - 3, name.length)) >= 100) {
            chosen_list = top_colors_recitation;
            if (chosen_list.length === 0) {
                reset_recitation_colors();
                chosen_list = top_colors_recitation;
            }
        } else {
            chosen_list = top_colors_other;
            if (chosen_list.length === 0) {
                reset_other_colors();
                chosen_list = top_colors_other;
            }
        }
        const index = (["M", "T", "W", "H", "F"].indexOf(day) % 2 + Math.round(hour * 2)) % chosen_list.length;
        const result = chosen_list[index];
        chosen_list.splice(index, 1);
        class_colors[name] = result;
        return result;
    }
};

//returns whether child is a child of parent
//credit to https://stackoverflow.com/questions/2234979/how-to-check-in-javascript-if-one-element-is-contained-within-another
const is_descendant = function(parent, child) {
    var node = child.parentNode;
    while (node != null) {
        if (node == parent) {
            return true;
        }
        node = node.parentNode;
    }
    return false;
};

//deactivates a bulma dropdown/dropdown item
const deactivate_node = function(node){
    let prev_class = node.getAttribute("class");
    node.setAttribute("class",prev_class.replace("is-active","").replace("selected",""));
};

//activates a bulma dropdown/dropdown item
const activate_node = function(node){
    let prev_class = node.getAttribute("class");
    if(prev_class.indexOf("item")!==-1){
        node.setAttribute("class",prev_class + " selected is-active");
    }else{
        node.setAttribute("class",prev_class + " is-active");
    }

};

//toggles activation of a bulma dropdown
const toggle_activation = function(dropdown){
    let prev_class = dropdown.getAttribute("class");
    if(prev_class.indexOf("is-active")!==-1){
        deactivate_node(dropdown);
    }else{
        activate_node(dropdown);
        window.addEventListener("click",function(e) {
            if(!(e.target == dropdown || is_descendant(dropdown,e.target))){
                deactivate_node(dropdown);
            }
        });
    }
};

//returns the parent node dropdown of the given node
function find_parent_dropdown(node){
    if(node.parentNode !== undefined && node.parentNode.getAttribute("class").indexOf("dropdown")!==-1){
        return find_parent_dropdown(node.parentNode);
    }else{
        return node;
    }
}

//takes in an HTMLCollection and returns an array
function arr(elementsByClassName) {
    result = [];
    for(var i = 0;i<elementsByClassName.length; i++){
        result[i] = elementsByClassName[i];
    }
    return result;
}

//activates bulma dropdown item
const activate_dropdown_item = function(dropdown_item){
    let prev_class = dropdown_item.getAttribute("class");
    if(prev_class.indexOf("is-active")===-1){
        arr(document.getElementsByClassName("dropdown-item")).forEach(
          function(node){
              if(node.getAttribute("class").indexOf("item")!==-1){
                  deactivate_node(node);
              }
          }
        );
        activate_node(dropdown_item);
        let parent_node = find_parent_dropdown(dropdown_item);
        const new_text = dropdown_item.textContent;
        parent_node.setAttribute("value",new_text.replace(" ","").replace("\n","").replace("\t",""));
        angular.element(parent_node).scope().searchChange();
        parent_node.childNodes[1].childNodes[1].childNodes[1].childNodes[0].textContent = new_text;
    }
};

let is_filter_search_displayed = false;

const hide_filter_search_display = function(el){
    is_filter_search_displayed = false;
    const node = document.getElementById("FilterSearch");
    node.style.opacity = "0";
    window.setTimeout(function(){node.style.visibility = "hidden";},250);
    el.style.backgroundImage = "url(\"/css/filter_a.png\")";
};

const show_filter_search_display = function(el){
    is_filter_search_displayed = true;
    const node = document.getElementById("FilterSearch");
    const rect = el.getBoundingClientRect();
    node.style.left = (1.5 * rect.left - rect.right) + "px";
    node.style.top = (rect.bottom + 10) + "px";
    node.style.visibility = "visible";
    node.style.opacity = "1";
    el.style.backgroundImage = "url(\"/css/filter_b.png\")";
};


//toggles whether the filter search box is displayed or not
const toggle_filter_search_display = function(el){
    if(is_filter_search_displayed){
        hide_filter_search_display(el);
    }else{
        show_filter_search_display(el);
    }
};

//pass in the #ids of the nodes to ignore clicks in and the function to call if a click is outside of these nodes
const add_outer_click_listener = function(ignore_nodes, listener, modal_mode){
    $(document).click(function(event) {
        let check = false;
        console.log(ignore_nodes+","+ listener+","+ modal_mode);
        if(modal_mode &&
            (event.target.tagName.toLocaleLowerCase() === "a" ||
                event.target.tagName.toLocaleLowerCase() === "button")){
            console.log("blocked! "+event.target.tagName);
            check = true;
        }else{
            if(modal_mode && event.target.getAttribute("class") !== null &&
                event.target.getAttribute("class").indexOf("modal-background")!==-1){
                check = false;
            }else {
                ignore_nodes.forEach(function (id) {
                    if ($(event.target).closest(id).length) {
                        check = true;
                    }
                });
            }
        }

        if(!check) {
            listener();
        }
    });
};

//adds outer click listener to filter search
add_outer_click_listener(['#FilterSearch', '#filter_search_toggler'], function(){
    hide_filter_search_display(document.getElementById("filter_search_toggler"), false);
});

//closes the modal given an id
const close_modal = function(id){
    const el = document.getElementById(id);
    el.setAttribute("class", el.getAttribute("class").replace("is-active", ""));
};

//whether any modal is displayed
let modal_displayed = false;

//activates the modal passed in
const activate_modal = function(el){
    el.setAttribute("class",el.getAttribute("class")+" is-active");
    modal_displayed = true;
};

//changes schedule to given value
const change_schedule = function(schedNameNode){
    const schedName = schedNameNode.getAttribute("value");
    const appElement = document.body;
    const $scope = angular.element(appElement).scope();
    $scope.$apply(function(){
        $scope.currentSched = schedName;
        $scope.schedChange();
    });
};
