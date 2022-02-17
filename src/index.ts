import { Contract, Signer, providers, BigNumber } from "ethers"
import getEtherum from "./etherum"
import Perpetual from "./Perpetual"
import ERC20ABI from './abis/ERC20'
import hexer from '../utils/hexer'
import {fixedToInt } from '../utils'
import * as EventEmitter from 'events'

export function getERC20Contract(address: string, signerOrProvider?: Signer | providers.Provider) {
  return new Contract(address, ERC20ABI, signerOrProvider);
}

enum ApproveStatus {
  Approve,
  dontApprove,
}

async function getERC20(token: string, provider: providers.Provider) {
  const contract = getERC20Contract(token, provider);
  const decimals = await contract.decimals()
  return {decimals, contract}
}

export default class HipoClass extends EventEmitter {
  private ethereum: any
  public chainId: number = 86
  public currAccount = ''
  public accounts: any[] = []
  public provider?: providers.Provider
  public signer?: Signer
  public perpetual: Perpetual

  constructor () {
     super()
     this.ethereum = getEtherum()
     this.perpetual = new Perpetual(this)
     this.init()
  }

  private init () {
    this.ethereum.request({ method: 'eth_accounts'})
    .then((accounts:string[]) => {
      this.setAccount(accounts)
      if (accounts.length) {
        this.emit('connect', true)
      } else {
        this.emit('connect', false)
      }
    })
    this.ethereum.request({method: 'eth_chainId'}).then(((chainId: string) => this.setChainId(chainId)))
  }

  private setChainId (chainId: string) {
    this.chainId =  Number(Number(chainId).toString(10))
  }

  private setAccount (accounts: string[]) {
    this.accounts = accounts
    if (accounts.length) {
      this.currAccount =  accounts[0]
      this.setProvider()
    }
  }

  private setProvider () {
    const provider = new providers.Web3Provider(this.ethereum)
    this.provider = provider
    this.signer = provider.getSigner()
  }

  async connect () {
    try {

      this.accounts = await this.ethereum.request({
        method: 'eth_requestAccounts',
      })
      this.setAccount(this.accounts)
      this.watchEvent()
    } catch (error) {
      throw error
    }
  }

  private connectEventCallback () {
    this.emit('connect')
  }
  private disconnectEventCallback () {
    this.emit('disconnect')
  }
  private chainChangedEventCallback (chainId: string) {
    this.setChainId(chainId)
    this.emit('chainChanged', this.chainId)
  }
  private accountsEventCallback (accounts: string[]) {
    if (accounts.length) {
      this.emit('accountsChanged', this.currAccount)
    }  else {
      this.emit('connect', false)
    }
    this.setAccount(accounts)
  }

  private watchEvent() {
    this.ethereum.on('connect', this.connectEventCallback.bind(this))

    this.ethereum.on('disconnect', this.disconnectEventCallback.bind(this))

    this.ethereum.on('chainChanged', this.chainChangedEventCallback.bind(this))

    this.ethereum.on('accountsChanged', this.accountsEventCallback.bind(this))
  }
  
  public removeEvent () {
    const events = ['connect', 'disconnect', 'chainChanged', 'accountsChanged']
    events.forEach(eventString => {
      this.ethereum.removeEvent(eventString)
      this.removeListener(eventString, (this as any)[`${eventString}EventCallback`])
    })
  }

  public sign (value: string) {
    return this.ethereum.request({
      method: 'personal_sign',
      params: [
        hexer(value),
        this.currAccount
      ], 
    })
  }

  // // 查授权额度 
  // public async getTokenAllowance(token: string, account: string, spender: string): Promise<string> {
  //   const contract = getERC20Contract(token, this.provider);
  //   const [decimals, allowance] = await Promise.all([
  //     contract.decimals(),
  //     contract.allowance(account, spender)
  //   ])

  //   console.log(decimals, 'decimals')
  //   return intToFixed(allowance.toString(), decimals)
  // }
  // 查授权额度 
  public async getTokenAllowance(token: string, spender: string): Promise<BigNumber> {
    const contract = getERC20Contract(token, this.provider);
    const allowance = await contract.allowance(this.currAccount, spender)
    return allowance
  }

  // 授权
  public async approve(token: string, spender: string, value: string): Promise<any> {
    const { decimals, contract } = await getERC20(token, this.provider);
    if (this.signer) {
      const signerContract = contract.connect(this.signer);
      const tx = await signerContract.approve(spender, fixedToInt(value, decimals));
      return tx;
    }
    return '';
  }
  
  /**
   * 查看授权状态
   */
  public async getApproveStatus (token: string, spender: string, value: string) {
    try {
      const allowance = await this.getTokenAllowance(token, spender)
      const { decimals } = await getERC20(token, this.provider);
      const bigValue = BigNumber.from(fixedToInt(value, decimals))
      
      return allowance.gte(bigValue) ?  ApproveStatus.dontApprove : ApproveStatus.Approve
    } catch (error) {
      throw error
    }
  }
}
