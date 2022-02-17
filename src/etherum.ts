function getEtherum () {
	if (!window) {
		throw new Error("window does not exist!")
	}


	if (!window.ethereum) {
		throw new Error("Metamask is not installed!")
	}

	return window.ethereum
}


export default getEtherum