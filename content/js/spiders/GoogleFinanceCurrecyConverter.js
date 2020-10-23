/**
 * Class for use the google finance currency converter
 */
GoogleFinanceCurrencyConverter = new Class(
		{
			Extends : Spider,

			from : "USD",
			to : "USD",
			_domain :"google.com",
			_url : "http://www.google.com",	
			_type:"Currency",

			/**
			 * the value of the currency
			 */
			value : 0,

			_queryUrl : function() {
				this.parent();

				return this._url + "/finance/converter?a=1&from="
						+ this.from + "&to=" + this.to;
			},

			read : function(e) {
				var RetVal = 0;

				try {
					RetVal = window.frames[this._idFrame].document
							.evaluate(
									"/html/body/div/form/table/tbody/tr[3]/td/table/tbody/tr/td/span",
									window.frames[this._idFrame].document,
									null, XPathResult.ANY_TYPE, null)
							.iterateNext().textContent.match("[0-9\.]*")[0];
					RetVal = eval(RetVal);

					this.value = RetVal;
					

					this.onComplete();

					return true;
				} catch (e) {
					return false;
				}
			}
			
		});
