import { AxiosInstance, AxiosRequestConfig } from "axios";
import { GetAddressBalanceRequest, ApiRequest, GetAddressDeltasRequest, GetAddressUtxosRequest, GetBlockRequest, GetIdentityRequest, GetIdentityContentRequest, GetInfoRequest, GetOffersRequest, GetRawTransactionRequest, MakeOfferRequest, SendRawTransactionRequest, GetCurrencyRequest, GetAddressMempoolRequest, GetVdxfIdRequest, FundRawTransactionRequest, SignRawTransactionRequest, SendCurrencyRequest, GetCurrencyConvertersRequest, CurrencyDefinition, ApiResponse, ListCurrenciesRequest, EstimateConversionRequest, ZGetOperationStatusRequest, SignDataRequest } from "verus-typescript-primitives";
import { ConstructorParametersAfterFirst } from "./types/ConstructorParametersAfterFirst";
import { RpcRequestBody, RpcRequestResult } from "./types/RpcRequest";
type Convertable = {
    via?: CurrencyDefinition;
    destination: CurrencyDefinition;
    exportto?: CurrencyDefinition;
    price: number;
    viapriceinroot?: number;
    destpriceinvia?: number;
    gateway: boolean;
};
type Convertables = {
    [key: string]: Array<Convertable>;
};
declare class VerusdRpcInterface {
    instance?: AxiosInstance;
    currid: number;
    chain: string;
    rpcRequestOverride?: <D>(req: RpcRequestBody<number>) => Promise<RpcRequestResult<D>>;
    private currencycache;
    private converterscache;
    private listcurrenciescache;
    private infocache;
    constructor(chain: string, baseURL: string, config?: AxiosRequestConfig, rpcRequest?: <D>(req: RpcRequestBody<number>) => Promise<RpcRequestResult<D>>);
    request<D>(req: ApiRequest): Promise<RpcRequestResult<D>>;
    getAddressBalance(...args: ConstructorParametersAfterFirst<typeof GetAddressBalanceRequest>): Promise<RpcRequestResult<{
        balance: number;
        received: number;
        currencybalance: {
            [key: string]: number;
        };
        currencyreceived: {
            [key: string]: number;
        };
        currencynames?: {
            [key: string]: string;
        };
    }>>;
    getAddressDeltas(...args: ConstructorParametersAfterFirst<typeof GetAddressDeltasRequest>): Promise<RpcRequestResult<{
        satoshis: number;
        txid: string;
        index: number;
        blockindex: number;
        height: number;
        address: string;
        currencyvalues?: {
            [key: string]: number;
        };
        currencynames?: {
            [key: string]: string;
        };
        sent?: {
            outputs: Array<{
                addresses: string | Array<string>;
                amounts: {
                    [key: string]: number;
                };
            }>;
        };
    }[]>>;
    getAddressMempool(...args: ConstructorParametersAfterFirst<typeof GetAddressMempoolRequest>): Promise<RpcRequestResult<{
        satoshis: number;
        txid: string;
        index: number;
        blockindex: number;
        height: number;
        address: string;
        currencyvalues?: {
            [key: string]: number;
        };
        currencynames?: {
            [key: string]: string;
        };
        sent?: {
            outputs: Array<{
                addresses: string | Array<string>;
                amounts: {
                    [key: string]: number;
                };
            }>;
        };
    }[]>>;
    getAddressUtxos(...args: ConstructorParametersAfterFirst<typeof GetAddressUtxosRequest>): Promise<RpcRequestResult<{
        address: string;
        txid: string;
        outputIndex: number;
        script: string;
        currencyvalues?: {
            [key: string]: number | undefined;
        };
        currencynames?: {
            [key: string]: string | undefined;
        };
        satoshis: number;
        height: number;
        isspendable: number;
        blocktime: number;
    }[]>>;
    getBlock(...args: ConstructorParametersAfterFirst<typeof GetBlockRequest>): Promise<RpcRequestResult<string | import("verus-typescript-primitives/dist/block/BlockInfo").BlockInfo>>;
    getVdxfId(...args: ConstructorParametersAfterFirst<typeof GetVdxfIdRequest>): Promise<RpcRequestResult<{
        vdxfid: string;
        hash160result: string;
        qualifiedname: {
            name: string;
            parentid: string;
        };
        bounddata?: {
            vdxfkey: string;
            uint256: string;
            indexnum: string;
        };
    }>>;
    getIdentity(...args: ConstructorParametersAfterFirst<typeof GetIdentityRequest>): Promise<RpcRequestResult<{
        identity: import("verus-typescript-primitives").IdentityDefinition;
        status: string;
        canspendfor: boolean;
        cansignfor: boolean;
        blockheight: number;
        txid: string;
        vout: number;
        proof?: string;
    }>>;
    getIdentityContent(...args: ConstructorParametersAfterFirst<typeof GetIdentityContentRequest>): Promise<RpcRequestResult<{
        identity: import("verus-typescript-primitives").IdentityDefinition;
        status: string;
        canspendfor: boolean;
        cansignfor: boolean;
        blockheight: number;
        txid: string;
        vout: number;
        proof?: string;
    }>>;
    getCurrency(...args: ConstructorParametersAfterFirst<typeof GetCurrencyRequest>): Promise<RpcRequestResult<CurrencyDefinition>>;
    getInfo(...args: ConstructorParametersAfterFirst<typeof GetInfoRequest>): Promise<RpcRequestResult<{
        version: number;
        protocolversion: number;
        VRSCversion: string;
        notarized: number;
        prevMoMheight: number;
        notarizedhash: string;
        notarizedtxid: string;
        notarizedtxid_height: string;
        KMDnotarized_height: number;
        notarized_confirms: number;
        blocks: number;
        longestchain: number;
        timeoffset: number;
        tiptime: number;
        connections: number;
        proxy: string;
        difficulty: number;
        testnet: boolean;
        paytxfee: number;
        relayfee: number;
        errors: string;
        CCid: number;
        name: string;
        p2pport: number;
        rpcport: number;
        magic: number;
        premine: number;
        eras: number;
        reward: string;
        halving: string;
        decay: string;
        endsubsidy: string;
        veruspos: number;
        chainid?: string;
        notarychainid?: string;
    }>>;
    getOffers(...args: ConstructorParametersAfterFirst<typeof GetOffersRequest>): Promise<RpcRequestResult<import("verus-typescript-primitives/dist/offers/OfferList").OfferList>>;
    getRawTransaction(...args: ConstructorParametersAfterFirst<typeof GetRawTransactionRequest>): Promise<RpcRequestResult<string | import("verus-typescript-primitives/dist/transaction/RawTransaction").RawTransaction>>;
    makeOffer(...args: ConstructorParametersAfterFirst<typeof MakeOfferRequest>): Promise<RpcRequestResult<{
        txid?: string;
        hex?: string;
    }>>;
    sendRawTransaction(...args: ConstructorParametersAfterFirst<typeof SendRawTransactionRequest>): Promise<RpcRequestResult<string | import("verus-typescript-primitives/dist/transaction/RawTransaction").RawTransaction>>;
    fundRawTransaction(...args: ConstructorParametersAfterFirst<typeof FundRawTransactionRequest>): Promise<RpcRequestResult<{
        hex: string;
        changepos: number;
        fee: number;
    }>>;
    signRawTransaction(...args: ConstructorParametersAfterFirst<typeof SignRawTransactionRequest>): Promise<RpcRequestResult<{
        hex: string;
        complete: boolean;
        errors?: Array<{
            txid: string;
            vout: number;
            scriptSig: string;
            sequence: number;
            error: string;
        }>;
    }>>;
    sendCurrency(...args: ConstructorParametersAfterFirst<typeof SendCurrencyRequest>): Promise<RpcRequestResult<string | {
        outputtotals: {
            [currencyid: string]: number;
        };
        feeamount: number;
        hextx: string;
    }>>;
    getCurrencyConverters(...args: ConstructorParametersAfterFirst<typeof GetCurrencyConvertersRequest>): Promise<RpcRequestResult<{
        [key: string]: CurrencyDefinition;
    }[]>>;
    listCurrencies(...args: ConstructorParametersAfterFirst<typeof ListCurrenciesRequest>): Promise<RpcRequestResult<{
        currencydefinition: CurrencyDefinition;
        bestheight?: number;
        besttxid?: string;
        besttxout?: number;
        bestcurrencystate?: {
            flags: number;
            version: number;
            currencyid: string;
            reservecurrencies: Array<{
                currencyid: string;
                weight: number;
                reserves: number;
                priceinreserve: number;
            }>;
            initialsupply: number;
            emitted: number;
            supply: number;
            currencies: {
                [key: string]: {
                    reservein: number;
                    primarycurrencyin: number;
                    reserveout: number;
                    lastconversionprice: number;
                    viaconversionprice: number;
                    fees: number;
                    conversionfees: number;
                    priorweights: number;
                };
            };
            primarycurrencyfees: number;
            primarycurrencyconversionfees: number;
            primarycurrencyout: number;
            preconvertedout: number;
        };
    }[]>>;
    estimateConversion(...args: ConstructorParametersAfterFirst<typeof EstimateConversionRequest>): Promise<RpcRequestResult<{
        estimatedcurrencyout: number;
        inputcurrencyid: string;
        netinputamount: number;
        outputcurrencyid: string;
        estimatedcurrencystate: {
            currencies: {
                [currencyid: string]: {
                    conversionfees: number;
                    fees: number;
                    lastconversionprice: number;
                    primarycurrencyin: number;
                    priorweights: number;
                    reservein: number;
                    reserveout: number;
                    viaconversionprice: number;
                };
            };
            currencyid: string;
            emitted: number;
            flags: number;
            initialsupply: number;
            preconvertedout: number;
            primarycurrencyconversionfees: number;
            primarycurrencyfees: number;
            primarycurrencyout: number;
            reservecurrencies: Array<{
                currencyid: string;
                priceinreserve: number;
                reserves: number;
                weight: number;
            }>;
            supply: number;
            version: number;
        };
    }>>;
    zGetOperationStatus(...args: ConstructorParametersAfterFirst<typeof ZGetOperationStatusRequest>): Promise<RpcRequestResult<import("verus-typescript-primitives/dist/api/classes/ZGetOperationStatus/ZGetOperationStatusResponse").z_operation[]>>;
    signData(...args: ConstructorParametersAfterFirst<typeof SignDataRequest>): Promise<RpcRequestResult<{
        mmrdescriptor_encrypted?: import("verus-typescript-primitives/dist/utils/types/MmrDescriptor").MmrDescriptorParameters;
        mmrdescriptor?: import("verus-typescript-primitives/dist/utils/types/MmrDescriptor").MmrDescriptorParameters;
        signature?: string;
        signaturedata_encrypted?: import("verus-typescript-primitives/dist/utils/types/DataDescriptor").DataDescriptorInfo;
        signaturedata_ssk?: string;
        signaturedata?: import("verus-typescript-primitives/dist/utils/types/Signature").SignatureDataInfo;
        system?: string;
        systemid?: string;
        hashtype?: string;
        mmrhashtype?: string;
        hash?: string;
        identity?: string;
        canonicalname?: string;
        address?: string;
        signatureheight?: number;
    }>>;
    static extractRpcResult<D extends ApiResponse>(res: RpcRequestResult<D["result"]>): D["result"];
    private getCachedCurrency;
    private getCachedInfo;
    private getCachedListCurrencies;
    private getAllCachedListCurrencies;
    private getCachedCurrencyConverters;
    private getCurrencyConversionPathsRec;
    private _getCurrencyConversionPaths;
    getCurrencyConversionPaths(src: CurrencyDefinition, dest?: CurrencyDefinition, includeVia?: boolean, ignoreCurrencies?: Array<string>, via?: CurrencyDefinition, root?: CurrencyDefinition): Promise<Convertables>;
}
export default VerusdRpcInterface;
