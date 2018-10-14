//file for managing color scheme

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