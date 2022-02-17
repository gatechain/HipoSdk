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
  public event: Event

  constructor () {
     super()
     this.ethereum = getEtherum()
     this.perpetual = new Perpetual(this)
  }

  async init () {
    const chainId = await this.ethereum.request({
      method: 'eth_chainId',
    })
    this.setChainId(chainId)

    this.accounts = await this.ethereum.request({
      method: 'eth_requestAccounts',
    })
    this.setAccount(this.accounts)

    const provider = new providers.Web3Provider(this.ethereum)
    this.provider = provider
    this.signer = provider.getSigner()
  }

  setChainId (chainId: string) {
    this.chainId =  Number(Number(chainId).toString(10))
  }

  setAccount (accounts: string[]) {
    this.accounts = accounts
    this.currAccount =  accounts[0]
  }


  async connect () {
    try {
      await this.init()
      this.watchEvent()
    } catch (error) {
      throw error
    }
  }

  watchEvent() {
    this.ethereum.on('chainChanged', (chainId: string) => {
        this.setChainId(chainId)
        this.emit('chainChanged', this.chainId)
    })
    this.ethereum.on('accountsChanged', (accounts: string[]) => {
      this.setAccount(accounts)
      this.emit('accountsChanged', this.currAccount)
    })
    this.ethereum.on('disconnect', () => {
      this.emit('disconnect')
    })
  }

  sign (value: string) {
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
  async getApproveStatus (token: string, spender: string, value: string) {
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
