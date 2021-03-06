'use strict';

class OutClickable extends React.Component{
    // a component that you can "click out" of
    //requires that ref={this.setWrapperRef} is added as an attribute
    constructor(props){
        super(props);
        this.setWrapperRef = this.setWrapperRef.bind(this);
        this.handleClickOutside = this.handleClickOutside.bind(this);
        document.addEventListener("click", this.handleClickOutside);
    }

    /**
     * Alert if clicked on outside of element
     */
    handleClickOutside(event) {
        if (this.wrapperRef && !this.wrapperRef.contains(event.target)) {
            this.close_dropdown();
        }
    }

    setWrapperRef(node) {
        this.wrapperRef = node;
    }

}

class Dropdown extends OutClickable{
    constructor(props) {
        super(props);
        let starting_activity = -1;
        //if props.def_active is not defined, it is assumed that the dropdown does not control
        //state and instead initiates an action
        if(props.def_active !== undefined){
            starting_activity = props.def_active;
        }
        this.state = {active: false, activity: starting_activity, label_text: props.def_text};
        this.activate_dropdown = this.activate_dropdown.bind(this);
        this.activate_item = this.activate_item.bind(this);
        this.close_dropdown = this.close_dropdown.bind(this);
        this.toggle_dropdown = this.toggle_dropdown.bind(this);
    }

    close_dropdown() {
        this.setState(state => ({active: false}));
    }

    toggle_dropdown(){
        if(this.state.active){
            this.close_dropdown();
        }else{
            this.activate_dropdown();
        }
    }

    activate_dropdown() {
        this.setState(state => ({active: true}));
    }

    activate_item(i) {
        this.setState(state => ({activity: i}));
        if(this.props.update_label){
            //updates the label for the dropdown if this property is applied in JSX
            this.setState(state=>({label_text: this.props.contents[i][0]}));
        }
        this.close_dropdown();
        //if no default activity was selected, assumes that the item in the dropdown should not remain highlighted
        //This is because if props.def_active is not defined, it is assumed that the dropdown does not control
        //state and instead initiates an action
        if(this.props.def_active === undefined){
            this.setState(state => ({activity: -1}));
        }
    }

    render() {
        const a_list = [];
        let self = this;
        for (let i = 0; i < this.props.contents.length; i++) {
            let addition = "";
            if (this.state.activity === i) {
                addition = " is-active";
            }
            const selected_contents = this.props.contents[i];
            a_list.push(<a value={this.props.contents[i]} onClick={function () {
                if(selected_contents.length > 1){
                    //this means that a function for onclick is provided
                    selected_contents[1]();
                }
                self.activate_item(i)
            }} className={"dropdown-item" + addition} key={i}>{selected_contents[0]}</a>);
        }
        let addition = "";
        if (this.state.active) {
            addition = " is-active";
        }
        return (
            <div id = {this.props.id} ref={this.setWrapperRef} className={"dropdown" + addition}>
                <div className={"dropdown-trigger"} onClick={self.toggle_dropdown}>
                    <button className={"button"} aria-haspopup={true} aria-controls={"dropdown-menu"}>
                        <span>
                            <span className={"selected_name"}>{this.state.label_text}</span>
                            <span className="icon is-small">
                                <i className="fa fa-angle-down" aria-hidden="true"/>
                            </span>
                        </span>
                    </button>
                </div>
                <div className={"dropdown-menu"} role={"menu"}>
                    <div className={"dropdown-content"}>
                        {a_list}
                    </div>
                </div>
            </div>
        )
    }
}

//renders search type dropdown
const domContainer_search = document.querySelector('#searchSelectContainer');
const angular_update = function(searchType){
    var appElement = document.body;
    var $scope = angular.element(appElement).scope();
    $scope.$apply(function(){
        $scope.searchType = searchType;
        $scope.searchChange();
    });
};


//function that updates the angular function that listens for changes in search type
const search_contents_list = [["Course ID",function(){angular_update("courseIDSearch")}],
                              ["Keywords",function(){angular_update("keywordSearch")}],
                              ["Instructor",function(){angular_update("instSearch")}]];
//list of options for the dropdown
ReactDOM.render(<Dropdown id = {"searchSelect"} update_label def_active={0} def_text={"Search By"} contents={search_contents_list}/>, domContainer_search);

//renders schedule options dropdown
const dom_container_schedule = document.querySelector("#scheduleOptionsContainer");
const new_schedule = function(){angular.element(document.body).scope().sched.New()};
const download_schedule = function(){
    var $scope = angular.element(document.body).scope();
    $scope.$apply(function(){
        $scope.sched.Download();
        activate_modal(document.getElementById("schedule_modal"));
    });
    //window.location = "#SchedModal";
};

const duplicate_schedule = function(){angular.element(document.body).scope().sched.Duplicate()};
const rename_schedule = function(){angular.element(document.body).scope().sched.Rename()};
const clear_schedule = function(){angular.element(document.body).scope().sched.Clear()};
const delete_schedule = function(){angular.element(document.body).scope().sched.Delete()};
const schedule_contents_list = [["New",new_schedule],
                                ["Download",download_schedule],
                                ["Duplicate",duplicate_schedule],
                                ["Rename",rename_schedule],
                                ["Clear",clear_schedule],
                                ["Delete",delete_schedule]
                                ];
ReactDOM.render(<Dropdown id = {"scheduleDropdown"} def_text = {"Schedule Options"} contents = {schedule_contents_list}/>, dom_container_schedule);

class ToggleButton extends OutClickable{
    //not a dropdown itself, but interacts with adjacent elements via css
    constructor(props){
        super(props);
        this.props = props;
        this.containerHTML = props.parent.innerHTML;
        this.state = {active: false};
        this.closeDropdown = this.closeDropdown.bind(this);
        this.activateDropdown = this.activateDropdown.bind(this);

    }

    activateDropdown(){
        this.setState(state=>({active:true}));
    }

    closeDropdown(){
        this.setState(state=>({active:false}));
    }

    render(){
        return <Button ref={this.setWrapperRef} className={"toggle_button "+this.state.active}>{this.props.name}</Button>;
    }

}

//const filter_search_dom_container = document.getElementById("FilterSearchButton");

//ReactDOM.render(<ContentDropdown name = {"X"}/>,temp_dom_container);