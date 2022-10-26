import fs from 'fs';

const configFile = "fmmconfig.json";

export function setConfigValue(value){
	const config = fs.readFileSync(configFile, 'utf8') || "{}";
	var configJson = JSON.parse(config);
	configJson = {...configJson, ...value};
	// save the config
	fs.writeFileSync(configFile, JSON.stringify(configJson));
}

export function getConfigValue(key){
	const config = fs.readFileSync(configFile, 'utf8') || "{}";
	var configJson = JSON.parse(config);
	return configJson[key];
}