//file for managing color scheme

//possible color classes (corresponds with CSS classes)
const top_colors_recitation = ["red", "orange", "pink"];

const top_colors_other = ["blue", "aqua", "green", "sea", "indigo"];

//generates a color from a given day of the week, hour, and course name
const generate_color = function (day, hour, name) {
    let chosen_list = null;
    if (parseInt(name.substring(name.length - 3, name.length)) >= 100) {
        chosen_list = top_colors_recitation;
    } else {
        chosen_list = top_colors_other;
    }
    var index = (["M", "T", "W", "H", "F"].indexOf(day) + Math.round(hour*2)) % chosen_list.length;
    return chosen_list[index];
};