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
        //let text_node = parent_node.childNodes[0];
        //console.log(text_node);
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
    console.log("hiding display");
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
    console.log("showing display");
};


//toggles whether the filter search box is displayed or not
const toggle_filter_search_display = function(el){
    if(is_filter_search_displayed){
        hide_filter_search_display(el);
    }else{
        show_filter_search_display(el);
    }
};

$(document).click(function(event) {
    const toggler = document.getElementById("filter_search_toggler");
    if(!$(event.target).closest('#FilterSearch').length && !$(event.target).closest('#filter_search_toggler').length) {
        hide_filter_search_display(toggler);
    }
});

//closes the modal, given a close button
const close_modal = function(el){
    el.parentNode.setAttribute("class",el.parentNode.getAttribute("class").replace("is-active",""));
};