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
var Product_1;
Object.defineProperty(exports, "__esModule", { value: true });
const staticImplements_1 = require("../util/staticImplements");
const database_1 = require("../controllers/database");
const user_1 = require("./user");
let Product = Product_1 = class Product {
    constructor(title, imageURL, description, price, id, createdByUser) {
        this.id = id !== undefined ? id : NaN;
        this.createdByUser = createdByUser !== undefined ? createdByUser : NaN;
        this.title = title;
        this.imageURL = imageURL;
        this.description = description;
        this.price = price;
    }
    static init(databaseController) {
        if (databaseController === undefined) {
            return undefined;
        }
        return database_1.DatabaseController.query(`CREATE TABLE IF NOT EXISTS ${Product_1.tableName}(
      id INT NOT NULL UNIQUE GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      price DOUBLE PRECISION NOT NULL,
      description TEXT NOT NULL,
      imageURL VARCHAR(255) NOT NULL,
      updatedAt TIMESTAMPTZ NOT NULL,
      createdAt TIMESTAMPTZ NOT NULL,
      createdByUser INT NOT NULL REFERENCES ${user_1.User.tableName}(id) ON DELETE CASCADE ON UPDATE CASCADE
    )`);
    }
    save() {
        return __awaiter(this, void 0, void 0, function* () {
            // Does the product exist in the app
            let result = !isNaN(this.id);
            // Even if so, does it for some reason not exist in the DB?
            // Maybe someone manually inserted a faulty ID into the URL
            if (result) {
                yield database_1.DatabaseController
                    .query(`SELECT EXISTS(select 1 from ${Product_1.tableName} where id=$1)`, [this.id])
                    .then(res => {
                    result = res.rows[0].exists;
                });
            }
            const now = new Date();
            if (!result) {
                return new Promise(res => {
                    database_1.DatabaseController.query(`INSERT INTO ${Product_1.tableName} (title, price, description, imageURL, updatedAt, createdAt, createdByUser) VALUES ($1, $2, $3, $4, $5, $5, $6) RETURNING *`, [
                        this.title,
                        this.price,
                        this.description,
                        this.imageURL,
                        now,
                        this.createdByUser
                    ]).then(result => {
                        this.id = result.rows[0].id;
                        res(result);
                    });
                });
            }
            else {
                return database_1.DatabaseController.query(`UPDATE ${Product_1.tableName} SET title=$1, price=$2, description=$3, imageURL=$4, updatedAt=$5 WHERE id=$6`, [this.title, this.price, this.description, this.imageURL, now, this.id]);
            }
        });
    }
    delete() {
        return database_1.DatabaseController.query(`DELETE FROM ${Product_1.tableName} WHERE id=$1`, [this.id]);
    }
    static fetchAll() {
        return new Promise(resolve => {
            database_1.DatabaseController.query(`SELECT * FROM ${Product_1.tableName}`)
                .then(result => {
                let products = [];
                for (const row of result.rows) {
                    products.push(this.createInstanceFromDB(row));
                }
                resolve(products);
            })
                .catch(err => console.log(err));
        });
    }
    static findByID(id) {
        return new Promise(resolve => {
            database_1.DatabaseController.query(`SELECT * FROM ${Product_1.tableName} WHERE id=$1`, [id])
                .then(result => {
                resolve(this.createInstanceFromDB(result.rows[0]));
            })
                .catch(err => console.log(err));
        });
    }
    static findByUser(user) {
        return new Promise(resolve => {
            database_1.DatabaseController.query(`SELECT * FROM ${Product_1.tableName} WHERE createdByUser=$1`, [
                user.id
            ])
                .then(result => {
                resolve(this.createInstanceFromDB(result.rows[0]));
            })
                .catch(err => console.log(err));
        });
    }
    static createInstanceFromDB(dbProduct) {
        if (dbProduct === undefined) {
            return undefined;
        }
        return new Product_1(dbProduct.title, dbProduct.imageurl, dbProduct.description, dbProduct.price, dbProduct.id, dbProduct.createdbyuser);
    }
};
Product.tableName = 'Products';
Product = Product_1 = __decorate([
    staticImplements_1.staticImplements()
], Product);
exports.Product = Product;
//# sourceMappingURL=product.js.map