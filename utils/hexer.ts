import { ethers } from "ethers";

export default function hexer (input: string) {
	const byte = ethers.utils.toUtf8Bytes(input);
	const hex = ethers.utils.hexZeroPad(byte, byte.length);
	return hex
	// const utf8 = toUTF8Array(input);
	// const hex = utf8.map(n => n.toString(16));
	// return '0x' + hex.join('');
  }
  
  // From https://stackoverflow.com/a/18729931
  function toUTF8Array(str: string) {
	  var utf8 = [];
	  for (var i=0; i < str.length; i++) {
		  var charcode = str.charCodeAt(i);
		  if (charcode < 0x80) utf8.push(charcode);
		  else if (charcode < 0x800) {
			  utf8.push(0xc0 | (charcode >> 6),
						0x80 | (charcode & 0x3f));
		  }
		  else if (charcode < 0xd800 || charcode >= 0xe000) {
			  utf8.push(0xe0 | (charcode >> 12),
						0x80 | ((charcode>>6) & 0x3f),
						0x80 | (charcode & 0x3f));
		  }
		  // surrogate pair
		  else {
			  i++;
			  // UTF-16 encodes 0x10000-0x10FFFF by
			  // subtracting 0x10000 and splitting the
			  // 20 bits of 0x0-0xFFFFF into two halves
			  charcode = 0x10000 + (((charcode & 0x3ff)<<10)
						| (str.charCodeAt(i) & 0x3ff));
			  utf8.push(0xf0 | (charcode >>18),
						0x80 | ((charcode>>12) & 0x3f),
						0x80 | ((charcode>>6) & 0x3f),
						0x80 | (charcode & 0x3f));
		  }
	  }
	  return utf8;
  }
  
  