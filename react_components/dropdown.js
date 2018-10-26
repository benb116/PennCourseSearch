'use strict';

class Dropdown extends React.Component {
    constructor(props) {
        super(props);
        this.state = {active: false, activity: props.def_active, label_text: props.def_text};
        this.activate_dropdown = this.activate_dropdown.bind(this);
        this.activate_item = this.activate_item.bind(this);
        this.close_dropdown = this.close_dropdown.bind(this);
        this.setWrapperRef = this.setWrapperRef.bind(this);
        this.handleClickOutside = this.handleClickOutside.bind(this);
        document.addEventListener("click", this.handleClickOutside);
    }

    setWrapperRef(node) {
        this.wrapperRef = node;
    }

    /**
     * Alert if clicked on outside of element
     */
    handleClickOutside(event) {
        if (this.wrapperRef && !this.wrapperRef.contains(event.target)) {
            this.close_dropdown();
        }
    }

    close_dropdown() {
        console.log("closing dropdown!");
        this.setState(state => ({active: false}));
    }

    activate_dropdown() {
        console.log("activating dropdown!");
        this.setState(state => ({active: true}));
    }

    activate_item(i) {
        this.setState(state => ({activity: i}));
        if(this.props.update_label){
            //updates the label for the dropdown if this property is applied in JSX
            this.setState(state=>({label_text: this.props.contents[i][0]}));
        }
        this.close_dropdown();
    }

    render() {
        const a_list = [];
        let self = this;
        for (let i = 0; i < this.props.contents.length; i++) {
            let addition = "";
            if (this.state.activity === i) {
                addition = " is-active";
            }
            const selected_contents = self.props.contents[i];
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
            <div ref={this.setWrapperRef} className={"dropdown" + addition}>
                <div className={"dropdown-trigger"} onClick={self.activate_dropdown}>
                    <button className={"button"} aria-haspopup={true} aria-controls={"dropdown-menu"}>
                        <span>
                            <span className={"selected_name"}>{this.state.label_text}</span>
                            <span className="icon is-small">
                                <i className="fas fa-angle-down" aria-hidden="true"/>
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


let domContainer = document.querySelector('#searchSelect');
ReactDOM.render(<Dropdown update_label def_active={0} def_text={"Search By"} contents={[["Course ID"], ["Keywords"],["Instructor"]]}/>, domContainer);