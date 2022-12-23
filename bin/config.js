import fs from 'fs';
import { getFabricVersions } from './files.js';
import { fileURLToPath } from 'url';
import { dirname, join} from 'path';

const configFile = join(dirname(fileURLToPath(import.meta.url)), "../") + "\\fmmconfig.json";
if(!fs.existsSync(configFile)) fs.writeFileSync(configFile, "{}");

export function setConfigValue(value){
	const config = fs.readFileSync(configFile, 'utf8') || "{}";
	var configJson = JSON.parse(config);
	configJson = {...configJson, ...value};
	// save the config
	fs.writeFileSync(configFile, JSON.stringify(configJson, null, 4));
}

export function getConfigValue(key){
	const config = fs.readFileSync(configFile, 'utf8') || "{}";
	var configJson = JSON.parse(config, null, 4);

	// if the requested key doesn't exist, fall back to defaults
	if(configJson[key] == null){
		switch(key){
			case "modDir":
				return `${process.env.APPDATA}\\.minecraft\\mods`;
			case "fabricVersion":
				let versions = getFabricVersions();
				return versions[versions.length - 1];
			case "mods":
				return [];
			default:
				return null;
		}
	}

	return configJson[key];
}

export function addMod(modID, version, fileName, modName, modSlug, modsObject){
	const config = fs.readFileSync(configFile, 'utf8') || "{}";
	var configJson = JSON.parse(config);
	if(!configJson.mods) configJson.mods = [];
	let modIndex = configJson.mods.findIndex(m => m.modID == modID);
	if(modIndex != -1){
		configJson.mods[modIndex].version = version;
		configJson.mods[modIndex].fileName = fileName;
	}else{
		configJson.mods.push({modID, version, fileName, modName, modSlug});
	}
	// save the config
	if(modsObject) modsObject = configJson.mods;
	fs.writeFileSync(configFile, JSON.stringify(configJson, null, 4));
}