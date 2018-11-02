/*
	Fabio WIP 2018-11-1
	TODO: implement guids for tracking protocol, save one guid per email (& one for null email)
	TODO: implement actual tracking calls
	TODO: save date for preference, save PRIVACY.md digest for preference, re-alert if PRIVACY.md changes, link to github history
	TODO: move fs interactions from index.js, into this module
	TODO: tests
	*/

const crypto = require('crypto');

exports = module.exports = async function({
	prefs = {},
	gaPropertyId,
	https = require('https'),
	process = process
}){
	let valid=false, enabled=false, save=false, userHash, licenseKey;

	prefs = {
		"reporting":prefs["reporting"],
		"report-user":prefs["report-user"]||guid(),
		"report-license-key":prefs["report-license-key"],
		"report-email": prefs["report-email"],
	};
	if(prefs.reporting && prefs.reporting.toLowerCase){
		let match = prefs.reporting.toLowerCase().match(/^(save-)?(yes|no)$/i)||[]
		valid = !!match[0]
		save = !!match[1]
		enabled = match[2]==='yes'
	}
	if(prefs["report-user"] && prefs["report-user"].match(/^[a-fA-F0-9]{64}$/)){
		userHash = prefs["report-user"];
	}
	if(prefs["report-user"] && prefs["report-user"].match(/[^@\/]+@[^@\/]+/)){
		userHash = crypto.createHash('sha256').update(prefs["report-user"].trim().toLowerCase(), 'utf8').digest();
	}
	licenseKey = (prefs["report-license-key"]||'').trim().toUpperCase()
	return {
		valid,
		enabled,
		save,
		prefString:JSON.stringify(prefs),
		track: ({messages,errors})=>{
			if(!valid){throw "Invalid tracking state"}
			if(!enabled){return}
			//CONTINUE HERE..
			console.warn("TODO:track")
		}
	};
	//GUID function per https://stackoverflow.com/a/2117523
	function guid(){

	}
	function request({
		method,
		hostname,
		port,
		path,
		query = {},
		headers,
		body
	}){
		let bodyString = JSON.stringify(body);
		return new Promise((res,rej)=>{
			let requestConfig = {
				method,
				hostname,
				...(port?{port}:{}),
				path: path
					+ (path.includes("?")?"&":"?")
					+ Object.entries(query).map(([k,v])=>encodeURIComponent(k)+"="+encodeURIComponent(v)).join("&")
					,
				headers:{
					...headers,
					"Content-Type": "application/json",
					"Content-Length": Buffer.byteLength(bodyString)
				}
			};
			let req = https.request(requestConfig,resp=>{
				let data = '';
				resp.on('data', (chunk) => {data+=chunk;})
				resp.on("error", err => {rej(err.message)})
				resp.on('end', () => {
					try{res(peek({
						...res,
						...(data?{body: JSON.parse(data)}:{})
						}))}
					catch(e){rej(e)}
					})
			});
			//Note: Cloud Functions seems to smartly interpret various body content types & convert to a unified representation
			// But, we don't need to reproduce all those original bodies, since looker only cares about JSON bodies
			if(body!==undefined){req.write(bodyString)}
			req.end()
		});
	}
}
