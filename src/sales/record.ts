import { isValid, parseISO } from "date-fns";
import { Transform, TransformCallback } from "stream";

class Record {
    private _username: string;
    private _age: number;
    private _height: number;
    private _gender: string;
    private _amount: number;
    private _lastPurchaseDate: Date;

    private _id?: string;
    private _createdAt?: Date;

    constructor(username: string, age: number, height: number, gender: string, amount: number, lastPurchaseDate: Date, id?: string, createdAt?: Date) {
        this._username = username;
        this._age = age;
        this._height = height;
        this._gender = gender;
        this._amount = amount;
        this._lastPurchaseDate = lastPurchaseDate;
        this._id = id;
        this._createdAt = createdAt;
    }

    public get username(): string {
        return this._username;
    }

    public get age(): number {
        return this._age;
    }

    public get height(): number {
        return this._height;
    }

    public get gender(): string {
        return this._gender;
    }

    public get amount(): number {
        return this._amount;
    }

    public get lastPurchaseDate(): Date {
        return this._lastPurchaseDate;
    }

    public get id(): string | undefined {
        return this._id;
    }

    public get createdAt(): Date | undefined {
        return this._createdAt;
    }
}

class RecordTransformer extends Transform {
    private _count = 0;

    constructor() {
        super({ objectMode: true });
    }

    _transform(chunk: object, enc: any, cb: TransformCallback) {
        let result = this.parse(chunk);
        if (result instanceof Error) {
            cb(new Error(`#${this._count}: ${result}`));
            return;
        }

        let record = result as Record;
        cb(null, record);
        this._count++;
    }

    parse(data: object): Record | Error {
        let username = '';
        let age = -1;
        let height = -1;
        let gender = '';
        let amount = -1;
        let lastPurchaseDate: Date | undefined = undefined;

        for (const [k, v] of Object.entries(data)) {
            switch (k.toUpperCase()) {
                case 'USER_NAME':
                    username = v.toString().trim();
                    break;
                case 'AGE':
                    let _age = this._parseInt(v);
                    if (Number.isNaN(_age)) {
                        return new Error(`expect "AGE" is "integer", actual "${typeof (v)}", value = "${v}"`);
                    }
                    age = Math.round(_age);
                    break;
                case 'HEIGHT':
                    let _height = this._parseInt(v);
                    if (Number.isNaN(_height)) {
                        return new Error(`expect "HEIGHT" is "integer", actual "${typeof (v)}", value = "${v}"`);
                    }
                    height = Math.round(_height);
                    break;
                case 'GENDER':
                    if (typeof (v) !== 'string') {
                        return new Error(`expect "GENDER" is "string", actual "${typeof (v)}"`);
                    }
                    gender = (v as string).trim().toLowerCase();
                    break;
                case 'SALE_AMOUNT':
                    let _amount = this._parseInt(v);
                    if (Number.isNaN(_amount)) {
                        return new Error(`expect "SALE_AMOUNT" is "integer", actual "${typeof (v)}", value = "${v}"`);
                    }
                    amount = Math.round(_amount);
                    break;
                case 'LAST_PURCHASE_DATE':
                    if (typeof (v) === 'string') {
                        lastPurchaseDate = parseISO(v);
                        if (!isValid(lastPurchaseDate)) {
                            return new Error(`expect "LAST_PURCHASE_DATE" is valid date string, actual = "${v}"`);
                        }
                    } else if (v instanceof Date) {
                        lastPurchaseDate = (v as Date);
                    } else {
                        return new Error(`expect "LAST_PURCHASE_DATE" is "string" or "date", actual "${typeof (v)}", value = "${v}"`);
                    }
                    break;
                default:
                    return new Error(`unknown field "${k}"`);
            }
        }

        if (username === '') {
            return new Error('"USER_NAME" must be non empty');
        }
        if (age <= 0) {
            return new Error('"AGE" must be > 0');
        }
        if (height <= 0) {
            return new Error('"HEIGHT" must be > 0');
        }
        if (gender !== 'm' && gender !== 'f') {
            return new Error('"GENDER" must be one of "M" or "F" case insensitive');
        }
        if (amount <= 0) {
            return new Error('"SALE_AMOUNT" must be > 0');
        }
        if (lastPurchaseDate === undefined) {
            return new Error('"LAST_PURCHASE_DATE" must be non null');
        }

        return new Record(username, age, height, gender, amount, lastPurchaseDate!);
    }

    _parseInt(v: any): number {
        if (typeof (v) === 'string') {
            let n = Number(v);
            if (Number.isNaN(n)) {
                return NaN;
            }
            if (!Number.isInteger(n)) {
                return NaN;
            }
            return Math.round(n);
        } else if (!Number.isInteger(v)) {
            return NaN;
        }
        return Math.round(v);
    }
}

class RecordArrayTransformer extends Transform {
    private _records: Record[] = [];
    private _batchSize = 0;

    constructor(batchSize: number = 20) {
        super({ objectMode: true });

        this._batchSize = Math.round(batchSize);
    }

    _transform(chunk: Record, enc: any, cb: TransformCallback) {
        this._records.push(chunk);
        this.doTransform(this._batchSize, cb);
    }

    _flush(cb: TransformCallback) {
        this.doTransform(0, cb);
    }

    doTransform(batchSize: number, cb: (error?: Error | null, data?: Record[] | undefined) => void) {
        if (this._records.length >= batchSize) {
            cb(null, this._records.splice(0, this._records.length));
        } else {
            cb();
        }
    }
}

export { Record, RecordTransformer, RecordArrayTransformer };

