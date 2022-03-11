import * as fs from "fs";
class JSONDB {

}

enum Types {
    String = "string",
    Number = "number",
    Boolean = "boolean",
    Array = "array",
    Object = "object"
}

class Column {
    private _name: string;
    private _schema: Schema;
    private _suppressError: boolean;

    constructor(name: string, schema: Schema, options: { suppressError?: boolean } = {}) {
        this._name = name;
        this._schema = schema;
        this._suppressError = options.suppressError || true; //TODO actually use suppressError if its suppresed the default value is inserted
    }

    acceptable(value: any) {

    }


    get name(): string {
        return this._name;
    }

    get schema(): Schema {
        return this._schema;
    }

    get suppressError(): boolean {
        return this._suppressError;
    }
}

type Condition = (item: any) => boolean;
type MiddleWare = (...item:any) => any;

class Schema {
    private readonly type: Types;
    private required: boolean;
    private readonly conditions: Condition[];
    private substitute: any;
    private suppressError: boolean;

    /**
     *
     * @param type
     * @param options
     * @param {Function} conditions is an Array of Functions that return a boolean
     */
    constructor(type: Types, options: { substitute?: any, required?: boolean, suppressError?: boolean } = {}, ...conditions: Condition[]) {

        this.substitute = options.substitute || null;
        this.type = type;
        this.required = options.required || false;
        this.suppressError = options.suppressError || false;

        this.conditions = conditions;
        if (!this.acceptable(this.substitute) && this.substitute != null)
            throw new Error("Substitute Value isn't valid");
    }

    /**
     * Returns true if the value that was given follows the given conditions
     * @param value any can be anything
     */
    acceptable(value: any): boolean {
        let isArray = this.type === "array";

        if (!isArray) {
            // if the value is an Array it should not be recognized as an Object
            if (typeof value !== this.type || Array.isArray(value))
                return false;
        } else if (!Array.isArray(value))
            return false;


        try {
            for (let i = 0; i < this.conditions.length; i++) {
                if (!this.conditions[i](value))
                    return false;
            }
        } catch (err) {
            if (!this.suppressError)
                throw err;

            if (err instanceof Error) {
                // when it raises an error acceptable is false;
                console.warn(err.name + " in the Schema:" + err.message);
            }
            return false;
        }
        return true;
    }
}

class Table {
    private columns: Column[];
    private middleWare: MiddleWare[];
    private idColumn: Column;
    private id = 0;
    private suppressError: boolean;
    private autoSave: boolean;
    private name : string;

    private data : object [];

    constructor(name : string, columns: Column[], options: { suppressError?: boolean, autoSave?: boolean } = {}, ...middleWare: MiddleWare[]) {
        this.name = name;
        this.columns = columns;
        this.idColumn = new Column("idColumn", new Schema(Types.Number));
        this.middleWare = middleWare;
        this.suppressError = options.suppressError || false;
        this.autoSave = options.autoSave || true;
        this.data = [];
    }

    public loadFromJSON(file:string){
        fs.readFile(file, {encoding: "utf-8"}, (err, s)=>{
            if(err)
                console.log(err);

            console.log(s);

        })
    }

    applyMiddleWare(value: object, middleWares: MiddleWare[]): any {
        // With JSON.stringify and parse things like Functions, Undefined are being ignored;
        let jsonCopy = JSON.parse(JSON.stringify(value));
        let applied = {...jsonCopy};

        let returnOriginal = false;

        try {
            middleWares.forEach((middleWare) => {
                applied = middleWare(applied);
            });
        } catch (err) {
            if (!this.suppressError)
                throw err;

            if (err instanceof Error)
                console.warn(err.name + ": " + err.message);

            // if there is an Error and it's being suppressed return the original value;
            returnOriginal = true;
        }

        return returnOriginal ? jsonCopy : applied;
    }

    save(){
        let name = this.name;
        let json = JSON.stringify({name : this.data});
        fs.writeFile("Test.json", json, (err) => {
            if (err instanceof Error)
                console.warn("Saving not successful");
        })

    }

    insertOne(value: object, ...middleWare: MiddleWare[]): boolean {
        let combined = [...this.middleWare, ...middleWare];

        let applied = this.applyMiddleWare(value, combined);
        return this._insert(applied);
    }

    private _insert(obj: object): boolean {
      if (!this.rowIsValid(obj)){
          if (!this.suppressError)
              throw new Error("Insertion invalid");
          return false;
      }

      let copy = {id: this.id++, ...obj};

      this.data.push(copy);
      if(this.autoSave)
          this.save();
      return true;
    }

    rowIsValid(obj : object): boolean {
        let keys = Object.keys(obj);
        let values = Object.values(obj);
        for (const column of this.columns) {
            let key = keys.findIndex((elem) => elem === column.name);
            if (key === -1)
                return false;
            if (!column.schema.acceptable(values[key]))
              return false;
        }
        return true;
    }

    insertAll(value: object[], ...middleWare: MiddleWare[]) : boolean[] {
        return value.map((item) => {
            return this.insertOne(item, ...middleWare);
        });
    }

    insertArray() {
        //TODO
    }

    insertNestedArray() {
        //TODO

    }

    remove(id:number) {
        return this.data.splice(this.indexOf(id), 1);
    }

    get(id:number) {
        return this.find((elem:any) => elem["id"] === id);
    }

    indexOf(id:number){
        return this.data.findIndex((val:any) => val["id"] === id);
    }

    find(condition: Condition){
        return this.data.find(condition);
    }
}
/*
let a = new Schema(Types.Array, {required: true, suppressError: false}, (element) => {
    return element.includes("s");
}, element => element.includes("T"));

let table = new Table( "table", [new Column("tom", a), new Column("tim", a)], {suppressError:true}, (val)=>{
    return {tom: val.tom + "Tello", tim: val.tim + "Dork"};
});

table.insertOne({tom: "sr", tim: "Tiser"});
table.insertOne({tom: "Tesesdr", tim: "Tiweser"});
table.insertOne({tom: "Tefsdfser", tim: "Tsfdiser"});

console.log(table);

console.log(__dirname, __filename);
console.log(typeof 2);
console.log(typeof "dfs");
console.log(typeof true);
console.log(typeof 0.5);
console.log(typeof [2, 3, 4]);
console.log(typeof {"a": "b"});

 */

export default {
    Table,
    Schema,
    Types,
    Column
}

