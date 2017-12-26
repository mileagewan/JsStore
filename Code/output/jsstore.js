var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
/**
 * @license :JsStore.js - v1.3.3 - 15/12/2017
 * https://github.com/ujjwalguptaofficial/JsStore
 * Copyright (c) 2017 @Ujjwal Gupta; Licensed MIT
 */ 
var KeyStore;
(function (KeyStore) {
    var Utils = /** @class */ (function () {
        function Utils() {
        }
        /**
         * determine and set the DataBase Type
         *
         *
         * @memberOf UtilityLogic
         */
        Utils.setDbType = function () {
            self.indexedDB = self.indexedDB || self.mozIndexedDB || self.webkitIndexedDB || self.msIndexedDB;
            if (indexedDB) {
                self.IDBTransaction = self.IDBTransaction || self.webkitIDBTransaction || self.msIDBTransaction;
                self.IDBKeyRange = self.IDBKeyRange || self.webkitIDBKeyRange || self.msIDBKeyRange;
            }
            else if (!self.alert) {
                console.log('worked failed');
                self.postMessage('message:WorkerFailed');
            }
            else {
                JsStore.status = {
                    ConStatus: JsStore.ConnectionStatus.UnableToStart,
                    LastError: JsStore.ErrorType.IndexedDbUndefined
                };
            }
        };
        return Utils;
    }());
    KeyStore.Utils = Utils;
})(KeyStore || (KeyStore = {}));
var KeyStore;
(function (KeyStore) {
    var ConnectionStatus;
    (function (ConnectionStatus) {
        ConnectionStatus["Connected"] = "connected";
        ConnectionStatus["Closed"] = "closed";
        ConnectionStatus["NotStarted"] = "not_connected";
    })(ConnectionStatus = KeyStore.ConnectionStatus || (KeyStore.ConnectionStatus = {}));
    KeyStore.RequestQueue = [], KeyStore.TableName = "LocalStore", KeyStore.IsCodeExecuting = false;
})(KeyStore || (KeyStore = {}));
var KeyStore;
(function (KeyStore) {
    KeyStore.prcoessExecutionOfCode = function (request) {
        KeyStore.RequestQueue.push(request);
        if (KeyStore.RequestQueue.length == 1) {
            KeyStore.executeCode();
        }
    };
    KeyStore.executeCode = function () {
        if (!KeyStore.IsCodeExecuting && KeyStore.RequestQueue.length > 0) {
            KeyStore.IsCodeExecuting = true;
            var Request = {
                Name: KeyStore.RequestQueue[0].Name,
                Query: KeyStore.RequestQueue[0].Query
            };
            KeyStore.executeCodeDirect(Request);
        }
    };
    KeyStore.executeCodeDirect = function (request) {
        var That = this;
        new KeyStore.Business.Main(function (results) {
            That.processFinishedRequest(results);
        }).checkConnectionAndExecuteLogic(request);
    };
    KeyStore.processFinishedRequest = function (message) {
        var FinishedRequest = KeyStore.RequestQueue.shift();
        KeyStore.IsCodeExecuting = false;
        if (message.ErrorOccured) {
            if (FinishedRequest.OnError) {
                FinishedRequest.OnError(message.ErrorDetails);
            }
            else {
                console.log(message.ErrorDetails);
            }
        }
        else {
            if (FinishedRequest.OnSuccess) {
                if (message.ReturnedValue != null) {
                    FinishedRequest.OnSuccess(message.ReturnedValue);
                }
                else {
                    FinishedRequest.OnSuccess();
                }
            }
        }
        this.executeCode();
    };
})(KeyStore || (KeyStore = {}));
var KeyStore;
(function (KeyStore) {
    var Business;
    (function (Business) {
        var Base = /** @class */ (function () {
            function Base() {
                this.Results = null;
                this.ErrorOccured = false;
                this.ErrorCount = 0;
                this.onErrorOccured = function (e) {
                    ++this.ErrorCount;
                    if (this.ErrorCount == 1) {
                        if (this.OnError != null) {
                            this.OnError(e.target.error);
                        }
                    }
                    console.error(e);
                };
            }
            return Base;
        }());
        Business.Base = Base;
    })(Business = KeyStore.Business || (KeyStore.Business = {}));
})(KeyStore || (KeyStore = {}));
var KeyStore;
(function (KeyStore) {
    var Business;
    (function (Business) {
        var Get = /** @class */ (function (_super) {
            __extends(Get, _super);
            function Get(query, onSuccess, onError) {
                var _this = _super.call(this) || this;
                _this.get = function () {
                    var That = this, getData = function (column, value) {
                        var CursorOpenRequest = That.ObjectStore.index(column).openCursor(IDBKeyRange.only(value));
                        CursorOpenRequest.onerror = function (e) {
                            That.ErrorOccured = true;
                            That.onErrorOccured(e);
                        };
                        CursorOpenRequest.onsuccess = function (e) {
                            var Cursor = e.target.result;
                            if (Cursor) {
                                That.Results = Cursor.value['Value'];
                            }
                        };
                    };
                    for (var column in this.Query.Where) {
                        getData(column, this.Query.Where[column]);
                        break;
                    }
                };
                var That = _this;
                _this.Query = query;
                _this.OnError = onError;
                _this.Transaction = Business.DbConnection.transaction([query.From], "readonly");
                _this.ObjectStore = _this.Transaction.objectStore(query.From);
                _this.Transaction.oncomplete = function (e) {
                    if (onSuccess != null) {
                        onSuccess(That.Results);
                    }
                };
                _this.get();
                return _this;
            }
            return Get;
        }(Business.Base));
        Business.Get = Get;
    })(Business = KeyStore.Business || (KeyStore.Business = {}));
})(KeyStore || (KeyStore = {}));
var KeyStore;
(function (KeyStore) {
    var Business;
    (function (Business) {
        var Set = /** @class */ (function (_super) {
            __extends(Set, _super);
            function Set(query, onSuccess, onError) {
                var _this = _super.call(this) || this;
                _this.setData = function (value) {
                    var That = this, updateIfExistElseInsert = function () {
                        var CursorOpenRequest = That.ObjectStore.index('Key').openCursor(IDBKeyRange.only(value['Key']));
                        CursorOpenRequest.onsuccess = function (e) {
                            var Cursor = e.target.result;
                            if (Cursor) {
                                Cursor.value['Value'] = value['Value'];
                                Cursor.update(Cursor.value);
                            }
                            else {
                                insertData();
                            }
                        };
                        CursorOpenRequest.onerror = function (e) {
                            That.ErrorOccured = true;
                            That.onErrorOccured(e);
                        };
                    }, insertData = function () {
                        var AddResult = That.ObjectStore.add(value);
                        AddResult.onerror = function (e) {
                            That.ErrorOccured = true;
                            That.onErrorOccured(e);
                        };
                    };
                    updateIfExistElseInsert();
                };
                try {
                    var That = _this;
                    _this.OnError = onError;
                    _this.Transaction = Business.DbConnection.transaction([query.TableName], "readwrite");
                    _this.ObjectStore = _this.Transaction.objectStore(query.TableName);
                    _this.Transaction.oncomplete = function (e) {
                        if (onSuccess != null) {
                            onSuccess();
                        }
                    };
                    _this.setData(query.Set);
                }
                catch (ex) {
                    console.error(ex);
                }
                return _this;
            }
            return Set;
        }(Business.Base));
        Business.Set = Set;
    })(Business = KeyStore.Business || (KeyStore.Business = {}));
})(KeyStore || (KeyStore = {}));
var KeyStore;
(function (KeyStore) {
    var Business;
    (function (Business) {
        var Remove = /** @class */ (function (_super) {
            __extends(Remove, _super);
            function Remove(query, onSuccess, onError) {
                var _this = _super.call(this) || this;
                _this.RowAffected = 0;
                _this.remove = function () {
                    var That = this, removeData = function (column, value) {
                        var CursorOpenRequest = That.ObjectStore.index(column).openCursor(IDBKeyRange.only(value));
                        CursorOpenRequest.onerror = function (e) {
                            That.ErrorOccured = true;
                            That.onErrorOccured(e);
                        };
                        CursorOpenRequest.onsuccess = function (e) {
                            var Cursor = e.target.result;
                            if (Cursor) {
                                Cursor.delete();
                                ++That.RowAffected;
                                Cursor.continue();
                            }
                        };
                    };
                    for (var Column in this.Query.Where) {
                        if (!That.ErrorOccured) {
                            removeData(Column, That.Query.Where[Column]);
                        }
                        break;
                    }
                };
                var That = _this;
                _this.Query = query;
                _this.OnError = onError;
                _this.Transaction = Business.DbConnection.transaction([query.From], "readwrite");
                _this.ObjectStore = _this.Transaction.objectStore(query.From);
                _this.Transaction.oncomplete = function () {
                    if (onSuccess != null) {
                        onSuccess(That.RowAffected);
                    }
                };
                _this.Transaction.onerror = function (e) {
                    That.onErrorOccured(e);
                };
                _this.remove();
                return _this;
            }
            return Remove;
        }(Business.Base));
        Business.Remove = Remove;
    })(Business = KeyStore.Business || (KeyStore.Business = {}));
})(KeyStore || (KeyStore = {}));
var KeyStore;
(function (KeyStore) {
    var Business;
    (function (Business) {
        var InitDb = /** @class */ (function () {
            function InitDb(dbName, tableName, onSuccess, onError) {
                var That = this, DbRequest = self.indexedDB.open(dbName, 1);
                DbRequest.onerror = function (event) {
                    if (event.target.error.name == 'InvalidStateError') {
                        JsStore.status = {
                            ConStatus: JsStore.ConnectionStatus.UnableToStart,
                            LastError: JsStore.ErrorType.IndexedDbBlocked,
                        };
                    }
                    if (onError != null) {
                        onError(event.target.error);
                    }
                };
                DbRequest.onsuccess = function (event) {
                    Business.Status.ConStatus = KeyStore.ConnectionStatus.Connected;
                    Business.DbConnection = DbRequest.result;
                    Business.DbConnection.onclose = function () {
                        Business.Status.ConStatus = KeyStore.ConnectionStatus.Closed;
                        Business.Status.LastError = "Connection Closed";
                    };
                    Business.DbConnection.onversionchange = function (e) {
                        if (e.newVersion === null) {
                            e.target.close(); // Manually close our connection to the db
                        }
                    };
                    Business.DbConnection.onerror = function (e) {
                        Business.Status.LastError = "Error occured in connection :" + e.target.result;
                    };
                    Business.DbConnection.onabort = function (e) {
                        Business.Status.ConStatus = KeyStore.ConnectionStatus.Closed;
                        Business.Status.LastError = "Connection aborted";
                    };
                    if (onSuccess != null) {
                        onSuccess();
                    }
                };
                DbRequest.onupgradeneeded = function (event) {
                    var db = event.target.result, Column = "Key";
                    db.createObjectStore(tableName, {
                        keyPath: Column
                    }).createIndex(Column, Column, { unique: true });
                };
            }
            return InitDb;
        }());
        Business.InitDb = InitDb;
    })(Business = KeyStore.Business || (KeyStore.Business = {}));
})(KeyStore || (KeyStore = {}));
var KeyStore;
(function (KeyStore) {
    var Business;
    (function (Business) {
        Business.Status = {
            ConStatus: KeyStore.ConnectionStatus.NotStarted,
            LastError: ""
        };
        var Main = /** @class */ (function () {
            function Main(onSuccess) {
                if (onSuccess === void 0) { onSuccess = null; }
                this.checkConnectionAndExecuteLogic = function (request) {
                    if (request.Name == 'create_db' || request.Name == 'open_db') {
                        this.executeLogic(request);
                    }
                    else {
                        if (Business.Status.ConStatus == KeyStore.ConnectionStatus.Connected) {
                            this.executeLogic(request);
                        }
                        else if (Business.Status.ConStatus == KeyStore.ConnectionStatus.NotStarted) {
                            var That = this;
                            setTimeout(function () {
                                That.checkConnectionAndExecuteLogic(request);
                            }, 100);
                        }
                        else if (Business.Status.ConStatus == KeyStore.ConnectionStatus.Closed) {
                            var That = this;
                            this.createDb(KeyStore.TableName, function () {
                                That.checkConnectionAndExecuteLogic(request);
                            }, 100);
                        }
                    }
                };
                this.returnResult = function (result) {
                    if (this.OnSuccess) {
                        this.OnSuccess(result);
                    }
                };
                this.executeLogic = function (request) {
                    var That = this, OnSuccess = function (results) {
                        That.returnResult({
                            ReturnedValue: results
                        });
                    }, OnError = function (err) {
                        That.returnResult({
                            ErrorOccured: true,
                            ErrorDetails: err
                        });
                    };
                    switch (request.Name) {
                        case 'get':
                            this.get(request.Query, OnSuccess, OnError);
                            break;
                        case 'set':
                            this.set(request.Query, OnSuccess, OnError);
                            break;
                        case 'remove':
                            this.remove(request.Query, OnSuccess, OnError);
                            break;
                        case 'create_db':
                            this.createDb(request.Query, OnSuccess, OnError);
                            break;
                    }
                };
                this.set = function (query, onSuccess, onError) {
                    var ObjInsert = new Business.Set(query, onSuccess, onError);
                };
                this.remove = function (query, onSuccess, onError) {
                    var ObjDelete = new Business.Remove(query, onSuccess, onError);
                };
                this.get = function (query, onSuccess, onError) {
                    new Business.Get(query, onSuccess, onError);
                };
                this.createDb = function (tableName, onSuccess, onError) {
                    var DbName = "KeyStore";
                    new Business.InitDb(DbName, tableName, onSuccess, onError);
                };
                this.OnSuccess = onSuccess;
            }
            return Main;
        }());
        Business.Main = Main;
    })(Business = KeyStore.Business || (KeyStore.Business = {}));
})(KeyStore || (KeyStore = {}));
var KeyStore;
(function (KeyStore) {
    /**
     * Initialize KeyStore
     *
     */
    KeyStore.init = function () {
        KeyStore.Utils.setDbType();
        if (indexedDB) {
            KeyStore.prcoessExecutionOfCode({
                Name: 'create_db',
                Query: KeyStore.TableName
            });
        }
    };
    /**
    * return the value by key
    *
    * @param {string} key
    * @param {Function} onSuccess
    * @param {Function} [onError=null]
    */
    KeyStore.get = function (key, onSuccess, onError) {
        if (onError === void 0) { onError = null; }
        var Query = {
            From: this.TableName,
            Where: {
                Key: key
            }
        };
        KeyStore.prcoessExecutionOfCode({
            Name: 'get',
            Query: Query,
            OnSuccess: onSuccess,
            OnError: onError
        });
        return this;
    };
    /**
    * insert or update value
    *
    * @param {any} key
    * @param {any} value
    * @param {Function} [onSuccess=null]
    * @param {Function} [onError=null]
    */
    KeyStore.set = function (key, value, onSuccess, onError) {
        if (onSuccess === void 0) { onSuccess = null; }
        if (onError === void 0) { onError = null; }
        var Query = {
            TableName: this.TableName,
            Set: {
                Key: key,
                Value: value
            }
        };
        KeyStore.prcoessExecutionOfCode({
            Name: 'set',
            Query: Query,
            OnSuccess: onSuccess,
            OnError: onError
        });
        return this;
    };
    /**
    * delete value
    *
    * @param {string} key
    * @param {Function} [onSuccess=null]
    * @param {Function} [onError=null]
    */
    KeyStore.remove = function (key, onSuccess, onError) {
        if (onSuccess === void 0) { onSuccess = null; }
        if (onError === void 0) { onError = null; }
        var Query = {
            From: this.TableName,
            Where: {
                Key: key
            }
        };
        KeyStore.prcoessExecutionOfCode({
            Name: 'remove',
            Query: Query,
            OnSuccess: onSuccess,
            OnError: onError
        });
        return this;
    };
})(KeyStore || (KeyStore = {}));
var JsStore;
(function (JsStore) {
    var ErrorType;
    (function (ErrorType) {
        ErrorType["UndefinedColumn"] = "undefined_column";
        ErrorType["UndefinedValue"] = "undefined_value";
        ErrorType["UndefinedColumnName"] = "undefined_column_name";
        ErrorType["UndefinedColumnValue"] = "undefined_column_value";
        ErrorType["NotArray"] = "not_array";
        ErrorType["NoValueSupplied"] = "no_value_supplied";
        ErrorType["ColumnNotExist"] = "column_not_exist";
        ErrorType["InvalidOp"] = "invalid_operator";
        ErrorType["NullValue"] = "null_value";
        ErrorType["BadDataType"] = "bad_data_type";
        ErrorType["NextJoinNotExist"] = "next_join_not_exist";
        ErrorType["TableNotExist"] = "table_not_exist";
        ErrorType["DbNotExist"] = "db_not_exist";
        ErrorType["IndexedDbUndefined"] = "indexeddb_undefined";
        ErrorType["IndexedDbBlocked"] = "indexeddb_blocked";
    })(ErrorType = JsStore.ErrorType || (JsStore.ErrorType = {}));
    var Occurence;
    (function (Occurence) {
        Occurence["First"] = "f";
        Occurence["Last"] = "l";
        Occurence["Any"] = "a";
    })(Occurence = JsStore.Occurence || (JsStore.Occurence = {}));
    var WebWorkerStatus;
    (function (WebWorkerStatus) {
        WebWorkerStatus["Registered"] = "registerd";
        WebWorkerStatus["Failed"] = "failed";
        WebWorkerStatus["NotStarted"] = "not_started";
    })(WebWorkerStatus = JsStore.WebWorkerStatus || (JsStore.WebWorkerStatus = {}));
    var ConnectionStatus;
    (function (ConnectionStatus) {
        ConnectionStatus["Connected"] = "connected";
        ConnectionStatus["Closed"] = "closed";
        ConnectionStatus["NotStarted"] = "not_started";
        ConnectionStatus["UnableToStart"] = "unable_to_start";
    })(ConnectionStatus = JsStore.ConnectionStatus || (JsStore.ConnectionStatus = {}));
    var WhereQryOption;
    (function (WhereQryOption) {
        WhereQryOption["In"] = "In";
        WhereQryOption["Like"] = "Like";
        WhereQryOption["Or"] = "Or";
    })(WhereQryOption = JsStore.WhereQryOption || (JsStore.WhereQryOption = {}));
    var DataType;
    (function (DataType) {
        DataType["String"] = "string";
        DataType["Object"] = "object";
        DataType["Array"] = "array";
    })(DataType = JsStore.DataType || (JsStore.DataType = {}));
})(JsStore || (JsStore = {}));
var JsStore;
(function (JsStore) {
    JsStore.enable_log = false, JsStore.db_version = 0, JsStore.status = {
        ConStatus: JsStore.ConnectionStatus.NotStarted,
        LastError: ""
    }, JsStore.temp_results = [];
    JsStore.throwError = function (error) {
        throw error;
    };
    JsStore.getObjectFirstKey = function (value) {
        for (var key in value) {
            return key;
        }
        return null;
    };
    JsStore.log = function (msg) {
        if (JsStore.enable_log) {
            console.log(msg);
        }
    };
    JsStore.logError = function (msg) {
        if (JsStore.enable_log) {
            console.error(msg);
        }
    };
})(JsStore || (JsStore = {}));
var JsStore;
(function (JsStore) {
    var Utils = /** @class */ (function () {
        function Utils() {
        }
        Utils.getError = function (errorType, errorDetail) {
            var error = {
                Name: errorType,
                Message: ''
            };
            switch (errorType) {
                case JsStore.ErrorType.NotArray:
                    error.Message = "Supplied value is not an array";
                    break;
                case JsStore.ErrorType.UndefinedColumn:
                    error.Message = "Column is undefined in Where";
                    break;
                case JsStore.ErrorType.UndefinedValue:
                    error.Message = "Value is undefined in Where";
                    break;
                case JsStore.ErrorType.UndefinedColumnName:
                    error.Message = "Column name is undefined";
                    break;
                case JsStore.ErrorType.UndefinedColumnValue:
                    error.Message = "Column value is undefined";
                    break;
                case JsStore.ErrorType.NoValueSupplied:
                    error.Message = "No value supplied";
                    break;
                case JsStore.ErrorType.InvalidOp:
                    error.Message = "Invalid Op Value '" + errorDetail['Op'] + "'";
                    break;
                case JsStore.ErrorType.ColumnNotExist:
                    error.Message = "Column '" + errorDetail['ColumnName'] + "' does not exist";
                    break;
                case JsStore.ErrorType.NullValue:
                    error.Message = "Null value is not allowed for column '" + errorDetail['ColumnName'] + "'";
                    break;
                case JsStore.ErrorType.BadDataType:
                    error.Message = "Supplied value for column '" + errorDetail['ColumnName'] +
                        "' does not have valid type";
                    break;
                case JsStore.ErrorType.NextJoinNotExist:
                    error.Message = "Next join details not supplied";
                    break;
                case JsStore.ErrorType.TableNotExist:
                    error.Message = "Table '" + errorDetail['TableName'] + "' does not exist";
                    break;
                case JsStore.ErrorType.DbNotExist:
                    error.Message = "Database '" + errorDetail['DbName'] + "' does not exist";
                    break;
                default: console.error('the error type is not defined');
            }
            return error;
        };
        Utils.convertObjectintoLowerCase = function (obj) {
            var keys = Object.keys(obj);
            var n = keys.length;
            while (n--) {
                var key = keys[n];
                obj[key.toLowerCase()] = obj[key];
                delete obj[key];
            }
        };
        /**
         * determine and set the DataBase Type
         *
         *
         * @memberOf MainLogic
         */
        Utils.setDbType = function () {
            self.indexedDB = self.indexedDB || self.mozIndexedDB ||
                self.webkitIndexedDB || self.msIndexedDB;
            if (indexedDB) {
                self.IDBTransaction = self.IDBTransaction || self.webkitIDBTransaction ||
                    self.msIDBTransaction;
                self.IDBKeyRange = self.IDBKeyRange || self.webkitIDBKeyRange ||
                    self.msIDBKeyRange;
            }
            else {
                JsStore.throwError('Your browser doesnot support IndexedDb');
            }
        };
        return Utils;
    }());
    JsStore.Utils = Utils;
})(JsStore || (JsStore = {}));
var JsStore;
(function (JsStore) {
    /**
     * checks whether db exist or not
     *
     * @param {DbInfo} dbInfo
     * @param {() => void} [callback=null]
     * @param {() => void} [errCallBack=null]
     * @returns
     */
    JsStore.isDbExist = function (dbInfo, callback, errCallBack) {
        if (callback === void 0) { callback = null; }
        if (errCallBack === void 0) { errCallBack = null; }
        var use_promise = callback ? false : true;
        if (JsStore.status.ConStatus !== JsStore.ConnectionStatus.UnableToStart) {
            if (use_promise) {
                return new Promise(function (resolve, reject) {
                    if (typeof dbInfo === 'string') {
                        JsStore.getDbVersion(dbInfo, function (dbVersion) {
                            resolve(Boolean(dbVersion));
                        });
                    }
                    else {
                        JsStore.getDbVersion(dbInfo.DbName, function (dbVersion) {
                            resolve(dbInfo.Table.Version <= dbVersion);
                        });
                    }
                });
            }
            else {
                if (typeof dbInfo === 'string') {
                    JsStore.getDbVersion.call(this, dbInfo, function (dbVersion) {
                        callback.call(this, Boolean(dbVersion));
                    });
                }
                else {
                    JsStore.getDbVersion.call(this, dbInfo.DbName, function (dbVersion) {
                        callback.call(this, dbInfo.Table.Version <= dbVersion);
                    });
                }
            }
        }
        else {
            var error = {
                Name: JsStore.status.LastError,
                Message: ''
            };
            switch (error.Name) {
                case JsStore.ErrorType.IndexedDbBlocked:
                    error.Message = "IndexedDB is blocked";
                    break;
                case JsStore.ErrorType.IndexedDbUndefined:
                    error.Message = "IndexedDB is not supported";
                    break;
            }
            if (use_promise) {
                return new Promise(function (resolve, reject) {
                    reject(error);
                });
            }
            else if (errCallBack) {
                errCallBack(error);
            }
        }
    };
    /**
     * get Db Version
     *
     * @param {string} dbName
     * @param {(version: number) => void} callback
     */
    JsStore.getDbVersion = function (dbName, callback) {
        KeyStore.get("JsStore_" + dbName + '_Db_Version', function (dbVersion) {
            callback.call(this, Number(dbVersion));
        }.bind(this));
    };
    /**
     * get Database Schema
     *
     * @param {string} dbName
     * @param {(any) => void} callback
     */
    JsStore.getDbSchema = function (dbName, callback) {
        if (callback) {
            KeyStore.get("JsStore_" + dbName + "_Schema", function (result) {
                if (result._name) {
                    callback(result);
                }
                else {
                    var db_schema = new JsStore.Model.DataBase(result);
                    KeyStore.set("JsStore_" + dbName + "_Schema", db_schema);
                    callback(db_schema);
                }
            });
        }
    };
    /**
     * check for null value
     *
     * @param {any} value
     * @returns
     */
    JsStore.isNull = function (value) {
        if (value == null) {
            return true;
        }
        else {
            switch (typeof value) {
                case 'string': return value.length === 0;
                case 'number': return isNaN(value);
            }
        }
        return false;
    };
    /**
     * Enable log
     *
     */
    JsStore.enableLog = function () {
        JsStore.enable_log = true;
        if (JsStore.worker_instance) {
            JsStore.worker_instance.postMessage({
                Name: 'change_log_status',
                Query: {
                    logging: JsStore.enable_log
                }
            });
        }
    };
    /**
     * disable log
     *
     */
    JsStore.disableLog = function () {
        JsStore.enable_log = false;
        if (JsStore.worker_instance) {
            JsStore.worker_instance.postMessage({
                Name: 'change_log_status',
                Query: {
                    logging: JsStore.enable_log
                }
            });
        }
    };
})(JsStore || (JsStore = {}));
// namespace JsStore {
//     export enum Errors {
//         JsStoreUndefined = "Jstore_undefined",
//         UndefinedCon = "undefined_connection",
//         Undefined = "undefined"
//     }
//     export interface IError {
//         _type: Errors;
//         _message: string;
//     }
//     export class Error implements IError {
//         _type: Errors;
//         _message: string;
//         _info: any;
//         constructor(type: Errors, info: any = null) {
//             this._type = type;
//             this._info = info;
//         }
//         public throw = function () {
//             throw this.get();
//         };
//         print = function (isWarn: boolean = false) {
//             var error_obj = this.get();
//             if (isWarn) {
//                 console.warn(error_obj);
//             }
//             else {
//                 console.error(error_obj);
//             }
//         };
//         private get = function () {
//             var error_obj = {
//                 _type: this._type,
//             } as IError;
//             switch (this._type) {
//                 case Errors.UndefinedCon:
//                     error_obj._message = "jsstore connection is not defined";
//                     break;
//                 case Errors.JsStoreUndefined:
//                     error_obj._message = "jsstore is not defined";
//                     break;
//                 default:
//                     error_obj._message = this._message;
//                     break;
//             }
//             return error_obj;
//         };
//     }
// } 
var JsStore;
(function (JsStore) {
    var Model;
    (function (Model) {
        var Column = /** @class */ (function () {
            function Column(key, tableName) {
                if (key.Name != null) {
                    this._name = key.Name;
                }
                else {
                    JsStore.throwError("Column Name is not defined for table:" + tableName);
                }
                this._autoIncrement = key.AutoIncrement != null ? key.AutoIncrement : false;
                this._primaryKey = key.PrimaryKey != null ? key.PrimaryKey : false;
                this._unique = key.Unique != null ? key.Unique : false;
                this._notNull = key.NotNull != null ? key.NotNull : false;
                this._dataType = key.DataType != null ? key.DataType : (key.AutoIncrement ? 'number' : null);
                this._default = key.Default;
                this._multiEntry = key.MultiEntry == null ? false : true;
            }
            return Column;
        }());
        Model.Column = Column;
    })(Model = JsStore.Model || (JsStore.Model = {}));
})(JsStore || (JsStore = {}));
var JsStore;
(function (JsStore) {
    var Model;
    (function (Model) {
        var Table = /** @class */ (function () {
            function Table(table, dbName) {
                this._columns = [];
                // internal Members
                this._requireDelete = false;
                this._requireCreation = false;
                this._primaryKey = "";
                this._name = table.Name;
                this._version = table.Version == null ? 1 : table.Version;
                table.Columns.forEach(function (item) {
                    this._columns.push(new Model.Column(item, table.Name));
                }, this);
                this.setRequireDelete(dbName);
                this.setDbVersion(dbName);
                this.setPrimaryKey(dbName);
            }
            Table.prototype.setPrimaryKey = function (dbName) {
                this._columns.every(function (item) {
                    this._primaryKey = item._primaryKey ? item._name : "";
                    return !item._primaryKey;
                }, this);
            };
            Table.prototype.setRequireDelete = function (dbName) {
                KeyStore.get("JsStore_" + dbName + "_" + this._name + "_Version", function (tableVersion) {
                    if (tableVersion == null) {
                        this._requireCreation = true;
                    }
                    else if (tableVersion < this._version) {
                        this._requireDelete = true;
                    }
                }.bind(this));
            };
            Table.prototype.setDbVersion = function (dbName) {
                JsStore.db_version = JsStore.db_version > this._version ? JsStore.db_version : this._version;
                // setting db version
                KeyStore.set('JsStore_' + dbName + '_Db_Version', JsStore.db_version)
                    .set("JsStore_" + dbName + "_" + this._name + "_Version", JsStore.db_version);
                this._version = JsStore.db_version;
            };
            return Table;
        }());
        Model.Table = Table;
    })(Model = JsStore.Model || (JsStore.Model = {}));
})(JsStore || (JsStore = {}));
var JsStore;
(function (JsStore) {
    var Model;
    (function (Model) {
        var DataBase = /** @class */ (function () {
            function DataBase(dataBase) {
                this._tables = [];
                this._name = dataBase.Name;
                dataBase.Tables.forEach(function (item) {
                    this._tables.push(new Model.Table(item, this._name));
                }, this);
            }
            return DataBase;
        }());
        Model.DataBase = DataBase;
    })(Model = JsStore.Model || (JsStore.Model = {}));
})(JsStore || (JsStore = {}));
var JsStore;
(function (JsStore) {
    var Business;
    (function (Business) {
        var BaseHelper = /** @class */ (function () {
            function BaseHelper() {
                this.getTable = function (tableName) {
                    var current_table;
                    Business.active_db._tables.every(function (table) {
                        if (table._name === tableName) {
                            current_table = table;
                            return false;
                        }
                        return true;
                    });
                    return current_table;
                };
                this.getKeyRange = function (value, op) {
                    var key_range;
                    switch (op) {
                        case '-':
                            key_range = IDBKeyRange.bound(value.Low, value.High, false, false);
                            break;
                        case '>':
                            key_range = IDBKeyRange.lowerBound(value, true);
                            break;
                        case '>=':
                            key_range = IDBKeyRange.lowerBound(value);
                            break;
                        case '<':
                            key_range = IDBKeyRange.upperBound(value, true);
                            break;
                        case '<=':
                            key_range = IDBKeyRange.upperBound(value);
                            break;
                        default:
                            key_range = IDBKeyRange.only(value);
                            break;
                    }
                    return key_range;
                };
                this.getObjectSecondKey = function (value) {
                    var is_second = false;
                    for (var key in value) {
                        if (is_second) {
                            return key;
                        }
                        else {
                            is_second = true;
                        }
                    }
                };
                this.getPrimaryKey = function (tableName) {
                    var primary_key = this.getTable(tableName)._primaryKey;
                    return primary_key ? primary_key : this.getKeyPath(tableName);
                };
                this.getKeyPath = function (tableName) {
                    var transaction = Business.db_connection.transaction([tableName], "readonly"), object_store = transaction.objectStore(tableName);
                    return object_store.keyPath;
                };
                this.sortNumberInAsc = function (values) {
                    values.sort(function (a, b) {
                        return a - b;
                    });
                    return values;
                };
                this.sortNumberInDesc = function (values) {
                    values.sort(function (a, b) {
                        return b - a;
                    });
                    return values;
                };
                this.sortAlphabetInAsc = function (values) {
                    values.sort(function (a, b) {
                        return a.toLowerCase().localeCompare(b.toLowerCase());
                    });
                    return values;
                };
                this.sortAlphabetInDesc = function (values) {
                    values.sort(function (a, b) {
                        return b.toLowerCase().localeCompare(a.toLowerCase());
                    });
                    return values;
                };
            }
            BaseHelper.prototype.getAllCombinationOfWord = function (word, isArray) {
                if (isArray) {
                    var results = [];
                    for (var i = 0, length = word.length; i < length; i++) {
                        results = results.concat(this.getCombination(word[i]));
                    }
                    return results;
                }
                else {
                    return this.getCombination(word);
                }
            };
            BaseHelper.prototype.getCombination = function (word) {
                var results = [], doAndPushCombination = function (subWord, chars, index) {
                    if (index === subWord.length) {
                        results.push(chars.join(""));
                    }
                    else {
                        var ch = subWord.charAt(index);
                        chars[index] = ch.toLowerCase();
                        doAndPushCombination(subWord, chars, index + 1);
                        chars[index] = ch.toUpperCase();
                        doAndPushCombination(subWord, chars, index + 1);
                    }
                };
                doAndPushCombination(word, [], 0);
                return results;
            };
            return BaseHelper;
        }());
        Business.BaseHelper = BaseHelper;
    })(Business = JsStore.Business || (JsStore.Business = {}));
})(JsStore || (JsStore = {}));
var JsStore;
(function (JsStore) {
    var Business;
    (function (Business) {
        var Base = /** @class */ (function (_super) {
            __extends(Base, _super);
            function Base() {
                var _this = _super !== null && _super.apply(this, arguments) || this;
                _this._errorOccured = false;
                _this._errorCount = 0;
                _this._rowAffected = 0;
                _this._sendResultFlag = true;
                _this.onErrorOccured = function (e, customError) {
                    if (customError === void 0) { customError = false; }
                    ++this._errorCount;
                    if (this._errorCount === 1) {
                        if (this.OnError != null) {
                            if (!customError) {
                                var error = {
                                    Message: e.target.error.message,
                                    Name: e.target.error.name
                                };
                                this.OnError(error);
                            }
                            else {
                                this.OnError(e);
                            }
                            JsStore.logError(Error);
                        }
                    }
                };
                _this.onTransactionTimeout = function (e) {
                    console.log('transaction timed out');
                };
                _this.onExceptionOccured = function (ex, info) {
                    switch (ex.name) {
                        case 'NotFoundError':
                            var error = JsStore.Utils.getError(JsStore.ErrorType.TableNotExist, info);
                            JsStore.throwError(error);
                        default: console.error(ex);
                    }
                };
                _this.goToWhereLogic = function () {
                    var column = JsStore.getObjectFirstKey(this._query.Where);
                    if (this._query.IgnoreCase === true) {
                        this._query.Where = this.makeQryInCaseSensitive(this._query.Where);
                    }
                    if (this._objectStore.indexNames.contains(column)) {
                        var value = this._query.Where[column];
                        if (typeof value === 'object') {
                            this._checkFlag = Boolean(Object.keys(value).length > 1 ||
                                Object.keys(this._query.Where).length > 1);
                            var key = JsStore.getObjectFirstKey(value);
                            switch (key) {
                                case 'Like':
                                    {
                                        var filter_value = value.Like.split('%');
                                        if (filter_value[1]) {
                                            if (filter_value.length > 2) {
                                                this.executeLikeLogic(column, filter_value[1], JsStore.Occurence.Any);
                                            }
                                            else {
                                                this.executeLikeLogic(column, filter_value[1], JsStore.Occurence.Last);
                                            }
                                        }
                                        else {
                                            this.executeLikeLogic(column, filter_value[0], JsStore.Occurence.First);
                                        }
                                    }
                                    break;
                                case 'In':
                                    this.executeInLogic(column, value['In']);
                                    break;
                                case '-':
                                case '>':
                                case '<':
                                case '>=':
                                case '<=':
                                    this.executeWhereLogic(column, value, key);
                                    break;
                                case 'Aggregate': break;
                                default: this.executeWhereLogic(column, value);
                            }
                        }
                        else {
                            this._checkFlag = Boolean(Object.keys(this._query.Where).length > 1);
                            this.executeWhereLogic(column, value);
                        }
                    }
                    else {
                        this._errorOccured = true;
                        this.Error = JsStore.Utils.getError(JsStore.ErrorType.ColumnNotExist, { ColumnName: column });
                        JsStore.throwError(this.Error);
                    }
                };
                _this.makeQryInCaseSensitive = function (qry) {
                    var results = [], column_value, key_value;
                    for (var column in qry) {
                        column_value = qry[column];
                        if (typeof column_value === 'object') {
                            for (var key in column_value) {
                                key_value = column_value[key];
                                switch (key) {
                                    case JsStore.WhereQryOption.In:
                                        results = results.concat(this.getAllCombinationOfWord(key_value, true));
                                        break;
                                    case JsStore.WhereQryOption.Like:
                                        break;
                                    default:
                                        results = results.concat(this.getAllCombinationOfWord(key_value));
                                }
                            }
                            qry[column]['In'] = results;
                        }
                        else {
                            results = results.concat(this.getAllCombinationOfWord(column_value));
                            qry[column] = {
                                In: results
                            };
                        }
                    }
                    return qry;
                };
                return _this;
            }
            /**
             * For matching the different column value existance
             *
             * @protected
             * @param {any} rowValue
             * @returns
             * @memberof Base
             */
            Base.prototype.checkForWhereConditionMatch = function (rowValue) {
                var where = this._query.Where, status = true;
                var checkIn = function (column, value) {
                    var values = where[column].In;
                    for (var i = 0, length = values.length; i < length; i++) {
                        if (values[i] === value) {
                            status = true;
                            break;
                        }
                        else {
                            status = false;
                        }
                    }
                }, checkLike = function (column, value) {
                    var values = where[column].Like.split('%'), comp_symbol, comp_value, symbol_index;
                    if (values[1]) {
                        comp_value = values[1];
                        comp_symbol = values.length > 2 ? JsStore.Occurence.Any : JsStore.Occurence.Last;
                    }
                    else {
                        comp_value = values[0];
                        comp_symbol = JsStore.Occurence.First;
                    }
                    value = value.toLowerCase();
                    switch (comp_symbol) {
                        case JsStore.Occurence.Any:
                            symbol_index = value.indexOf(comp_value.toLowerCase());
                            if (symbol_index < 0) {
                                status = false;
                            }
                            break;
                        case JsStore.Occurence.First:
                            symbol_index = value.indexOf(comp_value.toLowerCase());
                            if (symbol_index > 0 || symbol_index < 0) {
                                status = false;
                            }
                            break;
                        default:
                            symbol_index = value.lastIndexOf(comp_value.toLowerCase());
                            if (symbol_index < value.length - comp_value.length) {
                                status = false;
                            }
                    }
                }, checkComparisionOp = function (column, value, symbol) {
                    var compare_value = where[column][symbol];
                    switch (symbol) {
                        // greater than
                        case '>':
                            if (value <= compare_value) {
                                status = false;
                            }
                            break;
                        // less than
                        case '<':
                            if (value >= compare_value) {
                                status = false;
                            }
                            break;
                        // less than equal
                        case '<=':
                            if (value > compare_value) {
                                status = false;
                            }
                            break;
                        // greather than equal
                        case '>=':
                            if (value < compare_value) {
                                status = false;
                            }
                            break;
                        // between
                        case '-':
                            if (value < compare_value.Low || value > compare_value.High) {
                                status = false;
                            }
                            break;
                    }
                };
                for (var columnValue in where) {
                    var column_value = where[columnValue];
                    if (status) {
                        if (typeof column_value === 'object') {
                            for (var key in column_value) {
                                if (status) {
                                    switch (key) {
                                        case 'In':
                                            checkIn(columnValue, rowValue[columnValue]);
                                            break;
                                        case 'Like':
                                            checkLike(columnValue, rowValue[columnValue]);
                                            break;
                                        case '-':
                                        case '>':
                                        case '<':
                                        case '>=':
                                        case '<=':
                                            checkComparisionOp(columnValue, rowValue[columnValue], key);
                                            break;
                                    }
                                }
                                else {
                                    break;
                                }
                            }
                        }
                        else {
                            if (column_value !== rowValue[columnValue]) {
                                status = false;
                                break;
                            }
                        }
                    }
                    else {
                        break;
                    }
                }
                return status;
            };
            return Base;
        }(Business.BaseHelper));
        Business.Base = Base;
    })(Business = JsStore.Business || (JsStore.Business = {}));
})(JsStore || (JsStore = {}));
var JsStore;
(function (JsStore) {
    var Business;
    (function (Business) {
        var CreateDb = /** @class */ (function () {
            function CreateDb(dbVersion, onSuccess, onError) {
                var table_created_list = [], db_request = indexedDB.open(Business.active_db._name, dbVersion);
                db_request.onerror = function (event) {
                    if (onError != null) {
                        onError(event.target.error);
                    }
                };
                db_request.onsuccess = function (event) {
                    JsStore.status.ConStatus = JsStore.ConnectionStatus.Connected;
                    Business.db_connection = db_request.result;
                    Business.db_connection.onclose = function () {
                        JsStore.status.ConStatus = JsStore.ConnectionStatus.Closed;
                        JsStore.status.LastError = "Connection Closed";
                    };
                    Business.db_connection.onversionchange = function (e) {
                        if (e.newVersion === null) {
                            e.target.close(); // Manually close our connection to the db
                        }
                    };
                    Business.db_connection.onerror = function (e) {
                        JsStore.status.LastError = "Error occured in connection :" + e.target.result;
                    };
                    Business.db_connection.onabort = function (e) {
                        JsStore.status.ConStatus = JsStore.ConnectionStatus.Closed;
                        JsStore.status.LastError = "Connection aborted";
                    };
                    if (onSuccess != null) {
                        onSuccess(table_created_list);
                    }
                    // save dbSchema in keystore
                    KeyStore.set("JsStore_" + Business.active_db._name + "_Schema", Business.active_db);
                };
                db_request.onupgradeneeded = function (event) {
                    var db = event.target.result;
                    Business.active_db._tables.forEach(function (item) {
                        if (item._requireDelete) {
                            // Delete the old datastore.    
                            if (db.objectStoreNames.contains(item._name)) {
                                db.deleteObjectStore(item._name);
                            }
                            createObjectStore(db, item);
                        }
                        else if (item._requireCreation) {
                            createObjectStore(db, item);
                        }
                    });
                };
                var createObjectStore = function (db_connection, item) {
                    try {
                        if (item._primaryKey.length > 0) {
                            var store = db_connection.createObjectStore(item._name, {
                                keyPath: item._primaryKey
                            });
                            item._columns.forEach(function (column) {
                                var options = column._primaryKey ? { unique: true } : { unique: column._unique };
                                options['multiEntry'] = column._multiEntry;
                                store.createIndex(column._name, column._name, options);
                                if (column._autoIncrement) {
                                    KeyStore.set("JsStore_" + Business.active_db._name + "_" + item._name + "_" + column._name + "_Value", 0);
                                }
                            });
                        }
                        else {
                            var store = db_connection.createObjectStore(item._name, {
                                autoIncrement: true
                            });
                            item._columns.forEach(function (column) {
                                var options = { unique: column._unique, multiEntry: column._multiEntry };
                                store.createIndex(column._name, column._name, options);
                                if (column._autoIncrement) {
                                    KeyStore.set("JsStore_" + Business.active_db._name + "_" + item._name + "_" + column._name + "_Value", 0);
                                }
                            });
                        }
                        table_created_list.push(item._name);
                        // setting the table version
                        KeyStore.set("JsStore_" + Business.active_db._name + "_" + item._name + "_Version", item._version);
                    }
                    catch (e) {
                        console.error(e);
                    }
                };
            }
            return CreateDb;
        }());
        Business.CreateDb = CreateDb;
    })(Business = JsStore.Business || (JsStore.Business = {}));
})(JsStore || (JsStore = {}));
var JsStore;
(function (JsStore) {
    var Business;
    (function (Business) {
        var DropDb = /** @class */ (function () {
            function DropDb(name, onSuccess, onError) {
                this.deleteDb = function (name, onSuccess, onError) {
                    var db_drop_request = indexedDB.deleteDatabase(name);
                    db_drop_request.onblocked = function () {
                        if (onError != null) {
                            onError("database is blocked, cant be deleted right now.");
                        }
                    };
                    db_drop_request.onerror = function (e) {
                        if (onError != null) {
                            onError(event.target.error);
                        }
                    };
                    db_drop_request.onsuccess = function () {
                        JsStore.status.ConStatus = JsStore.ConnectionStatus.Closed;
                        KeyStore.remove('JsStore_' + Business.active_db._name + '_Db_Version');
                        Business.active_db._tables.forEach(function (table) {
                            KeyStore.remove("JsStore_" + Business.active_db._name + "_" + table._name + "_Version");
                            table._columns.forEach(function (column) {
                                if (column._autoIncrement) {
                                    KeyStore.remove("JsStore_" + Business.active_db._name + "_" + table._name + "_" + column._name + "_Value");
                                }
                            });
                        });
                        KeyStore.remove("JsStore_" + Business.active_db._name + "_Schema");
                        onSuccess();
                    };
                };
                Business.db_connection.close();
                setTimeout(function () {
                    this.deleteDb(name, onSuccess, onError);
                }.bind(this), 100);
            }
            return DropDb;
        }());
        Business.DropDb = DropDb;
    })(Business = JsStore.Business || (JsStore.Business = {}));
})(JsStore || (JsStore = {}));
var JsStore;
(function (JsStore) {
    var Business;
    (function (Business) {
        var InsertHelper = /** @class */ (function (_super) {
            __extends(InsertHelper, _super);
            function InsertHelper() {
                var _this = _super !== null && _super.apply(this, arguments) || this;
                _this._valuesAffected = [];
                _this.onTransactionCompleted = function () {
                    this._onSuccess(this._query.Return ? this._valuesAffected : this._rowAffected);
                };
                _this.checkModifyInsertValues = function (table, values) {
                    var value_index = 0, value, table_name = table._name, checkDatas = function () {
                        value = values[value_index++];
                        checkInternal();
                    }.bind(this), checkInternal = function () {
                        if (value) {
                            checkAndModifyValue();
                        }
                        else {
                            this.insertData(values);
                        }
                    }.bind(this);
                    var checkAndModifyValue = function () {
                        var index = 0, onValidationError = function (error, details) {
                            this._errorOccured = true;
                            this.Error = JsStore.Utils.getError(error, details);
                        };
                        var checkAndModifyColumn = function (column) {
                            var checkNotNullAndDataType = function () {
                                // check not null schema
                                if (column._notNull && JsStore.isNull(value[column._name])) {
                                    onValidationError(JsStore.ErrorType.NullValue, { ColumnName: column._name });
                                }
                                else if (column._dataType && typeof value[column._name] !== column._dataType) {
                                    onValidationError(JsStore.ErrorType.BadDataType, { ColumnName: column._name });
                                }
                                checkAndModifyColumn(table._columns[index++]);
                            };
                            var saveAutoIncrementValue = function () {
                                KeyStore.get("JsStore_" + Business.active_db._name + "_" + table_name + "_" + column._name + "_Value", function (columnValue) {
                                    value[column._name] = ++columnValue;
                                    KeyStore.set("JsStore_" + Business.active_db._name + "_" + table_name + "_" + column._name + "_Value", columnValue);
                                    checkNotNullAndDataType();
                                });
                            };
                            if (column) {
                                if (!this._errorOccured) {
                                    // check auto increment scheme
                                    if (column._autoIncrement) {
                                        saveAutoIncrementValue();
                                    }
                                    else if (column._default && JsStore.isNull(value[column._name])) {
                                        value[column._name] = column._default;
                                        checkNotNullAndDataType();
                                    }
                                    else {
                                        checkNotNullAndDataType();
                                    }
                                }
                                else {
                                    this.onErrorOccured(this.Error, true);
                                }
                            }
                            else {
                                checkDatas();
                            }
                        };
                        checkAndModifyColumn(table._columns[index++]);
                    }.bind(this);
                    checkDatas();
                };
                return _this;
            }
            return InsertHelper;
        }(Business.Base));
        Business.InsertHelper = InsertHelper;
    })(Business = JsStore.Business || (JsStore.Business = {}));
})(JsStore || (JsStore = {}));
var JsStore;
(function (JsStore) {
    var Business;
    (function (Business) {
        var Insert = /** @class */ (function (_super) {
            __extends(Insert, _super);
            function Insert(query, onSuccess, onError) {
                var _this = _super.call(this) || this;
                _this.insertData = function (values) {
                    var value_index = 0, is_return = this._query.Return, insertDataintoTable;
                    if (is_return) {
                        insertDataintoTable = function (value) {
                            if (value) {
                                var add_result = object_store.add(value);
                                add_result.onerror = this.onErrorOccured.bind(this);
                                add_result.onsuccess = function (e) {
                                    this.ValuesAffected.push(value);
                                    insertDataintoTable(values[value_index++]);
                                }.bind(this);
                            }
                        }.bind(this);
                    }
                    else {
                        insertDataintoTable = function (value) {
                            if (value) {
                                var add_result = object_store.add(value);
                                add_result.onerror = this.onErrorOccured.bind(this);
                                add_result.onsuccess = function (e) {
                                    ++this._rowAffected;
                                    insertDataintoTable(values[value_index++]);
                                }.bind(this);
                            }
                        }.bind(this);
                    }
                    this._transaction = Business.db_connection.transaction([this._query.Into], "readwrite");
                    var object_store = this._transaction.objectStore(this._query.Into);
                    this._transaction.oncomplete = this.onTransactionCompleted.bind(this);
                    insertDataintoTable(values[value_index++]);
                };
                try {
                    _this._query = query;
                    _this._onSuccess = onSuccess;
                    _this._onError = onError;
                    var table = _this.getTable(query.Into);
                    if (table) {
                        if (_this._query.SkipDataCheck) {
                            _this.insertData(_this._query.Values);
                            // remove values
                            _this._query.Values = undefined;
                        }
                        else {
                            _this.checkModifyInsertValues(table, _this._query.Values);
                            // remove values
                            _this._query.Values = undefined;
                        }
                    }
                    else {
                        var error = JsStore.Utils.getError(JsStore.ErrorType.TableNotExist, { TableName: query.Into });
                        JsStore.throwError(Error);
                    }
                }
                catch (ex) {
                    _this.onExceptionOccured(ex, { TableName: query.Into });
                }
                return _this;
            }
            return Insert;
        }(Business.InsertHelper));
        Business.Insert = Insert;
    })(Business = JsStore.Business || (JsStore.Business = {}));
})(JsStore || (JsStore = {}));
var JsStore;
(function (JsStore) {
    var Business;
    (function (Business) {
        var BulkInsert = /** @class */ (function (_super) {
            __extends(BulkInsert, _super);
            function BulkInsert(query, onSuccess, onError) {
                var _this = _super.call(this) || this;
                _this.bulkinsertData = function () {
                    this._transaction = Business.db_connection.transaction([this._query.Into], "readwrite");
                    this._objectStore = this._transaction.objectStore(this._query.Into);
                    this._transaction.oncomplete = function (e) {
                        this._onSuccess();
                    }.bind(this);
                    this._query.Values.forEach(function (value) {
                        this._objectStore.add(value);
                    }, this);
                };
                try {
                    _this._query = query;
                    _this._onSuccess = onSuccess;
                    _this._onError = onError;
                    if (_this.getTable(query.Into)) {
                        _this.bulkinsertData();
                    }
                    else {
                        var error = JsStore.Utils.getError(JsStore.ErrorType.TableNotExist, { TableName: query.Into });
                        JsStore.throwError(error);
                    }
                }
                catch (ex) {
                    _this.onExceptionOccured(ex, { TableName: query.Into });
                }
                return _this;
            }
            return BulkInsert;
        }(Business.Base));
        Business.BulkInsert = BulkInsert;
    })(Business = JsStore.Business || (JsStore.Business = {}));
})(JsStore || (JsStore = {}));
var JsStore;
(function (JsStore) {
    var Business;
    (function (Business) {
        var OpenDb = /** @class */ (function () {
            function OpenDb(dbVersion, onSuccess, onError) {
                if (Business.active_db._name.length > 0) {
                    var db_request = indexedDB.open(Business.active_db._name, dbVersion), that = this;
                    db_request.onerror = function (event) {
                        if (onError != null) {
                            onError(event.target.error);
                        }
                    };
                    db_request.onsuccess = function (event) {
                        JsStore.status.ConStatus = JsStore.ConnectionStatus.Connected;
                        Business.db_connection = db_request.result;
                        Business.db_connection.onclose = function () {
                            JsStore.status.ConStatus = JsStore.ConnectionStatus.Closed;
                            JsStore.status.LastError = "Connection Closed, trying to reconnect";
                        };
                        Business.db_connection.onversionchange = function (e) {
                            if (e.newVersion === null) {
                                e.target.close(); // Manually close our connection to the db
                            }
                        };
                        Business.db_connection.onerror = function (e) {
                            JsStore.status.LastError = "Error occured in connection :" + e.target.result;
                        };
                        Business.db_connection.onabort = function (e) {
                            JsStore.status.ConStatus = JsStore.ConnectionStatus.Closed;
                            JsStore.status.LastError = "Connection Aborted";
                        };
                        if (onSuccess != null) {
                            onSuccess();
                        }
                    };
                }
                else {
                    var error = "Database name is not supplied.";
                    JsStore.throwError(error);
                }
            }
            return OpenDb;
        }());
        Business.OpenDb = OpenDb;
    })(Business = JsStore.Business || (JsStore.Business = {}));
})(JsStore || (JsStore = {}));
var JsStore;
(function (JsStore) {
    var Business;
    (function (Business) {
        var Clear = /** @class */ (function (_super) {
            __extends(Clear, _super);
            function Clear(tableName, onSuccess, onError) {
                var _this = _super.call(this) || this;
                var object_store = Business.db_connection.transaction([tableName], "readwrite").objectStore(tableName), clear_request = object_store.clear();
                clear_request.onsuccess = function (e) {
                    var current_table = this.getTable(tableName);
                    current_table._columns.forEach(function (column) {
                        if (column._autoIncrement) {
                            KeyStore.set("JsStore_" + Business.active_db._name + "_" + tableName + "_" + column._name + "_Value", 0);
                        }
                    });
                    if (onSuccess != null) {
                        onSuccess();
                    }
                }.bind(_this);
                clear_request.onerror = function (e) {
                    if (onError != null) {
                        onError(e);
                    }
                };
                return _this;
            }
            return Clear;
        }(Business.Base));
        Business.Clear = Clear;
    })(Business = JsStore.Business || (JsStore.Business = {}));
})(JsStore || (JsStore = {}));
var JsStore;
(function (JsStore) {
    var Business;
    (function (Business) {
        var Main = /** @class */ (function () {
            function Main(onSuccess) {
                if (onSuccess === void 0) { onSuccess = null; }
                this.checkConnectionAndExecuteLogic = function (request) {
                    JsStore.log('checking connection and executing request:' + request.Name);
                    switch (request.Name) {
                        case 'create_db':
                        case 'open_db':
                            this.executeLogic(request);
                            break;
                        case 'change_log_status':
                            this.changeLogStatus(request);
                        default:
                            switch (JsStore.status.ConStatus) {
                                case JsStore.ConnectionStatus.Connected:
                                    {
                                        this.executeLogic(request);
                                    }
                                    break;
                                case JsStore.ConnectionStatus.Closed:
                                    {
                                        this.openDb(Business.active_db._name, function () {
                                            this.checkConnectionAndExecuteLogic(request);
                                        }.bind(this));
                                    }
                                    break;
                            }
                    }
                };
                this.changeLogStatus = function (request) {
                    if (request.Query['logging'] === true) {
                        JsStore.enable_log = true;
                    }
                    else {
                        JsStore.enable_log = false;
                    }
                };
                this.returnResult = function (result) {
                    if (this._onSuccess) {
                        this._onSuccess(result);
                    }
                    else {
                        self.postMessage(result);
                    }
                };
                this.executeLogic = function (request) {
                    var onSuccess = function (results) {
                        this.returnResult({
                            ReturnedValue: results
                        });
                    }.bind(this), onError = function (err) {
                        this.returnResult({
                            ErrorOccured: true,
                            ErrorDetails: err
                        });
                    }.bind(this);
                    switch (request.Name) {
                        case 'select':
                            this.select(request.Query, onSuccess, onError);
                            break;
                        case 'insert':
                            this.insert(request.Query, onSuccess, onError);
                            break;
                        case 'update':
                            this.update(request.Query, onSuccess, onError);
                            break;
                        case 'delete':
                            this.delete(request.Query, onSuccess, onError);
                            break;
                        case 'open_db':
                            this.openDb(request.Query, onSuccess, onError);
                            break;
                        case 'create_db':
                            this.createDb(request.Query, onSuccess, onError);
                            break;
                        case 'clear':
                            this.clear(request.Query, onSuccess, onError);
                            break;
                        case 'drop_db':
                            this.dropDb(onSuccess, onError);
                            break;
                        case 'count':
                            this.count(request.Query, onSuccess, onError);
                            break;
                        case 'bulk_insert':
                            this.bulkInsert(request.Query, onSuccess, onError);
                            break;
                        case 'export_json':
                            this.exportJson(request.Query, onSuccess, onError);
                            break;
                        default: console.error('The Api:-' + request.Name + 'does not support');
                    }
                };
                this.openDb = function (dbName, onSuccess, onError) {
                    // KeyStore.get("JsStore_" + dbName + '_Db_Version', function (dbVersion) {
                    JsStore.getDbVersion(dbName, function (dbVersion) {
                        if (dbVersion != null) {
                            // KeyStore.get("JsStore_" + dbName + "_Schema", function (result) {
                            JsStore.getDbSchema(dbName, function (result) {
                                Business.active_db = result;
                                var open_db_object = new Business.OpenDb(dbVersion, onSuccess, onError);
                            });
                        }
                        else {
                            var error = JsStore.Utils.getError(JsStore.ErrorType.DbNotExist, { DbName: dbName });
                            throw error;
                        }
                    });
                };
                this.closeDb = function () {
                    if (JsStore.status.ConStatus === JsStore.ConnectionStatus.Connected) {
                        Business.db_connection.close();
                    }
                };
                this.dropDb = function (onSuccess, onError) {
                    var drop_db_object = new Business.DropDb(Business.active_db._name, onSuccess, onError);
                };
                this.update = function (query, onSuccess, onError) {
                    var update_db_object = new Business.Update.Instance(query, onSuccess, onError);
                };
                this.insert = function (query, onSuccess, onError) {
                    if (!Array.isArray(query.Values)) {
                        JsStore.throwError("Value should be array :- supplied value is not array");
                    }
                    else {
                        var insert_object = new Business.Insert(query, onSuccess, onError);
                    }
                };
                this.bulkInsert = function (query, onSuccess, onError) {
                    if (!Array.isArray(query.Values)) {
                        JsStore.throwError("Value should be array :- supplied value is not array");
                    }
                    else {
                        var bulk_insert_object = new Business.BulkInsert(query, onSuccess, onError);
                    }
                };
                this.delete = function (query, onSuccess, onError) {
                    var delete_object = new Business.Delete.Instance(query, onSuccess, onError);
                };
                this.select = function (query, onSuccess, onError) {
                    if (typeof query.From === 'object') {
                        var select_join_object = new Business.Select.Join(query, onSuccess, onError);
                    }
                    else {
                        var select_object = new Business.Select.Instance(query, onSuccess, onError);
                    }
                };
                this.count = function (query, onSuccess, onError) {
                    if (typeof query.From === 'object') {
                        query['Count'] = true;
                        var select_join_object = new Business.Select.Join(query, onSuccess, onError);
                    }
                    else {
                        var count_object = new Business.Count.Instance(query, onSuccess, onError);
                    }
                };
                this.createDb = function (dataBase, onSuccess, onError) {
                    this.closeDb();
                    KeyStore.get("JsStore_" + dataBase.Name + "_Db_Version", function (version) {
                        JsStore.db_version = version ? version : 1;
                        Business.active_db = new JsStore.Model.DataBase(dataBase);
                        var createDbInternal = function () {
                            setTimeout(function () {
                                var last_table = (Business.active_db._tables[Business.active_db._tables.length - 1]);
                                KeyStore.get("JsStore_" + Business.active_db._name + "_" + last_table._name + "_Version", function (tableVersion) {
                                    if (tableVersion === last_table._version) {
                                        var create_db_object = new Business.CreateDb(JsStore.db_version, onSuccess, onError);
                                    }
                                    else {
                                        createDbInternal();
                                    }
                                });
                            }, 200);
                        };
                        createDbInternal();
                    });
                };
                this.clear = function (tableName, onSuccess, onError) {
                    var clear_object = new Business.Clear(tableName, onSuccess, onError);
                };
                this.exportJson = function (query, onSuccess, onError) {
                    this.select(query, function (results) {
                        var url = URL.createObjectURL(new Blob([JSON.stringify(results)], {
                            type: "text/json"
                        }));
                        onSuccess(url);
                    }, function (err) {
                        onError(err);
                    });
                };
                this._onSuccess = onSuccess;
            }
            return Main;
        }());
        Business.Main = Main;
    })(Business = JsStore.Business || (JsStore.Business = {}));
})(JsStore || (JsStore = {}));
var JsStore;
(function (JsStore) {
    var Business;
    (function (Business) {
        var Select;
        (function (Select) {
            var BaseSelect = /** @class */ (function (_super) {
                __extends(BaseSelect, _super);
                function BaseSelect() {
                    var _this = _super !== null && _super.apply(this, arguments) || this;
                    _this._results = [];
                    _this._sorted = false;
                    _this._checkFlag = false;
                    _this.removeDuplicates = function () {
                        var datas = this._results;
                        // free results memory
                        this._results = undefined;
                        var key = this.getPrimaryKey(this._query.From);
                        var lookupObject = {};
                        for (var i in datas) {
                            lookupObject[datas[i][key]] = datas[i];
                        }
                        // free datas memory
                        datas = [];
                        for (i in lookupObject) {
                            datas.push(lookupObject[i]);
                        }
                        this._results = datas;
                    };
                    return _this;
                }
                return BaseSelect;
            }(Business.Base));
            Select.BaseSelect = BaseSelect;
        })(Select = Business.Select || (Business.Select = {}));
    })(Business = JsStore.Business || (JsStore.Business = {}));
})(JsStore || (JsStore = {}));
var JsStore;
(function (JsStore) {
    var Business;
    (function (Business) {
        var Select;
        (function (Select) {
            var NotWhere = /** @class */ (function (_super) {
                __extends(NotWhere, _super);
                function NotWhere() {
                    var _this = _super !== null && _super.apply(this, arguments) || this;
                    _this.executeWhereUndefinedLogic = function () {
                        if (this._query.Order && this._query.Order.By) {
                            if (this._objectStore.indexNames.contains(this._query.Order.By)) {
                                var order_type = this._query.Order.Type &&
                                    this._query.Order.Type.toLowerCase() === 'desc' ? 'prev' : 'next';
                                this._sorted = true;
                                this._cursorOpenRequest = this._objectStore.index(this._query.Order.By).
                                    openCursor(null, order_type);
                            }
                            else {
                                var error = JsStore.Utils.getError(JsStore.ErrorType.ColumnNotExist, { ColumnName: this._query.Order.By });
                                JsStore.throwError(error);
                            }
                        }
                        else {
                            this._cursorOpenRequest = this._objectStore.openCursor();
                        }
                        if (this._skipRecord && this._limitRecord) {
                            this.executeSkipAndLimitForNoWhere();
                        }
                        else if (this._skipRecord) {
                            this.executeSkipForNoWhere();
                        }
                        else if (this._limitRecord) {
                            this.executeLimitForNotWhere();
                        }
                        else {
                            this.executeSimpleForNotWhere();
                        }
                        this._cursorOpenRequest.onerror = function (e) {
                            this._errorOccured = true;
                            this.onErrorOccured(e);
                        }.bind(this);
                    };
                    _this.executeSkipAndLimitForNoWhere = function () {
                        var record_skipped = false, cursor;
                        this._cursorOpenRequest.onsuccess = function (e) {
                            cursor = e.target.result;
                            if (cursor) {
                                if (record_skipped && this._results.length !== this._limitRecord) {
                                    this._results.push(cursor.value);
                                    cursor.continue();
                                }
                                else {
                                    record_skipped = true;
                                    cursor.advance(this._skipRecord);
                                }
                            }
                        }.bind(this);
                    };
                    _this.executeSkipForNoWhere = function () {
                        var record_skipped = false, cursor;
                        this._cursorOpenRequest.onsuccess = function (e) {
                            cursor = e.target.result;
                            if (cursor) {
                                if (record_skipped) {
                                    this._results.push(cursor.value);
                                    cursor.continue();
                                }
                                else {
                                    record_skipped = true;
                                    cursor.advance(this._skipRecord);
                                }
                            }
                        }.bind(this);
                    };
                    _this.executeSimpleForNotWhere = function () {
                        var cursor;
                        this._cursorOpenRequest.onsuccess = function (e) {
                            cursor = e.target.result;
                            if (cursor) {
                                this._results.push(cursor.value);
                                cursor.continue();
                            }
                        }.bind(this);
                    };
                    _this.executeLimitForNotWhere = function () {
                        var cursor;
                        this._cursorOpenRequest.onsuccess = function (e) {
                            cursor = e.target.result;
                            if (cursor && this._results.length !== this._limitRecord) {
                                this._results.push(cursor.value);
                                cursor.continue();
                            }
                        }.bind(this);
                    };
                    return _this;
                }
                return NotWhere;
            }(Select.BaseSelect));
            Select.NotWhere = NotWhere;
        })(Select = Business.Select || (Business.Select = {}));
    })(Business = JsStore.Business || (JsStore.Business = {}));
})(JsStore || (JsStore = {}));
var JsStore;
(function (JsStore) {
    var Business;
    (function (Business) {
        var Select;
        (function (Select) {
            var In = /** @class */ (function (_super) {
                __extends(In, _super);
                function In() {
                    var _this = _super !== null && _super.apply(this, arguments) || this;
                    _this.executeInLogic = function (column, values) {
                        if (this._skipRecord && this._limitRecord) {
                            this.executeSkipAndLimitForIn(column, values);
                        }
                        else if (this._skipRecord) {
                            this.executeSkipForIn(column, values);
                        }
                        else if (this._limitRecord) {
                            this.executeLimitForIn(column, values);
                        }
                        else {
                            this.executeSimpleForIn(column, values);
                        }
                    };
                    _this.executeSkipAndLimitForIn = function (column, values) {
                        var cursor, skip = this._skipRecord, column_store = this._objectStore.index(column), cursor_request, skipOrPush = function (value) {
                            if (skip === 0) {
                                this._results.push(value);
                            }
                            else {
                                --skip;
                            }
                        }.bind(this);
                        if (this._checkFlag) {
                            for (var i = 0, length = values.length; i < length; i++) {
                                if (!this._errorOccured) {
                                    cursor_request = column_store.openCursor(IDBKeyRange.only(values[i]));
                                    cursor_request.onsuccess = function (e) {
                                        cursor = e.target.result;
                                        if (this._results.length !== this._limitRecord && cursor) {
                                            if (this.checkForWhereConditionMatch(cursor.value)) {
                                                skipOrPush(cursor.value);
                                            }
                                            cursor.continue();
                                        }
                                    }.bind(this);
                                }
                            }
                        }
                        else {
                            for (var i = 0, length = values.length; i < length; i++) {
                                if (!this._errorOccured) {
                                    cursor_request = column_store.openCursor(IDBKeyRange.only(values[i]));
                                    cursor_request.onsuccess = function (e) {
                                        cursor = e.target.result;
                                        if (this._results.length !== this._limitRecord && cursor) {
                                            skipOrPush(cursor.value);
                                            cursor.continue();
                                        }
                                    }.bind(this);
                                }
                            }
                        }
                        cursor_request.onerror = function (e) {
                            this._errorOccured = true;
                            this.onErrorOccured(e);
                        }.bind(this);
                    };
                    _this.executeSkipForIn = function (column, values) {
                        var cursor, skip = this._skipRecord, cursor_request, column_store = this._objectStore.index(column), skipOrPush = function (value) {
                            if (skip === 0) {
                                this._results.push(value);
                            }
                            else {
                                --skip;
                            }
                        }.bind(this);
                        if (this._checkFlag) {
                            for (var i = 0, length = values.length; i < length; i++) {
                                if (!this._errorOccured) {
                                    cursor_request = column_store.openCursor(IDBKeyRange.only(values[i]));
                                    cursor_request.onsuccess = function (e) {
                                        cursor = e.target.result;
                                        if (cursor) {
                                            if (this.checkForWhereConditionMatch(cursor.value)) {
                                                skipOrPush((cursor.value));
                                            }
                                            cursor.continue();
                                        }
                                    }.bind(this);
                                }
                            }
                        }
                        else {
                            for (var i = 0, length = values.length; i < length; i++) {
                                if (!this._errorOccured) {
                                    cursor_request = column_store.openCursor(IDBKeyRange.only(values[i]));
                                    cursor_request.onsuccess = function (e) {
                                        cursor = e.target.result;
                                        if (cursor) {
                                            skipOrPush((cursor.value));
                                            cursor.continue();
                                        }
                                    }.bind(this);
                                }
                            }
                        }
                        cursor_request.onerror = function (e) {
                            this._errorOccured = true;
                            this.onErrorOccured(e);
                        }.bind(this);
                    };
                    _this.executeLimitForIn = function (column, values) {
                        var cursor, cursor_request, column_store = this._objectStore.index(column);
                        if (this._checkFlag) {
                            for (var i = 0, length = values.length; i < length; i++) {
                                if (!this._errorOccured) {
                                    cursor_request = column_store.openCursor(IDBKeyRange.only(values[i]));
                                    cursor_request.onsuccess = function (e) {
                                        cursor = e.target.result;
                                        if (cursor && this._results.length !== this._limitRecord) {
                                            if (this.checkForWhereConditionMatch(cursor.value)) {
                                                this._results.push(cursor.value);
                                            }
                                            cursor.continue();
                                        }
                                    }.bind(this);
                                }
                            }
                        }
                        else {
                            for (var i = 0, length = values.length; i < length; i++) {
                                if (!this._errorOccured) {
                                    cursor_request = column_store.openCursor(IDBKeyRange.only(values[i]));
                                    cursor_request.onsuccess = function (e) {
                                        cursor = e.target.result;
                                        if (cursor && this._results.length !== this._limitRecord) {
                                            this._results.push(cursor.value);
                                            cursor.continue();
                                        }
                                    }.bind(this);
                                }
                            }
                        }
                        cursor_request.onerror = function (e) {
                            this._errorOccured = true;
                            this.onErrorOccured(e);
                        }.bind(this);
                    };
                    _this.executeSimpleForIn = function (column, values) {
                        var cursor, cursor_request, column_store = this._objectStore.index(column);
                        if (this._checkFlag) {
                            for (var i = 0, length = values.length; i < length; i++) {
                                if (!this._errorOccured) {
                                    cursor_request = column_store.openCursor(IDBKeyRange.only(values[i]));
                                    cursor_request.onsuccess = function (e) {
                                        cursor = e.target.result;
                                        if (cursor) {
                                            if (this.checkForWhereConditionMatch(cursor.value)) {
                                                this._results.push(cursor.value);
                                            }
                                            cursor.continue();
                                        }
                                    }.bind(this);
                                }
                            }
                        }
                        else {
                            for (var i = 0, length = values.length; i < length; i++) {
                                if (!this._errorOccured) {
                                    cursor_request = column_store.openCursor(IDBKeyRange.only(values[i]));
                                    cursor_request.onsuccess = function (e) {
                                        cursor = e.target.result;
                                        if (cursor) {
                                            this._results.push(cursor.value);
                                            cursor.continue();
                                        }
                                    }.bind(this);
                                }
                            }
                        }
                        cursor_request.onerror = function (e) {
                            this._errorOccured = true;
                            this.onErrorOccured(e);
                        }.bind(this);
                    };
                    return _this;
                }
                return In;
            }(Select.NotWhere));
            Select.In = In;
        })(Select = Business.Select || (Business.Select = {}));
    })(Business = JsStore.Business || (JsStore.Business = {}));
})(JsStore || (JsStore = {}));
var JsStore;
(function (JsStore) {
    var Business;
    (function (Business) {
        var Select;
        (function (Select) {
            var Like = /** @class */ (function (_super) {
                __extends(Like, _super);
                function Like() {
                    var _this = _super !== null && _super.apply(this, arguments) || this;
                    _this.executeLikeLogic = function (column, value, symbol) {
                        this._compValue = value.toLowerCase();
                        this._compValueLength = this._compValue.length;
                        this._compSymbol = symbol;
                        this._cursorOpenRequest = this._objectStore.index(column).openCursor();
                        this._cursorOpenRequest.onerror = function (e) {
                            this._errorOccured = true;
                            this.onErrorOccured(e);
                        }.bind(this);
                        if (this._skipRecord && this._limitRecord) {
                            this.executeSkipAndLimit();
                        }
                        else if (this._skipRecord) {
                            this.executeSkip();
                        }
                        else if (this._limitRecord) {
                            this.executeLimit();
                        }
                        else {
                            this.executeSimple();
                        }
                    };
                    _this.filterOnOccurence = function (value) {
                        var found = false;
                        value = value.toLowerCase();
                        switch (this._compSymbol) {
                            case JsStore.Occurence.Any:
                                if (value.indexOf(this._compValue) >= 0) {
                                    found = true;
                                }
                                break;
                            case JsStore.Occurence.First:
                                if (value.indexOf(this._compValue) === 0) {
                                    found = true;
                                }
                                break;
                            default: if (value.lastIndexOf(this._compValue) === value.length - this._compValueLength) {
                                found = true;
                            }
                        }
                        return found;
                    };
                    _this.executeSkipAndLimit = function () {
                        var cursor, skip = this._skipRecord, skipOrPush = function (value) {
                            if (skip === 0) {
                                this._results.push(value);
                            }
                            else {
                                --skip;
                            }
                        }.bind(this);
                        if (this._checkFlag) {
                            this._cursorOpenRequest.onsuccess = function (e) {
                                cursor = e.target.result;
                                if (this._results.length !== this._limitRecord && cursor) {
                                    if (this.filterOnOccurence(cursor.key) &&
                                        this.checkForWhereConditionMatch(cursor.value)) {
                                        skipOrPush(cursor.value);
                                    }
                                    cursor.continue();
                                }
                            }.bind(this);
                        }
                        else {
                            this._cursorOpenRequest.onsuccess = function (e) {
                                cursor = e.target.result;
                                if (this._results.length !== this._limitRecord && cursor) {
                                    if (this.filterOnOccurence(cursor.key)) {
                                        skipOrPush(cursor.value);
                                    }
                                    cursor.continue();
                                }
                            }.bind(this);
                        }
                    };
                    _this.executeSkip = function () {
                        var cursor, skip = this._skipRecord, skipOrPush = function (value) {
                            if (skip === 0) {
                                this._results.push(value);
                            }
                            else {
                                --skip;
                            }
                        }.bind(this);
                        if (this._checkFlag) {
                            this._cursorOpenRequest.onsuccess = function (e) {
                                cursor = e.target.result;
                                if (cursor) {
                                    if (this.filterOnOccurence(cursor.key) &&
                                        this.checkForWhereConditionMatch(cursor.value)) {
                                        skipOrPush((cursor.value));
                                    }
                                    cursor.continue();
                                }
                            }.bind(this);
                        }
                        else {
                            this._cursorOpenRequest.onsuccess = function (e) {
                                cursor = e.target.result;
                                if (cursor) {
                                    if (this.filterOnOccurence(cursor.key)) {
                                        skipOrPush((cursor.value));
                                    }
                                    cursor.continue();
                                }
                            }.bind(this);
                        }
                    };
                    _this.executeLimit = function () {
                        var cursor;
                        if (this._checkFlag) {
                            this._cursorOpenRequest.onsuccess = function (e) {
                                cursor = e.target.result;
                                if (this._results.length !== this._limitRecord && cursor) {
                                    if (this.filterOnOccurence(cursor.key) &&
                                        this.checkForWhereConditionMatch(cursor.value)) {
                                        this._results.push(cursor.value);
                                    }
                                    cursor.continue();
                                }
                            }.bind(this);
                        }
                        else {
                            this._cursorOpenRequest.onsuccess = function (e) {
                                cursor = e.target.result;
                                if (this._results.length !== this._limitRecord && cursor) {
                                    if (this.filterOnOccurence(cursor.key)) {
                                        this._results.push(cursor.value);
                                    }
                                    cursor.continue();
                                }
                            }.bind(this);
                        }
                    };
                    _this.executeSimple = function () {
                        var cursor;
                        if (this._checkFlag) {
                            this._cursorOpenRequest.onsuccess = function (e) {
                                cursor = e.target.result;
                                if (cursor) {
                                    if (this.filterOnOccurence(cursor.key) &&
                                        this.checkForWhereConditionMatch(cursor.value)) {
                                        this._results.push(cursor.value);
                                    }
                                    cursor.continue();
                                }
                            }.bind(this);
                        }
                        else {
                            this._cursorOpenRequest.onsuccess = function (e) {
                                cursor = e.target.result;
                                if (cursor) {
                                    if (this.filterOnOccurence(cursor.key)) {
                                        this._results.push(cursor.value);
                                    }
                                    cursor.continue();
                                }
                            }.bind(this);
                        }
                    };
                    return _this;
                }
                return Like;
            }(Select.In));
            Select.Like = Like;
        })(Select = Business.Select || (Business.Select = {}));
    })(Business = JsStore.Business || (JsStore.Business = {}));
})(JsStore || (JsStore = {}));
var JsStore;
(function (JsStore) {
    var Business;
    (function (Business) {
        var Select;
        (function (Select) {
            var Where = /** @class */ (function (_super) {
                __extends(Where, _super);
                function Where() {
                    var _this = _super !== null && _super.apply(this, arguments) || this;
                    _this.executeSkipAndLimitForWhere = function () {
                        var record_skipped = false, cursor;
                        if (this._checkFlag) {
                            this._cursorOpenRequest.onsuccess = function (e) {
                                cursor = e.target.result;
                                if (cursor) {
                                    if (record_skipped && this._results.length !== this._limitRecord) {
                                        if (this.checkForWhereConditionMatch(cursor.value)) {
                                            this._results.push(cursor.value);
                                        }
                                        cursor.continue();
                                    }
                                    else {
                                        record_skipped = true;
                                        cursor.advance(this._skipRecord);
                                    }
                                }
                            }.bind(this);
                        }
                        else {
                            this._cursorOpenRequest.onsuccess = function (e) {
                                cursor = e.target.result;
                                if (cursor) {
                                    if (record_skipped && this._results.length !== this._limitRecord) {
                                        this._results.push(cursor.value);
                                        cursor.continue();
                                    }
                                    else {
                                        record_skipped = true;
                                        cursor.advance(this._skipRecord);
                                    }
                                }
                            }.bind(this);
                        }
                    };
                    _this.executeSkipForWhere = function () {
                        var record_skipped = false, cursor;
                        if (this._checkFlag) {
                            this._cursorOpenRequest.onsuccess = function (e) {
                                cursor = e.target.result;
                                if (cursor) {
                                    if (record_skipped) {
                                        if (this.checkForWhereConditionMatch(cursor.value)) {
                                            this._results.push(cursor.value);
                                        }
                                        cursor.continue();
                                    }
                                    else {
                                        record_skipped = true;
                                        cursor.advance(this._skipRecord);
                                    }
                                }
                            }.bind(this);
                        }
                        else {
                            this._cursorOpenRequest.onsuccess = function (e) {
                                cursor = e.target.result;
                                if (cursor) {
                                    if (record_skipped) {
                                        this._results.push(cursor.value);
                                        cursor.continue();
                                    }
                                    else {
                                        record_skipped = true;
                                        cursor.advance(this._skipRecord);
                                    }
                                }
                            }.bind(this);
                        }
                    };
                    _this.executeLimitForWhere = function () {
                        var cursor;
                        if (this._checkFlag) {
                            this._cursorOpenRequest.onsuccess = function (e) {
                                cursor = e.target.result;
                                if (cursor && this._results.length !== this._limitRecord &&
                                    this.checkForWhereConditionMatch(cursor.value)) {
                                    this._results.push(cursor.value);
                                    cursor.continue();
                                }
                            }.bind(this);
                        }
                        else {
                            this._cursorOpenRequest.onsuccess = function (e) {
                                cursor = e.target.result;
                                if (cursor && this._results.length !== this._limitRecord) {
                                    this._results.push(cursor.value);
                                    cursor.continue();
                                }
                            }.bind(this);
                        }
                    };
                    _this.executeSimpleForWhere = function () {
                        var cursor;
                        if (this._checkFlag) {
                            this._cursorOpenRequest.onsuccess = function (e) {
                                cursor = e.target.result;
                                if (cursor) {
                                    if (this.checkForWhereConditionMatch(cursor.value)) {
                                        this._results.push(cursor.value);
                                    }
                                    cursor.continue();
                                }
                            }.bind(this);
                        }
                        else {
                            this._cursorOpenRequest.onsuccess = function (e) {
                                cursor = e.target.result;
                                if (cursor) {
                                    this._results.push(cursor.value);
                                    cursor.continue();
                                }
                            }.bind(this);
                        }
                    };
                    _this.executeWhereLogic = function (column, value, op) {
                        value = op ? value[op] : value;
                        this._cursorOpenRequest = this._objectStore.index(column).openCursor(this.getKeyRange(value, op));
                        this._cursorOpenRequest.onerror = function (e) {
                            this._errorOccured = true;
                            this.onErrorOccured(e);
                        }.bind(this);
                        if (this._skipRecord && this._limitRecord) {
                            this.executeSkipAndLimitForWhere();
                        }
                        else if (this._skipRecord) {
                            this.executeSkipForWhere();
                        }
                        else if (this._limitRecord) {
                            this.executeLimitForWhere();
                        }
                        else {
                            this.executeSimpleForWhere();
                        }
                    };
                    return _this;
                }
                return Where;
            }(Select.Like));
            Select.Where = Where;
        })(Select = Business.Select || (Business.Select = {}));
    })(Business = JsStore.Business || (JsStore.Business = {}));
})(JsStore || (JsStore = {}));
var JsStore;
(function (JsStore) {
    var Business;
    (function (Business) {
        var Select;
        (function (Select) {
            var Join = /** @class */ (function (_super) {
                __extends(Join, _super);
                function Join(query, onSuccess, onError) {
                    var _this = _super.call(this) || this;
                    _this._queryStack = [];
                    _this._currentQueryStackIndex = 0;
                    _this.onTransactionCompleted = function (e) {
                        if (this._onSuccess != null && (this._queryStack.length === this._currentQueryStackIndex + 1)) {
                            if (this._query['Count']) {
                                this._onSuccess(this._results.length);
                            }
                            else {
                                if (this._query['Skip'] && this._query['Limit']) {
                                    this._results.splice(0, this._query['Skip']);
                                    this._results.splice(this._query['Limit'] - 1, this._results.length);
                                }
                                else if (this._query['Skip']) {
                                    this._results.splice(0, this._query['Skip']);
                                }
                                else if (this._query['Limit']) {
                                    this._results.splice(this._query['Limit'] - 1, this._results.length);
                                }
                                this._onSuccess(this._results);
                            }
                        }
                    };
                    _this.executeWhereJoinLogic = function (joinQuery, query) {
                        var results = [], join_index = 0, column = query.Column, tmp_results = this._results, item, result_length = tmp_results.length;
                        // get the data from query table
                        var select_object = new Select.Instance({
                            From: query.Table,
                            Where: query.Where,
                            Order: query.Order
                        }, function (selectResults) {
                            // perform join
                            selectResults.forEach(function (value, index) {
                                // search item through each global result
                                for (var i = 0; i < result_length; i++) {
                                    item = tmp_results[i][joinQuery.Table][joinQuery.Column];
                                    doJoin(item, value, i);
                                }
                            });
                            this._results = results;
                            // check if further execution needed
                            if (this._queryStack.length > this._currentQueryStackIndex + 1) {
                                this.startExecutionJoinLogic();
                            }
                            else {
                                this.onTransactionCompleted(null);
                            }
                        }.bind(this), this.onErrorOccured.bind(this));
                        var doJoin = function (value1, value2, itemIndex) {
                            results[join_index] = {};
                            if (value1 === value2[query.Column]) {
                                results[join_index][query.Table] = value2;
                                // copy other relative data into current result
                                for (var j = 0; j < this._currentQueryStackIndex; j++) {
                                    results[join_index][this._queryStack[j].Table] =
                                        tmp_results[itemIndex][this._queryStack[j].Table];
                                }
                                ++join_index;
                            }
                            else if (query.JoinType === 'left') {
                                // left join
                                results[join_index] = {};
                                results[join_index][query.Table] = null;
                                // copy other relative data into current result
                                for (var j = 0; j < this._currentQueryStackIndex; j++) {
                                    results[join_index][this._queryStack[j].Table] =
                                        tmp_results[itemIndex][this._queryStack[j].Table];
                                }
                                // results[JoinIndex][joinQuery.Table] = TmpResults[ItemIndex][joinQuery.Table];
                                ++join_index;
                            }
                        }.bind(this);
                    };
                    _this.executeRightJoin = function (joinQuery, query) {
                        var join_results = [], join_index = 0, column = query.Column, tmp_results = this._results, result_length = tmp_results.length, item_index = 0, where = {}, onExecutionFinished = function () {
                            this._results = join_results;
                            // check if further execution needed
                            if (this._queryStack.length > this._currentQueryStackIndex + 1) {
                                this.startExecutionJoinLogic();
                            }
                            else {
                                this.onTransactionCompleted(null);
                            }
                        }.bind(this), doRightJoin = function (results) {
                            var value_found = false;
                            results.forEach(function (item, index) {
                                for (item_index = 0; item_index < result_length; item_index++) {
                                    if (item[query.Column] ===
                                        tmp_results[item_index][joinQuery.Table][joinQuery.Column]) {
                                        value_found = true;
                                        break;
                                    }
                                }
                                join_results[index] = {};
                                join_results[index][query.Table] = item;
                                if (value_found) {
                                    value_found = false;
                                    for (var j = 0; j < this._currentQueryStackIndex; j++) {
                                        join_results[index][this._queryStack[j].Table] =
                                            tmp_results[item_index][this._queryStack[j].Table];
                                    }
                                }
                                else {
                                    for (var j = 0; j < this._currentQueryStackIndex; j++) {
                                        join_results[index][this._queryStack[j].Table] = null;
                                    }
                                }
                            }, this);
                        }.bind(this), executeLogic = function () {
                            var select_object = new Select.Instance({
                                From: query.Table,
                                Where: query.Where,
                                Order: query.Order
                            }, function (results) {
                                doRightJoin(results);
                                onExecutionFinished();
                            }.bind(this), this.onErrorOccured.bind(this));
                        }.bind(this);
                        executeLogic();
                    };
                    _this.executeWhereUndefinedLogicForJoin = function (joinQuery, query) {
                        var join_results = [], join_index = 0, column = query.Column, tmp_results = this._results, 
                        // Item,
                        result_length = tmp_results.length, item_index = 0, where = {}, onExecutionFinished = function () {
                            this._results = join_results;
                            // check if further execution needed
                            if (this._queryStack.length > this._currentQueryStackIndex + 1) {
                                this.startExecutionJoinLogic();
                            }
                            else {
                                this.onTransactionCompleted(null);
                            }
                        }.bind(this), doJoin = function (results) {
                            if (results.length > 0) {
                                results.forEach(function (value) {
                                    join_results[join_index] = {};
                                    join_results[join_index][query.Table] = value;
                                    // copy other relative data into current result
                                    for (var k = 0; k < this._currentQueryStackIndex; k++) {
                                        join_results[join_index][this._queryStack[k].Table] =
                                            tmp_results[item_index][this._queryStack[k].Table];
                                    }
                                    ++join_index;
                                }, this);
                            }
                            else if (query.JoinType === 'left') {
                                // left join
                                join_results[join_index] = {};
                                join_results[join_index][query.Table] = null;
                                // copy other relative data into current result
                                for (var j = 0; j < this._currentQueryStackIndex; j++) {
                                    join_results[join_index][this._queryStack[j].Table] =
                                        tmp_results[item_index][this._queryStack[j].Table];
                                }
                                ++join_index;
                            }
                        }.bind(this), executeLogic = function () {
                            if (item_index < result_length) {
                                if (!this._errorOccured) {
                                    where[query.Column] = tmp_results[item_index][joinQuery.Table][joinQuery.Column];
                                    var select_object = new Select.Instance({
                                        From: query.Table,
                                        Where: where,
                                        Order: query.Order
                                    }, function (results) {
                                        doJoin(results);
                                        ++item_index;
                                        executeLogic();
                                    }.bind(this), this.onErrorOccured.bind(this));
                                }
                            }
                            else {
                                onExecutionFinished();
                            }
                        }.bind(this);
                        executeLogic();
                    };
                    _this._onSuccess = onSuccess;
                    _this._onError = onError;
                    _this._query = query;
                    var table_list = []; // used to open the multiple object store
                    var convertQueryIntoStack = function (qry) {
                        if (qry.hasOwnProperty('Table1')) {
                            qry.Table2['JoinType'] = qry.Join === undefined ?
                                'inner' : qry.Join.toLowerCase();
                            this._queryStack.push(qry.Table2);
                            if (this._queryStack.length % 2 === 0) {
                                this._queryStack[this._queryStack.length - 1].NextJoin = qry.NextJoin;
                            }
                            table_list.push(qry.Table2.Table);
                            return convertQueryIntoStack(qry.Table1);
                        }
                        else {
                            this._queryStack.push(qry);
                            table_list.push(qry.Table);
                            return;
                        }
                    }.bind(_this);
                    convertQueryIntoStack(query.From);
                    _this._queryStack.reverse();
                    // get the data for first table
                    if (!_this._errorOccured) {
                        var select_object = new Select.Instance({
                            From: _this._queryStack[0].Table,
                            Where: _this._queryStack[0].Where
                        }, function (results) {
                            var table_name = this._queryStack[0].Table;
                            results.forEach(function (item, index) {
                                this._results[index] = {};
                                this._results[index][table_name] = item;
                            }, this);
                            this.startExecutionJoinLogic();
                        }.bind(_this), _this.onErrorOccured.bind(_this));
                    }
                    return _this;
                }
                Join.prototype.startExecutionJoinLogic = function () {
                    var join_query;
                    if (this._currentQueryStackIndex >= 1 && this._currentQueryStackIndex % 2 === 1) {
                        join_query = {
                            Table: this._queryStack[this._currentQueryStackIndex].NextJoin.Table,
                            Column: this._queryStack[this._currentQueryStackIndex].NextJoin.Column
                        };
                        this._currentQueryStackIndex++;
                    }
                    else {
                        join_query = this._queryStack[this._currentQueryStackIndex++];
                    }
                    var query = this._queryStack[this._currentQueryStackIndex];
                    if (query.JoinType === 'right') {
                        this.executeRightJoin(join_query, query);
                    }
                    else if (query.Where) {
                        this.executeWhereJoinLogic(join_query, query);
                    }
                    else {
                        this.executeWhereUndefinedLogicForJoin(join_query, query);
                    }
                };
                return Join;
            }(Select.BaseSelect));
            Select.Join = Join;
        })(Select = Business.Select || (Business.Select = {}));
    })(Business = JsStore.Business || (JsStore.Business = {}));
})(JsStore || (JsStore = {}));
var JsStore;
(function (JsStore) {
    var Business;
    (function (Business) {
        var Select;
        (function (Select) {
            var GroupByHelper = /** @class */ (function (_super) {
                __extends(GroupByHelper, _super);
                function GroupByHelper() {
                    var _this = _super.call(this) || this;
                    _this.processGroupBy = function () {
                        var grp_qry = this._query.GroupBy, datas = this._results, look_up_obj = {};
                        // free results memory
                        this._results = this._query.GroupBy = undefined;
                        if (typeof grp_qry === 'string') {
                            for (var i in datas) {
                                look_up_obj[datas[i][grp_qry]] = datas[i];
                            }
                        }
                        else {
                            var obj_key;
                            for (var i in datas) {
                                obj_key = "";
                                for (var column in grp_qry) {
                                    obj_key += datas[i][grp_qry[column]];
                                }
                                look_up_obj[obj_key] = datas[i];
                            }
                        }
                        // free datas memory
                        datas = [];
                        for (i in look_up_obj) {
                            datas.push(look_up_obj[i]);
                        }
                        this._results = datas;
                    };
                    _this.executeAggregateGroupBy = function () {
                        var grp_qry = this._query.GroupBy, datas = this._results, look_up_obj = {}, 
                        // assign aggregate and free aggregate memory
                        aggregate_qry = this._query.Aggregate;
                        this._query.Aggregate = undefined;
                        // free results memory
                        this._results = undefined;
                        var index, obj_Key, value, aggr_column;
                        var calculateAggregate = function () {
                            for (var prop in aggregate_qry) {
                                switch (prop) {
                                    case 'Count':
                                        var getCount = function () {
                                            value = look_up_obj[obj_Key];
                                            // get old value
                                            value = value ? value["Count(" + aggr_column + ")"] : 0;
                                            // add with old value if data exist
                                            value += datas[index][aggr_column] ? 1 : 0;
                                            return value;
                                        };
                                        if (typeof aggregate_qry[prop] === 'string') {
                                            aggr_column = aggregate_qry[prop];
                                            datas[index]["Count(" + aggr_column + ")"] = getCount();
                                        }
                                        else if (Array.isArray(aggregate_qry[prop])) {
                                            for (var item in aggregate_qry[prop]) {
                                                aggr_column = aggregate_qry[prop][item];
                                                datas[index]["Count(" + aggr_column + ")"] = getCount();
                                            }
                                        }
                                        break;
                                    case 'Max':
                                        var getMax = function () {
                                            value = look_up_obj[obj_Key];
                                            // get old value
                                            value = value ? value["Max(" + aggr_column + ")"] : 0;
                                            datas[index][aggr_column] = datas[index][aggr_column] ?
                                                datas[index][aggr_column] : 0;
                                            // compare between old value and new value
                                            return value > datas[index][aggr_column] ? value : datas[index][aggr_column];
                                        };
                                        if (typeof aggregate_qry[prop] === 'string') {
                                            aggr_column = aggregate_qry[prop];
                                            datas[index]["Max(" + aggr_column + ")"] = getMax();
                                        }
                                        else if (Array.isArray(aggregate_qry[prop])) {
                                            for (var item in aggregate_qry[prop]) {
                                                aggr_column = aggregate_qry[prop][item];
                                                datas[index]["Max(" + aggr_column + ")"] = getMax();
                                            }
                                        }
                                        break;
                                    case 'Min':
                                        var getMin = function () {
                                            value = look_up_obj[obj_Key];
                                            // get old value
                                            value = value ? value["Min(" + aggr_column + ")"] : Infinity;
                                            datas[index][aggr_column] = datas[index][aggr_column] ?
                                                datas[index][aggr_column] : Infinity;
                                            // compare between old value and new value
                                            return value < datas[index][aggr_column] ? value : datas[index][aggr_column];
                                        };
                                        if (typeof aggregate_qry[prop] === 'string') {
                                            aggr_column = aggregate_qry[prop];
                                            datas[index]["Min(" + aggr_column + ")"] = getMin();
                                        }
                                        else if (Array.isArray(aggregate_qry[prop])) {
                                            for (var item in aggregate_qry[prop]) {
                                                aggr_column = aggregate_qry[prop][item];
                                                datas[index]["Min(" + aggr_column + ")"] = getMin();
                                            }
                                        }
                                        break;
                                    case 'Sum':
                                        var getSum = function () {
                                            value = look_up_obj[obj_Key];
                                            // get old value
                                            value = value ? value["Sum(" + aggr_column + ")"] : 0;
                                            // add with old value if data exist
                                            value += datas[index][aggr_column] ? datas[index][aggr_column] : 0;
                                            return value;
                                        };
                                        if (typeof aggregate_qry[prop] === 'string') {
                                            aggr_column = aggregate_qry[prop];
                                            datas[index]["Sum(" + aggr_column + ")"] = getSum();
                                        }
                                        else if (Array.isArray(aggregate_qry[prop])) {
                                            for (var item in aggregate_qry[prop]) {
                                                aggr_column = aggregate_qry[prop][item];
                                                datas[index]["Sum(" + aggr_column + ")"] = getSum();
                                            }
                                        }
                                        break;
                                    case 'Avg':
                                        var getAvg = function () {
                                            value = look_up_obj[obj_Key];
                                            // get old sum value
                                            var sum_of_column = value ? value["Sum(" + aggr_column + ")"] : 0;
                                            // add with old value if data exist
                                            sum_of_column += datas[index][aggr_column] ? datas[index][aggr_column] : 0;
                                            datas[index]["Sum(" + aggr_column + ")"] = sum_of_column;
                                            // get old count value
                                            value = value ? value["Count(" + aggr_column + ")"] : 0;
                                            // add with old value if data exist
                                            value += datas[index][aggr_column] ? 1 : 0;
                                            datas[index]["Count(" + aggr_column + ")"] = value;
                                        };
                                        if (typeof aggregate_qry[prop] === 'string') {
                                            aggr_column = aggregate_qry[prop];
                                            getAvg();
                                        }
                                        else if (Array.isArray(aggregate_qry[prop])) {
                                            for (var item in aggregate_qry[prop]) {
                                                aggr_column = aggregate_qry[prop][item];
                                                getAvg();
                                            }
                                        }
                                        break;
                                }
                            }
                        };
                        if (typeof grp_qry === 'string') {
                            for (index in datas) {
                                obj_Key = datas[index][grp_qry];
                                calculateAggregate();
                                look_up_obj[obj_Key] = datas[index];
                            }
                        }
                        else {
                            for (index in datas) {
                                obj_Key = "";
                                for (var column in grp_qry) {
                                    obj_Key += datas[index][grp_qry[column]];
                                }
                                calculateAggregate();
                                look_up_obj[obj_Key] = datas[index];
                            }
                        }
                        // free datas memory
                        datas = [];
                        for (var i in look_up_obj) {
                            datas.push(look_up_obj[i]);
                        }
                        // Checking for avg and if exist then fill the datas;
                        if (aggregate_qry.Avg) {
                            if (typeof aggregate_qry.Avg === 'string') {
                                for (index in datas) {
                                    var sum_for_avg = datas[index]["Sum(" + aggregate_qry.Avg + ")"], count_for_avg = datas[index]["Count(" + aggregate_qry.Avg + ")"];
                                    datas[index]["Avg(" + aggregate_qry.Avg + ")"] = sum_for_avg / count_for_avg;
                                    if (aggregate_qry.Count !== aggregate_qry.Avg) {
                                        delete datas[index]["Count(" + aggregate_qry.Avg + ")"];
                                    }
                                    if (aggregate_qry.Sum !== aggregate_qry.Avg) {
                                        delete datas[index]["Sum(" + aggregate_qry.Avg + ")"];
                                    }
                                }
                            }
                            else {
                                var is_count_type_string = typeof aggregate_qry.Count, is_sum_type_string = typeof aggregate_qry.Count;
                                for (index in datas) {
                                    for (var column in aggregate_qry.Avg) {
                                        var avg_column = aggregate_qry.Avg[column], sum = datas[index]["Sum(" + avg_column + ")"], count = datas[index]["Count(" + avg_column + ")"];
                                        datas[index]["Avg(" + avg_column + ")"] = sum / count;
                                        if (is_count_type_string) {
                                            if (aggregate_qry.Count !== avg_column) {
                                                delete datas[index]["Count(" + avg_column + ")"];
                                            }
                                            else if (aggregate_qry.Count.indexOf(avg_column) === -1) {
                                                delete datas[index]["Count(" + avg_column + ")"];
                                            }
                                        }
                                        if (is_sum_type_string) {
                                            if (aggregate_qry.Sum !== avg_column) {
                                                delete datas[index]["Sum(" + avg_column + ")"];
                                            }
                                            else if (aggregate_qry.Sum.indexOf(avg_column) === -1) {
                                                delete datas[index]["Sum(" + avg_column + ")"];
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        this._results = datas;
                    };
                    return _this;
                }
                return GroupByHelper;
            }(Select.Where));
            Select.GroupByHelper = GroupByHelper;
        })(Select = Business.Select || (Business.Select = {}));
    })(Business = JsStore.Business || (JsStore.Business = {}));
})(JsStore || (JsStore = {}));
var JsStore;
(function (JsStore) {
    var Business;
    (function (Business) {
        var Select;
        (function (Select) {
            var Helper = /** @class */ (function (_super) {
                __extends(Helper, _super);
                function Helper() {
                    var _this = _super.call(this) || this;
                    _this.processOrderBy = function () {
                        var Order = this._query.Order;
                        if (Order && this._results.length > 0 && !this._sorted && Order.By) {
                            Order.Type = Order.Type ? Order.Type.toLowerCase() : 'asc';
                            var order_column = Order.By, sortNumberInAsc = function () {
                                this._results.sort(function (a, b) {
                                    return a[order_column] - b[order_column];
                                });
                            }.bind(this), sortNumberInDesc = function () {
                                this._results.sort(function (a, b) {
                                    return b[order_column] - a[order_column];
                                });
                            }.bind(this), sortAlphabetInAsc = function () {
                                this._results.sort(function (a, b) {
                                    return a[order_column].toLowerCase().localeCompare(b[order_column].toLowerCase());
                                });
                            }.bind(this), sortAlphabetInDesc = function () {
                                this._results.sort(function (a, b) {
                                    return b[order_column].toLowerCase().localeCompare(a[order_column].toLowerCase());
                                });
                            }.bind(this);
                            if (typeof this._results[0][order_column] === 'string') {
                                if (Order.Type === 'asc') {
                                    sortAlphabetInAsc();
                                }
                                else {
                                    sortAlphabetInDesc();
                                }
                            }
                            else if (typeof this._results[0][order_column] === 'number') {
                                if (Order.Type === 'asc') {
                                    sortNumberInAsc();
                                }
                                else {
                                    sortNumberInDesc();
                                }
                            }
                        }
                    };
                    _this.processAggregateQry = function () {
                        var datas = this._results, results = {}, column_to_aggregate;
                        // free results memory
                        this._results = undefined;
                        for (var prop in this._query.Aggregate) {
                            switch (prop) {
                                case 'Count':
                                    var getCount = function () {
                                        var result = 0;
                                        for (var i in datas) {
                                            result += datas[i][column_to_aggregate] ? 1 : 0;
                                        }
                                        return result;
                                    };
                                    if (typeof this._query.Aggregate[prop] === 'string') {
                                        column_to_aggregate = this._query.Aggregate[prop];
                                        results["Count(" + column_to_aggregate + ")"] = getCount();
                                    }
                                    else if (Array.isArray(this._query.Aggregate[prop])) {
                                        for (var key in this._query.Aggregate[prop]) {
                                            column_to_aggregate = this._query.Aggregate[prop][key];
                                            results["Count(" + column_to_aggregate + ")"] = getCount();
                                        }
                                    }
                                    break;
                                case 'Max':
                                    var getMax = function () {
                                        var result = 0;
                                        for (var i in datas) {
                                            result = result > datas[i][column_to_aggregate] ?
                                                result : datas[i][column_to_aggregate];
                                        }
                                        return result;
                                    };
                                    if (typeof this._query.Aggregate[prop] === 'string') {
                                        column_to_aggregate = this._query.Aggregate[prop];
                                        results["Max(" + column_to_aggregate + ")"] = getMax();
                                    }
                                    else if (Array.isArray(this._query.Aggregate[prop])) {
                                        for (var key in this._query.Aggregate[prop]) {
                                            column_to_aggregate = this._query.Aggregate[prop][key];
                                            results["Max(" + column_to_aggregate + ")"] = getMax();
                                        }
                                    }
                                    break;
                                case 'Min':
                                    var getMin = function () {
                                        var result = Infinity, value = Infinity;
                                        for (var i in datas) {
                                            value = datas[i][column_to_aggregate] ?
                                                datas[i][column_to_aggregate] : Infinity;
                                            result = result < value ? result : value;
                                        }
                                        return result;
                                    };
                                    if (typeof this._query.Aggregate[prop] === 'string') {
                                        column_to_aggregate = this._query.Aggregate[prop];
                                        results["Min(" + column_to_aggregate + ")"] = getMin();
                                    }
                                    else if (Array.isArray(this._query.Aggregate[prop])) {
                                        for (var key in this._query.Aggregate[prop]) {
                                            column_to_aggregate = this._query.Aggregate[prop][key];
                                            results["Min(" + column_to_aggregate + ")"] = getMin();
                                        }
                                    }
                                    break;
                                case 'Sum':
                                    var getSum = function () {
                                        var result = 0;
                                        for (var i in datas) {
                                            result += datas[i][column_to_aggregate];
                                        }
                                        return result;
                                    };
                                    if (typeof this._query.Aggregate[prop] === 'string') {
                                        column_to_aggregate = this._query.Aggregate[prop];
                                        results["Sum(" + column_to_aggregate + ")"] = getSum();
                                    }
                                    else if (Array.isArray(this._query.Aggregate[prop])) {
                                        for (var key in this._query.Aggregate[prop]) {
                                            column_to_aggregate = this._query.Aggregate[prop][key];
                                            results["Sum(" + column_to_aggregate + ")"] = getSum();
                                        }
                                    }
                                    break;
                                case 'Avg':
                                    var getAvg = function () {
                                        var result = 0;
                                        for (var i in datas) {
                                            result += datas[i][column_to_aggregate];
                                        }
                                        return result / datas.length;
                                    };
                                    if (typeof this._query.Aggregate[prop] === 'string') {
                                        column_to_aggregate = this._query.Aggregate[prop];
                                        results["Avg(" + column_to_aggregate + ")"] = getAvg();
                                    }
                                    else if (Array.isArray(this._query.Aggregate[prop])) {
                                        for (var key in this._query.Aggregate[prop]) {
                                            column_to_aggregate = this._query.Aggregate[prop][key];
                                            results["Avg(" + column_to_aggregate + ")"] = getAvg();
                                        }
                                    }
                                    break;
                            }
                        }
                        // add results to the first index of result
                        for (var prop in results) {
                            datas[0][prop] = results[prop];
                        }
                        this._results = datas;
                    };
                    return _this;
                }
                return Helper;
            }(Select.GroupByHelper));
            Select.Helper = Helper;
        })(Select = Business.Select || (Business.Select = {}));
    })(Business = JsStore.Business || (JsStore.Business = {}));
})(JsStore || (JsStore = {}));
var JsStore;
(function (JsStore) {
    var Business;
    (function (Business) {
        var Select;
        (function (Select) {
            var Instance = /** @class */ (function (_super) {
                __extends(Instance, _super);
                function Instance(query, onSuccess, onError) {
                    var _this = _super.call(this) || this;
                    _this.onTransactionCompleted = function () {
                        if (this._sendResultFlag) {
                            this.processOrderBy();
                            if (this._query.Distinct) {
                                var group_by = [];
                                var result = this._results[0];
                                for (var key in result) {
                                    group_by.push(key);
                                }
                                var primary_key = this.getPrimaryKey(this._query.From), index = group_by.indexOf(primary_key);
                                group_by.splice(index, 1);
                                this._query.GroupBy = group_by.length > 0 ? group_by : null;
                            }
                            if (this._query.GroupBy) {
                                if (this._query.Aggregate) {
                                    this.executeAggregateGroupBy();
                                }
                                else {
                                    this.processGroupBy();
                                }
                            }
                            else if (this._query.Aggregate) {
                                this.processAggregateQry();
                            }
                            this._onSuccess(this._results);
                        }
                    };
                    _this.createtransactionForOrLogic = function (query) {
                        this._query = query;
                        try {
                            this._transaction = Business.db_connection.transaction([query.From], "readonly");
                            this._transaction.oncomplete = this.onTransactionCompleted.bind(this);
                            this._transaction.ontimeout = this.onTransactionTimeout.bind(this);
                            this._objectStore = this._transaction.objectStore(query.From);
                            this.goToWhereLogic();
                        }
                        catch (ex) {
                            this.onExceptionOccured(ex, { TableName: query.From });
                        }
                    };
                    _this.orQuerySuccess = function () {
                        this._results = this.OrInfo._results;
                        // free var memory
                        this.OrInfo._results = undefined;
                        this.removeDuplicates();
                        this.OrInfo.OnSucess(this._results);
                    };
                    _this.executeOrLogic = function () {
                        this.OrInfo = {
                            OrQuery: this._query.Where.Or,
                            OnSucess: this._onSuccess,
                            _results: []
                        };
                        this.TmpQry = {
                            From: this._query.From,
                            Where: {}
                        };
                        var onSuccess = function () {
                            this.OrInfo._results = this.OrInfo._results.concat(this._results);
                            if (!this._query.Limit || (this._query.Limit > this.OrInfo._results.length)) {
                                this._results = [];
                                var key = JsStore.getObjectFirstKey(this.OrInfo.OrQuery);
                                if (key != null) {
                                    this.TmpQry['Where'][key] = this.OrInfo.OrQuery[key];
                                    delete this.OrInfo.OrQuery[key];
                                    this.createtransactionForOrLogic(this.TmpQry);
                                }
                                else {
                                    this.orQuerySuccess();
                                }
                            }
                            else {
                                this.orQuerySuccess();
                            }
                        };
                        // free or memory
                        this._query.Where.Or = undefined;
                        this._onSuccess = onSuccess;
                    };
                    _this._query = query;
                    _this._onSuccess = onSuccess;
                    _this._onError = onError;
                    _this._skipRecord = _this._query.Skip;
                    _this._limitRecord = _this._query.Limit;
                    try {
                        _this._transaction = Business.db_connection.transaction([query.From], "readonly");
                        _this._transaction.oncomplete = _this.onTransactionCompleted.bind(_this);
                        _this._transaction.ontimeout = _this.onTransactionTimeout.bind(_this);
                        _this._objectStore = _this._transaction.objectStore(query.From);
                        if (query.Where) {
                            if (query.Where.Or) {
                                _this.executeOrLogic();
                            }
                            _this.goToWhereLogic();
                        }
                        else {
                            _this.executeWhereUndefinedLogic();
                        }
                    }
                    catch (ex) {
                        _this.onExceptionOccured(ex, { TableName: query.From });
                    }
                    return _this;
                }
                return Instance;
            }(Select.Helper));
            Select.Instance = Instance;
        })(Select = Business.Select || (Business.Select = {}));
    })(Business = JsStore.Business || (JsStore.Business = {}));
})(JsStore || (JsStore = {}));
var JsStore;
(function (JsStore) {
    var Business;
    (function (Business) {
        var Count;
        (function (Count) {
            var BaseCount = /** @class */ (function (_super) {
                __extends(BaseCount, _super);
                function BaseCount() {
                    var _this = _super !== null && _super.apply(this, arguments) || this;
                    _this._resultCount = 0;
                    _this._checkFlag = false;
                    return _this;
                }
                return BaseCount;
            }(Business.Base));
            Count.BaseCount = BaseCount;
        })(Count = Business.Count || (Business.Count = {}));
    })(Business = JsStore.Business || (JsStore.Business = {}));
})(JsStore || (JsStore = {}));
var JsStore;
(function (JsStore) {
    var Business;
    (function (Business) {
        var Count;
        (function (Count) {
            var NotWhere = /** @class */ (function (_super) {
                __extends(NotWhere, _super);
                function NotWhere() {
                    var _this = _super !== null && _super.apply(this, arguments) || this;
                    _this.executeWhereUndefinedLogic = function () {
                        if (this._objectStore.count) {
                            var count_request = this._objectStore.count();
                            count_request.onsuccess = function () {
                                this._resultCount = count_request.result;
                            }.bind(this);
                            count_request.onerror = function (e) {
                                this._errorOccured = true;
                                this.onErrorOccured(e);
                            }.bind(this);
                        }
                        else {
                            var cursor, cursor_request = this._objectStore.openCursor();
                            cursor_request.onsuccess = function (e) {
                                cursor = e.target.result;
                                if (cursor) {
                                    ++this._resultCount;
                                    cursor.continue();
                                }
                            }.bind(this);
                            cursor_request.onerror = function (e) {
                                this._errorOccured = true;
                                this.onErrorOccured(e);
                            }.bind(this);
                        }
                    };
                    return _this;
                }
                return NotWhere;
            }(Count.BaseCount));
            Count.NotWhere = NotWhere;
        })(Count = Business.Count || (Business.Count = {}));
    })(Business = JsStore.Business || (JsStore.Business = {}));
})(JsStore || (JsStore = {}));
var JsStore;
(function (JsStore) {
    var Business;
    (function (Business) {
        var Count;
        (function (Count) {
            var In = /** @class */ (function (_super) {
                __extends(In, _super);
                function In() {
                    var _this = _super !== null && _super.apply(this, arguments) || this;
                    _this.executeInLogic = function (column, values) {
                        var cursor, column_store = this._objectStore.index(column), cursor_request;
                        if (this._checkFlag) {
                            for (var i = 0, length = values.length; i < length; i++) {
                                if (!this._errorOccured) {
                                    cursor_request = column_store.openCursor(IDBKeyRange.only(values[i]));
                                    cursor_request.onsuccess = function (e) {
                                        cursor = e.target.result;
                                        if (cursor) {
                                            if (this.checkForWhereConditionMatch(cursor.value)) {
                                                ++this._resultCount;
                                            }
                                            cursor.continue();
                                        }
                                    }.bind(this);
                                }
                            }
                        }
                        else {
                            if (this._objectStore.count) {
                                for (var i = 0, length = values.length; i < length; i++) {
                                    if (!this._errorOccured) {
                                        cursor_request = column_store.count(IDBKeyRange.only(values[i]));
                                        cursor_request.onsuccess = function (e) {
                                            this._resultCount += e.target.result;
                                        }.bind(this);
                                    }
                                }
                            }
                            else {
                                for (var i = 0, length = values.length; i < length; i++) {
                                    if (!this._errorOccured) {
                                        cursor_request = column_store.openCursor(IDBKeyRange.only(values[i]));
                                        cursor_request.onsuccess = function (e) {
                                            cursor = e.target.result;
                                            if (cursor) {
                                                ++this._resultCount;
                                                cursor.continue();
                                            }
                                        }.bind(this);
                                    }
                                }
                            }
                        }
                        cursor_request.onerror = function (e) {
                            this._errorOccured = true;
                            this.onErrorOccured(e);
                        }.bind(this);
                    };
                    return _this;
                }
                return In;
            }(Count.NotWhere));
            Count.In = In;
        })(Count = Business.Count || (Business.Count = {}));
    })(Business = JsStore.Business || (JsStore.Business = {}));
})(JsStore || (JsStore = {}));
var JsStore;
(function (JsStore) {
    var Business;
    (function (Business) {
        var Count;
        (function (Count) {
            var Like = /** @class */ (function (_super) {
                __extends(Like, _super);
                function Like() {
                    var _this = _super !== null && _super.apply(this, arguments) || this;
                    _this.executeLikeLogic = function (column, value, symbol) {
                        var cursor;
                        this._compValue = value.toLowerCase();
                        this._compValueLength = this._compValue.length;
                        this._compSymbol = symbol;
                        this.CursorOpenRequest = this._objectStore.index(column).openCursor();
                        this.CursorOpenRequest.onerror = function (e) {
                            this._errorOccured = true;
                            this.onErrorOccured(e);
                        }.bind(this);
                        if (this._checkFlag) {
                            this.CursorOpenRequest.onsuccess = function (e) {
                                cursor = e.target.result;
                                if (cursor) {
                                    if (this.filterOnOccurence(cursor.key) &&
                                        this.checkForWhereConditionMatch(cursor.value)) {
                                        ++this._resultCount;
                                    }
                                    cursor.continue();
                                }
                            }.bind(this);
                        }
                        else {
                            this.CursorOpenRequest.onsuccess = function (e) {
                                cursor = e.target.result;
                                if (cursor) {
                                    if (this.filterOnOccurence(cursor.key)) {
                                        ++this._resultCount;
                                    }
                                    cursor.continue();
                                }
                            }.bind(this);
                        }
                    };
                    _this.filterOnOccurence = function (value) {
                        var found = false;
                        value = value.toLowerCase();
                        switch (this._compSymbol) {
                            case JsStore.Occurence.Any:
                                if (value.indexOf(this._compValue) >= 0) {
                                    found = true;
                                }
                                break;
                            case JsStore.Occurence.First:
                                if (value.indexOf(this._compValue) === 0) {
                                    found = true;
                                }
                                break;
                            default: if (value.lastIndexOf(this._compValue) === value.length - this.CompValueLength) {
                                found = true;
                            }
                        }
                        return found;
                    };
                    return _this;
                }
                return Like;
            }(Count.In));
            Count.Like = Like;
        })(Count = Business.Count || (Business.Count = {}));
    })(Business = JsStore.Business || (JsStore.Business = {}));
})(JsStore || (JsStore = {}));
var JsStore;
(function (JsStore) {
    var Business;
    (function (Business) {
        var Count;
        (function (Count) {
            var Where = /** @class */ (function (_super) {
                __extends(Where, _super);
                function Where() {
                    var _this = _super !== null && _super.apply(this, arguments) || this;
                    _this.executeWhereLogic = function (column, value, op) {
                        value = op ? value[op] : value;
                        var cursor_request, cursor;
                        if (this._checkFlag) {
                            cursor_request = this._objectStore.index(column).openCursor(this.getKeyRange(value, op));
                            cursor_request.onsuccess = function (e) {
                                cursor = e.target.result;
                                if (cursor) {
                                    if (this.checkForWhereConditionMatch(cursor.value)) {
                                        ++this._resultCount;
                                    }
                                    cursor.continue();
                                }
                            }.bind(this);
                        }
                        else {
                            if (this._objectStore.count) {
                                cursor_request = this._objectStore.index(column).count(this.getKeyRange(value, op));
                                cursor_request.onsuccess = function () {
                                    this._resultCount = cursor_request.result;
                                }.bind(this);
                            }
                            else {
                                cursor_request = this._objectStore.index(column).openCursor(this.getKeyRange(value, op));
                                cursor_request.onsuccess = function (e) {
                                    cursor = e.target.result;
                                    if (cursor) {
                                        ++this._resultCount;
                                        cursor.continue();
                                    }
                                }.bind(this);
                            }
                        }
                        cursor_request.onerror = function (e) {
                            this._errorOccured = true;
                            this.onErrorOccured(e);
                        }.bind(this);
                    };
                    return _this;
                }
                return Where;
            }(Count.Like));
            Count.Where = Where;
        })(Count = Business.Count || (Business.Count = {}));
    })(Business = JsStore.Business || (JsStore.Business = {}));
})(JsStore || (JsStore = {}));
var JsStore;
(function (JsStore) {
    var Business;
    (function (Business) {
        var Count;
        (function (Count) {
            var Instance = /** @class */ (function (_super) {
                __extends(Instance, _super);
                function Instance(query, onSuccess, onError) {
                    var _this = _super.call(this) || this;
                    _this.onTransactionCompleted = function () {
                        if (this._sendResultFlag) {
                            this._onSuccess(this._resultCount);
                        }
                    };
                    _this._query = query;
                    _this._onSuccess = onSuccess;
                    _this._onError = onError;
                    try {
                        var createTransaction = function () {
                            this._transaction = Business.db_connection.transaction([query.From], "readonly");
                            this._objectStore = this._transaction.objectStore(query.From);
                            this._transaction.oncomplete = this.onTransactionCompleted.bind(this);
                            this._transaction.ontimeout = this.onTransactionTimeout.bind(this);
                        };
                        if (query.Where !== undefined) {
                            if (query.Where.Or) {
                                var select_object = new Business.Select.Instance(query, function (results) {
                                    this._resultCount = results.length;
                                    this.onTransactionCompleted();
                                }.bind(_this), _this._onError);
                            }
                            else {
                                createTransaction.call(_this);
                                _this.goToWhereLogic();
                            }
                        }
                        else {
                            createTransaction.call(_this);
                            _this.executeWhereUndefinedLogic();
                        }
                    }
                    catch (ex) {
                        _this.onExceptionOccured(ex, { TableName: query.From });
                    }
                    return _this;
                }
                return Instance;
            }(Count.Where));
            Count.Instance = Instance;
        })(Count = Business.Count || (Business.Count = {}));
    })(Business = JsStore.Business || (JsStore.Business = {}));
})(JsStore || (JsStore = {}));
var JsStore;
(function (JsStore) {
    var Business;
    (function (Business) {
        var Update;
        (function (Update) {
            Update.updateValue = function (suppliedValue, storedValue) {
                for (var key in suppliedValue) {
                    if (typeof suppliedValue[key] !== 'object') {
                        storedValue[key] = suppliedValue[key];
                    }
                    else {
                        for (var op in suppliedValue[key]) {
                            switch (op) {
                                case '+':
                                    storedValue[key] += suppliedValue[key][op];
                                    break;
                                case '-':
                                    storedValue[key] -= suppliedValue[key][op];
                                    break;
                                case '*':
                                    storedValue[key] *= suppliedValue[key][op];
                                    break;
                                case '/':
                                    storedValue[key] /= suppliedValue[key][op];
                                    break;
                                default: storedValue[key] = suppliedValue[key];
                            }
                            break;
                        }
                    }
                }
                return storedValue;
            };
        })(Update = Business.Update || (Business.Update = {}));
        var BaseUpdate = /** @class */ (function (_super) {
            __extends(BaseUpdate, _super);
            function BaseUpdate() {
                var _this = _super !== null && _super.apply(this, arguments) || this;
                _this._checkFlag = false;
                return _this;
            }
            return BaseUpdate;
        }(Business.Base));
        Business.BaseUpdate = BaseUpdate;
    })(Business = JsStore.Business || (JsStore.Business = {}));
})(JsStore || (JsStore = {}));
var JsStore;
(function (JsStore) {
    var Business;
    (function (Business) {
        var Update;
        (function (Update) {
            var NotWhere = /** @class */ (function (_super) {
                __extends(NotWhere, _super);
                function NotWhere() {
                    var _this = _super !== null && _super.apply(this, arguments) || this;
                    _this.executeWhereUndefinedLogic = function () {
                        var cursor, cursor_request = this._objectStore.openCursor();
                        cursor_request.onsuccess = function (e) {
                            cursor = e.target.result;
                            if (cursor) {
                                cursor.update(Update.updateValue(this._query.Set, cursor.value));
                                ++this._rowAffected;
                                cursor.continue();
                            }
                        }.bind(this);
                        cursor_request.onerror = function (e) {
                            this._errorOccured = true;
                            this.onErrorOccured(e);
                        }.bind(this);
                    };
                    return _this;
                }
                return NotWhere;
            }(Business.BaseUpdate));
            Update.NotWhere = NotWhere;
        })(Update = Business.Update || (Business.Update = {}));
    })(Business = JsStore.Business || (JsStore.Business = {}));
})(JsStore || (JsStore = {}));
var JsStore;
(function (JsStore) {
    var Business;
    (function (Business) {
        var Update;
        (function (Update) {
            var In = /** @class */ (function (_super) {
                __extends(In, _super);
                function In() {
                    var _this = _super !== null && _super.apply(this, arguments) || this;
                    _this.executeInLogic = function (column, values) {
                        var cursor, column_store = this._objectStore.index(column), cursor_request;
                        if (this._checkFlag) {
                            for (var i = 0, length = values.length; i < length; i++) {
                                if (!this._errorOccured) {
                                    cursor_request = column_store.openCursor(IDBKeyRange.only(values[i]));
                                    cursor_request.onsuccess = function (e) {
                                        cursor = e.target.result;
                                        if (cursor) {
                                            if (this.checkForWhereConditionMatch(cursor.value)) {
                                                cursor.update(Update.updateValue(this._query.Set, cursor.value));
                                                ++this._rowAffected;
                                            }
                                            cursor.continue();
                                        }
                                    }.bind(this);
                                }
                            }
                        }
                        else {
                            for (var i = 0, length = values.length; i < length; i++) {
                                if (!this._errorOccured) {
                                    cursor_request = column_store.openCursor(IDBKeyRange.only(values[i]));
                                    cursor_request.onsuccess = function (e) {
                                        cursor = e.target.result;
                                        if (cursor) {
                                            cursor.update(Update.updateValue(this._query.Set, cursor.value));
                                            ++this._rowAffected;
                                            cursor.continue();
                                        }
                                    }.bind(this);
                                }
                            }
                        }
                        cursor_request.onerror = function (e) {
                            this._errorOccured = true;
                            this.onErrorOccured(e);
                        }.bind(this);
                    };
                    return _this;
                }
                return In;
            }(Update.NotWhere));
            Update.In = In;
        })(Update = Business.Update || (Business.Update = {}));
    })(Business = JsStore.Business || (JsStore.Business = {}));
})(JsStore || (JsStore = {}));
var JsStore;
(function (JsStore) {
    var Business;
    (function (Business) {
        var Update;
        (function (Update) {
            var Like = /** @class */ (function (_super) {
                __extends(Like, _super);
                function Like() {
                    var _this = _super !== null && _super.apply(this, arguments) || this;
                    _this.executeLikeLogic = function (column, value, symbol) {
                        var cursor;
                        this._compValue = value.toLowerCase();
                        this._compValueLength = this._compValue.length;
                        this._compSymbol = symbol;
                        var cursor_open_request = this._objectStore.index(column).openCursor();
                        cursor_open_request.onerror = function (e) {
                            this._errorOccured = true;
                            this.onErrorOccured(e);
                        }.bind(this);
                        if (this._checkFlag) {
                            cursor_open_request.onsuccess = function (e) {
                                cursor = e.target.result;
                                if (cursor) {
                                    if (this.filterOnOccurence(cursor.key) &&
                                        this.checkForWhereConditionMatch(cursor.value)) {
                                        cursor.update(Update.updateValue(this._query.Set, cursor.value));
                                        ++this._rowAffected;
                                    }
                                    cursor.continue();
                                }
                            }.bind(this);
                        }
                        else {
                            cursor_open_request.onsuccess = function (e) {
                                cursor = e.target.result;
                                if (cursor) {
                                    if (this.filterOnOccurence(cursor.key)) {
                                        cursor.update(Update.updateValue(this._query.Set, cursor.value));
                                        ++this._rowAffected;
                                    }
                                    cursor.continue();
                                }
                            }.bind(this);
                        }
                    };
                    _this.filterOnOccurence = function (value) {
                        var found = false;
                        value = value.toLowerCase();
                        switch (this._compSymbol) {
                            case JsStore.Occurence.Any:
                                if (value.indexOf(this._compValue) >= 0) {
                                    found = true;
                                }
                                break;
                            case JsStore.Occurence.First:
                                if (value.indexOf(this._compValue) === 0) {
                                    found = true;
                                }
                                break;
                            default: if (value.lastIndexOf(this._compValue) === value.length - this._compValueLength) {
                                found = true;
                            }
                        }
                        return found;
                    };
                    return _this;
                }
                return Like;
            }(Update.In));
            Update.Like = Like;
        })(Update = Business.Update || (Business.Update = {}));
    })(Business = JsStore.Business || (JsStore.Business = {}));
})(JsStore || (JsStore = {}));
var JsStore;
(function (JsStore) {
    var Business;
    (function (Business) {
        var Update;
        (function (Update) {
            var Where = /** @class */ (function (_super) {
                __extends(Where, _super);
                function Where() {
                    var _this = _super !== null && _super.apply(this, arguments) || this;
                    _this.executeWhereLogic = function (column, value, op) {
                        var cursor, cursor_request;
                        value = op ? value[op] : value;
                        cursor_request = this._objectStore.index(column).openCursor(this.getKeyRange(value, op));
                        if (this._checkFlag) {
                            cursor_request.onsuccess = function (e) {
                                cursor = e.target.result;
                                if (cursor) {
                                    if (this.checkForWhereConditionMatch(cursor.value)) {
                                        cursor.update(Update.updateValue(this._query.Set, cursor.value));
                                        ++this._rowAffected;
                                    }
                                    cursor.continue();
                                }
                            }.bind(this);
                        }
                        else {
                            cursor_request.onsuccess = function (e) {
                                cursor = e.target.result;
                                if (cursor) {
                                    cursor.update(Update.updateValue(this._query.Set, cursor.value));
                                    ++this._rowAffected;
                                    cursor.continue();
                                }
                            }.bind(this);
                        }
                        cursor_request.onerror = function (e) {
                            this._errorOccured = true;
                            this.onErrorOccured(e);
                        }.bind(this);
                    };
                    return _this;
                }
                return Where;
            }(Update.Like));
            Update.Where = Where;
        })(Update = Business.Update || (Business.Update = {}));
    })(Business = JsStore.Business || (JsStore.Business = {}));
})(JsStore || (JsStore = {}));
var JsStore;
(function (JsStore) {
    var Business;
    (function (Business) {
        var Update;
        (function (Update) {
            var Instance = /** @class */ (function (_super) {
                __extends(Instance, _super);
                function Instance(query, onSuccess, onError) {
                    var _this = _super.call(this) || this;
                    _this.onTransactionCompleted = function () {
                        this._onSuccess(this._rowAffected);
                    };
                    _this.createtransactionForOrLogic = function (query) {
                        this._query = query;
                        try {
                            this._transaction = Business.db_connection.transaction([query.In], "readwrite");
                            this._transaction.oncomplete = this.onTransactionCompleted.bind(this);
                            this._transaction.ontimeout = this.onTransactionTimeout.bind(this);
                            this._objectStore = this._transaction.objectStore(query.In);
                            this.goToWhereLogic();
                        }
                        catch (ex) {
                            this.onExceptionOccured(ex, { TableName: query.From });
                        }
                    };
                    _this.executeOrLogic = function () {
                        var select_object = new Business.Select.Instance({
                            From: this._query.In,
                            Where: this._query.Where
                        }, function (results) {
                            var key = this.getPrimaryKey(this._query.In), in_query = [], where_qry = {};
                            results.forEach(function (value) {
                                in_query.push(value[key]);
                            });
                            where_qry[key] = { In: in_query };
                            this.createtransactionForOrLogic({
                                In: this._query.In,
                                Where: where_qry,
                                Set: this._query.Set
                            });
                        }.bind(this), this.OnError);
                    };
                    try {
                        _this._onSuccess = onSuccess;
                        _this._onError = onError;
                        _this.checkSchema(query.Set, query.In);
                        if (!_this._errorOccured) {
                            _this._query = query;
                            var that = _this;
                            var createTransaction = function () {
                                that._transaction = Business.db_connection.transaction([query.In], "readwrite");
                                that._objectStore = that._transaction.objectStore(query.In);
                                that._transaction.oncomplete = function (e) {
                                    that.onTransactionCompleted();
                                };
                                that._transaction.ontimeout = that.onTransactionTimeout;
                            };
                            if (query.Where) {
                                if (query.Where.Or) {
                                    _this.executeOrLogic();
                                }
                                else {
                                    createTransaction();
                                    _this.goToWhereLogic();
                                }
                            }
                            else {
                                createTransaction();
                                _this.executeWhereUndefinedLogic();
                            }
                        }
                        else {
                            _this.onErrorOccured(_this._error, true);
                        }
                    }
                    catch (ex) {
                        _this.onExceptionOccured(ex, { TableName: query.In });
                    }
                    return _this;
                }
                Instance.prototype.checkSchema = function (suppliedValue, tableName) {
                    if (suppliedValue) {
                        var current_table = this.getTable(tableName);
                        if (current_table) {
                            var onValidationError = function (err, details) {
                                this._errorOccured = true;
                                this._error = JsStore.Utils.getError(err, details);
                            }.bind(this);
                            // loop through table column and find data is valid
                            current_table._columns.every(function (column) {
                                if (!this._errorOccured) {
                                    if (column._name in suppliedValue) {
                                        var executeCheck = function (value) {
                                            // check not null schema
                                            if (column._notNull && JsStore.isNull(value)) {
                                                onValidationError(JsStore.ErrorType.NullValue, { ColumnName: column._name });
                                            }
                                            // check datatype
                                            if (column._dataType) {
                                                var type = typeof value;
                                                if (type !== column._dataType) {
                                                    if (type !== 'object') {
                                                        onValidationError(JsStore.ErrorType.BadDataType, { ColumnName: column._name });
                                                    }
                                                    else {
                                                        var allowed_prop = ['+', '-', '*', '/'];
                                                        for (var prop in value) {
                                                            if (allowed_prop.indexOf(prop) < 0) {
                                                                onValidationError(JsStore.ErrorType.BadDataType, { ColumnName: column._name });
                                                            }
                                                            break;
                                                        }
                                                    }
                                                }
                                            }
                                        };
                                        executeCheck(suppliedValue[column._name]);
                                    }
                                    return true;
                                }
                                else {
                                    return false;
                                }
                            }, this);
                        }
                        else {
                            var error = JsStore.Utils.getError(JsStore.ErrorType.TableNotExist, { TableName: tableName });
                            JsStore.throwError(Error);
                        }
                    }
                    else {
                        this._errorOccured = true;
                    }
                };
                return Instance;
            }(Update.Where));
            Update.Instance = Instance;
        })(Update = Business.Update || (Business.Update = {}));
    })(Business = JsStore.Business || (JsStore.Business = {}));
})(JsStore || (JsStore = {}));
var JsStore;
(function (JsStore) {
    var Business;
    (function (Business) {
        var Delete;
        (function (Delete) {
            var BaseDelete = /** @class */ (function (_super) {
                __extends(BaseDelete, _super);
                function BaseDelete() {
                    var _this = _super !== null && _super.apply(this, arguments) || this;
                    _this._checkFlag = false;
                    return _this;
                }
                return BaseDelete;
            }(Business.Base));
            Delete.BaseDelete = BaseDelete;
        })(Delete = Business.Delete || (Business.Delete = {}));
    })(Business = JsStore.Business || (JsStore.Business = {}));
})(JsStore || (JsStore = {}));
var JsStore;
(function (JsStore) {
    var Business;
    (function (Business) {
        var Delete;
        (function (Delete) {
            var NotWhere = /** @class */ (function (_super) {
                __extends(NotWhere, _super);
                function NotWhere() {
                    var _this = _super !== null && _super.apply(this, arguments) || this;
                    _this.executeWhereUndefinedLogic = function () {
                        var cursor, cursor_request = this._objectStore.openCursor();
                        cursor_request.onsuccess = function (e) {
                            cursor = e.target.result;
                            if (cursor) {
                                cursor.delete();
                                ++this._rowAffected;
                                cursor.continue();
                            }
                        }.bind(this);
                        cursor_request.onerror = function (e) {
                            this._errorOccured = true;
                            this.onErrorOccured(e);
                        }.bind(this);
                    };
                    return _this;
                }
                return NotWhere;
            }(Delete.BaseDelete));
            Delete.NotWhere = NotWhere;
        })(Delete = Business.Delete || (Business.Delete = {}));
    })(Business = JsStore.Business || (JsStore.Business = {}));
})(JsStore || (JsStore = {}));
var JsStore;
(function (JsStore) {
    var Business;
    (function (Business) {
        var Delete;
        (function (Delete) {
            var In = /** @class */ (function (_super) {
                __extends(In, _super);
                function In() {
                    var _this = _super !== null && _super.apply(this, arguments) || this;
                    _this.executeInLogic = function (column, values) {
                        var cursor, cursor_request;
                        if (this._checkFlag) {
                            for (var i = 0, length = values.length; i < length; i++) {
                                if (!this._errorOccured) {
                                    cursor_request = this._objectStore.index(column).
                                        openCursor(IDBKeyRange.only(values[i]));
                                    cursor_request.onsuccess = function (e) {
                                        cursor = e.target.result;
                                        if (cursor) {
                                            if (this.checkForWhereConditionMatch(cursor.value)) {
                                                cursor.delete();
                                                ++this._rowAffected;
                                            }
                                            cursor.continue();
                                        }
                                    }.bind(this);
                                }
                            }
                        }
                        else {
                            for (var i = 0, length = values.length; i < length; i++) {
                                if (!this._errorOccured) {
                                    cursor_request = this._objectStore.index(column).
                                        openCursor(IDBKeyRange.only(values[i]));
                                    cursor_request.onsuccess = function (e) {
                                        cursor = e.target.result;
                                        if (cursor) {
                                            cursor.delete();
                                            ++this._rowAffected;
                                            cursor.continue();
                                        }
                                    }.bind(this);
                                }
                            }
                        }
                        cursor_request.onerror = function (e) {
                            this._errorOccured = true;
                            this.onErrorOccured(e);
                        }.bind(this);
                    };
                    return _this;
                }
                return In;
            }(Delete.NotWhere));
            Delete.In = In;
        })(Delete = Business.Delete || (Business.Delete = {}));
    })(Business = JsStore.Business || (JsStore.Business = {}));
})(JsStore || (JsStore = {}));
var JsStore;
(function (JsStore) {
    var Business;
    (function (Business) {
        var Delete;
        (function (Delete) {
            var Like = /** @class */ (function (_super) {
                __extends(Like, _super);
                function Like() {
                    var _this = _super !== null && _super.apply(this, arguments) || this;
                    _this.executeLikeLogic = function (column, value, symbol) {
                        var cursor;
                        this._compValue = value.toLowerCase();
                        this._compValueLength = this._compValue.length;
                        this._compSymbol = symbol;
                        this.cursor_request = this._objectStore.index(column).openCursor();
                        this.cursor_request.onerror = function (e) {
                            this._errorOccured = true;
                            this.onErrorOccured(e);
                        }.bind(this);
                        if (this._checkFlag) {
                            this.cursor_request.onsuccess = function (e) {
                                cursor = e.target.result;
                                if (cursor) {
                                    if (this.filterOnOccurence(cursor.key) &&
                                        this.checkForWhereConditionMatch(cursor.value)) {
                                        cursor.delete();
                                        ++this._rowAffected;
                                    }
                                    cursor.continue();
                                }
                            }.bind(this);
                        }
                        else {
                            this.cursor_request.onsuccess = function (e) {
                                cursor = e.target.result;
                                if (cursor) {
                                    if (this.filterOnOccurence(cursor.key)) {
                                        cursor.delete();
                                        ++this._rowAffected;
                                    }
                                    cursor.continue();
                                }
                            }.bind(this);
                        }
                    };
                    _this.filterOnOccurence = function (value) {
                        var found = false;
                        value = value.toLowerCase();
                        switch (this._compSymbol) {
                            case JsStore.Occurence.Any:
                                if (value.indexOf(this._compValue) >= 0) {
                                    found = true;
                                }
                                break;
                            case JsStore.Occurence.First:
                                if (value.indexOf(this._compValue) === 0) {
                                    found = true;
                                }
                                break;
                            default: if (value.lastIndexOf(this._compValue) === value.length - this._compValueLength) {
                                found = true;
                            }
                        }
                        return found;
                    };
                    return _this;
                }
                return Like;
            }(Delete.In));
            Delete.Like = Like;
        })(Delete = Business.Delete || (Business.Delete = {}));
    })(Business = JsStore.Business || (JsStore.Business = {}));
})(JsStore || (JsStore = {}));
var JsStore;
(function (JsStore) {
    var Business;
    (function (Business) {
        var Delete;
        (function (Delete) {
            var Where = /** @class */ (function (_super) {
                __extends(Where, _super);
                function Where() {
                    var _this = _super !== null && _super.apply(this, arguments) || this;
                    _this.executeWhereLogic = function (column, value, op) {
                        var cursor, cursor_request;
                        value = op ? value[op] : value;
                        cursor_request = this._objectStore.index(column).openCursor(this.getKeyRange(value, op));
                        if (this._checkFlag) {
                            cursor_request.onsuccess = function (e) {
                                cursor = e.target.result;
                                if (cursor) {
                                    if (this.checkForWhereConditionMatch(cursor.value)) {
                                        cursor.delete();
                                        ++this._rowAffected;
                                    }
                                    cursor.continue();
                                }
                            }.bind(this);
                        }
                        else {
                            cursor_request.onsuccess = function (e) {
                                cursor = e.target.result;
                                if (cursor) {
                                    cursor.delete();
                                    ++this._rowAffected;
                                    cursor.continue();
                                }
                            }.bind(this);
                        }
                        cursor_request.onerror = function (e) {
                            this._errorOccured = true;
                            this.onErrorOccured(e);
                        }.bind(this);
                    };
                    return _this;
                }
                return Where;
            }(Delete.Like));
            Delete.Where = Where;
        })(Delete = Business.Delete || (Business.Delete = {}));
    })(Business = JsStore.Business || (JsStore.Business = {}));
})(JsStore || (JsStore = {}));
var JsStore;
(function (JsStore) {
    var Business;
    (function (Business) {
        var Delete;
        (function (Delete) {
            var Instance = /** @class */ (function (_super) {
                __extends(Instance, _super);
                function Instance(query, onSuccess, onError) {
                    var _this = _super.call(this) || this;
                    _this.onTransactionCompleted = function () {
                        this._onSuccess(this._rowAffected);
                    };
                    _this.createtransactionForOrLogic = function (query) {
                        this._query = query;
                        try {
                            this._transaction = Business.db_connection.transaction([query.From], "readwrite");
                            this._transaction.oncomplete = this.onTransactionCompleted.bind(this);
                            (this._transaction).ontimeout = this.onTransactionTimeout.bind(this);
                            this._objectStore = this._transaction.objectStore(query.From);
                            this.goToWhereLogic();
                        }
                        catch (ex) {
                            this.onExceptionOccured(ex, { TableName: query.From });
                        }
                    };
                    _this.executeOrLogic = function () {
                        this.OrInfo = {
                            OrQuery: this._query.Where.Or,
                            OnSucess: this._onSuccess
                        };
                        this.TmpQry = {
                            From: this._query.From,
                            Where: {}
                        };
                        var onSuccess = function () {
                            var key = JsStore.getObjectFirstKey(this.OrInfo.OrQuery);
                            if (key != null) {
                                this.TmpQry['Where'][key] = this.OrInfo.OrQuery[key];
                                delete this.OrInfo.OrQuery[key];
                                this.createtransactionForOrLogic(this.TmpQry);
                            }
                            else {
                                this.OrInfo.OnSucess(this._rowAffected);
                            }
                        };
                        // free or memory
                        this._query.Where.Or = undefined;
                        this._onSuccess = onSuccess;
                    };
                    try {
                        _this._query = query;
                        _this._onSuccess = onSuccess;
                        _this._onError = onError;
                        _this._transaction = Business.db_connection.transaction([query.From], "readwrite");
                        _this._objectStore = _this._transaction.objectStore(query.From);
                        _this._transaction.oncomplete = _this.onTransactionCompleted.bind(_this);
                        _this._transaction.onerror = _this.onErrorOccured.bind(_this);
                        if (query.Where) {
                            if (query.Where.Or) {
                                _this.executeOrLogic();
                            }
                            _this.goToWhereLogic();
                        }
                        else {
                            _this.executeWhereUndefinedLogic();
                        }
                    }
                    catch (ex) {
                        _this.onExceptionOccured(ex, { TableName: query.From });
                    }
                    return _this;
                }
                return Instance;
            }(Delete.Where));
            Delete.Instance = Instance;
        })(Delete = Business.Delete || (Business.Delete = {}));
    })(Business = JsStore.Business || (JsStore.Business = {}));
})(JsStore || (JsStore = {}));
var JsStore;
(function (JsStore) {
    JsStore.worker_status = JsStore.WebWorkerStatus.NotStarted;
    var CodeExecutionHelper = /** @class */ (function () {
        function CodeExecutionHelper() {
            this._requestQueue = [];
            this._isCodeExecuting = false;
            this.pushApi = function (request, usePromise) {
                if (usePromise === true) {
                    return new Promise(function (resolve, reject) {
                        request.OnSuccess = function (result) {
                            resolve(result);
                        };
                        request.OnError = function (error) {
                            reject(error);
                        };
                        this.prcoessExecutionOfCode(request);
                    }.bind(this));
                }
                else {
                    this.prcoessExecutionOfCode(request);
                    return this;
                }
            };
            this.createWorker = function () {
                try {
                    if (Worker) {
                        var script_url = this.getScriptUrl();
                        if (script_url && script_url.length > 0) {
                            JsStore.worker_instance = new Worker(script_url);
                            JsStore.worker_instance.onmessage = function (msg) {
                                this.onMessageFromWorker(msg);
                            }.bind(this);
                            this.executeCodeUsingWorker({
                                Name: 'change_log_status',
                                Query: {
                                    logging: JsStore.enable_log
                                }
                            });
                            setTimeout(function () {
                                if (JsStore.worker_status !== JsStore.WebWorkerStatus.Failed) {
                                    JsStore.worker_status = JsStore.WebWorkerStatus.Registered;
                                }
                                if (JsStore.status.ConStatus === JsStore.ConnectionStatus.Connected) {
                                    this.executeCode();
                                }
                            }.bind(this), 100);
                        }
                        else {
                            this.onWorkerFailed();
                        }
                    }
                    else {
                        this.onWorkerFailed();
                    }
                }
                catch (ex) {
                    this.onWorkerFailed();
                }
            };
            this.prcoessExecutionOfCode = function (request) {
                if (JsStore.status.ConStatus === JsStore.ConnectionStatus.NotStarted) {
                    switch (request.Name) {
                        case 'create_db':
                        case 'open_db':
                            this._requestQueue.splice(0, 0, request);
                            if (JsStore.worker_status !== JsStore.WebWorkerStatus.NotStarted) {
                                this.executeCode();
                            }
                            JsStore.status.ConStatus = JsStore.ConnectionStatus.Connected;
                            break;
                        default: this._requestQueue.push(request);
                    }
                }
                else {
                    this._requestQueue.push(request);
                    if (this._requestQueue.length === 1 && JsStore.worker_status !== JsStore.WebWorkerStatus.NotStarted) {
                        this.executeCode();
                    }
                }
                JsStore.log("request pushed: " + request.Name);
            };
            this.executeCode = function () {
                if (!this._isCodeExecuting && this._requestQueue.length > 0) {
                    this._isCodeExecuting = true;
                    var first_request = this._requestQueue[0], request = {
                        Name: first_request.Name,
                        Query: first_request.Query
                    };
                    JsStore.log("request executing : " + first_request.Name);
                    if (JsStore.worker_status === JsStore.WebWorkerStatus.Registered) {
                        this.executeCodeUsingWorker(request);
                    }
                    else {
                        this.executeCodeDirect(request);
                    }
                }
            };
            this.executeCodeDirect = function (request) {
                new JsStore.Business.Main(function (results) {
                    this.processFinishedRequest(results);
                }.bind(this)).checkConnectionAndExecuteLogic(request);
            };
            this.executeCodeUsingWorker = function (request) {
                JsStore.worker_instance.postMessage(request);
            };
            this.processFinishedRequest = function (message) {
                var finished_request = this._requestQueue.shift();
                this._isCodeExecuting = false;
                if (finished_request) {
                    JsStore.log("request finished : " + finished_request.Name);
                    if (message.ErrorOccured) {
                        if (finished_request.OnError) {
                            finished_request.OnError(message.ErrorDetails);
                        }
                    }
                    else {
                        if (finished_request.OnSuccess) {
                            finished_request.OnSuccess(message.ReturnedValue);
                        }
                    }
                    this.executeCode();
                }
            };
            this.onWorkerFailed = function () {
                console.warn('JsStore is not runing in web worker');
                JsStore.worker_status = JsStore.WebWorkerStatus.Failed;
                if (JsStore.status.ConStatus === JsStore.ConnectionStatus.NotStarted) {
                    this.executeCode();
                }
            };
            this.onMessageFromWorker = function (msg) {
                if (typeof msg.data === 'string') {
                    var datas = msg.data.split(':')[1];
                    switch (datas) {
                        case 'WorkerFailed':
                            this.onWorkerFailed();
                            break;
                    }
                }
                else {
                    this.processFinishedRequest(msg.data);
                }
            };
        }
        CodeExecutionHelper.prototype.getScriptUrl = function (fileName) {
            var script_url = "";
            var file_name = fileName ? fileName.toLowerCase() : "jsstore";
            var scripts = document.getElementsByTagName('script');
            for (var i = scripts.length - 1, url = ""; i >= 0; i--) {
                url = scripts[i].src;
                url = url.substring(url.lastIndexOf('/') + 1).toLowerCase();
                if (url.length > 0 && url.indexOf(file_name) >= 0) {
                    script_url = scripts[i].src;
                    return script_url;
                }
            }
            return script_url;
        };
        return CodeExecutionHelper;
    }());
    JsStore.CodeExecutionHelper = CodeExecutionHelper;
})(JsStore || (JsStore = {}));
var Model = JsStore.Model;
var DataBase = Model.DataBase;
var Column = Model.Column;
var Table = Model.Table;
var JsStore;
(function (JsStore) {
    var Instance = /** @class */ (function (_super) {
        __extends(Instance, _super);
        function Instance(dbName) {
            if (dbName === void 0) { dbName = null; }
            var _this = _super.call(this) || this;
            /**
             * open database
             *
             * @param {string} dbName
             * @param {Function} [onSuccess=null]
             * @param {Function} [onError=null]
             * @returns
             * @memberof Instance
             */
            _this.openDb = function (dbName, onSuccess, onError) {
                return this.pushApi({
                    Name: 'open_db',
                    Query: dbName,
                    OnSuccess: onSuccess,
                    OnError: onError,
                }, false);
            };
            /**
             * creates DataBase
             *
             * @param {Model.IDataBase} dataBase
             * @param {Function} [onSuccess=null]
             * @param {Function} [onError=null]
             * @returns
             * @memberof Instance
             */
            _this.createDb = function (dataBase, onSuccess, onError) {
                return this.pushApi({
                    Name: 'create_db',
                    OnSuccess: onSuccess,
                    OnError: onError,
                    Query: dataBase
                }, false);
            };
            /**
             * drop dataBase
             *
             * @param {Function} onSuccess
             * @param {Function} [onError=null]
             * @memberof Instance
             */
            _this.dropDb = function (onSuccess, onError) {
                var use_promise = onSuccess ? false : true;
                return this.pushApi({
                    Name: 'drop_db',
                    Query: null,
                    OnSuccess: onSuccess,
                    OnError: onError
                }, use_promise);
            };
            /**
             * select data from table
             *
             * @param {IQuery} query
             * @param {Function} [onSuccess=null]
             * @param {Function} [onError=null]
             *
             * @memberOf Main
             */
            _this.select = function (query, onSuccess, onError) {
                onSuccess = query.OnSuccess ? query.OnSuccess : onSuccess;
                onError = query.OnError ? query.OnError : onError;
                query.OnSuccess = query.OnError = null;
                var use_promise = onSuccess ? false : true;
                return this.pushApi({
                    Name: 'select',
                    Query: query,
                    OnSuccess: onSuccess,
                    OnError: onError
                }, use_promise);
            };
            /**
             * get no of result from table
             *
             * @param {ICount} query
             * @param {Function} [onSuccess=null]
             * @param {Function} [onError=null]
             * @memberof Instance
             */
            _this.count = function (query, onSuccess, onError) {
                onSuccess = query.OnSuccess ? query.OnSuccess : onSuccess;
                onError = query.OnError ? query.OnError : onError;
                query.OnSuccess = query.OnError = null;
                var use_promise = onSuccess ? false : true;
                return this.pushApi({
                    Name: 'count',
                    Query: query,
                    OnSuccess: onSuccess,
                    OnError: onError
                }, use_promise);
            };
            /**
             * insert data into table
             *
             * @param {IInsert} query
             * @param {Function} [onSuccess=null]
             * @param {Function} [onError=null]
             * @memberof Instance
             */
            _this.insert = function (query, onSuccess, onError) {
                onSuccess = query.OnSuccess ? query.OnSuccess : onSuccess;
                onError = query.OnError ? query.OnError : onError;
                query.OnSuccess = query.OnError = null;
                var use_promise = onSuccess ? false : true;
                return this.pushApi({
                    Name: 'insert',
                    Query: query,
                    OnSuccess: onSuccess,
                    OnError: onError
                }, use_promise);
            };
            /**
             * update data into table
             *
             * @param {IUpdate} query
             * @param {Function} [onSuccess=null]
             * @param {Function} [onError=null]
             * @memberof Instance
             */
            _this.update = function (query, onSuccess, onError) {
                onSuccess = query.OnSuccess ? query.OnSuccess : onSuccess;
                onError = query.OnError ? query.OnError : onError;
                query.OnSuccess = query.OnError = null;
                var use_promise = onSuccess ? false : true;
                return this.pushApi({
                    Name: 'update',
                    Query: query,
                    OnSuccess: onSuccess,
                    OnError: onError
                }, use_promise);
            };
            /**
             * delete data from table
             *
             * @param {IDelete} query
             * @param {Function} [onSuccess=null]
             * @param {Function} onError
             * @memberof Instance
             */
            _this.delete = function (query, onSuccess, onError) {
                onSuccess = query.OnSuccess ? query.OnSuccess : onSuccess;
                onError = query.OnError ? query.OnError : onError;
                query.OnSuccess = query.OnError = null;
                var use_promise = onSuccess ? false : true;
                return this.pushApi({
                    Name: 'delete',
                    Query: query,
                    OnSuccess: onSuccess,
                    OnError: onError
                }, use_promise);
            };
            /**
             * delete all data from table
             *
             * @param {string} tableName
             * @param {Function} [onSuccess=null]
             * @param {Function} [onError=null]
             * @memberof Instance
             */
            _this.clear = function (tableName, onSuccess, onError) {
                var use_promise = onSuccess ? false : true;
                return this.pushApi({
                    Name: 'clear',
                    Query: tableName,
                    OnSuccess: onSuccess,
                    OnError: onError
                }, use_promise);
            };
            /**
             * insert bulk amount of data
             *
             * @param {IInsert} query
             * @param {Function} [onSuccess=null]
             * @param {Function} [onError=null]
             * @returns
             * @memberof Instance
             */
            _this.bulkInsert = function (query, onSuccess, onError) {
                onSuccess = query.OnSuccess ? query.OnSuccess : onSuccess;
                onError = query.OnError ? query.OnError : onError;
                var use_promise = onSuccess ? false : true;
                query.OnSuccess = query.OnError = null;
                return this.pushApi({
                    Name: 'bulk_insert',
                    Query: query,
                    OnSuccess: onSuccess,
                    OnError: onError
                }, use_promise);
            };
            /**
             * export the result in json file
             *
             * @param {ISelect} qry
             * @memberof Instance
             */
            _this.exportJson = function (query) {
                var onSuccess = function (url) {
                    var link = document.createElement("a");
                    link.href = url;
                    link.download = query.From + ".json";
                    link.click();
                    if (onSuccessCallBack) {
                        onSuccessCallBack(null);
                    }
                }, onError = query['OnError'], onSuccessCallBack = query['OnSuccess'];
                query['OnSuccess'] = query['OnError'] = undefined;
                var use_promise = onSuccessCallBack ? false : true;
                if (use_promise) {
                    return new Promise(function (resolve, reject) {
                        this.pushApi({
                            Name: 'export_json',
                            Query: query,
                            OnSuccess: onSuccess,
                            OnError: onError
                        }, use_promise).then(function (url) {
                            onSuccess(url);
                            resolve();
                        }).catch(function (err) {
                            reject(err);
                        });
                    });
                }
                else {
                    this.pushApi({
                        Name: 'export_json',
                        Query: query,
                        OnSuccess: onSuccess,
                        OnError: onError
                    }, use_promise);
                }
            };
            if (JsStore.worker_status === JsStore.WebWorkerStatus.Registered) {
                JsStore.worker_instance.terminate();
            }
            else if (JsStore.worker_status === JsStore.WebWorkerStatus.NotStarted) {
                KeyStore.init();
            }
            _this.createWorker();
            if (dbName) {
                _this.openDb(dbName, null, null);
            }
            return _this;
        }
        return Instance;
    }(JsStore.CodeExecutionHelper));
    JsStore.Instance = Instance;
})(JsStore || (JsStore = {}));
if (self && !self.alert) {
    self.onmessage = function (e) {
        JsStore.log("Request executing from WebWorker, request name: " + e.data.Name);
        var request = e.data, business_main = new JsStore.Business.Main();
        business_main.checkConnectionAndExecuteLogic(request);
    };
    JsStore.worker_status = JsStore.WebWorkerStatus.Registered;
    KeyStore.init();
}
//# sourceMappingURL=jsstore.js.map