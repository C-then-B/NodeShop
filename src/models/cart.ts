import { staticImplements } from '../util/staticImplements';
import {
  IDatabaseModel,
  IDatabaseModelStatic
} from '../interfaces/IDatabaseModel';

import { DatabaseController as db } from '../controllers/database';
import { QueryResult } from 'pg';

import { Product } from './product';
import { CartProduct } from './cartProduct';
import { promises } from 'dns';
import { User } from './user';

//@staticImplements<IDatabaseModelStatic>()
class Cart implements IDatabaseModel {
  id: number = NaN;
  belongsToUser: number;
  cartProducts: CartProduct[] = [];

  static tableName = 'Carts';

  constructor(belongsToUser: number) {
    //this.id = id !== undefined ? id : NaN;
    this.belongsToUser = belongsToUser;
  }

  static async init(databaseController: db): Promise<QueryResult> {
    return db.query(
      `CREATE TABLE IF NOT EXISTS ${Cart.tableName}(
          id INT NOT NULL UNIQUE GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
          updatedAt TIMESTAMPTZ NOT NULL,
          createdAt TIMESTAMPTZ NOT NULL,
          belongsToUser INT NOT NULL REFERENCES ${User.tableName}(id) ON DELETE CASCADE ON UPDATE CASCADE
        )`
    );
  }

  async save(): Promise<QueryResult> {
    // Does the cart exist in the app
    let result = !isNaN(this.id);

    // Even if so, does it for some reason not exist in the DB?
    // Maybe someone manually inserted a faulty ID into the URL
    if (result) {
      await db
        .query(`SELECT EXISTS(select 1 from ${Cart.tableName} where id=$1)`, [
          this.id
        ])
        .then(res => {
          result = res.rows[0].exists;
        });
    }

    const now = new Date();
    if (!result) {
      return new Promise<QueryResult<any>>(res => {
        db.query(
          `INSERT INTO ${Cart.tableName} (updatedAt, createdAt, belongsToUser) VALUES ($1, $1, $2) RETURNING *`,
          [now, this.belongsToUser]
        ).then(result => {
          this.id = result.rows[0].id;
          res(result);
        });
      });
    } else {
      return db.query(`UPDATE ${Cart.tableName} SET updatedAt=$1 WHERE id=$2`, [
        now,
        this.id
      ]);
    }
  }

  delete(): Promise<QueryResult> {
    return db.query(`DELETE FROM ${Cart.tableName} WHERE id=$1`, [this.id]);
  }

  load(): Promise<void> {
    if (this.belongsToUser === NaN) {
      console.error("Can't load cart without passing user!");
      return Promise.resolve();
    }

    return new Promise<void>(resolve => {
      db.query(`SELECT * FROM ${Cart.tableName} WHERE belongsToUser=$1`, [
        this.belongsToUser
      ])
        .then(result => {
          // This user has no cart yet
          if (result.rowCount === 0) {
            return this.save(); // this assigns id
          } else {
            this.id = result.rows[0].id;
            // get all cartItems with this id, populate array

            CartProduct.fetchAllBelongingToCart(this.id).then(result => {
              this.cartProducts = result;

              resolve();
            });
          }
        })
        .catch(err => console.log(err));
    });
  }

  async addProduct(productID: number): Promise<void> {
    const cartProductIndex = this.cartProducts.findIndex(
      cartProduct => cartProduct.product.id === productID
    );
    let cartProduct = this.cartProducts[cartProductIndex];
    if (cartProduct) {
      cartProduct.quantity++;
    } else {
      cartProduct = new CartProduct(this.id, 1);
      await cartProduct.setup(productID);
      this.cartProducts.push(cartProduct);
    }

    await cartProduct.save();

    return new Promise<void>(async resolve => {
      await this.save();
      resolve();
    });
  }

  async deleteProduct(productID: number): Promise<void> {
    //if(productID !== Number)

    const cartProductIndex = this.cartProducts.findIndex(
      cartProduct => cartProduct.product.id === productID
    );
    let cartProduct = this.cartProducts[cartProductIndex];
    await cartProduct.delete();

    this.cartProducts.splice(cartProductIndex, 1);

    return new Promise<void>(async resolve => {
      await this.save();
      resolve();
    });
  }

  getTotalPrice(): Promise<number> {
    return new Promise<number>(resolve => {
      let totalPrice = 0;
      for (const cartProduct of this.cartProducts) {
        for (let i = 0; i < cartProduct.quantity; i++) {
          totalPrice += cartProduct.product.price;
        }
      }

      resolve(totalPrice);
    });
  }
}

export { Cart };
