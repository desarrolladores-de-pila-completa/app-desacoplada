"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Err = exports.Ok = void 0;
exports.ok = ok;
exports.err = err;
exports.isOk = isOk;
exports.isErr = isErr;
exports.unwrap = unwrap;
exports.unwrapErr = unwrapErr;
exports.map = map;
exports.mapErr = mapErr;
class Ok {
    value;
    success = true;
    error;
    constructor(value) {
        this.value = value;
    }
}
exports.Ok = Ok;
class Err {
    error;
    success = false;
    value;
    constructor(error) {
        this.error = error;
    }
}
exports.Err = Err;
/**
 * Crea un Result exitoso.
 */
function ok(value) {
    return new Ok(value);
}
/**
 * Crea un Result de error.
 */
function err(error) {
    return new Err(error);
}
/**
 * Verifica si es Ok.
 */
function isOk(result) {
    return result.success;
}
/**
 * Verifica si es Err.
 */
function isErr(result) {
    return !result.success;
}
/**
 * Obtiene el valor si es Ok.
 */
function unwrap(result) {
    if (isErr(result)) {
        throw new Error(`Called unwrap on Err: ${result.error}`);
    }
    return result.value;
}
/**
 * Obtiene el error si es Err.
 */
function unwrapErr(result) {
    if (isOk(result)) {
        throw new Error('Called unwrapErr on Ok');
    }
    return result.error;
}
/**
 * Transforma el valor si es Ok.
 */
function map(result, fn) {
    return isOk(result) ? ok(fn(result.value)) : err(result.error);
}
/**
 * Transforma el error si es Err.
 */
function mapErr(result, fn) {
    return isOk(result) ? ok(result.value) : err(fn(result.error));
}
//# sourceMappingURL=result.js.map