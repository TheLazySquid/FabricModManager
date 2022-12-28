import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join} from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const configFile = join(__dirname, "../") + "\\fmmconfig.json";

const defaultConfigValues = {
	loader: "fabric"
}

let configSave = null;

export function getConfig(){
	if(configSave) return configSave;
	if(!fs.existsSync(configFile)) return {};
	const config = fs.readFileSync(configFile, 'utf8') || "{}";
	configSave = JSON.parse(config);
	return configSave;
}

export function getConfigValue(key){
	let config = getConfig();	
	return config[key] ?? (defaultConfigValues[key] ?? null);
}

export function setConfigValue(key, value){
	let config = getConfig();
	config[key] = value;
	fs.writeFileSync(configFile, JSON.stringify(config, null, 4));
}

export function updateMod(mod){
	var mods = getConfigValue("mods");
	if(!mods) mods = [];

	// check if the mod is already in the config
	let modIndex = mods.findIndex((m) => m.id == mod.id);
	if(modIndex != -1){
		// overwrite the mod
		mods[modIndex] = mod;
	}else{
		// add the mod
		mods.push(mod);
	}

	// save the mods
	setConfigValue("mods", mods);
}

export function setAPIKey(site, key){
	var keys = getConfigValue("keys");
	if(!keys) keys = {};

	keys[site] = key;
	setConfigValue("keys", keys);

	console.log(chalk.green(`${site} API key successfully updated`))
}

export function getAPIKey(site){
	var keys = getConfigValue("keys");
	if(!keys) keys = {};

	return keys[site] ?? null;
}