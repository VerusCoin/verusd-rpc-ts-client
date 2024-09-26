import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import {
  GetAddressBalanceRequest,
  ApiRequest,
  GetAddressDeltasRequest,
  GetAddressUtxosRequest,
  GetBlockRequest,
  GetIdentityRequest,
  GetIdentityContentRequest,
  GetInfoRequest,
  GetOffersRequest,
  GetRawTransactionRequest,
  MakeOfferRequest,
  SendRawTransactionRequest,
  GetCurrencyRequest,
  GetAddressBalanceResponse,
  GetAddressDeltasResponse,
  GetAddressUtxosResponse,
  GetBlockResponse,
  GetIdentityResponse,
  GetCurrencyResponse,
  GetInfoResponse,
  GetOffersResponse,
  GetRawTransactionResponse,
  MakeOfferResponse,
  GetAddressMempoolRequest,
  GetAddressMempoolResponse,
  GetVdxfIdRequest,
  GetVdxfIdResponse,
  FundRawTransactionRequest,
  FundRawTransactionResponse,
  SendCurrencyRequest,
  SendCurrencyResponse,
  GetCurrencyConvertersRequest,
  GetCurrencyConvertersResponse,
  CurrencyDefinition,
  ApiResponse,
  ListCurrenciesRequest,
  ListCurrenciesResponse,
  EstimateConversionRequest,
  EstimateConversionResponse
} from "verus-typescript-primitives";
import { ConstructorParametersAfterFirst, RemoveFirstFromTuple } from "./types/ConstructorParametersAfterFirst";
import { RpcRequestBody, RpcRequestResult, RpcRequestResultError, RpcRequestResultSuccess } from "./types/RpcRequest";
import { IS_FRACTIONAL_FLAG, IS_GATEWAY_CONVERTER_FLAG, IS_GATEWAY_FLAG, checkFlag } from "./utils/flags";

type Convertable = {
  via?: CurrencyDefinition,
  destination: CurrencyDefinition,
  exportto?: CurrencyDefinition,
  price: number,
  viapriceinroot?: number,
  destpriceinvia?: number,
  gateway: boolean
}

type Convertables = { [key: string]: Array<Convertable> }

class VerusdRpcInterface {
  instance?: AxiosInstance;
  currid: number;
  chain: string;

  rpcRequestOverride?: <D>(req: RpcRequestBody<number>) => Promise<RpcRequestResult<D>>;

  private currencycache: Map<string, RpcRequestResultSuccess<GetCurrencyResponse["result"]>> = new Map();
  private converterscache: Map<string, RpcRequestResultSuccess<GetCurrencyConvertersResponse["result"]>> = new Map();
  private listcurrenciescache: Map<string, RpcRequestResultSuccess<ListCurrenciesResponse["result"]>> = new Map();
  private infocache: RpcRequestResultSuccess<GetInfoResponse["result"]> | null = null;

  constructor(chain: string, baseURL: string, config?: AxiosRequestConfig, rpcRequest?: <D>(req: RpcRequestBody<number>) => Promise<RpcRequestResult<D>>) {
    if (rpcRequest) this.rpcRequestOverride = rpcRequest;
    else {
      this.instance = axios.create({
        baseURL,
        headers: {
          "Content-type": "application/json",
        },
        ...config,
      });
    }

    this.currid = 0;
    this.chain = chain;
  }

  async request<D>(req: ApiRequest): Promise<RpcRequestResult<D>> {
    const id = this.currid;
    this.currid += 1;

    const body: RpcRequestBody<number> = {
      jsonrpc: "1.0",
      id,
      params: req.getParams(),
      method: req.cmd,
    };

    if (this.rpcRequestOverride) return this.rpcRequestOverride(body);
 
    try {
      const res: AxiosResponse = await this.instance!.post("/", body);

      if (res.status != 200) {
        const error: RpcRequestResultError = {
          id,
          result: null,
          error: {
            code: res.status,
            message: `Network error ${res.status}`,
            data: res.data,
          },
        };

        return error;
      } else {
        const response: RpcRequestResult<D> = res.data as RpcRequestResult<D>;

        return response;
      }
    } catch (e: any) {
      const error: RpcRequestResultError = {
        id,
        result: null,
        error: {
          code: -32603,
          message: e.message as string,
        },
      };

      return error;
    }
  }

  getAddressBalance(...args: ConstructorParametersAfterFirst<typeof GetAddressBalanceRequest>) {
    return this.request<GetAddressBalanceResponse["result"]>(
      new GetAddressBalanceRequest(this.chain, ...args)
    );
  }

  getAddressDeltas(...args: ConstructorParametersAfterFirst<typeof GetAddressDeltasRequest>) {
    return this.request<GetAddressDeltasResponse["result"]>(
      new GetAddressDeltasRequest(this.chain, ...args)
    );
  }

  getAddressMempool(...args: ConstructorParametersAfterFirst<typeof GetAddressMempoolRequest>) {
    return this.request<GetAddressMempoolResponse["result"]>(
      new GetAddressMempoolRequest(this.chain, ...args)
    );
  }

  getAddressUtxos(...args: ConstructorParametersAfterFirst<typeof GetAddressUtxosRequest>) {
    return this.request<GetAddressUtxosResponse["result"]>(
      new GetAddressUtxosRequest(this.chain, ...args)
    );
  }

  getBlock(...args: ConstructorParametersAfterFirst<typeof GetBlockRequest>) {
    return this.request<GetBlockResponse["result"]>(new GetBlockRequest(this.chain, ...args));
  }

  getVdxfId(...args: ConstructorParametersAfterFirst<typeof GetVdxfIdRequest>) {
    return this.request<GetVdxfIdResponse["result"]>(new GetVdxfIdRequest(this.chain, ...args));
  }

  getIdentity(...args: ConstructorParametersAfterFirst<typeof GetIdentityRequest>) {
    return this.request<GetIdentityResponse["result"]>(new GetIdentityRequest(this.chain, ...args));
  }

  getIdentityContent(...args: ConstructorParametersAfterFirst<typeof GetIdentityContentRequest>) {
    return this.request<GetIdentityResponse["result"]>(new GetIdentityContentRequest(this.chain, ...args));
  }

  getCurrency(...args: ConstructorParametersAfterFirst<typeof GetCurrencyRequest>) {
    return this.request<GetCurrencyResponse["result"]>(new GetCurrencyRequest(this.chain, ...args));
  }

  getInfo(...args: ConstructorParametersAfterFirst<typeof GetInfoRequest>) {
    return this.request<GetInfoResponse["result"]>(new GetInfoRequest(this.chain, ...args));
  }

  getOffers(...args: ConstructorParametersAfterFirst<typeof GetOffersRequest>) {
    return this.request<GetOffersResponse["result"]>(new GetOffersRequest(this.chain, ...args));
  }

  getRawTransaction(...args: ConstructorParametersAfterFirst<typeof GetRawTransactionRequest>) {
    return this.request<GetRawTransactionResponse["result"]>(
      new GetRawTransactionRequest(this.chain, ...args)
    );
  }

  makeOffer(...args: ConstructorParametersAfterFirst<typeof MakeOfferRequest>) {
    return this.request<MakeOfferResponse["result"]>(new MakeOfferRequest(this.chain, ...args));
  }

  sendRawTransaction(...args: ConstructorParametersAfterFirst<typeof SendRawTransactionRequest>) {
    return this.request<GetRawTransactionResponse["result"]>(
      new SendRawTransactionRequest(this.chain, ...args)
    );
  }

  fundRawTransaction(...args: ConstructorParametersAfterFirst<typeof FundRawTransactionRequest>) {
    return this.request<FundRawTransactionResponse["result"]>(
      new FundRawTransactionRequest(this.chain, ...args)
    );
  }

  sendCurrency(...args: ConstructorParametersAfterFirst<typeof SendCurrencyRequest>) {
    return this.request<SendCurrencyResponse["result"]>(
      new SendCurrencyRequest(this.chain, ...args)
    );
  }

  getCurrencyConverters(...args: ConstructorParametersAfterFirst<typeof GetCurrencyConvertersRequest>) {
    return this.request<GetCurrencyConvertersResponse["result"]>(
      new GetCurrencyConvertersRequest(this.chain, ...args)
    );
  }

  listCurrencies(...args: ConstructorParametersAfterFirst<typeof ListCurrenciesRequest>) {
    return this.request<ListCurrenciesResponse["result"]>(
      new ListCurrenciesRequest(this.chain, ...args)
    );
  }

  estimateConversion(...args: ConstructorParametersAfterFirst<typeof EstimateConversionRequest>) {
    return this.request<EstimateConversionResponse["result"]>(
      new EstimateConversionRequest(this.chain, ...args)
    );
  }

  static extractRpcResult<D extends ApiResponse>(res: RpcRequestResult<D["result"]>): D["result"] {
    if (res.error) throw new Error(res.error.message)
    else return res.result
  }

  private async getCachedCurrency(...args: ConstructorParametersAfterFirst<typeof GetCurrencyRequest>) {
    const [iaddr] = args;

    if (this.currencycache.has(iaddr!)) {
      return this.currencycache.get(iaddr!)!
    }

    const response = await this.request<GetCurrencyResponse["result"]>(new GetCurrencyRequest(this.chain, ...args));

    if (response.result) {
      this.currencycache.set(iaddr!, response)
    }

    return response
  }

  private async getCachedInfo(...args: ConstructorParametersAfterFirst<typeof GetInfoRequest>) {
    if (this.infocache != null) {
      return this.infocache!;
    }

    const response = await this.request<GetInfoResponse["result"]>(new GetInfoRequest(this.chain, ...args));

    if (response.result) {
      this.infocache = response;
    }

    return response
  }

  private async getCachedListCurrencies(...args: ConstructorParametersAfterFirst<typeof ListCurrenciesRequest>) {
    const key = JSON.stringify(args);

    if (this.listcurrenciescache.has(key)) {
      return this.listcurrenciescache.get(key)!
    }

    const response = await this.request<ListCurrenciesResponse["result"]>(new ListCurrenciesRequest(this.chain, ...args));

    if (response.result) {
      this.listcurrenciescache.set(key, response)
    }

    return response
  }

  private async getAllCachedListCurrencies() {
    const localCurrencies = VerusdRpcInterface.extractRpcResult<ListCurrenciesResponse>(
      await this.getCachedListCurrencies({ systemtype: "local" })
    );

    const pbaasCurrencies = VerusdRpcInterface.extractRpcResult<ListCurrenciesResponse>(
      await this.getCachedListCurrencies({ systemtype: "pbaas" })
    );

    const importedCurrencies = VerusdRpcInterface.extractRpcResult<ListCurrenciesResponse>(
      await this.getCachedListCurrencies({ systemtype: "imported" })
    )

    const allCurrencies = [...localCurrencies, ...pbaasCurrencies, ...importedCurrencies]
    const seenCurrencies: Set<string> = new Set();

    return allCurrencies.filter(x => {
      if (seenCurrencies.has(x.currencydefinition.currencyid)) return false;
      else {
        seenCurrencies.add(x.currencydefinition.currencyid);
        return true;
      }
    })
  }

  private async getCachedCurrencyConverters(...args: ConstructorParametersAfterFirst<typeof GetCurrencyConvertersRequest>) {
    const key = JSON.stringify(args)

    if (this.converterscache.has(key)) {
      return this.converterscache.get(key)!
    }

    const allCurrencies = await this.getAllCachedListCurrencies()
    const root = (VerusdRpcInterface.extractRpcResult<GetCurrencyResponse>(
      await this.getCachedCurrency(this.chain)
    ))
    const chainInfo = (VerusdRpcInterface.extractRpcResult<GetInfoResponse>(
      await this.getCachedInfo()
    ))

    // Try to cache locally constructed converter responses
    for (const source of allCurrencies) {
      const sourceDefinition = source.currencydefinition;
      const converters: GetCurrencyConvertersResponse["result"] = [];

      for (const dest of allCurrencies) {
        const destDefinition = dest.currencydefinition;

        if (destDefinition.currencies && 
            destDefinition.currencies.includes(sourceDefinition.currencyid) && 
            dest.bestcurrencystate) {

          if (destDefinition.startblock > chainInfo.longestchain && 
              !(destDefinition.maxpreconversion && destDefinition.maxpreconversion.reduce((sum, a) => sum + a, 0) === 0)
          ) {
            converters.push({
              [destDefinition.name]: {
                ...destDefinition,
                bestcurrencystate: dest.bestcurrencystate
              }
            })
          } else if (checkFlag(destDefinition.options, IS_FRACTIONAL_FLAG)) {
            const targetReserve = dest.bestcurrencystate.reservecurrencies.find(x => x.currencyid === root.currencyid);
            const systemReserve = dest.bestcurrencystate.reservecurrencies.find(
              x => x.currencyid === this.chain
            );

            if (targetReserve && targetReserve.weight > 0.1 && systemReserve && systemReserve.reserves > 1000) {
              converters.push({
                [destDefinition.name]: {
                  ...destDefinition,
                  bestcurrencystate: dest.bestcurrencystate
                }
              })
            }
          }

        }
      }

      const params = [[sourceDefinition.currencyid]];

      const converterResponse: RpcRequestResultSuccess<GetCurrencyConvertersResponse["result"]> = {
        id: 0,
        result: converters,
        error: null
      }

      this.converterscache.set(JSON.stringify(params), converterResponse)
    }

    if (!this.converterscache.has(key)) {
      const response = await this.request<GetCurrencyConvertersResponse["result"]>(
        new GetCurrencyConvertersRequest(this.chain, ...args)
      );

      if (response.result) {
        this.converterscache.set(key, response);
      }

      return response;
    } else {
      return this.converterscache.get(key)!
    }
  }

  private async getCurrencyConversionPathsRec(
    src: CurrencyDefinition, 
    dest?: CurrencyDefinition,
    includeVia: boolean = true, 
    ignoreCurrencies: Array<string> = [], 
    via?: CurrencyDefinition, 
    root?: CurrencyDefinition) 
  {
    const currChainDefinition = (VerusdRpcInterface.extractRpcResult<GetCurrencyResponse>(
      await this.getCachedCurrency(this.chain)
    ))

    const fractionalSource = checkFlag(src.options, IS_FRACTIONAL_FLAG) && (src.systemid === currChainDefinition.currencyid);
    const paths = VerusdRpcInterface.extractRpcResult<GetCurrencyConvertersResponse>(
      await this.getCachedCurrencyConverters(dest == null ? [src.currencyid] : [src.currencyid, dest!.currencyid])
    )

    let convertables: Convertables = {};

    function addConvertable(key: string, convertable: Convertable) {
      if (convertables[key] == null) {
        convertables[key] = [convertable]
      } else {
        convertables[key].push(convertable)
      }
    }

    function mergeConvertables(x: Convertables, y: Convertables) {
      const merged: Convertables = {}

      for (const key in x) {
        if (y[key]) {
          merged[key] = x[key]

          for (const conv of y[key]) {
            const existingConvertable = x[key].find(x => {
              return x.destination === conv.destination && x.via === conv.via && x.exportto === conv.exportto
            })

            if (existingConvertable == null) merged[key].push(conv)
          }
        } else {
          merged[key] = x[key]
        }
      }

      for (const key in y) {
        if (!merged[key]) {
          merged[key] = y[key]
        }
      }

      convertables = merged
    }

    destination_iterator: for (const path of paths) {
      const currencyName = Object.keys(path)[0];
      const fullCurrencyDefinition = (VerusdRpcInterface.extractRpcResult<GetCurrencyResponse>(
        await this.getCachedCurrency(path[currencyName].currencyid)
      ))

      let pricingCurrencyState;
      let price;
      let viapriceinroot;
      let destpriceinvia;

      if (via) {
        if (via.bestcurrencystate) {
          pricingCurrencyState = via.bestcurrencystate;
        } else {
          pricingCurrencyState = (VerusdRpcInterface.extractRpcResult<GetCurrencyResponse>(
            await this.getCachedCurrency(via.currencyid)
          )).bestcurrencystate!
        }

        // If the pricingCurrency doesn't contain the destination
        // in it's reserves, we can't use it for via
        if (pricingCurrencyState.currencies[fullCurrencyDefinition.currencyid] == null) {
          continue;
        }

        viapriceinroot = 1 / pricingCurrencyState.currencies[root!.currencyid].lastconversionprice
        destpriceinvia = pricingCurrencyState.currencies[fullCurrencyDefinition.currencyid].lastconversionprice
        price =
          1 /
          (pricingCurrencyState.currencies[root!.currencyid].lastconversionprice /
            pricingCurrencyState.currencies[fullCurrencyDefinition.currencyid]
              .lastconversionprice);
      } else {
        if (fullCurrencyDefinition.bestcurrencystate) {
          pricingCurrencyState = fullCurrencyDefinition.bestcurrencystate;
        } else {
          pricingCurrencyState = (VerusdRpcInterface.extractRpcResult<GetCurrencyResponse>(
            await this.getCachedCurrency(fullCurrencyDefinition.currencyid)
          )).bestcurrencystate!
        }

        price = 1 / pricingCurrencyState!.currencies[src.currencyid].lastconversionprice;
      }

      const gateway = checkFlag(fullCurrencyDefinition.options, IS_GATEWAY_FLAG);

      const gatewayConverter = (
        checkFlag(fullCurrencyDefinition.options, IS_GATEWAY_CONVERTER_FLAG) || 
        checkFlag(src.options, IS_GATEWAY_CONVERTER_FLAG) ||
        (via != null && checkFlag(via.options, IS_GATEWAY_CONVERTER_FLAG)));

      const fractionalConverter = via ? via : fullCurrencyDefinition;

      addConvertable(fullCurrencyDefinition.currencyid, {
        via,
        destination: fullCurrencyDefinition,
        exportto: (gateway || gatewayConverter) ? 
          (VerusdRpcInterface.extractRpcResult<GetCurrencyResponse>(
            await this.getCachedCurrency(
              gateway ? 
                fullCurrencyDefinition.currencyid 
                : 
                fractionalConverter.parent === this.chain ? fractionalConverter.launchsystemid : fractionalConverter.parent)
            )
          )
          : 
          undefined,
        price,
        gateway,
        viapriceinroot,
        destpriceinvia
      })

      // If gateway converter, allow converting to same currency, on current system
      if (gateway || gatewayConverter) {
        const convertableArr = convertables[fullCurrencyDefinition.currencyid];
        const existingOnChainConversion = convertableArr != null ? 
          convertableArr.find(x => x.exportto == null) 
          : 
          null
        
        if (existingOnChainConversion == null) {
          addConvertable(fullCurrencyDefinition.currencyid, {
            via,
            destination: fullCurrencyDefinition,
            price,
            gateway: false,
            viapriceinroot,
            destpriceinvia
          })
        }
      }
    }

    if (fractionalSource && dest == null) {
      let price;
      let viapriceinroot;
      let destpriceinvia;

      for (const reserve of src.currencies) {
        let pricingCurrencyState;

        if (
          !ignoreCurrencies.includes(reserve)
        ) {
          if (via) {
            if (via.bestcurrencystate) {
              pricingCurrencyState = via.bestcurrencystate;
            } else {
              pricingCurrencyState = (VerusdRpcInterface.extractRpcResult<GetCurrencyResponse>(
                await this.getCachedCurrency(via.currencyid)
              )).bestcurrencystate!
            }

            viapriceinroot = 1 / pricingCurrencyState.currencies[root!.currencyid].lastconversionprice
            destpriceinvia = pricingCurrencyState.currencies[reserve].lastconversionprice
            price =
              1 /
              (pricingCurrencyState.currencies[root!.currencyid]
                .lastconversionprice /
                pricingCurrencyState.currencies[reserve]
                  .lastconversionprice);
          } else {
            if (src.bestcurrencystate) {
              pricingCurrencyState = src.bestcurrencystate;
            } else {
              pricingCurrencyState = (VerusdRpcInterface.extractRpcResult<GetCurrencyResponse>(
                await this.getCachedCurrency(src.currencyid)
              )).bestcurrencystate!
            }

            price =
              pricingCurrencyState.currencies[reserve]
                .lastconversionprice;
          }

          const _destination = (VerusdRpcInterface.extractRpcResult<GetCurrencyResponse>(
            await this.getCachedCurrency(reserve)
          ))

          const gateway = checkFlag(_destination.options, IS_GATEWAY_FLAG);

          const gatewayConverter = (
            checkFlag(_destination.options, IS_GATEWAY_CONVERTER_FLAG) || 
            checkFlag(src.options, IS_GATEWAY_CONVERTER_FLAG) ||
            (via != null && checkFlag(via.options, IS_GATEWAY_CONVERTER_FLAG)));
          
          const fractionalConverter = via ? via : src;

          addConvertable(reserve, {
            via,
            destination: _destination,
            exportto: (gateway || gatewayConverter) ? 
              (VerusdRpcInterface.extractRpcResult<GetCurrencyResponse>(
                await this.getCachedCurrency(gateway ? 
                  _destination.currencyid 
                  : 
                  fractionalConverter.parent === this.chain ? fractionalConverter.launchsystemid : fractionalConverter.parent
                )
              ))
              : 
              undefined,
            price,
            viapriceinroot,
            destpriceinvia,
            gateway
          })

          // If gateway converter, allow converting to same currency, on current system
          if (gateway || gatewayConverter) {
            const convertableArr = convertables[reserve];
            const existingOnChainConversion = convertableArr != null ? 
              convertableArr.find(x => x.exportto == null) 
              : 
              null
            
            if (existingOnChainConversion == null) {
              addConvertable(reserve, {
                via,
                destination: _destination,
                price,
                gateway: false,
                viapriceinroot,
                destpriceinvia
              })
            }
          }
        }
      }
    }

    if (includeVia) {
      const chainInfo = (VerusdRpcInterface.extractRpcResult<GetInfoResponse>(
        await this.getCachedInfo()
      ))

      for (const key in convertables) {
        for (const convertablePath of convertables[key]) {
          const started = (
            (convertablePath.destination.startblock <= chainInfo.longestchain) 
            || 
            (convertablePath.destination.launchsystemid !== chainInfo.chainid)
          )

          if (
            checkFlag(convertablePath.destination.options, IS_FRACTIONAL_FLAG) &&
            !ignoreCurrencies.includes(key) &&
            convertablePath.destination.currencies.includes(src.currencyid) && 
            started
          ) {
            mergeConvertables(
              convertables,
              await this._getCurrencyConversionPaths(
                convertablePath.destination,
                dest,
                false,
                ignoreCurrencies,
                convertablePath.destination,
                src
              )
            );
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
        const convertable = x as {
          via?: CurrencyDefinition;
          destination: CurrencyDefinition;
          price: number;
          gateway: boolean;
          viapriceinroot?: number;
          destpriceinvia?: number;
          exportto?: CurrencyDefinition;
        };

        let fractionalConverter: CurrencyDefinition | undefined;

        if (convertable.via) fractionalConverter = convertable.via;
        else {
          const fractionalDest = checkFlag(convertable.destination.options, IS_FRACTIONAL_FLAG);

          if (fractionalSource && !fractionalDest) fractionalConverter = src;
          else if (!fractionalSource && fractionalDest) fractionalConverter = convertable.destination;
          else if (src.currencies && convertable.destination.currencies) {
            if (src.currencies.includes(convertable.destination.currencyid)) fractionalConverter = src;
            else fractionalConverter = convertable.destination;
          } else return false;
        }

        if ((fractionalConverter!.systemid !== this.chain) && (convertable.exportto == null || convertable.exportto.currencyid !== fractionalConverter!.systemid)) return false;
        else if (convertable.exportto != null) {
          // Make sure you only export to currencies that can see the chain you're on
          const seeByLaunch = convertable.exportto.launchsystemid === currChainDefinition.currencyid || currChainDefinition.launchsystemid === convertable.exportto.currencyid;
          const seeByParent = convertable.exportto.parent === currChainDefinition.currencyid || currChainDefinition.parent === convertable.exportto.currencyid;

          return seeByLaunch || seeByParent;
        } else return true;
      });
    }

    return convertables;
  }

  private async _getCurrencyConversionPaths(
    src: CurrencyDefinition, 
    dest?: CurrencyDefinition,
    includeVia: boolean = true, 
    ignoreCurrencies: Array<string> = [], 
    via?: CurrencyDefinition, 
    root?: CurrencyDefinition) 
  {
    const paths = await this.getCurrencyConversionPathsRec(
      src,
      dest,
      includeVia,
      ignoreCurrencies,
      via,
      root
    );

    delete paths[src.currencyid];

    return paths;
  }

  async getCurrencyConversionPaths(
    src: CurrencyDefinition, 
    dest?: CurrencyDefinition,
    includeVia: boolean = true, 
    ignoreCurrencies: Array<string> = [], 
    via?: CurrencyDefinition, 
    root?: CurrencyDefinition) 
  {
    try {
      const _cache = this.currencycache
      function cacheDefinition(x: CurrencyDefinition) {
        _cache.set(x.currencyid, {
          id: 0,
          result: x,
          error: null
        })
      }
      
      cacheDefinition(src)
  
      if (dest != null) {
        cacheDefinition(dest)
      }
  
      if (via != null) {
        cacheDefinition(via)
      }
  
      if (root != null) {
        cacheDefinition(root)
      }
  
      const allCurrencies = await this.getAllCachedListCurrencies()
  
      for (const currency of allCurrencies) {
        const definition: GetCurrencyResponse["result"] = {
          ...currency.currencydefinition,
          bestcurrencystate: currency.bestcurrencystate
        }
  
        const getCurrencyResponse: RpcRequestResultSuccess<CurrencyDefinition> = {
          id: 0,
          result: definition,
          error: null
        }
  
        this.currencycache.set(definition.currencyid, getCurrencyResponse)
      }
  
      const result = await this._getCurrencyConversionPaths(
        src, 
        dest, 
        includeVia, 
        ignoreCurrencies, 
        via, 
        root
      )
  
      this.currencycache.clear();
      this.listcurrenciescache.clear();
      this.converterscache.clear();
      this.infocache = null;
  
      return result;
    } catch(e) {
      this.currencycache.clear();
      this.listcurrenciescache.clear();
      this.converterscache.clear();
      this.infocache = null;
      
      throw e;
    }
  }
}

export default VerusdRpcInterface