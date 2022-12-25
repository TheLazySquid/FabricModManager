import { getConfigValue } from "./config.js";
import { Mod } from "./mod.js";
import fs from 'fs';

export function loadMods(){
	let mods = getConfigValue("mods");
	let modList = [];
	for(let mod of mods){
		let newMod = new Mod(mod.site, mod.slug, mod.id, mod.title);
		
		newMod.versions = mod.versions;
		newMod.activeVersionIndex = mod.activeVersionIndex;
		newMod.disabled = mod.disabled;

		modList.push(newMod);
	}
	return modList;
}

export function confirmUnusedExists(){
	let modDir = getConfigValue("modDir");
	fs.existsSync(modDir + "\\fmm_unused") || fs.mkdirSync(modDir + "\\fmm_unused");
}