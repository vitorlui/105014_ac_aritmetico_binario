// Utilidades de aritmética binaria pura
window.AC = window.AC || {};

window.AC.Binary = (function () {

  function binToDecUnsigned(binStr) {
    if (!binStr || binStr.length === 0) return 0;
    return parseInt(binStr, 2);
  }

  function binToDecSigned(binStr) {
    if (!binStr || binStr.length === 0) return 0;
    if (binStr[0] === '1') {
      return parseInt(binStr, 2) - Math.pow(2, binStr.length);
    }
    return parseInt(binStr, 2);
  }

  function decToBin(n, bits) {
    if (n < 0) {
      const pos = decToBin(-n, bits);
      return twosComplementBin(pos);
    }
    let bin = n.toString(2);
    if (bits !== undefined) {
      bin = bin.padStart(bits, '0');
      if (bin.length > bits) bin = bin.slice(-bits);
    }
    return bin;
  }

  function onesComplement(binStr) {
    return binStr.split('').map(b => b === '0' ? '1' : '0').join('');
  }

  function twosComplementBin(binStr) {
    const ones = onesComplement(binStr);
    let carry = 1;
    let result = '';
    for (let i = ones.length - 1; i >= 0; i--) {
      const s = parseInt(ones[i]) + carry;
      result = (s % 2).toString() + result;
      carry = Math.floor(s / 2);
    }
    return result;
  }

  function binaryAdd(a, b) {
    const len = Math.max(a.length, b.length);
    const aPad = a.padStart(len, '0');
    const bPad = b.padStart(len, '0');
    let carry = 0;
    let result = '';
    for (let i = len - 1; i >= 0; i--) {
      const s = parseInt(aPad[i]) + parseInt(bPad[i]) + carry;
      result = (s % 2).toString() + result;
      carry = Math.floor(s / 2);
    }
    return { result, cout: carry };
  }

  function binaryAddWithCarry(a, b, cin) {
    const c = (cin === undefined || cin === null) ? 0 : (typeof cin === 'string' ? parseInt(cin) : cin);
    const len = Math.max(a.length, b.length);
    const aPad = a.padStart(len, '0');
    const bPad = b.padStart(len, '0');
    let carry = c;
    let result = '';
    for (let i = len - 1; i >= 0; i--) {
      const s = parseInt(aPad[i]) + parseInt(bPad[i]) + carry;
      result = (s % 2).toString() + result;
      carry = Math.floor(s / 2);
    }
    return { result, cout: carry };
  }

  function binarySubtract(a, b) {
    const len = Math.max(a.length, b.length);
    const aPad = a.padStart(len, '0');
    const bPad = b.padStart(len, '0');
    const bComp = twosComplementBin(bPad);
    const res = binaryAdd(aPad, bComp);
    return { result: res.result, cout: res.cout };
  }

  // Desplazamiento aritmético a la derecha: C:A:Q → C':A':Q'
  function shiftRightCAQ(C, A, Q) {
    const sign = C;
    const all = C + A + Q;
    const shifted = sign + all.slice(0, all.length - 1);
    return {
      C: shifted[0],
      A: shifted.slice(1, 1 + A.length),
      Q: shifted.slice(1 + A.length)
    };
  }

  // Desplazamiento a la izquierda de A:Q (para división)
  function shiftLeftAQ(A, Q) {
    const all = A + Q;
    const shifted = all.slice(1) + '0';
    return {
      A: shifted.slice(0, A.length),
      Q: shifted.slice(A.length)
    };
  }

  function isNegativeBin(binStr) {
    return binStr && binStr[0] === '1';
  }

  function isValidBinary(str) {
    return /^[01]+$/.test(str);
  }

  function halfAdder(a, b) {
    const aB = parseInt(a), bB = parseInt(b);
    return {
      S: (aB ^ bB).toString(),
      C: (aB & bB).toString()
    };
  }

  function fullAdder(a, b, cin) {
    const aB = parseInt(a), bB = parseInt(b), cB = parseInt(cin);
    const s = aB ^ bB ^ cB;
    const cout = (aB & bB) | (aB & cB) | (bB & cB);
    return {
      S: s.toString(),
      Cout: cout.toString()
    };
  }

  // Genera tabla de verdad del semi-sumador
  function halfAdderTable() {
    const rows = [];
    for (let a = 0; a <= 1; a++) {
      for (let b = 0; b <= 1; b++) {
        const r = halfAdder(a.toString(), b.toString());
        rows.push({ A: a, B: b, S: r.S, C: r.C });
      }
    }
    return rows;
  }

  // Genera tabla de verdad del sumador completo
  function fullAdderTable() {
    const rows = [];
    for (let a = 0; a <= 1; a++) {
      for (let b = 0; b <= 1; b++) {
        for (let c = 0; c <= 1; c++) {
          const r = fullAdder(a.toString(), b.toString(), c.toString());
          rows.push({ A: a, B: b, Cin: c, S: r.S, Cout: r.Cout });
        }
      }
    }
    return rows;
  }

  return {
    binToDecUnsigned,
    binToDecSigned,
    decToBin,
    onesComplement,
    twosComplementBin,
    binaryAdd,
    binaryAddWithCarry,
    binarySubtract,
    shiftRightCAQ,
    shiftLeftAQ,
    isNegativeBin,
    isValidBinary,
    halfAdder,
    fullAdder,
    halfAdderTable,
    fullAdderTable
  };
})();
