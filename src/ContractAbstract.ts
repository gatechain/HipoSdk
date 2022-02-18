import { Signer, providers} from "ethers"
import HipoClass, { Config, Contracts } from "./index"

abstract class ContractAbstract {
	public hipoSdk: HipoClass
	public config: Config
	public chainId
	public signer: Signer
	public provider: providers.Provider
	public currAccount: string 
	
	constructor(props: HipoClass){
		this.hipoSdk = props
		this.config = props.config
		this.chainId = props.chainId
		this.signer = props.signer
		this.provider = props.provider
		this.currAccount = props.currAccount
	}

	public getContractAddress (contractKey: Contracts) {
		console.log(contractKey)
		console.log(this.chainId)
		console.log(this.config)
		return this.config[this.chainId][contractKey].address
	}
}

export default ContractAbstract