"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const verus_typescript_primitives_1 = require("verus-typescript-primitives");
const flags_1 = require("./utils/flags");
class VerusdRpcInterface {
    constructor(chain, baseURL, config, rpcRequest) {
        this.currencycache = new Map();
        this.converterscache = new Map();
        this.listcurrenciescache = new Map();
        this.infocache = null;
        if (rpcRequest)
            this.rpcRequestOverride = rpcRequest;
        else {
            this.instance = axios_1.default.create(Object.assign({ baseURL, headers: {
                    "Content-type": "application/json",
                } }, config));
        }
        this.currid = 0;
        this.chain = chain;
    }
    request(req) {
        return __awaiter(this, void 0, void 0, function* () {
            const id = this.currid;
            this.currid += 1;
            const body = {
                jsonrpc: "1.0",
                id,
                params: req.getParams(),
                method: req.cmd,
            };
            if (this.rpcRequestOverride)
                return this.rpcRequestOverride(body);
            try {
                const res = yield this.instance.post("/", body);
                if (res.status != 200) {
                    const error = {
                        id,
                        result: null,
                        error: {
                            code: res.status,
                            message: `Network error ${res.status}`,
                            data: res.data,
                        },
                    };
                    return error;
                }
                else {
                    const response = res.data;
                    return response;
                }
            }
            catch (e) {
                const error = {
                    id,
                    result: null,
                    error: {
                        code: -32603,
                        message: e.message,
                    },
                };
                return error;
            }
        });
    }
    getAddressBalance(...args) {
        return this.request(new verus_typescript_primitives_1.GetAddressBalanceRequest(this.chain, ...args));
    }
    getAddressDeltas(...args) {
        return this.request(new verus_typescript_primitives_1.GetAddressDeltasRequest(this.chain, ...args));
    }
    getAddressMempool(...args) {
        return this.request(new verus_typescript_primitives_1.GetAddressMempoolRequest(this.chain, ...args));
    }
    getAddressUtxos(...args) {
        return this.request(new verus_typescript_primitives_1.GetAddressUtxosRequest(this.chain, ...args));
    }
    getBlock(...args) {
        return this.request(new verus_typescript_primitives_1.GetBlockRequest(this.chain, ...args));
    }
    getVdxfId(...args) {
        return this.request(new verus_typescript_primitives_1.GetVdxfIdRequest(this.chain, ...args));
    }
    getIdentity(...args) {
        return this.request(new verus_typescript_primitives_1.GetIdentityRequest(this.chain, ...args));
    }
    getIdentityContent(...args) {
        return this.request(new verus_typescript_primitives_1.GetIdentityContentRequest(this.chain, ...args));
    }
    getCurrency(...args) {
        return this.request(new verus_typescript_primitives_1.GetCurrencyRequest(this.chain, ...args));
    }
    getInfo(...args) {
        return this.request(new verus_typescript_primitives_1.GetInfoRequest(this.chain, ...args));
    }
    getOffers(...args) {
        return this.request(new verus_typescript_primitives_1.GetOffersRequest(this.chain, ...args));
    }
    getRawTransaction(...args) {
        return this.request(new verus_typescript_primitives_1.GetRawTransactionRequest(this.chain, ...args));
    }
    makeOffer(...args) {
        return this.request(new verus_typescript_primitives_1.MakeOfferRequest(this.chain, ...args));
    }
    sendRawTransaction(...args) {
        return this.request(new verus_typescript_primitives_1.SendRawTransactionRequest(this.chain, ...args));
    }
    fundRawTransaction(...args) {
        return this.request(new verus_typescript_primitives_1.FundRawTransactionRequest(this.chain, ...args));
    }
    sendCurrency(...args) {
        return this.request(new verus_typescript_primitives_1.SendCurrencyRequest(this.chain, ...args));
    }
    getCurrencyConverters(...args) {
        return this.request(new verus_typescript_primitives_1.GetCurrencyConvertersRequest(this.chain, ...args));
    }
    listCurrencies(...args) {
        return this.request(new verus_typescript_primitives_1.ListCurrenciesRequest(this.chain, ...args));
    }
    estimateConversion(...args) {
        return this.request(new verus_typescript_primitives_1.EstimateConversionRequest(this.chain, ...args));
    }
    static extractRpcResult(res) {
        if (res.error)
            throw new Error(res.error.message);
        else
            return res.result;
    }
    getCachedCurrency(...args) {
        return __awaiter(this, void 0, void 0, function* () {
            const [iaddr] = args;
            if (this.currencycache.has(iaddr)) {
                return this.currencycache.get(iaddr);
            }
            const response = yield this.request(new verus_typescript_primitives_1.GetCurrencyRequest(this.chain, ...args));
            if (response.result) {
                this.currencycache.set(iaddr, response);
            }
            return response;
        });
    }
    getCachedInfo(...args) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.infocache != null) {
                return this.infocache;
            }
            const response = yield this.request(new verus_typescript_primitives_1.GetInfoRequest(this.chain, ...args));
            if (response.result) {
                this.infocache = response;
            }
            return response;
        });
    }
    getCachedListCurrencies(...args) {
        return __awaiter(this, void 0, void 0, function* () {
            const key = JSON.stringify(args);
            if (this.listcurrenciescache.has(key)) {
                return this.listcurrenciescache.get(key);
            }
            const response = yield this.request(new verus_typescript_primitives_1.ListCurrenciesRequest(this.chain, ...args));
            if (response.result) {
                this.listcurrenciescache.set(key, response);
            }
            return response;
        });
    }
    getAllCachedListCurrencies() {
        return __awaiter(this, void 0, void 0, function* () {
            const localCurrencies = VerusdRpcInterface.extractRpcResult(yield this.getCachedListCurrencies({ systemtype: "local" }));
            const pbaasCurrencies = VerusdRpcInterface.extractRpcResult(yield this.getCachedListCurrencies({ systemtype: "pbaas" }));
            const importedCurrencies = VerusdRpcInterface.extractRpcResult(yield this.getCachedListCurrencies({ systemtype: "imported" }));
            const allCurrencies = [...localCurrencies, ...pbaasCurrencies, ...importedCurrencies];
            const seenCurrencies = new Set();
            return allCurrencies.filter(x => {
                if (seenCurrencies.has(x.currencydefinition.currencyid))
                    return false;
                else {
                    seenCurrencies.add(x.currencydefinition.currencyid);
                    return true;
                }
            });
        });
    }
    getCachedCurrencyConverters(...args) {
        return __awaiter(this, void 0, void 0, function* () {
            const key = JSON.stringify(args);
            if (this.converterscache.has(key)) {
                return this.converterscache.get(key);
            }
            const allCurrencies = yield this.getAllCachedListCurrencies();
            const root = (VerusdRpcInterface.extractRpcResult(yield this.getCachedCurrency(this.chain)));
            const chainInfo = (VerusdRpcInterface.extractRpcResult(yield this.getCachedInfo()));
            // Try to cache locally constructed converter responses
            for (const source of allCurrencies) {
                const sourceDefinition = source.currencydefinition;
                const converters = [];
                for (const dest of allCurrencies) {
                    const destDefinition = dest.currencydefinition;
                    if (destDefinition.currencies &&
                        destDefinition.currencies.includes(sourceDefinition.currencyid) &&
                        dest.bestcurrencystate) {
                        if (destDefinition.startblock > chainInfo.longestchain &&
                            !(destDefinition.maxpreconversion && destDefinition.maxpreconversion.reduce((sum, a) => sum + a, 0) === 0)) {
                            converters.push({
                                [destDefinition.name]: Object.assign(Object.assign({}, destDefinition), { bestcurrencystate: dest.bestcurrencystate })
                            });
                        }
                        else if ((0, flags_1.checkFlag)(destDefinition.options, flags_1.IS_FRACTIONAL_FLAG)) {
                            const targetReserve = dest.bestcurrencystate.reservecurrencies.find(x => x.currencyid === root.currencyid);
                            const systemReserve = dest.bestcurrencystate.reservecurrencies.find(x => x.currencyid === this.chain);
                            if (targetReserve && targetReserve.weight > 0.1 && systemReserve && systemReserve.reserves > 1000) {
                                converters.push({
                                    [destDefinition.name]: Object.assign(Object.assign({}, destDefinition), { bestcurrencystate: dest.bestcurrencystate })
                                });
                            }
                        }
                    }
                }
                const params = [[sourceDefinition.currencyid]];
                const converterResponse = {
                    id: 0,
                    result: converters,
                    error: null
                };
                this.converterscache.set(JSON.stringify(params), converterResponse);
            }
            if (!this.converterscache.has(key)) {
                const response = yield this.request(new verus_typescript_primitives_1.GetCurrencyConvertersRequest(this.chain, ...args));
                if (response.result) {
                    this.converterscache.set(key, response);
                }
                return response;
            }
            else {
                return this.converterscache.get(key);
            }
        });
    }
    getCurrencyConversionPathsRec(src, dest, includeVia = true, ignoreCurrencies = [], via, root) {
        return __awaiter(this, void 0, void 0, function* () {
            const currChainDefinition = (VerusdRpcInterface.extractRpcResult(yield this.getCachedCurrency(this.chain)));
            const fractionalSource = (0, flags_1.checkFlag)(src.options, flags_1.IS_FRACTIONAL_FLAG) && (src.systemid === currChainDefinition.currencyid);
            const paths = VerusdRpcInterface.extractRpcResult(yield this.getCachedCurrencyConverters(dest == null ? [src.currencyid] : [src.currencyid, dest.currencyid]));
            let convertables = {};
            function addConvertable(key, convertable) {
                if (convertables[key] == null) {
                    convertables[key] = [convertable];
                }
                else {
                    convertables[key].push(convertable);
                }
            }
            function mergeConvertables(x, y) {
                const merged = {};
                for (const key in x) {
                    if (y[key]) {
                        merged[key] = x[key];
                        for (const conv of y[key]) {
                            const existingConvertable = x[key].find(x => {
                                return x.destination === conv.destination && x.via === conv.via && x.exportto === conv.exportto;
                            });
                            if (existingConvertable == null)
                                merged[key].push(conv);
                        }
                    }
                    else {
                        merged[key] = x[key];
                    }
                }
                for (const key in y) {
                    if (!merged[key]) {
                        merged[key] = y[key];
                    }
                }
                convertables = merged;
            }
            destination_iterator: for (const path of paths) {
                const currencyName = Object.keys(path)[0];
                const fullCurrencyDefinition = (VerusdRpcInterface.extractRpcResult(yield this.getCachedCurrency(path[currencyName].currencyid)));
                let pricingCurrencyState;
                let price;
                let viapriceinroot;
                let destpriceinvia;
                if (via) {
                    if (via.bestcurrencystate) {
                        pricingCurrencyState = via.bestcurrencystate;
                    }
                    else {
                        pricingCurrencyState = (VerusdRpcInterface.extractRpcResult(yield this.getCachedCurrency(via.currencyid))).bestcurrencystate;
                    }
                    // If the pricingCurrency doesn't contain the destination
                    // in it's reserves, we can't use it for via
                    if (pricingCurrencyState.currencies[fullCurrencyDefinition.currencyid] == null) {
                        continue;
                    }
                    viapriceinroot = 1 / pricingCurrencyState.currencies[root.currencyid].lastconversionprice;
                    destpriceinvia = pricingCurrencyState.currencies[fullCurrencyDefinition.currencyid].lastconversionprice;
                    price =
                        1 /
                            (pricingCurrencyState.currencies[root.currencyid].lastconversionprice /
                                pricingCurrencyState.currencies[fullCurrencyDefinition.currencyid]
                                    .lastconversionprice);
                }
                else {
                    if (fullCurrencyDefinition.bestcurrencystate) {
                        pricingCurrencyState = fullCurrencyDefinition.bestcurrencystate;
                    }
                    else {
                        pricingCurrencyState = (VerusdRpcInterface.extractRpcResult(yield this.getCachedCurrency(fullCurrencyDefinition.currencyid))).bestcurrencystate;
                    }
                    price = 1 / pricingCurrencyState.currencies[src.currencyid].lastconversionprice;
                }
                const gateway = (0, flags_1.checkFlag)(fullCurrencyDefinition.options, flags_1.IS_GATEWAY_FLAG);
                const gatewayConverter = ((0, flags_1.checkFlag)(fullCurrencyDefinition.options, flags_1.IS_GATEWAY_CONVERTER_FLAG) ||
                    (0, flags_1.checkFlag)(src.options, flags_1.IS_GATEWAY_CONVERTER_FLAG) ||
                    (via != null && (0, flags_1.checkFlag)(via.options, flags_1.IS_GATEWAY_CONVERTER_FLAG)));
                const fractionalConverter = via ? via : fullCurrencyDefinition;
                addConvertable(fullCurrencyDefinition.currencyid, {
                    via,
                    destination: fullCurrencyDefinition,
                    exportto: (gateway || gatewayConverter) ?
                        (VerusdRpcInterface.extractRpcResult(yield this.getCachedCurrency(gateway ?
                            fullCurrencyDefinition.currencyid
                            :
                                fractionalConverter.parent === this.chain ? fractionalConverter.launchsystemid : fractionalConverter.parent)))
                        :
                            undefined,
                    price,
                    gateway,
                    viapriceinroot,
                    destpriceinvia
                });
                // If gateway converter, allow converting to same currency, on current system
                if (gateway || gatewayConverter) {
                    const convertableArr = convertables[fullCurrencyDefinition.currencyid];
                    const existingOnChainConversion = convertableArr != null ?
                        convertableArr.find(x => x.exportto == null)
                        :
                            null;
                    if (existingOnChainConversion == null) {
                        addConvertable(fullCurrencyDefinition.currencyid, {
                            via,
                            destination: fullCurrencyDefinition,
                            price,
                            gateway: false,
                            viapriceinroot,
                            destpriceinvia
                        });
                    }
                }
            }
            if (fractionalSource && dest == null) {
                let price;
                let viapriceinroot;
                let destpriceinvia;
                for (const reserve of src.currencies) {
                    let pricingCurrencyState;
                    if (!ignoreCurrencies.includes(reserve)) {
                        if (via) {
                            if (via.bestcurrencystate) {
                                pricingCurrencyState = via.bestcurrencystate;
                            }
                            else {
                                pricingCurrencyState = (VerusdRpcInterface.extractRpcResult(yield this.getCachedCurrency(via.currencyid))).bestcurrencystate;
                            }
                            viapriceinroot = 1 / pricingCurrencyState.currencies[root.currencyid].lastconversionprice;
                            destpriceinvia = pricingCurrencyState.currencies[reserve].lastconversionprice;
                            price =
                                1 /
                                    (pricingCurrencyState.currencies[root.currencyid]
                                        .lastconversionprice /
                                        pricingCurrencyState.currencies[reserve]
                                            .lastconversionprice);
                        }
                        else {
                            if (src.bestcurrencystate) {
                                pricingCurrencyState = src.bestcurrencystate;
                            }
                            else {
                                pricingCurrencyState = (VerusdRpcInterface.extractRpcResult(yield this.getCachedCurrency(src.currencyid))).bestcurrencystate;
                            }
                            price =
                                pricingCurrencyState.currencies[reserve]
                                    .lastconversionprice;
                        }
                        const _destination = (VerusdRpcInterface.extractRpcResult(yield this.getCachedCurrency(reserve)));
                        const gateway = (0, flags_1.checkFlag)(_destination.options, flags_1.IS_GATEWAY_FLAG);
                        const gatewayConverter = ((0, flags_1.checkFlag)(_destination.options, flags_1.IS_GATEWAY_CONVERTER_FLAG) ||
                            (0, flags_1.checkFlag)(src.options, flags_1.IS_GATEWAY_CONVERTER_FLAG) ||
                            (via != null && (0, flags_1.checkFlag)(via.options, flags_1.IS_GATEWAY_CONVERTER_FLAG)));
                        const fractionalConverter = via ? via : src;
                        addConvertable(reserve, {
                            via,
                            destination: _destination,
                            exportto: (gateway || gatewayConverter) ?
                                (VerusdRpcInterface.extractRpcResult(yield this.getCachedCurrency(gateway ?
                                    _destination.currencyid
                                    :
                                        fractionalConverter.parent === this.chain ? fractionalConverter.launchsystemid : fractionalConverter.parent)))
                                :
                                    undefined,
                            price,
                            viapriceinroot,
                            destpriceinvia,
                            gateway
                        });
                        // If gateway converter, allow converting to same currency, on current system
                        if (gateway || gatewayConverter) {
                            const convertableArr = convertables[reserve];
                            const existingOnChainConversion = convertableArr != null ?
                                convertableArr.find(x => x.exportto == null)
                                :
                                    null;
                            if (existingOnChainConversion == null) {
                                addConvertable(reserve, {
                                    via,
                                    destination: _destination,
                                    price,
                                    gateway: false,
                                    viapriceinroot,
                                    destpriceinvia
                                });
                            }
                        }
                    }
                }
            }
            if (includeVia) {
                const chainInfo = (VerusdRpcInterface.extractRpcResult(yield this.getCachedInfo()));
                for (const key in convertables) {
                    for (const convertablePath of convertables[key]) {
                        const started = ((convertablePath.destination.startblock <= chainInfo.longestchain)
                            ||
                                (convertablePath.destination.launchsystemid !== chainInfo.chainid));
                        if ((0, flags_1.checkFlag)(convertablePath.destination.options, flags_1.IS_FRACTIONAL_FLAG) &&
                            !ignoreCurrencies.includes(key) &&
                            convertablePath.destination.currencies.includes(src.currencyid) &&
                            started) {
                            mergeConvertables(convertables, yield this._getCurrencyConversionPaths(convertablePath.destination, dest, false, ignoreCurrencies, convertablePath.destination, src));
                        }
                    }
                }
            }
            // Rules:
            // The systemid of the fractional currency determines if exportto must be present or not.
            // If using via, the via is always the fractional currency.
            // If not using via, check both source and dest for fractional flag.
            for (const key in convertables) {
                const convertableArr = convertables[key];
                convertables[key] = convertableArr.filter(x => {
                    const convertable = x;
                    let fractionalConverter;
                    if (convertable.via)
                        fractionalConverter = convertable.via;
                    else {
                        const fractionalDest = (0, flags_1.checkFlag)(convertable.destination.options, flags_1.IS_FRACTIONAL_FLAG);
                        if (fractionalSource && !fractionalDest)
                            fractionalConverter = src;
                        else if (!fractionalSource && fractionalDest)
                            fractionalConverter = convertable.destination;
                        else if (src.currencies && convertable.destination.currencies) {
                            if (src.currencies.includes(convertable.destination.currencyid))
                                fractionalConverter = src;
                            else
                                fractionalConverter = convertable.destination;
                        }
                        else
                            return false;
                    }
                    if ((fractionalConverter.systemid !== this.chain) && (convertable.exportto == null || convertable.exportto.currencyid !== fractionalConverter.systemid))
                        return false;
                    else if (convertable.exportto != null) {
                        // Make sure you only export to currencies that can see the chain you're on
                        const seeByLaunch = convertable.exportto.launchsystemid === currChainDefinition.currencyid || currChainDefinition.launchsystemid === convertable.exportto.currencyid;
                        const seeByParent = convertable.exportto.parent === currChainDefinition.currencyid || currChainDefinition.parent === convertable.exportto.currencyid;
                        return seeByLaunch || seeByParent;
                    }
                    else
                        return true;
                });
            }
            return convertables;
        });
    }
    _getCurrencyConversionPaths(src, dest, includeVia = true, ignoreCurrencies = [], via, root) {
        return __awaiter(this, void 0, void 0, function* () {
            const paths = yield this.getCurrencyConversionPathsRec(src, dest, includeVia, ignoreCurrencies, via, root);
            delete paths[src.currencyid];
            return paths;
        });
    }
    getCurrencyConversionPaths(src, dest, includeVia = true, ignoreCurrencies = [], via, root) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const _cache = this.currencycache;
                function cacheDefinition(x) {
                    _cache.set(x.currencyid, {
                        id: 0,
                        result: x,
                        error: null
                    });
                }
                cacheDefinition(src);
                if (dest != null) {
                    cacheDefinition(dest);
                }
                if (via != null) {
                    cacheDefinition(via);
                }
                if (root != null) {
                    cacheDefinition(root);
                }
                const allCurrencies = yield this.getAllCachedListCurrencies();
                for (const currency of allCurrencies) {
                    const definition = Object.assign(Object.assign({}, currency.currencydefinition), { bestcurrencystate: currency.bestcurrencystate });
                    const getCurrencyResponse = {
                        id: 0,
                        result: definition,
                        error: null
                    };
                    this.currencycache.set(definition.currencyid, getCurrencyResponse);
                }
                const result = yield this._getCurrencyConversionPaths(src, dest, includeVia, ignoreCurrencies, via, root);
                this.currencycache.clear();
                this.listcurrenciescache.clear();
                this.converterscache.clear();
                this.infocache = null;
                return result;
            }
            catch (e) {
                this.currencycache.clear();
                this.listcurrenciescache.clear();
                this.converterscache.clear();
                this.infocache = null;
                throw e;
            }
        });
    }
}
exports.default = VerusdRpcInterface;
