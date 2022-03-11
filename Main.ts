import JSONDB from "./JSONDB";

let a = new JSONDB.Schema(JSONDB.Types.String, {required: true, suppressError: false}, (element) => {
    return element.includes("s");
}, element => element.includes("T"));

let table = new JSONDB.Table( "table", [new JSONDB.Column("tom", a), new JSONDB.Column("tim", a)], {suppressError:true}, (val)=>{
    return {tom: val.tom + "Tello", tim: val.tim + "Dork"};
});

table.loadFromJSON("Test.json");

/*
table.insertOne({tom: "sr", tim: "Tiser"});
table.insertOne({tom: "Tesesdr", tim: "Tiweser"});
table.insertOne({tom: "Tefsdfser", tim: "Tsfdiser"});


 */
//table.save();
