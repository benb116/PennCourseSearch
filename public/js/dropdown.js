'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var OutClickable = function (_React$Component) {
    _inherits(OutClickable, _React$Component);

    // a component that you can "click out" of
    //requires that ref={this.setWrapperRef} is added as an attribute
    function OutClickable(props) {
        _classCallCheck(this, OutClickable);

        var _this = _possibleConstructorReturn(this, (OutClickable.__proto__ || Object.getPrototypeOf(OutClickable)).call(this, props));

        _this.setWrapperRef = _this.setWrapperRef.bind(_this);
        _this.handleClickOutside = _this.handleClickOutside.bind(_this);
        document.addEventListener("click", _this.handleClickOutside);
        return _this;
    }

    /**
     * Alert if clicked on outside of element
     */


    _createClass(OutClickable, [{
        key: "handleClickOutside",
        value: function handleClickOutside(event) {
            if (this.wrapperRef && !this.wrapperRef.contains(event.target)) {
                this.close_dropdown();
            }
        }
    }, {
        key: "setWrapperRef",
        value: function setWrapperRef(node) {
            this.wrapperRef = node;
        }
    }]);

    return OutClickable;
}(React.Component);

var Dropdown = function (_OutClickable) {
    _inherits(Dropdown, _OutClickable);

    function Dropdown(props) {
        _classCallCheck(this, Dropdown);

        var _this2 = _possibleConstructorReturn(this, (Dropdown.__proto__ || Object.getPrototypeOf(Dropdown)).call(this, props));

        var starting_activity = -1;
        //if props.def_active is not defined, it is assumed that the dropdown does not control
        //state and instead initiates an action
        if (props.def_active !== undefined) {
            starting_activity = props.def_active;
        }
        _this2.state = { active: false, activity: starting_activity, label_text: props.def_text };
        _this2.activate_dropdown = _this2.activate_dropdown.bind(_this2);
        _this2.activate_item = _this2.activate_item.bind(_this2);
        _this2.close_dropdown = _this2.close_dropdown.bind(_this2);
        return _this2;
    }

    _createClass(Dropdown, [{
        key: "close_dropdown",
        value: function close_dropdown() {
            console.log("closing dropdown!");
            this.setState(function (state) {
                return { active: false };
            });
        }
    }, {
        key: "activate_dropdown",
        value: function activate_dropdown() {
            console.log("activating dropdown!");
            this.setState(function (state) {
                return { active: true };
            });
        }
    }, {
        key: "activate_item",
        value: function activate_item(i) {
            var _this3 = this;

            this.setState(function (state) {
                return { activity: i };
            });
            if (this.props.update_label) {
                //updates the label for the dropdown if this property is applied in JSX
                this.setState(function (state) {
                    return { label_text: _this3.props.contents[i][0] };
                });
            }
            this.close_dropdown();
            //if no default activity was selected, assumes that the item in the dropdown should not remain highlighted
            //This is because if props.def_active is not defined, it is assumed that the dropdown does not control
            //state and instead initiates an action
            if (this.props.def_active === undefined) {
                this.setState(function (state) {
                    return { activity: -1 };
                });
            }
        }
    }, {
        key: "render",
        value: function render() {
            var _this4 = this;

            var a_list = [];
            var self = this;

            var _loop = function _loop(i) {
                var addition = "";
                if (_this4.state.activity === i) {
                    addition = " is-active";
                }
                var selected_contents = _this4.props.contents[i];
                a_list.push(React.createElement(
                    "a",
                    { value: _this4.props.contents[i], onClick: function onClick() {
                            if (selected_contents.length > 1) {
                                //this means that a function for onclick is provided
                                selected_contents[1]();
                            }
                            self.activate_item(i);
                        }, className: "dropdown-item" + addition, key: i },
                    selected_contents[0]
                ));
            };

            for (var i = 0; i < this.props.contents.length; i++) {
                _loop(i);
            }
            var addition = "";
            if (this.state.active) {
                addition = " is-active";
            }
            return React.createElement(
                "div",
                { id: this.props.id, ref: this.setWrapperRef, className: "dropdown" + addition },
                React.createElement(
                    "div",
                    { className: "dropdown-trigger", onClick: self.activate_dropdown },
                    React.createElement(
                        "button",
                        { className: "button", "aria-haspopup": true, "aria-controls": "dropdown-menu" },
                        React.createElement(
                            "span",
                            null,
                            React.createElement(
                                "span",
                                { className: "selected_name" },
                                this.state.label_text
                            ),
                            React.createElement(
                                "span",
                                { className: "icon is-small" },
                                React.createElement("i", { className: "fa fa-angle-down", "aria-hidden": "true" })
                            )
                        )
                    )
                ),
                React.createElement(
                    "div",
                    { className: "dropdown-menu", role: "menu" },
                    React.createElement(
                        "div",
                        { className: "dropdown-content" },
                        a_list
                    )
                )
            );
        }
    }]);

    return Dropdown;
}(OutClickable);

//renders search type dropdown


var domContainer_search = document.querySelector('#searchSelectContainer');
var angular_update = function angular_update(searchType) {
    var appElement = document.body;
    var $scope = angular.element(appElement).scope();
    $scope.$apply(function () {
        $scope.searchType = searchType;
        $scope.searchChange();
        console.log("changed");
    });
};

//function that updates the angular function that listens for changes in search type
var search_contents_list = [["Course ID", function () {
    angular_update("courseIDSearch");
}], ["Keywords", function () {
    angular_update("keywordSearch");
}], ["Instructor", function () {
    angular_update("instSearch");
}]];
//list of options for the dropdown
ReactDOM.render(React.createElement(Dropdown, { id: "searchSelect", update_label: true, def_active: 0, def_text: "Search By", contents: search_contents_list }), domContainer_search);

//renders schedule options dropdown
console.log("rendering schedule options...");
var dom_container_schedule = document.querySelector("#scheduleOptionsContainer");
var new_schedule = function new_schedule() {
    angular.element(document.body).scope().sched.New();
};
var download_schedule = function download_schedule() {
    var $scope = angular.element(document.body).scope();
    $scope.$apply(function () {
        $scope.sched.Download();
        document.getElementById("schedule_modal").setAttribute("class", "modal is-active");
        console.log("download");
    });
    //window.location = "#SchedModal";
};

var duplicate_schedule = function duplicate_schedule() {
    angular.element(document.body).scope().sched.Duplicate();
};
var rename_schedule = function rename_schedule() {
    angular.element(document.body).scope().sched.Rename();
};
var clear_schedule = function clear_schedule() {
    angular.element(document.body).scope().sched.Clear();
};
var delete_schedule = function delete_schedule() {
    angular.element(document.body).scope().sched.Delete();
};
var schedule_contents_list = [["New", new_schedule], ["Download", download_schedule], ["Duplicate", duplicate_schedule], ["Rename", rename_schedule], ["Clear", clear_schedule], ["Delete", delete_schedule]];
ReactDOM.render(React.createElement(Dropdown, { id: "scheduleDropdown", def_text: "Schedule Options", contents: schedule_contents_list }), dom_container_schedule);
console.log("schedule options rendered");

var ToggleButton = function (_OutClickable2) {
    _inherits(ToggleButton, _OutClickable2);

    //not a dropdown itself, but interacts with adjacent elements via css
    function ToggleButton(props) {
        _classCallCheck(this, ToggleButton);

        var _this5 = _possibleConstructorReturn(this, (ToggleButton.__proto__ || Object.getPrototypeOf(ToggleButton)).call(this, props));

        _this5.props = props;
        _this5.containerHTML = props.parent.innerHTML;
        console.log(props.parent);
        _this5.state = { active: false };
        _this5.closeDropdown = _this5.closeDropdown.bind(_this5);
        _this5.activateDropdown = _this5.activateDropdown.bind(_this5);

        return _this5;
    }

    _createClass(ToggleButton, [{
        key: "activateDropdown",
        value: function activateDropdown() {
            this.setState(function (state) {
                return { active: true };
            });
        }
    }, {
        key: "closeDropdown",
        value: function closeDropdown() {
            this.setState(function (state) {
                return { active: false };
            });
        }
    }, {
        key: "render",
        value: function render() {
            return React.createElement(
                Button,
                { ref: this.setWrapperRef, className: "toggle_button " + this.state.active },
                this.props.name
            );
        }
    }]);

    return ToggleButton;
}(OutClickable);

//const filter_search_dom_container = document.getElementById("FilterSearchButton");

//ReactDOM.render(<ContentDropdown name = {"X"}/>,temp_dom_container);