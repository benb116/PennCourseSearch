// Functions to run on pageload
var currentTerm = "2016A";

function WriteLocal(key, value) {
    if (typeof value === 'string') {
        localStorage[key] = value;    
    } else {
        localStorage[key] = JSON.stringify(value);
    }
}

function ReadLocal (key) {
    return JSON.parse(localStorage[key]);
}

function Init() {
    localStorage.clear();
    if (!localStorage.stars) {
        WriteLocal("stars", ["CIS500001"]);
    }
    if (!localStorage.sched) {
        WriteLocal("sched",  {
            "Schedule": {
                "term": currentTerm,
                "colorPalette": ['#e74c3c', '#f1c40f', '#3498db', '#9b59b6', '#e67e22', '#2ecc71', '#95a5a6', '#FF73FD', '#73F1FF', '#CA75FF', '#1abc9c', '#F64747', '#ecf0f1'],
                "meetings": {
                    "CIS-500-001-TR12": {
                        "HourLength": 1.5,
                        "fullCourseName": "CIS  500 001",
                        "meetDay": "TR",
                        "meetHour": 12,
                        "meetRoom": " "
                    },
                    "LING-001-001-MW12": {
                        "HourLength": 1,
                        "fullCourseName": "LING 001 001",
                        "meetDay": "MW",
                        "meetHour": 12,
                        "meetRoom": " "
                    },
                    "LING-001-208-F12": {
                        "HourLength": 1,
                        "fullCourseName": "LING 001 208",
                        "meetDay": "F",
                        "meetHour": 12,
                        "meetRoom": " "
                    },
                    "MATH-503-001-MW135": {
                        "HourLength": 1.5,
                        "fullCourseName": "MATH 503 001",
                        "meetDay": "MW",
                        "meetHour": 13.5,
                        "meetRoom": " "
                    },
                    "MATH-503-101-T185": {
                        "HourLength": 2,
                        "fullCourseName": "MATH 503 101",
                        "meetDay": "T",
                        "meetHour": 18.5,
                        "meetRoom": " "
                    },
                    "NETS-412-001-TR15": {
                        "HourLength": 1.5,
                        "fullCourseName": "NETS 412 001",
                        "meetDay": "TR",
                        "meetHour": 15,
                        "meetRoom": " "
                    }
                }
            },
            "Schedule2": {
                "term": currentTerm,
                "colorPalette": ['#e74c3c', '#f1c40f', '#3498db', '#9b59b6', '#e67e22', '#2ecc71', '#95a5a6', '#FF73FD', '#73F1FF', '#CA75FF', '#1abc9c', '#F64747', '#ecf0f1'],
                "meetings": {
                    "NETS-412-001-TR15": {
                        "HourLength": 1.5,
                        "fullCourseName": "NETS 412 001",
                        "meetDay": "TR",
                        "meetHour": 15,
                        "meetRoom": " "
                    }
                }
            }
        });
    }
}