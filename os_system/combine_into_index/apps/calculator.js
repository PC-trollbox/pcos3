// =====BEGIN MANIFEST=====
// link: lrn:CALC_TITLE
// signer: automaticSigner
// allow: GET_LOCALE, GET_THEME
// =====END MANIFEST=====
let hexToU8A = (hex) => Uint8Array.from(hex.match(/.{1,2}/g).map(a => parseInt(a, 16)));
let u8aToHex = (u8a) => Array.from(u8a).map(a => a.toString(16).padStart(2, "0")).join("");
(async function() {
    // @pcos-app-mode isolatable
    await availableAPIs.windowTitleSet(await availableAPIs.lookupLocale("CALC_TITLE"));
    document.body.style.fontFamily = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
    if (await availableAPIs.isDarkThemed()) document.body.style.color = "white";
    document.body.innerText = "";
    let pageHeader = document.createElement("b");
    let dividePageHeader = document.createElement("hr");
    let page = document.createElement("div");
    document.body.appendChild(pageHeader);
    document.body.appendChild(dividePageHeader);
    document.body.appendChild(page);
    async function mainPage() {
        pageHeader.innerText = await availableAPIs.lookupLocale("CALC_BASIC_MODE");
        page.innerText = "";
        let advmode = document.createElement("button");
        let add = document.createElement("button");
        let subtract = document.createElement("button");
        let multiply = document.createElement("button");
        let divide = document.createElement("button");
        
        advmode.innerText = await availableAPIs.lookupLocale("CALC_ADVMODE_BTN");
        add.innerText = await availableAPIs.lookupLocale("CALC_ADD");
        subtract.innerText = await availableAPIs.lookupLocale("CALC_SUBTRACT");
        multiply.innerText = await availableAPIs.lookupLocale("CALC_MULTIPLY");
        divide.innerText = await availableAPIs.lookupLocale("CALC_DIVIDE");

        advmode.onclick = advPage;
        add.onclick = basicModeActionBuilder("ADD");
        subtract.onclick = basicModeActionBuilder("SUBTRACT");
        multiply.onclick = basicModeActionBuilder("MULTIPLY");
        divide.onclick = basicModeActionBuilder("DIVIDE");
        
        page.appendChild(advmode);
        page.appendChild(add);
        page.appendChild(subtract);
        page.appendChild(multiply);
        page.appendChild(divide);
    }

    mainPage();

    async function advPage() {
        pageHeader.innerText = await availableAPIs.lookupLocale("CALC_ADVANCED_MODE");
        page.innerText = "";
        let basicmode = document.createElement("button");
        let add = document.createElement("button");
        let subtract = document.createElement("button");
        let multiply = document.createElement("button");
        let divide = document.createElement("button");
        let toMixed = document.createElement("button");
        let toImproper = document.createElement("button");
        let gcd = document.createElement("button");
        let factorial = document.createElement("button");
        
        basicmode.innerText = await availableAPIs.lookupLocale("CALC_BASICMODE_BTN");
        add.innerText = await availableAPIs.lookupLocale("CALC_ADD");
        subtract.innerText = await availableAPIs.lookupLocale("CALC_SUBTRACT");
        multiply.innerText = await availableAPIs.lookupLocale("CALC_MULTIPLY");
        divide.innerText = await availableAPIs.lookupLocale("CALC_DIVIDE");
        toMixed.innerText = await availableAPIs.lookupLocale("CALC_TOMIXED_BTN");
        toImproper.innerText = await availableAPIs.lookupLocale("CALC_TOIMPR_BTN");
        gcd.innerText = await availableAPIs.lookupLocale("CALC_GCD");
        factorial.innerText = await availableAPIs.lookupLocale("CALC_FACTORIAL");

        basicmode.onclick = mainPage;
        add.onclick = advancedModeActionBuilder("ADD");
        subtract.onclick = advancedModeActionBuilder("SUBTRACT");
        multiply.onclick = advancedModeActionBuilder("MULTIPLY");
        divide.onclick = advancedModeActionBuilder("DIVIDE");
        toMixed.onclick = toMixedPage;
        toImproper.onclick = toImproperPage;
        gcd.onclick = gcdPage;
        factorial.onclick = factorialPage;
        
        page.appendChild(basicmode);
        page.appendChild(add);
        page.appendChild(subtract);
        page.appendChild(multiply);
        page.appendChild(divide);
        page.appendChild(toMixed);
        page.appendChild(toImproper);
        page.appendChild(gcd);
        page.appendChild(factorial);
    }

    function basicModeActionBuilder(sign) {
        return async function() {
            page.innerText = "";
            pageHeader.innerText = "";

            let backButton = document.createElement("button");
            let pageHeaderText = document.createElement("span");
            let operand1 = document.createElement("input");
            let operationSign = document.createElement("span");
            let operand2 = document.createElement("input");
            let result = document.createElement("input");
            let compute = document.createElement("button");
            pageHeader.appendChild(backButton);
            pageHeader.appendChild(pageHeaderText);

            pageHeaderText.innerText = await availableAPIs.lookupLocale("CALC_" + sign);
            if (sign == "ADD") operationSign.innerText = "+";
            if (sign == "SUBTRACT") operationSign.innerText = "-";
            if (sign == "MULTIPLY") operationSign.innerText = "*";
            if (sign == "DIVIDE") operationSign.innerText = "/";
            compute.innerText = "=";
            operand1.value = 0;
            operand2.value = 0;
            operand1.placeholder = (await availableAPIs.lookupLocale("CALC_OPERAND")).replace("%s", 1);
            operand2.placeholder = (await availableAPIs.lookupLocale("CALC_OPERAND")).replace("%s", 2);
            operand1.type = "number";
            operand2.type = "number";
            result.type = "number";
            result.readOnly = true;

            backButton.innerText = "<-";
            backButton.onclick = mainPage;

            page.appendChild(operand1);
            page.insertAdjacentText("beforeend", " ");
            page.appendChild(operationSign);
            page.insertAdjacentText("beforeend", " ");
            page.appendChild(operand2);
            page.insertAdjacentText("beforeend", " ");
            page.appendChild(compute);
            page.insertAdjacentText("beforeend", " ");
            page.appendChild(result);

            compute.onclick = function() {
                if (sign == "ADD") result.value = parseInt(operand1.value) + parseInt(operand2.value);
                if (sign == "SUBTRACT") result.value = parseInt(operand1.value) - parseInt(operand2.value);
                if (sign == "MULTIPLY") result.value = parseInt(operand1.value) * parseInt(operand2.value);
                if (sign == "DIVIDE") result.value = parseInt(operand1.value) / parseInt(operand2.value);
            }
        }
    }
    function advancedModeActionBuilder(sign) {
        return async function() {
            page.innerText = "";
            pageHeader.innerText = "";

            let backButton = document.createElement("button");
            let pageHeaderText = document.createElement("span");
            let container = document.createElement("div");
            let operand1 = document.createElement("div");
            let operationSignContainer = document.createElement("div");
            let operationSign = document.createElement("p");
            let operand2 = document.createElement("div");
            let result = document.createElement("div");
            let compute = document.createElement("button");
            let operand1Numerator = document.createElement("input");
            let operand1Denominator = document.createElement("input");
            let operand2Numerator = document.createElement("input");
            let operand2Denominator = document.createElement("input");
            let resultNumerator = document.createElement("input");
            let resultDenominator = document.createElement("input");
            let hr1 = document.createElement("hr");
            let hr2 = document.createElement("hr");
            let hr3 = document.createElement("hr");
            pageHeader.appendChild(backButton);
            pageHeader.appendChild(pageHeaderText);

            container.style = "display: flex; width: fit-content;";
            operand1.style = "display: flex; flex-direction: column;";
            operationSignContainer.style = "display: flex; flex-direction: column; padding: 0 4px;";
            operand2.style = "display: flex; flex-direction: column;";
            result.style = "display: flex; flex-direction: column;";
            [hr1, hr2, hr3].map(a => a.style = "width: 100%;");

            operand1.appendChild(operand1Numerator);
            operand1.appendChild(hr1);
            operand1.appendChild(operand1Denominator);
            operationSignContainer.appendChild(document.createElement("div"));
            operationSignContainer.appendChild(operationSign);
            operand2.appendChild(operand2Numerator);
            operand2.appendChild(hr2);
            operand2.appendChild(operand2Denominator);
            result.appendChild(resultNumerator);
            result.appendChild(hr3);
            result.appendChild(resultDenominator);
            container.appendChild(operand1);
            container.appendChild(operationSignContainer);
            container.appendChild(operand2);
            container.appendChild(compute);
            container.appendChild(result);

            pageHeaderText.innerText = await availableAPIs.lookupLocale("CALC_" + sign);
            if (sign == "ADD") operationSign.innerText = "+";
            if (sign == "SUBTRACT") operationSign.innerText = "-";
            if (sign == "MULTIPLY") operationSign.innerText = "*";
            if (sign == "DIVIDE") operationSign.innerText = "/";
            compute.innerText = "=";
            resultNumerator.readOnly = true;
            resultDenominator.readOnly = true;

            backButton.innerText = "<-";
            backButton.onclick = advPage;

            page.appendChild(container);

            compute.onclick = function() {
                let fraction1 = fraction(BigInt(operand1Numerator.value), BigInt(operand1Denominator.value)).simplify();
                let fraction2 = fraction(BigInt(operand2Numerator.value), BigInt(operand2Denominator.value)).simplify();
                let result = fraction1[sign.toLowerCase()](fraction2);
                resultNumerator.value = result.numerator;
                resultDenominator.value = result.denominator;
            }
        }
    }

    async function toMixedPage() {
        page.innerText = "";
        pageHeader.innerText = "";

        let backButton = document.createElement("button");
        let pageHeaderText = document.createElement("span");
        let container = document.createElement("div");
        let operand1 = document.createElement("div");
        let result = document.createElement("div");
        let compute = document.createElement("button");
        let operandNumerator = document.createElement("input");
        let operandDenominator = document.createElement("input");
        let resultWholes = document.createElement("input");
        let resultNumerator = document.createElement("input");
        let resultDenominator = document.createElement("input");
        let hr1 = document.createElement("hr");
        let hr2 = document.createElement("hr");
        pageHeader.appendChild(backButton);
        pageHeader.appendChild(pageHeaderText);

        container.style = "display: flex; width: fit-content;";
        operand1.style = "display: flex; flex-direction: column;";
        result.style = "display: flex; flex-direction: column;";
        [hr1, hr2].map(a => a.style = "width: 100%;");

        operand1.appendChild(operandNumerator);
        operand1.appendChild(hr1);
        operand1.appendChild(operandDenominator);
        result.appendChild(resultNumerator);
        result.appendChild(hr2);
        result.appendChild(resultDenominator);
        container.appendChild(operand1);
        container.appendChild(compute);
        container.appendChild(resultWholes);
        container.appendChild(result);

        pageHeaderText.innerText = await availableAPIs.lookupLocale("CALC_TOMIXED_BTN");
        compute.innerText = "=";
        resultNumerator.readOnly = true;
        resultDenominator.readOnly = true;

        backButton.innerText = "<-";
        backButton.onclick = advPage;

        page.appendChild(container);

        compute.onclick = function() {
            let fraction1 = fraction(BigInt(operandNumerator.value), BigInt(operandDenominator.value)).simplify();
            let cleanNum = fraction1.cleanNumerator();
            let wholes = fraction1.getWholes();
            resultWholes.value = wholes;
            resultNumerator.value = cleanNum;
            resultDenominator.value = fraction1.denominator;
        }
    }

    async function toImproperPage() {
        page.innerText = "";
        pageHeader.innerText = "";

        let backButton = document.createElement("button");
        let pageHeaderText = document.createElement("span");
        let container = document.createElement("div");
        let operand1 = document.createElement("div");
        let result = document.createElement("div");
        let compute = document.createElement("button");
        let operandWholes = document.createElement("input");
        let operandNumerator = document.createElement("input");
        let operandDenominator = document.createElement("input");
        let resultNumerator = document.createElement("input");
        let resultDenominator = document.createElement("input");
        let hr1 = document.createElement("hr");
        let hr2 = document.createElement("hr");
        pageHeader.appendChild(backButton);
        pageHeader.appendChild(pageHeaderText);

        container.style = "display: flex; width: fit-content;";
        operand1.style = "display: flex; flex-direction: column;";
        result.style = "display: flex; flex-direction: column;";
        [hr1, hr2].map(a => a.style = "width: 100%;");

        operand1.appendChild(operandNumerator);
        operand1.appendChild(hr1);
        operand1.appendChild(operandDenominator);
        result.appendChild(resultNumerator);
        result.appendChild(hr2);
        result.appendChild(resultDenominator);
        container.appendChild(operandWholes);
        container.appendChild(operand1);
        container.appendChild(compute);
        container.appendChild(result);

        pageHeaderText.innerText = await availableAPIs.lookupLocale("CALC_TOIMPR_BTN");
        compute.innerText = "=";
        resultNumerator.readOnly = true;
        resultDenominator.readOnly = true;

        backButton.innerText = "<-";
        backButton.onclick = advPage;

        page.appendChild(container);

        compute.onclick = function() {
            let fraction1 = fraction(BigInt(operandDenominator.value) * BigInt(operandWholes.value) + BigInt(operandNumerator.value), BigInt(operandDenominator.value)).simplify();
            resultNumerator.value = fraction1.numerator;
            resultDenominator.value = fraction1.denominator;
        }
    }

    async function gcdPage() {
        pageHeader.innerText = "";
        page.innerText = "";
        let backButton = document.createElement("button");
        let pageHeaderText = document.createElement("span");
        let operand1 = document.createElement("input");
        let operand2 = document.createElement("input");
        let result = document.createElement("input");
        let compute = document.createElement("button");
        pageHeader.appendChild(backButton);
        pageHeader.appendChild(pageHeaderText);

        backButton.innerText = "<-";
        pageHeaderText.innerText = await availableAPIs.lookupLocale("CALC_GCD_PAGE");
        compute.innerText = "=";

        operand1.value = 0;
        operand2.value = 0;
        operand1.placeholder = (await availableAPIs.lookupLocale("CALC_OPERAND")).replace("%s", 1);
        operand2.placeholder = (await availableAPIs.lookupLocale("CALC_OPERAND")).replace("%s", 2);
        result.readOnly = true;

        page.insertAdjacentText("beforeend", "gcd(");
        page.appendChild(operand1);
        page.insertAdjacentText("beforeend", ", ");
        page.appendChild(operand2);
        page.insertAdjacentText("beforeend", ") ");
        page.appendChild(compute);
        page.insertAdjacentText("beforeend", " ");
        page.appendChild(result);

        backButton.onclick = advPage;
        compute.onclick = function() {
            result.value = gcd(BigInt(operand1.value), BigInt(operand2.value));
        }
    }

    async function factorialPage() {
        pageHeader.innerText = "";
        page.innerText = "";
        let backButton = document.createElement("button");
        let pageHeaderText = document.createElement("span");
        let operand = document.createElement("input");
        let result = document.createElement("input");
        let compute = document.createElement("button");
        pageHeader.appendChild(backButton);
        pageHeader.appendChild(pageHeaderText);

        backButton.innerText = "<-";
        pageHeaderText.innerText = await availableAPIs.lookupLocale("CALC_FACTORIAL");
        compute.innerText = "=";

        operand.value = 0;
        operand.placeholder = (await availableAPIs.lookupLocale("CALC_OPERAND")).replace("%s", "");
        result.readOnly = true;

        page.appendChild(operand);
        page.insertAdjacentText("beforeend", "! ");
        page.appendChild(compute);
        page.insertAdjacentText("beforeend", " ");
        page.appendChild(result);

        backButton.onclick = advPage;
        compute.onclick = function() {
            let resultValue = 1n;
            for (let i = 1n; i <= BigInt(operand.value); i++) resultValue *= i;
            result.value = resultValue;
        }
    }
})();
addEventListener("signal", async function(e) {
    if (e.detail == 15) await window.availableAPIs.terminate();
}); null;

// Fractions
let gcd = (a, b) => !abs(b) ? abs(a) : gcd(abs(b), abs(a % b));
let abs = (a) => a < 0n ? (a * (-1n)) : a;

function fraction(a, b) {
	if (typeof a !== "bigint") throw new Error("Failed to construct fraction");
	if (typeof b !== "bigint") throw new Error("Failed to construct fraction");
    if (!b) throw new Error("Failed to construct fraction");
	return {
		numerator: a,
		denominator: b,
		getWholes: function() {
			return a / b;
		},
		cleanNumerator: function() {
			return a % b;
		},
		multiply: function(otherFraction) {
			return fraction(otherFraction.numerator * a, otherFraction.denominator * b).simplify();
		},
		divide: function(otherFraction) {
			return fraction(otherFraction.denominator * a, otherFraction.numerator * b).simplify();
		},
		add: function(otherFraction) {
			let cleanOtherFraction = otherFraction.simplify();
			let lcm = (cleanOtherFraction.denominator * b) / gcd(cleanOtherFraction.denominator, b);
			let adaptedNumerator1 = a * (lcm / b);
			let adaptedNumerator2 = cleanOtherFraction.numerator * (lcm / cleanOtherFraction.denominator);
			return fraction(adaptedNumerator1 + adaptedNumerator2, lcm).simplify();
		},
		subtract: function(otherFraction) {
			let cleanOtherFraction = otherFraction.simplify();
			let lcm = (cleanOtherFraction.denominator * b) / gcd(cleanOtherFraction.denominator, b);
			let adaptedNumerator1 = a * (b / lcm);
			let adaptedNumerator2 = cleanOtherFraction.numerator * (lcm / cleanOtherFraction.denominator);
			return fraction(adaptedNumerator1 - adaptedNumerator2, lcm).simplify();
		},
		simplify: function() {
			let commonDiv = gcd(a, b);
			if ((a < 0 && b < 0) || (b < 0 && a > 0)) {
				a = a * (-1);
				b = b * (-1);
			}
			return fraction(a / commonDiv, b / commonDiv);
		}
	}
}