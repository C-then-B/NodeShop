"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var User_1;
Object.defineProperty(exports, "__esModule", { value: true });
const staticImplements_1 = require("../util/staticImplements");
const database_1 = require("../controllers/database");
const uuid_1 = require("uuid");
let User = User_1 = class User {
    constructor(name, email, hashedPassword, id, resetToken, resetTokenExpiryDate) {
        this.id = id !== undefined ? id : NaN;
        this.name = name;
        this.email = email;
        this.hashedPassword = hashedPassword;
        this.resetToken = resetToken;
        this.resetTokenExpiryDate = resetTokenExpiryDate;
    }
    static init(databaseController) {
        return __awaiter(this, void 0, void 0, function* () {
            return database_1.DatabaseController.query(`CREATE TABLE IF NOT EXISTS ${User_1.tableName}(
          id INT NOT NULL UNIQUE GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL,
          password VARCHAR(255) NOT NULL,
          resetToken VARCHAR(255),
          resetTokenExpiryDate TIMESTAMPTZ,
          updatedAt TIMESTAMPTZ NOT NULL,
          createdAt TIMESTAMPTZ NOT NULL
        )`);
        });
    }
    save() {
        return __awaiter(this, void 0, void 0, function* () {
            // Does the user exist in the app
            let result = !isNaN(this.id);
            // Even if so, does it for some reason not exist in the DB?
            // Maybe someone manually inserted a faulty ID into the URL
            if (result) {
                yield database_1.DatabaseController
                    .query(`SELECT EXISTS(select 1 from ${User_1.tableName} where id=$1)`, [
                    this.id
                ])
                    .then(res => {
                    result = res.rows[0].exists;
                });
            }
            const now = new Date();
            if (!result) {
                return new Promise(res => {
                    database_1.DatabaseController.query(`INSERT INTO ${User_1.tableName} (name, email, password, updatedAt, createdAt) VALUES ($1, $2, $3, $4, $4) RETURNING *`, [this.name, this.email, this.hashedPassword, now]).then(result => {
                        this.id = result.rows[0].id;
                        res(result);
                    });
                });
            }
            else {
                return database_1.DatabaseController.query(`UPDATE ${User_1.tableName} SET name=$1, email=$2, password=$3, resetToken=$4, resetTokenExpiryDate=$5, updatedAt=$6 WHERE id=$7`, [
                    this.name,
                    this.email,
                    this.hashedPassword,
                    this.resetToken,
                    this.resetTokenExpiryDate,
                    now,
                    this.id
                ]);
            }
        });
    }
    delete() {
        return database_1.DatabaseController.query(`DELETE FROM ${User_1.tableName} WHERE id=$1`, [this.id]);
    }
    static fetchAll() {
        return new Promise(resolve => {
            database_1.DatabaseController.query(`SELECT * FROM ${User_1.tableName}`)
                .then(result => {
                let users = [];
                for (const row of result.rows) {
                    users.push(this.createInstanceFromDB(row));
                }
                resolve(users);
            })
                .catch(err => console.log(err));
        });
    }
    static findByColumn(column, value) {
        return new Promise(resolve => {
            database_1.DatabaseController.query(`SELECT * FROM ${User_1.tableName} WHERE ${column}=$1`, [value])
                .then(result => {
                resolve(this.createInstanceFromDB(result.rows[0]));
            })
                .catch(err => console.log(err));
        });
    }
    // Convenience
    static findByEmail(email) {
        return this.findByColumn('email', email);
    }
    static createInstanceFromDB(dbProduct) {
        if (dbProduct === undefined) {
            return undefined;
        }
        return new User_1(dbProduct.name, dbProduct.email, dbProduct.password, dbProduct.id, dbProduct.resettoken, dbProduct.resettokenexpirydate);
    }
};
User.tableName = 'Users';
User.createGuest = () => {
    return new Promise(resolve => {
        const user = new User_1('Guest', uuid_1.v4(), uuid_1.v4());
        user.save().then(() => {
            resolve(user);
        });
    });
};
User = User_1 = __decorate([
    staticImplements_1.staticImplements()
], User);
exports.User = User;
//# sourceMappingURL=user.js.map