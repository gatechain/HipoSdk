import { Contract } from "ethers";
import HipoClass, { getERC20Contract } from "./index";
import Abi from './abis/Perpetual'
import { fixedToInt, intToFixed } from "../utils";

const contractAddress: {[key: number]: string} = {
	85: '0x4F091e8f52092E7Ce70Fc385ae3B2d1301476293',
	86: '0x4F091e8f52092E7Ce70Fc385ae3B2d1301476293'
}

export default class Perpetual {
	public contractAddress = contractAddress

	private hipoSdk: HipoClass
	constructor(props: HipoClass){
		this.hipoSdk = props
	}
	//充值合约
	public getPerpetualContract() {
		try {
			return new Contract(contractAddress[this.hipoSdk.chainId], Abi, this.hipoSdk.signer)
		} catch (error) {
			throw error
		}
	}

	async getGasLimit(contract: Contract, method: string, args: any) {
		try {
			const options = { from: this.hipoSdk.currAccount }
			const gasLimit = await contract.estimateGas[method](...args, options);
			return gasLimit.toString();
		} catch (error) {
			throw error
		}
	}

	// 充值
	async deposit(token: string, amount: string) {
		try {

			const contract = this.getPerpetualContract()

			const erc20 = getERC20Contract(token, this.hipoSdk.provider)
			const decimals = await erc20.decimals()
			const amountBig = fixedToInt(amount, decimals)
			await contract.deposit(this.hipoSdk.currAccount, token, amountBig)
		} catch (error) {
			throw error
		}
	}

	// 提现
	async withdraw(token: string) {
		try {
			const contract = this.getPerpetualContract()
			await contract.withdraw(this.hipoSdk.currAccount, token)
		} catch (error) {
			throw error
		}
	}

	async getWithdrawalBalance(token: string) {
		console.log(token, this.hipoSdk.currAccount)
		const contract = this.getPerpetualContract()
		const erc20 = getERC20Contract(token, this.hipoSdk.provider)
		const decimals = await erc20.decimals()
		const balanceBig = await contract.getWithdrawalBalance(this.hipoSdk.currAccount, token)
		return intToFixed(balanceBig, decimals)
	}
}
