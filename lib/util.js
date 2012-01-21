/*
Watchmen, and HTTP monitor for node.js

Copyright (c) 2011 Ivan Loire (twitter: @ivanloire) www.iloire.com

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

*/
var ONE_HOUR_MS = 1000 * 60 * 60
var ONE_DAY_MS = ONE_HOUR_MS * 24

function round (val){ return (val<10) ? val = '0' + val : val; }

function extraTimeInfo (ndate){
	if (!ndate) return "";
	var date = new Date(parseFloat(ndate))
	
	var diff = new Date(Math.abs(new Date()-date));
	var strInfo = "";

	if (diff > ONE_DAY_MS){
		strInfo = date.getDate() + "/" + (date.getMonth() + 1) + "/" + date.getFullYear() + " "
	}

	var str = date.toISOString();
	var hours = date.getHours();
	var min = date.getMinutes();
	var sec = "";

	min = ':' + round (min);
	if (diff < ONE_HOUR_MS){
		sec = ':' + round (date.getSeconds());
	}
	
	return strInfo + hours + min + sec
}
exports.extraTimeInfo = extraTimeInfo;