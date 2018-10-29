//file for managing color scheme and other aspects of UI

//possible color classes (corresponds with CSS classes)
var top_colors_recitation_save = ["red", "orange", "pink"];
var top_colors_other_save = ["blue", "aqua", "green", "sea", "indigo"];

//available color classes
var top_colors_recitation = [];
var top_colors_other = [];

//makes all recitation colors available
var reset_recitation_colors = function reset_recitation_colors() {
    top_colors_recitation = top_colors_recitation_save.slice();
};

//makes all other colors available
var reset_other_colors = function reset_other_colors() {
    top_colors_other = top_colors_other_save.slice();
};

//dictionary associating class name with color
var class_colors = {};

//makes all colors available
var reset_colors = function reset_colors() {
    reset_recitation_colors();
    reset_other_colors();
    class_colors = {};
};

//generates a color from a given day of the week, hour, and course name
var generate_color = function generate_color(day, hour, name) {
    var temp_color = class_colors[name];
    if (temp_color !== undefined) {
        return temp_color;
    } else {
        var chosen_list = null;
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
        var index = (["M", "T", "W", "H", "F"].indexOf(day) % 2 + Math.round(hour * 2)) % chosen_list.length;
        var _result = chosen_list[index];
        chosen_list.splice(index, 1);
        class_colors[name] = _result;
        return _result;
    }
};

//returns whether child is a child of parent
//credit to https://stackoverflow.com/questions/2234979/how-to-check-in-javascript-if-one-element-is-contained-within-another
var is_descendant = function is_descendant(parent, child) {
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
var deactivate_node = function deactivate_node(node) {
    var prev_class = node.getAttribute("class");
    node.setAttribute("class", prev_class.replace("is-active", "").replace("selected", ""));
};

//activates a bulma dropdown/dropdown item
var activate_node = function activate_node(node) {
    var prev_class = node.getAttribute("class");
    if (prev_class.indexOf("item") !== -1) {
        node.setAttribute("class", prev_class + " selected is-active");
    } else {
        node.setAttribute("class", prev_class + " is-active");
    }
};

//toggles activation of a bulma dropdown
var toggle_activation = function toggle_activation(dropdown) {
    var prev_class = dropdown.getAttribute("class");
    if (prev_class.indexOf("is-active") !== -1) {
        deactivate_node(dropdown);
    } else {
        activate_node(dropdown);
        window.addEventListener("click", function (e) {
            if (!(e.target == dropdown || is_descendant(dropdown, e.target))) {
                deactivate_node(dropdown);
            }
        });
    }
};

//returns the parent node dropdown of the given node
function find_parent_dropdown(node) {
    if (node.parentNode !== undefined && node.parentNode.getAttribute("class").indexOf("dropdown") !== -1) {
        return find_parent_dropdown(node.parentNode);
    } else {
        return node;
    }
}

//takes in an HTMLCollection and returns an array
function arr(elementsByClassName) {
    result = [];
    for (var i = 0; i < elementsByClassName.length; i++) {
        result[i] = elementsByClassName[i];
    }
    return result;
}

//activates bulma dropdown item
var activate_dropdown_item = function activate_dropdown_item(dropdown_item) {
    var prev_class = dropdown_item.getAttribute("class");
    if (prev_class.indexOf("is-active") === -1) {
        arr(document.getElementsByClassName("dropdown-item")).forEach(function (node) {
            if (node.getAttribute("class").indexOf("item") !== -1) {
                deactivate_node(node);
            }
        });
        activate_node(dropdown_item);
        var parent_node = find_parent_dropdown(dropdown_item);
        //let text_node = parent_node.childNodes[0];
        //console.log(text_node);
        var new_text = dropdown_item.textContent;
        parent_node.setAttribute("value", new_text.replace(" ", "").replace("\n", "").replace("\t", ""));
        angular.element(parent_node).scope().searchChange();
        parent_node.childNodes[1].childNodes[1].childNodes[1].childNodes[0].textContent = new_text;
    }
};